// Service Worker do WJ Eventos — deixa o app abrir OFFLINE na maquininha.
// Estratégia: cache-first para arquivos do próprio app, network-first
// com fallback para index.html nas navegações.

const CACHE = 'wj-eventos-v1'
const CORE = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ||
        fetch(event.request)
          .then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, copy))
            return res
          })
          .catch(() => caches.match('/index.html'))
    )
  )
})
