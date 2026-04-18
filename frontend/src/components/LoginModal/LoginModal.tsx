import React, { useState } from 'react'
import { X, ShieldCheck, Mail } from 'lucide-react'
import { FaFacebookF } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [agreed, setAgreed] = useState(false)
  const { login } = useAuth()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        key="login-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-[40px] bg-white p-10 text-center shadow-2xl"
        >
          {/* Background Decor */}
          <div className="bg-pixs-mint/10 absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full blur-2xl" />

          <button
            onClick={onClose}
            className="absolute top-6 right-6 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={20} />
          </button>

          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 shadow-xl shadow-slate-200">
            <ShieldCheck className="text-pixs-mint" size={32} />
          </div>

          <h3 className="mb-2 text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
            Production Portal
          </h3>
          <p className="mb-8 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Identify your terminal credentials
          </p>

          <div className="mb-8 w-full space-y-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={() => {
                  if (import.meta.env.DEV) {
                    console.log('[Auth] Google OAuth successful')
                  }
                  login({
                    id: 'CUST-SOC-001',
                    name: 'Social User',
                    role: 'customer',
                  })
                  onClose()
                }}
                onError={() => {
                  if (import.meta.env.DEV) {
                    console.log('[Auth] Google OAuth failed')
                  }
                }}
              />
            </div>

            <FacebookLogin
              appId="YOUR_FACEBOOK_APP_ID"
              callback={() => {
                if (import.meta.env.DEV) {
                  console.log('[Auth] Facebook OAuth successful')
                }
                login({
                  id: 'CUST-SOC-002',
                  name: 'Facebook User',
                  role: 'customer',
                })
                onClose()
              }}
              render={(renderProps) => (
                <button
                  onClick={renderProps.onClick}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1877F2] py-4 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:brightness-110"
                >
                  <FaFacebookF size={16} fill="white" /> Sign in with Facebook
                </button>
              )}
            />

            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-widest text-white uppercase shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Mail size={16} /> Credential Login
            </Link>
          </div>

          <div className="flex w-full flex-col gap-4">
            <label className="group flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="text-pixs-mint focus:ring-pixs-mint h-4 w-4 rounded border-slate-200"
              />
              <span className="text-left text-[9px] leading-tight font-bold text-slate-500 uppercase">
                I agree to the{' '}
                <span className="text-slate-900 underline underline-offset-2">
                  Terms of Service
                </span>{' '}
                and industrial data protocols.
              </span>
            </label>

            <button className="hover:text-pixs-mint self-center text-[9px] font-black tracking-widest text-slate-400 uppercase transition-colors">
              Forgot Access Credentials?
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default LoginModal
