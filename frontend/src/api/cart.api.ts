import axiosInstance from '../lib/axiosInstance'

export const getCart = async () => {
  const response = await axiosInstance.get('/api/cart')
  return response.data
}

export const addToCart = async (data: any) => {
  const response = await axiosInstance.post('/api/cart', data)
  return response.data
}

export const updateCartItem = async (id: string, data: any) => {
  const response = await axiosInstance.patch(`/api/cart/${id}`, data)
  return response.data
}

export const removeFromCart = async (id: string) => {
  const response = await axiosInstance.delete(`/api/cart/${id}`)
  return response.data
}
