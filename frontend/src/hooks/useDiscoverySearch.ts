import { useQuery } from '@tanstack/react-query'

export interface IDiscoveryProduct {
  id: string
  name: string
  category_label: string
  base_price: number
  is_in_stock: boolean
  min_order: number
  main_image: string | null
}

interface DiscoverySearchParams {
  query: string
  categoryId: string | null
}

async function fetchDiscoverySearch({
  query,
  categoryId,
}: DiscoverySearchParams, { signal }: { signal?: AbortSignal }) {
  const CAT_ID_REGEX = /^CT\d{3}$/
  const safeQuery = query.replace(/[^a-zA-Z0-9\s\-_.₱]/g, '').trim()
  const safeCategoryId = CAT_ID_REGEX.test(categoryId ?? '')
    ? categoryId
    : null

  const params = new URLSearchParams()
  if (safeQuery.length >= 3) params.append('q', safeQuery)
  if (safeCategoryId) params.append('category_id', safeCategoryId)

  const token = localStorage.getItem('pixs_token')
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/products/search?${params}`,
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

  if (res.status === 429) {
    throw new Error('Too many searches. Please slow down.')
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  return (json.data ?? []) as IDiscoveryProduct[]
}

export function useDiscoverySearch({
  query,
  categoryId,
}: DiscoverySearchParams) {
  const shouldFetch = query.length >= 3 || categoryId !== null

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['discovery-search', { query, categoryId }],
    queryFn: ({ signal }) => fetchDiscoverySearch({ query, categoryId }, { signal }),
    enabled: shouldFetch,
  })

  return {
    results,
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
