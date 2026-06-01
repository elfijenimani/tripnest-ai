import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTrip as createTripService,
  deleteTrip as deleteTripService,
  getTrips,
  updateTrip as updateTripService,
} from "@/lib/trips-service";
import type {
  AppStatus,
  CreateTripInput,
  Trip,
  UpdateTripInput,
} from "@/lib/types";

export function useTrips(enabled: boolean) {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState("");

  const loadTrips = useCallback(async () => {
    if (!enabled) return;

    try {
      setStatus("loading");
      setError("");

      const result = await getTrips();

      if (!result.ok) {
        throw new Error(result.message);
      }

      setTrips(result.data);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load trips.";
      setError(message);
      setStatus("error");
    }
  }, [enabled]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  async function createTrip(input: CreateTripInput) {
    const result = await createTripService(input);

    if (!result.ok) {
      throw new Error(result.message);
    }

    setTrips((currentTrips) => [result.data, ...currentTrips]);
    return result.data;
  }

  async function updateTrip(input: UpdateTripInput) {
    const result = await updateTripService(input);

    if (!result.ok) {
      throw new Error(result.message);
    }

    setTrips((currentTrips) =>
      currentTrips.map((trip) =>
        trip.id === input.id ? result.data : trip
      )
    );

    return result.data;
  }

  async function deleteTrip(tripId: string) {
    const result = await deleteTripService(tripId);

    if (!result.ok) {
      throw new Error(result.message);
    }

    setTrips((currentTrips) =>
      currentTrips.filter((trip) => trip.id !== tripId)
    );
  }

  const countries = useMemo(() => {
    return Array.from(new Set(trips.map((trip) => trip.country))).filter(
      Boolean
    );
  }, [trips]);

  const stats = useMemo(() => {
    const totalCountries = new Set(trips.map((trip) => trip.country)).size;
    const totalCities = new Set(
      trips.map((trip) => trip.city).filter(Boolean)
    ).size;

    return {
      totalTrips: trips.length,
      totalCountries,
      totalCities,
      aiMoments: trips.length * 3,
    };
  }, [trips]);

  return {
    status,
    trips,
    countries,
    stats,
    error,
    reload: loadTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    setTrips,
  };
}