import { useState, useEffect } from 'react'
import axiosInstance from '../lib/axiosInstance'

export interface OrderItem {
  id: string
  order_id: string
  customer_id: string
  productId: string
  productName: string
  productImage: string
  short_description: string
  category: string
  quantity: number
  variant: {
    unitPrice: number
    size: string
    id: string
  }
  colors: { name: string; hex: string }[]
  plate: { id: string; name: string; setupFee: number; printPricePerUnit: number } | null
  customRequirements?: string
  created_at: string
}


export interface Order {
  order_id: string
  user_id: string
  products: OrderItem[]
  total_amount: number
  status: string
  created_at: string
  rating?: number
  feedback?: string
  complaint?: string
  discount?: {
    total_discount_amount: number
  }
}


export interface Customer {
  id: string
  name: string
  email: string
  role: string
  profile_picture: string | null
  company_name?: string | null
  orderCount: number
  totalSpent: number
}

interface Stats {
  total_orders: number
  completed_count: number
  completion_rate: number
  satisfaction_quotient: number
  order_volume: number
}

interface OrderStatusDistribution {
  name: string
  value: number
  color: string
}

interface UseAdminOrdersReturn {
  orders: Order[]
  customers: Customer[]
  stats: Stats
  orderStatusDistribution: OrderStatusDistribution[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAdminOrders(): UseAdminOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<Stats>({
    total_orders: 0,
    completed_count: 0,
    completion_rate: 0,
    satisfaction_quotient: 0,
    order_volume: 0,
  })
  const [orderStatusDistribution, setOrderStatusDistribution] = useState<OrderStatusDistribution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/orders')
      const data = response.data
      
      setOrders(data.orders || [])
      setCustomers(data.customers || [])
      setStats(data.stats || {
        total_orders: 0,
        completed_count: 0,
        completion_rate: 0,
        satisfaction_quotient: 0,
        order_volume: 0,
      })
      setOrderStatusDistribution(data.orderStatusDistribution || [])
      setError(null)
    } catch (err) {
      setError('Failed to fetch order analytics')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { 
    orders, 
    customers, 
    stats, 
    orderStatusDistribution, 
    isLoading, 
    error,
    refresh: fetchData 
  }
}
