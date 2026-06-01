import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/lib/types";

const BUCKET_NAME = "trip-media";

export type TripMediaType = "image" | "video" | "file";

export type TripMedia = {
  id: string;
  user_id: string;
  trip_id: string;
  storage_path: string;
  file_name: string;
  file_type: TripMediaType;
  mime_type: string | null;
  size_bytes: number | null;
  ai_caption: string | null;
  ai_mood: string | null;
  created_at: string;
};

export type TripMediaWithUrl = TripMedia & {
  signedUrl: string | null;
};

function getFileType(file: File): TripMediaType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
}

function cleanFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

function createStoragePath(userId: string, tripId: string, file: File) {
  const safeName = cleanFileName(file.name);
  const uniquePart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${userId}/${tripId}/${uniquePart}-${safeName}`;
}

async function attachSignedUrls(
  mediaItems: TripMedia[]
): Promise<TripMediaWithUrl[]> {
  if (mediaItems.length === 0) return [];

  const paths = mediaItems.map((item) => item.storage_path);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrls(paths, 60 * 60);

  if (error) {
    return mediaItems.map((item) => ({
      ...item,
      signedUrl: null,
    }));
  }

  const urlByPath = new Map<string, string>();

  data?.forEach((item) => {
    if (item.path && item.signedUrl) {
      urlByPath.set(item.path, item.signedUrl);
    }
  });

  return mediaItems.map((item) => ({
    ...item,
    signedUrl: urlByPath.get(item.storage_path) ?? null,
  }));
}

export async function getTripMedia(
  tripId: string
): Promise<ServiceResult<TripMediaWithUrl[]>> {
  const { data, error } = await supabase
    .from("trip_media")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  const mediaWithUrls = await attachSignedUrls((data ?? []) as TripMedia[]);

  return {
    ok: true,
    data: mediaWithUrls,
  };
}

export async function uploadTripMedia(input: {
  tripId: string;
  file: File;
}): Promise<ServiceResult<TripMediaWithUrl>> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "You must be logged in to upload media.",
    };
  }

  const fileType = getFileType(input.file);
  const storagePath = createStoragePath(user.id, input.tripId, input.file);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, input.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: input.file.type,
    });

  if (uploadError) {
    return {
      ok: false,
      message: uploadError.message,
    };
  }

  const { data, error: insertError } = await supabase
    .from("trip_media")
    .insert({
      user_id: user.id,
      trip_id: input.tripId,
      storage_path: storagePath,
      file_name: input.file.name,
      file_type: fileType,
      mime_type: input.file.type,
      size_bytes: input.file.size,
    })
    .select("*")
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

    return {
      ok: false,
      message: insertError.message,
    };
  }

  const signed = await attachSignedUrls([data as TripMedia]);

  return {
    ok: true,
    data: signed[0],
  };
}

export async function deleteTripMedia(
  media: TripMedia
): Promise<ServiceResult<null>> {
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([media.storage_path]);

  if (storageError) {
    return {
      ok: false,
      message: storageError.message,
    };
  }

  const { error: dbError } = await supabase
    .from("trip_media")
    .delete()
    .eq("id", media.id);

  if (dbError) {
    return {
      ok: false,
      message: dbError.message,
    };
  }

  return {
    ok: true,
    data: null,
  };
}