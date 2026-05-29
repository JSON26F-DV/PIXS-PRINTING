import axiosInstance from '../lib/axiosInstance'
import type { IScreenplate } from '../views/admin/inventory-sections/types'

interface ScreenplatesResponse {
  status: string
  data: IScreenplate[]
  message?: string
}

interface ScreenplateResponse {
  status: string
  data: IScreenplate
  message?: string
}

export const getAdminScreenplates = async (ownerId?: string): Promise<IScreenplate[]> => {
  const params = ownerId ? { owner_id: ownerId } : {}
  const response = await axiosInstance.get<ScreenplatesResponse>('/api/admin/screenplates', { params })
  return response.data.data
}

export const getAdminScreenplate = async (id: string): Promise<IScreenplate> => {
  const response = await axiosInstance.get<ScreenplateResponse>(`/api/admin/screenplates/${id}`)
  return response.data.data
}

export const createAdminScreenplate = async (data: Partial<IScreenplate>): Promise<IScreenplate> => {
  const response = await axiosInstance.post<ScreenplateResponse>('/api/admin/screenplates', data)
  return response.data.data
}

export const updateAdminScreenplate = async (id: string, data: Partial<IScreenplate>): Promise<IScreenplate> => {
  const response = await axiosInstance.patch<ScreenplateResponse>(`/api/admin/screenplates/${id}`, data)
  return response.data.data
}

export const deleteAdminScreenplate = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/admin/screenplates/${id}`)
}

export const uploadScreenplateImage = async (id: string, file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)
  const response = await axiosInstance.post<{
    status: string
    data: { image: string }
    message: string
  }>(`/api/admin/screenplates/${id}/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data.image
}

// Single-row compatibility/incompatible helpers
export const addScreenplateCompatibility = async (
  screenplateId: string,
  data: { product_id: string; variant_id?: string; print_price_per_unit?: number },
) => {
  const response = await axiosInstance.post(`/api/admin/screenplates/${screenplateId}/compatibility`, data)
  return response.data
}

export const removeScreenplateCompatibility = async (
  screenplateId: string,
  data: { product_id: string; variant_id?: string },
) => {
  const response = await axiosInstance.delete(`/api/admin/screenplates/${screenplateId}/compatibility`, { data })
  return response.data
}

export const addScreenplateIncompatible = async (
  screenplateId: string,
  data: { product_id: string },
) => {
  const response = await axiosInstance.post(`/api/admin/screenplates/${screenplateId}/incompatible`, data)
  return response.data
}

export const removeScreenplateIncompatible = async (
  screenplateId: string,
  data: { product_id: string },
) => {
  const response = await axiosInstance.delete(`/api/admin/screenplates/${screenplateId}/incompatible`, { data })
  return response.data
}
