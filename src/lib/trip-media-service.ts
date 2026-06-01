import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "trip-media";

export type StoredTripMedia = {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  path: string;
  size: number;
  createdAt: string;
  caption: string;
  tags: string[];
};

type TripMediaRow = {
  id: string;
  user_id: string;
  trip_id: string;
  file_name: string | null;
  file_type: "image" | "video" | string | null;
  file_path?: string | null;
  storage_path?: string | null;
  public_url?: string | null;
  file_size: number | null;
  caption: string | null;
  tags: string[] | null;
  created_at: string;
};

function getPublicUrl(path: string) {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

function mapRowToMedia(row: TripMediaRow): StoredTripMedia {
  const path = row.file_path || row.storage_path || "";
  const url = path ? getPublicUrl(path) : row.public_url || "";

  return {
    id: row.id,
    name: row.file_name || "Untitled media",
    type: row.file_type === "video" ? "video" : "image",
    url,
    path,
    size: row.file_size ?? 0,
    createdAt: new Date(row.created_at).toLocaleDateString("en"),
    caption: row.caption ?? "",
    tags: row.tags ?? [],
  };
}

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

export async function listTripMedia(tripId: string) {
  const { data, error } = await supabase
    .from("trip_media")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRowToMedia(row as TripMediaRow));
}

export async function uploadTripMedia({
  tripId,
  file,
  caption,
  tags,
}: {
  tripId: string;
  file: File;
  caption: string;
  tags: string[];
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const user = authData.user;

  if (!user) {
    throw new Error("You must be logged in to upload media.");
  }

  const fileType: "image" | "video" = file.type.startsWith("video/")
    ? "video"
    : "image";

  const safeFileName = sanitizeFileName(file.name);

  const uniqueName =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `${crypto.randomUUID()}-${safeFileName}`
      : `${Date.now()}-${safeFileName}`;

  const filePath = `${user.id}/${tripId}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const publicUrl = getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("trip_media")
    .insert({
      user_id: user.id,
      trip_id: tripId,
      file_name: file.name,
      file_type: fileType,
      file_path: filePath,
      storage_path: filePath,
      public_url: publicUrl,
      file_size: file.size,
      caption,
      tags,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    throw new Error(error.message);
  }

  return mapRowToMedia(data as TripMediaRow);
}

export async function deleteTripMedia(media: StoredTripMedia) {
  if (media.path) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([media.path]);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { error: dbError } = await supabase
    .from("trip_media")
    .delete()
    .eq("id", media.id);

  if (dbError) {
    throw new Error(dbError.message);
  }
}