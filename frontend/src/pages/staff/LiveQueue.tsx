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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Select, { type SingleValue } from 'react-select'
import { orderBy } from 'lodash'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { type Order } from '../../types/order'
import allProducts from '../../data/products.json'

interface StaffAssignment {
  allowed_categories: string[]
  allowed_products: string[]
  is_admin: boolean
}

interface LiveQueueOrder extends Order {
  task_status?: 'COMPLETED' | 'NOT_COMPLETED'
  requested_at?: string
}

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

const PAGE_SIZE = 4

const LiveQueue: React.FC = () => {
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] =
    useState<SingleValue<{ value: string; label: string }>>(null)
  const [sortOption, setSortOption] = useState<
    SingleValue<{ value: string; label: string }>
  >({ value: 'date-desc', label: 'Newest First' })

  // Pagination
  const [pendingOrdersPage, setPendingOrdersPage] = useState(1)
  const [productionLogsPage, setProductionLogsPage] = useState(1)

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
      const response = await axios.get('/api/staff/live-queue')
      return response.data as {
        pending_orders: LiveQueueOrder[]
        production_orders: LiveQueueOrder[]
        assignments: StaffAssignment
      }
    },
  })

  const rawPendingOrders = queueData?.pending_orders ?? []
  const rawProductionOrders = queueData?.production_orders ?? []
  const assignment = queueData?.assignments ?? null

  // Reset pagination when filter parameters change
  useEffect(() => {
    setPendingOrdersPage(1)
    setProductionLogsPage(1)
  }, [searchQuery, userFilter, sortOption])

  // Aggregate user options for select dropdown
  const usersOptions = useMemo(() => {
    const allRaw = [...rawPendingOrders, ...rawProductionOrders]
    const uniqueUsers = Array.from(new Set(allRaw.map((o) => o.user_id)))
    return [
      { value: 'all', label: 'All Users' },
      ...uniqueUsers.map((uid) => ({ value: uid, label: uid })),
    ]
  }, [rawPendingOrders, rawProductionOrders])

  // Filter and sort helper
  const filterAndSortOrders = (rawList: LiveQueueOrder[]) => {
    if (!assignment) return []

    // 1. Assignments from backend
    const allowedCategories = assignment.allowed_categories || []
    const allowedProducts = assignment.allowed_products || []

    // 2. Map product names to categories
    const productCategoryMap: Record<string, string> = {}
    ;(allProducts as { name: string; category: string }[]).forEach((p) => {
      productCategoryMap[p.name] = p.category
    })

    // 3. Apply category & product restrictions
    const filteredByCategory = rawList
      .map((order) => {
        const isPrivileged = assignment.is_admin
        const noConstraints =
          allowedCategories.length === 0 && allowedProducts.length === 0

        if (isPrivileged || noConstraints) return order

        // Filter products in the order to match employee allowed assignments
        const assignedProducts = order.products.filter((p) => {
          const cat = productCategoryMap[p.productName]
          const isCatAllowed = allowedCategories.includes(cat)
          const isProdAllowed = allowedProducts.includes(p.productName)
          return isCatAllowed || isProdAllowed
        })

        return { ...order, products: assignedProducts }
      })
      .filter((o) => o.products.length > 0)

    let result = filteredByCategory

    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          o.order_id.toLowerCase().includes(q) ||
          o.user_id.toLowerCase().includes(q) ||
          o.products.some((p) => p.productName.toLowerCase().includes(q)),
      )
    }

    // Client user filter
    if (userFilter && userFilter.value !== 'all') {
      result = result.filter((o) => o.user_id === userFilter.value)
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
  }

  // Filtered lists
  const pendingOrders = useMemo(() => {
    return filterAndSortOrders(rawPendingOrders)
  }, [rawPendingOrders, searchQuery, userFilter, sortOption, assignment])

  const productionOrders = useMemo(() => {
    return filterAndSortOrders(rawProductionOrders)
  }, [rawProductionOrders, searchQuery, userFilter, sortOption, assignment])

  // Paginated lists
  const totalPendingPages = Math.max(1, Math.ceil(pendingOrders.length / PAGE_SIZE))
  const safePendingPage = Math.min(pendingOrdersPage, totalPendingPages)
  const paginatedPendingOrders = useMemo(() => {
    return pendingOrders.slice(
      (safePendingPage - 1) * PAGE_SIZE,
      safePendingPage * PAGE_SIZE,
    )
  }, [pendingOrders, safePendingPage])

  const totalProductionPages = Math.max(1, Math.ceil(productionOrders.length / PAGE_SIZE))
  const safeProductionPage = Math.min(productionLogsPage, totalProductionPages)
  const paginatedProductionOrders = useMemo(() => {
    return productionOrders.slice(
      (safeProductionPage - 1) * PAGE_SIZE,
      safeProductionPage * PAGE_SIZE,
    )
  }, [productionOrders, safeProductionPage])

  // Handle task status submission
  const handleSubmitTaskStatus = async () => {
    if (!modalState.order || !modalState.taskStatus) return

    try {
      await axios.post(
        `/api/staff/orders/${modalState.order.order_id}/task-status`,
        {
          task_status: modalState.taskStatus,
          message: modalState.customMessage,
        },
      )
      toast.success('Task status logged successfully!')
      setModalState({ isOpen: false, order: null, taskStatus: null, customMessage: '' })
      refetch()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to update task status.')
    }
  }

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
          <p className="font-medium text-slate-500">
            {error instanceof Error ? error.message : 'Unable to retrieve processing orders.'}
          </p>
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
      <header className="LiveQueueHeader mx-auto max-w-[1700px] px-6 pt-12 md:px-12">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="animate-pulse rounded-[22px] bg-slate-900 p-4 text-[#75EEA5] shadow-2xl shadow-slate-900/20">
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
                  {pendingOrders.length} Pending / {productionOrders.length} Logged
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FILTERS BAR */}
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
            <div className="flex flex-col items-center rounded-[44px] border border-dashed border-slate-200 bg-white py-32 text-center shadow-sm">
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
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              {paginatedPendingOrders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  onStatusSelect={(status) => setModalState({
                    isOpen: true,
                    order,
                    taskStatus: status,
                    customMessage: '',
                  })}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls — Always Shown */}
          <div className="flex items-center justify-between border border-slate-100 bg-white px-8 py-5 rounded-[24px] shadow-sm mt-6">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Page {safePendingPage} of {totalPendingPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPendingOrdersPage(Math.max(1, safePendingPage - 1))}
                disabled={safePendingPage <= 1}
                className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPendingPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPendingOrdersPage(page)}
                  className={cn(
                    "min-w-[36px] rounded-xl px-3 py-2 text-[11px] font-black tracking-widest uppercase transition-all",
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
                className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
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
            <div className="flex flex-col items-center rounded-[44px] border border-dashed border-slate-200 bg-white py-32 text-center shadow-sm">
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
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              {paginatedProductionOrders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  isLogged
                />
              ))}
            </div>
          )}

          {/* Pagination Controls — Always Shown */}
          <div className="flex items-center justify-between border border-slate-100 bg-white px-8 py-5 rounded-[24px] shadow-sm mt-6">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Page {safeProductionPage} of {totalProductionPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProductionLogsPage(Math.max(1, safeProductionPage - 1))}
                disabled={safeProductionPage <= 1}
                className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalProductionPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setProductionLogsPage(page)}
                  className={cn(
                    "min-w-[36px] rounded-xl px-3 py-2 text-[11px] font-black tracking-widest uppercase transition-all",
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
                className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
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
            className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
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
              {modalState.taskStatus === 'COMPLETED' ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                    This will mark the production task as completed and automatically send the following message to the client:
                  </p>
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">Auto-Generated Message</span>
                    <p className="text-xs font-bold text-emerald-800">"successfully na natapos ang task."</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                    Please provide an optional reason/message detailing why the task was not completed.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Message (Optional)</label>
                    <textarea
                      placeholder="e.g. Awaiting raw materials, machine downtime..."
                      value={modalState.customMessage}
                      onChange={(e) => setModalState(prev => ({ ...prev, customMessage: e.target.value }))}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-semibold focus:ring-2 focus:ring-rose-500/20 focus:outline-none placeholder:text-slate-300"
                    />
                    <span className="text-[9px] text-slate-400 italic block">
                      Leave blank to default to: "hindi natapos"
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setModalState({ isOpen: false, order: null, taskStatus: null, customMessage: '' })}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black tracking-widest text-slate-600 uppercase hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTaskStatus}
                className={cn(
                  "rounded-2xl px-6 py-2.5 text-xs font-black tracking-widest text-white uppercase shadow-md transition-all hover:scale-105 active:scale-95",
                  modalState.taskStatus === 'COMPLETED' ? "bg-slate-900 hover:bg-slate-800" : "bg-rose-600 hover:bg-rose-500"
                )}
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- SUB-COMPONENTS ---
const OrderCard: React.FC<{
  order: LiveQueueOrder
  isLogged?: boolean
  onStatusSelect?: (status: 'COMPLETED' | 'NOT_COMPLETED') => void
}> = ({ order, isLogged, onStatusSelect }) => {
  return (
    <div
      className="LiveQueueOrderCard overflow-hidden rounded-[44px] border border-slate-100 bg-white shadow-xl shadow-slate-200/20 hover:border-slate-200 transition-all"
    >
      {/* CARD HEADER */}
      <div className="border-b border-slate-50 p-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] shadow-lg bg-slate-900 text-white">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black tracking-[3px] uppercase text-slate-400">
                Order Terminal {order.order_id}
              </p>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black tracking-tight uppercase italic text-slate-900">
                  Payload Recipient: {order.user_id}
                </h3>
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"></div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="mb-1 text-[9px] font-black tracking-widest uppercase text-slate-400">
              Master Vault Total
            </p>
            <span className="text-2xl font-black tracking-tighter italic text-slate-900">
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
            className="LiveQueueProductCard rounded-[32px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg p-6 transition-all"
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
                    <h4 className="text-lg font-black tracking-tight uppercase italic text-slate-900">
                      {p.productName}
                    </h4>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[9px] font-black tracking-wider text-slate-700 uppercase">
                        {p.variant.size}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Qty:{' '}
                        <span className="font-black text-slate-900">
                          {p.quantity.toLocaleString()} pcs
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black italic text-slate-900">
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
                  <div className="rounded-2xl p-4 bg-white shadow-sm">
                    <p className="mb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      Plate Strategy
                    </p>
                    <p className="text-[10px] font-black italic text-slate-900">
                      {p.plate?.name || 'TBD - Standard'}
                    </p>
                    <div className="mt-2 flex justify-between border-t border-slate-100/10 pt-2">
                      <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                        Setup Cost
                      </span>
                      <span className="text-[9px] font-black italic text-slate-900">
                        ₱{p.plate?.setupFee || 0}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl p-4 bg-white shadow-sm">
                    <p className="mb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      Print Yield Rate
                    </p>
                    <p className="text-[10px] font-black italic text-slate-900">
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
      <div className="flex flex-col items-center justify-between gap-6 p-8 sm:flex-row border-t border-slate-50 bg-slate-50/30">
        {isLogged ? (
          <>
            <div className="flex items-center gap-3">
              <Calendar size={14} className="text-slate-400" />
              <p className="text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase italic">
                Logged: {format(new Date(order.requested_at!), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Task Status:
              </span>
              <span className={cn(
                "rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase shadow-sm",
                order.task_status === 'COMPLETED' 
                  ? "bg-emerald-100 text-emerald-600" 
                  : "bg-rose-100 text-rose-600"
              )}>
                {order.task_status}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Calendar size={14} className="text-slate-400" />
              <p className="text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase italic">
                Registered: {format(new Date(order.created_at), 'MMM dd, yyyy')}
              </p>
            </div>

            <div className="flex w-full items-center gap-4 sm:w-auto">
              <button
                onClick={() => onStatusSelect?.('COMPLETED')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-[24px] bg-[#75EEA5] hover:bg-emerald-400 px-6 py-4 text-[10px] font-black tracking-widest text-slate-900 uppercase italic shadow-lg shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95"
              >
                <CheckCircle2 size={16} />
                COMPLETED
              </button>
              <button
                onClick={() => onStatusSelect?.('NOT_COMPLETED')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-[24px] bg-rose-500 hover:bg-rose-600 px-6 py-4 text-[10px] font-black tracking-widest text-white uppercase italic shadow-lg shadow-rose-500/10 transition-all hover:scale-105 active:scale-95"
              >
                <AlertCircle size={16} />
                NOT COMPLETED
              </button>
            </div>
          </>
        )}
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
