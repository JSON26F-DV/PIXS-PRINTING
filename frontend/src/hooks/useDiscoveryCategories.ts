import { useQuery } from '@tanstack/react-query'
import type { ICategory } from '../types/product.types'

async function fetchDiscoveryCategories({ signal }: { signal?: AbortSignal }) {
  const token = localStorage.getItem('pixs_token')
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || ''}/api/categories`,
    {
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  )

  if (res.status === 401) {
    localStorage.removeItem('pixs_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  return (json.data ?? []) as ICategory[]
}

export function useDiscoveryCategories(isOpen: boolean) {
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['discovery-categories'],
    queryFn: fetchDiscoveryCategories,
    enabled: isOpen,
    staleTime: Infinity,
  })

  return { categories, isLoading, error: error instanceof Error ? error.message : null }
}
