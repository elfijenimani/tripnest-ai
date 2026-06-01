import { supabase } from "@/lib/supabase";

export type NearbyPlaceForAI = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  distance: number;
  description: string;
  tags: Record<string, string>;
};

export type NearbyAIHighlight = {
  placeId: string;
  reason: string;
  bestFor: string;
};

export type NearbyAIResponse = {
  answer: string;
  rankedPlaceIds: string[];
  highlights: NearbyAIHighlight[];
  suggestions: string[];
};

export async function askNearbyAI({
  category,
  userNeed,
  location,
  places,
}: {
  category: string;
  userNeed: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  places: NearbyPlaceForAI[];
}) {
  const { data, error } = await supabase.functions.invoke(
    "nearby-ai-recommend",
    {
      body: {
        category,
        userNeed,
        location,
        places,
      },
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("AI returned no response.");
  }

  return data as NearbyAIResponse;
}