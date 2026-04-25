import axiosInstance from '../lib/axiosInstance'

export interface CreateOrderPayload {
    cart_item_ids: string[]
    address_id: string
    payment_method_id: string
    delivery_method_id: string
    production_notes?: string
}

export const orderApi = {
    /**
     * Create a new order.
     */
    createOrder: async (orderData: CreateOrderPayload) => {
        const response = await axiosInstance.post(`/api/customer/orders`, orderData)
        return response.data
    }
}
