import axiosInstance from '../lib/axiosInstance'

export interface IScreenplateRequestPayload {
  product_id: string
  variant_id: string
  color_count: number
  alignment: string
  reference_image: string | null // Base64 or URL
  comment?: string
  calculated_total: number
}

export const createScreenplateRequest = async (payload: IScreenplateRequestPayload) => {
  const response = await axiosInstance.post('/api/customer/screenplate-requests', payload)
  return response.data
}
