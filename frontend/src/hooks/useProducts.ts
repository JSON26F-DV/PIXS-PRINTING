import { useQuery } from '@tanstack/react-query'
import { STORAGE_KEYS } from '../constants/storageKeys'
import type { IProduct } from '../types/product.types'
import { toast } from 'react-hot-toast'

export interface ProductQueryParams {
  category?: string
  search?: string
  price_min?: number
  price_max?: number
  sort?: string
  status?: string
  screenplate_id?: string | null
  most_sold?: boolean
  min_rating?: number
  in_stock_only?: boolean
  page?: number
  per_page?: number
}

interface ProductsResponse {
  products: IProduct[]
  totalPages: number
}

async function fetchProducts(
  params: ProductQueryParams,
  { signal }: { signal?: AbortSignal },
): Promise<ProductsResponse> {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)

  const queryParams = new URLSearchParams()
  const pMap: Record<string, string | number | boolean | null | undefined> = {
    category: params.category,
    search: params.search,
    price_min: params.price_min,
    price_max: params.price_max,
    sort: params.sort,
    status: params.status,
    screenplate_id: params.screenplate_id,
    most_sold: params.most_sold,
    min_rating: params.min_rating,
    page: params.page,
    per_page: params.per_page,
  }

  Object.entries(pMap).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'All' &&
      value !== 'All Prices' &&
      value !== 'All Status' &&
      value !== 'All Plates'
    ) {
      queryParams.append(key, value.toString())
    }
  })

  if (params.in_stock_only) {
    queryParams.append('in_stock_only', '1')
  }

  const query = queryParams.toString()
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || ''}/api/products${query ? '?' + query : ''}`,
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
  const list = Array.isArray(data.data) ? data.data : []
  const lastPage =
    typeof data.last_page === 'number'
      ? data.last_page
      : typeof data.meta?.last_page === 'number'
        ? data.meta.last_page
        : 1

  return { products: list as IProduct[], totalPages: lastPage > 0 ? lastPage : 1 }
}

export function useProducts(params: ProductQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', params],
    queryFn: ({ signal }) => fetchProducts(params, { signal }),
  })

  return {
    products: data?.products ?? [],
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
