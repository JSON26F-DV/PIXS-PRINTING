import axios, { type AxiosError } from 'axios'
import {
  AUTH_MESSAGES,
  isTechnicalMessage,
  sanitizeAuthMessage,
} from '../utils/authErrors'

// Empty baseURL in dev → requests use Vite proxy (/api → Laravel).
// Set VITE_BACKEND_URL or VITE_API_URL for direct Laravel URL if needed.
const apiBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  ''

const axiosInstance = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('pixs_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.data?.message) {
      const safe = sanitizeAuthMessage(
        error.response.data.message,
        AUTH_MESSAGES.serverError,
      )
      if (safe !== error.response.data.message) {
        error.response.data = {
          ...error.response.data,
          message: safe,
        }
      }
    } else if (
      error.message &&
      isTechnicalMessage(error.message) &&
      error.response
    ) {
      error.message = AUTH_MESSAGES.serverError
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
