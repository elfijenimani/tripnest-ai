import { supabase } from "@/lib/supabase";

export type NearbyCategory = "cafes" | "restaurants" | "attractions" | "museums";

export type RealNearbyPlace = {
  id: string;
  name: string;
  type: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  rating: number | null;
  userRatingCount: number;
  googleMapsUri: string;
  openNow: boolean | null;
  description: string;
  tags: Record<string, unknown>;
};

export type NearbyAIHighlight = {
  placeId: string;
  reason: string;
  bestFor: string;
};

export type NearbyAIResponse = {
  ok?: boolean;
  answer: string;
  rankedPlaceIds: string[];
  highlights: NearbyAIHighlight[];
  suggestions: string[];
};

function fallbackAddress(latitude: number, longitude: number) {
  return `Current location detected (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
}

export async function getReadableLocationName({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  try {
    const { data, error } = await supabase.functions.invoke("reverse-geocode", {
      body: {
        latitude,
        longitude,
      },
    });

    if (error || !data?.ok) {
      return fallbackAddress(latitude, longitude);
    }

    return data.address || fallbackAddress(latitude, longitude);
  } catch {
    return fallbackAddress(latitude, longitude);
  }
}

export async function getRealNearbyPlaces({
  latitude,
  longitude,
  category,
}: {
  latitude: number;
  longitude: number;
  category: NearbyCategory;
}) {
  const { data, error } = await supabase.functions.invoke("real-nearby-places", {
    body: {
      latitude,
      longitude,
      category,
      radius: 2000,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.ok) {
    throw new Error(data?.error || "Real nearby places could not be loaded.");
  }

  return (data.places || []) as RealNearbyPlace[];
}

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
  places: RealNearbyPlace[];
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

  if (!data?.ok && data?.error) {
    throw new Error(data.error);
  }

  return {
    answer: data?.answer || "AI recommendation generated.",
    rankedPlaceIds: data?.rankedPlaceIds || [],
    highlights: data?.highlights || [],
    suggestions: data?.suggestions || [],
  } as NearbyAIResponse;
}