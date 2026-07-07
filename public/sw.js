const CACHE_NAME = "easymove-crm-pwa-v1"
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
]

const STATIC_CACHE_PREFIXES = [
  "/_next/static/",
  "/fonts/",
  "/icons/",
]

function isStaticCacheCandidate(url) {
  return STATIC_CACHE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  const response = await fetch(request)

  if (response.ok) {
    cache.put(request, response.clone())
  }

  return response
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => (
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      )
    )),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => (
        new Response(
          "<!doctype html><html lang=\"pl\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Easy Move CRM offline</title><body style=\"font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5\"><h1>Brak polaczenia</h1><p>Nie mozna zaladowac aplikacji. Sprawdz polaczenie z internetem i sprobuj ponownie.</p></body></html>",
          {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store",
            },
          },
        )
      )),
    )
    return
  }

  if (isStaticCacheCandidate(url)) {
    event.respondWith(cacheFirst(request))
  }
})
