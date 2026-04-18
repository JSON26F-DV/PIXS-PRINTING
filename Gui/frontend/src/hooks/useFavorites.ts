import { useCallback, useEffect, useMemo, useState } from "react";
import { PIXS_FAVORITES_KEY } from "../types";

function safeParseFavorites(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const asNumbers = parsed
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .filter((n) => Number.isFinite(n));
    return Array.from(new Set(asNumbers));
  } catch {
    return [];
  }
}

export function useFavorites(): {
  favoriteIds: number[];
  isFavorited: (productId: number) => boolean;
  toggleFavorite: (productId: number) => void;
  setFavorite: (productId: number, next: boolean) => void;
  clearFavorites: () => void;
} {
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() =>
    safeParseFavorites(window.localStorage.getItem(PIXS_FAVORITES_KEY)),
  );

  useEffect(() => {
    window.localStorage.setItem(PIXS_FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PIXS_FAVORITES_KEY) return;
      setFavoriteIds(safeParseFavorites(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const favoriteSet = useMemo(() => new Set<number>(favoriteIds), [favoriteIds]);

  const isFavorited = useCallback(
    (productId: number) => favoriteSet.has(productId),
    [favoriteSet],
  );

  const setFavorite = useCallback((productId: number, next: boolean) => {
    setFavoriteIds((prev) => {
      const has = prev.includes(productId);
      if (next && !has) return [...prev, productId];
      if (!next && has) return prev.filter((id) => id !== productId);
      return prev;
    });
  }, []);

  const toggleFavorite = useCallback(
    (productId: number) => {
      setFavorite(productId, !favoriteSet.has(productId));
    },
    [favoriteSet, setFavorite],
  );

  const clearFavorites = useCallback(() => setFavoriteIds([]), []);

  return {
    favoriteIds,
    isFavorited,
    toggleFavorite,
    setFavorite,
    clearFavorites,
  };
}

