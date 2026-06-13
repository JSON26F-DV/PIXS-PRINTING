import { useQuery } from '@tanstack/react-query'
import { STORAGE_KEYS } from '../constants/storageKeys'
import type { IScreenPlate } from '../types/product.types'
import { toast } from 'react-hot-toast'

async function fetchScreenplates({ signal }: { signal?: AbortSignal }) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || ''}/api/screenplates`,
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

  if (res.status === 401) {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (res.status === 403) {
    throw new Error('Access Denied')
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.data || data) as IScreenPlate[]
}

export function useScreenplates() {
  const { data: screenplates = [], isLoading, error } = useQuery({
    queryKey: ['screenplates'],
    queryFn: fetchScreenplates,
  })

  return {
    screenplates,
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
