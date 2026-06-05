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

interface CardCacheResult<T> {
  data: T | null
  loading: boolean
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
  const cached = id != null ? (cache.get(key) as T | undefined) : undefined

  const [data, setData] = useState<T | null>(cached ?? null)
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
      setData(cache.get(k) as T)
      setLoading(false)
      return
    }

    // Re-use an in-flight request for the same ID (deduplication)
    let req: Promise<unknown>
    if (pending.has(k)) {
      req = pending.get(k)!
    } else {
      req = fetchFn()
        .then((result) => {
          cache.set(k, result)
          return result
        })
        .catch((err) => {
          // Cache null on error so we never retry a failed fetch
          cache.set(k, null)
          console.error(`[useCardCache:${namespace}] fetch error for "${k}":`, err)
          return null
        })
        .finally(() => {
          pending.delete(k)
        })
      pending.set(k, req)
    }

    setLoading(true)
    req.then((result) => {
      if (mountedRef.current) {
        setData(result as T | null)
        setLoading(false)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, String(id)])

  return { data, loading }
}
