const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NearbyPlace = {
  id: string;
  name: string;
  type: string;
  category?: string;
  address?: string;
  latitude: number;
  longitude: number;
  distance: number;
  rating?: number | null;
  userRatingCount?: number;
  googleMapsUri?: string;
  openNow?: boolean | null;
  description?: string;
  tags?: Record<string, unknown>;
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

    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function cleanPlacesForAI(places: NearbyPlace[]) {
  return places.slice(0, 15).map((place) => ({
    id: place.id,
    name: place.name,
    type: place.type,
    category: place.category,
    address: place.address,
    distance: place.distance,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    openNow: place.openNow,
    googleMapsUri: place.googleMapsUri,
    description: place.description,
    tags: place.tags,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  try {
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const openAiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    if (!openAiKey) {
      return jsonResponse(
        { ok: false, error: "OPENAI_API_KEY is missing." },
        500
      );
    }

    const body = await req.json();

    const category = String(body.category ?? "places");
    const userNeed = String(body.userNeed ?? "").trim();
    const location = body.location;
    const places = (body.places ?? []) as NearbyPlace[];

    if (!location?.latitude || !location?.longitude) {
      return jsonResponse(
        { ok: false, error: "Location is required." },
        400
      );
    }

    if (!Array.isArray(places) || places.length === 0) {
      return jsonResponse({
        ok: false,
        error: "No real places were provided for AI ranking.",
        answer:
          "I could not recommend places because there are no real map results available yet.",
        rankedPlaceIds: [],
        highlights: [],
        suggestions: [
          "Enable live location first.",
          "Try another category such as cafes, restaurants, attractions or museums.",
        ],
      });
    }

    const safePlaces = cleanPlacesForAI(places);

    const prompt = `
You are TripNest AI, an AI travel recommendation assistant.

Important rules:
- Recommend ONLY from the real places provided in the JSON list.
- Do NOT invent places.
- Do NOT create fake addresses.
- Do NOT change place names.
- Use the place IDs exactly as provided.
- Rank places based on user need, distance, rating, number of reviews, category, open status, and travel usefulness.
- Answer in the same language as the user's request when possible.

User current location:
${JSON.stringify(location, null, 2)}

Selected category:
${category}

User request:
${userNeed || "Recommend the best nearby places from this category."}

Real nearby places from Google Places:
${JSON.stringify(safePlaces, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "answer": "string",
  "rankedPlaceIds": ["place-id-1", "place-id-2", "place-id-3"],
  "highlights": [
    {
      "placeId": "place-id",
      "reason": "why this real place is recommended",
      "bestFor": "quiet coffee / food / photos / museum / quick visit / etc"
    }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}
`;

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
            content: [
              {
                type: "input_text",
                text: prompt,
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    const openAiJson = await openAiResponse.json();

    if (!openAiResponse.ok) {
      return jsonResponse(
        {
          ok: false,
          error:
            openAiJson?.error?.message ||
            "OpenAI could not generate recommendations.",
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
        rankedPlaceIds: [],
        highlights: [],
        suggestions: [],
      });
    }

    const validPlaceIds = new Set(safePlaces.map((place) => place.id));

    const rankedPlaceIds = Array.isArray(parsed.rankedPlaceIds)
      ? parsed.rankedPlaceIds.filter((id: string) => validPlaceIds.has(id))
      : [];

    const highlights = Array.isArray(parsed.highlights)
      ? parsed.highlights.filter((highlight: any) =>
          validPlaceIds.has(highlight.placeId)
        )
      : [];

    return jsonResponse({
      ok: true,
      answer: parsed.answer ?? "AI recommendation generated.",
      rankedPlaceIds,
      highlights,
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions
        : [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return jsonResponse({ ok: false, error: message }, 500);
  }
});