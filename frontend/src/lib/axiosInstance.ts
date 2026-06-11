import axios, { type AxiosError } from 'axios'
import axiosRetry from 'axios-retry'
import toast from 'react-hot-toast'
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

const RATE_LIMIT_COOLDOWN = 30_000 // 30 seconds
let isRateLimited = false
let rateLimitTimer: ReturnType<typeof setTimeout> | null = null

const axiosInstance = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Auto-retry with exponential backoff ─────────────────────────────────────
// Retries on network errors and 5xx server errors (NOT 4xx — those are final).
// Prevents request loops by spacing out retries with exponential delay.
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => {
    // Exponential backoff: 1s → 2s → 4s
    return axiosRetry.exponentialDelay(retryCount)
  },
  retryCondition: (error) => {
    // Only retry on network errors (no response) or 5xx server errors
    // Never retry 4xx client errors (including 429)
    if (!error.response) return true // network error
    return error.response.status >= 500
  },
  onRetry: (retryCount, error) => {
    console.warn(
      `[axios] Retry #${retryCount} for ${error.config?.url}: ${error.message}`,
    )
  },
})

// ── Client-side rate limiter ───────────────────────────────────────────────
// Blocks ALL outgoing requests for 30s after a 429 response, preventing
// the client from hammering an already-overloaded server.
function enterRateLimit(): void {
  if (isRateLimited) return
  isRateLimited = true

  toast.error(
    'Too many requests. Please wait a moment and try again.',
    { duration: 4000 },
  )

  if (rateLimitTimer) clearTimeout(rateLimitTimer)
  rateLimitTimer = setTimeout(() => {
    isRateLimited = false
    rateLimitTimer = null
  }, RATE_LIMIT_COOLDOWN)
}

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('pixs_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Block request if we're in rate-limit cooldown
  if (isRateLimited) {
    const err = new Error('Too many requests. Please wait a moment and try again.')
    ;(err as Error & { isRateLimited: boolean }).isRateLimited = true
    return Promise.reject(err)
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    // ── 429 Too Many Requests → enter cooldown ──
    if (error.response?.status === 429) {
      enterRateLimit()
    }

    // ── Sanitise error messages ──
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
