import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { RegisterFormData } from '../../hooks/useAuth'
import toast, { Toaster } from 'react-hot-toast'
import { m, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

const RegisterPage: React.FC = () => {
  const { register, loading, error, fieldErrors } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1)
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

  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : undefined) : value,
    }))
  }

  const nextStep = () => {
    if (step === 1) {
      if (!formData.first_name || !formData.last_name) {
        toast.error('First Name and Last Name are required.')
        return
      }
    } else if (step === 2) {
      if (!formData.email) {
        toast.error('Email Address is required.')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address.')
        return
      }
    }
    setStep((s) => s + 1)
  }

  const prevStep = () => setStep((s) => s - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.password || !formData.password_confirmation) {
      toast.error('Passwords are required.')
      return
    }
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match.')
      return
    }

    try {
      setSubmitError(null)
      toast.loading('Registering account...', { id: 'register' })
      await register(formData)
      toast.success('Registration successful!', { id: 'register' })
      navigate('/login')
    } catch {
      setSubmitError(error || 'Registration failed. Please check your inputs.')
      toast.error('Registration failed.', { id: 'register' })
      
      if (fieldErrors?.email || fieldErrors?.company_name) {
        setStep(2)
      } else if (fieldErrors?.first_name || fieldErrors?.last_name) {
        setStep(1)
      }
    }
  }

  const handleOAuth = (provider: 'google' | 'facebook') => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    window.location.href = `${apiUrl}/api/auth/${provider}`
  }

  const variants = {
    initial: (direction: number) => ({ x: direction > 0 ? 500 : -500, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 500 : -500, opacity: 0 }),
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 md:p-8">
      <Toaster position="top-right" />
      
      {/* Google-like wide rectangle wrapper */}
      <div className="w-full max-w-[1040px] bg-white rounded-[32px] md:rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden relative flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Column (Labels, Title) */}
        <div className="w-full md:w-5/12 p-8 md:p-14 flex flex-col justify-start relative">
          <div className="mb-4">
             {/* PIXS Mint Logo / G-like logo area */}
             <div className="bg-pixs-mint flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-black text-slate-900 shadow-lg shadow-pixs-mint/20 mb-6">
               P
             </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-tight italic uppercase">
            Create a PIXS<br/>Account
          </h1>
          
          <p className="text-base md:text-lg text-slate-600 font-medium">
            {step === 1 && "Enter your name"}
            {step === 2 && "Basic information"}
            {step === 3 && "Set your passwords"}
          </p>

          {/* Only visible on desktop, moved to the bottom of the left column */}
          <div className="hidden md:block mt-auto pt-8">
            <p className="text-sm font-bold text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1a73e8] hover:underline hover:text-[#1557b0] transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>

        {/* Right Column (Inputs) */}
        <div className="w-full md:w-7/12 p-8 md:p-14 md:pl-8 flex flex-col justify-between">
          <div>
            {(error || submitError) && (
              <div className="mb-6 rounded-2xl bg-rose-50 p-4 border border-rose-100">
                <p className="text-xs font-bold text-rose-600">
                  {typeof error === 'string' ? error : submitError}
                </p>
                {fieldErrors && Object.entries(fieldErrors).map(([key, msgs]) => (
                  <p key={key} className="text-[10px] text-rose-500 italic mt-1">
                    {key}: {msgs.join(', ')}
                  </p>
                ))}
              </div>
            )}

            <div className="relative min-h-[240px]">
              <AnimatePresence mode="wait" custom={1}>
                {step === 1 && (
                  <m.div
                    key="step1"
                    custom={1}
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-4 pt-2"
                  >
                    {/* Floating-like input groups */}
                    <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                      <label className="text-xs font-medium text-slate-500">First name</label>
                      <input
                        name="first_name"
                        type="text"
                        required
                        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1"
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                      <label className="text-xs font-medium text-slate-500">Last name</label>
                      <input
                        name="last_name"
                        type="text"
                        required
                        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </div>
                  </m.div>
                )}

                {step === 2 && (
                  <m.div
                    key="step2"
                    custom={1}
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
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                      <label className="text-xs font-medium text-slate-500">Company Name</label>
                      <input
                        name="company_name"
                        type="text"
                        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1"
                        value={formData.company_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                        <label className="text-xs font-medium text-slate-500">Age</label>
                        <input
                          name="age"
                          type="number"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1"
                          value={formData.age || ''}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                        <label className="text-xs font-medium text-slate-500 flex justify-between w-full">Gender</label>
                        <select
                          name="gender"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1 cursor-pointer appearance-none"
                          value={formData.gender || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </m.div>
                )}

                {step === 3 && (
                  <m.div
                    key="step3"
                    custom={1}
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                      <label className="text-xs font-medium text-slate-500">Password</label>
                      <input
                        name="password"
                        type="password"
                        required
                        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="relative border border-slate-300 rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all bg-white">
                      <label className="text-xs font-medium text-slate-500">Confirm Password</label>
                      <input
                        name="password_confirmation"
                        type="password"
                        required
                        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none mt-1 py-1"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                      />
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress Bar (Dots style or simple line, Google uses subtle indicator or we can just keep the line) */}
            <div className="flex gap-1.5 mt-8 mb-4 max-w-[80px]">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={clsx(
                    "h-1 flex-1 rounded-full transition-all duration-500",
                    step >= i ? "bg-[#1a73e8]" : "bg-slate-200"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 text-sm font-bold text-[#1a73e8] hover:bg-[#1a73e8]/10 rounded-full transition-colors active:scale-95"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-colors shadow-sm active:scale-95"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition-colors shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Wait...' : 'Register'}
              </button>
            )}
          </div>

          {/* Mobile login link */}
          <div className="md:hidden mt-8 pt-6 border-t border-slate-100 text-center text-sm font-bold text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#1a73e8] hover:underline"
            >
              Sign in
            </Link>
          </div>
          
          {/* Social Oauth Buttons (kept minimal if needed or just remove, but let's keep them below on step 1) */}
          {step === 1 && (
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
          )}

        </div>
      </div>
    </div>
  )
}

export default RegisterPage
