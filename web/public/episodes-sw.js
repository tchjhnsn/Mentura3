// Saved episodes (Torian, 2026-11-15 "Build all", reliability): an episode the person saves is kept in this
// browser's Cache Storage, and this worker plays it from there, so it keeps playing without the network. Only
// audio and video requests are looked at; everything else goes to the network untouched.
const CACHE = "reflect-episodes";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const r = event.request;
  if (r.method !== "GET" || (r.destination !== "audio" && r.destination !== "video")) return;
  event.respondWith((async () => {
    const kept = await caches.open(CACHE).then((c) => c.match(r.url, { ignoreVary: true, ignoreSearch: false }));
    if (!kept) return fetch(r);
    // A copy saved without CORS can't be read or cut, and can't answer a CORS request (sound tools on).
    if (kept.type === "opaque") return r.mode === "cors" ? fetch(r) : kept;
    const range = /^bytes=(\d+)-(\d*)$/.exec(r.headers.get("range") || "");
    if (!range) return kept;
    const blob = await kept.blob();
    const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), blob.size - 1) : blob.size - 1;
    if (start >= blob.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${blob.size}` } });
    return new Response(blob.slice(start, end + 1), {
      status: 206,
      headers: { "Content-Type": kept.headers.get("content-type") || "audio/mpeg", "Content-Range": `bytes ${start}-${end}/${blob.size}`, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" },
    });
  })());
});
