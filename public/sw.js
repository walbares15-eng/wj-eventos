// Service Worker do WJ Eventos — deixa o app abrir OFFLINE na maquininha.
// Navegações: network-first (sempre tenta a versão nova, cai no cache offline).
// Arquivos estáticos: cache-first.

const CACHE = 'wj-eventos-v2'
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

  // Navegação (páginas): rede primeiro — evita tela branca de versão velha
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, copy))
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Arquivos (JS/CSS/imagens): cache primeiro
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
