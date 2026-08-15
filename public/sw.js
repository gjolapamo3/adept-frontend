const CACHE_NAME = 'adept-shell-v1'
const APP_SHELL = ['/', '/index.html', '/favicon.svg', '/icons.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName)),
    )),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url)

  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseCopy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseCopy))
          return response
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkResponse = fetch(event.request).then((response) => {
        if (response.ok) {
          const responseCopy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy))
        }
        return response
      })

      return cachedResponse || networkResponse
    }),
  )
})