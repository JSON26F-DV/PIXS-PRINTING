import { useQuery } from '@tanstack/react-query'
import { STORAGE_KEYS } from '../constants/storageKeys'
import type { ICategory } from '../types/product.types'
import { toast } from 'react-hot-toast'

async function fetchCategories({ signal }: { signal?: AbortSignal }) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
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

  if (res.status === 429) {
    toast.error('Too many requests. Please slow down.')
    throw new Error('Rate limited')
  }


  if (res.status === 403) {
    throw new Error('Access Denied')
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.data || data) as ICategory[]
}

export function useCategories() {
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  return { categories, isLoading, error: error instanceof Error ? error.message : null }
}
