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
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const { tripId, question } = await req.json();

    if (!tripId || !question?.trim()) {
      return jsonResponse(
        { error: "tripId and question are required." },
        400
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const openAiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        { error: "Supabase environment variables are missing." },
        500
      );
    }

    if (!openAiKey) {
      return jsonResponse({ error: "OPENAI_API_KEY is missing." }, 500);
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
      return jsonResponse({ error: "User is not authenticated." }, 401);
    }

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id, title, country, city, mood, description, start_date, end_date")
      .eq("id", tripId)
      .single();

    if (tripError || !trip) {
      return jsonResponse({ error: "Trip not found." }, 404);
    }

    const { data: mediaRows, error: mediaError } = await supabase
      .from("trip_media")
      .select(
        "id, file_name, file_type, file_path, storage_path, public_url, file_size, caption, tags, created_at"
      )
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (mediaError) {
      return jsonResponse({ error: mediaError.message }, 500);
    }

    const media = (mediaRows ?? []) as TripMediaRow[];

    const imageMedia = media
      .filter((item) => item.file_type === "image" && item.public_url)
      .slice(0, 8);

    const mediaContext = media.map((item, index) => {
      return {
        number: index + 1,
        id: item.id,
        name: item.file_name,
        type: item.file_type,
        caption: item.caption,
        tags: item.tags ?? [],
        url: item.public_url,
      };
    });

    const instruction = `
You are TripNest AI, a real AI assistant inside a travel memory folder.

The user can ask anything about the trip, photos, videos, captions, content ideas, organization, recommendations, or visual analysis.

You must answer naturally in the same language as the user's question when possible.

You have:
1. Trip information
2. Media metadata
3. Image URLs for visual analysis

Important:
- If the user asks to find/select photos, return the best matching media IDs.
- If the user asks for captions, generate useful captions.
- If the user asks what is inside images, use vision analysis.
- If videos are included, analyze based on name, tags, and caption unless frame images are provided.
- Do not invent media IDs. Use only IDs from the provided media list.

Return ONLY valid JSON in this exact shape:
{
  "answer": "string",
  "matchedIds": ["media-id-1"],
  "captionIdeas": ["caption 1", "caption 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}
`;

    const inputContent: any[] = [
      {
        type: "input_text",
        text: `
${instruction}

Trip:
${JSON.stringify(trip, null, 2)}

Media list:
${JSON.stringify(mediaContext, null, 2)}

User question:
${question}
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
      }),
    });

    const openAiJson = await openAiResponse.json();

    if (!openAiResponse.ok) {
      return jsonResponse(
        {
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
        answer: outputText || "AI generated an empty response.",
        matchedIds: [],
        captionIdeas: [],
        suggestions: [],
      });
    }

    return jsonResponse({
      answer: parsed.answer ?? "No answer generated.",
      matchedIds: Array.isArray(parsed.matchedIds) ? parsed.matchedIds : [],
      captionIdeas: Array.isArray(parsed.captionIdeas)
        ? parsed.captionIdeas
        : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return jsonResponse({ error: message }, 500);
  }
});