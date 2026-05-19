import React, { useState } from 'react'
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import CustomerNavbar from '../../components/customer/CustomerNavbar'
import Footer from '../../components/Footer/Footer'
import { Link } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const { login, error: authError, loading: isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      await login(email, password)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLocalError(err.message)
      } else {
        setLocalError('An unexpected error occurred during login.')
      }
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
          {/* Left Side: Industrial Visuals */}
          <div className="relative hidden flex-col justify-between bg-slate-900 p-16 text-white md:flex">
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full border-[40px] border-pixs-mint" />
              <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-pixs-mint" />
            </div>

            <div className="relative z-10">
              <div className="bg-pixs-mint mb-10 flex h-14 w-14 items-center justify-center rounded-[20px] text-3xl font-black text-slate-900 shadow-lg shadow-pixs-mint/20">
                P
              </div>
              <h1 className="text-5xl leading-tight font-black tracking-tighter uppercase italic">
                PIXS <span className="text-slate-400">SHOP</span>
                <br />
                <span className="text-pixs-mint">CENTRAL HUB</span>
              </h1>
              <p className="mt-8 text-[10px] font-black tracking-[8px] text-slate-400 uppercase">
                System Interface / v8.2.0
              </p>
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                  <ShieldCheck className="text-pixs-mint" size={20} />
                </div>
                <div>
                  <p className="text-xs font-black tracking-widest uppercase italic">Protocols Active</p>
                  <p className="text-[10px] text-slate-400">AES-256 End-to-End Encryption</p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-8">
                <p className="font-mono text-[9px] leading-relaxed text-slate-500 uppercase">
                  Log in to access your dashboard, track orders, and interact with the production matrix. 
                  Unauthorized entry attempts are logged and reported to secondary security nodes.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Authentication Form */}
          <div className="flex flex-col justify-center p-12 md:p-20">
            <div className="mb-12">
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
                Access <span className="text-pixs-mint">Terminal</span>
              </h2>
              <p className="mt-3 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
                Initialize Secure Session
              </p>
            </div>

            {displayError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8 border-l-4 border-rose-500 bg-rose-50 p-5"
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <p className="text-[10px] font-black tracking-widest text-rose-700 uppercase italic">
                    {displayError}
                  </p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                  Identity (Email Node)
                </label>
                <div className="group relative">
                  <Mail
                    className="group-focus-within:text-pixs-mint absolute top-1/2 left-5 -translate-y-1/2 text-slate-300 transition-colors"
                    size={20}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:border-pixs-mint w-full rounded-[24px] border border-slate-100 bg-slate-50 py-5 pr-6 pl-14 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5"
                    placeholder="operator@pixs.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                  Access Key (Encrypted)
                </label>
                <div className="group relative">
                  <Lock
                    className="group-focus-within:text-pixs-mint absolute top-1/2 left-5 -translate-y-1/2 text-slate-300 transition-colors"
                    size={20}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:border-pixs-mint w-full rounded-[24px] border border-slate-100 bg-slate-50 py-5 pr-14 pl-14 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-5 -translate-y-1/2 text-slate-300 transition-colors hover:text-slate-900"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="text-pixs-mint focus:ring-pixs-mint h-5 w-5 rounded-lg border-slate-200"
                  />
                  <span className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                    Protocol Acknowledged
                  </span>
                </label>
                <Link to="/forgot-password" className="text-[10px] font-black tracking-widest text-pixs-mint uppercase hover:underline">
                  Reset Key
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-4 rounded-[28px] bg-slate-900 py-6 text-xs font-black tracking-[5px] text-white uppercase shadow-2xl transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <>
                    Initialize Session{' '}
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-2"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                New to the platform?{' '}
                <Link to="/register" className="text-pixs-mint hover:underline">
                  Apply for Credentials
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

export default LoginPage
