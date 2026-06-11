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
import {
  AUTH_MESSAGES,
  getAuthErrorMessage,
  sanitizeFieldErrors,
} from '../utils/authErrors'
import {
  getHomePathForRole,
  normalizeRole,
} from '../utils/authRouting'
import {
  normalizeLoginEmail,
  validateLoginForm,
} from '../utils/loginValidation'

export type RoleType =
  | 'admin'
  | 'staff'
  | 'technician'
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
  status: string
  age?: number
  gender?: string
  company_name?: string
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

interface RawUserData {
  id: string
  email: string
  first_name?: string
  last_name?: string
  name?: string
  role?: RoleType | string
  user_type?: 'employee' | 'customer' | 'deleted'
  profile_picture?: string | null
  status?: string
  age?: number
  gender?: string
  company_name?: string
}

interface AuthSuccessPayload {
  token: string
  user: RawUserData
  account_type: string
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
  phone: string
  street: string
  region: string
  province: string
  city: string
  barangay: string
  postal_code?: string
  regionCode?: string
  provinceCode?: string
  municipalityCode?: string
  barangayCode?: string
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
  clearAuthErrors: () => void
}

function parseStoredUser(): User {
  const saved = localStorage.getItem('pixs_user')
  if (!saved) return GUEST_USER
  try {
    const parsed = JSON.parse(saved) as Partial<User>
    const accountType =
      parsed.account_type === 'employee' || parsed.account_type === 'customer'
        ? parsed.account_type
        : 'guest'
    return {
      ...GUEST_USER,
      ...parsed,
      role: normalizeRole(parsed.role, accountType),
      account_type: accountType,
      profile_picture: parsed.profile_picture ?? null,
      isLoggedIn: true,
    }
  } catch {
    return GUEST_USER
  }
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
  status: 'active',
  isLoggedIn: false,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const token = localStorage.getItem('pixs_token')
if (token) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User>(parseStoredUser)
  const [bannedInfo, setBannedInfo] = useState<BannedInfo | null>(null)
  const [isInitializing, setIsInitializing] = useState(
    () => !!localStorage.getItem('pixs_token') && !localStorage.getItem('pixs_user'),
  )
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const navigate = useNavigate()

  const clearAuthErrors = useCallback(() => {
    setError(null)
    setFieldErrors({})
  }, [])

  const handleAuthSuccess = useCallback(
    (data: AuthSuccessPayload) => {
      if (!data?.token || !data?.user) {
        setError('Authentication service is currently unavailable.')
        return
      }

      const accountType =
        data.account_type === 'employee' ||
        data.account_type === 'customer'
          ? data.account_type
          : 'guest'

      const role = normalizeRole(data.user.role, accountType)

      const loggedInUser: User = {
        id: data.user.id,
        email: data.user.email,
        first_name: data.user.first_name ?? '',
        last_name: data.user.last_name ?? '',
        role,
        name:
          `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() ||
          data.user.name ||
          data.user.email,
        account_type: accountType,
        profile_picture: data.user.profile_picture ?? null,
        status: data.user.status ?? 'active',
        age: data.user.age,
        gender: data.user.gender,
        company_name: data.user.company_name,
        isLoggedIn: true,
      }

      localStorage.setItem('pixs_token', data.token)
      axiosInstance.defaults.headers.common['Authorization'] =
        `Bearer ${data.token}`
      setUser(loggedInUser)
      localStorage.setItem('pixs_user', JSON.stringify(loggedInUser))
      navigate(getHomePathForRole(role))
    },
    [navigate],
  )

  const login = async (
    emailOrObj: string | Partial<User>,
    password?: string,
  ) => {
    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      const role = normalizeRole(
        emailOrObj.role,
        emailOrObj.account_type === 'employee' ? 'employee' : 'customer',
      )
      setUser({
        ...GUEST_USER,
        ...emailOrObj,
        role,
        isLoggedIn: true,
        name: emailOrObj.name || 'Mock User',
        account_type:
          emailOrObj.account_type === 'employee' ? 'employee' : 'customer',
      })
      navigate(getHomePathForRole(role))
      return
    }

    const normalizedEmail = normalizeLoginEmail(emailOrObj)
    const clientValidation = validateLoginForm({
      email: normalizedEmail,
      password: password ?? '',
    })

    if (!clientValidation.valid) {
      const nextFieldErrors: Record<string, string[]> = {}
      if (clientValidation.email) {
        nextFieldErrors.email = [clientValidation.email]
      }
      if (clientValidation.password) {
        nextFieldErrors.password = [clientValidation.password]
      }
      setFieldErrors(nextFieldErrors)
      setError(
        clientValidation.form ??
          clientValidation.email ??
          clientValidation.password ??
          AUTH_MESSAGES.validationFailed,
      )
      return
    }

    setIsAuthLoading(true)
    setError(null)
    setFieldErrors({})
    try {
      const res = await axiosInstance.post<AuthSuccessPayload>(
        '/api/auth/login',
        { email: normalizedEmail, password },
      )
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
          const errors = sanitizeFieldErrors(errorResponse.data?.errors)
          setFieldErrors(errors)
          const first = Object.values(errors).flat()[0]
          setError(first ?? AUTH_MESSAGES.validationFailed)
        } else {
          setError(getAuthErrorMessage(err, AUTH_MESSAGES.invalidCredentials))
        }
      } else {
        setError(AUTH_MESSAGES.unexpected)
      }
    } finally {
      setIsAuthLoading(false)
    }
  }

  const register = async (formData: RegisterFormData) => {
    setIsAuthLoading(true)
    setError(null)
    setFieldErrors({})
    try {
      const payload: RegisterFormData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        phone: formData.phone,
        street: formData.street,
        region: formData.region,
        province: formData.province,
        city: formData.city,
        barangay: formData.barangay,
      }
      if (formData.age != null && formData.age > 0) {
        payload.age = formData.age
      }
      if (formData.gender) {
        payload.gender = formData.gender
      }
      if (formData.company_name?.trim()) {
        payload.company_name = formData.company_name.trim()
      }
      if (formData.postal_code) {
        payload.postal_code = formData.postal_code
      }
      if (formData.regionCode) {
        payload.regionCode = formData.regionCode
      }
      if (formData.provinceCode) {
        payload.provinceCode = formData.provinceCode
      }
      if (formData.municipalityCode) {
        payload.municipalityCode = formData.municipalityCode
      }
      if (formData.barangayCode) {
        payload.barangayCode = formData.barangayCode
      }

      const res = await axiosInstance.post<AuthSuccessPayload>(
        '/api/auth/register',
        payload,
      )
      handleAuthSuccess({
        token: res.data.token,
        account_type: 'customer',
        user: {
          ...res.data.user,
          role: 'customer',
        },
      })
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
          const errors = sanitizeFieldErrors(errorResponse.data?.errors)
          setFieldErrors(errors)
          const first = Object.values(errors).flat()[0]
          setError(first ?? AUTH_MESSAGES.validationFailed)
        } else {
          setError(getAuthErrorMessage(err, AUTH_MESSAGES.unexpected))
        }
      } else {
        setError(AUTH_MESSAGES.unexpected)
      }
      throw err
    } finally {
      setIsAuthLoading(false)
    }
  }

  const logout = async () => {
    setIsAuthLoading(true)
    try {
      await axiosInstance.post('/api/auth/logout')
    } catch (err: unknown) {
      console.error('Logout error', err)
    } finally {
      localStorage.removeItem('pixs_token')
      localStorage.removeItem('pixs_user')
      delete axiosInstance.defaults.headers.common['Authorization']
      setUser(GUEST_USER)
      setIsAuthLoading(false)
      navigate('/login')
    }
  }

  const fetchMe = useCallback(async () => {
    setIsInitializing(true)
    try {
      const res = await axiosInstance.get<{
        account_type: string
        user: RawUserData
      }>('/api/auth/me')

      const accountType =
        res.data.account_type === 'employee' ? 'employee' : 'customer'
      const role = normalizeRole(res.data.user?.role, accountType)
      const userData = res.data.user

      if (!userData?.id) {
        throw new Error('Missing user in /me response')
      }

      const fetchedUser: User = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name ?? '',
        last_name: userData.last_name ?? '',
        role,
        name:
          `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
          userData.name ||
          userData.email,
        account_type: accountType,
        profile_picture: userData.profile_picture ?? null,
        status: userData.status ?? 'active',
        age: userData.age,
        gender: userData.gender,
        company_name: userData.company_name,
        isLoggedIn: true,
      }
      setUser(fetchedUser)
      localStorage.setItem('pixs_user', JSON.stringify(fetchedUser))
    } catch {
      localStorage.removeItem('pixs_token')
      localStorage.removeItem('pixs_user')
      setUser(GUEST_USER)
    } finally {
      setIsInitializing(false)
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('pixs_token')
    if (storedToken) {
      fetchMe()
    } else {
      setIsInitializing(false)
    }
  }, [fetchMe])

  return (
    <AuthContext.Provider
      value={{
        user,
        bannedInfo,
        isLoading: isInitializing,
        loading: isAuthLoading,
        error,
        fieldErrors,
        login,
        register,
        logout,
        fetchMe,
        clearAuthErrors,
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
