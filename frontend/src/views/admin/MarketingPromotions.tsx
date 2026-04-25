import React, { useState, useMemo, useEffect } from 'react'
import {
  TicketPercent,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Zap,
  Gift,
  TrendingUp,
  Award,
  AlertCircle,
  Copy,
  ArrowRight,
  Users,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, isBefore, parseISO, addDays } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

// Data Sources
import rawPromos from '../../data/marketing_promotions.json'
import rawUsersData from '../../data/users.json'
import rawProducts from '../../data/products.json'
import rawOrders from '../../data/order.json'

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Interfaces
interface Promotion {
  id: string
  title: string
  discount_type: 'unit' | 'percentage' | 'fixed' | 'product-specific'
  discount_value: number
  target_type: 'specific_user' | 'all_users' | 'code'
  assigned_user_id?: string
  product_id?: string
  code?: string
  max_uses: number
  used_count: number
  expires_at: string
  status: 'active' | 'used' | 'expired'
  conditions?: {
    minimum_quantity?: number
  }
}

interface OrderRecord {
  order_id: string
  discount?: {
    total_discount_amount: number
  }
}

interface DiscountNode {
  discount_id: string
  type: string
  value: number
  product_id?: string
  remaining_uses: number
  is_one_time: boolean
  expires_at: string
  status: string
}

interface UserNode {
  id: string
  name: string
  email: string
  role: string
  discounts?: DiscountNode[]
}

// Validation Schema
const promoSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    discount_type: z.enum(['unit', 'percentage', 'fixed', 'product-specific']),
    discount_value: z.number().positive('Value must be greater than zero'),
    target_type: z.enum(['specific_user', 'all_users', 'code']),
    assigned_user_id: z.string().optional(),
    product_id: z.string().optional(),
    code: z.string().optional(),
    expires_at: z
      .string()
      .refine(
        (val) => !isBefore(parseISO(val), new Date()),
        'Expiration must be a future date',
      ),
    max_uses: z.number().int().positive().default(1),
    is_one_time: z.boolean().default(true),
    min_quantity: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.target_type === 'specific_user' && !data.assigned_user_id)
        return false
      if (data.target_type === 'code' && !data.code) return false
      if (data.discount_type === 'product-specific' && !data.product_id)
        return false
      return true
    },
    {
      message: 'Required fields missing for selected configuration',
      path: ['target_type'],
    },
  )

type PromoFormData = z.infer<typeof promoSchema>

const MarketingPromotions: React.FC = () => {
  const [promos, setPromos] = useState<Promotion[]>(rawPromos as Promotion[])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // --- FORM SETUP ---
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<PromoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(promoSchema) as any,
    defaultValues: {
      discount_type: 'percentage',
      target_type: 'all_users',
      max_uses: 1,
      is_one_time: true,
      expires_at: format(addDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm"),
      discount_value: 0,
      title: '',
      code: '',
      min_quantity: 0,
    },
  })

  const watchType = useWatch({ control, name: 'discount_type' })
  const watchTarget = useWatch({ control, name: 'target_type' })
  const watchOneTime = useWatch({ control, name: 'is_one_time' })

  useEffect(() => {
    if (watchOneTime) setValue('max_uses', 1)
  }, [watchOneTime, setValue])

  // --- THE TICKER SYSTEM (Expiration Checker) ---
  useEffect(() => {
    const checkExpirations = () => {
      const now = new Date()
      let changed = false
      const updated = promos.map((p) => {
        if (p.status === 'active' && isBefore(parseISO(p.expires_at), now)) {
          changed = true
          return { ...p, status: 'expired' as const }
        }
        return p
      })
      if (changed) setPromos(updated)
    }

    checkExpirations()
    const timer = setInterval(checkExpirations, 60000) // Every minute
    return () => clearInterval(timer)
  }, [promos])

  // --- STATS ---
  const stats = useMemo(() => {
    const active = promos.filter((p) => p.status === 'active').length
    const expiringSoon = promos.filter((p) => {
      const diff = parseISO(p.expires_at).getTime() - new Date().getTime()
      return p.status === 'active' && diff > 0 && diff < 1000 * 60 * 60 * 24 * 3 // 3 days
    }).length

    const usedToday = 0 // Simulated from orders
    const totalDiscount = (rawOrders as OrderRecord[]).reduce(
      (acc, o) => acc + (o.discount?.total_discount_amount || 0),
      0,
    )

    return { active, expiringSoon, usedToday, totalDiscount }
  }, [promos])

  // --- ANALYTICS ---
  const analyticsData = useMemo(() => {
    return promos.slice(0, 5).map((p) => ({
      name: p.title.substring(0, 10),
      usage: p.used_count,
      limit: p.max_uses,
    }))
  }, [promos])

  // --- FILTERED PROMOS ---
  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter =
        filter === 'all' || p.status === filter || p.discount_type === filter
      return matchesSearch && matchesFilter
    })
  }, [promos, searchTerm, filter])

  // --- HANDLERS ---
  const onFormSubmit = (data: PromoFormData) => {
    const newPromo: Promotion = {
      id: `PROMO-${uuidv4().substring(0, 8).toUpperCase()}`,
      title: data.title,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      target_type: data.target_type,
      assigned_user_id: data.assigned_user_id,
      product_id: data.product_id,
      code: data.code?.toUpperCase(),
      max_uses: data.max_uses,
      used_count: 0,
      expires_at: data.expires_at,
      status: 'active',
      conditions: data.min_quantity
        ? { minimum_quantity: data.min_quantity }
        : undefined,
    }

    setPromos([newPromo, ...promos])
    toast.success('Promotion Engine Initialized', {
      icon: '🚀',
      style: { borderRadius: '16px', background: '#0f172a', color: '#fff' },
    })
    setIsModalOpen(false)
    reset()
  }

  const handleCopyCode = (code?: string) => {
    if (!code) return
    navigator.clipboard.writeText(code)
    toast.success('Code copied to buffer')
  }

  return (
    <div className="admin-promo-container animate-in fade-in mx-auto max-w-[1700px] space-y-10 px-4 pb-20 duration-500 lg:px-10">
      {/* 🚀 HEADER & STATS */}
      <header className="flex flex-col justify-between gap-8 pt-12 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="rounded-[22px] bg-slate-900 p-4 text-[#75EEA5] shadow-2xl shadow-slate-900/20">
              <TicketPercent size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
                Marketing Arsenal
              </h1>
              <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
                Enterprise Yield Optimization & Loyalty Controller
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 rounded-[24px] border border-[#5de291]/50 bg-[#75EEA5] px-8 py-5 text-[11px] font-black tracking-[3px] text-slate-900 uppercase italic shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1 hover:bg-[#5de291]"
          >
            <Plus size={18} />
            Initialize Campaign
          </button>
        </div>
      </header>

      {/* 📊 SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="admin-promo-card group relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-white">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-110">
            <Zap size={100} />
          </div>
          <p className="mb-4 text-[10px] font-black tracking-[3px] uppercase opacity-60">
            Active Campaigns
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black tracking-tighter italic">
              {stats.active}
            </h3>
            <span className="text-xs font-bold text-[#75EEA5]">LIVE</span>
          </div>
        </div>

        <div className="admin-promo-card group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 transition-transform duration-500 group-hover:scale-110">
            <Clock size={100} />
          </div>
          <p className="mb-4 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
            Urgent Threshold
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black tracking-tighter text-slate-900">
              {stats.expiringSoon}
            </h3>
            <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase">
              Expiring Soon
            </span>
          </div>
        </div>

        <div className="admin-promo-card group relative rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
          <p className="mb-4 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
            Yield Forgone
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-400">₱</span>
            <h3 className="text-4xl font-black tracking-tighter text-slate-900">
              {stats.totalDiscount.toLocaleString()}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
            <p className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
              Net Loyalty Impact
            </p>
          </div>
        </div>

        <div className="admin-promo-card flex flex-col justify-between rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={analyticsData}>
              <Area
                type="monotone"
                dataKey="usage"
                stroke="#75EEA5"
                fill="#75EEA5"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                Peak Engagement
              </p>
              <p className="text-sm font-black text-slate-900 uppercase italic">
                Velocity Tracker
              </p>
            </div>
            <ArrowRight className="text-slate-200" size={20} />
          </div>
        </div>
      </section>

      {/* 🛠️ CONTROLS & TABLE */}
      <div className="space-y-6">
        <div className="admin-promo-filter flex flex-col items-center justify-between gap-6 rounded-[32px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/30 lg:flex-row">
          <div className="group relative w-full max-w-lg flex-1">
            <Search
              className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#75EEA5]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search Campaigns, Codes, or Targets..."
              className="w-full rounded-[22px] border border-slate-100 bg-slate-50 py-4 pr-6 pl-14 font-mono text-sm font-bold text-slate-900 italic transition-all focus:border-emerald-200 focus:bg-white focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex w-full flex-wrap gap-3 lg:w-auto">
            {[
              'all',
              'active',
              'expired',
              'unit',
              'percentage',
              'product-specific',
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-full px-6 py-3 text-[9px] font-black tracking-[2px] uppercase italic transition-all',
                  filter === f
                    ? 'bg-slate-900 text-white shadow-xl'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 TABLE VIEW */}
        <div className="admin-promo-table overflow-hidden rounded-[44px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-10 py-8 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Campaign Node
                  </th>
                  <th className="px-10 py-8 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Logic & Yield
                  </th>
                  <th className="px-10 py-8 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Propagation Target
                  </th>
                  <th className="px-10 py-8 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Load & Usage
                  </th>
                  <th className="px-10 py-8 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    Timeline
                  </th>
                  <th className="px-10 py-8 text-right text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                    State
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPromos.map((promo) => {
                  const userData = rawUsersData as unknown as {
                    employees: UserNode[]
                    customers: UserNode[]
                  }
                  const allUsers = [
                    ...(userData.employees || []),
                    ...(userData.customers || []).map((c) => ({
                      ...c,
                      role: 'customer',
                    })),
                  ]
                  const targetUser = allUsers.find(
                    (u) => u.id === promo.assigned_user_id,
                  )
                  const targetProd = rawProducts.find(
                    (p) => p.id === promo.product_id,
                  )
                  const usagePercent = (promo.used_count / promo.max_uses) * 100

                  return (
                    <tr
                      key={promo.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div
                            className={cn(
                              'flex h-12 w-12 items-center justify-center rounded-[18px] transition-transform group-hover:scale-110',
                              promo.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-400',
                            )}
                          >
                            {promo.discount_type === 'unit' ? (
                              <Zap size={22} />
                            ) : promo.discount_type === 'percentage' ? (
                              <TicketPercent size={22} />
                            ) : promo.discount_type === 'product-specific' ? (
                              <ShoppingBag size={22} />
                            ) : (
                              <Tag size={22} />
                            )}
                          </div>
                          <div>
                            <p className="text-base font-black tracking-tight text-slate-900 uppercase italic">
                              {promo.title}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] font-bold text-slate-400">
                              {promo.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-lg font-black tracking-tighter text-slate-900 italic">
                            {promo.discount_type === 'percentage'
                              ? `${promo.discount_value}%`
                              : promo.discount_type === 'unit'
                                ? `₱${promo.discount_value} OFF/UNIT`
                                : `₱${promo.discount_value} OFF`}
                          </span>
                          <span
                            className={cn(
                              'w-fit rounded-md px-2 py-0.5 text-[9px] font-black tracking-widest uppercase',
                              promo.discount_type === 'unit'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-slate-100 text-slate-600',
                            )}
                          >
                            {promo.discount_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        {promo.target_type === 'code' ? (
                          <div
                            onClick={() => handleCopyCode(promo.code)}
                            className="group/code flex cursor-pointer items-center gap-3 rounded-xl bg-slate-900 px-4 py-2 transition-all active:scale-95"
                          >
                            <span className="font-mono text-xs font-black tracking-widest text-[#75EEA5]">
                              {promo.code}
                            </span>
                            <Copy
                              size={12}
                              className="text-white opacity-20 transition-opacity group-hover/code:opacity-100"
                            />
                          </div>
                        ) : promo.target_type === 'specific_user' ? (
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                              <User size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-black text-slate-900 uppercase italic">
                                {targetUser?.name || 'Purged User'}
                              </p>
                              <p className="mt-0.5 truncate text-[9px] font-bold text-slate-400 uppercase">
                                ID: {promo.assigned_user_id}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Users size={16} />
                            <span className="text-[10px] font-black tracking-widest uppercase">
                              Global Broadcast
                            </span>
                          </div>
                        )}
                        {targetProd && (
                          <div className="mt-3 flex items-center gap-2 text-slate-400">
                            <ShoppingBag size={12} />
                            <span className="max-w-[120px] truncate text-[9px] font-bold uppercase">
                              {targetProd.name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        <div className="w-full max-w-[120px]">
                          <div className="mb-2 flex items-baseline justify-between">
                            <p className="text-[10px] font-black text-slate-900">
                              {promo.used_count}/{promo.max_uses}
                            </p>
                            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                              USES
                            </p>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn(
                                'h-full transition-all duration-1000',
                                usagePercent > 90
                                  ? 'bg-rose-500'
                                  : 'bg-slate-900',
                              )}
                              style={{
                                width: `${Math.min(100, usagePercent)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-slate-900 uppercase italic">
                            {format(parseISO(promo.expires_at), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                            <Clock size={10} />
                            {format(parseISO(promo.expires_at), 'hh:mm a')}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div
                          className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[9px] font-black tracking-widest uppercase italic',
                            promo.status === 'active'
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                              : promo.status === 'expired'
                                ? 'border-slate-200 bg-slate-100 text-slate-400'
                                : 'border-amber-100 bg-amber-50 text-amber-600',
                          )}
                        >
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full',
                              promo.status === 'active'
                                ? 'animate-pulse bg-emerald-500'
                                : 'bg-slate-300',
                            )}
                          />
                          {promo.status}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 📊 ANALYTICS VISUALIZER */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="rounded-[48px] border border-slate-100 bg-white p-10 shadow-2xl shadow-slate-200/40 lg:col-span-8">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic">
                Engagement Velocity
              </h3>
              <p className="mt-1 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                Market Pulse Analysis per Campaign Node
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50 px-6 py-2">
              <Activity size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                Live Telemetry
              </span>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '24px',
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                    padding: '20px',
                  }}
                />
                <Bar dataKey="usage" radius={[12, 12, 12, 12]} barSize={40}>
                  {analyticsData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? '#0f172a' : '#75EEA5'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-4">
          <div className="group relative overflow-hidden rounded-[48px] border border-slate-800 bg-slate-900 p-10 text-white">
            <div className="absolute top-0 right-0 p-10 opacity-10 transition-transform duration-[2000ms] group-hover:scale-125">
              <TrendingUp size={120} className="text-[#75EEA5]" />
            </div>
            <div className="relative z-10">
              <h4 className="mb-10 text-xl font-black text-[#75EEA5] uppercase italic">
                Awards & Milestones
              </h4>
              <div className="space-y-8">
                {[
                  {
                    icon: Award,
                    label: 'Loyalty Tier 1',
                    requirement: '1,000 Points',
                    reward: '₱200 Voucher',
                  },
                  {
                    icon: Gift,
                    label: 'Boutique Bonus',
                    requirement: '5 Orders',
                    reward: 'Free Screenplate',
                  },
                  {
                    icon: Zap,
                    label: 'Speedster Award',
                    requirement: '3 Instant Pays',
                    reward: '5% Perpetual',
                  },
                ].map((award, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-5 border-b border-white/5 pb-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/10 text-[#75EEA5]">
                      <award.icon size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase italic">
                        {award.label}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase">
                          {award.requirement}
                        </span>
                        <ChevronRight size={10} className="text-white/20" />
                        <span className="text-[9px] font-black tracking-widest text-[#75EEA5] uppercase">
                          {award.reward}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-12 w-full rounded-[24px] border border-white/10 bg-white/5 py-5 text-[10px] font-black tracking-[3px] uppercase transition-all hover:bg-white/10">
                Configure Loyalty Engine
              </button>
            </div>
          </div>

          <div className="group flex items-center gap-6 rounded-[40px] border border-slate-100 bg-white p-8 shadow-xl transition-all hover:translate-y-[-4px]">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-rose-50 text-rose-500 transition-colors duration-500 group-hover:bg-rose-500 group-hover:text-white">
              <AlertCircle size={28} />
            </div>
            <div>
              <h5 className="text-sm font-black text-slate-900 uppercase italic">
                Anomaly Shield
              </h5>
              <p className="mt-1 text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                No Negative Totals Detected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏗️ CREATE PROMOTION MODAL */}
      {isModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/90 p-0 backdrop-blur-3xl duration-500 lg:p-8">
          <div className="animate-in slide-in-from-right-full relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-none border-x-8 border-slate-50 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] duration-700 lg:h-auto lg:max-h-[85vh] lg:rounded-[56px]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-10">
              <div className="flex items-center gap-6">
                <div className="rounded-[18px] bg-slate-900 p-4 text-[#75EEA5]">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                    Campaign Provisioner
                  </h3>
                  <p className="mt-1 text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                    Configure Yield Logic & Target Parameters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-rose-500 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onFormSubmit)}
              className="custom-scrollbar space-y-10 overflow-y-auto bg-white p-10"
            >
              {/* Section 1: Core Meta */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="px-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                    Campaign Title
                  </label>
                  <input
                    {...register('title')}
                    className="w-full rounded-[24px] border border-slate-100 bg-slate-50 px-8 py-5 font-mono text-base font-black text-slate-900 italic shadow-inner transition-all focus:border-[#75EEA5] focus:bg-white focus:outline-none"
                    placeholder="e.g. VIP Laguna Launch"
                  />
                  {errors.title && (
                    <p className="px-4 text-[10px] font-bold text-rose-500">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="px-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                    Discount Logic Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        'percentage',
                        'fixed',
                        'unit',
                        'product-specific',
                      ] as const
                    ).map((t) => (
                      <label
                        key={t}
                        className={cn(
                          'relative flex cursor-pointer items-center justify-center rounded-[20px] border p-4 transition-all',
                          watchType === t
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                            : 'border-slate-100 bg-white text-slate-400 hover:border-[#75EEA5]',
                        )}
                      >
                        <input
                          type="radio"
                          value={t}
                          {...register('discount_type')}
                          className="sr-only"
                        />
                        <span className="text-[9px] font-black tracking-widest uppercase">
                          {t}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Economics */}
              <div className="grid grid-cols-1 gap-8 rounded-[40px] border border-slate-100 bg-slate-50 p-10 md:grid-cols-3">
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                    Discount Value
                  </label>
                  <div className="relative">
                    <span className="absolute top-1/2 left-6 -translate-y-1/2 font-black text-slate-400 italic">
                      {watchType === 'percentage' ? '%' : '₱'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('discount_value', { valueAsNumber: true })}
                      className="w-full rounded-[20px] border border-slate-200 bg-white py-5 pr-6 pl-12 font-mono text-xl font-black text-slate-900 transition-all focus:border-[#75EEA5] focus:outline-none"
                    />
                  </div>
                  {errors.discount_value && (
                    <p className="px-2 text-[10px] font-bold text-rose-500">
                      {errors.discount_value.message}
                    </p>
                  )}
                </div>

                {watchType === 'product-specific' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                      Link Product Node
                    </label>
                    <select
                      {...register('product_id')}
                      className="w-full appearance-none rounded-[20px] border border-slate-200 bg-white px-6 py-5 text-sm font-black text-slate-900 italic transition-all focus:border-[#75EEA5] focus:outline-none"
                    >
                      <option value="">Select Product...</option>
                      {rawProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₱{p.base_price})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {watchType === 'unit' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                      Minimum Quantity Condition
                    </label>
                    <input
                      type="number"
                      {...register('min_quantity', { valueAsNumber: true })}
                      className="w-full rounded-[20px] border border-slate-200 bg-white px-6 py-5 font-mono text-xl font-black text-slate-900 transition-all focus:border-[#75EEA5] focus:outline-none"
                      placeholder="300"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                    Expiration Timer
                  </label>
                  <input
                    type="datetime-local"
                    {...register('expires_at')}
                    className="w-full rounded-[20px] border border-slate-200 bg-white px-6 py-5 font-mono text-xs font-black text-slate-900 uppercase transition-all focus:border-[#75EEA5] focus:outline-none"
                  />
                  {errors.expires_at && (
                    <p className="px-2 text-[10px] font-bold text-rose-500">
                      {errors.expires_at.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Section 3: Propagation Target */}
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  {[
                    {
                      id: 'all_users',
                      label: 'Broadcast All',
                      icon: Users as LucideIcon,
                    },
                    {
                      id: 'specific_user',
                      label: 'Specific Entity',
                      icon: User as LucideIcon,
                    },
                    { id: 'code', label: 'Manual Code', icon: Tag as LucideIcon },
                  ].map((t) => (
                    <label
                      key={t.id}
                      className={cn(
                        'flex min-w-[180px] flex-1 cursor-pointer flex-col items-center gap-3 rounded-[32px] border p-6 transition-all',
                        watchTarget === t.id
                          ? 'border-slate-900 bg-slate-900 text-white shadow-2xl'
                          : 'border-slate-100 bg-white text-slate-400 hover:border-[#75EEA5]',
                      )}
                    >
                      <input
                        type="radio"
                        value={t.id}
                        {...register('target_type')}
                        className="sr-only"
                      />
                      <t.icon size={24} />
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        {t.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-8 pt-4 md:grid-cols-2">
                  {watchTarget === 'specific_user' && (
                    <div className="animate-in slide-in-from-top-2 space-y-3">
                      <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                        Select User Entity
                      </label>
                      <select
                        {...register('assigned_user_id')}
                        className="w-full appearance-none rounded-[24px] border border-slate-100 bg-slate-50 px-8 py-5 text-sm font-black text-slate-900 italic transition-all focus:border-[#75EEA5] focus:outline-none"
                      >
                        <option value="">Search users.json...</option>
                        {(() => {
                          const data = rawUsersData as unknown as {
                            customers: {
                              id: string
                              name: string
                              email: string
                            }[]
                          }
                          return (data.customers || []).map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))
                        })()}
                      </select>
                    </div>
                  )}

                  {watchTarget === 'code' && (
                    <div className="animate-in slide-in-from-top-2 space-y-3">
                      <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                        Manual Redeem Code
                      </label>
                      <div className="relative">
                        <input
                          {...register('code')}
                          className="w-full rounded-[24px] border border-slate-100 bg-slate-50 px-8 py-5 font-mono text-xl font-black tracking-widest text-slate-900 uppercase italic transition-all focus:border-[#75EEA5] focus:outline-none"
                          placeholder="SUMMER2026"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setValue(
                              'code',
                              uuidv4().substring(0, 8).toUpperCase(),
                            )
                          }
                          className="absolute top-1/2 right-4 -translate-y-1/2 rounded-xl bg-white p-3 text-slate-400 hover:text-slate-900"
                        >
                          <Zap size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                        Max Propagation Limit
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
                          One-Time Use
                        </span>
                        <div
                          className={cn(
                            'relative h-5 w-10 rounded-full transition-colors',
                            watchOneTime ? 'bg-[#75EEA5]' : 'bg-slate-200',
                          )}
                        >
                          <input
                            type="checkbox"
                            {...register('is_one_time')}
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              'absolute top-1 h-3 w-3 rounded-full bg-white transition-all',
                              watchOneTime ? 'left-6' : 'left-1',
                            )}
                          />
                        </div>
                      </label>
                    </div>
                    <input
                      type="number"
                      disabled={watchOneTime}
                      {...register('max_uses', { valueAsNumber: true })}
                      className="w-full rounded-[24px] border border-slate-100 bg-slate-50 px-8 py-5 font-mono text-xl font-black text-slate-900 transition-all focus:border-[#75EEA5] focus:outline-none disabled:opacity-30"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 rounded-[40px] bg-slate-900 p-10 text-white">
                <div className="flex items-center gap-4">
                  <Shield size={24} className="text-[#75EEA5]" />
                  <h4 className="text-xl font-black tracking-tighter uppercase italic">
                    Immunity & Safeguard Check
                  </h4>
                </div>
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    'No Negative Overrides Guaranteed',
                    'Automatic Expiration Cleanup',
                    'One-Time Redeem Security Layer',
                    'Backend Migration Compatible Pivot',
                  ].map((check, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-slate-400"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[#75EEA5]">
                        <CheckCircle2 size={12} />
                      </div>
                      <span className="text-[9px] font-black tracking-widest uppercase">
                        {check}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="sticky bottom-0 flex gap-4 border-t border-slate-50 bg-white pt-6 pb-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-[28px] border border-slate-100 py-6 font-mono text-[11px] font-black tracking-[3px] text-slate-400 uppercase italic transition-all hover:bg-slate-50"
                >
                  Abort Mission
                </button>
                <button
                  type="submit"
                  className="flex flex-[2] items-center justify-center gap-4 rounded-[28px] bg-slate-900 py-6 text-[11px] font-black tracking-[3px] text-white uppercase shadow-2xl shadow-slate-900/40 transition-all hover:bg-slate-800"
                >
                  Propagate Campaign Strategy
                  <ArrowRight size={18} className="text-[#75EEA5]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Generic Shield Icon fallback
const Shield = ({ size, className }: { size: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

export default MarketingPromotions
