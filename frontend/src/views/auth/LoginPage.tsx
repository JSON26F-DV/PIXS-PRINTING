import React, { useState } from 'react'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'
import { m } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import AuthNavbar from '../../components/auth/AuthNavbar'
import Footer from '../../components/Footer/Footer'
import { Link } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const {
    login,
    error: authError,
    fieldErrors,
    loading: isLoading,
    clearAuthErrors,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  const emailError = fieldErrors.email?.[0]
  const passwordError = fieldErrors.password?.[0]
  const displayError = localError || authError

  const clearErrors = () => {
    setLocalError(null)
    clearAuthErrors()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    if (!agreedToTerms) {
      setLocalError(
        'Please accept the Terms and Conditions of PIXS Printing Shop.',
      )
      return
    }

    await login(email, password)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <style>{`
        .cssbuttons-io-button {
          background: #75eea5;
          color: white;
          font-family: inherit;
          padding: 0.35em;
          padding-left: 1.2em;
          font-size: 17px;
          font-weight: 500;
          border-radius: 15px;
          border: none;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          box-shadow: inset 0 0 1.6em -0.6em #75eea5;
          overflow: hidden;
          position: relative;
          height: 3.2em;
          padding-right: 3.3em;
          justify-content: center;
          cursor: pointer;
          width: 100%;
        }

        .cssbuttons-io-button .icon {
          background: white;
          margin-left: 1em;
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 2.6em;
          width: 2.6em;
          border-radius: 12px;
          box-shadow: 0.1em 0.1em 0.6em 0.2em rgba(117, 238, 165, 0.4);
          right: 0.3em;
          transition: all 0.3s;
        }

        .cssbuttons-io-button:hover .icon {
          width: calc(100% - 0.6em);
        }

        .cssbuttons-io-button .icon svg {
          width: 1.1em;
          transition: transform 0.3s;
          color: #75eea5;
        }

        .cssbuttons-io-button:hover .icon svg {
          transform: translateX(0.1em);
        }

        .cssbuttons-io-button:active .icon {
          transform: scale(0.95);
        }
        
        .cssbuttons-io-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
      <AuthNavbar />

      <main className="flex flex-grow items-center justify-center bg-slate-50 p-6 pt-24 pb-12">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-2xl md:grid-cols-2"
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
                PIXS <span className="text-slate-400">PRINTING</span>
                <br />
                <span className="text-pixs-mint">PORTAL</span>
              </h1>
              <p className="mt-8 text-[10px] font-black tracking-[8px] text-slate-400 uppercase">
                Secure Access Gateway
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
                  Access your dashboard to track orders, manage your projects, and view production status in real-time. Unauthorized access attempts are monitored and recorded.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Authentication Form */}
          <div className="flex flex-col justify-center p-12 md:p-20">
            <div className="mb-12">
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
                Login <span className="text-pixs-mint">Account</span>
              </h2>
              <p className="mt-3 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
                Enter your credentials
              </p>
            </div>

            {displayError && (
              <m.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                role="alert"
                aria-live="polite"
                className="mb-8 border-l-4 border-rose-500 bg-rose-50 p-5"
              >
                <m.div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <p className="text-[10px] font-black tracking-widest text-rose-700 uppercase italic">
                    {displayError}
                  </p>
                </m.div>
              </m.div>
            )}

            <form onSubmit={handleLogin} className="space-y-8" noValidate>
              <div className="space-y-3">
                <label
                  htmlFor="login-email"
                  className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase"
                >
                  Email Address
                </label>
                <div className="group relative">
                  <Mail
                    className="group-focus-within:text-pixs-mint absolute top-1/2 left-5 -translate-y-1/2 text-slate-300 transition-colors"
                    size={20}
                  />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearErrors()
                    }}
                    className={`focus:border-pixs-mint w-full rounded-[15px] border bg-slate-50 py-5 pr-6 pl-14 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5 ${
                      emailError ? 'border-rose-300' : 'border-slate-100'
                    }`}
                    placeholder="name@email.com"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'login-email-error' : undefined}
                  />
                </div>
                {emailError && (
                  <p
                    id="login-email-error"
                    role="alert"
                    className="text-[10px] font-bold tracking-wide text-rose-600"
                  >
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label
                  htmlFor="login-password"
                  className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase"
                >
                  Password
                </label>
                <div className="group relative">
                  <Lock
                    className="group-focus-within:text-pixs-mint absolute top-1/2 left-5 -translate-y-1/2 text-slate-300 transition-colors"
                    size={20}
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      clearErrors()
                    }}
                    className={`focus:border-pixs-mint w-full rounded-[15px] border bg-slate-50 py-5 pr-14 pl-14 text-sm font-bold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-pixs-mint/5 ${
                      passwordError ? 'border-rose-300' : 'border-slate-100'
                    }`}
                    placeholder="••••••••••••"
                    aria-invalid={!!passwordError}
                    aria-describedby={
                      passwordError ? 'login-password-error' : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-5 -translate-y-1/2 text-slate-300 transition-colors hover:text-slate-900"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordError && (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="text-[10px] font-bold tracking-wide text-rose-600"
                  >
                    {passwordError}
                  </p>
                )}
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
                    I agree to terms
                  </span>
                </label>
                <Link to="/forgot-password" className="text-[10px] font-black tracking-widest text-pixs-mint uppercase hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="cssbuttons-io-button"
              >
                {isLoading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white relative z-10" />
                ) : (
                  <>
                    <span className="relative z-10 font-bold uppercase tracking-widest text-xs">Sign In</span>
                    <div className="icon">
                      <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path>
                      </svg>
                    </div>
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center space-y-6">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                New to the platform?{' '}
                <Link to="/register" className="text-pixs-mint hover:underline">
                  Create an Account
                </Link>
              </p>
              
              <div className="md:hidden">
                <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 hover:text-slate-600 uppercase transition-colors">
                  &larr; Back to Landing Page
                </Link>
              </div>
            </div>
          </div>
        </m.div>
      </main>

      <Footer />
    </div>
  )
}

export default LoginPage
