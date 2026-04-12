import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Users,
  Calendar,
  Building2,
  Hash,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CustomerNavbar from '../../components/customer/CustomerNavbar'
import Footer from '../../components/Footer/Footer'
import type { RoleType } from '../../context/auth.types'

/**
 * RegisterPage Interface for Form State
 * Aligned with Laravel Migration Schemas (Employees & Customers)
 */
interface RegistrationState {
  account_type: 'customer' | 'employee'
  first_name: string
  last_name: string
  email: string
  age: number
  gender: 'male' | 'female' | 'other'
  company_name: string
  password: string
  password_confirmation: string
  // Employee specific fields
  role: RoleType
  daily_rate: number
  ot_rate: number
}
const RegisterPage: React.FC = () => {
  const { register, loading: isSubmitting, error } = useAuth()
  const [formData, setFormData] = useState<RegistrationState>({
    account_type: 'customer',
    first_name: '',
    last_name: '',
    email: '',
    age: 21,
    gender: 'male',
    company_name: '',
    password: '',
    password_confirmation: '',
    role: 'staff',
    daily_rate: 0,
    ot_rate: 0,
  })

  const [showPassword, setShowPassword] = useState(false)
  const passwordsMatch =
    !formData.password_confirmation ||
    formData.password === formData.password_confirmation

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'age' || name === 'daily_rate' || name === 'ot_rate'
          ? Number(value)
          : value,
    }))
  }

  const handleAccountTypeChange = (type: 'customer' | 'employee') => {
    setFormData((prev) => ({ ...prev, account_type: type }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.password_confirmation) {
      return
    }

    // Prepare payload based on account type
    const payload = {
      ...formData,
      status: 'active',
    }

    await register(payload)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CustomerNavbar />

      <main className="bg-emoji-pattern flex flex-grow items-center justify-center bg-slate-50 p-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl overflow-hidden rounded-[3rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200"
        >
          <div className="grid min-h-[700px] grid-cols-1 md:grid-cols-5">
            {/* Sidebar: Status & Info */}
            <div className="relative flex flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white md:col-span-2">
              <div className="pointer-events-none absolute top-0 left-0 h-full w-full opacity-5">
                <div className="border-pixs-mint absolute top-[-50px] right-[-50px] h-64 w-64 rounded-full border-[40px]" />
              </div>

              <div className="relative z-10">
                <div className="bg-pixs-mint shadow-pixs-mint/30 mb-8 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-black text-slate-900 shadow-lg">
                  P
                </div>
                <h1 className="mb-4 text-4xl leading-none font-black tracking-tighter uppercase italic">
                  System <span className="text-pixs-mint">Enrollment</span>
                </h1>
                <p className="mb-12 text-[10px] font-bold tracking-[4px] text-slate-400 uppercase">
                  Registry Node v2.4.0
                </p>

                <div className="space-y-6">
                  <div className="group flex items-center gap-4">
                    <div className="group-hover:bg-pixs-mint flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 transition-all group-hover:text-slate-900">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        Selected Guard
                      </p>
                      <p className="text-sm font-bold uppercase italic">
                        {formData.account_type === 'employee'
                          ? 'Employee Terminal'
                          : 'Customer Account'}
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                      <ShieldCheck size={18} className="text-pixs-mint" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        Integrity
                      </p>
                      <p className="text-sm font-bold uppercase italic">
                        AES-256 Auth Layers
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <p className="mb-2 text-[10px] font-bold tracking-[2px] text-slate-500 uppercase italic">
                  Note: Passwords are hashed using Argon2id/Bcrypt on the PIXS
                  Core Backend.
                </p>
                <div className="bg-pixs-mint/20 h-1 w-20 rounded-full" />
              </div>
            </div>

            {/* Main Form Area */}
            <div className="flex flex-col p-10 md:col-span-3 md:p-14">
              <div className="mb-10 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">
                    Identity Creation
                  </h2>
                  <p className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Provide credentials for matrix access.
                  </p>
                </div>

                <div className="flex rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => handleAccountTypeChange('customer')}
                    className={`rounded-xl px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all ${formData.account_type === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccountTypeChange('employee')}
                    className={`rounded-xl px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all ${formData.account_type === 'employee' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    Employee
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-8 flex items-center gap-3 border-l-4 border-red-500 bg-red-50 p-4 text-[10px] font-black tracking-widest text-red-700 uppercase"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                      First Name Node
                    </label>
                    <div className="relative">
                      <User
                        className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
                        size={16}
                      />
                      <input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-slate-50 py-3 pr-4 pl-12 text-sm font-bold transition-all outline-none placeholder:text-slate-200 focus:bg-white"
                        placeholder="Jason"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                      Last Name Node
                    </label>
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-3 text-sm font-bold transition-all outline-none placeholder:text-slate-200 focus:bg-white"
                      placeholder="Derulo"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                    Email Terminal
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
                      size={16}
                    />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-slate-50 py-3 pr-4 pl-12 text-sm font-bold transition-all outline-none placeholder:text-slate-200 focus:bg-white"
                      placeholder="jason.os@pixs.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                      Age
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
                        size={16}
                      />
                      <input
                        name="age"
                        type="number"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-slate-50 py-3 pr-4 pl-12 text-sm font-bold transition-all outline-none focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                      Gender Node
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="focus:border-pixs-mint w-full cursor-pointer appearance-none rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-3 text-sm font-bold transition-all outline-none focus:bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                    Company Node (Optional)
                  </label>
                  <div className="relative">
                    <Building2
                      className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
                      size={16}
                    />
                    <input
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-slate-50 py-3 pr-4 pl-12 text-sm font-bold transition-all outline-none placeholder:text-slate-200 focus:bg-white"
                      placeholder="Cyberdyne Systems"
                    />
                  </div>
                </div>

                {/* Dynamic Employee Fields */}
                <AnimatePresence mode="wait">
                  {formData.account_type === 'employee' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6 overflow-hidden pt-2"
                    >
                      <div className="space-y-4 rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-center text-[8px] font-black tracking-[4px] text-slate-400 uppercase italic">
                          Compensation & Role Metadata
                        </p>

                        <div className="space-y-2">
                          <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                            Access Role
                          </label>
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-white px-4 py-3 text-sm font-bold transition-all outline-none"
                          >
                            <option value="staff">Staff</option>
                            <option value="technician">Technician</option>
                            <option value="welder">Welder</option>
                            <option value="inventory">Inventory</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                              Daily Rate
                            </label>
                            <div className="relative">
                              <Hash
                                className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
                                size={16}
                              />
                              <input
                                name="daily_rate"
                                type="number"
                                value={formData.daily_rate}
                                onChange={handleInputChange}
                                className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-white py-3 pr-4 pl-12 text-sm font-bold transition-all outline-none"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                              OT Rate
                            </label>
                            <div className="relative">
                              <Hash
                                className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
                                size={16}
                              />
                              <input
                                name="ot_rate"
                                type="number"
                                value={formData.ot_rate}
                                onChange={handleInputChange}
                                className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-white py-3 pr-4 pl-12 text-sm font-bold transition-all outline-none"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="ml-1 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                      Security Key
                    </label>
                    <div className="group relative">
                      <Lock
                        className="group-focus-within:text-pixs-mint absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
                        size={16}
                      />
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-slate-50 py-3 pr-12 pl-12 text-sm font-bold transition-all outline-none focus:bg-white"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-300 transition-colors hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 font-mono text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                      Verify Sequence
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute top-1/2 left-4 -translate-y-1/2 ${passwordsMatch ? 'text-pixs-mint' : 'text-red-400'}`}
                      >
                        {passwordsMatch && formData.password_confirmation ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <Lock size={16} />
                        )}
                      </div>
                      <input
                        name="password_confirmation"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password_confirmation}
                        onChange={handleInputChange}
                        className={`w-full rounded-2xl border-2 bg-slate-50 py-3 pr-4 pl-12 text-sm font-bold transition-all outline-none ${passwordsMatch ? 'focus:border-pixs-mint border-transparent focus:bg-white' : 'border-red-500/30'}`}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !passwordsMatch}
                  className="hover:bg-pixs-mint group mt-4 flex w-full transform items-center justify-center gap-4 rounded-3xl bg-slate-900 py-5 font-black tracking-[0.3em] text-white uppercase italic shadow-2xl shadow-slate-200 transition-all hover:text-slate-900 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Execute Enrollment{' '}
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                  Already have a node?{' '}
                  <Link
                    to="/login"
                    className="text-pixs-mint underline-offset-4 hover:underline"
                  >
                    Initialize Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

export default RegisterPage
