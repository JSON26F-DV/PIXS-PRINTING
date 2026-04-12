import React, { useState } from 'react'
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

interface LoginProps {
  isOpen?: boolean
  onClose?: () => void
}

const Login: React.FC<LoginProps> = ({ isOpen = true, onClose }) => {
  const { login, error: authError, isLoading } = useAuth()
  const [email, setEmail] = useState('jason@pixs.com')
  const [password, setPassword] = useState('password')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = localError || authError

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreedToTerms) {
      setLocalError(
        'Please accept the Terms and Conditions of PIXS Printing Shop.',
      )
      return
    }

    setLocalError(null)

    try {
      // AuthContext.login() handles:
      //  - POST /api/auth/login
      //  - Token storage in localStorage
      //  - User state update
      //  - Role-based navigation (customer → /homepage, admin → /admin/dashboard, etc.)
      //  - Banned account detection → /delete-account
      await login(email, password)
      if (onClose) onClose()
    } catch {
      // AuthContext sets its own error state; nothing else needed here
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 grid w-full max-w-[1000px] grid-cols-1 overflow-hidden rounded-[48px] border border-slate-200 bg-white shadow-2xl md:grid-cols-2"
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
            >
              <X size={20} />
            </button>
          )}

          {/* Left Side: Brand/Visual */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white md:flex">
            <div className="pointer-events-none absolute top-0 left-0 h-full w-full opacity-10">
              <div className="border-pixs-mint absolute top-10 left-10 h-32 w-32 rounded-full border-4" />
              <div className="bg-pixs-mint absolute right-10 bottom-20 h-20 w-20 rounded-full" />
            </div>

            <div className="relative z-10">
              <div className="bg-pixs-mint mb-8 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-black text-slate-900">
                P
              </div>
              <h1 className="text-4xl leading-tight font-black tracking-tight">
                PIXS <span className="text-slate-400">SHOP</span>
                <br />
                <span className="text-pixs-mint">OPERATING SYSTEM</span>
              </h1>
              <p className="mt-6 text-sm font-bold tracking-[4px] text-slate-400 uppercase">
                Mission Control v8.0
              </p>
            </div>

            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="text-pixs-mint" size={20} />
                <p className="text-xs font-bold text-slate-300">
                  Secure AES-256 Encrypted Access
                </p>
              </div>
              <p className="font-mono text-[10px] text-slate-500 italic">
                Unauthorized access is strictly monitored. By logging in, you
                agree to the Pixs Printing Shop security protocols.
              </p>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="flex flex-col justify-center p-10 md:p-16">
            <div className="mb-10 pr-10 text-center md:text-left">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Access Terminal
              </h2>
              <p className="mt-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                Enter credentials to initialize shift.
              </p>
            </div>

            {displayError && (
              <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-[10px] font-black tracking-widest text-red-700 uppercase">
                {displayError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                  Identity Email
                </label>
                <div className="group relative">
                  <Mail
                    className="group-focus-within:text-pixs-mint absolute top-1/2 left-4 -translate-y-1/2 text-slate-300 transition-colors"
                    size={18}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:border-pixs-mint focus:ring-pixs-mint/5 pointer-events-auto w-full cursor-text rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-12 text-sm font-bold transition-all placeholder:text-slate-300 focus:ring-4 focus:outline-none"
                    placeholder="name@pixs.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                  Security Key
                </label>
                <div className="group relative">
                  <Lock
                    className="group-focus-within:text-pixs-mint absolute top-1/2 left-4 -translate-y-1/2 text-slate-300 transition-colors"
                    size={18}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:border-pixs-mint focus:ring-pixs-mint/5 pointer-events-auto w-full cursor-text rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-12 pl-12 text-sm font-bold transition-all placeholder:text-slate-300 focus:ring-4 focus:outline-none"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowPassword(!showPassword)
                    }}
                    className="absolute top-1/2 right-4 z-10 -translate-y-1/2 text-slate-300 transition-colors hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-4 py-2">
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="text-pixs-mint focus:ring-pixs-mint h-4 w-4 rounded border-slate-300 shadow-sm"
                  />
                  <span className="text-[10px] leading-tight font-black tracking-widest text-slate-500 uppercase">
                    I accept the{' '}
                    <span className="text-slate-900 underline underline-offset-4">
                      Terms and Conditions
                    </span>{' '}
                    of PIXS Printing Shop and industrial data protocols.
                  </span>
                </label>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="text-pixs-mint focus:ring-pixs-mint h-4 w-4 rounded border-slate-300 shadow-sm"
                    />
                    <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Remember Node
                    </span>
                  </label>
                  <div className="text-pixs-mint cursor-pointer text-[10px] font-black tracking-widest uppercase transition-transform hover:scale-105">
                    Forgot Key?
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-3 rounded-[24px] bg-slate-900 py-4 text-xs font-black tracking-[3px] text-white uppercase shadow-2xl transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Initialize System{' '}
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-[10px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
              Trouble logging in? Contact{' '}
              <span className="text-pixs-mint">Systems Admin</span>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default Login
