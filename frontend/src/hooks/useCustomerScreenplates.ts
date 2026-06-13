import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import type { CustomerScreenplateListItem } from '../types/homepage.types'
import { toast } from 'react-hot-toast'

export function useCustomerScreenplates() {
  const [screenplates, setScreenplates] = useState<
    CustomerScreenplateListItem[]
  >([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlates = useCallback(async (signal: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/customer/screenplates`,
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
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const raw = json.data ?? json
      const list = Array.isArray(raw) ? raw : []
      setScreenplates(
        list.map((r: Record<string, unknown>) => ({
          id: String(r.id ?? ''),
          plate_name: String(r.plate_name ?? ''),
          owner_id: String(r.owner_id ?? ''),
        })),
      )
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setError('Failed to load screenplates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const c = new AbortController()
    fetchPlates(c.signal)
    return () => c.abort()
  }, [fetchPlates])

  return { screenplates, isLoading, error }
}
