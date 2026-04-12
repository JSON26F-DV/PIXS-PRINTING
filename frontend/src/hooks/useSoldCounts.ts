import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { toast } from 'react-hot-toast';

export function useSoldCounts() {
  const [soldMap, setSoldMap] = useState<Record<string, number>>({});
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const fetchSoldCounts = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/sold-counts`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (res.status === 429) {
          toast.error('Too many requests. Please slow down.');
          return;
        }

        if (res.status === 401) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          window.location.href = '/login';
          return;
        }

        if (res.status === 403) {
            setError('Access Denied');
            return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        const arrayData = data.data || data;
        const map: Record<string, number> = {};
        arrayData.forEach((item: { product_id: string; total_sold: number | string }) => {
            map[item.product_id] = Number(item.total_sold);
        });
        setSoldMap(map);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError('Failed to load sold counts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSoldCounts();
    return () => controller.abort();
  }, []);

  return { soldMap, isLoading, error };
}
