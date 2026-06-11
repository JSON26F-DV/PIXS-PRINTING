import { useMemo, useState, useEffect } from 'react'
import axiosInstance from '../../../../lib/axiosInstance'
import { useAuth } from '../../../../context/AuthContext'
import type { ProfileFormValues } from '../utils/validation'

export interface IContactNode {
  number: string
  is_default: boolean
}

export interface AccountInfo {
  id: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  contacts: IContactNode[]
  profilePicture?: string
  default_contact?: string
  addresses?: unknown[]
  payment_methods?: unknown[]
  discounts?: unknown[]
  age?: number | null
  gender?: string | null
  status?: string
  total_orders_value?: number
  orders?: number
}

export const useAccountInfo = () => {
  const { user } = useAuth()
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get('/api/customer/profile')
        const data = response.data
        setAccount({
          id: data.id,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          company_name: data.company_name || '',
          contacts: (data.contacts || []).map((c: { number: string; is_default: unknown }) => ({
            ...c,
            is_default: Boolean(c.is_default),
          })),
          profilePicture: data.profile_picture || '',
          default_contact: data.default_contact || '',
          addresses: data.addresses || [],
          payment_methods: data.payment_methods || [],
          discounts: data.discounts || [],
          age: data.age,
          gender: data.gender,
          status: data.status,
          total_orders_value: data.total_orders_value,
          orders: data.orders,
        })
      } catch (err) {
        console.error('Failed to fetch account info:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const defaultAccount = useMemo<AccountInfo>(() => {
    if (account) return account
    return {
      id: user.id || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      company_name:
        ((user as unknown as Record<string, unknown>).company_name as string) ||
        '',
      contacts: [],
      profilePicture: user.profile_picture || '',
      default_contact: '',
      age: user.age || null,
      gender: user.gender || null,
      status: user.status || 'active',
      total_orders_value: (user as unknown as Record<string, unknown>).total_orders_value as number || 0,
      orders: (user as unknown as Record<string, unknown>).orders as number || 0,
    }
  }, [account, user])

  const updateProfile = async (
    values: ProfileFormValues & { age?: number | null; gender?: string | null },
  ): Promise<{ success: boolean }> => {
    try {
      await axiosInstance.patch('/api/customer/profile', {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        company_name: values.company_name,
        age: values.age,
        gender: values.gender,
      })
      setAccount((prev) => (prev ? { ...prev, ...values } : null))
      return { success: true }
    } catch (err) {
      console.error(err)
      return { success: false }
    }
  }

  const uploadProfilePicture = async (
    file: File,
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const formData = new FormData()
      formData.append('profile_picture', file)
      const response = await axiosInstance.post(
        '/api/settings/profile-picture',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      const url = response.data.url
      setAccount((prev) => (prev ? { ...prev, profilePicture: url } : null))
      return { success: true, url }
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to upload profile picture'
      return { success: false, error: message }
    }
  }

  const storeContact = async (
    number: string,
  ): Promise<{ success: boolean }> => {
    try {
      await axiosInstance.post('/api/customer/contacts', { number })
      setAccount((prev) => {
        if (!prev) return prev
        const isFirst = prev.contacts.length === 0
        const newContact = { number, is_default: isFirst }
        return { ...prev, contacts: [...prev.contacts, newContact] }
      })
      return { success: true }
    } catch (err) {
      console.error(err)
      return { success: false }
    }
  }

  const setDefaultContact = async (
    number: string,
  ): Promise<{ success: boolean }> => {
    try {
      await axiosInstance.post(
        `/api/customer/contacts/${encodeURIComponent(number)}/default`,
      )
      setAccount((prev) => {
        if (!prev) return prev
        const updated = prev.contacts.map((c) => ({
          ...c,
          is_default: c.number === number,
        }))
        return { ...prev, contacts: updated }
      })
      return { success: true }
    } catch (err) {
      console.error(err)
      return { success: false }
    }
  }

  return {
    defaultAccount,
    updateProfile,
    uploadProfilePicture,
    storeContact,
    setDefaultContact,
    isLoading,
  }
}
