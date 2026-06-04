import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  AlertCircle,
  MessageSquare,
  Check,
  CheckCircle2,
  ListChecks,
  UserCheck,
  X,
  ShieldAlert,
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
import { m, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useAdminOrders, type Order, type OrderItem } from '../../hooks/useAdminOrders'
import axiosInstance from '../../lib/axiosInstance'
import { useDebounce } from '../../hooks/useDebounce'

interface Employee {
  id: string
  name: string
  role: string
  profile_picture: string | null
  allowed_categories: string[]
  allowed_products: string[]
}



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
  const isAdmin = user?.role === 'admin'
  
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
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSuccessModal, setDeleteSuccessModal] = useState<{ isOpen: boolean; orderId: string }>({ isOpen: false, orderId: '' })
  const [statusResultModal, setStatusResultModal] = useState<{
    isOpen: boolean
    orderId: string
    status: string
    isSuccess: boolean
    errorMessage?: string
  }>({ isOpen: false, orderId: '', status: '', isSuccess: true })
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean
    orderId: string
    message: string
    isSubmitting: boolean
  }>({ isOpen: false, orderId: '', message: '', isSubmitting: false })
  const [concernModal, setConcernModal] = useState<{
    isOpen: boolean
    orderId: string
    concernText: string
  }>({ isOpen: false, orderId: '', concernText: '' })
  const [mobileDetailOrder, setMobileDetailOrder] = useState<Order | null>(null)

  // Long-press detection for mobile card selection
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressActive = useRef(false)

  const handleTouchStart = (orderId: string) => {
    longPressActive.current = false
    longPressTimeout.current = setTimeout(() => {
      longPressActive.current = true
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      setSelectedOrderIds(prev => {
        const next = new Set(prev)
        if (next.has(orderId)) next.delete(orderId)
        else next.add(orderId)
        return next
      })
      toast.success(`Selected order #${orderId.slice(-6)}`, { id: `mobile-select-${orderId}` })
    }, 600)
  }

  const handleTouchEnd = (order: Order, e: React.TouchEvent) => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
    if (longPressActive.current) {
      e.preventDefault()
      e.stopPropagation()
    } else {
      setMobileDetailOrder(order)
    }
  }

  const handleTouchMove = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
  }

  const handleMouseDown = (orderId: string) => {
    longPressActive.current = false
    longPressTimeout.current = setTimeout(() => {
      longPressActive.current = true
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      setSelectedOrderIds(prev => {
        const next = new Set(prev)
        if (next.has(orderId)) next.delete(orderId)
        else next.add(orderId)
        return next
      })
      toast.success(`Selected order #${orderId.slice(-6)}`, { id: `mobile-select-${orderId}` })
    }, 600)
  }

  const handleMouseUp = (order: Order, e: React.MouseEvent) => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
    if (longPressActive.current) {
      e.preventDefault()
      e.stopPropagation()
    } else {
      setMobileDetailOrder(order)
    }
  }

  const handleMouseLeave = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
  }

  // --- QUEUE & EMPLOYEE STATE ---
  interface QueuePreviewOrder {
    order_id: string;
    user_id: string;
    customer_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    task_status?: 'COMPLETED' | 'NOT_COMPLETED';
    requested_at?: string;
    products: {
      productId: string;
      productName: string;
      quantity: number;
    }[];
  }

  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  // queueAssignments: { [orderId]: employeeId[] }
  const [queueAssignments, setQueueAssignments] = useState<Record<string, string[]>>({})
  const [queueModal, setQueueModal] = useState(false)
  const [queueEmployeeIds, setQueueEmployeeIds] = useState<Set<string>>(new Set())
  const [isSubmittingQueue, setIsSubmittingQueue] = useState(false)
  // Employee sidebar selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [employeeQueuePreview, setEmployeeQueuePreview] = useState<{
    pending_orders: QueuePreviewOrder[]
    production_orders: QueuePreviewOrder[]
  }>({ pending_orders: [], production_orders: [] })
  const [isLoadingEmployeeQueue, setIsLoadingEmployeeQueue] = useState(false)
  
  // Modal pagination & search
  const [modalEmployeeSearch, setModalEmployeeSearch] = useState('')
  const [modalEmployeePage, setModalEmployeePage] = useState(1)

  const location = useLocation()
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const searchOrderId = queryParams.get('search') || queryParams.get('id') || ''

  const [orderSearch, setOrderSearch] = useState(searchOrderId)
  const [prevSearchOrderId, setPrevSearchOrderId] = useState(searchOrderId)

  // Fetch employees (staff + technician) and queue assignments on mount
  const fetchEmployeesAndQueue = useCallback(async () => {
    try {
      const [accountsRes, queueRes] = await Promise.all([
        axiosInstance.get('/api/admin/accounts'),
        axiosInstance.get('/api/admin/orders/queue-assignments'),
      ])
      const allAccounts: Array<{
        id: string; name: string; role: string; type: string;
        profile_picture: string | null;
        allowed_categories: string[];
        allowed_products: string[];
      }> = accountsRes.data?.data || []
      setEmployees(
        allAccounts.filter(a => a.type === 'employee' && ['staff', 'technician'].includes(a.role))
      )
      setQueueAssignments(queueRes.data || {})
    } catch (err) {
      console.error('Failed to fetch employees/queue', err)
    }
  }, [])

  useEffect(() => {
    fetchEmployeesAndQueue()
  }, [fetchEmployeesAndQueue])

  if (searchOrderId !== prevSearchOrderId) {
    setOrderSearch(searchOrderId)
    setExpandedOrderIds(new Set([searchOrderId]))
    setPrevSearchOrderId(searchOrderId)
  }

  const debouncedCustomerSearch = useDebounce(customerSearch, 300)
  const debouncedOrderSearch = useDebounce(orderSearch, 300)

  const itemsPerPage = 10
  const customersPerPage = 5


  // --- DERIVED STATE / MEMOIZED LOGIC ---
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(debouncedCustomerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(debouncedCustomerSearch.toLowerCase())
    )
  }, [customers, debouncedCustomerSearch])

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

    // Order Search ID/Items/Company/Customer Filter
    if (debouncedOrderSearch.trim()) {
      const q = debouncedOrderSearch.toLowerCase().trim()
      result = result.filter((o) => {
        const customer = customers.find((c) => c.id === o.user_id)
        
        // Search by order ID
        const matchOrderId = o.order_id.toLowerCase().includes(q)
        
        // Search by customer name
        const matchCustomerName = customer ? customer.name.toLowerCase().includes(q) : false
        
        // Search by customer email
        const matchCustomerEmail = customer ? customer.email.toLowerCase().includes(q) : false
        
        // Search by customer company name
        const matchCompanyName = customer?.company_name ? customer.company_name.toLowerCase().includes(q) : false
        
        // Search by order items (product names)
        const matchOrderItems = o.products.some((p) => p.productName.toLowerCase().includes(q))
        
        return matchOrderId || matchCustomerName || matchCustomerEmail || matchCompanyName || matchOrderItems
      })
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
    debouncedOrderSearch,
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
    const targetOrderId = statusModal.orderId
    const targetStatus = statusModal.newStatus
    try {
      await axiosInstance.patch(`/api/admin/orders/${targetOrderId}/status`, {
        status: targetStatus.toUpperCase(),
      })
      refresh()
      setStatusModal({ isOpen: false, orderId: '', newStatus: '' })
      setStatusResultModal({
        isOpen: true,
        orderId: targetOrderId,
        status: targetStatus,
        isSuccess: true
      })
    } catch (err: unknown) {
      console.error('Failed to update status', err)
      const error = err as { response?: { data?: { message?: string } } }
      const errMsg = error.response?.data?.message || 'Failed to update order status'
      setStatusModal({ isOpen: false, orderId: '', newStatus: '' })
      setStatusResultModal({
        isOpen: true,
        orderId: targetOrderId,
        status: targetStatus,
        isSuccess: false,
        errorMessage: errMsg
      })
    }
  }

  const handleDeleteOrder = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Password is required to delete an order')
      return
    }
    try {
      await axiosInstance.delete(`/api/admin/orders/${deleteModal.orderId}`, {
        data: { password: deletePassword }
      })
      refresh()
      const deletedOrderId = deleteModal.orderId
      setDeleteModal({ isOpen: false, orderId: '' })
      setDeletePassword('')
      setDeleteError(null)
      setDeleteSuccessModal({ isOpen: true, orderId: deletedOrderId })
    } catch (err: unknown) {
      console.error('Failed to delete order', err)
      const error = err as { response?: { data?: { message?: string } } }
      const errorMsg = error.response?.data?.message || 'Failed to delete order'
      setDeleteError(errorMsg)
    }
  }

  const handleSendMessage = async () => {
    if (!messageModal.message.trim()) return
    setMessageModal((prev) => ({ ...prev, isSubmitting: true }))
    try {
      await axiosInstance.post('/api/messages/send', {
        message: messageModal.message,
        receiver_id: '1',
        receiver_type: 'employee',
        order_id: messageModal.orderId,
      })
      toast.success('Message sent to admin successfully')
      setMessageModal({
        isOpen: false,
        orderId: '',
        message: '',
        isSubmitting: false,
      })
    } catch (err) {
      console.error('Failed to send message', err)
      toast.error('Failed to send message')
      setMessageModal((prev) => ({ ...prev, isSubmitting: false }))
    }
  }

  const handleCreateProductConcern = async (orderId: string) => {
    try {
      await axiosInstance.post('/api/messages/send', {
        message: `Product concern for order ${orderId}. Please review.`,
        receiver_id: '1',  // Admin ID
        receiver_type: 'employee',
        order_id: orderId,
        product_concern: true,
      })
      toast.success('Product concern message created')
    } catch (error) {
      console.error('Failed to create message', error)
      toast.error('Failed to create message')
    }
  }

  const handleCreateProductConcernConfirm = async () => {
    if (!concernModal.orderId || !concernModal.concernText.trim()) return
    try {
      await axiosInstance.post('/api/messages/send', {
        message: concernModal.concernText.trim(),
        receiver_id: '1',  // Admin ID
        receiver_type: 'employee',
        order_id: concernModal.orderId,
        product_concern: true,
      })
      toast.success('Product concern message created')
      setConcernModal({ isOpen: false, orderId: '', concernText: '' })
    } catch (error) {
      console.error('Failed to create message', error)
      toast.error('Failed to create message')
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

  // Toggle order selection for queue (only pending orders)
  const toggleOrderSelection = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedOrderIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  // Select all pending orders on current page
  const toggleSelectAllPending = () => {
    const pendingOnPage = paginatedOrders.filter(o => o.status?.toUpperCase() === 'PENDING').map(o => o.order_id)
    const allSelected = pendingOnPage.every(id => selectedOrderIds.has(id))
    setSelectedOrderIds(prev => {
      const next = new Set(prev)
      if (allSelected) pendingOnPage.forEach(id => next.delete(id))
      else pendingOnPage.forEach(id => next.add(id))
      return next
    })
  }

  // Handle assigning selected orders to employee queue
  const handleAssignQueue = async () => {
    if (selectedOrderIds.size === 0 || queueEmployeeIds.size === 0) return
    setIsSubmittingQueue(true)
    try {
      await axiosInstance.post('/api/admin/orders/assign-queue', {
        order_ids: Array.from(selectedOrderIds),
        employee_ids: Array.from(queueEmployeeIds),
      })
      toast.success(`Assigned ${selectedOrderIds.size} order(s) to ${queueEmployeeIds.size} employee(s)`)
      setQueueModal(false)
      setSelectedOrderIds(new Set())
      setQueueEmployeeIds(new Set())
      fetchEmployeesAndQueue() // refresh queue assignments
    } catch (err) {
      console.error('Queue assign failed', err)
      toast.error('Failed to assign queue')
    } finally {
      setIsSubmittingQueue(false)
    }
  }

  // Fetch the queue view for selected employee (orders visible in their LiveQueue)
  const fetchEmployeeQueue = useCallback(async (empId: string) => {
    setIsLoadingEmployeeQueue(true)
    try {
      const response = await axiosInstance.get(`/api/admin/employees/${empId}/live-queue-preview`)
      setEmployeeQueuePreview({
        pending_orders: response.data.pending_orders || [],
        production_orders: response.data.production_orders || []
      })
    } catch (err) {
      console.error('Failed to fetch live queue preview', err)
      setEmployeeQueuePreview({ pending_orders: [], production_orders: [] })
    } finally {
      setIsLoadingEmployeeQueue(false)
    }
  }, [])

  useEffect(() => {
    if (selectedEmployeeId) fetchEmployeeQueue(selectedEmployeeId)
    else setEmployeeQueuePreview({ pending_orders: [], production_orders: [] })
  }, [selectedEmployeeId, fetchEmployeeQueue])



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
          {user?.role !== 'inventory' && (
            <button 
              onClick={() => navigate(selectedCustomerId ? `/admin/orders/manage/${selectedCustomerId}` : '/admin/orders/manage')}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Plus size={16} />
              <span>Add Order</span>
            </button>
          )}
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
            <option value="REFUND">Refund</option>
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
        {/* 👤 Stacked Sidebar Column */}
        <div className="lg:col-span-3 flex flex-col gap-8 w-full">
          {/* 👤 2️⃣ LEFT PANEL — CUSTOMER LIST */}
          <aside className="orders-customer-sidebar flex h-[800px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/30 w-full">
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

          {/* 👷 EMPLOYEE LIST PANEL — below customer sidebar */}
          {user?.role === 'admin' ? (
            <aside className="rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/30 overflow-hidden w-full">
              <div className="border-b border-slate-50 bg-slate-50/50 p-6">
                <div className="flex items-center gap-3">
                  <UserCheck size={18} className="text-violet-600 shrink-0" />
                  <h3 className="text-base font-black text-slate-900 uppercase italic">Employee List</h3>
                </div>
                <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select to view their live queue</p>
              </div>
              <div className="custom-scrollbar max-h-[400px] overflow-y-auto p-4 space-y-2">
                {employees.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center opacity-40">
                    <Users size={28} className="text-slate-400" />
                    <p className="text-[10px] font-black text-slate-400 uppercase">No employees found</p>
                  </div>
                ) : (
                  employees.map(emp => {
                    const isSelectedEmp = selectedEmployeeId === emp.id
                    const empQueueCount = Object.entries(queueAssignments).filter(([orderId, ids]) => {
                      if (!ids.includes(emp.id)) return false
                      const order = orders.find(o => o.order_id === orderId)
                      return order?.status?.toUpperCase() === 'PENDING'
                    }).length
                    return (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(isSelectedEmp ? null : emp.id)}
                        className={cn(
                          'cursor-pointer rounded-xl border p-4 transition-all',
                          isSelectedEmp
                            ? 'border-violet-300 bg-violet-600 shadow-lg shadow-violet-500/20'
                            : 'border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/30'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm shrink-0',
                            isSelectedEmp ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          )}>
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'truncate text-xs font-black uppercase italic',
                              isSelectedEmp ? 'text-white' : 'text-slate-900'
                            )}>{emp.name}</p>
                            <p className={cn(
                              'text-[9px] font-bold uppercase tracking-wider',
                              isSelectedEmp ? 'text-white/60' : 'text-slate-400'
                            )}>{emp.role}</p>
                          </div>
                          {empQueueCount > 0 && (
                            <span className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black',
                              isSelectedEmp ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'
                            )}>
                              {empQueueCount}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </aside>
          ) : (
            <aside className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/30 overflow-hidden w-full">
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <ShieldAlert size={32} className="text-rose-500 animate-pulse" />
                <h4 className="text-xs font-black text-rose-500 uppercase italic">Unauthorized</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed max-w-[200px]">
                  Only administrators can access employee queue metrics.
                </p>
              </div>
            </aside>
          )}
        </div>

        {/* 📦 3️⃣ MAIN PANEL — ORDERS TABLE VIEW */}
        <main className="orders-main-panel space-y-8 lg:col-span-9">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 p-4 md:p-8 gap-4">
              {/* Header Title Section with flex alignment and icon */}
              <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 md:bg-transparent md:h-auto md:w-auto md:text-slate-900">
                    <ShoppingBag size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-lg font-black text-slate-900 uppercase italic leading-none">
                      <span className="hidden md:inline">Order Details</span>
                      <span className="md:hidden">Orders</span>
                    </h3>
                    <p className="mt-1.5 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      {selectedCustomerId
                        ? `${customers.find((c) => c.id === selectedCustomerId)?.name.split(' ')[0]}'s`
                        : 'All Orders'}
                    </p>
                  </div>
                </div>

                {/* Mobile-only actions and info badges */}
                <div className="flex items-center gap-2 md:hidden">
                  <div className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[8px] font-black text-slate-500 uppercase">
                    {filteredOrders.length}
                  </div>
                  {selectedOrderIds.size > 0 && isAdmin && (
                    <button
                      onClick={() => setQueueModal(true)}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[8px] font-black text-white uppercase shadow-md shadow-violet-500/20"
                    >
                      <ListChecks size={10} />
                      Queue ({selectedOrderIds.size})
                    </button>
                  )}
                </div>
              </div>

              {/* Search bar and desktop-only actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-60">
                  <input
                    type="text"
                    placeholder="Search order ID, items..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 pl-9 text-[10px] font-black tracking-widest uppercase shadow-sm outline-none focus:border-amber-400 focus:bg-white transition-colors"
                  />
                  <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={12} />
                </div>
                
                {/* Desktop-only info and queue button */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="rounded-full border border-slate-100 bg-slate-50 px-5 py-2 text-[10px] font-black tracking-[2px] text-slate-500 uppercase">
                    Showing {filteredOrders.length} Orders
                  </div>
                  {selectedOrderIds.size > 0 && isAdmin && (
                    <button
                      onClick={() => setQueueModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-700 hover:scale-105 active:scale-95"
                    >
                      <ListChecks size={14} />
                      Add {selectedOrderIds.size} to Queue
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 📱 MOBILE VIEW: 2 COLUMN GRID */}
            <div className="grid grid-cols-2 gap-3 p-4 lg:hidden">
              {paginatedOrders.map((order) => {
                const customer = customers.find((c) => c.id === order.user_id)
                const isSelected = selectedOrderIds.has(order.order_id)
                const isPending = order.status?.toUpperCase() === 'PENDING'
                const isSelectable = isAdmin && isPending

                const longPressHandlers = isSelectable
                  ? {
                      onTouchStart: () => handleTouchStart(order.order_id),
                      onTouchEnd: (e: React.TouchEvent) => handleTouchEnd(order, e),
                      onTouchMove: handleTouchMove,
                      onMouseDown: () => handleMouseDown(order.order_id),
                      onMouseUp: (e: React.MouseEvent) => handleMouseUp(order, e),
                      onMouseLeave: handleMouseLeave,
                    }
                  : {
                      onClick: () => setMobileDetailOrder(order),
                    }

                return (
                  <m.div
                    key={order.order_id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    {...longPressHandlers}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-xl border p-3 shadow-sm transition-all hover:shadow-md cursor-pointer",
                      isSelected
                        ? "border-violet-500 bg-violet-50/20 shadow-md shadow-violet-500/10"
                        : "border-slate-100 bg-white"
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[8px] font-bold text-slate-400">#{order.order_id.slice(-6)}</span>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase italic truncate">
                          {customer?.name || 'Unknown'}
                        </h4>
                      </div>
                      {isSelected ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm shrink-0">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                      ) : (
                        <div className={cn(
                          "rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase shrink-0",
                          order.status?.toUpperCase() === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' :
                          order.status?.toUpperCase() === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                          order.status?.toUpperCase() === 'UNPAID' ? 'bg-slate-100 text-slate-600' :
                          order.status?.toUpperCase() === 'PROCESSING' ? 'bg-blue-50 text-blue-600' :
                          order.status?.toUpperCase() === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                          order.status?.toUpperCase() === 'REFUND' ? 'bg-purple-50 text-purple-600' :
                          'bg-slate-50 text-slate-400'
                        )}>
                          {order.status?.toUpperCase()}
                        </div>
                      )}
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
                          {user?.role === 'inventory' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCreateProductConcern(order.order_id)
                              }}
                              className="flex items-center gap-1.5 rounded-xl p-1.5 text-[8px] font-black tracking-widest text-amber-600 uppercase transition-colors hover:bg-amber-50"
                              title="Create Product Concern Message"
                            >
                              <AlertCircle size={10} className="text-amber-400" />
                              Message
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteModal({ isOpen: true, orderId: order.order_id })
                              }}
                              className="rounded p-1 text-rose-400 hover:bg-rose-50"
                            >
                               <Trash2 size={10} />
                            </button>
                          )}
                       </div>
                    </div>
                  </m.div>
                )
              })}
            </div>

            <div className="custom-scrollbar hidden overflow-x-auto lg:block">
              <table className="orders-table w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {user?.role === 'admin' && (
                      <th className="px-4 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {/* Select All Pending Checkbox */}
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={paginatedOrders.filter(o => o.status?.toUpperCase() === 'PENDING').length > 0 &&
                              paginatedOrders.filter(o => o.status?.toUpperCase() === 'PENDING').every(o => selectedOrderIds.has(o.order_id))}
                            onChange={toggleSelectAllPending}
                            className="h-4 w-4 cursor-pointer rounded accent-violet-600"
                            title="Select all pending"
                          />
                        </div>
                      </th>
                    )}
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
                    {user?.role === 'admin' && (
                      <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Queue
                      </th>
                    )}
                    <th className="px-8 py-6 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedOrders.map((order) => {
                    const customer = customers.find((c) => c.id === order.user_id)
                    const isExpanded = expandedOrderIds.has(order.order_id)
                    const isPending = order.status?.toUpperCase() === 'PENDING'
                    const isSelected = selectedOrderIds.has(order.order_id)
                    const assignedEmpIds = queueAssignments[order.order_id] || []
                    const assignedEmps = assignedEmpIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[]
                    return (
                      <React.Fragment key={order.order_id}>
                        <tr 
                          className={cn(
                            "orders-row group transition-colors hover:bg-slate-50/80 cursor-pointer",
                            isExpanded && "bg-slate-50/50",
                            isSelected && "bg-violet-50/40"
                          )}
                          onClick={() => toggleOrderExpansion(order.order_id)}
                        >
                          {/* Queue Checkbox */}
                          {user?.role === 'admin' && (
                            <td className="px-4 py-6" onClick={e => e.stopPropagation()}>
                              {isPending && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  onClick={(e) => toggleOrderSelection(order.order_id, e)}
                                  className="h-4 w-4 cursor-pointer rounded accent-violet-600"
                                />
                              )}
                            </td>
                          )}
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
                                  disabled={['staff', 'inventory'].includes(user?.role || '')}
                                  className={cn(
                                    'orders-status-dropdown appearance-none rounded-xl border px-4 py-2 pr-8 text-[10px] font-black uppercase transition-all',
                                    ['staff', 'inventory'].includes(user?.role || '')
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
                                              : order.status?.toUpperCase() === 'REFUND'
                                                ? 'border-purple-100 bg-purple-50 text-purple-600'
                                                : 'border-slate-200 bg-slate-100 text-slate-600',
                                  )}
                                  value={order.status?.toUpperCase()}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value.toUpperCase()
                                    if (nextStatus === 'REFUND') {
                                      navigate(`/admin/refund?customer_id=${order.user_id}&order_id=${order.order_id}`)
                                    } else {
                                      setStatusModal({
                                        isOpen: true,
                                        orderId: order.order_id,
                                        newStatus: nextStatus,
                                      })
                                    }
                                  }}
                                >
                                  <option value="UNPAID">Unpaid</option>
                                  <option value="PENDING">Pending</option>
                                  <option value="PROCESSING">Processing</option>
                                  <option value="SHIPPED">Shipped</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="CANCELLED">Cancelled</option>
                                  <option value="REFUND">Refund</option>
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
                          {/* Queue Assignments Column */}
                          {user?.role === 'admin' && (
                            <td className="px-4 py-6" onClick={e => e.stopPropagation()}>
                              {assignedEmps.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {assignedEmps.map(emp => (
                                    <span key={emp.id} className="inline-flex items-center gap-1 rounded-lg bg-violet-50 border border-violet-100 px-2 py-0.5 text-[8px] font-black tracking-wider text-violet-700 uppercase">
                                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                                      {emp.name.split(' ')[0]}
                                    </span>
                                  ))}
                                </div>
                              ) : isPending ? (
                                <span className="text-[9px] font-bold text-slate-300 italic">Unassigned</span>
                              ) : null}
                            </td>
                          )}
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              {user?.role === 'admin' ? (
                                <button 
                                  onClick={() => setDeleteModal({ isOpen: true, orderId: order.order_id })}
                                  className="orders-action-btn rounded-xl p-3 text-rose-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                                  title="Delete Order"
                                >
                                  <Trash2 size={18} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setConcernModal({
                                      isOpen: true,
                                      orderId: order.order_id,
                                      concernText: '',
                                    })
                                  }}
                                  className="orders-action-btn rounded-xl p-3 text-amber-400 transition-all hover:bg-amber-50 hover:text-amber-600"
                                  title="Create Product Concern Message"
                                >
                                  <MessageSquare size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Order Item Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <m.tr 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-slate-50/30 overflow-hidden"
                            >
                              <td
                                colSpan={selectedCustomerId ? 8 : 9}
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
                            </m.tr>
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
                {selectedOrderIds.size > 0 && (
                  <span className="ml-3 text-violet-600">· {selectedOrderIds.size} selected</span>
                )}
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

          {/* 👷 EMPLOYEE QUEUE SECTION — shown when an employee is selected */}
          {selectedEmployeeId && (() => {
            const emp = employees.find(e => e.id === selectedEmployeeId)
            
            if (user?.role !== 'admin') {
              return (
                <div className="rounded-2xl border border-rose-100 bg-white p-8 shadow-xl text-center">
                  <ShieldAlert size={36} className="mx-auto text-rose-500 mb-2 animate-bounce" />
                  <h4 className="text-sm font-black text-rose-500 uppercase italic">Unauthorized</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Only administrators can view employee live production queues.
                  </p>
                </div>
              )
            }

            return (
              <div className="rounded-2xl border border-violet-100 bg-white shadow-xl overflow-hidden">
                <div className="flex items-center gap-4 border-b border-violet-50 bg-violet-50/40 p-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <UserCheck size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900 uppercase italic">
                      {emp?.name}'s Live Queue
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Orders pending execution visible to this employee
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEmployeeId(null)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-violet-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                {isLoadingEmployeeQueue ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {/* Section 1: Pending Execution */}
                    <div className="bg-violet-50/20 p-4 border-b border-violet-50">
                      <h5 className="text-[10px] font-black tracking-widest text-violet-600 uppercase mb-4">
                        Orders Pending Execution ({employeeQueuePreview.pending_orders.length})
                      </h5>
                      {employeeQueuePreview.pending_orders.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic font-bold py-4 text-center">No pending orders assigned.</p>
                      ) : (
                        <div className="custom-scrollbar overflow-x-auto rounded-xl border border-violet-100 bg-white">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="border-b border-violet-50 bg-violet-50/30">
                                <th className="px-6 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">Order ID</th>
                                <th className="px-6 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">Customer</th>
                                <th className="px-6 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">Products</th>
                                <th className="px-6 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">Amount</th>
                                <th className="px-6 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">Date</th>
                                <th className="px-6 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">Clear</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-violet-50/50">
                              {employeeQueuePreview.pending_orders.map(order => {
                                const cust = customers.find(c => c.id === order.user_id || c.id === order.customer_id)
                                return (
                                  <tr key={order.order_id} className="hover:bg-violet-50/20 transition-colors">
                                    <td className="px-6 py-3 font-mono text-[10px] font-bold text-slate-500">{order.order_id}</td>
                                    <td className="px-6 py-3">
                                      <p className="text-[10px] font-black text-slate-900 uppercase italic">{cust?.name ?? order.user_id}</p>
                                    </td>
                                    <td className="px-6 py-3">
                                      <div className="flex flex-col gap-0.5">
                                        {order.products.slice(0, 2).map((p, i: number) => (
                                          <span key={i} className="text-[9px] font-bold text-slate-500 uppercase">{p.productName}</span>
                                        ))}
                                        {order.products.length > 2 && <span className="text-[8px] text-slate-400">+{order.products.length - 2} more</span>}
                                      </div>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className="text-xs font-black text-emerald-600 italic">₱{order.total_amount.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className="text-[9px] font-bold text-slate-400">{format(parseISO(order.created_at), 'MMM dd, yyyy')}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                      <button
                                        onClick={async () => {
                                          try {
                                            await axiosInstance.delete(`/api/admin/orders/${order.order_id}/queue-assignments/${selectedEmployeeId}`)
                                            if (selectedEmployeeId) fetchEmployeeQueue(selectedEmployeeId)
                                            fetchEmployeesAndQueue()
                                            toast.success('Removed from queue')
                                          } catch {
                                            toast.error('Failed to remove from queue')
                                          }
                                        }}
                                        className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 transition-colors"
                                        title="Remove from queue"
                                      >
                                        <X size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Production Registry Log */}
                    <div className="p-4 bg-slate-50/30">
                      <h5 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4">
                        Production Registry Log ({employeeQueuePreview.production_orders.length})
                      </h5>
                      {employeeQueuePreview.production_orders.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic font-bold py-4 text-center">No production logs.</p>
                      ) : (
                        <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-100 bg-white">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="px-6 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">Order ID</th>
                                <th className="px-6 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">Requested</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {employeeQueuePreview.production_orders.map(order => (
                                <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-3 font-mono text-[10px] font-bold text-slate-500">{order.order_id}</td>
                                  <td className="px-6 py-3">
                                    <span className={cn(
                                      "rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase",
                                      order.task_status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                    )}>
                                      {order.task_status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3">
                                    <span className="text-[9px] font-bold text-slate-400">
                                      {order.requested_at ? format(parseISO(order.requested_at), 'MMM dd, yyyy h:mm a') : '—'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </main>
      </div>
      {/* ➕ Add to Queue Modal */}
      <AnimatePresence>
        {queueModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => !isSubmittingQueue && setQueueModal(false)}
            />
            <m.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-violet-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-violet-500 uppercase italic">
                    Queue Assignment
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Add to Queue
                </h2>
                <p className="mt-2 text-xs font-bold leading-relaxed text-slate-400 uppercase italic">
                  Select which employee(s) will see the{' '}
                  <span className="text-violet-600">{selectedOrderIds.size}</span> selected pending order(s) in their LiveQueue.
                </p>
              </div>

              {/* Selected Orders Preview */}
              <div className="mb-6 rounded-2xl bg-violet-50 border border-violet-100 p-4 max-h-[100px] overflow-y-auto custom-scrollbar">
                <p className="mb-2 text-[8px] font-black tracking-widest text-violet-500 uppercase">Selected Orders</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedOrderIds).map(id => (
                    <span key={id} className="rounded-lg bg-white border border-violet-200 px-2 py-0.5 font-mono text-[9px] font-bold text-violet-700">
                      {id}
                    </span>
                  ))}
                </div>
              </div>

              {/* Employee Multi-Select with Search & Pagination */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    Assign to Employee(s)
                  </p>
                  <p className="text-[9px] font-black tracking-widest text-violet-500 uppercase">
                    {queueEmployeeIds.size} Selected
                  </p>
                </div>
                
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search employee name or role..."
                    value={modalEmployeeSearch}
                    onChange={(e) => {
                      setModalEmployeeSearch(e.target.value)
                      setModalEmployeePage(1)
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-[10px] font-black tracking-widest uppercase shadow-sm outline-none focus:border-violet-400 focus:bg-white transition-colors"
                  />
                  <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={14} />
                </div>

                <div className="space-y-2 mb-4">
                  {(() => {
                    const filtered = employees.filter(emp => 
                      emp.name.toLowerCase().includes(modalEmployeeSearch.toLowerCase()) || 
                      emp.role.toLowerCase().includes(modalEmployeeSearch.toLowerCase())
                    )
                    const itemsPerPage = 4
                    const totalPages = Math.ceil(filtered.length / itemsPerPage)
                    const paginated = filtered.slice((modalEmployeePage - 1) * itemsPerPage, modalEmployeePage * itemsPerPage)

                    return (
                      <>
                        {paginated.length === 0 ? (
                          <div className="py-6 text-center text-[10px] font-bold text-slate-400 italic">No employees found.</div>
                        ) : (
                          paginated.map(emp => {
                            const isChecked = queueEmployeeIds.has(emp.id)
                            return (
                              <label
                                key={emp.id}
                                className={cn(
                                  'flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all',
                                  isChecked
                                    ? 'border-violet-300 bg-violet-50 shadow-sm'
                                    : 'border-slate-100 bg-slate-50/50 hover:border-violet-200 hover:bg-violet-50/30'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setQueueEmployeeIds(prev => {
                                      const next = new Set(prev)
                                      if (next.has(emp.id)) next.delete(emp.id)
                                      else next.add(emp.id)
                                      return next
                                    })
                                  }}
                                  className="h-4 w-4 cursor-pointer accent-violet-600"
                                />
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 font-black text-sm text-violet-700 shrink-0">
                                  {emp.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-slate-900 uppercase italic truncate">{emp.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{emp.role}</p>
                                </div>
                                {isChecked && (
                                  <CheckCircle2 size={16} className="text-violet-600 shrink-0" />
                                )}
                              </label>
                            )
                          })
                        )}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => setModalEmployeePage(p => Math.max(1, p - 1))}
                              disabled={modalEmployeePage === 1}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="text-[9px] font-black text-slate-400 uppercase">
                              Page {modalEmployeePage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setModalEmployeePage(p => Math.min(totalPages, p + 1))}
                              disabled={modalEmployeePage === totalPages}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => { setQueueModal(false); setQueueEmployeeIds(new Set()) }}
                  disabled={isSubmittingQueue}
                  className="flex-1 rounded-3xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignQueue}
                  disabled={isSubmittingQueue || queueEmployeeIds.size === 0}
                  className="flex-1 rounded-3xl bg-violet-600 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-violet-900/20 transition-all hover:bg-violet-700 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmittingQueue ? 'Assigning...' : `Assign to ${queueEmployeeIds.size} Employee(s)`}
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Update Confirmation Modal */}

      <AnimatePresence>
        {statusModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-emerald-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-emerald-500 uppercase italic">
                    Status Synchronization
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Apply <span className="text-emerald-500">{statusModal.newStatus}</span> Status?
                </h2>
                <p className="mt-2 text-xs font-bold leading-relaxed text-slate-405 uppercase italic">
                  Order <span className="text-slate-900 font-mono">{statusModal.orderId}</span> transition to <span className="text-slate-900">{statusModal.newStatus}</span>.
                </p>
              </div>

              {/* Order and Customer details */}
              {(() => {
                const order = orders.find(o => o.order_id === statusModal.orderId)
                const customer = order ? customers.find(c => c.id === order.user_id) : null
                return order ? (
                  <div className="mb-6 max-h-[250px] overflow-y-auto rounded-2xl bg-slate-50 p-6 text-left space-y-4">
                    <div>
                      <h4 className="text-[9px] font-black tracking-[3px] text-slate-400 uppercase">Customer Details</h4>
                      <p className="mt-1 text-sm font-black text-slate-900 uppercase italic">
                        {customer ? customer.name : 'Unknown Customer'}
                      </p>
                      {customer && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                          {customer.company_name ? `${customer.company_name} · ` : ''}{customer.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-[9px] font-black tracking-[3px] text-slate-400 uppercase mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {order.products.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-100">
                            {item.productImage && (
                              <img src={item.productImage} className="h-10 w-10 rounded-lg object-cover" alt="" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 uppercase italic truncate">{item.productName}</p>
                              <p className="text-[9px] font-bold text-slate-400">Qty: {item.quantity} · Size: {item.variant?.size || 'N/A'}</p>
                            </div>
                            <span className="text-xs font-black text-slate-900">₱{((item.variant?.unitPrice || 0) * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-slate-200/60 pt-3">
                      <span className="text-xs font-bold text-slate-500 uppercase">Total Amount</span>
                      <span className="text-sm font-black text-slate-900">₱{order.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                ) : null
              })()}

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
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Order Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => {
                setDeleteModal({ ...deleteModal, isOpen: false })
                setDeletePassword('')
              }}
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-rose-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-rose-500 uppercase italic">
                    Critical Operation
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Delete Order?
                </h2>
                <p className="mt-2 text-xs font-bold leading-relaxed text-slate-405 uppercase italic">
                  You are about to permanently delete Order <span className="text-slate-900 font-mono">{deleteModal.orderId}</span>.
                </p>
              </div>

              {/* Order and Customer details */}
              {(() => {
                const order = orders.find(o => o.order_id === deleteModal.orderId)
                const customer = order ? customers.find(c => c.id === order.user_id) : null
                return order ? (
                  <div className="mb-6 max-h-[250px] overflow-y-auto rounded-2xl bg-slate-50 p-6 text-left space-y-4">
                    <div>
                      <h4 className="text-[9px] font-black tracking-[3px] text-slate-400 uppercase">Customer Details</h4>
                      <p className="mt-1 text-sm font-black text-slate-900 uppercase italic">
                        {customer ? customer.name : 'Unknown Customer'}
                      </p>
                      {customer && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                          {customer.company_name ? `${customer.company_name} · ` : ''}{customer.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-[9px] font-black tracking-[3px] text-slate-400 uppercase mb-2">Order Items</h4>
                      <div className="space-y-2">
                        {order.products.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-100">
                            {item.productImage && (
                              <img src={item.productImage} className="h-10 w-10 rounded-lg object-cover" alt="" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 uppercase italic truncate">{item.productName}</p>
                              <p className="text-[9px] font-bold text-slate-400">Qty: {item.quantity} · Size: {item.variant?.size || 'N/A'}</p>
                            </div>
                            <span className="text-xs font-black text-slate-900">₱{((item.variant?.unitPrice || 0) * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-slate-200/60 pt-3">
                      <span className="text-xs font-bold text-slate-500 uppercase">Total Amount</span>
                      <span className="text-sm font-black text-slate-900">₱{order.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                ) : null
              })()}

              {/* Password check input */}
              <div className="mb-8 text-left">
                <label className="mb-2 block text-[9px] font-black tracking-[3px] text-slate-400 uppercase">
                  Verify Admin Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password to confirm..."
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value)
                    setDeleteError(null)
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-rose-500 focus:bg-white transition-colors"
                />
                {deleteError && (
                  <p className="mt-2 text-xs font-black text-rose-500 uppercase">
                    ⚠️ {deleteError}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDeleteModal({ ...deleteModal, isOpen: false })
                    setDeletePassword('')
                    setDeleteError(null)
                  }}
                  className="flex-1 rounded-3xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrder}
                  className="flex-1 rounded-3xl bg-rose-600 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-rose-900/20 transition-all hover:bg-rose-700 hover:scale-105 active:scale-95"
                >
                  Confirm Delete
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Success Confirmation Modal */}
      <AnimatePresence>
        {deleteSuccessModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setDeleteSuccessModal({ isOpen: false, orderId: '' })}
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl text-center md:p-10"
            >
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100">
                  <Check size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                Order Deleted
              </h3>
              <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400 uppercase italic">
                Order <span className="text-slate-900 font-mono">{deleteSuccessModal.orderId}</span> has been successfully deleted. All inventory levels and customer metrics have been reverted.
              </p>
              <button
                onClick={() => setDeleteSuccessModal({ isOpen: false, orderId: '' })}
                className="mt-8 w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-widest text-[#75EEA5] uppercase italic shadow-xl shadow-slate-900/20 transition-all hover:scale-102 active:scale-98"
              >
                Acknowledge
              </button>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Update Result Modal */}
      <AnimatePresence>
        {statusResultModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setStatusResultModal({ ...statusResultModal, isOpen: false })}
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl text-center md:p-10"
            >
              <div className="mb-6 flex justify-center">
                {statusResultModal.isSuccess ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500 border border-rose-100">
                    <AlertCircle size={32} className="text-rose-500" />
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                {statusResultModal.isSuccess ? 'Status Synced' : 'Sync Failed'}
              </h3>
              <p className="mt-4 text-xs font-bold leading-relaxed text-slate-405 uppercase italic text-center">
                {statusResultModal.isSuccess ? (
                  <>
                    Order <span className="text-slate-900 font-mono">{statusResultModal.orderId}</span> status has been successfully updated to <span className="text-emerald-500">{statusResultModal.status}</span>.
                  </>
                ) : (
                  <>
                    Failed to update status for Order <span className="text-slate-900 font-mono">{statusResultModal.orderId}</span> to <span className="text-rose-500">{statusResultModal.status}</span>.
                    {statusResultModal.errorMessage && (
                      <span className="block mt-2 font-mono text-rose-500 font-black">{statusResultModal.errorMessage}</span>
                    )}
                  </>
                )}
              </p>
              <button
                onClick={() => setStatusResultModal({ ...statusResultModal, isOpen: false })}
                className={`mt-8 w-full rounded-2xl py-4 text-[10px] font-black tracking-widest uppercase italic shadow-xl transition-all hover:scale-102 active:scale-98 ${
                  statusResultModal.isSuccess
                    ? 'bg-slate-900 text-[#75EEA5] shadow-slate-900/20'
                    : 'bg-rose-600 text-white shadow-rose-900/20'
                }`}
              >
                Acknowledge
              </button>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Concern Message Confirmation Modal */}
      <AnimatePresence>
        {concernModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setConcernModal({ ...concernModal, isOpen: false })}
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-amber-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-amber-500 uppercase italic">
                    Product Concern
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Create Concern Message?
                </h2>
                <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400 uppercase italic">
                  Order ID: <span className="text-slate-900 font-mono">{concernModal.orderId}</span>
                </p>
                <div className="mt-6">
                  <label className="mb-2 block px-1 font-mono text-[9px] font-black tracking-widest text-slate-400 uppercase leading-none">
                    Concern Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the product concern in detail..."
                    value={concernModal.concernText}
                    onChange={(e) => setConcernModal({ ...concernModal, concernText: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-semibold text-slate-900 shadow-sm transition-all outline-none focus:border-amber-500 focus:bg-white resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setConcernModal({ ...concernModal, isOpen: false })}
                  className="flex-1 rounded-xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={!concernModal.concernText.trim()}
                  onClick={handleCreateProductConcernConfirm}
                  className="flex-1 rounded-xl bg-amber-500 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-amber-900/20 transition-all hover:bg-amber-600 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Confirm & Transmit
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Detail Modal */}
      <AnimatePresence>
        {mobileDetailOrder && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setMobileDetailOrder(null)}
            />
            <m.div 
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
                                {['UNPAID', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUND'].map((s) => (
                                   <button
                                     key={s}
                                     disabled={['staff', 'inventory'].includes(user?.role || '')}
                                     onClick={() => {
                                       if (s === 'REFUND') {
                                         setMobileDetailOrder(null)
                                         navigate(`/admin/refund?customer_id=${mobileDetailOrder.user_id}&order_id=${mobileDetailOrder.order_id}`)
                                       } else {
                                         setStatusModal({ isOpen: true, orderId: mobileDetailOrder.order_id, newStatus: s })
                                       }
                                     }}
                                     className={cn(
                                       "rounded-lg border py-3 text-[9px] font-black uppercase transition-all",
                                       ['staff', 'inventory'].includes(user?.role || '') ? 'opacity-50 cursor-not-allowed' : '',
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
                  {user?.role === 'inventory' ? (
                    <button 
                      onClick={() => {
                          setMessageModal({ isOpen: true, orderId: mobileDetailOrder.order_id, message: '', isSubmitting: false })
                      }}
                      className="flex-1 rounded-xl bg-blue-600 py-4 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-700"
                    >
                      Message Admin
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                          setDeleteModal({ isOpen: true, orderId: mobileDetailOrder.order_id })
                      }}
                      className="flex-1 rounded-xl bg-rose-600 py-4 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-rose-900/20 transition-all hover:bg-rose-700"
                    >
                      Terminate Order
                    </button>
                  )}
                  <button 
                    onClick={() => setMobileDetailOrder(null)}
                    className="flex-1 rounded-xl bg-white border border-slate-200 py-4 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-all hover:bg-slate-50"
                  >
                    Dismiss
                  </button>
               </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Modal */}
      <AnimatePresence>
        {messageModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => !messageModal.isSubmitting && setMessageModal({ ...messageModal, isOpen: false })}
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-blue-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-blue-500 uppercase italic">
                    Contact Admin
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Send Message
                </h2>
                <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400 uppercase italic">
                  Regarding Order <span className="text-slate-900 font-mono">{messageModal.orderId}</span>
                </p>
              </div>

              <div className="mb-6">
                <textarea
                  className="w-full rounded-xl border border-slate-200 p-4 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                  rows={4}
                  placeholder="Type your message here..."
                  value={messageModal.message}
                  onChange={(e) => setMessageModal({ ...messageModal, message: e.target.value })}
                  disabled={messageModal.isSubmitting}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => !messageModal.isSubmitting && setMessageModal({ ...messageModal, isOpen: false })}
                  disabled={messageModal.isSubmitting}
                  className="flex-1 rounded-xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={messageModal.isSubmitting || !messageModal.message.trim()}
                  className="flex-1 rounded-xl bg-blue-600 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {messageModal.isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Orders
