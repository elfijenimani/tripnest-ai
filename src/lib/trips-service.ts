import { supabase } from "@/lib/supabase";
import type {
  CreateTripInput,
  ServiceResult,
  Trip,
  UpdateTripInput,
} from "@/lib/types";

function toNullableText(value: string | undefined | null) {
  const cleanValue = value?.trim();
  return cleanValue && cleanValue.length > 0 ? cleanValue : null;
}

export async function getTrips(): Promise<ServiceResult<Trip[]>> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    data: data as Trip[],
  };
}

export async function createTrip(
  input: CreateTripInput
): Promise<ServiceResult<Trip>> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "You must be logged in to create a trip.",
    };
  }

  const title = input.title.trim();
  const country = input.country.trim();

  if (!title || !country) {
    return {
      ok: false,
      message: "Trip title and country are required.",
    };
  }

  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      title,
      country,
      city: toNullableText(input.city),
      start_date: toNullableText(input.startDate),
      end_date: toNullableText(input.endDate),
      mood: toNullableText(input.mood),
      description: toNullableText(input.description),
    })
    .select("*")
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    data: data as Trip,
  };
}

export async function updateTrip(
  input: UpdateTripInput
): Promise<ServiceResult<Trip>> {
  const title = input.title.trim();
  const country = input.country.trim();

  if (!title || !country) {
    return {
      ok: false,
      message: "Trip title and country are required.",
    };
  }

  const { data, error } = await supabase
    .from("trips")
    .update({
      title,
      country,
      city: toNullableText(input.city),
      start_date: toNullableText(input.startDate),
      end_date: toNullableText(input.endDate),
      mood: toNullableText(input.mood),
      description: toNullableText(input.description),
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    data: data as Trip,
  };
}

export async function deleteTrip(tripId: string): Promise<ServiceResult<null>> {
  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    data: null,
  };
}