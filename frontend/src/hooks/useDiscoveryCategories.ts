import { useState, useEffect } from 'react'
import type { ICategory } from '../types/product.types'

/**
 * Hook to fetch all categories for the DiscoveryModal.
 * Results are cached in state to prevent redundant fetches.
 */
export function useDiscoveryCategories(isOpen: boolean) {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    if (!isOpen || hasFetched) return

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('pixs_token')
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/categories`,
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

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()
        setCategories(json.data ?? [])
        setHasFetched(true)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError('Failed to load matrix categories.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
    return () => controller.abort()
  }, [isOpen, hasFetched])

  return { categories, isLoading, error }
}
