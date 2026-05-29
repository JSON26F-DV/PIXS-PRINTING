import { useState, useEffect } from 'react'
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

export function useStockAnalytics() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [expenditures, setExpenditures] = useState<IExpenditure[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async (controller?: AbortController) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/stock-analytics`, {
        signal: controller?.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (res.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        window.location.href = '/login'
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      setProducts(json.data?.products || [])
      setExpenditures(json.data?.expenditures || [])
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError('Failed to load stock analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchAnalytics(controller)
    return () => controller.abort()
  }, [])

  const addExpenditure = async (data: Partial<IExpenditure>) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenditures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      toast.success('Expenditure logged')
      setExpenditures([json.data, ...expenditures])
    } catch (err) {
      toast.error('Failed to log expenditure')
      console.error(err)
    }
  }

  const updateExpenditure = async (id: number, data: Partial<IExpenditure>) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenditures/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      toast.success('Expenditure updated')
      setExpenditures(expenditures.map(e => e.id === id ? json.data : e))
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
      setExpenditures(expenditures.filter(e => e.id !== id))
    } catch (err) {
      toast.error('Failed to delete expenditure')
      console.error(err)
    }
  }

  return {
    products,
    setProducts,
    expenditures,
    isLoading,
    error,
    addExpenditure,
    updateExpenditure,
    deleteExpenditure,
    refetch: fetchAnalytics,
  }
}
