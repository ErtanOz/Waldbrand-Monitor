const BOUNDS = {
  west: -15,
  south: 25,
  east: 55,
  north: 60,
};

function json(body, status, cacheControl = "no-store") {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default async function handler(request) {
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("latitude"));
  const longitude = Number(url.searchParams.get("longitude"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < BOUNDS.south || latitude > BOUNDS.north
      || longitude < BOUNDS.west || longitude > BOUNDS.east) {
    return json({ error: "Koordinaten außerhalb des erlaubten Ausschnitts." }, 400);
  }

  const upstream = new URL("https://api.open-meteo.com/v1/forecast");
  upstream.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    wind_speed_unit: "ms",
    timezone: "auto",
  });

  try {
    const response = await fetch(upstream, { signal: AbortSignal.timeout(10000) });
    const body = await response.json();

    if (!response.ok || !body.current) {
      return json({ error: "Open-Meteo konnte die Anfrage nicht ausführen." }, 502);
    }

    return json(body, 200, "public, max-age=60, s-maxage=600, stale-while-revalidate=600");
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return json({ error: timedOut ? "Open-Meteo antwortet zu langsam." : "Open-Meteo ist derzeit nicht erreichbar." }, 502);
  }
}

export const config = {
  path: "/api/weather",
  method: "GET",
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
};
