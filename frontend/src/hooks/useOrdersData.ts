import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../lib/axiosInstance'
import type { Order } from '../types/order'

interface UseOrdersDataReturn {
  orders: Order[]
  isLoading: boolean
  error: string | null
}

async function fetchOrders() {
  const response = await axiosInstance.get('/admin/orders')
  return (response.data.data || response.data || []) as Order[]
}

export function useOrdersData(): UseOrdersDataReturn {
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchOrders,
  })

  return {
    orders,
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
