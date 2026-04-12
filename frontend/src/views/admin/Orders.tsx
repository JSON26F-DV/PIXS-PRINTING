import React, { useState, useMemo } from 'react'
import {
  Search,
  ArrowUpDown,
  Users,
  ShoppingBag,
  Star,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
  MoreVertical,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../context/AuthContext'

// Data Sources (Simulated relational structure)
import rawOrders from '../../data/order.json'
import rawUsersData from '../../data/users.json'

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Sub-components declared outside to avoid re-creation on render
const RatingStars = ({ rating }: { rating: number }) => (
  <div className="orders-rating-stars flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={12}
        className={cn(
          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200',
        )}
      />
    ))}
  </div>
)

// Interfaces
interface OrderItem {
  id: string
  productId: string
  productName: string
  productImage: string
  category: string
  quantity: number
  variant: {
    unitPrice: number
    size: string
    id: string
  }
  colors: { name: string; hex: string }[]
  plate: { name: string; setupFee: number; printPricePerUnit: number } | null
  customRequirements?: string
}

interface Order {
  order_id: string // Changed from id to order_id to match order.json
  user_id: string
  products: OrderItem[] // Changed from items to products
  total_amount: number
  status: string
  created_at: string
  updated_at?: string
  feedback?: string
  complaint?: string
  rating?: number
  discount?: {
    discount_id: string | null
    total_discount_amount: number
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

const Orders: React.FC = () => {
  const { user } = useAuth()
  // --- STATE ---
  const [orders, setOrders] = useState<Order[]>(rawOrders)
  const [users] = useState<User[]>(() => {
    const data = rawUsersData as unknown as {
      employees: User[]
      customers: User[]
    }
    const employees = data.employees || []
    const customers = (data.customers || []).map((c) => ({
      ...c,
      role: 'customer',
    }))
    return [...employees, ...customers]
  })

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  )
  const [globalSearch, setGlobalSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOption, setSortOption] = useState('date-desc')
  const [ratingFilter, setRatingFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // --- DERIVED STATE / MEMOIZED LOGIC ---
  const customers = useMemo(() => {
    return users
      .filter((u) => u.role === 'customer')
      .map((c) => {
        const customerOrders = orders.filter((o) => o.user_id === c.id)
        const totalSpent = customerOrders.reduce(
          (sum, o) => sum + o.total_amount,
          0,
        )
        return {
          ...c,
          orderCount: customerOrders.length,
          totalSpent,
        }
      })
      .sort((a, b) => b.orderCount - a.orderCount)
  }, [users, orders])

  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Customer Selection
    if (selectedCustomerId) {
      result = result.filter((o) => o.user_id === selectedCustomerId)
    }

    // Global Search
    if (globalSearch) {
      const q = globalSearch.toLowerCase()
      result = result.filter((o) => {
        const customer = users.find((u) => u.id === o.user_id)
        return (
          o.order_id.toLowerCase().includes(q) ||
          customer?.name.toLowerCase().includes(q) ||
          customer?.email.toLowerCase().includes(q)
        )
      })
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter)
    }

    // Rating Filter
    if (ratingFilter !== 'all') {
      result = result.filter((o) => o.rating === parseInt(ratingFilter))
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case 'date-asc':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        case 'amount-desc':
          return b.total_amount - a.total_amount
        case 'amount-asc':
          return a.total_amount - b.total_amount
        case 'name-asc': {
          const nameA = users.find((u) => u.id === a.user_id)?.name || ''
          const nameB = users.find((u) => u.id === b.user_id)?.name || ''
          return nameA.localeCompare(nameB)
        }
        default:
          return 0
      }
    })

    return result
  }, [
    orders,
    selectedCustomerId,
    globalSearch,
    statusFilter,
    ratingFilter,
    sortOption,
    users,
  ])

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(start, start + itemsPerPage)
  }, [filteredOrders, currentPage])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'Completed').length
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length
    const ratedOrders = orders.filter((o) => (o.rating || 0) > 0)
    const avgRating =
      ratedOrders.length > 0
        ? (
            ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) /
            ratedOrders.length
          ).toFixed(1)
        : '0.0'

    return {
      total: orders.length,
      completed,
      cancelled,
      avgRating,
    }
  }, [orders])

  const chartData = useMemo(() => {
    const statusMap: Record<string, number> = {}
    orders.forEach((o) => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1
    })

    const statusPie = Object.entries(statusMap).map(([name, value]) => ({
      name,
      value,
      color:
        name === 'Completed'
          ? '#10b981'
          : name === 'Pending'
            ? '#f59e0b'
            : name === 'Processing'
              ? '#3b82f6'
              : name === 'Cancelled'
                ? '#ef4444'
                : '#64748b',
    }))

    const customerBar = customers.slice(0, 5).map((c) => ({
      name: c.name.split(' ')[0],
      orders: c.orderCount,
    }))

    return { statusPie, customerBar }
  }, [orders, customers])

  // --- HANDLERS ---
  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.order_id === orderId) {
          // Validation: Cannot update Completed -> Pending
          if (o.status === 'Completed' && newStatus === 'Pending') return o
          return {
            ...o,
            status: newStatus,
            updated_at: new Date().toISOString(),
          }
        }
        return o
      }),
    )
  }

  return (
    <div className="orders-page animate-in fade-in mx-auto flex max-w-[1700px] flex-col gap-8 px-4 pb-16 duration-500 lg:px-10">
      {/* 🚀 ANALYTICS HEADER */}
      <section className="orders-analytics grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="orders-stats-card group relative overflow-hidden rounded-[24px] bg-slate-900 p-6 text-white">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
            <ShoppingBag size={80} />
          </div>
          <p className="mb-2 text-[10px] font-black tracking-[3px] uppercase opacity-70">
            Total System Load
          </p>
          <h3 className="text-4xl font-black tracking-tighter italic">
            {stats.total}{' '}
            <span className="text-xs font-bold text-[#75EEA5]">ORDERS</span>
          </h3>
        </div>
        <div className="orders-stats-card group relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
            Yield Efficiency
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black tracking-tighter text-slate-900">
              {((stats.completed / (stats.total || 1)) * 100).toFixed(0)}%
            </h3>
            <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
              {stats.completed} Finished
            </span>
          </div>
        </div>
        <div className="orders-stats-card group relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="mb-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
            Satisfaction Quotient
          </p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black tracking-tighter text-slate-900">
              {stats.avgRating}
            </h3>
            <RatingStars rating={Math.floor(parseFloat(stats.avgRating))} />
          </div>
        </div>
        <div className="orders-stats-card group relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={chartData.customerBar}>
                <Bar dataKey="orders" fill="#f1f5f9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              Activity Pulsar
            </p>
          </div>
        </div>
      </section>

      {/* 🛠️ HEADER CONTROLS */}
      <section className="orders-header sticky top-0 z-40 flex flex-col items-center justify-between gap-6 rounded-[32px] border border-slate-100 bg-white/80 p-6 shadow-2xl shadow-slate-200/40 backdrop-blur-xl lg:flex-row">
        <div className="group relative w-full max-w-xl flex-1">
          <Search
            className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Order ID, Customer Entity, or Trace Map..."
            className="orders-search-input w-full rounded-[22px] border border-slate-100 bg-slate-50 py-4 pr-6 pl-14 font-mono text-sm font-bold text-slate-900 italic transition-all focus:border-emerald-200 focus:bg-white focus:outline-none"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
          <select
            className="orders-filter-dropdown cursor-pointer appearance-none rounded-[20px] border border-transparent bg-slate-100 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-200 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Status: Unified</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            className="orders-filter-dropdown cursor-pointer appearance-none rounded-[20px] border border-transparent bg-slate-100 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-200 focus:outline-none"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">Rating: All Nodes</option>
            <option value="5">Rating: 5 Stars</option>
            <option value="4">Rating: 4 Stars</option>
            <option value="3">Rating: 3 Stars</option>
            <option value="2">Rating: 2 Stars</option>
            <option value="1">Rating: 1 Star</option>
          </select>

          <select
            className="orders-sort-control cursor-pointer appearance-none rounded-[20px] border border-transparent bg-slate-100 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-200 focus:outline-none"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="date-desc">Newest Epoch</option>
            <option value="date-asc">Oldest Epoch</option>
            <option value="amount-desc">Top Magnitude</option>
            <option value="amount-asc">Low Magnitude</option>
            <option value="name-asc">Customer A-Z</option>
          </select>

          <button className="rounded-[20px] bg-slate-900 p-4 text-[#75EEA5] shadow-xl shadow-slate-900/20 transition-transform hover:scale-105 active:scale-95">
            <Download size={20} />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* 👤 2️⃣ LEFT PANEL — CUSTOMER LIST */}
        <aside className="orders-customer-sidebar flex h-[800px] flex-col overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-xl shadow-slate-200/30 lg:col-span-3">
          <div className="border-b border-slate-50 bg-slate-50/50 p-8">
            <h3 className="text-lg font-black text-slate-900 uppercase italic">
              Customer Registry
            </h3>
            <p className="mt-1 text-[10px] font-black tracking-[2px] text-slate-400 uppercase italic">
              Active Wallet Entities
            </p>
          </div>

          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
            <div
              className={cn(
                'orders-customer-card group cursor-pointer rounded-[24px] border p-4 transition-all',
                !selectedCustomerId
                  ? 'orders-customer-active border-slate-900 bg-slate-900 shadow-xl'
                  : 'border-transparent bg-white hover:bg-slate-50',
              )}
              onClick={() => setSelectedCustomerId(null)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-[18px] transition-colors',
                    !selectedCustomerId
                      ? 'bg-white/10 text-[#75EEA5]'
                      : 'bg-slate-100 text-slate-400',
                  )}
                >
                  <Users size={20} />
                </div>
                <div>
                  <p
                    className={cn(
                      'text-xs font-black tracking-widest uppercase',
                      !selectedCustomerId ? 'text-white' : 'text-slate-900',
                    )}
                  >
                    Unified Feed
                  </p>
                  <p
                    className={cn(
                      'text-[10px] font-bold',
                      !selectedCustomerId ? 'text-white/50' : 'text-slate-400',
                    )}
                  >
                    Show all active nodes
                  </p>
                </div>
              </div>
            </div>

            {customers.map((customer) => (
              <div
                key={customer.id}
                className={cn(
                  'orders-customer-card group cursor-pointer rounded-[28px] border p-5 transition-all',
                  selectedCustomerId === customer.id
                    ? 'orders-customer-active border-slate-900 bg-slate-900 shadow-2xl'
                    : 'border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30',
                )}
                onClick={() => setSelectedCustomerId(customer.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-[22px] text-lg font-black shadow-inner',
                        selectedCustomerId === customer.id
                          ? 'bg-white text-slate-900'
                          : 'bg-slate-100 text-slate-300',
                      )}
                    >
                      {customer.name.charAt(0)}
                    </div>
                    <div className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-4 border-white bg-emerald-500"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-sm font-black tracking-tighter uppercase italic',
                        selectedCustomerId === customer.id
                          ? 'text-white'
                          : 'text-slate-900',
                      )}
                    >
                      {customer.name}
                    </p>
                    <p
                      className={cn(
                        'truncate text-[9px] font-bold transition-colors',
                        selectedCustomerId === customer.id
                          ? 'text-white/40'
                          : 'text-slate-400',
                      )}
                    >
                      {customer.email}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-200/10 pt-4">
                  <div>
                    <p
                      className={cn(
                        'mb-1 text-[8px] font-black tracking-widest uppercase',
                        selectedCustomerId === customer.id
                          ? 'text-white/40'
                          : 'text-slate-400',
                      )}
                    >
                      Load
                    </p>
                    <p
                      className={cn(
                        'text-xs font-black',
                        selectedCustomerId === customer.id
                          ? 'text-[#75EEA5]'
                          : 'text-slate-900',
                      )}
                    >
                      {customer.orderCount} Orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'mb-1 text-[8px] font-black tracking-widest uppercase',
                        selectedCustomerId === customer.id
                          ? 'text-white/40'
                          : 'text-slate-400',
                      )}
                    >
                      Yield
                    </p>
                    <p
                      className={cn(
                        'text-xs font-black',
                        selectedCustomerId === customer.id
                          ? 'text-white'
                          : 'text-slate-900',
                      )}
                    >
                      ₱{customer.totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 📦 3️⃣ MAIN PANEL — ORDERS TABLE VIEW */}
        <main className="orders-main-panel space-y-8 lg:col-span-9">
          <div className="overflow-hidden rounded-[44px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
            <div className="flex items-center justify-between border-b border-slate-100 p-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase italic">
                  Immutable Payload Ledger
                </h3>
                <p className="mt-1 text-[10px] font-black tracking-[2px] text-slate-400 uppercase italic">
                  {selectedCustomerId
                    ? `Trace: ${customers.find((c) => c.id === selectedCustomerId)?.name}`
                    : 'Trace: Unified Global Registry'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full border border-slate-100 bg-slate-50 px-5 py-2 text-[10px] font-black tracking-[2px] text-slate-500 uppercase">
                  Filter Impact: {filteredOrders.length} Nodes
                </div>
              </div>
            </div>

            <div className="custom-scrollbar overflow-x-auto">
              <table className="orders-table w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Trace ID
                    </th>
                    {!selectedCustomerId && (
                      <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Customer Entity
                      </th>
                    )}
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Payload Items
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Gross Value
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Status Hub
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Entry Epoch
                    </th>
                    <th className="px-8 py-6 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedOrders.map((order) => {
                    const customer = users.find((u) => u.id === order.user_id)
                    return (
                      <React.Fragment key={order.order_id}>
                        <tr className="orders-row group transition-colors hover:bg-slate-50/80">
                          <td className="px-8 py-6 font-mono text-[11px] font-bold text-slate-500">
                            {order.order_id}
                          </td>
                          {!selectedCustomerId && (
                            <td className="px-8 py-6">
                              <p className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                                {customer?.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                {customer?.id}
                              </p>
                            </td>
                          )}
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-900">
                                {order.products.reduce(
                                  (sum, i) => sum + i.quantity,
                                  0,
                                )}
                              </div>
                              <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                {order.products.length} Product Types
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-base font-black tracking-tighter text-slate-900 italic">
                              ₱{order.total_amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="group/status relative flex items-center gap-3">
                              <select
                                disabled={user?.role === 'staff'}
                                className={cn(
                                  'orders-status-dropdown appearance-none rounded-xl border px-4 py-2 pr-8 text-[10px] font-black uppercase transition-all',
                                  user?.role === 'staff'
                                    ? 'cursor-not-allowed opacity-70'
                                    : 'cursor-pointer',
                                  order.status === 'Completed'
                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                    : order.status === 'Pending'
                                      ? 'border-amber-100 bg-amber-50 text-amber-600'
                                      : order.status === 'Processing'
                                        ? 'border-blue-100 bg-blue-50 text-blue-600'
                                        : order.status === 'Cancelled'
                                          ? 'border-rose-100 bg-rose-50 text-rose-600'
                                          : 'border-slate-200 bg-slate-100 text-slate-600',
                                )}
                                value={order.status}
                                onChange={(e) =>
                                  handleUpdateStatus(
                                    order.order_id,
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              <MoreVertical
                                className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-current opacity-30"
                                size={12}
                              />

                              {/* ⚠️ DISPUTE SIGNAL */}
                              {order.complaint && (
                                <div className="animate-pulse">
                                  <AlertTriangle
                                    className="text-rose-500"
                                    size={16}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-xs font-black text-slate-900 italic">
                              {format(
                                parseISO(order.created_at),
                                'MMM dd, yyyy',
                              )}
                            </p>
                            <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                              {format(parseISO(order.created_at), 'hh:mm a')}
                            </p>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button className="orders-action-btn rounded-xl p-3 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900">
                              <ArrowUpDown size={18} />
                            </button>
                          </td>
                        </tr>

                        {/* ⭐ DETAILED PRODUCTION TRACE */}
                        <tr className="bg-slate-50/30">
                          <td
                            colSpan={selectedCustomerId ? 6 : 7}
                            className="px-12 py-8"
                          >
                            <div className="grid grid-cols-1 gap-8 border-l-4 border-slate-900 pl-8 md:grid-cols-2">
                              <div className="space-y-6">
                                <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                                  Payload Breakdown
                                </h4>
                                {order.products.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col gap-3 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm"
                                  >
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-black text-slate-900 uppercase italic">
                                        {item.productName}
                                      </p>
                                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white uppercase">
                                        {item.variant.size}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {item.colors.map((c, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2 py-1"
                                        >
                                          <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: c.hex }}
                                          />
                                          <span className="text-[8px] font-bold text-slate-500 uppercase">
                                            {c.name}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    {item.plate && (
                                      <div className="mt-1 flex items-center gap-2">
                                        <div className="rounded bg-emerald-50 p-1 text-emerald-600">
                                          <Download size={10} />
                                        </div>
                                        <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                                          Plate: {item.plate.name}
                                        </p>
                                      </div>
                                    )}
                                    {item.customRequirements && (
                                      <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                                        <p className="mb-1 text-[8px] font-black tracking-widest text-amber-600 uppercase">
                                          Production Requisition
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-600 italic">
                                          "{item.customRequirements}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-6">
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                                    Financial Synthesis
                                  </h4>
                                  <div className="rounded-[32px] bg-slate-900 p-6 text-white">
                                    <div className="mb-4 flex items-center justify-between">
                                      <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                                        Gross Value
                                      </span>
                                      <span className="text-sm font-black italic">
                                        ₱{order.total_amount.toLocaleString()}
                                      </span>
                                    </div>
                                    {order.discount &&
                                      order.discount.total_discount_amount >
                                        0 && (
                                        <div className="flex items-center justify-between text-emerald-400">
                                          <span className="text-[10px] font-black tracking-widest uppercase">
                                            Loyalty Discount Applied
                                          </span>
                                          <span className="text-sm font-black italic">
                                            -₱
                                            {order.discount.total_discount_amount.toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                </div>

                                {(order.feedback ||
                                  order.complaint ||
                                  (order.rating || 0) > 0) && (
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                                      Customer Audit Logic
                                    </h4>

                                    <div className="rounded-[32px] border border-emerald-100 bg-emerald-50/50 p-6">
                                      <div className="mb-3 flex items-center gap-2">
                                        <RatingStars
                                          rating={order.rating || 0}
                                        />
                                        <span className="ml-auto text-[9px] font-black tracking-widest text-emerald-600 uppercase">
                                          Client Rating
                                        </span>
                                      </div>
                                      <p className="text-xs font-bold text-slate-700 italic">
                                        "
                                        {order.feedback ||
                                          'No textual feedback provided'}
                                        "
                                      </p>
                                    </div>

                                    {order.complaint && (
                                      <div className="relative overflow-hidden rounded-[32px] border border-rose-100 bg-rose-50 p-6">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                          <AlertTriangle
                                            className="text-rose-600"
                                            size={40}
                                          />
                                        </div>
                                        <div className="mb-2 flex items-center gap-2">
                                          <AlertTriangle
                                            className="text-rose-600"
                                            size={14}
                                          />
                                          <span className="text-[9px] font-black tracking-widest text-rose-600 uppercase">
                                            Dispute Signal Detected
                                          </span>
                                        </div>
                                        <p className="text-xs leading-relaxed font-bold text-rose-900 italic">
                                          {order.complaint}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    )
                  })}

                  {paginatedOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="bg-slate-50/20 px-8 py-32 text-center"
                      >
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <ShoppingBag size={48} className="text-slate-400" />
                          <p className="text-sm font-black tracking-widest text-slate-400 uppercase italic">
                            Payload Void Detected
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 📄 PAGINATION */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 p-8">
              <p className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                Transmitting {paginatedOrders.length} of {filteredOrders.length}{' '}
                Load Nodes
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:text-slate-900 disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black transition-all',
                        currentPage === i + 1
                          ? 'bg-slate-900 text-white shadow-xl'
                          : 'border border-slate-200 bg-white text-slate-400 hover:border-slate-400',
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:text-slate-900 disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* 📊 PIE CHART AREA */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-[44px] border border-slate-100 bg-white p-8 shadow-xl">
              <h4 className="mb-8 text-sm font-black text-slate-900 uppercase italic">
                Load Priority Distribution
              </h4>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.statusPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.statusPie.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        fontWeight: 'bold',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {chartData.statusPie.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[44px] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingUp className="text-[#75EEA5]" size={100} />
              </div>
              <div className="relative z-10">
                <h4 className="mb-8 text-sm font-black text-white uppercase italic">
                  Top Yield Entities
                </h4>
                <div className="space-y-6">
                  {customers.slice(0, 3).map((c, idx) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 font-black text-[#75EEA5] italic">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight text-white uppercase italic">
                            {c.name}
                          </p>
                          <p className="text-[9px] font-bold tracking-widest text-white/40 uppercase">
                            {c.orderCount} ACTIVE LOADS
                          </p>
                        </div>
                      </div>
                      <p className="text-base font-black text-[#75EEA5] italic">
                        ₱{c.totalSpent.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-10 border-t border-white/10 pt-8">
                  <p className="text-center text-[9px] font-bold tracking-[4px] text-white/30 uppercase">
                    Load Optimization Metrics Integrated
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Orders
