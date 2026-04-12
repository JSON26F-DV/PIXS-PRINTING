import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type { ICategory } from '../types/product.types';
import { toast } from 'react-hot-toast';

export function useCategories() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
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
        setCategories(data.data || data);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    return () => controller.abort();
  }, []);

  return { categories, isLoading, error };
}
