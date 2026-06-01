import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Users,
  ShoppingBag,
  Star,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MoreVertical,
  Trash2,
  Plus,
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
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { useAdminOrders, type Order, type OrderItem } from '../../hooks/useAdminOrders'
import axiosInstance from '../../lib/axiosInstance'



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




const Orders: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const {
    orders,
    customers,
    orderStatusDistribution,
    isLoading,
    refresh
  } = useAdminOrders()


  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  )
  const [sortOption, setSortOption] = useState('date-desc')


  const [currentPage, setCurrentPage] = useState(1)
  const [statusHeaderFilter, setStatusHeaderFilter] = useState('all')
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1)
  const [customerSearch, setCustomerSearch] = useState('')
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean
    orderId: string
    newStatus: string
  }>({ isOpen: false, orderId: '', newStatus: '' })
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    orderId: string
  }>({ isOpen: false, orderId: '' })
  const [mobileDetailOrder, setMobileDetailOrder] = useState<Order | null>(null)

  const itemsPerPage = 10
  const customersPerPage = 5


  // --- DERIVED STATE / MEMOIZED LOGIC ---
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase())
    )
  }, [customers, customerSearch])

  const paginatedCustomers = useMemo(() => {
    const start = (customerCurrentPage - 1) * customersPerPage
    return filteredCustomers.slice(start, start + customersPerPage)
  }, [filteredCustomers, customerCurrentPage])

  const customerTotalPages = Math.ceil(filteredCustomers.length / customersPerPage)



  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Customer Selection
    if (selectedCustomerId) {
      result = result.filter((o) => o.user_id === selectedCustomerId)
    }

    // Status Header Filter
    if (statusHeaderFilter !== 'all') {
      result = result.filter((o) => o.status?.trim().toUpperCase() === statusHeaderFilter.toUpperCase())
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
          const nameA = customers.find((c) => c.id === a.user_id)?.name || ''
          const nameB = customers.find((c) => c.id === b.user_id)?.name || ''
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
    statusHeaderFilter,
    sortOption,
    customers,
  ])

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(start, start + itemsPerPage)
  }, [filteredOrders, currentPage])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  const stats = useMemo(() => {
    const allOrders = orders || []
    
    // Count only orders specifically marked as "DELIVERED"
    const deliveredCount = allOrders.filter(
      (o) => o.status?.trim().toUpperCase() === 'DELIVERED'
    ).length

    const ratedOrders = allOrders.filter((o) => (o.rating || 0) > 0)
    const avgRating =
      ratedOrders.length > 0
        ? (
            ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) /
            ratedOrders.length
          ).toFixed(1)
        : '0.0'
        
    const volume = allOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

    return {
      completed: deliveredCount,
      avgRating,
      orderVolume: volume,
    }
  }, [orders])

  const chartData = useMemo(() => {
    const statusPie = orderStatusDistribution

    const customerBar = customers.slice(0, 5).map((c) => ({
      name: c.name.split(' ')[0],
      orders: c.orderCount,
    }))

    return { statusPie, customerBar }
  }, [orderStatusDistribution, customers])

  // --- HANDLERS ---
  const handleUpdateStatus = async () => {
    try {
      await axiosInstance.patch(`/api/admin/orders/${statusModal.orderId}/status`, {
        status: statusModal.newStatus.toUpperCase(),
      })
      refresh()
      setStatusModal({ isOpen: false, orderId: '', newStatus: '' })
    } catch (err) {
      console.error('Failed to update status', err)
      alert('Failed to update status')
    }
  }

  const handleDeleteOrder = async () => {
    try {
      await axiosInstance.delete(`/api/admin/orders/${deleteModal.orderId}`)
      refresh()
      setDeleteModal({ isOpen: false, orderId: '' })
    } catch (err) {
      console.error('Failed to delete order', err)
      alert('Failed to delete order')
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }


  return (
    <div className={cn(
      "orders-page animate-in fade-in mx-auto flex max-w-[1700px] flex-col gap-8 px-4 pb-16 duration-500 lg:px-10",
      isLoading && "opacity-50 pointer-events-none"
    )}>
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/50 backdrop-blur-sm">
           <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-900 border-t-emerald-500"></div>
        </div>
      )}
      {/* 🚀 ANALYTICS HEADER */}
      <section className="orders-analytics grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <div className="orders-stats-card group relative overflow-hidden rounded-[24px] bg-slate-900 p-4 sm:p-6 text-white">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
            <ShoppingBag size={80} />
          </div>
          <p className="mb-2 text-[10px] font-black tracking-[3px] uppercase opacity-70">
            Total Orders
          </p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter italic">
            {orders.length}{' '}
            <span className="text-xs font-bold text-[#75EEA5]">Orders</span>
          </h3>
        </div>
        <div className="orders-stats-card group relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
          <p className="mb-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
            Completion Rate
          </p>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900">
              {((stats.completed / (orders.length || 1)) * 100).toFixed(0)}%
            </h3>
            <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
              {stats.completed} Delivered
            </span>
          </div>
        </div>
        <div className="orders-stats-card group relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
          <p className="mb-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
            Satisfaction Quotient
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900">
              {stats.avgRating}
            </h3>
            <RatingStars rating={Math.floor(parseFloat(stats.avgRating))} />
          </div>
        </div>
        <div className="orders-stats-card group relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
          <div className="h-[60px] w-full">
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={chartData.customerBar}>
                <Bar dataKey="orders" fill="#f1f5f9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-center text-[9px] font-bold tracking-widest text-slate-400 uppercase">
            Order Value (₱{stats.orderVolume.toLocaleString()})
          </p>
        </div>
      </section>

      {/* 🛠️ HEADER CONTROLS - Removed main search/filters as requested */}
      <section className="orders-header flex flex-col items-center justify-between gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/40 lg:flex-row">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
             <ShoppingBag className="text-slate-900 shrink-0" size={24} />
             <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900 uppercase italic leading-tight">Order Management System</h2>
          </div>
          <button 
            onClick={() => navigate(selectedCustomerId ? `/admin/orders/manage/${selectedCustomerId}` : '/admin/orders/manage')}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus size={16} />
            <span>Add Order</span>
          </button>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 lg:flex lg:w-auto lg:items-center">
          <select
            className="orders-filter-dropdown w-full cursor-pointer appearance-none rounded-[20px] border border-transparent bg-slate-100 px-4 py-3 md:px-6 md:py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-200 focus:outline-none"
            value={statusHeaderFilter}
            onChange={(e) => setStatusHeaderFilter(e.target.value)}
          >
            <option value="all">Filter: All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="orders-sort-control w-full cursor-pointer appearance-none rounded-[20px] border border-transparent bg-slate-100 px-4 py-3 md:px-6 md:py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-200 focus:outline-none"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >

            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Top Magnitude</option>
            <option value="amount-asc">Low Magnitude</option>
            <option value="name-asc">Customer A-Z</option>
          </select>
        </div>
      </section>


      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* 👤 2️⃣ LEFT PANEL — CUSTOMER LIST */}
        <aside className="orders-customer-sidebar flex h-[800px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/30 lg:col-span-3">
          <div className="border-b border-slate-50 bg-slate-50/50 p-6">
            <h3 className="text-lg font-black text-slate-900 uppercase italic">
              Customer List
            </h3>
            <div className="relative mt-4">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search customers..." 
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-9 text-[10px] font-bold focus:border-emerald-500 focus:outline-none"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setCustomerCurrentPage(1)
                }}
              />
            </div>
          </div>


          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
            <div
              className={cn(
                'orders-customer-card group cursor-pointer rounded-xl border p-4 transition-all mb-4',
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
                    All Customers
                  </p>
                  <p
                    className={cn(
                      'text-[10px] font-bold',
                      !selectedCustomerId ? 'text-white/50' : 'text-slate-400',
                    )}
                  >
                    View all orders
                  </p>
                </div>
              </div>
            </div>


            {paginatedCustomers.map((customer) => (
              <div
                key={customer.id}
                className={cn(
                  'orders-customer-card group cursor-pointer rounded-xl border p-5 transition-all mb-4',
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
                        'flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] shadow-inner',
                        selectedCustomerId === customer.id
                          ? 'bg-white text-slate-900 font-black text-lg'
                          : 'bg-slate-100 text-slate-300 font-black text-lg',
                      )}
                    >
                      {customer.profile_picture ? (
                        <img 
                          src={`/src/assets/profile/${customer.profile_picture}`} 
                          alt="" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <span>{customer.name.charAt(0)}</span>
                      )}
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
                      Orders
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
                      Total Spent
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

          {/* Customer List Pagination */}
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
            <button
              onClick={() => setCustomerCurrentPage(p => Math.max(1, p - 1))}
              disabled={customerCurrentPage === 1}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-black text-slate-500 uppercase">
              {customerCurrentPage} / {customerTotalPages || 1}
            </span>
            <button
              onClick={() => setCustomerCurrentPage(p => Math.min(customerTotalPages, p + 1))}
              disabled={customerCurrentPage === customerTotalPages}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </aside>

        {/* 📦 3️⃣ MAIN PANEL — ORDERS TABLE VIEW */}
        <main className="orders-main-panel space-y-8 lg:col-span-9">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 p-8 gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase italic">
                  Order Details
                </h3>
                <p className="mt-1 text-[10px] font-black tracking-[2px] text-slate-400 uppercase italic">
                  {selectedCustomerId
                    ? `Viewing: ${customers.find((c) => c.id === selectedCustomerId)?.name}`
                    : 'Viewing: All Orders'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full border border-slate-100 bg-slate-50 px-5 py-2 text-[10px] font-black tracking-[2px] text-slate-500 uppercase">
                  Showing {filteredOrders.length} Orders
                </div>
              </div>
            </div>

            {/* 📱 MOBILE VIEW: 2 COLUMN GRID */}
            <div className="grid grid-cols-2 gap-3 p-4 lg:hidden">
              {paginatedOrders.map((order) => {
                const customer = customers.find((c) => c.id === order.user_id)
                return (
                  <motion.div
                    key={order.order_id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMobileDetailOrder(order)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[8px] font-bold text-slate-400">#{order.order_id.slice(-6)}</span>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase italic truncate">
                          {customer?.name || 'Unknown'}
                        </h4>
                      </div>
                      <div className={cn(
                        "rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase shrink-0",
                        order.status?.toUpperCase() === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' :
                        order.status?.toUpperCase() === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                        order.status?.toUpperCase() === 'UNPAID' ? 'bg-slate-100 text-slate-600' :
                        order.status?.toUpperCase() === 'PROCESSING' ? 'bg-blue-50 text-blue-600' :
                        order.status?.toUpperCase() === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                        'bg-slate-50 text-slate-400'
                      )}>
                        {order.status?.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {order.products.slice(0, 2).map((p, i) => (
                          <div key={i} className="h-5 w-5 overflow-hidden rounded-full border border-white bg-slate-100">
                             {p.productImage && <img src={p.productImage} className="h-full w-full object-cover" alt="" />}
                          </div>
                        ))}
                        {order.products.length > 2 && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-slate-900 text-[6px] font-black text-white">
                            +{order.products.length - 2}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-black text-slate-900">₱{order.total_amount.toLocaleString()}</span>
                    </div>

                    <div className="mt-auto border-t border-slate-50 pt-2 flex items-center justify-between">
                       <span className="text-[7px] font-bold text-slate-400">
                          {format(parseISO(order.created_at), 'MMM dd')}
                       </span>
                       <div className="flex gap-0.5">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteModal({ isOpen: true, orderId: order.order_id })
                            }}
                            className="rounded p-1 text-rose-400 hover:bg-rose-50"
                          >
                             <Trash2 size={10} />
                          </button>
                       </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="custom-scrollbar hidden overflow-x-auto lg:block">
              <table className="orders-table w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Order ID
                    </th>
                    {!selectedCustomerId && (
                      <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Customer
                      </th>
                    )}
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Items
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Total Amount
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Status
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Date
                    </th>
                    <th className="px-8 py-6 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedOrders.map((order) => {
                    const customer = customers.find((c) => c.id === order.user_id)
                    const isExpanded = expandedOrderIds.has(order.order_id)
                    return (
                      <React.Fragment key={order.order_id}>
                        <tr 
                          className={cn(
                            "orders-row group transition-colors hover:bg-slate-50/80 cursor-pointer",
                            isExpanded && "bg-slate-50/50"
                          )}
                          onClick={() => toggleOrderExpansion(order.order_id)}
                        >
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
                            <div className="group/status relative flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <div className="relative w-fit">
                                <select
                                  disabled={user?.role === 'staff'}
                                  className={cn(
                                    'orders-status-dropdown appearance-none rounded-xl border px-4 py-2 pr-8 text-[10px] font-black uppercase transition-all',
                                    user?.role === 'staff'
                                      ? 'cursor-not-allowed opacity-70'
                                      : 'cursor-pointer',
                                    order.status?.toUpperCase() === 'DELIVERED'
                                      ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                      : order.status?.toUpperCase() === 'PENDING'
                                        ? 'border-amber-100 bg-amber-50 text-amber-600'
                                        : order.status?.toUpperCase() === 'UNPAID'
                                          ? 'border-slate-300 bg-slate-100 text-slate-600'
                                          : order.status?.toUpperCase() === 'PROCESSING'
                                            ? 'border-blue-100 bg-blue-50 text-blue-600'
                                            : order.status?.toUpperCase() === 'CANCELLED'
                                              ? 'border-rose-100 bg-rose-50 text-rose-600'
                                              : 'border-slate-200 bg-slate-100 text-slate-600',
                                  )}
                                  value={order.status?.toUpperCase()}
                                  onChange={(e) =>
                                    setStatusModal({
                                      isOpen: true,
                                      orderId: order.order_id,
                                      newStatus: e.target.value.toUpperCase(),
                                    })
                                  }
                                >
                                  <option value="UNPAID">Unpaid</option>
                                  <option value="PENDING">Pending</option>
                                  <option value="PROCESSING">Processing</option>
                                  <option value="SHIPPED">Shipped</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                                <MoreVertical
                                  className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-current opacity-30"
                                  size={12}
                                />
                              </div>

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
                            <span className="text-[10px] font-bold text-slate-500">
                              {format(parseISO(order.created_at), 'MMM dd, yyyy')}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => setDeleteModal({ isOpen: true, orderId: order.order_id })}
                                className="orders-action-btn rounded-xl p-3 text-rose-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Order Item Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-slate-50/30 overflow-hidden"
                            >
                              <td
                                colSpan={selectedCustomerId ? 6 : 7}
                                className="px-12 py-8"
                              >
                                <div className="grid grid-cols-1 gap-8 border-l-4 border-slate-900 pl-8 md:grid-cols-2">
                                  {/* Items Side */}
                                  <div className="space-y-6">
                                    <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                                      Items
                                    </h4>
                                    {order.products.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
                                      >
                                        <div className="flex items-start gap-4">
                                          {item.productImage && (
                                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-50">
                                              <img
                                                src={item.productImage}
                                                alt={item.productName}
                                                className="h-full w-full object-cover"
                                              />
                                            </div>
                                          )}
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <h5 className="text-sm font-black text-slate-900 uppercase italic">
                                                  {item.productName}
                                                </h5>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                  PID: {item.productId}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Quantity</p>
                                                <p className="text-xs font-black text-slate-900">Ascending {item.quantity}</p>
                                              </div>
                                            </div>
                                            {item.short_description && (
                                              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
                                                {item.short_description}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                                          <div>
                                            <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Item ID</p>
                                            <p className="font-mono text-[10px] font-bold text-slate-900">{item.id}</p>
                                          </div>
                                          <div>
                                            <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Variant ID</p>
                                            <p className="font-mono text-[10px] font-bold text-slate-900">{item.variant.id}</p>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                                          <div>
                                            <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Created At</p>
                                            <p className="text-[10px] font-bold text-slate-900">
                                              {format(parseISO(item.created_at), 'MMM dd, yyyy HH:mm')}
                                            </p>
                                          </div>
                                          {item.plate && (
                                            <div>
                                              <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Screenplate ID</p>
                                              <p className="font-mono text-[10px] font-bold text-slate-900">{item.plate.id}</p>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
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

                                        {item.customRequirements && (
                                          <div className="mt-2 rounded-xl bg-slate-50 p-4">
                                            <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase mb-1">Production Notes</p>
                                            <p className="text-xs font-bold text-slate-600 italic">"{item.customRequirements}"</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Financial & Feedback Side */}
                                  <div className="space-y-6">
                                    <div className="space-y-4">
                                      <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                                        Financial Synthesis
                                      </h4>
                                      <div className="rounded-xl bg-slate-900 p-8 text-white">
                                        {order.products.map((item, pIdx) => (
                                          <div key={pIdx} className={cn("mb-6 space-y-2 pb-6", pIdx < order.products.length - 1 && "border-b border-white/10")}>
                                            <p className="text-[9px] font-black tracking-[2px] text-emerald-400 uppercase italic">
                                              {item.productName}
                                            </p>
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-bold uppercase opacity-50">Unit Price &times; {item.quantity}</span>
                                              <span className="text-xs font-black italic">₱{(item.variant.unitPrice * item.quantity).toLocaleString()}</span>
                                            </div>
                                            {item.plate && (
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase opacity-50">Plate Printing Setup</span>
                                                <span className="text-xs font-black italic">₱{(item.plate.printPricePerUnit * item.quantity).toLocaleString()}</span>
                                              </div>
                                            )}
                                          </div>
                                        ))}

                                        <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-6">
                                          <span className="text-xs font-black tracking-[3px] uppercase opacity-60">
                                            Gross Value
                                          </span>
                                          <span className="text-xl font-black italic">
                                            ₱{order.total_amount.toLocaleString()}
                                          </span>
                                        </div>
                                        {order.discount &&
                                          order.discount.total_discount_amount > 0 && (
                                          <div className="mt-2 flex items-center justify-between text-emerald-400">
                                            <span className="text-[10px] font-black tracking-widest uppercase">
                                              Loyalty Discount Applied
                                            </span>
                                            <span className="text-sm font-black italic">
                                              -₱{order.discount.total_discount_amount.toLocaleString()}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {(order.feedback || order.complaint || (order.rating || 0) > 0) && (
                                      <div className="space-y-4">
                                        <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                                          Customer Feedback
                                        </h4>
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6">
                                          <div className="mb-3 flex items-center gap-2">
                                            <RatingStars rating={order.rating || 0} />
                                            <span className="ml-auto text-[9px] font-black tracking-widest text-emerald-600 uppercase">
                                              Client Rating
                                            </span>
                                          </div>
                                          <p className="text-xs font-bold text-slate-700 italic">
                                            "{order.feedback || 'No textual feedback provided'}"
                                          </p>
                                        </div>

                                        {order.complaint && (
                                          <div className="relative overflow-hidden rounded-xl border border-rose-100 bg-rose-50 p-6">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                              <AlertTriangle className="text-rose-600" size={40} />
                                            </div>
                                            <div className="mb-2 flex items-center gap-2">
                                              <AlertTriangle className="text-rose-600" size={14} />
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
                            </motion.tr>
                          )}
                        </AnimatePresence>
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
                            No Orders Found
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
                Displaying {paginatedOrders.length} of {filteredOrders.length} Orders
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
            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
              <h4 className="mb-8 text-sm font-black text-slate-900 uppercase italic">
                Order Status Distribution
              </h4>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height={260}>
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

            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingUp className="text-[#75EEA5]" size={100} />
              </div>
              <div className="relative z-10">
                <h4 className="mb-8 text-sm font-black text-white uppercase italic">
                  Top Customers
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
                    Top Customer Performance Summary
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Status Update Confirmation Modal */}
      <AnimatePresence>
        {statusModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-emerald-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-emerald-500 uppercase italic">
                    Status Synchronization
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Apply <span className="text-emerald-500">{statusModal.newStatus}</span> Status?
                </h2>
                <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400 uppercase italic">
                  You are about to update Order <span className="text-slate-900 font-mono">{statusModal.orderId}</span> to the <span className="text-slate-900">{statusModal.newStatus}</span> state. This will notify the customer.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                  className="flex-1 rounded-3xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50"
                >
                  Regress
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className="flex-1 rounded-3xl bg-slate-900 py-5 text-[10px] font-black tracking-widest text-[#75EEA5] uppercase italic shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95"
                >
                  Execute Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Order Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-rose-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-rose-500 uppercase italic">
                    Critical Operation
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Delete Order?
                </h2>
                <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400 uppercase italic">
                  You are about to permanently delete Order <span className="text-slate-900 font-mono">{deleteModal.orderId}</span>. This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                  className="flex-1 rounded-xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrder}
                  className="flex-1 rounded-xl bg-rose-600 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-rose-900/20 transition-all hover:bg-rose-700 hover:scale-105 active:scale-95"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Detail Modal */}
      <AnimatePresence>
        {mobileDetailOrder && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setMobileDetailOrder(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-4xl h-[85vh] sm:h-auto overflow-hidden rounded-t-[32px] sm:rounded-2xl bg-white shadow-2xl flex flex-col"
            >
               <div className="sticky top-0 z-20 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase italic">Order Details</h3>
                    <p className="text-[10px] font-bold text-slate-400">#{mobileDetailOrder.order_id}</p>
                  </div>
                  <button onClick={() => setMobileDetailOrder(null)} className="rounded-full bg-slate-100 p-2 text-slate-400 transition-colors hover:bg-slate-200">
                    <ChevronRight className="rotate-90 sm:rotate-0" size={20} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Items Section (Desktop Duplicate) */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">Items</h4>
                      {mobileDetailOrder.products.map((item: OrderItem, idx: number) => (
                        <div key={idx} className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                          <div className="flex items-start gap-4">
                            {item.productImage && (
                              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-50">
                                <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="text-sm font-black text-slate-900 uppercase italic leading-none">{item.productName}</h5>
                                  <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">PID: {item.productId}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-black tracking-widest text-slate-500">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              {item.short_description && (
                                <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">{item.short_description}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                            <div>
                              <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Variant Details</p>
                              <p className="text-[10px] font-bold text-slate-900">{item.variant.size}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Item ID</p>
                              <p className="font-mono text-[9px] font-bold text-slate-900">{item.id}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {item.colors.map((c, i) => (
                              <div key={i} className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2 py-1">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.hex }} />
                                <span className="text-[8px] font-bold text-slate-500 uppercase">{c.name}</span>
                              </div>
                            ))}
                          </div>

                          {item.customRequirements && (
                             <div className="mt-2 rounded-xl bg-slate-50 p-4 border-l-2 border-slate-900">
                               <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase mb-1 underline">Notes</p>
                               <p className="text-xs font-bold text-slate-600 italic">"{item.customRequirements}"</p>
                             </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Financial Side (Desktop Duplicate) */}
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">Financial Synthesis</h4>
                       <div className="rounded-xl bg-slate-900 p-8 text-white">
                          <div className="space-y-6">
                            {mobileDetailOrder.products.map((item, pIdx) => (
                              <div key={pIdx} className={cn("space-y-2 pb-6", pIdx < mobileDetailOrder.products.length - 1 && "border-b border-white/10")}>
                                <p className="text-[9px] font-black tracking-[2px] text-emerald-400 uppercase italic">{item.productName}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase opacity-50">Unit &times; {item.quantity}</span>
                                  <span className="text-xs font-black italic">₱{(item.variant.unitPrice * item.quantity).toLocaleString()}</span>
                                </div>
                                {item.plate && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase opacity-50">Setup Fee</span>
                                    <span className="text-xs font-black italic">₱{(item.plate.printPricePerUnit * item.quantity).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-6">
                            <span className="text-xs font-black tracking-[3px] uppercase opacity-60">Gross Value</span>
                            <span className="text-xl font-black italic">₱{mobileDetailOrder.total_amount.toLocaleString()}</span>
                          </div>
                          
                          {mobileDetailOrder.discount && mobileDetailOrder.discount.total_discount_amount > 0 && (
                            <div className="mt-2 flex items-center justify-between text-emerald-400">
                              <span className="text-[10px] font-black tracking-widest uppercase">Loyalty Savings</span>
                              <span className="text-sm font-black italic">-₱{mobileDetailOrder.discount.total_discount_amount.toLocaleString()}</span>
                            </div>
                          )}
                       </div>

                       {/* Status Selection for Mobile */}
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">Control Center</h4>
                          <div className="rounded-xl border border-slate-100 bg-white p-6">
                             <p className="mb-4 text-[10px] font-bold text-slate-400 uppercase italic">Update Lifecycle Status</p>
                             <div className="grid grid-cols-2 gap-2">
                                {['UNPAID', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                                   <button
                                     key={s}
                                     onClick={() => setStatusModal({ isOpen: true, orderId: mobileDetailOrder.order_id, newStatus: s })}
                                     className={cn(
                                       "rounded-lg border py-3 text-[9px] font-black uppercase transition-all",
                                       mobileDetailOrder.status?.toUpperCase() === s 
                                         ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                                         : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                     )}
                                   >
                                      {s}
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>

                       {(mobileDetailOrder.feedback || mobileDetailOrder.complaint || (mobileDetailOrder.rating || 0) > 0) && (
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">Customer Sentiment</h4>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6">
                               <div className="mb-3 flex items-center gap-2">
                                  <RatingStars rating={mobileDetailOrder.rating || 0} />
                                  <span className="ml-auto text-[9px] font-black tracking-widest text-emerald-600 uppercase">Rating</span>
                               </div>
                               <p className="text-xs font-bold text-slate-700 italic">"{mobileDetailOrder.feedback || 'No comments'}"</p>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
               </div>
               
               <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50/50">
                  <button 
                    onClick={() => {
                        setDeleteModal({ isOpen: true, orderId: mobileDetailOrder.order_id })
                    }}
                    className="flex-1 rounded-xl bg-rose-600 py-4 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-rose-900/20 transition-all hover:bg-rose-700"
                  >
                    Terminate Order
                  </button>
                  <button 
                    onClick={() => setMobileDetailOrder(null)}
                    className="flex-1 rounded-xl bg-white border border-slate-200 py-4 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-all hover:bg-slate-50"
                  >
                    Dismiss
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Orders
