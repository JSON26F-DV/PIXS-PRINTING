/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import axiosInstance from '../lib/axiosInstance'

export type RoleType =
  | 'admin'
  | 'staff'
  | 'technician'
  | 'welder'
  | 'inventory'
  | 'customer'
  | 'guest'
  | 'banned'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  name: string
  role: RoleType
  user_type?: 'employee' | 'customer' | 'deleted'
  account_type: 'customer' | 'employee' | 'guest'
  profile_picture: string | null
  isLoggedIn: boolean
}

export interface BannedInfo {
  banned: boolean
  id?: string
  original_id?: string
  account_type: string
  email: string
  reason: string
  deleted_at: string
}

export interface RegisterFormData {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  company_name?: string
}

interface AuthContextType {
  user: User
  bannedInfo: BannedInfo | null
  isLoading: boolean
  loading: boolean
  error: string | null
  fieldErrors: Record<string, string[]>
  login: (
    emailOrUserObj: string | Partial<User>,
    pass?: string,
  ) => Promise<void>
  register: (data: RegisterFormData) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

const GUEST_USER: User = {
  id: '',
  email: '',
  first_name: 'Guest',
  last_name: '',
  name: 'Guest',
  role: 'guest',
  account_type: 'guest',
  profile_picture: null,
  isLoggedIn: false,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Initialize token immediately for fetchMe or other early calls
const token = localStorage.getItem('pixs_token')
if (token) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('pixs_user')
    if (saved) {
      try {
        return { ...JSON.parse(saved), isLoggedIn: true }
      } catch {
        return GUEST_USER
      }
    }
    return GUEST_USER
  })
  const [bannedInfo, setBannedInfo] = useState<BannedInfo | null>(null)
  const [isLoading, setIsLoading] = useState(
    () =>
      !localStorage.getItem('pixs_user') &&
      !!localStorage.getItem('pixs_token'),
  )
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const navigate = useNavigate()

  const handleAuthSuccess = useCallback(
    (data: { token: string; user: any; account_type: string }) => {
      localStorage.setItem('pixs_token', data.token)
      axiosInstance.defaults.headers.common['Authorization'] =
        `Bearer ${data.token}`

      const loggedInUser: User = {
        ...data.user,
        name:
          `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() ||
          data.user.name,
        account_type: data.account_type,
        isLoggedIn: true,
      }
      setUser(loggedInUser)
      localStorage.setItem('pixs_user', JSON.stringify(loggedInUser))

      if (loggedInUser.account_type === 'customer') {
        navigate('/')
      } else if (loggedInUser.account_type === 'employee') {
        switch (loggedInUser.role) {
          case 'admin':
            navigate('/admin/dashboard')
            break
          case 'staff':
          case 'technician':
          case 'welder':
            navigate('/staff/overview')
            break
          case 'inventory':
            navigate('/inventory/overview')
            break
          default:
            navigate('/homepage')
        }
      }
    },
    [navigate],
  )

  const login = async (
    emailOrObj: string | Partial<User>,
    password?: string,
  ) => {
    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      setUser({
        ...user,
        ...emailOrObj,
        isLoggedIn: true,
        name: emailOrObj.name || 'Mock User',
      })
      if (emailOrObj.role === 'customer') navigate('/homepage')
      else if (emailOrObj.role === 'admin') navigate('/admin/dashboard')
      else if (
        ['staff', 'technician', 'welder'].includes(emailOrObj.role as string)
      )
        navigate('/staff/overview')
      else if (emailOrObj.role === 'inventory') navigate('/inventory/overview')
      else navigate('/homepage')
      return
    }

    const email = emailOrObj
    setIsLoading(true)
    setError(null)
    setFieldErrors({})
    try {
      const res = await axiosInstance.post('/api/auth/login', {
        email,
        password,
      })
      handleAuthSuccess(res.data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorResponse = err.response
        if (errorResponse?.status === 403 && errorResponse?.data?.banned) {
          setBannedInfo(errorResponse.data)
          setUser(GUEST_USER)
          localStorage.removeItem('pixs_token')
          localStorage.removeItem('pixs_user')
          navigate('/delete-account')
        } else if (errorResponse?.status === 422) {
          setFieldErrors(errorResponse.data.errors)
        } else {
          setError(errorResponse?.data?.message || 'Login failed')
        }
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (formData: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    setFieldErrors({})
    try {
      const res = await axiosInstance.post('/api/auth/register', formData)
      handleAuthSuccess(res.data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorResponse = err.response
        if (errorResponse?.status === 403 && errorResponse?.data?.banned) {
          setBannedInfo(errorResponse.data)
          setUser(GUEST_USER)
          localStorage.removeItem('pixs_token')
          localStorage.removeItem('pixs_user')
          navigate('/delete-account')
        } else if (errorResponse?.status === 422) {
          setFieldErrors(errorResponse.data.errors)
        } else {
          setError(errorResponse?.data?.message || 'Registration failed')
        }
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await axiosInstance.post('/api/auth/logout')
    } catch (err: unknown) {
      console.error('Logout error', err)
    } finally {
      localStorage.removeItem('pixs_token')
      localStorage.removeItem('pixs_user')
      delete axiosInstance.defaults.headers.common['Authorization']
      setUser(GUEST_USER)
      setIsLoading(false)
      navigate('/login')
    }
  }

  const fetchMe = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await axiosInstance.get('/api/auth/me')
      const userData = res.data.user
      const fetchedUser: User = {
        ...userData,
        name:
          `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
          userData.name,
        account_type: res.data.account_type,
        isLoggedIn: true,
      }
      setUser(fetchedUser)
      localStorage.setItem('pixs_user', JSON.stringify(fetchedUser))
    } catch {
      localStorage.removeItem('pixs_token')
      localStorage.removeItem('pixs_user')
      setUser(GUEST_USER)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('pixs_token')
    if (token) {
      fetchMe()
    } else {
      setIsLoading(false)
    }
  }, [fetchMe])

  return (
    <AuthContext.Provider
      value={{
        user,
        bannedInfo,
        isLoading,
        loading: isLoading,
        error,
        fieldErrors,
        login,
        register,
        logout,
        fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
