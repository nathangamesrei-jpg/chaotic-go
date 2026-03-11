// ==========================================
// SERVICE WORKER - CACHE DO CHAOTIC GO
// ==========================================
const CACHE_NAME = 'chaotic-go-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './scanner.html',
  './style.css',
  './cartas.js',
  './logo.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Se tem no cache, retorna rápido
        }
        return fetch(event.request); // Se não, busca na internet
      })
  );
});
