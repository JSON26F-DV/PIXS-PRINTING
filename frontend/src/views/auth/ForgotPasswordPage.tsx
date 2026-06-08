import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2, RefreshCw, AlertTriangle, Eye, EyeOff, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import axiosInstance from '../../lib/axiosInstance'
import Authenticator from '../../components/Authenticator'

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'verify' | 'reset' | 'success'>('email')
  const [isSending, setIsSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const [verifiedCode, setVerifiedCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const passwordChecks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[@$!%*?&#^()_\-+=.,]/.test(password),
  }

  const passedCount = Object.values(passwordChecks).filter(Boolean).length
  const strength =
    passedCount <= 1 ? 'weak' : passedCount <= 3 ? 'medium' : 'strong'
  const strengthColor =
    strength === 'weak' ? 'bg-red-500' : strength === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
  const strengthWidth = `${(passedCount / 4) * 100}%`

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSending) return

    setIsSending(true)
    try {
      const res = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          setCooldown(60)
          return
        }
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || `Request failed (${res.status})`)
      }

      setStep('verify')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send code')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifySuccess = (code: string) => {
    setVerifiedCode(code)
    setStep('reset')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError(null)

    if (password.length < 8) {
      setPassError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setPassError('Passwords do not match')
      return
    }

    setIsResetting(true)
    try {
      const { data } = await axiosInstance.post('/api/auth/forgot-password/reset', {
        email,
        code: verifiedCode,
        password,
        password_confirmation: confirmPassword,
      })

      if (data.status === 'success') {
        setStep('success')
        setTimeout(() => navigate('/login'), 3000)
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const message = axiosErr?.response?.data?.message || 'Failed to reset password'
      setPassError(message)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-[40px] bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-6 text-center">
                <div className="mb-4 flex items-center gap-3 justify-center">
                  <div className="h-0.5 w-8 bg-blue-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-blue-500 uppercase italic">Password Reset</span>
                  <div className="h-0.5 w-8 bg-blue-500" />
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Forgot Password
                </h1>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Enter your email to receive a verification code
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-6">
                <div className="relative">
                  <Mail size={18} className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-5 pl-12 text-sm font-semibold outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending || !email || cooldown > 0}
                  className="w-full rounded-3xl bg-slate-900 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    `Wait ${cooldown}s`
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Authenticator
                email={email}
                codeType="forgot_password"
                onSuccess={handleVerifySuccess}
                onCancel={() => setStep('email')}
                autoSend={false}
              />
            </motion.div>
          )}

          {step === 'reset' && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-[40px] bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-6 text-center">
                <div className="mb-4 flex items-center gap-3 justify-center">
                  <div className="h-0.5 w-8 bg-emerald-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-emerald-500 uppercase italic">Verified</span>
                  <div className="h-0.5 w-8 bg-emerald-500" />
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Set New Password
                </h1>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Choose a strong password for your account
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pr-12 text-sm font-semibold outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {password && (
                  <>
                    <div className="space-y-2">
                      <div className="flex gap-4 text-[11px] font-bold flex-wrap">
                        {[
                          { label: '8+ characters', check: passwordChecks.minLength },
                          { label: 'Uppercase letter', check: passwordChecks.hasUpper },
                          { label: 'Number', check: passwordChecks.hasNumber },
                          { label: 'Special character', check: passwordChecks.hasSpecial },
                        ].map(({ label, check }) => (
                          <span
                            key={label}
                            className={`flex items-center gap-1 ${check ? 'text-emerald-600' : 'text-slate-400'}`}
                          >
                            {check ? <CheckCircle2 size={12} /> : <X size={12} />}
                            {label}
                          </span>
                        ))}
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          layout
                          className={`h-full rounded-full ${strengthColor}`}
                          style={{ width: strengthWidth }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className={`text-[10px] font-black uppercase italic tracking-wider ${
                        strength === 'weak' ? 'text-red-500' : strength === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {strength === 'weak' ? 'Weak' : strength === 'medium' ? 'Medium' : 'Strong'}
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 pr-12 text-sm font-semibold outline-none transition-all focus:bg-white ${
                          confirmPassword && password !== confirmPassword
                            ? 'border-rose-500'
                            : confirmPassword
                              ? 'border-emerald-500'
                              : 'border-slate-200 focus:border-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-[10px] font-black text-rose-500 uppercase italic flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Passwords do not match
                      </p>
                    )}
                  </>
                )}

                {passError && (
                  <p className="text-center text-xs font-black text-rose-500 uppercase italic flex items-center justify-center gap-2">
                    <AlertTriangle size={14} />
                    {passError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isResetting || !password || password !== confirmPassword}
                  className="w-full rounded-3xl bg-emerald-600 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[40px] bg-white p-8 shadow-2xl md:p-12 text-center"
            >
              <div className="mb-4 flex justify-center">
                <CheckCircle2 size={64} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic mb-2">
                Password Reset Successful
              </h2>
              <p className="text-xs font-bold text-slate-500">
                Redirecting to login...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default ForgotPasswordPage
