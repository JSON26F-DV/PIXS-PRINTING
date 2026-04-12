import { create } from 'zustand'
import axiosInstance from '../lib/axiosInstance'

export interface PaymentMethod {
  id: string
  type: 'bank' | 'ewallet'
  bank_name: string
  provider: string
  masked_number: string
  is_default: boolean
}

interface PaymentMethodStore {
  methods: PaymentMethod[]
  isLoading: boolean
  error: string | null

  fetchMethods: () => Promise<void>
  addMethod: (method: Omit<PaymentMethod, 'id' | 'is_default'>) => Promise<void>
  setDefault: (id: string) => Promise<void>
  removeMethod: (id: string) => Promise<void>
}

export const usePaymentMethodStore = create<PaymentMethodStore>((set) => ({
  methods: [],
  isLoading: false,
  error: null,

  fetchMethods: async () => {
    set({ isLoading: true, error: null })
    try {
      const resp = await axiosInstance.get('/api/customer/payment-methods')
      set({ methods: resp.data.data, isLoading: false })
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  addMethod: async (method) => {
    try {
      const resp = await axiosInstance.post(
        '/api/customer/payment-methods',
        method,
      )
      const newMethod = resp.data.data
      set((state) => ({
        methods: [
          newMethod,
          ...state.methods.map((m) =>
            newMethod.is_default ? { ...m, is_default: false } : m,
          ),
        ],
      }))
    } catch (err: unknown) {
      set({ error: (err as Error).message })
      throw err
    }
  },

  setDefault: async (id) => {
    try {
      await axiosInstance.post(`/api/customer/payment-methods/${id}/default`)
      set((state) => ({
        methods: state.methods.map((m) => ({ ...m, is_default: m.id === id })),
      }))
    } catch (err: unknown) {
      set({ error: (err as Error).message })
    }
  },

  removeMethod: async (id) => {
    try {
      await axiosInstance.delete(`/api/customer/payment-methods/${id}`)
      set((state) => ({
        methods: state.methods.filter((m) => m.id !== id),
      }))
    } catch (err: unknown) {
      set({ error: (err as Error).message })
      throw err
    }
  },
}))
