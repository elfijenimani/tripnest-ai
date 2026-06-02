const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NearbyCategory = "cafes" | "restaurants" | "attractions" | "museums";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getGoogleTypes(category: NearbyCategory) {
  switch (category) {
    case "cafes":
      return ["cafe"];

    case "restaurants":
      return ["restaurant"];

    case "attractions":
      return ["tourist_attraction"];

    case "museums":
      return ["museum"];

    default:
      return ["cafe"];
  }
}

function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return Math.round(
    earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  try {
    const googlePlacesKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!googlePlacesKey) {
      return jsonResponse(
        { ok: false, error: "GOOGLE_PLACES_API_KEY is missing." },
        500
      );
    }

    const body = await req.json();

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const category = String(body.category ?? "cafes") as NearbyCategory;
    const radius = Number(body.radius ?? 2000);

    if (!latitude || !longitude) {
      return jsonResponse(
        { ok: false, error: "Latitude and longitude are required." },
        400
      );
    }

    const googleResponse = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googlePlacesKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.primaryType,places.googleMapsUri,places.regularOpeningHours",
        },
        body: JSON.stringify({
          includedTypes: getGoogleTypes(category),
          maxResultCount: 15,
          rankPreference: "DISTANCE",
          locationRestriction: {
            circle: {
              center: {
                latitude,
                longitude,
              },
              radius,
            },
          },
        }),
      }
    );

    const googleJson = await googleResponse.json();

    if (!googleResponse.ok) {
      return jsonResponse(
        {
          ok: false,
          error:
            googleJson?.error?.message ||
            "Google Places could not load nearby places.",
          places: [],
        },
        500
      );
    }

    const places = (googleJson.places ?? [])
      .map((place: any) => {
        const placeLat = place.location?.latitude;
        const placeLng = place.location?.longitude;

        if (!placeLat || !placeLng) {
          return null;
        }

        return {
          id: place.id,
          name: place.displayName?.text || "Unnamed place",
          type: place.primaryType || category,
          category,
          address: place.formattedAddress || "",
          latitude: placeLat,
          longitude: placeLng,
          distance: distanceInMeters(latitude, longitude, placeLat, placeLng),
          rating: place.rating ?? null,
          userRatingCount: place.userRatingCount ?? 0,
          googleMapsUri: place.googleMapsUri || "",
          openNow: place.regularOpeningHours?.openNow ?? null,
          tags: {
            types: place.types || [],
          },
          description: [
            place.formattedAddress,
            place.rating ? `Rating: ${place.rating}` : "",
            place.userRatingCount
              ? `${place.userRatingCount} reviews`
              : "",
          ]
            .filter(Boolean)
            .join(" • "),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }

        return (b.rating || 0) - (a.rating || 0);
      });

    return jsonResponse({
      ok: true,
      places,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return jsonResponse(
      {
        ok: false,
        error: message,
        places: [],
      },
      500
    );
  }
});