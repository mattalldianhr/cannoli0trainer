// Cannoli Trainer Service Worker
// Caches app shell and athlete workout data for PWA offline support

const CACHE_NAME = 'cannoli-v3';
const API_CACHE_NAME = 'cannoli-api-v2';

// App shell resources to pre-cache on install
const APP_SHELL = [
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon.svg',
];

// API paths to cache with network-first + stale fallback
const CACHEABLE_API_PATHS = [
  '/api/train',
  '/api/athlete/train',
  '/api/athlete/dashboard',
  '/api/athlete/calendar',
  '/api/athlete/history',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  const keepCaches = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !keepCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/**
 * Check if a request URL matches a cacheable API path.
 */
function isCacheableApi(url) {
  return CACHEABLE_API_PATHS.some((path) => url.pathname.startsWith(path));
}

// Fetch: strategy depends on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (let POST/PUT/DELETE go through normally)
  if (request.method !== 'GET') return;

  // Skip auth-related requests (NextAuth callbacks, CSRF tokens)
  if (url.pathname.startsWith('/api/auth')) return;

  // Cacheable API requests: network-first with stale fallback
  if (isCacheableApi(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          // Network failed — serve stale cached response
          caches.open(API_CACHE_NAME).then((cache) => cache.match(request))
        )
    );
    return;
  }

  // Non-cacheable API requests: pass through (no cache)
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline'))
        )
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
