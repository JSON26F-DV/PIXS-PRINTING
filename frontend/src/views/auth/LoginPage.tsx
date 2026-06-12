import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import toast, { Toaster } from 'react-hot-toast'
import { m, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import AuthNavbar from '../../components/auth/AuthNavbar'
import Footer from '../../components/Footer/Footer'

const LoginPage: React.FC = () => {
  const { login, loading: isLoading, error: authError, fieldErrors, clearAuthErrors } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const clearErrors = () => {
    setSubmitError(null)
    clearAuthErrors()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    if (!email || !password) {
      toast.error('Please enter both email and password.')
      return
    }

    try {
      toast.loading('Signing in...', { id: 'login' })
      await login(email, password)
      toast.success('Welcome back!', { id: 'login' })
    } catch {
      setSubmitError(authError || 'Login failed. Please check your credentials.')
      toast.error('Login failed.', { id: 'login' })
    }
  }

  const handleOAuth = (provider: 'google' | 'facebook') => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    window.location.href = `${apiUrl}/api/auth/${provider}`
  }

  const variants = {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthNavbar />
      
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 md:pt-15! pt-10! mt-10! md:mt-20! pb-12">
        <Toaster position="top-right" />
        
        {/* Google-like wide rectangle wrapper */}
        <div className="w-full border border-slate-300 max-w-[1040px] bg-white rounded-[32px] md:rounded-[40px] shadow-slate-200 overflow-hidden relative flex flex-col md:flex-row min-h-[500px]">
          
          {/* Left Column (Labels, Title) */}
          <div className="w-full md:w-5/12 p-8 md:p-14 flex flex-col justify-start relative">
            <div className="mb-4 hidden md:block">
               {/* PIXS Mint Logo */}
               <div className="bg-pixs-mint flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-black text-slate-900 shadow-lg shadow-pixs-mint/20 mb-6">
                 P
               </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-tight italic uppercase">
              Sign in to<br/>PIXS
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 font-medium">
              Use your PIXS Account
            </p>

            {/* Only visible on desktop */}
            <div className="hidden md:block mt-auto pt-8">
              <p className="text-sm font-bold text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#1a73e8] hover:underline hover:text-[#1557b0] transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>

          {/* Right Column (Inputs) */}
          <div className="w-full md:w-7/12 p-8 md:p-14 md:pl-8 flex flex-col justify-between">
            <form onSubmit={handleLogin} noValidate>
              {(authError || submitError) && (
                <div className="mb-6 rounded-2xl bg-rose-50 p-4 border border-rose-100">
                  <p className="text-xs font-bold text-rose-600">
                    {typeof authError === 'string' ? authError : submitError}
                  </p>
                  {fieldErrors && Object.entries(fieldErrors).map(([key, msgs]) => (
                    <p key={key} className="text-[10px] text-rose-500 italic mt-1">
                      {key}: {Array.isArray(msgs) ? msgs.join(', ') : msgs}
                    </p>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                <m.div
                  key="login-form"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4 pt-2"
                >
                  <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                    <label className="text-xs font-medium text-slate-500">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        clearErrors()
                      }}
                    />
                  </div>
                  
                  <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                    <label className="text-xs font-medium text-slate-500">Password</label>
                    <div className="flex items-center justify-between">
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1 pr-10"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          clearErrors()
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to="/forgot-password" className="text-sm font-bold text-[#1a73e8] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </m.div>
              </AnimatePresence>

              {/* Bottom Actions */}
              <div className="mt-8 flex items-center justify-between">
                <Link
                  to="/"
                  className="px-6 py-2 text-sm font-bold text-[#1a73e8] hover:bg-[#1a73e8]/10 rounded-full transition-colors active:scale-95"
                >
                  Back
                </Link>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-colors shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Wait...' : 'Login'}
                </button>
              </div>
            </form>

            {/* Mobile Register link */}
            <div className="md:hidden mt-8 pt-6 border-t border-slate-100 text-center text-sm font-bold text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-[#1a73e8] hover:underline"
              >
                Create account
              </Link>
            </div>
            
            {/* Social Oauth Buttons */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex gap-4 flex-col sm:flex-row">
                <button
                  onClick={() => handleOAuth('google')}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full py-2.5 text-xs font-bold text-slate-700 transition-colors"
                >
                  Google
                </button>
                <button
                  onClick={() => handleOAuth('facebook')}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2]/5 hover:bg-[#1877F2]/10 border border-[#1877F2]/10 rounded-full py-2.5 text-xs font-bold text-[#1877F2] transition-colors"
                >
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default LoginPage
