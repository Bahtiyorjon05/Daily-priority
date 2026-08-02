'use client'

/**
 * Offline write queue.
 *
 * The service worker caches reads, but mutations (creating a task, ticking a
 * habit) previously failed outright with no connection. This queues failed
 * writes in IndexedDB and replays them when the browser comes back online, so
 * the app is usable on a patchy connection.
 *
 * Only idempotent-ish, user-initiated writes should be queued — see
 * `queueableFetch` below.
 */

const DB_NAME = 'daily-priority-offline'
const STORE = 'pending-writes'
const DB_VERSION = 1

export interface PendingWrite {
  id?: number
  url: string
  method: string
  body: string | null
  headers: Record<string, string>
  createdAt: number
  label?: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function enqueueWrite(write: Omit<PendingWrite, 'id'>): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.add(write) as IDBRequest<IDBValidKey>)
  } catch (error) {
    console.error('[offline] failed to queue write', error)
  }
}

export async function getPendingWrites(): Promise<PendingWrite[]> {
  try {
    return (await withStore('readonly', (s) => s.getAll() as IDBRequest<PendingWrite[]>)) ?? []
  } catch {
    return []
  }
}

export async function countPending(): Promise<number> {
  try {
    return (await withStore('readonly', (s) => s.count() as IDBRequest<number>)) ?? 0
  } catch {
    return 0
  }
}

async function removeWrite(id: number): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.delete(id) as unknown as IDBRequest<undefined>)
  } catch {
    /* ignore */
  }
}

let flushing = false

/**
 * Replays queued writes oldest-first. A write is dropped once the server
 * accepts it, or if the server rejects it as a client error (4xx) — retrying
 * those forever would block the queue. 5xx/network errors stop the run so the
 * remaining writes stay queued and keep their order.
 */
export async function flushQueue(): Promise<{ sent: number; failed: number; remaining: number }> {
  if (flushing || typeof navigator === 'undefined' || !navigator.onLine) {
    return { sent: 0, failed: 0, remaining: await countPending() }
  }
  flushing = true
  let sent = 0
  let failed = 0

  try {
    const writes = (await getPendingWrites()).sort((a, b) => a.createdAt - b.createdAt)
    for (const w of writes) {
      try {
        const res = await fetch(w.url, {
          method: w.method,
          headers: w.headers,
          body: w.body,
        })
        if (res.ok) {
          if (w.id != null) await removeWrite(w.id)
          sent++
        } else if (res.status >= 400 && res.status < 500) {
          // Permanently rejected — drop it rather than blocking the queue.
          if (w.id != null) await removeWrite(w.id)
          failed++
        } else {
          break // server trouble; keep the rest queued
        }
      } catch {
        break // offline again
      }
    }
  } finally {
    flushing = false
  }

  return { sent, failed, remaining: await countPending() }
}

/**
 * fetch() that falls back to the offline queue for mutations.
 * Returns the real Response when online; when the request fails because the
 * device is offline it queues the write and resolves to a synthetic 202 so
 * callers can apply their optimistic update instead of showing an error.
 */
export async function queueableFetch(
  url: string,
  init: RequestInit & { label?: string } = {}
): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase()
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  try {
    const res = await fetch(url, init)
    return res
  } catch (error) {
    if (!isMutation || (typeof navigator !== 'undefined' && navigator.onLine)) {
      throw error
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (init.headers) Object.assign(headers, init.headers as Record<string, string>)

    await enqueueWrite({
      url,
      method,
      body: typeof init.body === 'string' ? init.body : null,
      headers,
      createdAt: Date.now(),
      label: init.label,
    })

    return new Response(JSON.stringify({ queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
