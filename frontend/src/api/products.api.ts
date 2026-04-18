import axiosInstance from '../lib/axiosInstance'

export const getProducts = async () => {
  const response = await axiosInstance.get('/api/products')
  return response.data
}

export const getProductById = async (id: string) => {
  const response = await axiosInstance.get(`/api/products/${id}`)
  return response.data
}

export const getColors = async () => {
  const response = await axiosInstance.get('/api/colors')
  return response.data
}

export const getCustomerScreenplates = async () => {
  const response = await axiosInstance.get('/api/customer/screenplates')
  return response.data
}
