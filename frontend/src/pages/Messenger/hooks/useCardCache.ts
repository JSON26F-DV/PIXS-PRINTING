/**
 * useCardCache
 *
 * A module-level cache that ensures each unique card ID is fetched
 * EXACTLY ONCE per page session, regardless of how many times Virtuoso
 * mounts/unmounts the component.
 *
 * Failed fetches (404, 429, etc.) are cached as null so they are
 * NEVER retried — preventing infinite request loops that crash the server.
 *
 * This fixes the 429 Too Many Requests errors caused by Virtuoso's
 * virtualisation recycling card components on scroll.
 */

import { useState, useEffect, useRef } from 'react'

// Module-level caches — shared across ALL component instances
const dataCaches = new Map<string, Map<string, unknown>>()
const pendingRequests = new Map<string, Map<string, Promise<unknown>>>()

function getCache(namespace: string): Map<string, unknown> {
  if (!dataCaches.has(namespace)) {
    dataCaches.set(namespace, new Map())
  }
  return dataCaches.get(namespace)!
}

function getPending(namespace: string): Map<string, Promise<unknown>> {
  if (!pendingRequests.has(namespace)) {
    pendingRequests.set(namespace, new Map())
  }
  return pendingRequests.get(namespace)!
}

interface CacheEntry<T> {
  data: T | null
  error: Error | null
}

interface CardCacheResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * @param namespace  - Unique namespace per card type (e.g. 'orders', 'refunds')
 * @param id         - The unique identifier for this record
 * @param fetchFn    - Async function that fetches and returns the data
 */
export function useCardCache<T>(
  namespace: string,
  id: string | number | null | undefined,
  fetchFn: () => Promise<T>,
): CardCacheResult<T> {
  const cache = getCache(namespace)
  const pending = getPending(namespace)

  const key = String(id ?? '')
  const cached = id != null ? (cache.get(key) as CacheEntry<T> | undefined) : undefined

  const [data, setData] = useState<T | null>(cached ? cached.data : null)
  const [error, setError] = useState<Error | null>(cached ? cached.error : null)
  const [loading, setLoading] = useState<boolean>(cached === undefined && id != null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (id == null) return
    const k = String(id)

    // Already in cache — use it immediately
    if (cache.has(k)) {
      const entry = cache.get(k) as CacheEntry<T>
      setData(entry.data)
      setError(entry.error)
      setLoading(false)
      return
    }

    // Re-use an in-flight request for the same ID (deduplication)
    let req: Promise<CacheEntry<T>>
    if (pending.has(k)) {
      req = pending.get(k) as Promise<CacheEntry<T>>
    } else {
      req = fetchFn()
        .then((result) => {
          const entry = { data: result, error: null }
          cache.set(k, entry)
          return entry
        })
        .catch((err) => {
          const entry = { data: null, error: err instanceof Error ? err : new Error(String(err)) }
          cache.set(k, entry)
          console.error(`[useCardCache:${namespace}] fetch error for "${k}":`, err)
          return entry
        })
        .finally(() => {
          pending.delete(k)
        })
      pending.set(k, req as Promise<unknown> as Promise<CacheEntry<T>>)
    }

    setLoading(true)
    req.then((entry) => {
      if (mountedRef.current) {
        setData(entry.data)
        setError(entry.error)
        setLoading(false)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, String(id)])

  return { data, loading, error }
}
