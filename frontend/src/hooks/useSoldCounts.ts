import { useQuery } from '@tanstack/react-query'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { toast } from 'react-hot-toast'

async function fetchSoldCounts({ signal }: { signal?: AbortSignal }) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || ''}/api/products/sold-counts`,
    {
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  )

  if (res.status === 429) {
    toast.error('Too many requests. Please slow down.')
    throw new Error('Rate limited')
  }


  if (res.status === 403) {
    throw new Error('Access Denied')
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  const arrayData = data.data || data
  const map: Record<string, number> = {}
  arrayData.forEach(
    (item: { product_id: string; total_sold: number | string }) => {
      map[item.product_id] = Number(item.total_sold)
    },
  )
  return map
}

export function useSoldCounts() {
  const { data: soldMap = {}, isLoading, error } = useQuery({
    queryKey: ['sold-counts'],
    queryFn: fetchSoldCounts,
  })

  return { soldMap, isLoading, error: error instanceof Error ? error.message : null }
}
