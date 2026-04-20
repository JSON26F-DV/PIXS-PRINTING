import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const orderApi = {
    /**
     * Create a new order.
     */
    createOrder: async (orderData: any) => {
        const response = await axios.post(`${API_URL}/orders`, orderData, {
            withCredentials: true,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        })
        return response.data
    }
}
