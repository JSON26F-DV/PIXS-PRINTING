import { useState, useEffect } from 'react'
import type { IProduct } from '../types/product.types'

export function useSearchQuery(query: string) {
  const [results, setResults] = useState<IProduct[]>([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim() || query.trim().length < 3) {
      setResults([])
      return
    }

    const controller = new AbortController()
    setLoading(true)

    const fetchResults = async () => {
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        )
        const data = await res.json()
        setResults(data.data ?? [])
      } catch (err) {
        if ((err as Error).name === 'AbortError') return // silently ignore
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
    return () => controller.abort()
  }, [query])

  return { results, isLoading }
}
