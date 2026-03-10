self.addEventListener('install', (e) => {
  console.log('Service Worker instalado!');
});

self.addEventListener('fetch', (e) => {
  // Necessário para o PWA ser detectado
  e.respondWith(fetch(e.request));
});
