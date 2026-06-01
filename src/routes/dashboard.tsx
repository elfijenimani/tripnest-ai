import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";

import heroMap from "@/assets/hero-map.jpg";
import { AppShell } from "@/components/AppShell";
import { AITravelCompanion } from "@/components/AITravelCompanion";
import { TripCard } from "@/components/TripCard";
import { TripDetailsPanel } from "@/components/TripDetailsPanel";
import { useAuth } from "@/hooks/useAuth";
import { useTrips } from "@/hooks/useTrips";
import { signOutUser } from "@/lib/auth-service";
import {
  TRIP_MOODS,
  type CreateTripInput,
  type Trip,
  type TripMood,
} from "@/lib/types";
import {
  formatDateRange,
  getDisplayName,
  getMoodClass,
  getPinColor,
} from "@/lib/ui-helpers";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const emptyForm: CreateTripInput = {
  title: "",
  country: "",
  city: "",
  startDate: "",
  endDate: "",
  mood: "Adventurous",
  description: "",
};

const aiPrompts = [
  {
    tag: "Story",
    prompt: "Create a short story from my latest trip.",
    icon: "✦",
  },
  {
    tag: "Mood",
    prompt: "Show me my most peaceful memories.",
    icon: "◐",
  },
  {
    tag: "Plan",
    prompt: "Suggest my next trip idea based on my memories.",
    icon: "⌖",
  },
  {
    tag: "Caption",
    prompt: "Write an Instagram caption for my Italy trip.",
    icon: "✎",
  },
];

const mapPositions = [
  { top: "30%", left: "38%" },
  { top: "24%", left: "31%" },
  { top: "43%", left: "53%" },
  { top: "54%", left: "48%" },
  { top: "37%", left: "63%" },
  { top: "59%", left: "34%" },
];

const inputClass =
  "mt-2 w-full rounded-[1.35rem] border border-black/10 bg-white px-4 py-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-sunset/70 focus:bg-white focus:ring-4 focus:ring-sunset/15";

const selectClass =
  "mt-2 w-full rounded-[1.35rem] border border-black/10 bg-white px-4 py-3.5 text-sm text-foreground shadow-sm outline-none transition focus:border-sunset/70 focus:ring-4 focus:ring-sunset/15";

type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type AiInsight = {
  label: string;
  value: string;
  description: string;
  icon: string;
};

function DashboardPage() {
  const {
    status: authStatus,
    user,
    profile,
    isAuthenticated,
    error: authError,
  } = useAuth();

  const {
    status: tripsStatus,
    trips,
    countries,
    stats,
    error: tripsError,
    reload,
    createTrip,
    updateTrip,
    deleteTrip,
  } = useTrips(authStatus === "success" && isAuthenticated);

  const [globalError, setGlobalError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState<TripMood | "All">("All");
  const [countryFilter, setCountryFilter] = useState("All");

  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const detailsScrollYRef = useRef(0);

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [form, setForm] = useState<CreateTripInput>(emptyForm);

  const [savingTrip, setSavingTrip] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I am TripNest AI. Ask me to summarize your trips, write captions, create a travel story, find calm memories or suggest your next travel plan based on your saved memories.",
      createdAt: "Ready",
    },
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);

  useEffect(() => {
    if (!isDetailsOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDetailsOpen(false);
        setSelectedTrip(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDetailsOpen]);

  useEffect(() => {
    if (!selectedTrip?.id) return;

    const freshTrip = trips.find((trip) => trip.id === selectedTrip.id);

    if (!freshTrip) {
      setIsDetailsOpen(false);
      setSelectedTrip(null);
      return;
    }

    setSelectedTrip(freshTrip);
  }, [trips, selectedTrip?.id]);

  const userName = getDisplayName({
    fullName:
      profile?.full_name ??
      (typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null),
    email: user?.email ?? null,
  });

  const visibleError = globalError || authError || tripsError;

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const query = searchQuery.trim().toLowerCase();

      const searchableText = [
        trip.title,
        trip.country,
        trip.city,
        trip.description,
        trip.mood,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);
      const matchesMood = moodFilter === "All" || trip.mood === moodFilter;
      const matchesCountry =
        countryFilter === "All" || trip.country === countryFilter;

      return matchesSearch && matchesMood && matchesCountry;
    });
  }, [trips, searchQuery, moodFilter, countryFilter]);

  const moodStats = useMemo(() => {
    return TRIP_MOODS.map((mood) => {
      const count = trips.filter((trip) => trip.mood === mood).length;

      const percentage =
        trips.length === 0 ? 0 : Math.round((count / trips.length) * 100);

      return {
        mood,
        count,
        percentage,
      };
    });
  }, [trips]);

  const latestTrip = trips[0];
  const completedMemories = useMemo(() => {
    return trips.filter((trip) => trip.description?.trim()).length;
  }, [trips]);

  const memoryCompletion =
    trips.length === 0
      ? 0
      : Math.round((completedMemories / trips.length) * 100);

  const dominantMood =
    trips.length === 0
      ? null
      : moodStats.reduce((best, current) =>
          current.count > best.count ? current : best
        );

  const aiMoments =
    "aiMoments" in stats
      ? Number((stats as { aiMoments?: number }).aiMoments ?? 0)
      : completedMemories;

  const aiInsights = useMemo(() => {
    return buildAiInsights({
      trips,
      countries,
      moodStats,
      memoryCompletion,
      dominantMood,
      latestTrip,
    });
  }, [trips, countries, moodStats, memoryCompletion, dominantMood, latestTrip]);

  const lastAssistantMessage = [...aiMessages]
    .reverse()
    .find((message) => message.role === "assistant");

  function openCreateTripModal() {
    setEditingTrip(null);
    setForm(emptyForm);
    setGlobalError("");
    setIsTripModalOpen(true);
  }

  function openEditTripModal(trip: Trip) {
    setEditingTrip(trip);
    setForm({
      title: trip.title,
      country: trip.country,
      city: trip.city ?? "",
      startDate: trip.start_date ?? "",
      endDate: trip.end_date ?? "",
      mood: trip.mood ?? "Adventurous",
      description: trip.description ?? "",
    });
    setGlobalError("");
    setIsTripModalOpen(true);
  }

  function closeTripModal() {
    setIsTripModalOpen(false);
    setEditingTrip(null);
    setForm(emptyForm);
    setSavingTrip(false);
  }

  function openTripDetails(trip: Trip) {
    detailsScrollYRef.current = window.scrollY;
    setSelectedTrip(trip);
    setGlobalError("");
    setIsDetailsOpen(true);
  }

  function closeTripDetails() {
    setIsDetailsOpen(false);
    setSelectedTrip(null);

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: detailsScrollYRef.current,
        behavior: "auto",
      });
    });
  }

  async function handleSaveTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.country.trim()) {
      setGlobalError("Please write at least the trip name and country.");
      return;
    }

    try {
      setSavingTrip(true);
      setGlobalError("");

      if (editingTrip) {
        const updatedTrip = await updateTrip({
          id: editingTrip.id,
          ...form,
        });

        if (selectedTrip?.id === editingTrip.id) {
          setSelectedTrip(updatedTrip);
        }
      } else {
        await createTrip(form);
      }

      closeTripModal();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save trip.";
      setGlobalError(message);
    } finally {
      setSavingTrip(false);
    }
  }

  async function handleDeleteTrip(trip: Trip) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${trip.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingTripId(trip.id);
      setGlobalError("");

      await deleteTrip(trip.id);

      if (selectedTrip?.id === trip.id) {
        closeTripDetails();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not delete trip.";
      setGlobalError(message);
    } finally {
      setDeletingTripId(null);
    }
  }

  async function handleLogout() {
    await signOutUser();
    window.location.href = "/login";
  }

  async function askTripNestAI(questionText: string) {
    const cleanQuestion = questionText.trim();

    if (!cleanQuestion) {
      setGlobalError("Please write a question for TripNest AI first.");
      return;
    }

    const userMessage: AiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: cleanQuestion,
      createdAt: formatShortTime(),
    };

    setAiMessages((current) => [...current, userMessage]);
    setAiQuestion("");
    setGlobalError("");
    setAiLoading(true);
    setAiCopied(false);

    try {
      await wait(450);

      const answer = generateTripNestAnswer({
        question: cleanQuestion,
        trips,
        countries,
        moodStats,
        latestTrip,
        dominantMood,
        memoryCompletion,
      });

      const assistantMessage: AiMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answer,
        createdAt: formatShortTime(),
      };

      setAiMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "TripNest AI could not generate a response.";

      setGlobalError(message);
    } finally {
      setAiLoading(false);
    }
  }

  function handleAskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askTripNestAI(aiQuestion);
  }

  async function handleCopyAiAnswer() {
    if (!lastAssistantMessage) return;

    try {
      await navigator.clipboard.writeText(lastAssistantMessage.content);
      setAiCopied(true);
      window.setTimeout(() => setAiCopied(false), 1800);
    } catch {
      setGlobalError("Could not copy the AI answer. Please copy it manually.");
    }
  }

  if (authStatus === "loading" || tripsStatus === "loading") {
    return <DashboardLoader />;
  }

  if (authStatus === "success" && !isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  if (authStatus === "error" || tripsStatus === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-2xl ring-1 ring-black/5">
          <div className="absolute -right-20 -top-20 size-48 rounded-full bg-red-100 blur-3xl" />

          <div className="relative">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-500">
              !
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">
              Dashboard error
            </p>

            <h1 className="mt-3 font-display text-4xl font-bold">
              Something went wrong
            </h1>

            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {visibleError || "Unknown error"}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={reload}
                className="rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Try again
              </button>

              <button
                onClick={handleLogout}
                className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-background"
              >
                Go to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell onNewTrip={openCreateTripModal} onLogout={handleLogout}>
      <div className="relative space-y-12 overflow-hidden pb-10">
        <div className="pointer-events-none absolute -top-32 right-0 size-96 rounded-full bg-sky/30 blur-3xl" />
        <div className="pointer-events-none absolute left-10 top-96 size-72 rounded-full bg-sunset/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-64 right-16 size-80 rounded-full bg-sage/20 blur-3xl" />

        {visibleError && (
          <div className="relative z-10 flex items-center justify-between gap-4 rounded-3xl border border-red-100 bg-red-50/90 px-5 py-4 text-sm text-red-600 shadow-sm backdrop-blur">
            <span>{visibleError}</span>

            <button
              onClick={() => setGlobalError("")}
              className="rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 shadow-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="relative z-10 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="relative overflow-hidden rounded-[3rem] bg-foreground p-7 text-background shadow-[0_35px_90px_-45px_rgba(20,32,51,0.85)] md:p-10">
            <div className="absolute inset-0 opacity-30">
              <img
                src={heroMap}
                alt="TripNest travel background"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/90 to-foreground/45" />
            <div className="absolute -right-24 -top-24 size-80 rounded-full bg-sunset/30 blur-3xl" />
            <div className="absolute -bottom-20 left-16 size-72 rounded-full bg-sky/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-background/70 backdrop-blur">
                  Welcome back, {userName}
                </span>

                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-background/70 backdrop-blur">
                  {new Date().getFullYear()} Travel Dashboard
                </span>
              </div>

              <div className="mt-8 max-w-5xl">
                <p className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-background/60">
                  AI travel memory system
                </p>

                <h1 className="max-w-5xl font-display text-5xl leading-[0.95] tracking-tight md:text-7xl xl:text-8xl">
                  Organize every trip into a beautiful{" "}
                  <span className="italic text-sunset">living memory.</span>
                </h1>

                <p className="mt-7 max-w-2xl text-base leading-8 text-background/68">
                  TripNest AI helps you collect destinations, notes, moods and
                  stories in one modern dashboard. Add trips, explore your map
                  and build a personal travel archive that feels premium.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={openCreateTripModal}
                    className="group inline-flex items-center justify-center gap-3 rounded-full bg-sunset px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-foreground shadow-[0_20px_45px_-22px_rgba(233,155,109,0.95)] transition hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <span>Create Trip</span>
                    <span className="flex size-7 items-center justify-center rounded-full bg-white/55 transition group-hover:translate-x-1">
                      →
                    </span>
                  </button>

                  <a
                    href="#trips"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-background shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-white/15"
                  >
                    View Trips
                  </a>
                </div>
              </div>

              <div className="mt-10 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
                <MiniMetric label="Trips" value={stats.totalTrips} />
                <MiniMetric label="Countries" value={stats.totalCountries} />
                <MiniMetric label="Cities" value={stats.totalCities} />
                <MiniMetric label="Memory score" value={`${memoryCompletion}%`} />
              </div>
            </div>
          </div>

          <aside className="rounded-[3rem] bg-white p-6 shadow-[0_35px_90px_-55px_rgba(20,32,51,0.75)] ring-1 ring-black/5 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40">
                  Quick Actions
                </p>
                <h2 className="mt-2 font-display text-4xl">Control Panel</h2>
              </div>

              <div className="flex size-14 items-center justify-center rounded-2xl bg-foreground text-xl text-background shadow-lg">
                ✨
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                onClick={openCreateTripModal}
                className="group rounded-[2rem] bg-foreground p-5 text-left text-background shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex size-12 items-center justify-center rounded-full bg-sunset text-lg font-black text-foreground">
                    +
                  </span>

                  <span className="text-right text-xs font-bold uppercase tracking-[0.18em] text-background/45">
                    Primary
                  </span>
                </div>

                <h3 className="mt-5 font-display text-3xl">Add new trip</h3>

                <p className="mt-2 text-sm leading-relaxed text-background/55">
                  Save a destination, date, mood and travel description.
                </p>

                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-sunset">
                  Start now{" "}
                  <span className="transition group-hover:translate-x-1">→</span>
                </span>
              </button>

              <QuickActionLink
                href="#map"
                icon="⌖"
                title="Open Memory Map"
                description="Explore locations visually"
              />

              <QuickActionLink
                href="#ai"
                icon="AI"
                title="Ask TripNest AI"
                description="Generate stories and captions"
              />

              <QuickActionLink
                href="#companion"
                icon="◎"
                title="AI Travel Companion"
                description="Location, camera and nearby places"
              />

            </div>
          </aside>
        </section>

        <section className="relative z-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Total Trips"
            value={String(stats.totalTrips).padStart(2, "0")}
            description="Trips saved in your account"
            icon="🧳"
          />

          <StatCard
            label="Countries"
            value={String(stats.totalCountries).padStart(2, "0")}
            description="Different countries visited"
            icon="🌍"
          />

          <StatCard
            label="Cities"
            value={String(stats.totalCities).padStart(2, "0")}
            description="Cities or places added"
            icon="🏙️"
          />

          <StatCard
            label="AI Moments"
            value={String(aiMoments).padStart(2, "0")}
            description={
              latestTrip ? `Latest: ${latestTrip.title}` : "AI insights ready"
            }
            icon="🤖"
            accent
          />
        </section>

        <section className="relative z-10 grid grid-cols-1 gap-6 xl:grid-cols-[0.65fr_1.35fr]">
          <aside className="rounded-[3rem] bg-white p-6 shadow-xl ring-1 ring-black/5 md:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40">
              Latest Memory
            </p>

            <h2 className="mt-2 font-display text-4xl">Recent highlight</h2>

            {latestTrip ? (
              <div className="mt-6">
                <button
                  onClick={() => openTripDetails(latestTrip)}
                  className="group block w-full overflow-hidden rounded-[2rem] text-left"
                >
                  <div className="relative h-56 overflow-hidden rounded-[2rem] bg-background">
                    <img
                      src={latestTrip.cover_image_url || heroMap}
                      alt={latestTrip.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                    <span
                      className={`absolute bottom-4 left-4 inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${getMoodClass(
                        latestTrip.mood
                      )}`}
                    >
                      {latestTrip.mood || "Memory"}
                    </span>
                  </div>
                </button>

                <h3 className="mt-5 font-display text-3xl leading-tight">
                  {latestTrip.title}
                </h3>

                <p className="mt-2 text-sm text-foreground/50">
                  {latestTrip.city ? `${latestTrip.city}, ` : ""}
                  {latestTrip.country}
                </p>

                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-foreground/60">
                  {latestTrip.description ||
                    "Add notes and photos to make this memory richer."}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openTripDetails(latestTrip)}
                    className="rounded-full bg-foreground px-5 py-3 text-sm font-black text-background shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Open
                  </button>

                  <button
                    onClick={() => openEditTripModal(latestTrip)}
                    className="rounded-full border border-black/10 bg-background px-5 py-3 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-sunset/25"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-[2rem] border border-dashed border-black/10 bg-background p-6 text-center">
                <p className="text-5xl">🧭</p>

                <h3 className="mt-5 font-display text-3xl">No trips yet.</h3>

                <p className="mt-3 text-sm text-foreground/60">
                  Create your first trip and it will appear here.
                </p>

                <button
                  onClick={openCreateTripModal}
                  className="mt-6 rounded-full bg-sunset px-6 py-3 text-sm font-black uppercase tracking-widest text-foreground shadow-lg"
                >
                  Create First Trip
                </button>
              </div>
            )}
          </aside>

          <div
            id="map"
            className="relative min-h-[560px] overflow-hidden rounded-[3rem] bg-sky/20 shadow-[0_35px_90px_-55px_rgba(20,32,51,0.75)] ring-1 ring-black/5"
          >
            <img
              src={heroMap}
              alt="World memory map"
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />

            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/55" />

            {trips.slice(0, 6).map((trip, index) => {
              const position = mapPositions[index];

              return (
                <button
                  key={trip.id}
                  onClick={() => openTripDetails(trip)}
                  className="group absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
                  style={{ top: position.top, left: position.left }}
                >
                  <span className="mb-2 rounded-full bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-foreground opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100">
                    {trip.country}
                  </span>

                  <span
                    className={`relative size-5 rounded-full shadow-xl ring-4 ring-white/75 ${getPinColor(
                      trip.mood
                    )}`}
                  >
                    <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-30" />
                  </span>
                </button>
              );
            })}

            <div className="absolute left-6 right-6 top-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="rounded-[2rem] bg-white/85 p-5 shadow-lg backdrop-blur">
                <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                  Interactive
                </span>

                <h2 className="mt-1 font-display text-4xl tracking-tight">
                  Your Memory Map
                </h2>
              </div>

              <button
                onClick={openCreateTripModal}
                className="rounded-full bg-foreground px-6 py-3 text-[10px] font-black uppercase tracking-widest text-background shadow-xl transition hover:-translate-y-0.5"
              >
                Add Place
              </button>
            </div>

            {trips.length === 0 && (
              <div className="absolute bottom-6 left-6 right-6 rounded-[2rem] bg-white/85 p-5 shadow-lg backdrop-blur">
                <p className="text-sm text-foreground/60">
                  Your map is empty. Add a trip to start placing memories around
                  the world.
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          id="ai"
          className="relative z-10 grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="relative overflow-hidden rounded-[3rem] bg-foreground p-6 text-background shadow-[0_35px_90px_-55px_rgba(20,32,51,0.85)] md:p-8">
            <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-sunset/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-8 size-72 rounded-full bg-sky/15 blur-3xl" />

            <div className="relative mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-sunset text-foreground shadow-lg">
                  <span className="size-2 animate-pulse rounded-full bg-foreground" />
                </span>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-background/40">
                    Functional AI Assistant
                  </p>

                  <h3 className="font-display text-5xl italic">Ask TripNest</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyAiAnswer}
                disabled={!lastAssistantMessage}
                className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-background/70 transition hover:-translate-y-0.5 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {aiCopied ? "Copied" : "Copy answer"}
              </button>
            </div>

            <p className="relative mb-6 max-w-2xl text-sm leading-relaxed text-background/60">
              This AI section is connected to your real trip data. It can
              summarize memories, find moods, create captions, generate travel
              stories and suggest next-trip ideas from the trips saved in your
              dashboard.
            </p>

            <div className="relative grid gap-3 md:grid-cols-2">
              {aiPrompts.map((item) => (
                <button
                  key={item.prompt}
                  type="button"
                  onClick={() => void askTripNestAI(item.prompt)}
                  disabled={aiLoading}
                  className="group rounded-[2rem] border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-full bg-white/10 font-black text-sunset">
                      {item.icon}
                    </span>

                    <span className="font-mono text-[10px] uppercase tracking-widest text-background/35">
                      {item.tag}
                    </span>
                  </div>

                  <span className="text-sm leading-relaxed text-background/80">
                    “{item.prompt}”
                  </span>
                </button>
              ))}
            </div>

            <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
              <div className="max-h-[430px] space-y-4 overflow-y-auto p-4 md:p-5">
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-[1.75rem] px-5 py-4 shadow-sm ${
                        message.role === "user"
                          ? "bg-sunset text-foreground"
                          : "border border-white/10 bg-white/10 text-background"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest opacity-55">
                          {message.role === "user" ? "You" : "TripNest AI"}
                        </span>

                        <span className="text-[10px] font-bold opacity-45">
                          {message.createdAt}
                        </span>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-4 text-sm text-background/65">
                      <span className="mr-2 inline-flex size-2 animate-pulse rounded-full bg-sunset" />
                      TripNest AI is analyzing your memories...
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleAskSubmit}
                className="border-t border-white/10 bg-black/10 p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={aiQuestion}
                    onChange={(event) => setAiQuestion(event.target.value)}
                    type="text"
                    placeholder="Ask about your memories, e.g. write a caption for my latest trip..."
                    className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-background outline-none placeholder:text-background/40 focus:ring-2 focus:ring-sunset/30"
                  />

                  <button
                    type="submit"
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="rounded-full bg-sunset px-7 py-3 text-sm font-black uppercase tracking-widest text-foreground shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiLoading ? "Thinking" : "Ask"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="rounded-[3rem] bg-white p-8 shadow-xl ring-1 ring-black/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
              Travel Personality
            </p>

            <h2 className="mt-3 font-display text-5xl">
              {trips.length === 0
                ? "Memory Collector"
                : dominantMood
                  ? `${dominantMood.mood} Explorer`
                  : "Explorer in Progress"}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-foreground/60">
              TripNest AI analyzes your destinations, notes, moods and travel
              patterns to create a personalized memory profile.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {aiInsights.map((insight) => (
                <div
                  key={insight.label}
                  className="rounded-[2rem] bg-background p-5 ring-1 ring-black/5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                      {insight.icon}
                    </span>

                    <span className="font-mono text-[9px] uppercase tracking-widest text-foreground/35">
                      {insight.label}
                    </span>
                  </div>

                  <p className="font-display text-2xl leading-tight">
                    {insight.value}
                  </p>

                  <p className="mt-2 text-xs leading-relaxed text-foreground/50">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[2rem] bg-background p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-foreground/60">
                  Memory completion
                </span>
                <span className="font-black">{memoryCompletion}%</span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-sunset transition-all"
                  style={{ width: `${memoryCompletion}%` }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {moodStats.map((item) => (
                <div key={item.mood}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold">{item.mood}</span>

                    <span className="text-foreground/40">
                      {item.count} trips
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{
                        width: `${
                          item.count > 0 ? Math.max(item.percentage, 7) : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AITravelCompanion />

        <section id="trips" className="relative z-10 space-y-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                Archives
              </span>

              <h2 className="font-display text-6xl tracking-tight">
                Recent Journeys
              </h2>

              <p className="mt-3 max-w-2xl text-foreground/60">
                Search, filter, open, edit and manage your saved trips from one
                clean dashboard.
              </p>
            </div>

            <button
              onClick={openCreateTripModal}
              className="rounded-full bg-sunset px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-foreground shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Create New Trip
            </button>
          </div>

          <div className="rounded-[2.5rem] bg-white p-5 shadow-xl ring-1 ring-black/5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_220px]">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="text"
                placeholder="Search by title, country, city, mood or description..."
                className={inputClass}
              />

              <select
                value={moodFilter}
                onChange={(event) =>
                  setMoodFilter(event.target.value as TripMood | "All")
                }
                className={selectClass}
              >
                <option value="All">All moods</option>
                {TRIP_MOODS.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>

              <select
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value)}
                className={selectClass}
              >
                <option value="All">All countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <FilterChip
                active={moodFilter === "All" && countryFilter === "All"}
                onClick={() => {
                  setMoodFilter("All");
                  setCountryFilter("All");
                }}
              >
                All memories
              </FilterChip>

              {TRIP_MOODS.slice(0, 4).map((mood) => (
                <FilterChip
                  key={mood}
                  active={moodFilter === mood}
                  onClick={() => setMoodFilter(mood)}
                >
                  {mood}
                </FilterChip>
              ))}
            </div>
          </div>

          {filteredTrips.length === 0 ? (
            <div className="rounded-[3rem] bg-white p-10 text-center shadow-2xl ring-1 ring-black/5">
              <p className="text-6xl">🧭</p>

              <h3 className="mt-4 font-display text-5xl font-bold">
                No trips found.
              </h3>

              <p className="mt-3 text-foreground/60">
                Create your first trip or change your filters.
              </p>

              <button
                onClick={openCreateTripModal}
                className="mt-6 rounded-full bg-sunset px-7 py-4 text-sm font-black uppercase tracking-widest text-foreground shadow-lg transition hover:-translate-y-0.5"
              >
                Create First Trip
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredTrips.map((trip, index) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={index}
                  onOpen={openTripDetails}
                  onEdit={openEditTripModal}
                  onDelete={handleDeleteTrip}
                  deleting={deletingTripId === trip.id}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="relative z-10 mt-12 border-t border-foreground/5 px-8 py-12">
          <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/40 md:flex-row">
            <p>© 2026 TripNest AI</p>
            <p>Organize less. Remember more.</p>
          </div>
        </footer>
      </div>

      {isTripModalOpen && (
        <TripModal
          form={form}
          setForm={setForm}
          moods={[...TRIP_MOODS]}
          editingTrip={editingTrip}
          savingTrip={savingTrip}
          onClose={closeTripModal}
          onSubmit={handleSaveTrip}
        />
      )}

      {isDetailsOpen && selectedTrip && (
        <TripDetailsPanel
          key={selectedTrip.id}
          trip={selectedTrip}
          onClose={closeTripDetails}
          onEdit={() => {
            closeTripDetails();
            openEditTripModal(selectedTrip);
          }}
          onDelete={() => handleDeleteTrip(selectedTrip)}
          deleting={deletingTripId === selectedTrip.id}
        />
      )}
    </AppShell>
  );
}

type BuildAiInsightsInput = {
  trips: Trip[];
  countries: string[];
  moodStats: Array<{ mood: TripMood; count: number; percentage: number }>;
  memoryCompletion: number;
  dominantMood: { mood: TripMood; count: number; percentage: number } | null;
  latestTrip: Trip | undefined;
};

type GenerateTripNestAnswerInput = {
  question: string;
  trips: Trip[];
  countries: string[];
  moodStats: Array<{ mood: TripMood; count: number; percentage: number }>;
  latestTrip: Trip | undefined;
  dominantMood: { mood: TripMood; count: number; percentage: number } | null;
  memoryCompletion: number;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatShortTime() {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function buildAiInsights({
  trips,
  countries,
  moodStats,
  memoryCompletion,
  dominantMood,
  latestTrip,
}: BuildAiInsightsInput): AiInsight[] {
  const completedTrips = trips.filter((trip) => trip.description?.trim()).length;
  const topCountry = getMostRepeatedValue(trips.map((trip) => trip.country));

  return [
    {
      label: "Profile",
      value:
        trips.length === 0
          ? "New Explorer"
          : dominantMood
            ? `${dominantMood.mood} Traveler`
            : "Active Traveler",
      description:
        trips.length === 0
          ? "Add your first trip so AI can build your travel profile."
          : `Your most frequent mood is based on ${dominantMood?.count ?? 0} saved memories.`,
      icon: "🧠",
    },
    {
      label: "Coverage",
      value: `${countries.length} ${
        countries.length === 1 ? "Country" : "Countries"
      }`,
      description:
        countries.length === 0
          ? "Your country map will grow as you add destinations."
          : topCountry
            ? `Most repeated destination: ${topCountry}.`
            : "Your destinations are nicely distributed.",
      icon: "🌍",
    },
    {
      label: "Story Data",
      value: `${memoryCompletion}% Complete`,
      description:
        completedTrips === 0
          ? "Add descriptions to unlock better stories and captions."
          : `${completedTrips} memories have descriptions that AI can use.`,
      icon: "✍️",
    },
    {
      label: "Latest",
      value: latestTrip ? latestTrip.title : "No Trip Yet",
      description: latestTrip
        ? `${formatTripPlace(
            latestTrip
          )} is ready for AI captions and story generation.`
        : "Create a trip to activate latest-memory suggestions.",
      icon: "✨",
    },
  ];
}

function generateTripNestAnswer({
  question,
  trips,
  countries,
  moodStats,
  latestTrip,
  dominantMood,
  memoryCompletion,
}: GenerateTripNestAnswerInput) {
  const normalizedQuestion = question.toLowerCase();

  if (trips.length === 0) {
    return [
      "I do not see any saved trips yet, so I cannot analyze real memories at the moment.",
      "",
      "Start by clicking Create Trip and add at least: trip name, country, city, mood and a short description.",
      "After that, I can generate captions, stories, peaceful memories, next-trip ideas and a travel profile from your saved data.",
    ].join("\n");
  }

  if (
    includesAny(normalizedQuestion, [
      "caption",
      "instagram",
      "post",
      "quote",
      "mbishkrim",
    ])
  ) {
    const trip = findBestTripMatch(question, trips) ?? latestTrip ?? trips[0];
    return generateCaptionAnswer(trip);
  }

  if (
    includesAny(normalizedQuestion, [
      "story",
      "tregim",
      "narrative",
      "latest trip",
      "latest memory",
    ])
  ) {
    const trip = findBestTripMatch(question, trips) ?? latestTrip ?? trips[0];
    return generateStoryAnswer(trip);
  }

  if (
    includesAny(normalizedQuestion, [
      "peaceful",
      "calm",
      "relax",
      "quiet",
      "paqe",
      "qete",
      "qetë",
    ])
  ) {
    const calmTrips = getTripsByMood(trips, [
      "Relaxed",
      "Romantic",
      "Cultural",
    ]);

    return generateMoodAnswer(
      calmTrips.length > 0 ? calmTrips : trips,
      "These are the memories that feel the most peaceful from your saved trips:"
    );
  }

  if (
    includesAny(normalizedQuestion, [
      "summary",
      "summarize",
      "analyze",
      "profile",
      "overview",
      "stat",
      "who am i",
      "personality",
      "permbledh",
      "përmbledh",
    ])
  ) {
    return generateSummaryAnswer({
      trips,
      countries,
      moodStats,
      dominantMood,
      memoryCompletion,
    });
  }

  if (
    includesAny(normalizedQuestion, [
      "where",
      "country",
      "countries",
      "city",
      "cities",
      "visited",
      "places",
      "destinations",
      "ku",
      "shtet",
      "qytet",
    ])
  ) {
    return generatePlacesAnswer(trips, countries);
  }

  if (
    includesAny(normalizedQuestion, [
      "recommend",
      "suggest",
      "next",
      "idea",
      "plan",
      "propozo",
      "sugjero",
    ])
  ) {
    return generateRecommendationAnswer({ trips, dominantMood });
  }

  const matchedTrips = rankTripsByQuery(question, trips).slice(0, 3);

  return [
    "Here is what I found from your travel memories:",
    "",
    ...matchedTrips.map((trip, index) => `${index + 1}. ${formatTripLine(trip)}`),
    "",
    latestTrip
      ? `Your latest saved memory is ${latestTrip.title}. You can ask me: “write a story for ${latestTrip.title}”, “make a caption”, or “suggest my next trip idea”.`
      : "You can ask me to create a story, caption, summary or next-trip ideas.",
  ].join("\n");
}

function generateCaptionAnswer(trip: Trip) {
  const place = formatTripPlace(trip);
  const mood = trip.mood ?? "memorable";
  const descriptionHint = trip.description?.trim()
    ? ` Inspired by your note: ${trip.description.trim()}`
    : "";

  return [
    `Caption for ${trip.title}:`,
    "",
    `“${place} felt like a ${mood.toLowerCase()} chapter I will always want to revisit.”`,
    "",
    "Alternative caption:",
    `“Collecting moments in ${place}, one memory at a time.”`,
    "",
    `Hashtags: #TripNest #TravelMemory #${sanitizeHashtag(
      trip.country
    )} #${sanitizeHashtag(mood)}${
      trip.city ? ` #${sanitizeHashtag(trip.city)}` : ""
    }`,
    descriptionHint,
  ].join("\n");
}

function generateStoryAnswer(trip: Trip) {
  const place = formatTripPlace(trip);
  const dateRange = formatDateRange(trip.start_date, trip.end_date);
  const description = trip.description?.trim();

  return [
    `Short story from ${trip.title}:`,
    "",
    `The memory begins in ${place}${
      dateRange ? `, during ${dateRange}` : ""
    }. The mood of this trip feels ${
      trip.mood?.toLowerCase() ?? "special"
    }, like a chapter saved not only as a destination, but as a feeling.`,
    description
      ? `What makes it personal is this detail: ${description}`
      : "Even without many notes yet, this trip already has the shape of a story: a place, a mood, and a moment worth keeping.",
    "",
    "AI suggestion: add 2-3 specific details, such as food, weather, people or a favorite place, and I can make this story much richer.",
  ].join("\n");
}

function generateMoodAnswer(trips: Trip[], intro: string) {
  return [
    intro,
    "",
    ...trips.slice(0, 5).map((trip, index) => `${index + 1}. ${formatTripLine(trip)}`),
    "",
    "AI tip: peaceful memories usually become better stories when you add small sensory details like colors, weather, sounds or a favorite view.",
  ].join("\n");
}

function generateSummaryAnswer({
  trips,
  countries,
  moodStats,
  dominantMood,
  memoryCompletion,
}: Pick<
  GenerateTripNestAnswerInput,
  "trips" | "countries" | "moodStats" | "dominantMood" | "memoryCompletion"
>) {
  const topMoods = [...moodStats]
    .sort((a, b) => b.count - a.count)
    .filter((item) => item.count > 0)
    .slice(0, 3);

  return [
    "TripNest AI summary:",
    "",
    `• Total trips: ${trips.length}`,
    `• Countries: ${
      countries.length > 0 ? countries.join(", ") : "No countries yet"
    }`,
    `• Main travel personality: ${
      dominantMood ? `${dominantMood.mood} Explorer` : "Memory Collector"
    }`,
    `• Memory completion: ${memoryCompletion}%`,
    `• Top moods: ${
      topMoods.length > 0
        ? topMoods.map((item) => `${item.mood} (${item.count})`).join(", ")
        : "No mood pattern yet"
    }`,
    "",
    memoryCompletion < 50
      ? "Recommendation: add richer descriptions to your trips so AI can generate stronger stories and captions."
      : "Recommendation: your archive has enough detail for strong AI-generated stories, captions and highlights.",
  ].join("\n");
}

function generatePlacesAnswer(trips: Trip[], countries: string[]) {
  const cities = Array.from(
    new Set(
      trips
        .map((trip) => trip.city)
        .filter((city): city is string => Boolean(city))
    )
  );

  return [
    "Your saved travel places:",
    "",
    `Countries: ${
      countries.length > 0 ? countries.join(", ") : "No countries saved"
    }`,
    `Cities: ${cities.length > 0 ? cities.join(", ") : "No cities saved"}`,
    "",
    "Recent places:",
    ...trips.slice(0, 5).map((trip, index) => `${index + 1}. ${formatTripLine(trip)}`),
  ].join("\n");
}

function generateRecommendationAnswer({
  trips,
  dominantMood,
}: Pick<GenerateTripNestAnswerInput, "trips" | "dominantMood">) {
  const favoriteCountry = getMostRepeatedValue(trips.map((trip) => trip.country));
  const mood = dominantMood?.mood ?? "Adventurous";

  const recommendationByMood: Record<string, string> = {
    Adventurous: "a mountain hike, island trip or road trip with many stops",
    Relaxed: "a calm seaside town, lake cabin or wellness weekend",
    Cultural: "a city with museums, old streets, galleries and local food",
    Romantic: "a sunset destination, historic city or quiet coastal place",
    Foodie: "a food-focused city with markets, cafés and local restaurants",
  };

  return [
    "Next-trip idea based on your memories:",
    "",
    `Because your profile looks mostly ${mood.toLowerCase()}, I would suggest ${
      recommendationByMood[mood] ??
      "a balanced destination with culture, food and nature"
    }.`,
    favoriteCountry
      ? `You also seem connected to ${favoriteCountry}, so you could either revisit it with a new theme or choose a nearby country for contrast.`
      : "After you add more countries, I can make this recommendation more personal.",
    "",
    "Suggested plan: choose one city, add 3 places you want to visit, then let TripNest AI create a mini itinerary and captions.",
  ].join("\n");
}

function findBestTripMatch(question: string, trips: Trip[]) {
  const rankedTrips = rankTripsByQuery(question, trips);
  return rankedTrips[0] ?? null;
}

function rankTripsByQuery(question: string, trips: Trip[]) {
  const queryWords = question
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2);

  return [...trips].sort((a, b) => {
    return getTripMatchScore(b, queryWords) - getTripMatchScore(a, queryWords);
  });
}

function getTripMatchScore(trip: Trip, queryWords: string[]) {
  const text = [trip.title, trip.country, trip.city, trip.mood, trip.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return queryWords.reduce(
    (score, word) => score + (text.includes(word) ? 1 : 0),
    0
  );
}

function getTripsByMood(trips: Trip[], moods: string[]) {
  return trips.filter((trip) => trip.mood && moods.includes(trip.mood));
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function formatTripPlace(trip: Trip) {
  return (
    [trip.city, trip.country].filter(Boolean).join(", ") ||
    trip.country ||
    trip.title
  );
}

function formatTripLine(trip: Trip) {
  const place = formatTripPlace(trip);
  const date = formatDateRange(trip.start_date, trip.end_date);
  const mood = trip.mood ? `Mood: ${trip.mood}` : "Mood not set";

  const description = trip.description?.trim()
    ? ` — ${trip.description.trim().slice(0, 120)}${
        trip.description.trim().length > 120 ? "..." : ""
      }`
    : "";

  return `${trip.title} • ${place}${
    date ? ` • ${date}` : ""
  } • ${mood}${description}`;
}

function sanitizeHashtag(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "");
}

function getMostRepeatedValue(values: Array<string | null | undefined>) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    const key = value?.trim();

    if (!key) return acc;

    acc[key] = (acc[key] ?? 0) + 1;

    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function DashboardLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-white shadow-2xl ring-1 ring-black/5">
          <span className="size-3 animate-pulse rounded-full bg-sunset" />
        </div>

        <p className="font-display text-5xl font-bold">TripNest AI</p>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">
          Opening your travel dashboard...
        </p>
      </div>
    </div>
  );
}

type MiniMetricProps = {
  label: string;
  value: string | number;
};

function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur transition hover:bg-white/15">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-background/45">
        {label}
      </p>

      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: string;
  accent?: boolean;
};

function StatCard({ label, value, description, icon, accent }: StatCardProps) {
  return (
    <div className="group rounded-[2.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-[0_25px_70px_-45px_rgba(20,32,51,0.75)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div
          className={`flex size-12 items-center justify-center rounded-2xl text-xl shadow-sm ${
            accent ? "bg-sunset/75" : "bg-background"
          }`}
        >
          {icon}
        </div>

        <span className="h-px flex-1 bg-gradient-to-r from-black/10 to-transparent" />
      </div>

      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-foreground/40">
        {label}
      </p>

      <p
        className={`font-display text-4xl ${
          accent ? "italic text-sunset" : ""
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-foreground/50">
        {description}
      </p>
    </div>
  );
}

type FilterChipProps = {
  active: boolean;
  children: string;
  onClick: () => void;
};

function FilterChip({ active, children, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-xs font-black transition ${
        active
          ? "bg-foreground text-background shadow-lg"
          : "bg-background text-foreground/60 hover:-translate-y-0.5 hover:bg-foreground hover:text-background"
      }`}
    >
      {children}
    </button>
  );
}

type QuickActionLinkProps = {
  icon: string;
  title: string;
  description: string;
  href: string;
};

function QuickActionLink({
  icon,
  title,
  description,
  href,
}: QuickActionLinkProps) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-4 rounded-[1.75rem] border border-black/5 bg-background p-4 text-left transition hover:-translate-y-0.5 hover:bg-sunset/20"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-sm font-black text-foreground shadow-sm">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-foreground">{title}</span>
        <span className="mt-1 block text-xs text-foreground/45">
          {description}
        </span>
      </span>

      <span className="text-foreground/40 transition group-hover:translate-x-1 group-hover:text-sunset">
        →
      </span>
    </a>
  );
}

type ModalFieldProps = {
  label: string;
  children: ReactNode;
};

function ModalField({ label, children }: ModalFieldProps) {
  return (
    <div className="rounded-[2rem] bg-background p-5 ring-1 ring-black/5">
      <label className="text-sm font-black text-foreground">{label}</label>
      {children}
    </div>
  );
}

type TripModalProps = {
  form: CreateTripInput;
  setForm: Dispatch<SetStateAction<CreateTripInput>>;
  moods: TripMood[];
  editingTrip: Trip | null;
  savingTrip: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function TripModal({
  form,
  setForm,
  moods,
  editingTrip,
  savingTrip,
  onClose,
  onSubmit,
}: TripModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[3rem] bg-white p-6 shadow-[0_35px_100px_-45px_rgba(0,0,0,0.75)] ring-1 ring-white/20 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-sunset/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-sky/20 blur-3xl" />

        <div className="relative mb-7 flex flex-col items-start justify-between gap-4 md:flex-row">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
              {editingTrip ? "Edit memory" : "New memory"}
            </p>

            <h2 className="mt-2 font-display text-4xl tracking-tight md:text-6xl">
              {editingTrip ? "Edit trip" : "Create a new trip"}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/50">
              Add the most important details about this journey. You can improve
              it later with photos, notes and AI-generated memories.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-background"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="relative space-y-5">
          <ModalField label="Trip name">
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Italy Summer 2026"
              className={inputClass}
            />
          </ModalField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Country">
              <input
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    country: event.target.value,
                  }))
                }
                placeholder="Italy"
                className={inputClass}
              />
            </ModalField>

            <ModalField label="City">
              <input
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                placeholder="Rome"
                className={inputClass}
              />
            </ModalField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ModalField label="Start date">
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </ModalField>

            <ModalField label="End date">
              <input
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </ModalField>

            <ModalField label="Mood">
              <select
                value={form.mood}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mood: event.target.value as TripMood,
                  }))
                }
                className={selectClass}
              >
                {moods.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </ModalField>
          </div>

          <ModalField label="Trip description">
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Write a short memory, plan or feeling about this trip..."
              rows={5}
              className={`${inputClass} resize-none`}
            />
          </ModalField>

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-[180px_1fr]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/10 bg-white px-6 py-4 text-sm font-black text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-background"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingTrip}
              className="rounded-full bg-sunset px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-foreground shadow-[0_18px_45px_-20px_rgba(233,155,109,0.95)] transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingTrip
                ? "Saving trip..."
                : editingTrip
                  ? "Update Trip"
                  : "Save Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}