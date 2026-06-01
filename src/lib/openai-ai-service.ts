import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/lib/types";

export type TripAIResult = {
  emotionalTitle: string;
  shortSummary: string;
  travelStory: string;
  detectedMood: string;
  suggestedFolders: string[];
  generatedCaptions: string[];
  memoryKeywords: string[];
  nextIdeas: string[];
};

export async function generateTripAI(
  tripId: string
): Promise<ServiceResult<TripAIResult>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return {
      ok: false,
      message: "You must be logged in to use AI.",
    };
  }

  const { data, error } = await supabase.functions.invoke("ai-memory", {
    body: {
      tripId,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (data?.error) {
    return {
      ok: false,
      message: data.error,
    };
  }

  return {
    ok: true,
    data: data.result as TripAIResult,
  };
}