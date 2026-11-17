// Where a place is, from OpenStreetMap's Nominatim (its usage policy: at most one request a second, a named client,
// results attributed). Only the place's words are sent, nothing about the person. Null when it cannot be found.
export async function geocode(place: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const q = place.trim().slice(0, 200);
  if (!q) return null;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: "jsonv2", limit: "1" })}`, {
      headers: { "user-agent": "Reflect/1.0 (personal planning app)", accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const [hit] = (await r.json()) as { lat: string; lon: string; display_name: string }[];
    return hit ? { lat: Number(hit.lat), lon: Number(hit.lon), name: hit.display_name } : null;
  } catch {
    return null;
  }
}
