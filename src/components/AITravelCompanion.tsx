import { useEffect, useMemo, useRef, useState } from "react";

import {
  askNearbyAI,
  getReadableLocationName,
  getRealNearbyPlaces,
  type NearbyAIHighlight,
  type RealNearbyPlace,
} from "@/lib/realNearbyPlaces";

type PlaceCategory = "cafes" | "restaurants" | "attractions" | "museums";

type LiveLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  updatedAt: string;
  address: string;
};

type NearbyPlace = RealNearbyPlace;

const categories: Array<{
  id: PlaceCategory;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    id: "cafes",
    label: "Cafes",
    icon: "☕",
    description: "Real cafes near your current location.",
  },
  {
    id: "restaurants",
    label: "Restaurants",
    icon: "🍽️",
    description: "Real food places near you.",
  },
  {
    id: "attractions",
    label: "Attractions",
    icon: "🏛️",
    description: "Tourist places and interesting spots.",
  },
  {
    id: "museums",
    label: "Museums",
    icon: "🖼️",
    description: "Museums, galleries and cultural places.",
  },
];

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function formatAccuracy(value: number) {
  if (value < 1000) return `${Math.round(value)}m accuracy`;
  return `${(value / 1000).toFixed(1)}km accuracy`;
}

function formatDistance(distance: number) {
  if (!Number.isFinite(distance)) return "Nearby";
  if (distance < 1000) return `${Math.round(distance)}m`;
  return `${(distance / 1000).toFixed(1)}km`;
}

function formatRating(place: NearbyPlace) {
  if (!place.rating) return null;

  const reviews =
    place.userRatingCount > 0 ? ` · ${place.userRatingCount} reviews` : "";

  return `${place.rating.toFixed(1)} ★${reviews}`;
}

export function AITravelCompanion() {
  const [selectedCategory, setSelectedCategory] =
    useState<PlaceCategory>("cafes");

  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isLiveEnabled, setIsLiveEnabled] = useState(false);

  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState("");

  const [aiNeed, setAiNeed] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiRankedIds, setAiRankedIds] = useState<string[]>([]);
  const [aiHighlights, setAiHighlights] = useState<NearbyAIHighlight[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const lastPlacesQueryRef = useRef("");
  const placesRequestIdRef = useRef(0);

  const selectedCategoryLabel = useMemo(() => {
    return (
      categories.find((category) => category.id === selectedCategory)?.label ||
      "Places"
    );
  }, [selectedCategory]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!liveLocation) return;

    const queryKey = `${selectedCategory}-${liveLocation.latitude.toFixed(
      4
    )}-${liveLocation.longitude.toFixed(4)}`;

    if (lastPlacesQueryRef.current === queryKey) return;

    lastPlacesQueryRef.current = queryKey;

    async function loadNearbyPlaces() {
      if (!liveLocation) return;

      const requestId = placesRequestIdRef.current + 1;
      placesRequestIdRef.current = requestId;

      try {
        setPlacesLoading(true);
        setPlacesError("");
        setNearbyPlaces([]);

        setAiAnswer("");
        setAiRankedIds([]);
        setAiHighlights([]);
        setAiSuggestions([]);

        const places = await getRealNearbyPlaces({
          latitude: liveLocation.latitude,
          longitude: liveLocation.longitude,
          category: selectedCategory,
        });

        if (placesRequestIdRef.current !== requestId) return;

        setNearbyPlaces(places);

        if (places.length === 0) {
          setPlacesError(
            `No ${selectedCategoryLabel.toLowerCase()} found nearby. Try another category or refresh places.`
          );
        }
      } catch (error) {
        if (placesRequestIdRef.current !== requestId) return;

        const message =
          error instanceof Error
            ? error.message
            : "Could not load real nearby places.";

        setPlacesError(message);
        setNearbyPlaces([]);
      } finally {
        if (placesRequestIdRef.current === requestId) {
          setPlacesLoading(false);
        }
      }
    }

    void loadNearbyPlaces();
  }, [liveLocation, selectedCategory, selectedCategoryLabel]);

  async function savePosition(position: GeolocationPosition) {
    const { latitude, longitude, accuracy } = position.coords;

    const address = await getReadableLocationName({
      latitude,
      longitude,
    });

    setLiveLocation({
      latitude,
      longitude,
      accuracy,
      address,
      updatedAt: new Date().toLocaleTimeString("en", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  }

  function handleLocationError(error: GeolocationPositionError) {
    setLocationLoading(false);
    setIsLiveEnabled(false);

    if (error.code === error.PERMISSION_DENIED) {
      setLocationError(
        "Location permission was denied. Click the lock icon near the browser URL and allow Location."
      );
      return;
    }

    if (error.code === error.POSITION_UNAVAILABLE) {
      setLocationError("Current location is unavailable right now.");
      return;
    }

    if (error.code === error.TIMEOUT) {
      setLocationError("Location request timed out. Try again.");
      return;
    }

    setLocationError("Could not read your current location.");
  }

  function enableLiveLocation() {
    setLocationError("");
    setPlacesError("");

    if (!navigator.geolocation) {
      setLocationError("Your browser does not support live location.");
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setLocationError(
        "Live location works only on HTTPS or localhost. Run it on localhost or deploy with HTTPS."
      );
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await savePosition(position);
        setLocationLoading(false);
        setIsLiveEnabled(true);
      },
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        await savePosition(position);
        setLocationLoading(false);
        setIsLiveEnabled(true);
      },
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      }
    );

    watchIdRef.current = watchId;
  }

  function stopLiveLocation() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsLiveEnabled(false);
    setLocationLoading(false);
  }

  async function handleAskNearbyAI() {
    if (!liveLocation) {
      setPlacesError("Enable live location first.");
      return;
    }

    if (placesLoading) {
      setPlacesError("Please wait until real places finish loading.");
      return;
    }

    if (nearbyPlaces.length === 0) {
      setPlacesError(
        "No real nearby places were loaded yet, so AI has nothing to recommend."
      );
      return;
    }

    try {
      setAiLoading(true);
      setPlacesError("");
      setAiAnswer("");
      setAiRankedIds([]);
      setAiHighlights([]);
      setAiSuggestions([]);

      const result = await askNearbyAI({
        category: selectedCategoryLabel,
        userNeed:
          aiNeed.trim() ||
          `Recommend the best ${selectedCategoryLabel.toLowerCase()} near me.`,
        location: {
          latitude: liveLocation.latitude,
          longitude: liveLocation.longitude,
          address: liveLocation.address,
        },
        places: nearbyPlaces,
      });

      setAiAnswer(result.answer);
      setAiRankedIds(result.rankedPlaceIds ?? []);
      setAiHighlights(result.highlights ?? []);
      setAiSuggestions(result.suggestions ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI could not recommend places.";

      setPlacesError(message);
    } finally {
      setAiLoading(false);
    }
  }

  function refreshPlaces() {
    if (!liveLocation) return;

    lastPlacesQueryRef.current = "";
    setPlacesError("");
    setNearbyPlaces([]);
    setLiveLocation({ ...liveLocation });
  }

  const mapsUrl = liveLocation
    ? `https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`
    : "";

  return (
    <section
      id="companion"
      className="relative z-10 rounded-[3rem] bg-foreground p-6 text-background shadow-[0_35px_90px_-55px_rgba(20,32,51,0.85)] md:p-8"
    >
      <div className="relative z-20 mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-sky">
            Live location tools
          </p>

          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            Find what is near you
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-background/55">
            First, the app gets real nearby places from Google Places data. Then
            AI ranks and explains the best options based on your request.
          </p>
        </div>

        <div className="relative z-30 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={enableLiveLocation}
            disabled={locationLoading}
            className="relative z-30 cursor-pointer rounded-full bg-white/10 px-6 py-3 text-sm font-black uppercase tracking-widest text-background shadow-lg transition hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locationLoading
              ? "Locating..."
              : isLiveEnabled
                ? "Live On"
                : "Enable"}
          </button>

          <button
            type="button"
            onClick={stopLiveLocation}
            disabled={!isLiveEnabled}
            className="relative z-30 cursor-pointer rounded-full bg-sunset px-6 py-3 text-sm font-black uppercase tracking-widest text-foreground shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Stop live
          </button>
        </div>
      </div>

      {locationError && (
        <div className="relative z-20 mb-5 rounded-[1.5rem] border border-red-300/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-100">
          {locationError}
        </div>
      )}

      {liveLocation && (
        <div className="relative z-20 mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-background/40">
                  Your current location
                </p>

                <h3 className="mt-2 text-2xl font-black text-background">
                  {liveLocation.address}
                </h3>

                <p className="mt-2 text-sm text-background/55">
                  Updated at {liveLocation.updatedAt} ·{" "}
                  {formatAccuracy(liveLocation.accuracy)}
                </p>
              </div>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-background px-5 py-3 text-xs font-black uppercase tracking-widest text-foreground shadow-lg transition hover:-translate-y-0.5"
              >
                Maps
              </a>
            </div>
          </div>

          <CoordinateCard
            label="Latitude"
            value={formatCoordinate(liveLocation.latitude)}
          />

          <CoordinateCard
            label="Longitude"
            value={formatCoordinate(liveLocation.longitude)}
          />
        </div>
      )}

      {!liveLocation && (
        <div className="relative z-20 mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <p className="text-sm leading-7 text-background/60">
            Live location is not enabled yet. Click{" "}
            <span className="font-black text-sunset">Enable</span> and allow
            location permission in your browser.
          </p>
        </div>
      )}

      <div className="relative z-20 grid gap-3 md:grid-cols-4">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              lastPlacesQueryRef.current = "";
              setSelectedCategory(category.id);
            }}
            className={`cursor-pointer rounded-[1.6rem] border p-5 text-left transition hover:-translate-y-0.5 ${
              selectedCategory === category.id
                ? "border-sunset bg-sunset text-foreground shadow-xl"
                : "border-white/10 bg-white/5 text-background hover:bg-white/10"
            }`}
          >
            <span className="text-2xl">{category.icon}</span>

            <h3 className="mt-5 text-sm font-black">{category.label}</h3>

            <p
              className={`mt-2 text-xs leading-5 ${
                selectedCategory === category.id
                  ? "text-foreground/65"
                  : "text-background/45"
              }`}
            >
              {category.description}
            </p>
          </button>
        ))}
      </div>

      <div className="relative z-20 mt-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-background/35">
              Real nearby results
            </p>

            <h3 className="mt-1 text-2xl font-black">
              {selectedCategoryLabel} near you
            </h3>
          </div>

          {liveLocation && (
            <button
              type="button"
              onClick={refreshPlaces}
              disabled={placesLoading}
              className="rounded-full bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-background/70 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placesLoading ? "Loading..." : "Refresh places"}
            </button>
          )}
        </div>

        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-background/35">
            AI Recommendation Layer
          </p>

          <h3 className="mt-2 text-2xl font-black">
            Let AI choose from real map results
          </h3>

          <p className="mt-2 text-sm leading-7 text-background/55">
            These places come from Google Places data. AI does not invent places
            here; it only ranks and explains the real results shown below.
          </p>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <input
              value={aiNeed}
              onChange={(event) => setAiNeed(event.target.value)}
              placeholder="Example: I want a quiet cafe for studying and good photos..."
              className="w-full rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm text-background outline-none placeholder:text-background/35 focus:ring-4 focus:ring-sunset/20"
            />

            <button
              type="button"
              onClick={() => void handleAskNearbyAI()}
              disabled={aiLoading || !liveLocation || placesLoading}
              className="rounded-full bg-sunset px-6 py-3 text-xs font-black uppercase tracking-widest text-foreground shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading ? "Thinking..." : placesLoading ? "Wait..." : "Ask AI"}
            </button>
          </div>

          {aiAnswer && (
            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-background/35">
                AI Answer
              </p>

              <p className="whitespace-pre-line text-sm leading-7 text-background/75">
                {aiAnswer}
              </p>
            </div>
          )}

          {aiSuggestions.length > 0 && (
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-background/35">
                AI Suggestions
              </p>

              <ul className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <li
                    key={`${suggestion}-${index}`}
                    className="text-sm leading-6 text-background/70"
                  >
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {placesError && (
          <div className="mb-4 rounded-[1.5rem] border border-yellow-300/20 bg-yellow-500/10 px-5 py-4 text-sm font-semibold text-yellow-100">
            {placesError}
          </div>
        )}

        {!liveLocation ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
            <h3 className="text-2xl font-black">Enable location first</h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-background/55">
              After enabling location, this section will show real cafes,
              restaurants, attractions or museums near your current coordinates.
            </p>
          </div>
        ) : placesLoading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/10">
              <span className="size-3 animate-pulse rounded-full bg-sunset" />
            </div>

            <h3 className="text-2xl font-black">Loading real places...</h3>

            <p className="mt-2 text-sm text-background/55">
              Searching Google Places data near your current location.
            </p>
          </div>
        ) : nearbyPlaces.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
            <h3 className="text-2xl font-black">No results found</h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-background/55">
              Try another category or press Refresh places. Some areas may have
              fewer nearby results.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {nearbyPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                aiRank={
                  aiRankedIds.includes(place.id)
                    ? aiRankedIds.indexOf(place.id) + 1
                    : null
                }
                aiHighlight={
                  aiHighlights.find(
                    (highlight) => highlight.placeId === place.id
                  ) ?? null
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CoordinateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-background/35">
        {label}
      </p>

      <p className="mt-3 text-xl font-black">{value}</p>
    </div>
  );
}

function PlaceCard({
  place,
  aiRank,
  aiHighlight,
}: {
  place: NearbyPlace;
  aiRank: number | null;
  aiHighlight: NearbyAIHighlight | null;
}) {
  const mapsUrl =
    place.googleMapsUri ||
    `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;

  const ratingText = formatRating(place);

  const website =
    typeof place.tags?.website === "string" ? place.tags.website : "";

  return (
    <article
      className={`rounded-[1.7rem] border p-5 transition hover:-translate-y-0.5 ${
        aiRank
          ? "border-sunset bg-sunset/15 shadow-xl"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-background">
              {place.name}
            </h3>

            {aiRank && (
              <span className="rounded-full bg-sunset px-3 py-1 text-[10px] font-black uppercase tracking-widest text-foreground">
                AI #{aiRank}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm capitalize text-background/45">
            {place.type?.replace(/_/g, " ") || place.category}
          </p>

          {ratingText && (
            <p className="mt-1 text-xs font-bold text-sunset">{ratingText}</p>
          )}

          {place.openNow !== null && (
            <p
              className={`mt-1 text-xs font-bold ${
                place.openNow ? "text-emerald-200" : "text-red-200"
              }`}
            >
              {place.openNow ? "Open now" : "Closed now"}
            </p>
          )}
        </div>

        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-sunset">
          {formatDistance(place.distance)}
        </span>
      </div>

      <p className="text-sm leading-6 text-background/60">
        {place.description ||
          place.address ||
          "Real place found near your current location."}
      </p>

      {place.address && (
        <p className="mt-2 text-xs leading-5 text-background/40">
          {place.address}
        </p>
      )}

      {aiHighlight && (
        <div className="mt-4 rounded-[1.25rem] border border-sunset/20 bg-sunset/10 p-4">
          <p className="font-mono text-[9px] uppercase tracking-widest text-sunset">
            AI Recommendation
          </p>

          <p className="mt-2 text-sm leading-6 text-background/75">
            {aiHighlight.reason}
          </p>

          <p className="mt-2 text-xs font-bold text-background/45">
            Best for: {aiHighlight.bestFor}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-background/70 transition hover:bg-white/15"
        >
          Open in Maps
        </a>

        {website && (
          <a
            href={website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-background/70 transition hover:bg-white/15"
          >
            Website
          </a>
        )}
      </div>
    </article>
  );
}