import { useQuery, useQueryClient } from '@tanstack/react-query'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { toast } from 'react-hot-toast'
import type { IProduct } from '../types/product.types'

export interface IExpenditure {
  id: number
  variant_id?: string
  employee_salary_id?: number
  category: string
  amount: number
  description?: string
  created_at: string
}

export interface IInventoryLog {
  id: string
  employee_id: string
  product_id?: string
  variant_id?: string
  expenditure_id?: number
  product_name: string
  qty_added: number
  cost: number
  type: 'RESTOCK' | 'MISC' | 'ADJUSTMENT' | 'DAMAGE'
  notes?: string
  date: string
  employee?: {
    id: string
    first_name: string
    last_name: string
    role?: string
    profile_picture?: string
  }
}

interface StockAnalyticsData {
  products: IProduct[]
  expenditures: IExpenditure[]
  inventoryLogs: IInventoryLog[]
}

async function fetchStockAnalytics({ signal }: { signal?: AbortSignal }): Promise<StockAnalyticsData> {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/stock-analytics`, {
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })

  if (res.status === 401) {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  return {
    products: json.data?.products || [],
    expenditures: json.data?.expenditures || [],
    inventoryLogs: json.data?.inventory_logs || [],
  }
}

export function useStockAnalytics() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-analytics'],
    queryFn: fetchStockAnalytics,
  })

  const products = data?.products ?? []
  const expenditures = data?.expenditures ?? []
  const inventoryLogs = data?.inventoryLogs ?? []

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['stock-analytics'] })
  }

  const setProducts = (valueOrFn: IProduct[] | ((prev: IProduct[]) => IProduct[])) => {
    queryClient.setQueryData<StockAnalyticsData>(['stock-analytics'], (prev) => {
      if (!prev) return prev
      const nextProducts = typeof valueOrFn === 'function'
        ? (valueOrFn as (prev: IProduct[]) => IProduct[])(prev.products)
        : valueOrFn
      return { ...prev, products: nextProducts }
    })
  }

  const addExpenditure = async (payload: Partial<IExpenditure>) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenditures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success('Expenditure logged')
      refetch()
    } catch (err) {
      toast.error('Failed to log expenditure')
      console.error(err)
    }
  }

  const updateExpenditure = async (id: number, payload: Partial<IExpenditure>) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenditures/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success('Expenditure updated')
      refetch()
    } catch (err) {
      toast.error('Failed to update expenditure')
      console.error(err)
    }
  }

  const deleteExpenditure = async (id: number) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenditures/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success('Expenditure deleted')
      refetch()
    } catch (err) {
      toast.error('Failed to delete expenditure')
      console.error(err)
    }
  }

  const undoInventoryLog = async (id: string) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/inventory-logs/${id}/undo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      toast.success(json.message || 'Log adjustment successfully reverted')
      refetch()
    } catch (err) {
      toast.error('Failed to undo log adjustment')
      console.error(err)
    }
  }

  return {
    products,
    setProducts,
    expenditures,
    inventoryLogs,
    isLoading,
    error: error instanceof Error ? error.message : null,
    addExpenditure,
    updateExpenditure,
    deleteExpenditure,
    undoInventoryLog,
    refetch,
  }
}
