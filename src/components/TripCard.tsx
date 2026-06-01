import heroMap from "@/assets/hero-map.jpg";
import type { Trip } from "../lib/types";
import { formatDateRange, getMoodClass } from "../lib/ui-helpers";

type TripCardProps = {
  trip: Trip;
  index: number;
  onOpen: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
  deleting?: boolean;
};

export function TripCard({
  trip,
  index,
  onOpen,
  onEdit,
  onDelete,
  deleting,
}: TripCardProps) {
  return (
    <article
      className="group animate-reveal"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-5 bg-stone-100 ring-1 ring-black/5 shadow-lg">
        <img
          src={trip.cover_image_url || heroMap}
          alt={trip.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />

        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          <span
            className={`px-3 py-1 ${getMoodClass(
              trip.mood
            )} rounded-full text-[10px] font-medium uppercase tracking-wider`}
          >
            {trip.mood || "Memory"}
          </span>

          <span className="px-3 py-1 glass-card rounded-full text-[10px] font-medium uppercase tracking-wider">
            {trip.city || trip.country}
          </span>
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/70 mb-2">
            AI Summary
          </p>

          <p className="text-sm text-white leading-relaxed line-clamp-3">
            {trip.description ||
              "A new travel memory. Add photos, notes, and locations to make it richer."}
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl leading-tight">{trip.title}</h3>

          <p className="text-xs text-foreground/50 font-mono mt-1">
            {formatDateRange(trip.start_date, trip.end_date)} · {trip.country}
          </p>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
          0 ph
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => onOpen(trip)}
          className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background"
        >
          Open
        </button>

        <button
          onClick={() => onEdit(trip)}
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(trip)}
          disabled={deleting}
          className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}