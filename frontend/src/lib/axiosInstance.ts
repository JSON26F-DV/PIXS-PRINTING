import axios from 'axios'

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

export default axiosInstance
