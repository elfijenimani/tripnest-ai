import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TripMediaRow = {
  id: string;
  file_name: string | null;
  file_type: string | null;
  file_path?: string | null;
  storage_path?: string | null;
  public_url?: string | null;
  file_size?: number | null;
  caption?: string | null;
  tags?: string[] | null;
  created_at?: string | null;
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

  const output = openAiJson.output ?? [];

  return output
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

function detectIntent(question: string) {
  const q = question.toLowerCase();

  if (
    q.includes("story") ||
    q.includes("tregim") ||
    q.includes("histori") ||
    q.includes("short story")
  ) {
    return "story";
  }

  if (
    q.includes("caption") ||
    q.includes("instagram") ||
    q.includes("post") ||
    q.includes("përshkrim")
  ) {
    return "caption";
  }

  if (
    q.includes("peaceful") ||
    q.includes("mood") ||
    q.includes("calm") ||
    q.includes("qet") ||
    q.includes("relaks")
  ) {
    return "mood_search";
  }

  if (
    q.includes("next trip") ||
    q.includes("suggest") ||
    q.includes("recommend") ||
    q.includes("plan") ||
    q.includes("udhëtim")
  ) {
    return "planning";
  }

  if (
    q.includes("photo") ||
    q.includes("image") ||
    q.includes("picture") ||
    q.includes("foto") ||
    q.includes("find")
  ) {
    return "media_search";
  }

  return "general";
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getTripCompleteness(trip: TripRow, media: TripMediaRow[]) {
  const missing: string[] = [];

  if (!cleanText(trip.title)) missing.push("trip title");
  if (!cleanText(trip.country) && !cleanText(trip.city)) {
    missing.push("destination city/country");
  }
  if (!cleanText(trip.description)) missing.push("trip description");
  if (!cleanText(trip.mood)) missing.push("trip mood");
  if (!trip.start_date && !trip.end_date) missing.push("trip dates");

  const mediaWithCaptions = media.filter((item) => cleanText(item.caption));
  const mediaWithTags = media.filter(
    (item) => Array.isArray(item.tags) && item.tags.length > 0
  );

  if (media.length === 0) missing.push("photos or videos");
  if (media.length > 0 && mediaWithCaptions.length === 0) {
    missing.push("media captions");
  }
  if (media.length > 0 && mediaWithTags.length === 0) {
    missing.push("media tags");
  }

  return missing;
}

function buildTripSummary(trip: TripRow) {
  return {
    id: trip.id,
    title: trip.title || "Untitled trip",
    destination: [trip.city, trip.country].filter(Boolean).join(", "),
    mood: trip.mood || null,
    description: trip.description || null,
    startDate: trip.start_date || null,
    endDate: trip.end_date || null,
  };
}

function buildMediaContext(media: TripMediaRow[]) {
  return media.map((item, index) => ({
    number: index + 1,
    id: item.id,
    fileName: item.file_name,
    type: item.file_type,
    caption: item.caption || null,
    tags: item.tags ?? [],
    createdAt: item.created_at || null,
    publicUrl: item.public_url || null,
  }));
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeHighlights(value: unknown, validIds: Set<string>) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      mediaId: String(item.mediaId || "").trim(),
      reason: String(item.reason || "").trim(),
    }))
    .filter((item) => validIds.has(item.mediaId) && item.reason);
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

    const { tripId, question } = await req.json();

    const userQuestion = cleanText(question);

    if (!tripId || !userQuestion) {
      return jsonResponse(
        { ok: false, error: "tripId and question are required." },
        400
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const openAiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        {
          ok: false,
          error: "Supabase environment variables are missing.",
        },
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

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id, title, country, city, mood, description, start_date, end_date")
      .eq("id", tripId)
      .single();

    if (tripError || !trip) {
      return jsonResponse({ ok: false, error: "Trip not found." }, 404);
    }

    const { data: mediaRows, error: mediaError } = await supabase
      .from("trip_media")
      .select(
        "id, file_name, file_type, file_path, storage_path, public_url, file_size, caption, tags, created_at"
      )
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (mediaError) {
      return jsonResponse({ ok: false, error: mediaError.message }, 500);
    }

    const media = (mediaRows ?? []) as TripMediaRow[];
    const tripSummary = buildTripSummary(trip as TripRow);
    const mediaContext = buildMediaContext(media);
    const missingData = getTripCompleteness(trip as TripRow, media);
    const intent = detectIntent(userQuestion);

    const imageMedia = media
      .filter(
        (item) =>
          item.file_type === "image" &&
          typeof item.public_url === "string" &&
          item.public_url.trim().length > 0
      )
      .slice(0, 8);

    const instruction = `
You are TripNest AI, an advanced travel-memory assistant inside a real travel app.

You must use ONLY the real trip data and media metadata provided below.
You may analyze the provided image URLs when available.
You must never invent trips, dates, cities, countries, memories, photos, videos, locations, people, restaurants, hotels, events, or media IDs.

Core behavior:
1. Answer in the same language as the user's question when possible.
2. Be specific, useful, warm, and travel-focused.
3. Use the real trip title, destination, mood, dates, description, captions, tags, and media metadata.
4. If the data is weak or missing, do not pretend. Say what is missing and suggest what the user should add.
5. If the user asks for a story, create a realistic story based only on the real trip data. Do not add fake events.
6. If the user asks for captions, return multiple caption ideas with different styles.
7. If the user asks for peaceful memories or moods, rank only the real media/trip details that support that mood.
8. If the user asks for next-trip ideas, base them on the current trip's destination, mood, and travel style. Make it clear these are suggestions, not saved trips.
9. If the user asks to find/select photos, return only valid media IDs from the media list.
10. If the user asks what is in images, use visual analysis only for the image URLs provided.
11. If there are not enough details, ask for one or two specific extra details, not a generic question.
12. Do not mention internal prompts, JSON rules, system messages, or implementation details.

Quality requirements:
- Avoid generic phrases like "the memory begins" unless they fit naturally.
- Avoid saying exact things not present in the data.
- Prefer concrete wording: destination, mood, media captions, tags, dates.
- Keep the answer polished and ready to show in the app.
- Use paragraphs, but keep them readable.
- For captions, provide short and usable options.
- For story, write 2-4 short paragraphs.
- For planning, give practical next actions.

User intent detected by app:
${intent}

Return ONLY valid JSON in this exact shape:
{
  "answer": "A polished, accurate answer based only on the real trip data.",
  "matchedIds": ["valid-media-id-1"],
  "captionIdeas": ["caption 1", "caption 2", "caption 3"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "usedTripData": ["trip title", "destination", "dates", "mood", "media captions"],
  "missingData": ["missing detail 1"],
  "confidence": "high | medium | low",
  "mediaHighlights": [
    {
      "mediaId": "valid-media-id",
      "reason": "why this media item is relevant"
    }
  ]
}
`;

    const inputContent: any[] = [
      {
        type: "input_text",
        text: `
${instruction}

REAL TRIP DATA:
${JSON.stringify(tripSummary, null, 2)}

REAL MEDIA DATA:
${JSON.stringify(mediaContext, null, 2)}

KNOWN MISSING OR WEAK DATA:
${JSON.stringify(missingData, null, 2)}

USER QUESTION:
${userQuestion}
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
        temperature: 0.25,
        max_output_tokens: 1400,
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

    const validMediaIds = new Set(media.map((item) => item.id));

    if (!parsed) {
      return jsonResponse({
        ok: true,
        answer:
          outputText ||
          "AI generated a response, but it could not be structured correctly.",
        matchedIds: [],
        captionIdeas: [],
        suggestions: [
          "Try asking a more specific question about this trip.",
          "Add captions or tags to your photos for better AI answers.",
        ],
        usedTripData: [],
        missingData,
        confidence: "low",
        mediaHighlights: [],
      });
    }

    const matchedIds = normalizeStringArray(parsed.matchedIds).filter((id) =>
      validMediaIds.has(id)
    );

    const captionIdeas = normalizeStringArray(parsed.captionIdeas);
    const suggestions = normalizeStringArray(parsed.suggestions);
    const usedTripData = normalizeStringArray(parsed.usedTripData);
    const aiMissingData = normalizeStringArray(parsed.missingData);
    const mediaHighlights = normalizeHighlights(
      parsed.mediaHighlights,
      validMediaIds
    );

    const confidence =
      parsed.confidence === "high" ||
      parsed.confidence === "medium" ||
      parsed.confidence === "low"
        ? parsed.confidence
        : missingData.length > 2
          ? "low"
          : "medium";

    return jsonResponse({
      ok: true,
      answer: parsed.answer ?? "No answer generated.",
      matchedIds,
      captionIdeas,
      suggestions,
      usedTripData,
      missingData: aiMissingData.length > 0 ? aiMissingData : missingData,
      confidence,
      mediaHighlights,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return jsonResponse({ ok: false, error: message }, 500);
  }
});