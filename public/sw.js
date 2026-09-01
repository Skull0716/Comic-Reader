// public/sw.js
const CACHE_NAME = "comic-reader-pwa-v2";

self.addEventListener("install", () => {
  // Activar inmediatamente el nuevo Service Worker sin esperar a que cierren pestañas
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. NO interceptar peticiones no-GET, llamadas a APIs internas, WebSockets (HMR) ni rutas de Next.js en dev
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.includes("hot-update")
  ) {
    return;
  }

  // 2. Estrategia Network-First para la navegación y páginas
  // Si hay red, entrega siempre la versión fresca; si se va la luz/internet, usa la caché
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas válidas (no errores 404/500 ni blobs pesados)
        if (response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        
        // Si el usuario navegó sin conexión, mostrar el fallback de inicio
        if (event.request.mode === "navigate") {
          return (await caches.match("/")) || (await caches.match("/index.html"));
        }
      })
  );
});