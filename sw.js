/*
 * sw.js — Service Worker de Poás Agua y Fuego (PWA)
 * Estrategia:
 *  - Navegaciones (HTML): network-first con respaldo a caché (para no dejar al usuario con contenido viejo).
 *  - Recursos estáticos propios (img/css/js): stale-while-revalidate.
 *  - Cross-origin (fuentes, CDNs): sin interceptar.
 */
const VERSION = 'poas-v1';
const STATIC_CACHE = 'poas-static-' + VERSION;

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    // Solo mismo origen; lo demás (fuentes, unpkg, etc.) pasa directo.
    if (url.origin !== self.location.origin) return;

    // Navegaciones / documentos HTML: network-first.
    if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
                    return res;
                })
                .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
        );
        return;
    }

    // Recursos estáticos: stale-while-revalidate.
    event.respondWith(
        caches.match(req).then((cached) => {
            const network = fetch(req)
                .then((res) => {
                    if (res && res.status === 200 && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
