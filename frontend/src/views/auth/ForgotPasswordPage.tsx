import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'react-hot-toast'
import ReCAPTCHA from 'react-google-recaptcha'
import { Eye, EyeOff } from 'lucide-react'
import AuthNavbar from '../../components/auth/AuthNavbar'
import Footer from '../../components/Footer/Footer'
import Authenticator from '../../components/Authenticator'

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, text: '', color: 'bg-slate-200' }
  let score = 0
  if (pass.length >= 8) score++
  if (/[A-Z]/.test(pass)) score++
  if (/[0-9]/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++

  if (score <= 1) return { score, text: 'Weak', color: 'bg-rose-500' }
  if (score <= 3) return { score, text: 'Medium', color: 'bg-amber-500' }
  return { score, text: 'Strong', color: 'bg-emerald-500' }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'verify' | 'reset' | 'success'>('email')
  const [isSending, setIsSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const [verifiedCode, setVerifiedCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!email || isSending || cooldown > 0) return
    
    if (!isCaptchaVerified) {
      toast.error('Please complete the CAPTCHA first')
      return
    }

    setIsSending(true)
    try {
      const res = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          captcha_token: captchaToken 
        }),
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
      setIsCaptchaVerified(false)
      setCaptchaToken(null)
      recaptchaRef.current?.reset()
    } finally {
      setIsSending(false)
    }
  }

  const onCaptchaChange = (token: string | null) => {
    if (token) {
      setIsCaptchaVerified(true)
      setCaptchaToken(token)
      if (email && email.includes('@')) {
        toast.success('Security check passed! Sending code...', { icon: '🛡️' })
        setTimeout(() => {
          handleSendCode()
        }, 800)
      }
    } else {
      setIsCaptchaVerified(false)
      setCaptchaToken(null)
    }
  }

  const handleVerifySuccess = (code: string) => {
    setVerifiedCode(code)
    setStep('reset')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError(null)

    const strength = getPasswordStrength(password)
    if (strength.score < 4) {
      setPassError('Password must meet all complexity requirements: at least 8 characters, one uppercase letter, one number, and one special sign.')
      return
    }
    if (password !== confirmPassword) {
      setPassError('Passwords do not match')
      return
    }

    setIsResetting(true)
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verifiedCode,
          password,
          password_confirmation: confirmPassword,
        })
      })
      
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password')
      }

      if (data.status === 'success') {
        setStep('success')
        setTimeout(() => navigate('/login'), 3000)
      }
    } catch (err: unknown) {
      const message = (err as Error).message || 'Failed to reset password'
      setPassError(message)
    } finally {
      setIsResetting(false)
    }
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
              {step === 'email' && "Account Recovery"}
              {step === 'verify' && "Verify Identity"}
              {step === 'reset' && "Reset Password"}
              {step === 'success' && "Success"}
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 font-medium">
              {step === 'email' && "Enter your recovery email"}
              {step === 'verify' && "We sent a code to your email"}
              {step === 'reset' && "Choose a strong new password"}
              {step === 'success' && "Your password has been reset"}
            </p>

            <div className="hidden md:block mt-auto pt-8">
              <p className="text-sm font-bold text-slate-500">
                Remember your password?{' '}
                <Link to="/login" className="text-[#1a73e8] hover:underline hover:text-[#1557b0] transition-colors">
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>

          {/* Right Column (Inputs) */}
          <div className="w-full md:w-7/12 p-8 md:p-14 md:pl-8 flex flex-col justify-between">
            <div className="relative min-h-[300px]">
              <AnimatePresence mode="wait">
                {step === 'email' && (
                  <m.div
                    key="email"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6 pt-2"
                  >
                    <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                      <label className="text-xs font-medium text-slate-500">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1"
                      />
                    </div>

                    <div className="flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-2">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={onCaptchaChange}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 text-sm font-bold text-[#1a73e8] hover:bg-[#1a73e8]/10 rounded-full transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSendCode}
                        disabled={isSending || !email || cooldown > 0 || !isCaptchaVerified}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isSending ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Next'}
                      </button>
                    </div>
                  </m.div>
                )}

                {step === 'verify' && (
                  <m.div
                    key="verify"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="pt-2"
                  >
                    <Authenticator
                      email={email}
                      codeType="forgot_password"
                      onSuccess={handleVerifySuccess}
                      onCancel={() => setStep('email')}
                      autoSend={false}
                      variant="inline"
                    />
                  </m.div>
                )}

                {step === 'reset' && (
                  <m.div
                    key="reset"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4 pt-2"
                  >
                    {passError && (
                      <div className="mb-6 rounded-2xl bg-rose-50 p-4 border border-rose-100 text-xs font-bold text-rose-600">
                        {passError}
                      </div>
                    )}
                    <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                      <label className="text-xs font-medium text-slate-500">New Password</label>
                      <div className="flex items-center justify-between">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1 pr-10"
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

                    {/* Password Strength Indicator */}
                    {password && (() => {
                      const strength = getPasswordStrength(password)
                      return (
                        <div className="space-y-2 py-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-500">Password strength:</span>
                            <span className={
                              strength.score <= 1 ? "text-rose-500 font-bold" :
                              strength.score <= 3 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"
                            }>{strength.text}</span>
                          </div>
                          <div className="flex gap-1.5 h-1.5">
                            <div className={`flex-1 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-slate-200"}`} />
                            <div className={`flex-1 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-slate-200"}`} />
                            <div className={`flex-1 rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : "bg-slate-200"}`} />
                          </div>
                          
                          {/* Requirement Checkpoints */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className={password.length >= 8 ? "text-emerald-500 font-bold" : "text-slate-400"}>✓</span>
                              <span>Min. 8 characters</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={/[A-Z]/.test(password) ? "text-emerald-500 font-bold" : "text-slate-400"}>✓</span>
                              <span>One uppercase letter</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={/[0-9]/.test(password) ? "text-emerald-500 font-bold" : "text-slate-400"}>✓</span>
                              <span>One number</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-500 font-bold" : "text-slate-400"}>✓</span>
                              <span>One special sign</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                      <label className="text-xs font-medium text-slate-500">Confirm New Password</label>
                      <div className="flex items-center justify-between">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <button
                        type="button"
                        onClick={() => setStep('verify')}
                        className="px-6 py-2 text-sm font-bold text-[#1a73e8] hover:bg-[#1a73e8]/10 rounded-full transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleResetPassword}
                        disabled={isResetting || !password || password !== confirmPassword}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isResetting ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </div>
                  </m.div>
                )}

                {step === 'success' && (
                  <m.div
                    key="success"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="text-center py-10"
                  >
                    <div className="mb-6 flex justify-center">
                      <div className="bg-emerald-100 p-4 rounded-full">
                        <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2 italic uppercase">Password Reset</h2>
                    <p className="text-slate-600 font-medium mb-8">Your password has been successfully updated.</p>
                    <Link
                      to="/login"
                      className="inline-block px-8 py-3 text-sm font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-colors shadow-lg shadow-blue-200"
                    >
                      Sign In Now
                    </Link>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            <div className="md:hidden mt-8 pt-6 border-t border-slate-100 text-center text-sm font-bold text-slate-500">
              Remember your password?{' '}
              <Link to="/login" className="text-[#1a73e8] hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ForgotPasswordPage
