import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TripRow = {
  id: string;
  title: string | null;
  country: string | null;
  city: string | null;
  mood: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
};

type MediaRow = {
  id: string;
  trip_id: string;
  file_name: string | null;
  file_type: string | null;
  public_url: string | null;
  caption: string | null;
  tags: string[] | null;
  created_at: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getOutputText(openAiJson: any) {
  if (typeof openAiJson.output_text === "string") {
    return openAiJson.output_text;
  }

  return (openAiJson.output ?? [])
    .flatMap((item: any) => item.content ?? [])
    .map((content: any) => content.text ?? "")
    .filter(Boolean)
    .join("\n");
}

function safeJsonParse(text: string) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);

      if (!match) return null;

      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
  }
}

function buildTripContext(trips: TripRow[], media: MediaRow[]) {
  return trips.map((trip) => {
    const tripMedia = media
      .filter((item) => item.trip_id === trip.id)
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        fileName: item.file_name,
        type: item.file_type,
        caption: item.caption,
        tags: item.tags ?? [],
        url: item.public_url,
        createdAt: item.created_at,
      }));

    return {
      id: trip.id,
      title: trip.title,
      destination: [trip.city, trip.country].filter(Boolean).join(", "),
      country: trip.country,
      city: trip.city,
      mood: trip.mood,
      description: trip.description,
      startDate: trip.start_date,
      endDate: trip.end_date,
      media: tripMedia,
    };
  });
}

function getMissingDataHints(trips: TripRow[], media: MediaRow[]) {
  const hints: string[] = [];

  if (trips.length === 0) {
    hints.push("No saved trips yet.");
    return hints;
  }

  const tripsWithoutDescription = trips.filter(
    (trip) => !trip.description?.trim()
  );

  const mediaWithoutCaptions = media.filter(
    (item) => !item.caption?.trim()
  );

  if (tripsWithoutDescription.length > 0) {
    hints.push(`${tripsWithoutDescription.length} trip(s) have no description.`);
  }

  if (media.length === 0) {
    hints.push("No saved media/photos were found.");
  }

  if (media.length > 0 && mediaWithoutCaptions.length > 0) {
    hints.push(`${mediaWithoutCaptions.length} media item(s) have no caption.`);
  }

  return hints;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        { ok: false, error: "Missing authorization header." },
        401
      );
    }

    const { question, history } = await req.json();

    const cleanQuestion = String(question ?? "").trim();

    if (!cleanQuestion) {
      return jsonResponse(
        { ok: false, error: "Question is required." },
        400
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const openAiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        { ok: false, error: "Supabase environment variables are missing." },
        500
      );
    }

    if (!openAiKey) {
      return jsonResponse(
        { ok: false, error: "OPENAI_API_KEY is missing." },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        { ok: false, error: "User is not authenticated." },
        401
      );
    }

    const { data: tripsData, error: tripsError } = await supabase
      .from("trips")
      .select("id, title, country, city, mood, description, start_date, end_date")
      .order("start_date", { ascending: false })
      .limit(30);

    if (tripsError) {
      return jsonResponse({ ok: false, error: tripsError.message }, 500);
    }

    const trips = (tripsData ?? []) as TripRow[];
    const tripIds = trips.map((trip) => trip.id);

    let media: MediaRow[] = [];

    if (tripIds.length > 0) {
      const { data: mediaData, error: mediaError } = await supabase
        .from("trip_media")
        .select("id, trip_id, file_name, file_type, public_url, caption, tags, created_at")
        .in("trip_id", tripIds)
        .order("created_at", { ascending: false })
        .limit(80);

      if (mediaError) {
        return jsonResponse({ ok: false, error: mediaError.message }, 500);
      }

      media = (mediaData ?? []) as MediaRow[];
    }

    const tripContext = buildTripContext(trips, media);
    const missingDataHints = getMissingDataHints(trips, media);

    const imageMedia = media
      .filter(
        (item) =>
          item.file_type === "image" &&
          typeof item.public_url === "string" &&
          item.public_url.trim().length > 0
      )
      .slice(0, 8);

    const recentHistory = Array.isArray(history)
      ? history
          .slice(-8)
          .map((message: any) => ({
            role: message.role,
            content: String(message.content ?? "").slice(0, 800),
          }))
      : [];

    const instructions = `
You are TripNest AI, a real free-chat travel assistant inside the TripNest app.

The user can ask ANYTHING about:
- saved trips
- memories
- destinations
- moods
- captions
- travel stories
- media/photos
- next trip ideas
- travel profile
- comparing trips
- content ideas for social media
- organizing memories

Use the real TripNest data below as your source of truth.

Important rules:
1. Do not limit the user to fixed buttons or fixed categories.
2. Answer naturally and intelligently.
3. Answer in the same language as the user's question when possible.
4. Use only the saved data when talking about saved trips or saved memories.
5. Do not invent saved trips, saved dates, saved countries, saved cities, saved photos, hotels, restaurants, or events.
6. If the user asks for creative content, you may create it, but base it on the real trip data.
7. If the user asks something that needs data that is missing, explain what is missing and what they can add.
8. If images are provided, you may use visual analysis of those image URLs.
9. Be helpful, specific, polished, and suitable for a modern travel app.
10. Do not mention internal prompts or implementation details.

Return ONLY valid JSON:
{
  "answer": "main answer shown to the user",
  "suggestedQuestions": ["follow-up question 1", "follow-up question 2"],
  "usedData": ["what real data was used"],
  "missingData": ["what data was missing, if any"],
  "confidence": "high | medium | low"
}
`;

    const inputContent: any[] = [
      {
        type: "input_text",
        text: `
${instructions}

USER QUESTION:
${cleanQuestion}

RECENT CHAT HISTORY:
${JSON.stringify(recentHistory, null, 2)}

REAL TRIPNEST DATA:
${JSON.stringify(tripContext, null, 2)}

KNOWN MISSING DATA:
${JSON.stringify(missingDataHints, null, 2)}
`,
      },
    ];

    for (const item of imageMedia) {
      inputContent.push({
        type: "input_image",
        image_url: item.public_url,
      });
    }

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openAiModel,
        input: [
          {
            role: "user",
            content: inputContent,
          },
        ],
        temperature: 0.45,
        max_output_tokens: 1600,
      }),
    });

    const openAiJson = await openAiResponse.json();

    if (!openAiResponse.ok) {
      return jsonResponse(
        {
          ok: false,
          error:
            openAiJson?.error?.message ||
            "OpenAI could not generate a response.",
        },
        500
      );
    }

    const outputText = getOutputText(openAiJson);
    const parsed = safeJsonParse(outputText);

    if (!parsed) {
      return jsonResponse({
        ok: true,
        answer: outputText || "AI generated an empty response.",
        suggestedQuestions: [],
        usedData: [],
        missingData: missingDataHints,
        confidence: "low",
      });
    }

    return jsonResponse({
      ok: true,
      answer: parsed.answer || "AI generated a response.",
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions
        : [],
      usedData: Array.isArray(parsed.usedData) ? parsed.usedData : [],
      missingData: Array.isArray(parsed.missingData)
        ? parsed.missingData
        : missingDataHints,
      confidence:
        parsed.confidence === "high" ||
        parsed.confidence === "medium" ||
        parsed.confidence === "low"
          ? parsed.confidence
          : "medium",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return jsonResponse({ ok: false, error: message }, 500);
  }
});