import axiosInstance from '../lib/axiosInstance'
import type { IUser } from '../views/admin/inventory-sections/types'

interface CustomersResponse {
  status: string
  data: IUser[]
}

export const getAdminCustomers = async (search?: string): Promise<IUser[]> => {
  const params = search ? { search } : {}
  const response = await axiosInstance.get<CustomersResponse>('/api/admin/customers', { params })
  return response.data.data
}
