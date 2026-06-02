import { supabase } from "@/lib/supabase";

export type DashboardAIMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DashboardAIResponse = {
  answer: string;
  suggestedQuestions: string[];
  usedData: string[];
  missingData: string[];
  confidence: "high" | "medium" | "low";
};

export async function askDashboardAI({
  question,
  history,
}: {
  question: string;
  history: DashboardAIMessage[];
}) {
  const { data, error } = await supabase.functions.invoke("dashboard-ai-chat", {
    body: {
      question,
      history,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.ok) {
    throw new Error(data?.error || "TripNest AI could not answer.");
  }

  return {
    answer: data.answer || "No answer generated.",
    suggestedQuestions: data.suggestedQuestions || [],
    usedData: data.usedData || [],
    missingData: data.missingData || [],
    confidence: data.confidence || "medium",
  } as DashboardAIResponse;
}