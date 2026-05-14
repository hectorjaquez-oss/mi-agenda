const CACHE = 'agenda-v5';
const BASE = '/mi-agenda';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
];

// Instalar: pre-cachear todos los archivos de la app
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.all(
        ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('No se pudo cachear:', url, err))
        )
      );
    })
  );
});

// Activar: eliminar cachés viejas
self.addEventListener('activate', e => {
  self.clients.claim();
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

// Fetch: caché primero, luego red — funciona 100% offline
self.addEventListener('fetch', e => {
  // Solo manejar peticiones GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request)
        .then(response => {
          if (!response || response.status !== 200) return response;
          // Guardar en caché para la próxima vez
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => {
          // Sin conexión: devolver index.html para cualquier navegación
          if (e.request.destination === 'document') {
            return caches.match(BASE + '/index.html');
          }
        });
    })
  );
});
