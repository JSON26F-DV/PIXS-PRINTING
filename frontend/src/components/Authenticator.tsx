import React, { useState, useRef, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ShieldAlert, Clock, CheckCircle2, X, AlertTriangle, RefreshCw } from 'lucide-react'
import axiosInstance from '../lib/axiosInstance'

export interface AuthenticatorProps {
  email: string
  codeType: 'forgot_password' | 'delete_order' | 'delete_account'
  targetId?: string
  onSuccess: (code: string) => void
  onCancel: () => void
}

interface RateLimitState {
  attempts: number
  isLocked: boolean
  lockEndTime: number | null
  resendCooldown: number | null
}

const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 10 * 60 * 1000
const RESEND_COOLDOWN = 60 * 1000

const Authenticator: React.FC<AuthenticatorProps> = ({
  email,
  codeType,
  onSuccess,
  onCancel,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    attempts: 0,
    isLocked: false,
    lockEndTime: null,
    resendCooldown: null,
  })

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const sendCode = useCallback(async () => {
    setIsSending(true)
    setError(null)

    try {
      let endpoint = ''

      switch (codeType) {
        case 'forgot_password':
          endpoint = '/api/auth/forgot-password/send-code'
          break
        case 'delete_order':
          endpoint = '/api/admin/verification/send-order-delete-code'
          break
        case 'delete_account':
          endpoint = '/api/admin/verification/send-account-delete-code'
          break
      }

      const payload = codeType === 'forgot_password' ? { email } : {}

      await axiosInstance.post(endpoint, payload)

      setRateLimit(prev => ({
        ...prev,
        resendCooldown: Date.now() + RESEND_COOLDOWN,
      }))

      setDigits(Array(6).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to send verification code.'
      setError(message)

      if (err?.response?.status === 429) {
        const lockedUntil = err?.response?.data?.locked_until
        if (lockedUntil) {
          setRateLimit(prev => ({
            ...prev,
            isLocked: true,
            lockEndTime: lockedUntil * 1000,
          }))
        }
      }
    } finally {
      setIsSending(false)
    }
  }, [codeType, email])

  useEffect(() => {
    sendCode()
  }, [sendCode])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    if (rateLimit.resendCooldown) {
      interval = setInterval(() => {
        if (Date.now() >= rateLimit.resendCooldown!) {
          setRateLimit(prev => ({ ...prev, resendCooldown: null }))
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [rateLimit.resendCooldown])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    if (rateLimit.lockEndTime) {
      interval = setInterval(() => {
        if (Date.now() >= rateLimit.lockEndTime!) {
          setRateLimit(prev => ({
            ...prev,
            isLocked: false,
            lockEndTime: null,
            attempts: 0,
          }))
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [rateLimit.lockEndTime])

  const handleDigitChange = (index: number, value: string) => {
    if (rateLimit.isLocked) return
    if (value && !/^\d$/.test(value)) return

    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    setError(null)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter' && digits.every(d => d !== '')) {
      handleVerify()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    if (rateLimit.isLocked) return

    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newDigits = Array(6).fill('')
    pasted.split('').forEach((d, i) => {
      newDigits[i] = d
    })
    setDigits(newDigits)

    const nextEmpty = newDigits.findIndex(d => d === '')
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty
    inputRefs.current[focusIndex]?.focus()
  }

  const handleVerify = async () => {
    if (digits.some(d => d === '')) {
      setError('Please enter all 6 digits.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const code = digits.join('')

      if (codeType === 'forgot_password') {
        const { data } = await axiosInstance.post('/api/auth/forgot-password/verify', {
          email,
          code,
        })

        if (data.status === 'success') {
          setIsSuccess(true)
          setTimeout(() => onSuccess(code), 1000)
        }
      } else {
        const { data } = await axiosInstance.post('/api/admin/verification/verify-code', {
          code_type: codeType,
          code,
        })

        if (data.status === 'success') {
          setIsSuccess(true)
          setTimeout(() => onSuccess(code), 1000)
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Invalid code. Please try again.'
      setError(message)

      setRateLimit(prev => {
        const newAttempts = prev.attempts + 1

        if (err?.response?.data?.locked || newAttempts >= MAX_ATTEMPTS) {
          const lockEndTime = Date.now() + LOCKOUT_DURATION
          return {
            attempts: newAttempts,
            isLocked: true,
            lockEndTime,
            resendCooldown: prev.resendCooldown,
          }
        }

        return {
          ...prev,
          attempts: newAttempts,
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    setRateLimit(prev => ({
      ...prev,
      attempts: 0,
    }))
    setError(null)
    setDigits(Array(6).fill(''))
    sendCode()
  }

  const getResendCooldownSeconds = () => {
    if (!rateLimit.resendCooldown) return 0
    return Math.ceil((rateLimit.resendCooldown - Date.now()) / 1000)
  }

  const getLockRemainingSeconds = () => {
    if (!rateLimit.lockEndTime) return 0
    return Math.ceil((rateLimit.lockEndTime - Date.now()) / 1000)
  }

  const shakeClass = error && !rateLimit.isLocked ? 'animate-shake' : ''

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl md:p-12"
    >
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <X size={20} />
      </button>

      <div className="mb-6 text-center">
        <div className="mb-4 flex items-center gap-3 justify-center">
          <div className="h-0.5 w-8 bg-blue-500" />
          <span className="text-[10px] font-black tracking-[4px] text-blue-500 uppercase italic">
            {codeType === 'forgot_password' ? 'Password Reset' : codeType === 'delete_order' ? 'Order Deletion' : 'Account Deletion'}
          </span>
          <div className="h-0.5 w-8 bg-blue-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
          Verify Identity
        </h2>
        <p className="mt-2 text-xs font-bold text-slate-500 uppercase italic flex items-center justify-center gap-2">
          <Mail size={14} />
          Code sent to {email}
        </p>
      </div>

      <div className="mb-6 flex justify-center gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={el => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleDigitChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={rateLimit.isLocked || isLoading || isSuccess}
            className={clsx(
              'h-14 w-12 rounded-2xl text-center text-2xl font-black outline-none transition-all border-2',
              isSuccess
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                : error
                  ? 'border-rose-500 bg-rose-50 text-rose-600 animate-shake'
                  : digit
                    ? 'border-slate-900 bg-slate-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-slate-900',
              rateLimit.isLocked && 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed',
              shakeClass,
            )}
          />
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 text-center text-xs font-black text-rose-500 uppercase italic flex items-center justify-center gap-2"
          >
            <AlertTriangle size={14} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {isSuccess ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            <CheckCircle2 size={64} className="text-emerald-500" />
          </motion.div>
          <p className="text-sm font-black text-emerald-600 uppercase italic">Verified Successfully</p>
        </div>
      ) : rateLimit.isLocked ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-rose-50 p-4">
            <ShieldAlert size={20} className="text-rose-500" />
            <div>
              <p className="text-[9px] font-black tracking-widest text-rose-600 uppercase">Account Locked</p>
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                <Clock size={14} />
                Try again in {getLockRemainingSeconds()}s
              </p>
            </div>
          </div>
          <div className="w-full rounded-2xl bg-slate-100 h-2 overflow-hidden">
            <motion.div
              className="h-full bg-rose-500"
              animate={{ width: `${((LOCKOUT_DURATION - getLockRemainingSeconds() * 1000) / LOCKOUT_DURATION) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={handleVerify}
          disabled={isLoading || digits.some(d => d === '')}
          className="w-full rounded-3xl bg-slate-900 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </button>
      )}

      <div className="mt-6 text-center">
        {getResendCooldownSeconds() > 0 ? (
          <p className="text-[10px] font-bold text-slate-400">
            Resend available in{' '}
            <span className="font-black text-slate-600">{getResendCooldownSeconds()}s</span>
          </p>
        ) : rateLimit.isLocked ? null : (
          <button
            onClick={handleResend}
            disabled={isSending}
            className="text-[10px] font-black tracking-widest text-blue-500 uppercase italic hover:text-blue-700 transition-colors disabled:opacity-40"
          >
            {isSending ? 'Sending...' : 'Resend Code'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default Authenticator
