const ALLOWED_SOURCES = new Set([
  "VIIRS_NOAA20_NRT",
  "VIIRS_SNPP_NRT",
  "VIIRS_NOAA21_NRT",
  "MODIS_NRT",
]);

const LIMITS = {
  west: -15,
  south: 25,
  east: 55,
  north: 60,
  maxWidth: 50,
  maxHeight: 25,
};

function validArea(value) {
  const coordinates = value.split(",").map(Number);
  if (coordinates.length !== 4 || coordinates.some((value) => !Number.isFinite(value))) return false;

  const [west, south, east, north] = coordinates;
  return west >= LIMITS.west && east <= LIMITS.east
    && south >= LIMITS.south && north <= LIMITS.north
    && west < east && south < north
    && east - west <= LIMITS.maxWidth
    && north - south <= LIMITS.maxHeight;
}

function json(message, status) {
  return Response.json({ error: message }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default async function handler(request) {
  if (request.method !== "GET") return json("Method not allowed", 405);

  const apiKey = process.env.NASA_FIRMS_MAP_KEY;
  if (!apiKey) return json("NASA FIRMS ist noch nicht konfiguriert.", 503);

  const url = new URL(request.url);
  const source = url.searchParams.get("source") || "";
  const area = url.searchParams.get("area") || "";
  const days = Number(url.searchParams.get("days"));

  if (!ALLOWED_SOURCES.has(source)) return json("Unbekannter Sensor.", 400);
  if (!Number.isInteger(days) || days < 1 || days > 5) return json("Ungültiger Zeitraum.", 400);
  if (!validArea(area)) return json("Das Gebiet liegt außerhalb des erlaubten Ausschnitts.", 400);

  const upstream = new URL("https://firms.modaps.eosdis.nasa.gov/api/area/csv/");
  upstream.pathname += [apiKey, source, area, String(days)].map(encodeURIComponent).join("/");

  try {
    const response = await fetch(upstream, { signal: AbortSignal.timeout(25000) });
    const body = await response.text();

    if (!response.ok || /Invalid MAP_KEY|not authorized/i.test(body)) {
      return json("NASA FIRMS konnte die Anfrage nicht ausführen.", response.status >= 400 ? response.status : 502);
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return json(timedOut ? "NASA FIRMS antwortet zu langsam." : "NASA FIRMS ist derzeit nicht erreichbar.", 502);
  }
}

export const config = {
  path: "/api/firms",
  method: "GET",
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
};
