import { useCallback, useEffect, useMemo, useState } from 'react'
import { PIXS_FAVORITES_KEY } from '../types/homepage.types'

function safeParseFavorites(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return Array.from(
      new Set(
        parsed
          .map((v) => (typeof v === 'string' ? v : String(v)))
          .filter(Boolean),
      ),
    )
  } catch {
    return []
  }
}

export function useHomepageFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    safeParseFavorites(window.localStorage.getItem(PIXS_FAVORITES_KEY)),
  )

  useEffect(() => {
    window.localStorage.setItem(PIXS_FAVORITES_KEY, JSON.stringify(favoriteIds))
  }, [favoriteIds])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PIXS_FAVORITES_KEY) return
      setFavoriteIds(safeParseFavorites(e.newValue))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const isFavorited = useCallback(
    (productId: string) => favoriteSet.has(productId),
    [favoriteSet],
  )

  const setFavorite = useCallback((productId: string, next: boolean) => {
    setFavoriteIds((prev) => {
      const has = prev.includes(productId)
      if (next && !has) return [...prev, productId]
      if (!next && has) return prev.filter((id) => id !== productId)
      return prev
    })
  }, [])

  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavorite(productId, !favoriteSet.has(productId))
    },
    [favoriteSet, setFavorite],
  )

  const clearFavorites = useCallback(() => setFavoriteIds([]), [])

  return {
    favoriteIds,
    isFavorited,
    toggleFavorite,
    setFavorite,
    clearFavorites,
  }
}
