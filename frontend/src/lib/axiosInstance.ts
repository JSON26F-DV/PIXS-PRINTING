import axios, { type AxiosError } from 'axios'
import axiosRetry from 'axios-retry'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

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

// Store navigate function globally for use in interceptor
let globalNavigate: ReturnType<typeof useNavigate> | null = null

export const setGlobalNavigate = (navigate: ReturnType<typeof useNavigate>) => {
  globalNavigate = navigate
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; banned?: boolean }>) => {
    const status = error.response?.status

    // ── 401 Unauthorized → Session expired ──
    if (status === 401) {
      const isAuthRequest = error.config?.url?.includes('/api/auth/login') || error.config?.url?.includes('/api/auth/register')
      const isPublicPage = ['/login', '/register', '/'].includes(window.location.pathname)

      if (isAuthRequest || isPublicPage) {
        return Promise.reject(error)
      }

      const token = localStorage.getItem('pixs_token')
      const userData = localStorage.getItem('pixs_user')
      
      // Clear session storage
      localStorage.removeItem('pixs_token')
      localStorage.removeItem('pixs_user')
      delete axiosInstance.defaults.headers.common['Authorization']
      
      // Show toast with duration (auto-dismiss after 3 seconds)
      toast.error('Session expired. Please login again.', {
        duration: 3000,
        id: 'session-expired', // Use ID to prevent duplicate toasts
      })
      
      // Redirect based on login status
      if (token && userData) {
        // Was logged in → redirect to homepage/dashboard
        const user = JSON.parse(userData)
        const role = user?.role || 'customer'
        const homePath = getHomePathForRole(role)
        if (globalNavigate) {
          globalNavigate(homePath, { replace: true })
        } else {
          window.location.href = homePath
        }
      } else {
        // Was not logged in → refresh current page
        window.location.reload()
      }
      
      return Promise.reject(error)
    }

    // ── 403 Forbidden ──
    if (status === 403) {
      toast.error('Access denied.', {
        duration: 3000,
        id: 'access-denied',
      })
      
      // If banned, redirect to delete-account page
      if (error.response?.data?.banned) {
        if (globalNavigate) {
          globalNavigate('/delete-account', { replace: true })
        } else {
          window.location.href = '/delete-account'
        }
      }
      
      return Promise.reject(error)
    }

    // ── 429 Too Many Requests → enter cooldown ──
    if (status === 429) {
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

// Helper function to get home path based on role
function getHomePathForRole(role: string): string {
  const paths: Record<string, string> = {
    admin: '/admin/dashboard',
    staff: '/staff/overview',
    technician: '/staff/overview',
    inventory: '/inventory/overview',
    customer: '/homepage',
  }
  return paths[role] || '/'
}

export default axiosInstance
