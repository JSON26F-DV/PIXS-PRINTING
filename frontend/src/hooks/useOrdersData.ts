import { useState, useEffect } from 'react'
import axiosInstance from '../lib/axiosInstance'
import type { Order } from '../types/order'

interface UseOrdersDataReturn {
  orders: Order[]
  isLoading: boolean
  error: string | null
}

export function useOrdersData(): UseOrdersDataReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Admin endpoint to fetch all orders
        const response = await axiosInstance.get('/admin/orders')
        setOrders(response.data.data || response.data || [])
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch orders'
        setError(errorMsg)
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return { orders, isLoading, error }
}
