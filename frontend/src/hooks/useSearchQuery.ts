import { useQuery } from '@tanstack/react-query'
import type { IProduct } from '../types/product.types'

async function fetchSearchQuery(query: string, { signal }: { signal?: AbortSignal }) {
  const res = await fetch(
    `/api/products/search?q=${encodeURIComponent(query)}`,
    { signal },
  )
  const data = await res.json()
  return (data.data ?? []) as IProduct[]
}

export function useSearchQuery(query: string) {
  const trimmed = query.trim()
  const shouldFetch = trimmed.length >= 3

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: ({ signal }) => fetchSearchQuery(query, { signal }),
    enabled: shouldFetch,
  })

  return { results, isLoading }
}
