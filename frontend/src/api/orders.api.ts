import axiosInstance from '../lib/axiosInstance'
import { isAxiosError } from 'axios'
import type { Order } from '../pages/Order/components/OrderCard'

export interface CreateOrderPayload {
    cart_item_ids: string[]
    address_id: string
    payment_method_id: string
    delivery_method_id: string
    production_notes?: string
    discount_id?: string | null
}

function handleApiError(error: unknown): never {
    if (isAxiosError(error)) {
        if (error.response?.status === 401) {
            localStorage.removeItem('pixs_token')
            window.location.href = '/login'
        }
        
        const message = error.response?.data?.message || error.message || 'An error occurred'
        throw new Error(`API Error: ${error.response?.status || 'Unknown'} - ${message}`)
    }
    
    if (error instanceof Error) {
        throw error
    }
    
    throw new Error('An unknown network error occurred')
}

export const orderApi = {
    /**
     * Create a new order.
     */
    createOrder: async (orderData: CreateOrderPayload) => {
        const response = await axiosInstance.post(`/api/customer/orders`, orderData)
        return response.data
    },

    /**
     * Get all orders for the current user.
     */
    getOrders: async (): Promise<Order[]> => {
        try {
            const response = await axiosInstance.get('/api/customer/orders')
            return response.data as Order[]
        } catch (error) {
            return handleApiError(error)
        }
    },

    /**
     * Update an existing order (status, reviews, etc)
     */
    updateOrder: async (id: string, payload: Partial<{
        status: string
        admin_comment: string
        rating: number
        feedback: string
        complaint: string
    }>): Promise<Order> => {
        try {
            const response = await axiosInstance.patch(`/api/customer/orders/${id}`, payload)
            return response.data as Order
        } catch (error) {
            return handleApiError(error)
        }
    },
    
    /**
     * Get a single order by ID.
     */
    getOrderById: async (id: string): Promise<Order> => {
        try {
            const response = await axiosInstance.get(`/api/customer/orders/${id}`)
            return response.data as Order
        } catch (error) {
            return handleApiError(error)
        }
    }
}
