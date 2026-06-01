import type { Trip } from "@/lib/types";
import type { TripMediaWithUrl } from "@/lib/media-service";

export type AIInsight = {
  emotionalTitle: string;
  shortSummary: string;
  travelStory: string;
  suggestedFolders: string[];
  generatedCaptions: string[];
  detectedMood: string;
  memoryKeywords: string[];
};

function pickByMood(mood?: string | null) {
  switch (mood) {
    case "Romantic":
      return {
        tone: "soft, warm, and emotional",
        feeling: "romantic",
        words: ["golden", "soft", "beautiful", "slow", "heartfelt"],
      };
    case "Peaceful":
      return {
        tone: "calm, reflective, and gentle",
        feeling: "peaceful",
        words: ["quiet", "calm", "still", "gentle", "restful"],
      };
    case "Adventurous":
      return {
        tone: "energetic, curious, and exploratory",
        feeling: "adventurous",
        words: ["wild", "curious", "bold", "moving", "alive"],
      };
    case "Food":
      return {
        tone: "warm, cultural, and sensory",
        feeling: "food-inspired",
        words: ["flavor", "local", "taste", "culture", "shared"],
      };
    case "Nature":
      return {
        tone: "fresh, scenic, and grounded",
        feeling: "nature-connected",
        words: ["green", "open", "fresh", "wide", "natural"],
      };
    default:
      return {
        tone: "personal, nostalgic, and meaningful",
        feeling: "memorable",
        words: ["memory", "journey", "place", "moment", "story"],
      };
  }
}

function countByType(media: TripMediaWithUrl[], type: "image" | "video") {
  return media.filter((item) => item.file_type === type).length;
}

export function generateAIInsight(
  trip: Trip,
  media: TripMediaWithUrl[]
): AIInsight {
  const moodPack = pickByMood(trip.mood);
  const imageCount = countByType(media, "image");
  const videoCount = countByType(media, "video");
  const place = trip.city ? `${trip.city}, ${trip.country}` : trip.country;
  const hasDescription = Boolean(trip.description?.trim());

  const emotionalTitle = `${trip.title}: A ${moodPack.feeling} memory from ${place}`;

  const shortSummary = hasDescription
    ? `This trip feels ${moodPack.tone}. Based on your memory note, "${trip.description}", this journey can be remembered as a meaningful experience in ${place}.`
    : `This trip feels ${moodPack.tone}. You saved this journey in ${place}, and it is ready to become a richer memory with photos, videos, notes, and AI-generated stories.`;

  const travelStory = [
    `Your journey to ${place} carries the feeling of a ${moodPack.feeling} memory.`,
    hasDescription
      ? `The note you wrote gives this trip a personal meaning: ${trip.description}.`
      : `Even without a long note yet, this trip already has the beginning of a story: a place, a mood, and a moment worth saving.`,
    `With ${imageCount} photo${imageCount === 1 ? "" : "s"} and ${videoCount} video${videoCount === 1 ? "" : "s"}, TripNest AI can later build a complete travel journal from your media, notes, locations, and emotions.`,
    `This is not only a saved trip. It is a personal chapter in your travel memory map.`,
  ].join(" ");

  const suggestedFolders = [
    `${trip.country} Highlights`,
    `${trip.mood || "Memory"} Moments`,
    imageCount > 0 ? "Photo Memories" : "Places To Capture",
    videoCount > 0 ? "Travel Videos" : "Future Videos",
    trip.city ? `${trip.city} Notes` : "Location Notes",
  ];

  const generatedCaptions = [
    `A ${moodPack.feeling} memory from ${place}.`,
    `Some places become stories. ${trip.title} was one of them.`,
    `Collecting moments, not just photos — ${trip.country}.`,
    `A little piece of ${place}, saved forever.`,
    `${moodPack.words[0]} days, ${moodPack.words[1]} memories, and a journey worth remembering.`,
  ];

  const memoryKeywords = [
    trip.country,
    trip.city || "travel",
    trip.mood || "memory",
    ...moodPack.words,
  ].filter(Boolean);

  return {
    emotionalTitle,
    shortSummary,
    travelStory,
    suggestedFolders,
    generatedCaptions,
    detectedMood: trip.mood || moodPack.feeling,
    memoryKeywords,
  };
}