// Spec Section 7 Level 3: "/crisis is a static page accessible from every
// footer, always reachable, requires no login. It lists crisis resources
// in clear, large, calm typography. Loads in under 1 second. Works offline
// (PWA cache)."
//
// Hand-rolled service worker — no workbox / vite-plugin-pwa dependency.
// Bump KAI_SW_VERSION when you want clients to drop the old cache.
//
// Strategy:
//   - /api/*           → bypass the SW entirely (always hit the network)
//   - /crisis          → cache-first with network update (must load instantly,
//                        even offline — it's the safety page)
//   - /assets/*        → runtime cache (Vite ships content-hashed names
//                        so we can cache them forever)
//   - / and other nav  → network-first (so installed/mobile users get the fresh
//                        app shell after a deploy), with offline cache fallback
//   - everything else  → network-first with cache fallback

const KAI_SW_VERSION = "v2";
const STATIC_CACHE = `kai-static-${KAI_SW_VERSION}`;
const RUNTIME_CACHE = `kai-runtime-${KAI_SW_VERSION}`;

const STATIC_URLS = ["/", "/crisis", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Pre-cache best-effort; one failure shouldn't block the whole install.
      await Promise.allSettled(STATIC_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE && key.startsWith("kai-"))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

function isCrisis(url) {
  // ONLY the crisis page is offline-first. The app shell ("/") must be
  // network-first so a deploy isn't masked by a stale cached shell.
  return url.pathname === "/crisis";
}

function isAsset(url) {
  return url.pathname.startsWith("/assets/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Same-origin only. Cross-origin (Google Fonts, etc.) bypasses the SW.
  if (url.origin !== self.location.origin) return;

  if (isApi(url)) return; // bypass — never cache

  if (isCrisis(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isAsset(url)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // "/" and every other navigation/HTML: network-first so installed/mobile
  // users get the fresh shell after a deploy; fall back to cache (then the
  // precached "/" shell) when offline.
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Refresh in background.
    fetch(request)
      .then((res) => res.ok && cache.put(request, res.clone()))
      .catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    // If nothing's cached and the network is down, return the SPA shell so
    // the crisis route still resolves.
    const shell = await cache.match("/");
    if (shell) return shell;
    throw err;
  }
}

async function networkFirst(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    // Offline cold-start with no runtime entry: fall back to the precached
    // app shell so navigations (incl. "/") still resolve.
    const shell = await caches.match("/", { cacheName: STATIC_CACHE });
    if (shell) return shell;
    throw err;
  }
}
