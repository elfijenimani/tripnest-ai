import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Trip = {
  id: string;
  user_id: string;
  title: string;
  country: string;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
  mood: string | null;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
};

type TripMedia = {
  id: string;
  file_name: string;
  file_type: "image" | "video" | "file";
  mime_type: string | null;
  size_bytes: number | null;
  ai_caption: string | null;
  ai_mood: string | null;
  created_at: string;
};

type AIResponse = {
  emotionalTitle: string;
  shortSummary: string;
  travelStory: string;
  detectedMood: string;
  suggestedFolders: string[];
  generatedCaptions: string[];
  memoryKeywords: string[];
  nextIdeas: string[];
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

function extractOpenAIText(data: any) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const output = data.output ?? [];

  const text = output
    .flatMap((item: any) => item.content ?? [])
    .map((content: any) => content.text ?? "")
    .join("\n")
    .trim();

  return text;
}

function buildPrompt(input: {
  trip: Trip;
  media: TripMedia[];
}) {
  const { trip, media } = input;

  const imageCount = media.filter((item) => item.file_type === "image").length;
  const videoCount = media.filter((item) => item.file_type === "video").length;

  return `
You are TripNest AI, a premium travel memory assistant.

Your job:
Generate a beautiful, personal, useful AI memory package for this trip.

Return ONLY valid JSON with this exact structure:
{
  "emotionalTitle": "string",
  "shortSummary": "string",
  "travelStory": "string",
  "detectedMood": "string",
  "suggestedFolders": ["string"],
  "generatedCaptions": ["string"],
  "memoryKeywords": ["string"],
  "nextIdeas": ["string"]
}

Rules:
- Do not invent private facts.
- Use only the provided trip data.
- Keep the tone warm, modern, emotional, and travel-focused.
- Captions should be useful for Instagram or a travel journal.
- Suggested folders should help organize photos/videos.
- nextIdeas should suggest what the user can add next.
- Return JSON only. No markdown.

Trip data:
Title: ${trip.title}
Country: ${trip.country}
City: ${trip.city ?? "Not provided"}
Date range: ${trip.start_date ?? "Unknown"} to ${trip.end_date ?? "Unknown"}
Mood: ${trip.mood ?? "Not provided"}
Description: ${trip.description ?? "No description provided"}
Media count:
- Images: ${imageCount}
- Videos: ${videoCount}

Media filenames:
${media.map((item) => `- ${item.file_type}: ${item.file_name}`).join("\n")}
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405
    );
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-5.5";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!openaiApiKey) {
      return jsonResponse(
        {
          error: "OPENAI_API_KEY is missing in Supabase secrets.",
        },
        500
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        {
          error: "Supabase environment variables are missing.",
        },
        500
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        {
          error: "Missing Authorization header.",
        },
        401
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
        {
          error: "Unauthorized user.",
        },
        401
      );
    }

    const body = await req.json();
    const tripId = String(body.tripId ?? "");

    if (!tripId) {
      return jsonResponse(
        {
          error: "tripId is required.",
        },
        400
      );
    }

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (tripError || !trip) {
      return jsonResponse(
        {
          error: tripError?.message ?? "Trip not found.",
        },
        404
      );
    }

    const { data: media, error: mediaError } = await supabase
      .from("trip_media")
      .select(
        "id, file_name, file_type, mime_type, size_bytes, ai_caption, ai_mood, created_at"
      )
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (mediaError) {
      return jsonResponse(
        {
          error: mediaError.message,
        },
        500
      );
    }

    const prompt = buildPrompt({
      trip: trip as Trip,
      media: (media ?? []) as TripMedia[],
    });

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openaiModel,
        input: [
          {
            role: "system",
            content:
              "You are TripNest AI. You generate structured travel memory insights as valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return jsonResponse(
        {
          error:
            openaiData?.error?.message ??
            "OpenAI request failed. Check model, billing, or API key.",
        },
        openaiResponse.status
      );
    }

    const rawText = extractOpenAIText(openaiData);

    let parsed: AIResponse;

    try {
      parsed = JSON.parse(rawText) as AIResponse;
    } catch {
      return jsonResponse(
        {
          error: "OpenAI returned invalid JSON.",
          rawText,
        },
        500
      );
    }

    return jsonResponse({
      result: parsed,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      500
    );
  }
});