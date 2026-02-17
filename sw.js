const CACHE_NAME = "golfbuild-v8";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/favicon.svg",
  "/manifest.webmanifest"
];
const APP_SHELL_PATHS = new Set([
  "/",
  "/index.html",
  "/drills",
  "/routine",
  "/stats",
  "/app.js",
  "/styles.css",
  "/manifest.webmanifest"
]);

function getContentType(response) {
  return (response.headers.get("content-type") || "").toLowerCase();
}

function isValidForRequest(request, response) {
  if (!response || !response.ok) return false;
  const url = new URL(request.url);
  const ct = getContentType(response);

  if (request.mode === "navigate") {
    return ct.includes("text/html");
  }
  if (url.pathname.endsWith(".css")) return ct.includes("text/css");
  if (url.pathname.endsWith(".js")) return ct.includes("javascript");
  if (url.pathname.endsWith(".webmanifest")) return ct.includes("json") || ct.includes("manifest");
  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  // Always prefer fresh HTML shells to avoid stale route/layout regressions.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (isValidForRequest(event.request, response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Network-first for API calls
  if (url.pathname.startsWith("/api/")) {
    // Never cache auth endpoints — stale auth responses cause false logouts
    if (url.pathname.startsWith("/api/auth/")) {
      event.respondWith(fetch(event.request));
      return;
    }
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (isValidForRequest(event.request, response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first for core app shell files to avoid stale UI lock bugs
  if (APP_SHELL_PATHS.has(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (isValidForRequest(event.request, response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Update cache in background
        fetch(event.request).then((response) => {
          if (isValidForRequest(event.request, response)) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (isValidForRequest(event.request, response)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
