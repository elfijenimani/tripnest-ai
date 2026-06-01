export type AppStatus = "idle" | "loading" | "success" | "error";

export const TRIP_MOODS = [
  "Adventurous",
  "Peaceful",
  "Unforgettable",
  "Vibrant",
  "Romantic",
  "Relaxing",
  "Nature",
  "Food",
] as const;

export type TripMood = (typeof TRIP_MOODS)[number];

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Trip = {
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

export type CreateTripInput = {
  title: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  mood: string;
  description: string;
};

export type UpdateTripInput = CreateTripInput & {
  id: string;
};

export type AuthFormState = {
  fullName: string;
  email: string;
  password: string;
};

export type ServiceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
    };