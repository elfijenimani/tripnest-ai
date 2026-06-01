import heroMap from "@/assets/hero-map.jpg";
import floatLemons from "@/assets/float-lemons.jpg";

export const moodTint = {
  Adventurous: "bg-orange-100 text-orange-700",
  Peaceful: "bg-sky-100 text-sky-700",
  Unforgettable: "bg-purple-100 text-purple-700",
  Vibrant: "bg-emerald-100 text-emerald-700",
  Romantic: "bg-pink-100 text-pink-700",
  Relaxing: "bg-green-100 text-green-700",
  Nature: "bg-lime-100 text-lime-700",
  Food: "bg-yellow-100 text-yellow-700",
} as const;

export type DemoMood = keyof typeof moodTint;

export const trips: Array<{
  id: string;
  title: string;
  country: string;
  dateRange: string;
  photos: number;
  places: number;
  mood: DemoMood;
  cover: string;
  summary: string;
}> = [
  {
    id: "demo-italy",
    title: "Italy Summer 2026",
    country: "Italy",
    dateRange: "June 12 — June 20",
    photos: 342,
    places: 9,
    mood: "Adventurous",
    cover: heroMap,
    summary:
      "A warm journey full of city walks, food memories, architecture, and golden evening views.",
  },
  {
    id: "demo-paris",
    title: "Paris Weekend",
    country: "France",
    dateRange: "April 04 — April 07",
    photos: 128,
    places: 6,
    mood: "Romantic",
    cover: floatLemons,
    summary:
      "A soft weekend of calm streets, beautiful cafés, museums, and unforgettable little moments.",
  },
  {
    id: "demo-istanbul",
    title: "Istanbul Memories",
    country: "Türkiye",
    dateRange: "May 01 — May 06",
    photos: 215,
    places: 8,
    mood: "Vibrant",
    cover: heroMap,
    summary:
      "A colorful trip through culture, food, history, and busy streets full of energy.",
  },
];