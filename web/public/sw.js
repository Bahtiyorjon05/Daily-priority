// Service Worker for Daily Priority PWA
// v2 — Handles offline caching, background sync, and push notifications

// Bump these on any caching-strategy change so old caches are dropped — and on
// any change to a PRECACHED FILE'S CONTENTS, which is the part that got missed.
// The icons were replaced with the new emblem but the cache kept its name, so
// every installed PWA went on serving the old tick from `daily-priority-v3`:
// the home-screen icon, the install dialog, the push badge and the app icon on
// the onboarding screen were all stale, while the server had the new bytes all
// along. `activate` deletes any cache not named below, so renaming is the fix.
const CACHE_NAME = 'daily-priority-v4'
const RUNTIME_CACHE = 'runtime-cache-v4'

// Only truly static assets are precached. HTML pages are deliberately NOT
// precached: a cached document pins the hashed JS chunks it references, so a
// stale document serves an entire stale app after every deploy.
const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/islamic-pattern.svg',
]

// Install event — cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Use addAll with individual catches so one failure doesn't block install
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Failed to cache ${url}:`, err.message)
            })
          )
        )
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  const VALID_CACHES = [CACHE_NAME, RUNTIME_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !VALID_CACHES.includes(name))
            .map((name) => {
              console.log(`[SW] Deleting old cache: ${name}`)
              return caches.delete(name)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip Chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) return

  // Skip Next.js HMR/dev requests
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  // API requests — network only with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'You are offline', offline: true }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      })
    )
    return
  }

  // Immutable build output (/_next/static/**) and media/fonts/images are safe
  // to serve cache-first: their filenames contain a content hash, so a new
  // build produces new URLs rather than changing an existing one.
  //
  // NOTE: this deliberately no longer matches every `.js`/`.css` path. Serving
  // any script cache-first (including non-hashed ones like /sw.js) meant a
  // deploy could never fully reach an existing visitor.
  const isHashedBuildAsset = url.pathname.startsWith('/_next/static/')
  const isMediaAsset = url.pathname.match(
    /\.(png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|otf|mp3|ogg|wav|m4a)$/
  )

  if (isHashedBuildAsset || isMediaAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached

        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const clone = response.clone()
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone))
            }
            return response
          })
          .catch(() => {
            // Return offline fallback for navigation requests
            if (request.destination === 'image') {
              return new Response('', { status: 404 })
            }
            return new Response('Offline', { status: 503 })
          })
      })
    )
    return
  }

  // Pages/documents — NETWORK FIRST.
  //
  // These must never be served stale: an HTML document references hashed JS
  // chunks, so returning a cached document from an older deploy loads the whole
  // old app. That previously meant a plain refresh could show a version of the
  // UI from a previous release while a fresh sign-in showed the new one.
  // The cache is kept purely as an offline fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        if (request.mode === 'navigate') {
          return (await caches.match('/offline')) || new Response('Offline', { status: 503 })
        }
        return new Response('Offline', { status: 503 })
      })
  )
})

// Background Sync — sync data when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks())
  }
})

async function syncTasks() {
  try {
    const queue = JSON.parse(
      (await getFromIDB('offline-queue')) || '[]'
    )
    for (const op of queue) {
      await fetch(op.endpoint, {
        method: op.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op.data),
      })
    }
    await removeFromIDB('offline-queue')
  } catch (err) {
    console.warn('[SW] Sync failed, will retry:', err)
  }
}

// Simple IDB helpers for sync queue
function getFromIDB(key) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('dp-sw', 1)
      req.onupgradeneeded = (e) =>
        e.target.result.createObjectStore('kv')
      req.onsuccess = (e) => {
        const db = e.target.result
        const tx = db.transaction('kv', 'readonly')
        const store = tx.objectStore('kv')
        const get = store.get(key)
        get.onsuccess = () => resolve(get.result)
        get.onerror = () => resolve(null)
      }
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

function removeFromIDB(key) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('dp-sw', 1)
      req.onsuccess = (e) => {
        const db = e.target.result
        const tx = db.transaction('kv', 'readwrite')
        tx.objectStore('kv').delete(key)
        tx.oncomplete = () => resolve()
      }
      req.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'Daily Priority'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
    // Stable tag so a repeated reminder replaces the previous one instead of
    // stacking duplicates on the lock screen.
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data || '/'

    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus()
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen)
          }
        })
    )
  }
})
