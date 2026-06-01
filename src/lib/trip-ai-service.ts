import { supabase } from "@/lib/supabase";

export type TripAIResponse = {
  answer: string;
  matchedIds: string[];
  captionIdeas: string[];
  suggestions: string[];
};

export async function askRealTripAI({
  tripId,
  question,
}: {
  tripId: string;
  question: string;
}) {
  const { data, error } = await supabase.functions.invoke("trip-ai-search", {
    body: {
      tripId,
      question,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("AI returned no response.");
  }

  return data as TripAIResponse;
}