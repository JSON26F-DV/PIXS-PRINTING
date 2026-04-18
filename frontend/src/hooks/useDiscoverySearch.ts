import { useState, useEffect } from 'react'

interface DiscoverySearchParams {
  query: string
  categoryId: string | null
}

export interface IDiscoveryProduct {
  id: string
  name: string
  category_label: string
  base_price: number
  current_stock: number
  min_order: number
  main_image: string | null
}

/**
 * Hook to search/filter products for the DiscoveryModal results grid.
 */
export function useDiscoverySearch({
  query,
  categoryId,
}: DiscoverySearchParams) {
  const [results, setResults] = useState<IDiscoveryProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const CAT_ID_REGEX = /^CT\d{3}$/
    const shouldFetch = query.length >= 3 || categoryId !== null

    if (!shouldFetch) {
      setResults([])
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('pixs_token')
        const safeQuery = query.replace(/[^a-zA-Z0-9\s\-_.₱]/g, '').trim()
        const safeCategoryId = CAT_ID_REGEX.test(categoryId ?? '')
          ? categoryId
          : null

        const params = new URLSearchParams()
        if (safeQuery.length >= 3) params.append('q', safeQuery)
        if (safeCategoryId) params.append('category_id', safeCategoryId)

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products/search?${params}`,
          {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          },
        )

        if (res.status === 401) {
          localStorage.removeItem('pixs_token')
          window.location.href = '/login'
          return
        }

        if (res.status === 429) {
          setError('Too many searches. Please slow down.')
          return
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()
        setResults(json.data ?? [])
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError('Search failed. Tap to retry.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
    return () => controller.abort()
  }, [query, categoryId])

  return { results, isLoading, error }
}
