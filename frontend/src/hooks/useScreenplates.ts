import { useState, useEffect } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import type { IScreenPlate } from '../types/product.types'
import { toast } from 'react-hot-toast'

export function useScreenplates() {
  const [screenplates, setScreenplates] = useState<IScreenPlate[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const fetchScreenplates = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/screenplates`,
          {
            signal: controller.signal,
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

        if (res.status === 401) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          window.location.href = '/login'
          return
        }

        if (res.status === 403) {
          setError('Access Denied')
          return
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setScreenplates(data.data || data)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError('Failed to load screenplates. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchScreenplates()
    return () => controller.abort()
  }, [])

  return { screenplates, isLoading, error }
}
