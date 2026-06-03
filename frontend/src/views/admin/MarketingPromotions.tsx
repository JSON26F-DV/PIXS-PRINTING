import React, { useState, useMemo, useEffect } from 'react'
import {
  TicketPercent,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Activity,
  CheckCircle2,
  ChevronRight,
  Zap,
  Gift,
  Award,
  AlertCircle,
  Copy,
  ArrowRight,
  Users,
  User,
  Edit2,
  Trash2,
  Info,
  X,
  Lock,
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
} from 'recharts'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, isBefore, parseISO, addDays } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import axiosInstance from '../../lib/axiosInstance'

// Data Sources (as defaults / fallbacks)
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

interface UserNode {
  id: string
  name: string
  email: string
  role: string
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
  const [promos, setPromos] = useState<Promotion[]>([])
  const [customers, setCustomers] = useState<UserNode[]>(() => {
    return (rawUsersData.customers || []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: (c.name as string) || `${c.first_name} ${c.last_name}`,
      email: c.email as string,
      role: 'customer',
    }))
  })
  const [products, setProducts] = useState<any[]>(rawProducts)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedPromoDetails, setSelectedPromoDetails] = useState<Promotion | null>(null)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Map Database record to Promotion
  const mapDiscountToPromotion = (discount: Record<string, any>): Promotion => {
    const expiresAt = discount.expires_at;
    const now = new Date();
    const isExpired = expiresAt && isBefore(parseISO(expiresAt), now);
    
    let status: 'active' | 'used' | 'expired' = 'active';
    if (discount.already_used) {
      status = 'used';
    } else if (isExpired) {
      status = 'expired';
    }

    let discountType: Promotion['discount_type'] = 'fixed';
    if (discount.product_id) {
      discountType = 'product-specific';
    } else if (discount.type === 'percentage') {
      discountType = 'percentage';
    }

    return {
      id: discount.id,
      title: discount.title || `Campaign ${discount.code || discount.id}`,
      discount_type: discountType,
      discount_value: parseFloat(discount.value),
      target_type: discount.customer_id ? 'specific_user' : (discount.code ? 'code' : 'all_users'),
      assigned_user_id: discount.customer_id || undefined,
      product_id: discount.product_id || undefined,
      code: discount.code || undefined,
      max_uses: 1,
      used_count: discount.already_used ? 1 : 0,
      expires_at: expiresAt || format(addDays(now, 30), "yyyy-MM-dd'T'HH:mm"),
      status: status,
      conditions: discount.min_spend > 0 ? { minimum_quantity: Math.round(parseFloat(discount.min_spend)) } : undefined
    };
  }

  // --- FETCH DATA FROM BACKEND ---
  const loadData = async () => {
    try {
      setIsLoading(true)

      const [discountsResult, custsResult, prodsResult] = await Promise.allSettled([
        axiosInstance.get('/api/admin/discounts'),
        axiosInstance.get('/api/admin/customers'),
        axiosInstance.get('/api/products'),
      ])

      if (discountsResult.status === 'fulfilled') {
        const fetchedDiscounts = discountsResult.value.data.data || []
        const mappedDiscounts = fetchedDiscounts.map(mapDiscountToPromotion)
        setPromos(mappedDiscounts)
      } else {
        throw discountsResult.reason
      }

      if (custsResult.status === 'fulfilled' && custsResult.value.data?.data) {
        const formattedCustomers = custsResult.value.data.data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: (c.name as string) || `${c.first_name} ${c.last_name}`,
          email: c.email as string,
          role: 'customer',
        }))
        setCustomers(formattedCustomers)
      } else {
        console.warn('Failed to fetch customers from database, using defaults:', custsResult.status === 'rejected' ? custsResult.reason : 'Unknown error')
      }

      if (prodsResult.status === 'fulfilled') {
        const prodData = prodsResult.value.data.data || prodsResult.value.data
        if (Array.isArray(prodData)) {
          setProducts(prodData)
        }
      } else {
        console.warn('Failed to fetch products from database, using defaults:', prodsResult.reason ?? 'Unknown error')
      }
    } catch (error) {
      console.error('Error connecting to database:', error)
      toast.error('Telemetry pipeline offline - using localized backup')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // --- FORM SETUP ---
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<PromoFormData>({
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

    const usedToday = promos.filter((p) => p.status === 'used').length
    const totalDiscount = (rawOrders as OrderRecord[]).reduce(
      (acc, o) => acc + (o.discount?.total_discount_amount || 0),
      0,
    )

    return { active, expiringSoon, usedToday, totalDiscount }
  }, [promos])

  // --- ANALYTICS ---
  const analyticsData = useMemo(() => {
    if (promos.length === 0) {
      return [
        { name: 'Active', usage: stats.active, limit: 10 },
        { name: 'Used', usage: stats.usedToday, limit: 10 },
      ]
    }
    return promos.slice(0, 5).map((p) => ({
      name: p.title.substring(0, 10),
      usage: p.used_count,
      limit: p.max_uses,
    }))
  }, [promos, stats])

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

  // --- CRUD HANDLERS ---
  const onFormSubmit = async (data: PromoFormData) => {
    try {
      // Map frontend data to Laravel expectations
      const payload = {
        title: data.title,
        type: data.discount_type === 'percentage' ? 'percentage' : 'fixed',
        value: data.discount_value,
        customer_id: data.target_type === 'specific_user' ? data.assigned_user_id : null,
        product_id: data.discount_type === 'product-specific' ? data.product_id : null,
        variant_id: null,
        code: data.target_type === 'code' ? data.code?.toUpperCase() : (data.target_type === 'all_users' ? `GLOBAL${uuidv4().substring(0, 4).toUpperCase()}` : `CUST${uuidv4().substring(0, 4).toUpperCase()}`),
        min_spend: data.min_quantity || 0,
        expires_at: data.expires_at,
        already_used: data.max_uses > 1 ? false : undefined // defaults
      }

      if (editingPromo) {
        // UPDATE Campaign
        axiosInstance.put(`/api/admin/discounts/${editingPromo.id}`, {
          ...payload,
          already_used: editingPromo.used_count > 0
        })
        toast.success('Promotion updated successfully', {
          style: { borderRadius: '8px', background: '#1e293b', color: '#fff' },
        })
      } else {
        // CREATE Campaign
        await axiosInstance.post('/api/admin/discounts', payload)
        toast.success('Promotion created successfully', {
          style: { borderRadius: '8px', background: '#1e293b', color: '#fff' },
        })
      }

      setIsModalOpen(false)
      setEditingPromo(null)
      reset()
      loadData() // Refresh list from DB
    } catch (err: unknown) {
      console.error("Submission failed:", err)
      const errorMsg = (err as any).response?.data?.message || "Failed to save promotion"
      toast.error(errorMsg)
    }
  }

  const handleEditPromo = (promo: Promotion) => {
    setEditingPromo(promo)
    
    // Map Promotion parameters back to form values
    reset({
      title: promo.title,
      discount_type: promo.discount_type === 'product-specific' ? 'product-specific' : (promo.discount_type === 'percentage' ? 'percentage' : 'fixed'),
      discount_value: promo.discount_value,
      target_type: promo.target_type,
      assigned_user_id: promo.assigned_user_id || '',
      product_id: promo.product_id || '',
      code: promo.code || '',
      expires_at: format(parseISO(promo.expires_at), "yyyy-MM-dd'T'HH:mm"),
      max_uses: promo.max_uses,
      is_one_time: promo.max_uses === 1,
      min_quantity: promo.conditions?.minimum_quantity || 0,
    })

    setIsModalOpen(true)
  }

  const handleDeletePromo = async (id: string) => {
    // Rely on framework dialog rather than raw confirm()
    const willDelete = window.confirm("Are you sure you want to delete this promotion?")
    if (!willDelete) return

    try {
      await axiosInstance.delete(`/api/admin/discounts/${id}`)
      toast.success('Promotion deleted successfully', {
        style: { borderRadius: '8px', background: '#1e293b', color: '#fff' },
      })
      loadData() // Refresh list
    } catch (err) {
      console.error("Deletions failed:", err)
      toast.error("Failed to delete promotion")
    }
  }

  const handleOpenDetailsModal = (promo: Promotion) => {
    setSelectedPromoDetails(promo)
    setIsDetailsModalOpen(true)
  }

  const handleCopyCode = (code?: string) => {
    if (!code) return
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  const allUsers = customers; // Simply reuse the fetched customers

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 md:px-6">
      {/* HEADER SECTION */}
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-900 p-2 text-white shadow-sm">
              <TicketPercent size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Marketing Promotions
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage and track customer discount campaigns
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEditingPromo(null)
              reset({
                discount_type: 'percentage',
                target_type: 'all_users',
                max_uses: 1,
                is_one_time: true,
                expires_at: format(addDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm"),
                discount_value: 0,
                title: '',
                code: '',
                min_quantity: 0,
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} />
            Create Promotion
          </button>
        </div>
      </header>

      {/* SUMMARY STATS CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
              Active Campaigns
            </p>
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {stats.active}
            </h3>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
              Expiring Soon
            </p>
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Threshold
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {stats.expiringSoon}
            </h3>
            <span className="text-[10px] text-rose-500 font-semibold uppercase">
              3 Days Left
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
              Total Redemptions
            </p>
            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Usage
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              {stats.usedToday}
            </h3>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Total Discount Granted
          </p>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-sm font-semibold text-slate-400">₱</span>
            <h3 className="text-2xl font-bold text-slate-900">
              {stats.totalDiscount.toLocaleString()}
            </h3>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md flex-1">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search campaigns or promo codes..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              'all',
              'active',
              'used',
              'expired',
              'fixed',
              'percentage',
              'product-specific',
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase transition-colors',
                  filter === f
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING & EMPTY STATES */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 rounded-lg bg-white border border-slate-200 shadow-sm">
            <Activity className="animate-spin text-slate-400" size={28} />
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Loading campaigns...
            </p>
          </div>
        ) : filteredPromos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 rounded-lg bg-white border border-slate-200 shadow-sm text-center px-4">
            <AlertCircle className="text-slate-300" size={36} />
            <div>
              <p className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                No campaigns found
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[320px]">
                Try refining your filters or create a new promotional discount campaign above.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 📋 TABLE VIEW - Visible on Tablet/Desktop */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75">
                      <th className="px-6 py-3.5 font-semibold text-slate-500 tracking-wider uppercase">
                        Promotion Name
                      </th>
                      <th className="px-6 py-3.5 font-semibold text-slate-500 tracking-wider uppercase">
                        Discount Logic
                      </th>
                      <th className="px-6 py-3.5 font-semibold text-slate-500 tracking-wider uppercase">
                        Targeting
                      </th>
                      <th className="px-6 py-3.5 font-semibold text-slate-500 tracking-wider uppercase">
                        Usage Limit
                      </th>
                      <th className="px-6 py-3.5 font-semibold text-slate-500 tracking-wider uppercase">
                        Validity
                      </th>
                      <th className="px-6 py-3.5 font-semibold text-slate-500 tracking-wider uppercase text-center">
                        Status
                      </th>
                      <th className="px-6 py-3.5 font-semibold text-slate-500 tracking-wider uppercase text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPromos.map((promo) => {
                      const targetUser = allUsers.find(
                        (u) => u.id === promo.assigned_user_id,
                      )
                      const targetProd = products.find((p: any) => p.id === promo.product_id)
                      const usagePercent = promo.max_uses > 0 ? (promo.used_count / promo.max_uses) * 100 : 0

                      return (
                        <tr
                          key={promo.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500',
                                )}
                              >
                                {promo.discount_type === 'unit' ? (
                                  <Zap size={14} />
                                ) : promo.discount_type === 'percentage' ? (
                                  <TicketPercent size={14} />
                                ) : promo.discount_type === 'product-specific' ? (
                                  <ShoppingBag size={14} />
                                ) : (
                                  <Tag size={14} />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {promo.title}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  ID: {promo.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">
                                {promo.discount_type === 'percentage'
                                  ? `${promo.discount_value}%`
                                  : `₱${promo.discount_value}`}
                              </span>
                              <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                                {promo.discount_type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {promo.target_type === 'code' ? (
                              <div
                                onClick={() => handleCopyCode(promo.code)}
                                className="group flex cursor-pointer items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 transition-colors hover:bg-slate-100 w-fit"
                              >
                                <span className="font-mono text-xs font-semibold text-slate-700">
                                  {promo.code}
                                </span>
                                <Copy
                                  size={10}
                                  className="text-slate-400 opacity-60"
                                />
                              </div>
                            ) : promo.target_type === 'specific_user' ? (
                              <div className="flex items-center gap-2">
                                <User size={12} className="text-slate-400" />
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 truncate max-w-[120px]">
                                    {targetUser?.name || 'Customer Account'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Users size={12} />
                                <span className="text-[10px] uppercase tracking-wider">
                                  All Customers
                                </span>
                              </div>
                            )}
                            {targetProd && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                                <ShoppingBag size={10} />
                                <span className="truncate max-w-[120px]">{targetProd.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full max-w-[100px]">
                              <div className="flex items-baseline justify-between mb-1 text-[10px]">
                                <span className="font-semibold text-slate-750">
                                  {promo.used_count}/{promo.max_uses}
                                </span>
                                <span className="text-slate-400 font-medium">used</span>
                              </div>
                              <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    usagePercent >= 100 ? 'bg-slate-400' : 'bg-slate-800',
                                  )}
                                  style={{
                                    width: `${Math.min(100, usagePercent)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-[11px]">
                              <span className="font-medium text-slate-700">
                                {format(parseISO(promo.expires_at), 'MMM dd, yyyy')}
                              </span>
                              <span className="text-slate-400">
                                {format(parseISO(promo.expires_at), 'hh:mm a')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase',
                                promo.status === 'active'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : promo.status === 'expired'
                                    ? 'border-slate-200 bg-slate-50 text-slate-400'
                                    : 'border-amber-200 bg-amber-50 text-amber-700',
                              )}
                            >
                              {promo.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenDetailsModal(promo)}
                                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                title="View details"
                              >
                                <Info size={14} />
                              </button>
                              <button
                                onClick={() => handleEditPromo(promo)}
                                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                title="Edit promotion"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletePromo(promo.id)}
                                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                                title="Delete promotion"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 📱 CARDS VIEW - Visible on Mobile */}
            <div className="block md:hidden space-y-3">
              {filteredPromos.map((promo) => {
                const targetUser = allUsers.find(
                  (u) => u.id === promo.assigned_user_id,
                )
                return (
                  <div 
                    key={promo.id} 
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-500'
                        )}>
                          {promo.discount_type === 'unit' ? (
                            <Zap size={16} />
                          ) : promo.discount_type === 'percentage' ? (
                            <TicketPercent size={16} />
                          ) : promo.discount_type === 'product-specific' ? (
                            <ShoppingBag size={16} />
                          ) : (
                            <Tag size={16} />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {promo.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ID: {promo.id}
                          </p>
                        </div>
                      </div>
                      
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium tracking-wide uppercase',
                        promo.status === 'active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : promo.status === 'expired'
                            ? 'border-slate-200 bg-slate-50 text-slate-400'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                      )}>
                        {promo.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-2.5 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Logic & Yield</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {promo.discount_type === 'percentage'
                            ? `${promo.discount_value}%`
                            : `₱${promo.discount_value}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Timeline</p>
                        <p className="font-medium text-slate-700 mt-0.5">
                          {format(parseISO(promo.expires_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                      <div>
                        {promo.target_type === 'code' ? (
                          <div
                            onClick={() => handleCopyCode(promo.code)}
                            className="flex cursor-pointer items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 transition-colors"
                          >
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {promo.code}
                            </span>
                            <Copy size={10} className="text-slate-400" />
                          </div>
                        ) : promo.target_type === 'specific_user' ? (
                          <div className="flex items-center gap-1.5">
                            <User size={12} className="text-slate-400" />
                            <span className="font-medium text-slate-800 truncate max-w-[120px]">
                              {targetUser?.name || 'Customer Account'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Users size={12} />
                            <span className="text-[10px] uppercase tracking-wider">All Customers</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetailsModal(promo)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500"
                          title="View details"
                        >
                          <Info size={14} />
                        </button>
                        <button
                          onClick={() => handleEditPromo(promo)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500"
                          title="Edit promotion"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo.id)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:text-rose-600"
                          title="Delete promotion"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ANALYTICS & MILESTONES SECTION */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Promotion Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Overview of discount usage volume and limits
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1">
              <Activity size={12} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-600 tracking-wider uppercase">
                Active Telemetry
              </span>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
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
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                    padding: '8px',
                  }}
                />
                <Bar dataKey="usage" radius={[4, 4, 0, 0]} barSize={28}>
                  {analyticsData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? '#1e293b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm text-slate-900">
            <h4 className="mb-4 text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
              <Award size={14} className="text-slate-600" />
              Customer Rewards Settings
            </h4>
            <div className="space-y-4">
              {[
                {
                  icon: Award,
                  label: 'Silver Tier Voucher',
                  requirement: '1,000 Points Required',
                  reward: '₱200 Fixed Value',
                },
                {
                  icon: Gift,
                  label: 'Volume Purchase Reward',
                  requirement: 'Min. 5 Completed Orders',
                  reward: 'Free Screenplate Setup',
                },
                {
                  icon: Zap,
                  label: 'Prompt Settlement Award',
                  requirement: '3 Instant Pay Completed',
                  reward: '5% Custom Discount',
                },
              ].map((award, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50 text-slate-500">
                    <award.icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {award.label}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{award.requirement}</span>
                      <ChevronRight size={8} />
                      <span className="font-semibold text-slate-600">{award.reward}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full rounded-md border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
              Configure Reward Parameters
            </button>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-50 text-slate-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Discount Verification
              </h5>
              <p className="text-xs text-slate-400 mt-0.5">
                No negative transaction exceptions detected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 📋 DETAILS MODAL - Enterprise Grade Details */}
      {isDetailsModalOpen && selectedPromoDetails && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-all">
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Promotion Details
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Full parameters and current usage metrics
                </p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-colors border border-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Campaign configuration details */}
              <div className="rounded-lg bg-slate-50 p-4 space-y-2 border border-slate-200/60">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-500">Promotion Name</span>
                  <span className="font-bold text-slate-800 truncate max-w-[180px]">{selectedPromoDetails.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-500">Promo Code</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-350">
                    {selectedPromoDetails.code || 'N/A (Broadcast)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-500">Discount Logic</span>
                  <span className="font-semibold text-slate-700 uppercase">{selectedPromoDetails.discount_type}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 mt-1">
                  <span className="font-medium text-slate-500">Discount Value</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedPromoDetails.discount_type === 'percentage'
                      ? `${selectedPromoDetails.discount_value}%`
                      : `₱${selectedPromoDetails.discount_value.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Safeguards and parameters */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
                  Target & Requirements
                </p>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">Min. Spend Limit</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    ₱{(selectedPromoDetails.conditions?.minimum_quantity || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Assigned Entity</span>
                  <span className="font-semibold text-slate-800 uppercase max-w-[180px] truncate text-right">
                    {selectedPromoDetails.target_type === 'specific_user' 
                      ? (allUsers.find(u => u.id === selectedPromoDetails.assigned_user_id)?.name || 'Assigned Customer')
                      : selectedPromoDetails.target_type === 'code' ? 'Code Redeemable' : 'Global Broadcast'}
                  </span>
                </div>
                {selectedPromoDetails.product_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Linked Merchandise</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                      {products.find(p => p.id === selectedPromoDetails.product_id)?.name || 'Product Specific'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Expiration Date</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {format(parseISO(selectedPromoDetails.expires_at), 'yyyy-MM-dd hh:mm a')}
                  </span>
                </div>
              </div>

              {/* Usage stats */}
              <div className="rounded-lg bg-slate-900 p-4 text-white space-y-2.5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Redemptions Status</p>
                    <p className="font-bold mt-0.5">Limit telemetry</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      {selectedPromoDetails.used_count}/{selectedPromoDetails.max_uses}
                    </span>
                    <p className="text-[8px] text-white/30 uppercase mt-0.5 font-bold">Usages Count</p>
                  </div>
                </div>
                <div className="h-1 w-full bg-white/15 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      selectedPromoDetails.used_count >= selectedPromoDetails.max_uses ? "bg-rose-500" : "bg-emerald-400"
                    )}
                    style={{ width: `${(selectedPromoDetails.used_count / selectedPromoDetails.max_uses) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false)
                  handleEditPromo(selectedPromoDetails)
                }}
                className="flex-1 rounded-md bg-slate-900 py-2.5 text-xs font-semibold text-white text-center hover:bg-slate-800 transition-colors"
              >
                Edit Promotion
              </button>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex-1 rounded-md border border-slate-200 py-2.5 text-xs font-semibold text-slate-500 text-center hover:bg-slate-50 transition-colors"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏗️ CREATE / EDIT PROMOTION FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-all">
          <div className="relative flex w-full max-w-2xl flex-col bg-white shadow-2xl rounded-xl max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  {editingPromo ? 'Edit Promotion Campaign' : 'Create Promotion Campaign'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure discount conditions and targeting limits
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingPromo(null)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:bg-rose-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onFormSubmit as any)}
              className="custom-scrollbar space-y-6 overflow-y-auto bg-white p-6"
            >
              {/* Section 1: General Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Info size={12} />
                  General Details
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Promotion Title
                    </label>
                    <input
                      {...register('title')}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-950 focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
                      placeholder="e.g. VIP Client Offer"
                    />
                    {errors.title && (
                      <p className="text-[10px] font-semibold text-rose-500">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Discount Logic Type
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          'percentage',
                          'fixed',
                          'product-specific',
                        ] as const
                      ).map((t) => (
                        <label
                          key={t}
                          className={cn(
                            'relative flex cursor-pointer items-center justify-center rounded-md border p-2 transition-colors text-center',
                            watchType === t
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm font-semibold'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                          )}
                        >
                          <input
                            type="radio"
                            value={t}
                            {...register('discount_type')}
                            className="sr-only"
                          />
                          <span className="text-[10px] uppercase truncate">
                            {t === 'product-specific' ? 'Product' : t}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Discount & Validity Parameters */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <SlidersIcon size={12} />
                  Discount Parameters
                </h4>

                <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Discount Value
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                        {watchType === 'percentage' ? '%' : '₱'}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        {...register('discount_value', { valueAsNumber: true })}
                        className="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-3 pl-7 text-xs text-slate-900 focus:border-slate-400 focus:outline-none transition-colors"
                      />
                    </div>
                    {errors.discount_value && (
                      <p className="text-[10px] font-semibold text-rose-500">
                        {errors.discount_value.message}
                      </p>
                    )}
                  </div>

                  {watchType === 'product-specific' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">
                        Link Merchandise
                      </label>
                      <select
                        {...register('product_id')}
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none transition-colors"
                      >
                        <option value="">Select Product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₱{parseFloat(p.base_price || 0)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={cn("space-y-1.5", watchType === 'product-specific' ? "col-span-1" : "col-span-2")}>
                    <label className="text-xs font-semibold text-slate-600">
                      Expiration Date
                    </label>
                    <input
                      type="datetime-local"
                      {...register('expires_at')}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none transition-colors"
                    />
                    {errors.expires_at && (
                      <p className="text-[10px] font-semibold text-rose-500">
                        {errors.expires_at.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Targeting Controls */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Users size={12} />
                  Targeting & Limits
                </h4>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        id: 'all_users',
                        label: 'All Customers',
                        icon: Users as LucideIcon,
                      },
                      {
                        id: 'specific_user',
                        label: 'Specific Customer',
                        icon: User as LucideIcon,
                      },
                      { id: 'code', label: 'Promo Code', icon: Tag as LucideIcon },
                    ].map((t) => (
                      <label
                        key={t.id}
                        className={cn(
                          'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 transition-colors text-center min-w-[120px]',
                          watchTarget === t.id
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm font-semibold'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                        )}
                      >
                        <input
                          type="radio"
                          value={t.id}
                          {...register('target_type')}
                          className="sr-only"
                        />
                        <t.icon size={14} />
                        <span className="text-[10px] uppercase">
                          {t.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-1 md:grid-cols-2">
                    {watchTarget === 'specific_user' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">
                          Select Customer
                        </label>
                        <select
                          {...register('assigned_user_id')}
                          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:outline-none transition-colors animate-in fade-in duration-200"
                        >
                          <option value="">Select User...</option>
                          {allUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {watchTarget === 'code' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">
                          Manual Promo Code
                        </label>
                        <div className="relative">
                          <input
                            {...register('code')}
                            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 uppercase focus:border-slate-400 focus:outline-none transition-colors animate-in fade-in duration-200"
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
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                            title="Generate random code"
                          >
                            <Zap size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">
                        Minimum Spend Safeguard (₱)
                      </label>
                      <input
                        type="number"
                        {...register('min_quantity', { valueAsNumber: true })}
                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:outline-none transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Safeguard Policies */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Lock size={14} />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Discount Verification Policy
                  </h4>
                </div>
                <ul className="grid grid-cols-1 gap-2 text-[10px] text-slate-500 md:grid-cols-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={10} className="text-slate-400" />
                    <span>No negative totals guaranteed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={10} className="text-slate-400" />
                    <span>Automatic expiration checks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={10} className="text-slate-400" />
                    <span>Single-use code security</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={10} className="text-slate-400" />
                    <span>Real-time database sync</span>
                  </li>
                </ul>
              </div>

              <div className="sticky bottom-0 flex gap-2 border-t border-slate-200 bg-white pt-4 pb-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingPromo(null)
                  }}
                  className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {editingPromo ? 'Save Changes' : 'Save Promotion'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Sliders icon fallback
const SlidersIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
)


export default MarketingPromotions
