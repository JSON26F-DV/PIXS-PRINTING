import React, { useState, useMemo, useCallback } from 'react'
import {
  Activity,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Calendar,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react'
import Select, { type SingleValue } from 'react-select'
import { orderBy } from 'lodash'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../lib/axiosInstance'
import axios from 'axios'
import { type Order } from '../../types/order'
import { useNotifications } from '../../context/NotificationContextInstance'

interface StaffAssignment {
  allowed_categories: string[]
  allowed_products: string[]
  is_admin: boolean
}

interface LiveQueueOrder extends Order {
  task_status?: 'COMPLETED' | 'NOT_COMPLETED'
  requested_at?: string
  company_name?: string | null
}

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

const LiveQueue: React.FC = () => {
  const { refreshNotifications } = useNotifications()
  
  // Dynamic page size based on viewport
  const [isMobile, setIsMobile] = useState(false)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())
  const [mobileDetailOrder, setMobileDetailOrder] = useState<LiveQueueOrder | null>(null)

  const handlePendingOrderClick = async (order: LiveQueueOrder) => {
    try {
      await axiosInstance.post('/api/notifications', {
        title: `Pending Execution: Order #${order.order_id}`,
        message: `Order #${order.order_id} is currently pending execution.`,
        type: 'order_update',
      })
      toast.success(`Notification created for Order #${order.order_id}`)
      refreshNotifications()
    } catch (err) {
      console.error('Failed to create execution notification', err)
      toast.error('Failed to create notification')
    }
  }
  
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean
    orderId: string
    message: string
    isSubmitting: boolean
  }>({
    isOpen: false,
    orderId: '',
    message: '',
    isSubmitting: false,
  })

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const pageSize = isMobile ? 10 : 4

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
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

  // Mobile sort sheet state
  const [isSortOpen, setIsSortOpen] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<
    SingleValue<{ value: string; label: string }>
  >({ value: 'date-desc', label: 'Newest First' })

  // Pagination
  const [pendingOrdersPage, setPendingOrdersPage] = useState(1)
  const [productionLogsPage, setProductionLogsPage] = useState(1)

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setPendingOrdersPage(1)
    setProductionLogsPage(1)
  }

  const handleSortChange = (val: SingleValue<{ value: string; label: string }>) => {
    setSortOption(val)
    setIsSortOpen(false)
    setPendingOrdersPage(1)
    setProductionLogsPage(1)
  }

  // Status submission modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    order: LiveQueueOrder | null
    taskStatus: 'COMPLETED' | 'NOT_COMPLETED' | null
    customMessage: string
  }>({
    isOpen: false,
    order: null,
    taskStatus: null,
    customMessage: '',
  })

  // Load Data
  const { data: queueData, error, refetch, isLoading } = useQuery({
    queryKey: ['staff-queue'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/staff/live-queue')
      return response.data as {
        pending_orders: LiveQueueOrder[]
        production_orders: LiveQueueOrder[]
        assignments: StaffAssignment
      }
    },
  })

  const rawPendingOrders = useMemo(() => queueData?.pending_orders ?? [], [queueData])
  const rawProductionOrders = useMemo(() => queueData?.production_orders ?? [], [queueData])
  const assignment = queueData?.assignments ?? null

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'price-asc', label: 'Yield: Low→High' },
    { value: 'price-desc', label: 'Yield: High→Low' },
    { value: 'qty-desc', label: 'Capacity: High→Low' },
    { value: 'name-asc', label: 'A–Z Product' },
  ]

  // Filter and sort helper
  const filterAndSortOrders = useCallback((rawList: LiveQueueOrder[]) => {
    if (!assignment) return []

    // 1. Assignments from backend
    const allowedCategories = assignment.allowed_categories || []
    const allowedProducts = assignment.allowed_products || []

    // 2. Apply category & product restrictions
    const filteredByCategory = rawList
      .map((order) => {
        const isPrivileged = assignment.is_admin
        const noConstraints =
          allowedCategories.length === 0 && allowedProducts.length === 0

        if (isPrivileged || noConstraints) return order

        // Filter products in the order to match employee allowed assignments
        const assignedProducts = order.products.filter((p) => {
          const isCatAllowed = allowedCategories.includes(p.category)
          const isProdAllowed = allowedProducts.includes(p.productName)
          return isCatAllowed || isProdAllowed
        })

        return { ...order, products: assignedProducts }
      })
      .filter((o) => o.products.length > 0)

    let result = filteredByCategory

    // Search query match — covers order ID, client name, company name, product name
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          o.order_id.toLowerCase().includes(q) ||
          o.user_id.toLowerCase().includes(q) ||
          (o.company_name ?? '').toLowerCase().includes(q) ||
          o.products.some((p) => p.productName.toLowerCase().includes(q)),
      )
    }

    // Sort options
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
              o.products.reduce((acc, p) => acc + p.quantity, 0),
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

    return result
  }, [assignment, searchQuery, sortOption])

  // Filtered lists
  const pendingOrders = useMemo(() => {
    return filterAndSortOrders(rawPendingOrders)
  }, [rawPendingOrders, filterAndSortOrders])

  const productionOrders = useMemo(() => {
    return filterAndSortOrders(rawProductionOrders)
  }, [rawProductionOrders, filterAndSortOrders])

  // Paginated lists
  const totalPendingPages = Math.max(1, Math.ceil(pendingOrders.length / pageSize))
  const safePendingPage = Math.min(pendingOrdersPage, totalPendingPages)
  const paginatedPendingOrders = useMemo(() => {
    return pendingOrders.slice(
      (safePendingPage - 1) * pageSize,
      safePendingPage * pageSize,
    )
  }, [pendingOrders, safePendingPage, pageSize])

  const totalProductionPages = Math.max(1, Math.ceil(productionOrders.length / pageSize))
  const safeProductionPage = Math.min(productionLogsPage, totalProductionPages)
  const paginatedProductionOrders = useMemo(() => {
    return productionOrders.slice(
      (safeProductionPage - 1) * pageSize,
      safeProductionPage * pageSize,
    )
  }, [productionOrders, safeProductionPage, pageSize])

  // Handle task status submission
  const handleSubmitTaskStatus = async () => {
    if (!modalState.order || !modalState.taskStatus) return

    try {
      await axiosInstance.post(
          `/api/staff/orders/${modalState.order.order_id}/task-status`,
          {
            task_status: modalState.taskStatus,
            message: modalState.customMessage,
          },
      )
      toast.success('Task status logged successfully!')
      setModalState({ isOpen: false, order: null, taskStatus: null, customMessage: '' })
      setMobileDetailOrder(null)
      refetch()
    } catch (err: unknown) {
      console.error(err)
      const errorMsg = axios.isAxiosError(err)
          ? err.response?.data?.message || 'Failed to update task status.'
          : 'Failed to update task status.'
      toast.error(errorMsg)
    }
  }

  if (error) {
    return (
      <div className="LiveQueueErrorFallback flex min-h-screen items-center justify-center bg-slate-50 p-10">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-rose-100 bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
            System Malfunction
          </h2>
          <p className="font-medium text-slate-500">
            {error instanceof Error ? error.message : 'Unable to retrieve processing orders.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-slate-900 py-4 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-slate-800"
          >
            Re-Initialize Terminal
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mx-auto" />
          <p className="mt-4 text-sm font-bold text-slate-500">Loading terminal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="LiveQueuePage min-h-screen bg-[#F8FAFC] pb-20">
      {/* HEADER */}
      <header className="LiveQueueHeader mx-auto max-w-[1700px] px-4 pt-6 md:px-12 md:pt-12">
        {/* Mobile Header */}
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <div className="animate-pulse rounded-lg bg-slate-900 p-2.5 text-[#75EEA5] shadow-lg shadow-slate-900/20">
              <Activity size={18} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic leading-none">
                Live Queue
              </h1>
              <p className="text-[8px] font-black tracking-[3px] text-slate-400 uppercase">
                Production Terminal
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Active</span>
            <span className="text-base font-black tracking-tighter text-slate-900 italic leading-tight">
              {pendingOrders.length}P / {productionOrders.length}L
            </span>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="animate-pulse rounded-lg bg-slate-900 p-4 text-[#75EEA5] shadow-2xl shadow-slate-900/20">
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
            <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-8 py-5 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Active Processing
                </span>
                <span className="text-2xl font-black tracking-tighter text-slate-900 italic">
                  {pendingOrders.length} Pending / {productionOrders.length} Logged
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FILTERS BAR */}
      <section className="LiveQueueFiltersBar mx-auto mt-4 md:mt-10 max-w-[1700px] px-4 md:px-12">
        {/* Mobile: single-line search + sort icon */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="group relative flex-1">
            <Search
              className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-emerald-500"
              size={15}
            />
            <input
              type="text"
              placeholder="Search name, company, order..."
              className="w-full rounded-xl border border-slate-100 bg-white py-3 pr-4 pl-11 text-xs font-bold text-slate-900 shadow-sm transition-all focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(prev => !prev)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm transition-all",
                isSortOpen ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-100 text-slate-500"
              )}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="20" y2="12" />
                <line x1="12" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            {isSortOpen && (
              <div className="absolute right-0 top-13 z-50 mt-2 w-52 rounded-xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSortChange(opt)}
                    className={cn(
                      "w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider transition-colors",
                      sortOption?.value === opt.value
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: full filters */}
        <div className="hidden md:flex items-center gap-6 rounded-xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40">
          <div className="group relative flex-1">
            <Search
              className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-emerald-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by order ID, client name, company, or product..."
              className="w-full rounded-lg border border-slate-100 bg-slate-50 py-4 pr-6 pl-16 text-sm font-bold text-slate-900 italic transition-all focus:border-emerald-200 focus:bg-white focus:outline-none"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="w-72 shrink-0">
            <Select
              options={sortOptions}
              value={sortOption}
              onChange={handleSortChange}
              className="staff-select-container text-[11px] font-black tracking-widest uppercase"
              styles={selectStyles}
            />
          </div>
        </div>
      </section>

      {/* PRODUCTION BOARD */}
      <main className="LiveQueueBoard mx-auto mt-10 max-w-[1700px] space-y-16 px-6 md:px-12">
        {/* PENDING ORDERS SECTION */}
        <section className="LiveQueuePendingSection space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-[#75EEA5] animate-pulse"></div>
            <h2 className="text-xl font-black tracking-widest text-slate-900 uppercase italic">
              Orders Pending Execution{' '}
              <span className="ml-2 text-emerald-500">
                ({pendingOrders.length})
              </span>
            </h2>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          {paginatedPendingOrders.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white py-32 text-center shadow-sm">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                <Clock size={48} />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                No Pending Orders
              </h3>
              <p className="mt-2 text-[10px] font-bold tracking-[2px] text-slate-400 uppercase">
                All order payloads have been routed to production
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-4">
              {paginatedPendingOrders.map((order) => (
                isMobile ? (
                  <CompactOrderCardMobile
                    key={order.order_id}
                    order={order}
                    onClick={() => setMobileDetailOrder(order)}
                    onRecreateNotification={() => handlePendingOrderClick(order)}
                  />
                ) : (
                  <OrderCardDesktop
                    key={order.order_id}
                    order={order}
                    isExpanded={expandedOrderIds.has(order.order_id)}
                    onToggleExpand={() => toggleOrderExpansion(order.order_id)}
                    onStatusSelect={(status) => setModalState({
                      isOpen: true,
                      order,
                      taskStatus: status,
                      customMessage: '',
                    })}
                    onMessageClick={() => setMessageModal({
                      isOpen: true,
                      orderId: order.order_id,
                      message: '',
                      isSubmitting: false,
                    })}
                    onRecreateNotification={() => handlePendingOrderClick(order)}
                  />
                )
              ))}
            </div>
          )}

          {/* Pagination Controls — Always Shown */}
          <div className="flex items-center justify-between border border-slate-100 bg-white px-8 py-5 rounded-lg shadow-sm mt-6">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Page {safePendingPage} of {totalPendingPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPendingOrdersPage(Math.max(1, safePendingPage - 1))}
                disabled={safePendingPage <= 1}
                className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPendingPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPendingOrdersPage(page)}
                  className={cn(
                    "min-w-[36px] rounded-lg px-3 py-2 text-[11px] font-black tracking-widest uppercase transition-all",
                    safePendingPage === page
                      ? "bg-slate-900 text-white shadow-lg"
                      : "border border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900"
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setPendingOrdersPage(Math.min(totalPendingPages, safePendingPage + 1))}
                disabled={safePendingPage >= totalPendingPages}
                className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* PRODUCTION LOGS SECTION */}
        <section className="LiveQueueLogsSection space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-slate-400"></div>
            <h2 className="text-xl font-black tracking-widest text-slate-900 uppercase italic">
              Production Registry Log{' '}
              <span className="ml-2 text-slate-400">
                ({productionOrders.length})
              </span>
            </h2>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          {paginatedProductionOrders.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white py-32 text-center shadow-sm">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                <Clock size={48} />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                Log Registry Empty
              </h3>
              <p className="mt-2 text-[10px] font-bold tracking-[2px] text-slate-400 uppercase">
                No orders are registered in the production log database
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-4">
              {paginatedProductionOrders.map((order) => (
                isMobile ? (
                  <CompactOrderCardMobile
                    key={order.order_id}
                    order={order}
                    isLogged
                    onClick={() => setMobileDetailOrder(order)}
                  />
                ) : (
                  <OrderCardDesktop
                    key={order.order_id}
                    order={order}
                    isLogged
                    isExpanded={expandedOrderIds.has(order.order_id)}
                    onToggleExpand={() => toggleOrderExpansion(order.order_id)}
                    onMessageClick={() => setMessageModal({
                      isOpen: true,
                      orderId: order.order_id,
                      message: '',
                      isSubmitting: false,
                    })}
                  />
                )
              ))}
            </div>
          )}

          {/* Pagination Controls — Always Shown */}
          <div className="flex items-center justify-between border border-slate-100 bg-white px-8 py-5 rounded-lg shadow-sm mt-6">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Page {safeProductionPage} of {totalProductionPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProductionLogsPage(Math.max(1, safeProductionPage - 1))}
                disabled={safeProductionPage <= 1}
                className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalProductionPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setProductionLogsPage(page)}
                  className={cn(
                    "min-w-[36px] rounded-lg px-3 py-2 text-[11px] font-black tracking-widest uppercase transition-all",
                    safeProductionPage === page
                      ? "bg-slate-900 text-white shadow-lg"
                      : "border border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900"
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setProductionLogsPage(Math.min(totalProductionPages, safeProductionPage + 1))}
                disabled={safeProductionPage >= totalProductionPages}
                className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* STATUS SUBMISSION MODAL */}
      {modalState.isOpen && modalState.order && modalState.taskStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={cn(
              "px-6 py-5 text-white flex justify-between items-center",
              modalState.taskStatus === 'COMPLETED' ? "bg-slate-900" : "bg-rose-600"
            )}>
              <div>
                <h4 className="text-lg font-black tracking-tight uppercase italic">
                  {modalState.taskStatus === 'COMPLETED' ? 'Mark Task as Completed' : 'Mark Task as Not Completed'}
                </h4>
                <p className="text-[9px] font-bold tracking-widest text-[#75EEA5] uppercase">
                  Order ID: {modalState.order.order_id}
                </p>
              </div>
              <button
                onClick={() => setModalState({ isOpen: false, order: null, taskStatus: null, customMessage: '' })}
                className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                  {modalState.taskStatus === 'COMPLETED' 
                    ? 'This will mark the production task as completed and transmit a notification message to the client.'
                    : 'Please provide an optional reason or details on why the production task was not completed.'
                  }
                </p>
                {modalState.taskStatus === 'COMPLETED' ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-emerald-800 text-xs font-semibold leading-relaxed">
                    The system will automatically send the following notification to the client:
                    <div className="mt-2 pl-3 border-l-2 border-emerald-400 text-emerald-950 font-black italic">
                      "The production task for this order has been successfully completed."
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Custom Message / Reason (Optional)
                    </label>
                    <textarea
                      placeholder="e.g. Awaiting raw materials, machine downtime..."
                      value={modalState.customMessage}
                      onChange={(e) => setModalState(prev => ({ ...prev, customMessage: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-slate-200 p-4 text-xs font-semibold focus:ring-2 focus:outline-none placeholder:text-slate-300 resize-none focus:ring-rose-500/20"
                    />
                    <span className="text-[9px] text-slate-400 italic block">
                      Leave blank to default to: "The production task for this order could not be completed at this time."
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setModalState({ isOpen: false, order: null, taskStatus: null, customMessage: '' })}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-black tracking-widest text-slate-600 uppercase hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTaskStatus}
                className={cn(
                  "rounded-lg px-6 py-2.5 text-xs font-black tracking-widest text-white uppercase shadow-md transition-all hover:scale-105 active:scale-95",
                  modalState.taskStatus === 'COMPLETED' ? "bg-slate-900 hover:bg-slate-800" : "bg-rose-600 hover:bg-rose-500"
                )}
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE DETAIL MODAL */}
      {mobileDetailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 p-4 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div>
                <h4 className="text-lg font-black tracking-tight uppercase italic">
                  Order Details
                </h4>
                <p className="text-[9px] font-bold tracking-widest text-[#75EEA5] uppercase">
                  ID: {mobileDetailOrder.order_id}
                </p>
              </div>
              <button
                onClick={() => setMobileDetailOrder(null)}
                className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary */}
              <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Client Recipient</p>
                  <p className="text-sm font-black text-slate-900 uppercase italic">{mobileDetailOrder.user_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Total Yield</p>
                  <p className="text-lg font-black text-slate-900 italic">₱{mobileDetailOrder.total_amount.toLocaleString()}</p>
                </div>
              </div>

              {/* Products List */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-slate-100 pb-2">
                  Payload Contents
                </h5>
                {mobileDetailOrder.products.map((p, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50/30 p-4 space-y-3">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 shrink-0 rounded-md border border-slate-100 bg-white overflow-hidden p-1">
                        <img src={p.productImage} className="h-full w-full object-cover rounded" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-black text-slate-900 truncate uppercase italic">{p.productName}</h6>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                          Size: {p.variant.size} • Qty: {p.quantity.toLocaleString()} pcs
                        </p>
                      </div>
                    </div>

                    {/* Colors & Technical */}
                    <div className="flex flex-wrap gap-1">
                      {p.colors.map((c, ci) => (
                        <span key={ci} className="inline-flex items-center gap-1 bg-white border border-slate-100 rounded-full px-2 py-0.5 text-[8px] font-bold text-slate-700">
                          <span className="h-2 w-2 rounded-full border" style={{ backgroundColor: c.hex }} />
                          {c.name}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-500">
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="block text-slate-400 uppercase tracking-wider">Plate Strategy</span>
                        <span className="text-slate-900 font-black italic">{p.plate?.name || 'TBD - Standard'}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="block text-slate-400 uppercase tracking-wider">Print Rate</span>
                        <span className="text-slate-900 font-black italic">₱{p.plate?.printPricePerUnit.toFixed(2) || '0.00'}/u</span>
                      </div>
                    </div>

                    {p.customRequirements && (
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-100 text-[8px] font-bold text-amber-600 uppercase italic">
                        Req: {p.customRequirements}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Action Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2 shrink-0">
              {/* Message button */}
              <button
                onClick={() => {
                  setMessageModal({ isOpen: true, orderId: mobileDetailOrder.order_id, message: '', isSubmitting: false })
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-[9px] font-black tracking-wider text-slate-700 uppercase italic shadow-sm active:scale-95"
              >
                <MessageSquare size={14} className="text-slate-500" />
                Message
              </button>

              {mobileDetailOrder.task_status ? (
                <div className="flex-1 flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[9px] font-black uppercase">
                  Status: {mobileDetailOrder.task_status}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setModalState({
                        isOpen: true,
                        order: mobileDetailOrder,
                        taskStatus: 'COMPLETED',
                        customMessage: '',
                      })
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#75EEA5] px-4 py-3.5 text-[9px] font-black tracking-wider text-slate-900 uppercase italic shadow-sm active:scale-95"
                  >
                    <CheckCircle2 size={14} />
                    COMPLETED
                  </button>
                  <button
                    onClick={() => {
                      setModalState({
                        isOpen: true,
                        order: mobileDetailOrder,
                        taskStatus: 'NOT_COMPLETED',
                        customMessage: '',
                      })
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-rose-500 text-white px-4 py-3.5 text-[9px] font-black tracking-wider uppercase italic shadow-sm active:scale-95"
                  >
                    <AlertCircle size={14} />
                    FAILED
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h4 className="text-lg font-black tracking-tight uppercase italic flex items-center gap-2">
                  <MessageSquare size={18} className="text-[#75EEA5]" />
                  Send Message to Admin
                </h4>
                <p className="text-[9px] font-bold tracking-widest text-[#75EEA5] uppercase">
                  Regarding Order: {messageModal.orderId}
                </p>
              </div>
              <button
                onClick={() => setMessageModal({ isOpen: false, orderId: '', message: '', isSubmitting: false })}
                className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Message Content
                </label>
                <textarea
                  placeholder="Type your message to the Administrator regarding this order..."
                  value={messageModal.message}
                  onChange={(e) => setMessageModal(prev => ({ ...prev, message: e.target.value }))}
                  disabled={messageModal.isSubmitting}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 p-4 text-xs font-semibold focus:ring-2 focus:ring-slate-900/20 focus:outline-none placeholder:text-slate-300 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setMessageModal({ isOpen: false, orderId: '', message: '', isSubmitting: false })}
                disabled={messageModal.isSubmitting}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-black tracking-widest text-slate-600 uppercase hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={messageModal.isSubmitting || !messageModal.message.trim()}
                className="rounded-lg bg-slate-900 hover:bg-slate-800 px-6 py-2.5 text-xs font-black tracking-widest text-white uppercase shadow-md transition-all disabled:opacity-50"
              >
                {messageModal.isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- SUB-COMPONENTS ---
const CompactOrderCardMobile: React.FC<{
  order: LiveQueueOrder
  isLogged?: boolean
  onClick: () => void
  onRecreateNotification?: () => void
}> = ({ order, isLogged, onClick, onRecreateNotification }) => {
  return (
    <div
      onClick={() => {
        onClick()
        if (!isLogged && onRecreateNotification) {
          onRecreateNotification()
        }
      }}
      className="cursor-pointer flex flex-col justify-between p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left"
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[8px] font-black tracking-wider text-slate-400 uppercase truncate">
            #{order.order_id.slice(-6)}
          </span>
          <span className={cn(
            "rounded-md px-1.5 py-0.5 text-[7px] font-black uppercase shrink-0",
            isLogged 
              ? (order.task_status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")
              : "bg-amber-50 text-amber-600"
          )}>
            {isLogged ? (order.task_status === 'COMPLETED' ? '✓ Done' : '✗ Halt') : 'Pending'}
          </span>
        </div>
        <h4 className="text-[11px] font-black text-slate-900 truncate uppercase italic leading-tight">
          {order.user_id}
        </h4>
        {order.company_name && (
          <p className="text-[9px] font-bold text-slate-400 truncate">
            {order.company_name}
          </p>
        )}
        <p className="text-[9px] font-bold text-slate-500">
          {order.products.reduce((acc, p) => acc + p.quantity, 0).toLocaleString()} pcs • {order.products.length} item{order.products.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between">
        <span className="text-xs font-black italic text-slate-900">
          ₱{order.total_amount.toLocaleString()}
        </span>
        <ChevronRight size={12} className="text-slate-400" />
      </div>
    </div>
  )
}

const OrderCardDesktop: React.FC<{
  order: LiveQueueOrder
  isLogged?: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onStatusSelect?: (status: 'COMPLETED' | 'NOT_COMPLETED') => void
  onMessageClick?: () => void
  onRecreateNotification?: () => void
}> = ({ order, isLogged, isExpanded, onToggleExpand, onStatusSelect, onMessageClick, onRecreateNotification }) => {
  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md hover:shadow-lg transition-all"
    >
      {/* CARD HEADER */}
      <div 
        onClick={() => {
          onToggleExpand()
          if (!isLogged && onRecreateNotification) {
            onRecreateNotification()
          }
        }}
        className="cursor-pointer border-b border-slate-50 p-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-black tracking-wider uppercase text-slate-400">
              Order {order.order_id}
            </p>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight uppercase italic text-slate-900">
                {order.user_id}
              </h3>
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"></div>
            </div>
            {order.company_name && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {order.company_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="mb-0.5 text-[8px] font-black tracking-wider uppercase text-slate-400">
              Total Amount
            </p>
            <span className="text-xl font-black tracking-tighter italic text-slate-900">
              ₱{order.total_amount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isLogged && (
              <span className={cn(
                "rounded-lg px-3 py-1.5 text-[9px] font-black tracking-wider uppercase shadow-sm",
                order.task_status === 'COMPLETED' 
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                  : "bg-rose-50 text-rose-600 border border-rose-100"
              )}>
                {order.task_status}
              </span>
            )}
            <button className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500 transition-colors">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE DETAILS AREA */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {/* PRODUCTS LIST */}
          <div className="space-y-4 p-6 border-b border-slate-50">
            {order.products.map((p, idx) => (
              <div
                key={`${order.order_id}-p-${idx}`}
                className="rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md p-5 transition-all"
              >
                <div className="flex flex-col gap-5 lg:flex-row">
                  {/* Image Node */}
                  <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-1.5 shadow-inner">
                    <img
                      src={p.productImage}
                      alt={p.productName}
                      className="h-full w-full rounded-md object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <ImageIcon size={16} className="text-white" />
                    </div>
                  </div>

                  {/* Content Node */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-black tracking-tight uppercase italic text-slate-900">
                          {p.productName}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-slate-700 uppercase">
                            {p.variant.size}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            Qty:{' '}
                            <span className="font-black text-slate-900">
                              {p.quantity.toLocaleString()} pcs
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black italic text-slate-900">
                          ₱{p.variant.unitPrice.toFixed(2)}/u
                        </span>
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex flex-wrap gap-1.5">
                      {p.colors.map((c, ci) => (
                        <div
                          key={ci}
                          className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white px-2 py-1 shadow-sm"
                        >
                          <div
                            className="h-2.5 w-2.5 rounded-full border border-slate-200 shadow-sm"
                            style={{ backgroundColor: c.hex }}
                          ></div>
                          <span className="text-[8px] font-black tracking-wider text-slate-900 uppercase italic">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Technical Requirement Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg p-3 bg-white border border-slate-100/50 shadow-sm">
                        <p className="mb-0.5 text-[8px] font-black tracking-wider text-slate-400 uppercase">
                          Plate Strategy
                        </p>
                        <p className="text-[9px] font-black italic text-slate-900">
                          {p.plate?.name || 'TBD - Standard'}
                        </p>
                        <div className="mt-1.5 flex justify-between border-t border-slate-100 pt-1.5">
                          <span className="text-[7px] font-bold tracking-wider text-slate-400 uppercase">
                            Setup Cost
                          </span>
                          <span className="text-[8px] font-black italic text-slate-900">
                            ₱{p.plate?.setupFee || 0}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg p-3 bg-white border border-slate-100/50 shadow-sm">
                        <p className="mb-0.5 text-[8px] font-black tracking-wider text-slate-400 uppercase">
                          Print Yield Rate
                        </p>
                        <p className="text-[9px] font-black italic text-slate-900">
                          ₱{p.plate?.printPricePerUnit.toFixed(2) || '0.00'}/u
                        </p>
                      </div>
                    </div>

                    {/* Custom Req */}
                    {p.customRequirements && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                        <AlertCircle size={12} className="mt-0.5 text-amber-500 shrink-0" />
                        <p className="text-[9px] leading-relaxed font-bold tracking-tight text-amber-500 uppercase italic">
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
          <div className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row bg-slate-50/30">
            <div className="flex items-center gap-3">
              <Calendar size={14} className="text-slate-400" />
              <p className="text-[9px] leading-none font-black tracking-wider text-slate-400 uppercase italic">
                {isLogged 
                  ? `Logged: ${format(new Date(order.requested_at!), 'MMM dd, yyyy HH:mm')}`
                  : `Registered: ${format(new Date(order.created_at), 'MMM dd, yyyy')}`
                }
              </p>
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMessageClick?.()
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-[9px] font-black tracking-wider text-slate-700 uppercase italic transition-all hover:scale-105 active:scale-95 shrink-0 shadow-sm"
              >
                <MessageSquare size={14} className="text-slate-500" />
                Message
              </button>

              {!isLogged && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatusSelect?.('COMPLETED')
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-[#75EEA5] hover:bg-emerald-400 px-5 py-2.5 text-[9px] font-black tracking-wider text-slate-900 uppercase italic shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <CheckCircle2 size={14} />
                    COMPLETED
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatusSelect?.('NOT_COMPLETED')
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 px-5 py-2.5 text-[9px] font-black tracking-wider text-white uppercase italic shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <AlertCircle size={14} />
                    NOT COMPLETED
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- STYLES ---
const selectStyles = {
  control: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    borderRadius: '8px',
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

export default LiveQueue;
