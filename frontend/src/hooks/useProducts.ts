import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type { IProduct } from '../types/product.types';
import { toast } from 'react-hot-toast';

export interface ProductQueryParams {
  category?: string;
  search?: string;
  price_min?: number;
  price_max?: number;
  sort?: string;
  status?: string;
  screenplate_id?: string | null;
  most_sold?: boolean;
  page?: number;
  per_page?: number;
}

export function useProducts(params: ProductQueryParams) {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { category, search, price_min, price_max, sort, status, screenplate_id, most_sold, page, per_page } = params;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

        const queryParams = new URLSearchParams();
        const pMap: Record<string, string | number | boolean | null | undefined> = { 
          category, 
          search, 
          price_min, 
          price_max, 
          sort, 
          status, 
          screenplate_id, 
          most_sold, 
          page, 
          per_page 
        };

        Object.entries(pMap).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && value !== 'All' && value !== 'All Prices' && value !== 'All Status' && value !== 'All Plates') {
            queryParams.append(key, value.toString());
          }
        });

        const query = queryParams.toString();
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products${query ? '?' + query : ''}`,
          {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (res.status === 429) {
          toast.error('Too many requests. Please slow down.');
          setLoading(false);
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
        setProducts(data.data || []);
        if (data.meta && data.meta.last_page) {
            setTotalPages(data.meta.last_page);
        } else {
            setTotalPages(1);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError('Failed to load products. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [
    category,
    search,
    price_min,
    price_max,
    sort,
    status,
    screenplate_id,
    most_sold,
    page,
    per_page,
  ]);

  return { products, totalPages, isLoading, error };
}
