/*
 * Inktype service worker — offline support.
 *
 * - App pages: network first, falling back to the cached copy (then /offline).
 * - Build assets (/_next/static, fonts, icons): cache first; they are immutable.
 * - Book texts (/api/books/:id/text): cache first. Once opened, a book can be
 *   typed offline. Progress lives in localStorage, so it works offline too.
 * - Everything else under /api: network only.
 */

const VERSION = "v3";
const SHELL = `inktype-shell-${VERSION}`;
const ASSETS = `inktype-assets-${VERSION}`;
const BOOKS = "inktype-books"; // not versioned: book texts never change
const PRECACHE = ["/", "/library", "/custom", "/stats", "/settings", "/offline", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => ![SHELL, ASSETS, BOOKS].includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const hit = (await cache.match(request)) ?? (await cache.match(request.url.split("?")[0]));
    if (hit) return hit;
    // Reader pages share one client bundle; any cached reader can render a cached book.
    const url = new URL(request.url);
    if (url.pathname.startsWith("/read/")) {
      const keys = await cache.keys();
      const reader = keys.find((k) => new URL(k.url).pathname.startsWith(url.pathname.split("/").slice(0, 3).join("/")));
      if (reader) return cache.match(reader);
    }
    return (await cache.match("/offline")) ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    /^\/api\/(books\/\d+|pga\/\d{7})\/text$/.test(url.pathname) ||
    url.pathname === "/api/wikisource/text" ||
    url.pathname.startsWith("/api/covers/") ||
    url.pathname === "/api/image"
  ) {
    event.respondWith(cacheFirst(request, BOOKS));
  } else if (url.pathname.startsWith("/api/")) {
    return; // network only
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.endsWith(".woff2")) {
    event.respondWith(cacheFirst(request, ASSETS));
  } else if (request.mode === "navigate" || request.headers.get("RSC") === "1") {
    event.respondWith(networkFirst(request));
  }
});
