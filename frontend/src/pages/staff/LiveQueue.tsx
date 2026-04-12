import React, { useState, useMemo, useEffect } from 'react'
import {
  Activity,
  Search,
  Clock,
  CheckCircle2,
  Play,
  AlertCircle,
  ShoppingBag,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react'
import Select, { type SingleValue } from 'react-select'
import { orderBy } from 'lodash'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

import axios from 'axios'
import { type Order } from '../../types/order'
import allProducts from '../../data/products.json'

// Types for staff execution tracking
interface ExecutionState {
  startedIds: Record<string, string> // order_id -> timestamp
  completedIds: string[] // local list of orders finished in this session
}

interface StaffAssignment {
  allowed_categories: string[]
  allowed_products: string[]
  is_admin: boolean
}

const LiveQueue: React.FC = () => {
  // --- STATE ---
  const [orders, setOrders] = useState<Order[]>([])
  const [assignment, setAssignment] = useState<StaffAssignment | null>(null)
  const [, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Execution tracking (Simulating persistence via localStorage)
  const [execution, setExecution] = useState<ExecutionState>(() => {
    try {
      const saved = localStorage.getItem('pixs_staff_execution_v1')
      return saved ? JSON.parse(saved) : { startedIds: {}, completedIds: [] }
    } catch {
      return { startedIds: {}, completedIds: [] }
    }
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] =
    useState<SingleValue<{ value: string; label: string }>>(null)
  const [sortOption, setSortOption] = useState<
    SingleValue<{ value: string; label: string }>
  >({ value: 'date-desc', label: 'Newest First' })

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('pixs_staff_execution_v1', JSON.stringify(execution))
  }, [execution])

  // --- LOAD DATA ---
  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/staff/orders')
        const { data, assignments } = response.data

        setOrders(data)
        setAssignment(assignments)
        setError(null)
      } catch (err: unknown) {
        const error = err as Error
        console.error('Failed to load production queue:', error.message)
        setError('Unable to retrieve processing orders.')
      } finally {
        setLoading(false)
      }
    }

    fetchQueueData()
  }, [])

  // --- LOGIC: FILTERING & SORTING ---
  const usersOptions = useMemo(() => {
    const uniqueUsers = Array.from(new Set(orders.map((o) => o.user_id)))
    return [
      { value: 'all', label: 'All Users' },
      ...uniqueUsers.map((uid) => ({ value: uid, label: `Entity: ${uid}` })),
    ]
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (!assignment) return []

    // 1. Assignments from backend
    const allowedCategories = assignment.allowed_categories || []
    const allowedProducts = assignment.allowed_products || []

    // 2. Map product names to categories
    const productCategoryMap: Record<string, string> = {}
    ;(allProducts as { name: string; category: string }[]).forEach((p) => {
      productCategoryMap[p.name] = p.category
    })

    // 3. Apply category & product restriction
    const filteredByCategory = orders
      .filter((o) => !execution.completedIds.includes(o.order_id))
      .map((order) => {
        // If admin, show all products
        const isPrivileged = assignment.is_admin
        const noConstraints =
          allowedCategories.length === 0 && allowedProducts.length === 0

        if (isPrivileged || noConstraints) return order

        // Filter products within the order
        const assignedProducts = order.products.filter((p) => {
          const cat = productCategoryMap[p.productName]
          const isCatAllowed = allowedCategories.includes(cat)
          const isProdAllowed = allowedProducts.includes(p.productName)
          return isCatAllowed || isProdAllowed
        })

        return { ...order, products: assignedProducts }
      })
      .filter((o) => o.products.length > 0) // Hide orders that have no matching products

    let result = filteredByCategory

    // Search logic
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          o.order_id.toLowerCase().includes(q) ||
          o.user_id.toLowerCase().includes(q) ||
          o.products.some((p: { productName: string }) =>
            p.productName.toLowerCase().includes(q),
          ),
      )
    }

    // User filter
    if (userFilter && userFilter.value !== 'all') {
      result = result.filter((o) => o.user_id === userFilter.value)
    }

    // Sorting logic using lodash
    switch (sortOption?.value) {
      case 'date-desc':
        result = orderBy(
          result,
          [(o) => new Date(o.created_at).getTime()],
          ['desc'],
        )
        break
      case 'date-asc':
        result = orderBy(
          result,
          [(o) => new Date(o.created_at).getTime()],
          ['asc'],
        )
        break
      case 'price-asc':
        result = orderBy(result, ['total_amount'], ['asc'])
        break
      case 'price-desc':
        result = orderBy(result, ['total_amount'], ['desc'])
        break
      case 'qty-desc':
        result = orderBy(
          result,
          [
            (o) =>
              o.products.reduce(
                (acc: number, p: { quantity: number }) => acc + p.quantity,
                0,
              ),
          ],
          ['desc'],
        )
        break
      case 'name-asc':
        result = orderBy(
          result,
          [(o) => o.products[0]?.productName || ''],
          ['asc'],
        )
        break
    }

    // MANDATORY logic: Started orders float to top
    return orderBy(
      result,
      [(o) => (execution.startedIds[o.order_id] ? 1 : 0)],
      ['desc'],
    )
  }, [orders, searchQuery, userFilter, sortOption, execution, assignment])

  // Split into sections
  const activeOrders = filteredOrders.filter(
    (o) => !!execution.startedIds[o.order_id],
  )
  const pendingOrders = filteredOrders.filter(
    (o) => !execution.startedIds[o.order_id],
  )

  // --- ACTIONS ---
  const handleInitiateExecution = (orderId: string) => {
    setExecution((prev: ExecutionState) => ({
      ...prev,
      startedIds: {
        ...prev.startedIds,
        [orderId]: new Date().toISOString(),
      },
    }))
    toast.success(`Operational sequence initiated for ${orderId}`, {
      icon: '⚡',
      style: { borderRadius: '16px', background: '#0f172a', color: '#fff' },
    })
  }

  const handleMarkCompletion = async (order: Order) => {
    try {
      // Log each product production event to backend
      await Promise.all(
        order.products.map((p) =>
          axios.post('/api/staff/log-production', {
            order_id: order.order_id,
            product_name: p.productName,
            quantity: p.quantity,
            category: p.category,
          }),
        ),
      )

      // Persistence: Mark as completed in session
      setExecution((prev) => ({
        ...prev,
        completedIds: [...prev.completedIds, order.order_id],
      }))

      toast.success(`Production Log persistent for ${order.order_id}`, {
        icon: '🏛️',
        duration: 5000,
        style: { borderRadius: '16px', background: '#0F172A', color: '#fff' },
      })
    } catch {
      toast.error('Failed to log production completion.')
    }
  }

  // --- FALLBACKS ---
  if (error) {
    return (
      <div className="LiveQueueErrorFallback flex min-h-screen items-center justify-center bg-slate-50 p-10">
        <div className="w-full max-w-md space-y-6 rounded-[32px] border border-rose-100 bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
            System Malfunction
          </h2>
          <p className="font-medium text-slate-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-slate-800"
          >
            Re-Initialize Terminal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="LiveQueuePage min-h-screen bg-[#F8FAFC] pb-20">
      {/* 🚀 HEADER */}
      <header className="LiveQueueHeader mx-auto max-w-[1700px] px-6 pt-12 md:px-12">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="animate-pulse rounded-[22px] bg-slate-900 p-4 text-emerald-400 shadow-2xl shadow-slate-900/20">
                <Activity size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Live Production Queue
                </h1>
                <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
                  Processing Orders Only • Strict Execution Protocol
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white px-8 py-5 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Active Processing
                </span>
                <span className="text-2xl font-black tracking-tighter text-slate-900 italic">
                  {activeOrders.length + pendingOrders.length} Nodes
                </span>
              </div>
              <div className="flex -space-x-3">
                {orders.slice(0, 3).map((o, i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-black text-slate-400 uppercase"
                  >
                    {o.user_id.slice(-2)}
                  </div>
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[10px] font-black text-white">
                  +{orders.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 🛠️ FILTERS BAR */}
      <section className="LiveQueueFiltersBar mx-auto mt-10 max-w-[1700px] px-6 md:px-12">
        <div className="flex flex-col items-center gap-6 rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 lg:flex-row">
          <div className="group relative w-full flex-1">
            <Search
              className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-emerald-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Order ID, Product, or Client..."
              className="w-full rounded-[20px] border border-slate-100 bg-slate-50 py-4 pr-6 pl-16 text-sm font-bold text-slate-900 italic transition-all focus:border-emerald-200 focus:bg-white focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex w-full flex-col items-center gap-4 sm:flex-row lg:w-auto">
            <div className="w-full sm:w-64">
              <Select
                options={usersOptions}
                value={userFilter}
                onChange={setUserFilter}
                placeholder="Filter by Client"
                className="staff-select-container text-[11px] font-black tracking-widest uppercase"
                styles={selectStyles}
              />
            </div>
            <div className="w-full sm:w-72">
              <Select
                options={[
                  { value: 'date-desc', label: 'Newest First' },
                  { value: 'date-asc', label: 'Oldest First' },
                  { value: 'price-asc', label: 'Yield: Low-High' },
                  { value: 'price-desc', label: 'Yield: High-Low' },
                  { value: 'qty-desc', label: 'Capacity: High-Low' },
                  { value: 'name-asc', label: 'A-Z Product' },
                ]}
                value={sortOption}
                onChange={setSortOption}
                className="staff-select-container text-[11px] font-black tracking-widest uppercase"
                styles={selectStyles}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 📋 PRODUCTION BOARD */}
      <main className="LiveQueueBoard mx-auto mt-10 max-w-[1700px] space-y-16 px-6 md:px-12">
        {/* ACTIVE SECTION */}
        {activeOrders.length > 0 && (
          <section className="LiveQueueActiveSection animate-in slide-in-from-top-4 space-y-8 duration-500">
            <div className="flex items-center gap-4">
              <div className="h-3 w-3 animate-ping rounded-full bg-emerald-500"></div>
              <h2 className="text-xl font-black tracking-widest text-slate-900 uppercase italic">
                Active Operations{' '}
                <span className="ml-2 text-emerald-500">
                  ({activeOrders.length})
                </span>
              </h2>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  startedAt={execution.startedIds[order.order_id]}
                  onComplete={() => handleMarkCompletion(order)}
                  isActive
                />
              ))}
            </div>
          </section>
        )}

        {/* PENDING SECTION */}
        <section className="LiveQueuePendingSection space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-slate-300"></div>
            <h2 className="text-xl font-black tracking-widest text-slate-900 uppercase italic">
              Waiting for Execution{' '}
              <span className="ml-2 text-slate-400">
                ({pendingOrders.length})
              </span>
            </h2>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          {pendingOrders.length === 0 && !activeOrders.length ? (
            <div className="flex flex-col items-center rounded-[44px] border border-dashed border-slate-200 bg-white py-32 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                <Clock size={48} />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                Queue Empty
              </h3>
              <p className="mt-2 text-[10px] font-bold tracking-[2px] text-slate-400 uppercase">
                No active processing orders detected in master ledger
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  onStart={() => handleInitiateExecution(order.order_id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---

const OrderCard: React.FC<{
  order: Order
  isActive?: boolean
  startedAt?: string
  onStart?: () => void
  onComplete?: () => void
}> = ({ order, isActive, startedAt, onStart, onComplete }) => {
  return (
    <div
      className={`LiveQueueOrderCard overflow-hidden rounded-[44px] border transition-all ${isActive ? 'scale-[1.02] border-slate-800 bg-slate-900 shadow-2xl' : 'border-slate-100 bg-white shadow-xl shadow-slate-200/20 hover:border-slate-200'}`}
    >
      {/* CARD HEADER */}
      <div
        className={`border-b p-8 ${isActive ? 'border-white/5 bg-white/5' : 'border-slate-50'}`}
      >
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-[22px] shadow-lg ${isActive ? 'bg-[#75EEA5] text-slate-900' : 'bg-slate-900 text-white'}`}
            >
              <ShoppingBag size={24} />
            </div>
            <div>
              <p
                className={`mb-1 text-[10px] font-black tracking-[3px] uppercase ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                Order Terminal {order.order_id}
              </p>
              <div className="flex items-center gap-3">
                <h3
                  className={`text-xl font-black tracking-tight uppercase italic ${isActive ? 'text-white' : 'text-slate-900'}`}
                >
                  Payload Recipient: {order.user_id}
                </h3>
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"></div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p
              className={`mb-1 text-[9px] font-black tracking-widest uppercase ${isActive ? 'text-white/40' : 'text-slate-400'}`}
            >
              Master Vault Total
            </p>
            <span
              className={`text-2xl font-black tracking-tighter italic ${isActive ? 'text-[#75EEA5]' : 'text-slate-900'}`}
            >
              ₱{order.total_amount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* PRODUCTS LIST */}
      <div className="space-y-6 p-8">
        {order.products.map((p, idx) => (
          <div
            key={`${order.order_id}-p-${idx}`}
            className={`LiveQueueProductCard rounded-[32px] border p-6 transition-all ${isActive ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg'}`}
          >
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Image Node */}
              <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-[24px] border border-slate-100 bg-white p-2 shadow-inner lg:h-32 lg:w-32">
                <img
                  src={p.productImage}
                  alt={p.productName}
                  className="h-full w-full rounded-xl object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <ImageIcon size={20} className="text-white" />
                </div>
              </div>

              {/* Content Node */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4
                      className={`text-lg font-black tracking-tight uppercase italic ${isActive ? 'text-white' : 'text-slate-900'}`}
                    >
                      {p.productName}
                    </h4>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[9px] font-black tracking-wider text-slate-700 uppercase">
                        {p.variant.size}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Qty:{' '}
                        <span
                          className={
                            isActive
                              ? 'font-black text-white'
                              : 'font-black text-slate-900'
                          }
                        >
                          {p.quantity.toLocaleString()} pcs
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-black italic ${isActive ? 'text-[#75EEA5]' : 'text-slate-900'}`}
                    >
                      ₱{p.variant.unitPrice.toFixed(2)}/u
                    </span>
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="flex flex-wrap gap-2">
                  {p.colors.map((c, ci) => (
                    <div
                      key={ci}
                      className="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-1.5 shadow-sm"
                    >
                      <div
                        className="h-3 w-3 rounded-full border border-slate-200 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      ></div>
                      <span className="text-[9px] font-black tracking-widest text-slate-900 uppercase italic">
                        {c.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Technical Requirement Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    className={`rounded-2xl p-4 ${isActive ? 'bg-black/20' : 'bg-white shadow-sm'}`}
                  >
                    <p className="mb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      Plate Strategy
                    </p>
                    <p
                      className={`text-[10px] font-black italic ${isActive ? 'text-white' : 'text-slate-900'}`}
                    >
                      {p.plate?.name || 'TBD - Standard'}
                    </p>
                    <div className="mt-2 flex justify-between border-t border-slate-100/10 pt-2">
                      <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                        Setup Cost
                      </span>
                      <span
                        className={`text-[9px] font-black italic ${isActive ? 'text-emerald-400' : 'text-slate-900'}`}
                      >
                        ₱{p.plate?.setupFee || 0}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`rounded-2xl p-4 ${isActive ? 'bg-black/20' : 'bg-white shadow-sm'}`}
                  >
                    <p className="mb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      Print Yield Rate
                    </p>
                    <p
                      className={`text-[10px] font-black italic ${isActive ? 'text-white' : 'text-slate-900'}`}
                    >
                      ₱{p.plate?.printPricePerUnit.toFixed(2) || '0.00'}/u
                    </p>
                  </div>
                </div>

                {/* Custom Req */}
                {p.customRequirements && (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <AlertCircle size={14} className="mt-0.5 text-amber-500" />
                    <p className="text-[10px] leading-relaxed font-bold tracking-tight text-amber-500 uppercase italic">
                      Requirement: {p.customRequirements}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER ACTIONS */}
      <div
        className={`flex flex-col items-center justify-between gap-6 p-8 sm:flex-row ${isActive ? 'border-t border-white/5 bg-white/5' : 'border-t border-slate-50 bg-slate-50/30'}`}
      >
        {isActive ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#75EEA5]"></div>
              <p className="text-[10px] font-black tracking-[2px] text-white uppercase italic">
                Execution In Progress
              </p>
            </div>
            <p className="text-[9px] font-medium text-slate-400">
              Triggered at {format(new Date(startedAt!), 'HH:mm:ss · MMM dd')}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Calendar size={14} className="text-slate-400" />
            <p className="text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase italic">
              Registered: {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
        )}

        <div className="flex w-full items-center gap-4 sm:w-auto">
          {isActive ? (
            <button
              onClick={onComplete}
              className="LiveQueueCompleteButton flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#75EEA5] px-8 py-5 text-[11px] font-black tracking-[3px] text-slate-900 uppercase italic shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-400 sm:w-auto"
            >
              <CheckCircle2 size={18} />
              Mark Operational Completion
            </button>
          ) : (
            <button
              onClick={onStart}
              className="LiveQueueStartButton group flex w-full items-center justify-center gap-3 rounded-[24px] bg-slate-900 px-8 py-5 text-[11px] font-black tracking-[3px] text-white uppercase italic shadow-xl shadow-slate-900/30 transition-all hover:bg-slate-800 sm:w-auto"
            >
              <Play
                size={18}
                className="text-emerald-400 transition-transform group-hover:scale-110"
              />
              Initiate Execution
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// --- STYLES ---

const selectStyles = {
  control: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    borderRadius: '16px',
    padding: '6px 8px',
    backgroundColor: '#f8fafc',
    border: state.isFocused ? '1px solid #75EEA5' : '1px solid #f1f5f9',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#75EEA5',
    },
  }),
  placeholder: (base: object) => ({
    ...base,
    color: '#94a3b8',
    fontWeight: '900',
  }),
  singleValue: (base: object) => ({
    ...base,
    color: '#0f172a',
    fontWeight: '900',
  }),
}

export default LiveQueue
