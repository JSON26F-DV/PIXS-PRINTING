import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import axiosInstance from '../../lib/axiosInstance'
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import type { RegisterFormData } from '../../context/AuthContext'
import CustomerNavbar from '../../components/customer/CustomerNavbar'
import Footer from '../../components/Footer/Footer'

function validatePasswordClient(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.'
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must include at least one letter.'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.'
  }
  return null
}

const RegisterPage: React.FC = () => {
  const { register, loading: isSubmitting, error, fieldErrors } = useAuth()
  const [apiStatus, setApiStatus] = useState<
    'checking' | 'ok' | 'offline' | null
  >(null)
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    age: undefined,
    gender: undefined,
    company_name: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = localError || error
  const passwordsMatch =
    !formData.password_confirmation ||
    formData.password === formData.password_confirmation

  const getFieldError = (field: keyof RegisterFormData | string) =>
    fieldErrors[field]?.[0]

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'age' ? (value ? Number(value) : undefined) : value,
    }))
  }

  useEffect(() => {
    let cancelled = false
    const checkApi = async () => {
      setApiStatus('checking')
      try {
        await axiosInstance.get('/api/delivery-methods', { timeout: 5000 })
        if (!cancelled) setApiStatus('ok')
      } catch {
        if (!cancelled) setApiStatus('offline')
      }
    }
    checkApi()
    return () => {
      cancelled = true
    }
  }, [])

  const handleOAuth = (provider: 'google' | 'facebook') => {
    const apiUrl =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      ''
    window.location.href = `${apiUrl}/api/auth/${provider}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!agreedToTerms) {
      const msg =
        'Please accept the Terms and Conditions of PIXS Printing Shop.'
      setLocalError(msg)
      alert(`Registration blocked:\n${msg}`)
      return
    }

    if (formData.password !== formData.password_confirmation) {
      const msg = 'Passwords do not match.'
      setLocalError(msg)
      alert(`Registration blocked:\n${msg}`)
      return
    }

    try {
      await register(formData)
    } catch (err: unknown) {
      let message = 'Registration failed.'
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          message =
            'Cannot reach Laravel API.\n\n' +
            '1. Start XAMPP → MySQL/MariaDB\n' +
            '2. In backend/: php artisan serve\n' +
            '3. In frontend/: npm run dev\n\n' +
            `Details: ${err.message}`
        } else {
          const data = err.response.data as {
            message?: string
            errors?: Record<string, string[]>
          }
          if (data.errors) {
            const lines = Object.entries(data.errors)
              .map(([k, v]) => `${k}: ${v.join(', ')}`)
              .join('\n')
            message = lines || data.message || message
          } else {
            message = data.message || `HTTP ${err.response.status}`
          }
        }
      } else if (err instanceof Error) {
        message = err.message
      }
      setLocalError(message)
      alert(`Registration error:\n\n${message}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CustomerNavbar />

      <main className="flex flex-grow items-center justify-center bg-slate-50 p-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-[48px] border border-slate-100 bg-white shadow-2xl md:grid-cols-2"
        >
          {/* Left: Brand panel */}
          <div className="relative hidden flex-col justify-between bg-slate-900 p-16 text-white md:flex">
            <motion.div className="pointer-events-none absolute inset-0 opacity-10">
              <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full border-[40px] border-pixs-mint" />
              <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-pixs-mint" />
            </motion.div>

            <div className="relative z-10">
              <div className="bg-pixs-mint mb-10 flex h-14 w-14 items-center justify-center rounded-[20px] text-3xl font-black text-slate-900 shadow-lg shadow-pixs-mint/20">
                P
              </div>
              <h1 className="text-5xl leading-tight font-black tracking-tighter uppercase italic">
                JOIN <span className="text-slate-400">PIXS</span>
                <br />
                <span className="text-pixs-mint">CUSTOMER HUB</span>
              </h1>
              <p className="mt-8 text-[10px] font-black tracking-[8px] text-slate-400 uppercase">
                Customer Enrollment / v8.2.0
              </p>
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                  <ShieldCheck className="text-pixs-mint" size={20} />
                </div>
                <div>
                  <p className="text-xs font-black tracking-widest uppercase italic">
                    Secure Registration
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Bcrypt hashing · 30-day session tokens
                  </p>
                </div>
              </div>

              <motion.div className="border-t border-white/10 pt-8">
                <p className="font-mono text-[9px] leading-relaxed text-slate-500 uppercase">
                  Create a customer account to browse products, place orders,
                  track production, and manage delivery addresses. Employee
                  accounts are provisioned by administrators only.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right: Registration form */}
          <div className="flex flex-col justify-center p-10 md:p-16 lg:p-20">
            <div className="mb-10">
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
                Create <span className="text-pixs-mint">Account</span>
              </h2>
              <p className="mt-3 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
                Customer credentials only
              </p>
            </div>

            {apiStatus === 'offline' && (
              <div className="mb-6 border-l-4 border-amber-500 bg-amber-50 p-5">
                <p className="text-[10px] font-black tracking-widest text-amber-800 uppercase">
                  API offline — start XAMPP MySQL, then run{' '}
                  <span className="font-mono">php artisan serve</span> in backend/
                </p>
              </div>
            )}

            {apiStatus === 'ok' && (
              <p className="mb-4 text-[9px] font-bold tracking-widest text-emerald-600 uppercase">
                Laravel API connected
              </p>
            )}

            {displayError && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 border-l-4 border-rose-500 bg-rose-50 p-5"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-500" />
                  <p className="text-[10px] font-black tracking-widest text-rose-700 uppercase italic">
                    {displayError}
                  </p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="group relative">
                    <User
                      className="group-focus-within:text-pixs-mint absolute top-1/2 left-4 -translate-y-1/2 text-slate-300 transition-colors"
                      size={18}
                    />
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="focus:border-pixs-mint w-full rounded-[20px] border border-slate-100 bg-slate-50 py-4 pr-4 pl-12 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5"
                      placeholder="Juan"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  {getFieldError('first_name') && (
                    <p className="text-[9px] font-bold text-rose-600 uppercase">
                      {getFieldError('first_name')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="focus:border-pixs-mint w-full rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5"
                    placeholder="Dela Cruz"
                    required
                    autoComplete="family-name"
                  />
                  {getFieldError('last_name') && (
                    <p className="text-[9px] font-bold text-rose-600 uppercase">
                      {getFieldError('last_name')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                  Email <span className="text-rose-400">*</span>
                </label>
                <div className="group relative">
                  <Mail
                    className="group-focus-within:text-pixs-mint absolute top-1/2 left-4 -translate-y-1/2 text-slate-300 transition-colors"
                    size={18}
                  />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="focus:border-pixs-mint w-full rounded-[20px] border border-slate-100 bg-slate-50 py-4 pr-4 pl-12 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                {getFieldError('email') && (
                  <p className="text-[9px] font-bold text-rose-600 uppercase">
                    {getFieldError('email')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Age <span className="text-slate-300">(optional)</span>
                  </label>
                  <div className="group relative">
                    <Calendar
                      className="group-focus-within:text-pixs-mint absolute top-1/2 left-4 -translate-y-1/2 text-slate-300 transition-colors"
                      size={18}
                    />
                    <input
                      name="age"
                      type="number"
                      min={1}
                      max={120}
                      value={formData.age ?? ''}
                      onChange={handleInputChange}
                      className="focus:border-pixs-mint w-full rounded-[20px] border border-slate-100 bg-slate-50 py-4 pr-4 pl-12 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5"
                      placeholder="21"
                    />
                  </div>
                  {getFieldError('age') && (
                    <p className="text-[9px] font-bold text-rose-600 uppercase">
                      {getFieldError('age')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Gender <span className="text-slate-300">(optional)</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender ?? ''}
                    onChange={handleInputChange}
                    className="focus:border-pixs-mint w-full cursor-pointer rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {getFieldError('gender') && (
                    <p className="text-[9px] font-bold text-rose-600 uppercase">
                      {getFieldError('gender')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                  Company <span className="text-slate-300">(optional)</span>
                </label>
                <div className="group relative">
                  <Building2
                    className="group-focus-within:text-pixs-mint absolute top-1/2 left-4 -translate-y-1/2 text-slate-300 transition-colors"
                    size={18}
                  />
                  <input
                    name="company_name"
                    value={formData.company_name ?? ''}
                    onChange={handleInputChange}
                    className="focus:border-pixs-mint w-full rounded-[20px] border border-slate-100 bg-slate-50 py-4 pr-4 pl-12 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5"
                    placeholder="Your shop or brand"
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="group relative">
                    <Lock
                      className="group-focus-within:text-pixs-mint absolute top-1/2 left-4 -translate-y-1/2 text-slate-300 transition-colors"
                      size={18}
                    />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="focus:border-pixs-mint w-full rounded-[20px] border border-slate-100 bg-slate-50 py-4 pr-12 pl-12 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5"
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-300 transition-colors hover:text-slate-900"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {getFieldError('password') && (
                    <p className="text-[9px] font-bold text-rose-600 uppercase">
                      {getFieldError('password')}
                    </p>
                  )}
                  <p className="text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                    Min 8 chars · letters, numbers & symbols
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute top-1/2 left-4 -translate-y-1/2 ${passwordsMatch && formData.password_confirmation ? 'text-pixs-mint' : 'text-slate-300'}`}
                    >
                      {passwordsMatch && formData.password_confirmation ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Lock size={18} />
                      )}
                    </div>
                    <input
                      name="password_confirmation"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                      className={`focus:border-pixs-mint w-full rounded-[20px] border bg-slate-50 py-4 pr-4 pl-12 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5 ${passwordsMatch ? 'border-slate-100' : 'border-rose-300'}`}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 py-1">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="text-pixs-mint focus:ring-pixs-mint mt-0.5 h-5 w-5 rounded-lg border-slate-200"
                />
                <span className="text-[9px] leading-relaxed font-black tracking-[1px] text-slate-400 uppercase">
                  I agree to the Terms and Conditions and Privacy Policy of
                  PIXS Printing Shop.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !passwordsMatch || !agreedToTerms}
                className="group relative flex w-full items-center justify-center gap-4 rounded-[28px] bg-slate-900 py-5 text-xs font-black tracking-[5px] text-white uppercase shadow-2xl transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-2"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="rounded-[20px] border border-slate-100 bg-slate-50 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-white hover:shadow-md"
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('facebook')}
                className="rounded-[20px] border border-slate-100 bg-slate-50 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-white hover:shadow-md"
              >
                Facebook
              </button>
            </div>

            <div className="mt-10 text-center">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Already have an account?{' '}
                <Link to="/login" className="text-pixs-mint hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

export default RegisterPage
