// PS-Kids Service Worker — minimal, network-first
// Required for WebAPK/PWA installability. App needs internet for AI chat/games.

const CACHE_NAME = "ps-kids-v1";

const PRECACHE = ["/", "/manifest.json", "/pss.webp", "/icon-192x192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache API calls — they need live backend data
  if (url.pathname.startsWith("/api/")) return;

  // Network-first: try network, fall back to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
