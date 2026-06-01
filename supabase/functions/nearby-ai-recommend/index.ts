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
  latitude: number;
  longitude: number;
  distance: number;
  description: string;
  tags: Record<string, string>;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const openAiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    if (!openAiKey) {
      return jsonResponse({ error: "OPENAI_API_KEY is missing." }, 500);
    }

    const body = await req.json();

    const category = String(body.category ?? "places");
    const userNeed = String(body.userNeed ?? "").trim();
    const location = body.location;
    const places = (body.places ?? []) as NearbyPlace[];

    if (!location?.latitude || !location?.longitude) {
      return jsonResponse({ error: "Location is required." }, 400);
    }

    if (!Array.isArray(places) || places.length === 0) {
      return jsonResponse({
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

    const instruction = `
You are an AI travel recommendation assistant.

You receive real nearby places from map data. 
You must NOT invent new places.
You must only recommend places from the provided list.
You should rank the best places based on:
- user need
- distance
- category
- tags
- place type
- usefulness for travel
- usefulness for content/photos
- food/coffee/tourism relevance

Answer in the same language as the user's request when possible.

Return ONLY valid JSON in this exact format:
{
  "answer": "string",
  "rankedPlaceIds": ["place-id-1", "place-id-2"],
  "highlights": [
    {
      "placeId": "place-id",
      "reason": "why this place is recommended",
      "bestFor": "coffee break / food / photos / museum / quick visit / etc"
    }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}
`;

    const prompt = `
${instruction}

User current location:
${JSON.stringify(location, null, 2)}

Selected category:
${category}

User request:
${userNeed || "Recommend the best nearby places from this category."}

Real nearby places from map data:
${JSON.stringify(places, null, 2)}
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
      }),
    });

    const openAiJson = await openAiResponse.json();

    if (!openAiResponse.ok) {
      return jsonResponse(
        {
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
        answer: outputText || "AI generated an empty response.",
        rankedPlaceIds: [],
        highlights: [],
        suggestions: [],
      });
    }

    return jsonResponse({
      answer: parsed.answer ?? "AI recommendation generated.",
      rankedPlaceIds: Array.isArray(parsed.rankedPlaceIds)
        ? parsed.rankedPlaceIds
        : [],
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions
        : [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return jsonResponse({ error: message }, 500);
  }
});