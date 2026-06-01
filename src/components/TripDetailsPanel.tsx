import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import heroMap from "@/assets/hero-map.jpg";
import type { Trip } from "@/lib/types";
import { formatDateRange } from "@/lib/ui-helpers";
import {
  deleteTripMedia,
  listTripMedia,
  uploadTripMedia,
  type StoredTripMedia,
} from "@/lib/trip-media-service";
import { askRealTripAI } from "@/lib/trip-ai-service";

type TripDetailsPanelProps = {
  trip: Trip;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

type MediaItem = StoredTripMedia;

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9ëç\s]/gi, " ");
}

function getAutoTags(fileName: string, type: "image" | "video", trip: Trip) {
  const text = normalizeText(fileName);
  const tags = new Set<string>();

  tags.add(type);
  tags.add(type === "image" ? "photo" : "video");

  if (trip.country) tags.add(trip.country.toLowerCase());
  if (trip.city) tags.add(trip.city.toLowerCase());
  if (trip.mood) tags.add(trip.mood.toLowerCase());

  if (text.includes("food") || text.includes("restaurant")) tags.add("food");
  if (text.includes("cafe") || text.includes("coffee")) tags.add("cafe");
  if (text.includes("sunset") || text.includes("golden")) tags.add("sunset");
  if (text.includes("beach") || text.includes("sea")) tags.add("beach");
  if (text.includes("city") || text.includes("street")) tags.add("city");
  if (text.includes("museum") || text.includes("art")) tags.add("culture");
  if (text.includes("nature") || text.includes("mountain")) tags.add("nature");

  return Array.from(tags);
}

function buildCaption(fileName: string, type: "image" | "video", trip: Trip) {
  const place = [trip.city, trip.country].filter(Boolean).join(", ");

  if (type === "video") {
    return `A short travel video from ${place || trip.title}, saved inside ${
      trip.title
    }.`;
  }

  return `A travel photo from ${place || trip.title}, connected to the memory "${
    trip.title
  }".`;
}

function TripDetailsPanel({
  trip,
  onClose,
  onEdit,
  onDelete,
  deleting = false,
}: TripDetailsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const [activeTab, setActiveTab] = useState<"overview" | "media" | "ai">(
    "overview"
  );

  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiResultIds, setAiResultIds] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [captionIdeas, setCaptionIdeas] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMedia() {
      try {
        setLoadingMedia(true);
        setMediaError("");

        const media = await listTripMedia(trip.id);

        if (isMounted) {
          setMediaItems(media);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load media.";

        if (isMounted) {
          setMediaError(message);
        }
      } finally {
        if (isMounted) {
          setLoadingMedia(false);
        }
      }
    }

    void loadMedia();

    return () => {
      isMounted = false;
    };
  }, [trip.id]);

  const imageCount = mediaItems.filter((item) => item.type === "image").length;
  const videoCount = mediaItems.filter((item) => item.type === "video").length;

  const highlightedMedia = useMemo(() => {
    if (aiResultIds.length === 0) return mediaItems;
    return mediaItems.filter((item) => aiResultIds.includes(item.id));
  }, [mediaItems, aiResultIds]);

  async function handleMediaUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) return;

    const acceptedFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (acceptedFiles.length === 0) {
      setMediaError("Please upload only photos or videos.");
      return;
    }

    try {
      setUploadingMedia(true);
      setMediaError("");

      const uploadedItems = await Promise.all(
        acceptedFiles.map((file) => {
          const type = file.type.startsWith("video/") ? "video" : "image";

          return uploadTripMedia({
            tripId: trip.id,
            file,
            caption: buildCaption(file.name, type, trip),
            tags: getAutoTags(file.name, type, trip),
          });
        })
      );

      setMediaItems((current) => [...uploadedItems, ...current]);
      setActiveTab("media");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not upload media.";

      setMediaError(message);
    } finally {
      setUploadingMedia(false);
      event.target.value = "";
    }
  }

  async function removeMedia(id: string) {
    const media = mediaItems.find((item) => item.id === id);

    if (!media) return;

    const confirmed = window.confirm(`Delete "${media.name}" from this folder?`);

    if (!confirmed) return;

    try {
      setMediaError("");

      await deleteTripMedia(media);

      setMediaItems((current) => current.filter((item) => item.id !== id));
      setAiResultIds((current) => current.filter((resultId) => resultId !== id));

      if (previewItem?.id === id) {
        setPreviewItem(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not delete media.";

      setMediaError(message);
    }
  }

  async function handleAskAI(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = aiQuestion.trim();

    if (!question) {
      setAiAnswer("Please write what you want AI to do inside this folder.");
      return;
    }

    try {
      setAiLoading(true);
      setMediaError("");
      setAiAnswer("");
      setAiResultIds([]);
      setAiSuggestions([]);
      setCaptionIdeas([]);

      const result = await askRealTripAI({
        tripId: trip.id,
        question,
      });

      setAiAnswer(result.answer);
      setAiResultIds(result.matchedIds ?? []);
      setCaptionIdeas(result.captionIdeas ?? []);
      setAiSuggestions(result.suggestions ?? []);
      setActiveTab("ai");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI could not answer.";

      setMediaError(message);
    } finally {
      setAiLoading(false);
    }
  }

  function clearAiSearch() {
    setAiQuestion("");
    setAiAnswer("");
    setAiResultIds([]);
    setAiSuggestions([]);
    setCaptionIdeas([]);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[980px] flex-col overflow-hidden rounded-l-[2.5rem] bg-background text-foreground shadow-[0_35px_120px_-35px_rgba(0,0,0,0.55)]">
        <div className="relative min-h-[280px] overflow-hidden bg-foreground text-background">
          <img
            src={trip.cover_image_url || heroMap}
            alt={trip.title}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-foreground/95 via-foreground/65 to-foreground/25" />

          <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-between p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full bg-white/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-background/70 backdrop-blur">
                Trip Folder
              </span>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white px-5 py-3 text-sm font-black text-foreground shadow-xl transition hover:-translate-y-0.5 hover:bg-sunset"
              >
                Close
              </button>
            </div>

            <div>
              <span className="inline-flex rounded-full bg-white px-4 py-2 font-mono text-[10px] font-black uppercase tracking-widest text-sunset">
                {trip.mood || "Memory"}
              </span>

              <h1 className="mt-5 max-w-3xl font-display text-5xl leading-none tracking-tight md:text-7xl">
                {trip.title}
              </h1>

              <p className="mt-4 text-sm font-bold text-background/80">
                {[trip.city, trip.country].filter(Boolean).join(", ")}
              </p>

              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-background/45">
                {formatDateRange(trip.start_date, trip.end_date)}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-black/5 bg-white px-5 py-4 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <TabButton
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </TabButton>

              <TabButton
                active={activeTab === "media"}
                onClick={() => setActiveTab("media")}
              >
                Photos & Videos
              </TabButton>

              <TabButton
                active={activeTab === "ai"}
                onClick={() => setActiveTab("ai")}
              >
                AI Search
              </TabButton>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                className="rounded-full bg-sunset px-5 py-3 text-xs font-black uppercase tracking-widest text-foreground shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingMedia ? "Uploading..." : "Add photo/video"}
              </button>

              <button
                type="button"
                onClick={onEdit}
                className="rounded-full border border-black/10 bg-background px-5 py-3 text-xs font-black uppercase tracking-widest text-foreground transition hover:-translate-y-0.5 hover:bg-white"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="rounded-full border border-red-100 bg-red-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-500 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>

        {mediaError && (
          <div className="mx-5 mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 md:mx-8">
            {mediaError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          {activeTab === "overview" && (
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                  Folder Summary
                </p>

                <h2 className="mt-3 font-display text-4xl">
                  Memory details
                </h2>

                <p className="mt-5 text-sm leading-7 text-foreground/60">
                  {trip.description ||
                    "No description has been added yet. Add notes to make this travel memory richer."}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <MiniInfo label="Country" value={trip.country || "—"} />
                  <MiniInfo label="City" value={trip.city || "—"} />
                  <MiniInfo label="Mood" value={trip.mood || "—"} />
                  <MiniInfo
                    label="Date"
                    value={
                      formatDateRange(trip.start_date, trip.end_date) || "—"
                    }
                  />
                </div>
              </section>

              <section className="rounded-[2rem] bg-foreground p-6 text-background shadow-sm">
                <p className="font-mono text-[10px] uppercase tracking-widest text-background/40">
                  Media Library
                </p>

                <h2 className="mt-3 font-display text-4xl">
                  Photos and videos
                </h2>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-[1.5rem] bg-white/10 p-4">
                    <p className="text-3xl font-black">{mediaItems.length}</p>
                    <p className="mt-1 text-xs text-background/50">Total</p>
                  </div>

                  <div className="rounded-[1.5rem] bg-white/10 p-4">
                    <p className="text-3xl font-black">{imageCount}</p>
                    <p className="mt-1 text-xs text-background/50">Photos</p>
                  </div>

                  <div className="rounded-[1.5rem] bg-white/10 p-4">
                    <p className="text-3xl font-black">{videoCount}</p>
                    <p className="mt-1 text-xs text-background/50">Videos</p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-7 text-background/60">
                  Add your travel photos and videos inside this folder. They
                  will be saved in Supabase Storage and will stay after refresh.
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="mt-6 rounded-full bg-sunset px-6 py-3 text-xs font-black uppercase tracking-widest text-foreground shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingMedia ? "Uploading..." : "Upload media"}
                </button>
              </section>
            </div>
          )}

          {activeTab === "media" && (
            <section>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                    Folder Media
                  </p>

                  <h2 className="mt-2 font-display text-5xl">
                    Photos & videos
                  </h2>

                  <p className="mt-2 text-sm text-foreground/50">
                    Click a photo or video to preview and download it.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="rounded-full bg-foreground px-6 py-3 text-xs font-black uppercase tracking-widest text-background shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingMedia ? "Uploading..." : "Add more"}
                </button>
              </div>

              {loadingMedia ? (
                <LoadingMediaState />
              ) : mediaItems.length === 0 ? (
                <EmptyMediaState
                  onUpload={() => fileInputRef.current?.click()}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {mediaItems.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      highlighted={aiResultIds.includes(item.id)}
                      onOpen={() => setPreviewItem(item)}
                      onRemove={() => void removeMedia(item.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "ai" && (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] bg-foreground p-6 text-background shadow-sm">
                <p className="font-mono text-[10px] uppercase tracking-widest text-background/40">
                  Real AI Inside Folder
                </p>

                <h2 className="mt-3 font-display text-5xl leading-none">
                  Ask anything
                </h2>

                <p className="mt-5 text-sm leading-7 text-background/60">
                  Ask AI anything about this folder: analyze photos, choose the
                  best photo, write captions, create content ideas, organize
                  memories, or explain what is inside the images.
                </p>

                <form onSubmit={handleAskAI} className="mt-6">
                  <textarea
                    value={aiQuestion}
                    onChange={(event) => setAiQuestion(event.target.value)}
                    rows={5}
                    placeholder="Example: Which photo is best for Instagram and write a caption for it?"
                    className="w-full rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-4 text-sm text-background outline-none placeholder:text-background/35 focus:ring-4 focus:ring-sunset/20"
                  />

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={aiLoading}
                      className="rounded-full bg-sunset px-6 py-3 text-xs font-black uppercase tracking-widest text-foreground shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {aiLoading ? "Thinking..." : "Ask AI"}
                    </button>

                    <button
                      type="button"
                      onClick={clearAiSearch}
                      disabled={aiLoading}
                      className="rounded-full border border-white/10 bg-white/10 px-6 py-3 text-xs font-black uppercase tracking-widest text-background transition hover:-translate-y-0.5 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                </form>

                {aiLoading && (
                  <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                    <p className="text-sm leading-7 text-background/70">
                      AI is analyzing your folder, trip information, photos and
                      media metadata...
                    </p>
                  </div>
                )}

                {aiAnswer && (
                  <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-background/40">
                      AI Answer
                    </p>

                    <p className="whitespace-pre-line text-sm leading-7 text-background/75">
                      {aiAnswer}
                    </p>
                  </div>
                )}

                {captionIdeas.length > 0 && (
                  <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-background/40">
                      Caption Ideas
                    </p>

                    <div className="space-y-3">
                      {captionIdeas.map((caption, index) => (
                        <p
                          key={`${caption}-${index}`}
                          className="rounded-2xl bg-white/10 px-4 py-3 text-sm leading-6 text-background/75"
                        >
                          {caption}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {aiSuggestions.length > 0 && (
                  <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-background/40">
                      AI Suggestions
                    </p>

                    <ul className="space-y-2">
                      {aiSuggestions.map((suggestion, index) => (
                        <li
                          key={`${suggestion}-${index}`}
                          className="text-sm leading-6 text-background/75"
                        >
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                      AI Results
                    </p>

                    <h3 className="mt-1 font-display text-4xl">
                      Matching media
                    </h3>
                  </div>

                  <span className="rounded-full bg-background px-4 py-2 text-xs font-black text-foreground/50">
                    {highlightedMedia.length} items
                  </span>
                </div>

                {loadingMedia ? (
                  <LoadingMediaState />
                ) : mediaItems.length === 0 ? (
                  <EmptyMediaState
                    onUpload={() => fileInputRef.current?.click()}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {highlightedMedia.map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        highlighted={aiResultIds.includes(item.id)}
                        onOpen={() => setPreviewItem(item)}
                        onRemove={() => void removeMedia(item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </aside>

      {previewItem && (
        <MediaPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}

type TabButtonProps = {
  active: boolean;
  children: string;
  onClick: () => void;
};

function TabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-3 text-xs font-black uppercase tracking-widest transition ${
        active
          ? "bg-foreground text-background shadow-lg"
          : "bg-background text-foreground/50 hover:bg-foreground hover:text-background"
      }`}
    >
      {children}
    </button>
  );
}

type MiniInfoProps = {
  label: string;
  value: string;
};

function MiniInfo({ label, value }: MiniInfoProps) {
  return (
    <div className="rounded-[1.5rem] bg-background p-4 ring-1 ring-black/5">
      <p className="font-mono text-[9px] uppercase tracking-widest text-foreground/35">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

type MediaCardProps = {
  item: MediaItem;
  highlighted: boolean;
  onOpen: () => void;
  onRemove: () => void;
};

function MediaCard({ item, highlighted, onOpen, onRemove }: MediaCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-[1.8rem] bg-background shadow-sm ring-1 transition ${
        highlighted
          ? "ring-4 ring-sunset shadow-xl"
          : "ring-black/5 hover:-translate-y-1 hover:shadow-xl"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group relative block h-56 w-full overflow-hidden bg-foreground/10 text-left"
      >
        {item.type === "image" ? (
          <img
            src={item.url}
            alt={item.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <video
            src={item.url}
            muted
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}

        <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/25" />

        <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-foreground shadow">
          {item.type}
        </span>

        {item.type === "video" && (
          <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-black text-foreground shadow-xl">
            ▶
          </span>
        )}

        <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground opacity-0 shadow transition group-hover:opacity-100">
          Open preview
        </span>

        {highlighted && (
          <span className="absolute right-4 top-4 rounded-full bg-sunset px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-foreground shadow">
            AI match
          </span>
        )}
      </button>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-foreground">
              {item.name}
            </h3>

            <p className="mt-1 text-xs text-foreground/45">
              {item.size > 0 ? formatFileSize(item.size) : "Saved media"} ·{" "}
              {item.createdAt}
            </p>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-500 shadow-sm transition hover:bg-red-50"
          >
            Remove
          </button>
        </div>

        <p className="mt-4 line-clamp-2 text-xs leading-5 text-foreground/55">
          {item.caption}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-foreground/40"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

type MediaPreviewModalProps = {
  item: MediaItem;
  onClose: () => void;
};

function MediaPreviewModal({ item, onClose }: MediaPreviewModalProps) {
  async function handleDownload() {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    } catch {
      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close media preview"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_35px_120px_-35px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col gap-3 border-b border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
              Media Preview
            </p>

            <h3 className="mt-1 truncate text-lg font-black text-foreground">
              {item.name}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDownload()}
              className="rounded-full bg-sunset px-5 py-3 text-xs font-black uppercase tracking-widest text-foreground shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Download
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-foreground px-5 py-3 text-xs font-black uppercase tracking-widest text-background shadow-lg transition hover:-translate-y-0.5"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-foreground p-4">
          {item.type === "image" ? (
            <img
              src={item.url}
              alt={item.name}
              className="mx-auto max-h-[70vh] w-auto max-w-full rounded-[1.5rem] object-contain shadow-2xl"
            />
          ) : (
            <video
              src={item.url}
              controls
              autoPlay
              className="mx-auto max-h-[70vh] w-auto max-w-full rounded-[1.5rem] shadow-2xl"
            />
          )}
        </div>

        <div className="grid gap-3 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm leading-6 text-foreground/60">
              {item.caption}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.slice(0, 8).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-background px-3 py-1 text-[9px] font-black uppercase tracking-widest text-foreground/45"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs font-bold text-foreground/40">
            {item.size > 0 ? formatFileSize(item.size) : "Saved media"}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingMediaState() {
  return (
    <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-background">
        <span className="size-3 animate-pulse rounded-full bg-sunset" />
      </div>

      <h3 className="font-display text-4xl">Loading media...</h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-foreground/55">
        Please wait while your photos and videos are being loaded from
        Supabase.
      </p>
    </div>
  );
}

type EmptyMediaStateProps = {
  onUpload: () => void;
};

function EmptyMediaState({ onUpload }: EmptyMediaStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-black/10 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-background text-3xl">
        🖼️
      </div>

      <h3 className="mt-5 font-display text-4xl">No media yet</h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-foreground/55">
        Add photos or videos inside this folder. After that, AI can help you
        find the best media for content, captions, memories or travel stories.
      </p>

      <button
        type="button"
        onClick={onUpload}
        className="mt-6 rounded-full bg-foreground px-6 py-3 text-xs font-black uppercase tracking-widest text-background shadow-lg transition hover:-translate-y-0.5"
      >
        Add photo/video
      </button>
    </div>
  );
}

export { TripDetailsPanel };