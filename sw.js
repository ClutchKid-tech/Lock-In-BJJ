const CACHE_NAME = 'lockin-bjj-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/gamification.css',
  '/auth.css',
  '/app.js',
  '/gamification.js',
  '/auth.js',
  '/manifest.json',
];

// Install — cache all core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for core assets, network-first for everything else
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin requests (Firebase, Google APIs, etc.)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) {
        // Return cache, update in background
        const fetchPromise = fetch(e.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached;
      }

      return fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
