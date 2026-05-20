import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  ShoppingBag,
  ArrowRight,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import Footer from '../../components/Footer/Footer'
import { orderApi } from '../../api/orders.api'
import { OrderCard, type Order } from './components/OrderCard'
import { ScreenplateRequestCard, type ScreenplateRequest } from './components/ScreenplateRequestCard'
import { getScreenplateRequests } from '../../api/screenplate.api'

const TABS = [
  { id: 'all', label: 'All', status: 'ALL' },
  { id: 'pending', label: 'Pending', status: 'PENDING' },
  { id: 'to-ship', label: 'Processing', status: 'PROCESSING' },
  { id: 'to-receive', label: 'To Receive', status: 'SHIPPED' },
  { id: 'to-review', label: 'To Review', status: 'DELIVERED' },
  { id: 'screenplates', label: 'Screenplates', status: 'SCREENPLATE' },
  {
    id: 'return-cancellation',
    label: 'Return & Cancellation',
    status: 'CANCELLED',
  },
]

// --- Modals ---
const CancelOrderModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  orderId: string
}> = ({ isOpen, onClose, onConfirm, orderId }) => {
  const [selectedReason, setSelectedReason] = useState('Change of mind')
  const [otherReason, setOtherReason] = useState('')

  const reasons = [
    'Change of mind',
    'Found better price elsewhere',
    'Incorrect product selected',
    'Delivery time too long',
    'Duplicate order',
    'Other',
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl md:p-12"
        >
          <button
            onClick={onClose}
            className="absolute top-8 right-8 text-slate-300 transition-colors hover:text-slate-900"
          >
            <X size={24} />
          </button>

          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-0.5 w-8 bg-red-500" />
                <span className="text-[10px] font-black tracking-[4px] text-red-500 uppercase italic">
                  Order Cancellation
                </span>
              </div>
              <h2 className="text-3xl leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                Why are you{' '}
                <span className="text-2xl text-slate-400">cancelling?</span>
              </h2>
              <p className="mt-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                Order ID: {orderId}
              </p>
            </div>

            <div className="space-y-3">
              {reasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                    selectedReason === reason
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span
                    className={`text-[10px] font-black tracking-widest uppercase italic ${selectedReason === reason ? 'text-slate-900' : 'text-slate-400'}`}
                  >
                    {reason}
                  </span>
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4 accent-slate-900"
                  />
                </label>
              ))}
            </div>

            {selectedReason === 'Other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <span className="ml-2 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                  Please specify
                </span>
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-900 transition-all focus:border-slate-900 focus:outline-none"
                  rows={3}
                  placeholder="Tell us more about the reason..."
                />
              </motion.div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-3xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50"
              >
                Dismiss
              </button>
              <button
                onClick={() =>
                  onConfirm(
                    selectedReason === 'Other' ? otherReason : selectedReason,
                  )
                }
                disabled={selectedReason === 'Other' && !otherReason.trim()}
                className="flex-1 rounded-3xl bg-red-500 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-red-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [screenplateRequests, setScreenplateRequests] = useState<ScreenplateRequest[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean
    orderId: string
  }>({ isOpen: false, orderId: '' })

  useEffect(() => {
    let mounted = true
    
    // Fetch Orders
    orderApi.getOrders()
      .then((data) => {
        if (mounted) {
          setOrders(data)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch orders:', err)
      })

    // Fetch Screenplate Requests
    getScreenplateRequests()
      .then((data) => {
        if (mounted) {
          setScreenplateRequests(data)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch screenplate requests:', err)
      })

    return () => { mounted = false }
  }, [])

  const updateOrderReview = async (
    orderId: string,
    review: { rating?: number; feedback?: string; complaint?: string },
  ) => {
    try {
      await orderApi.updateOrder(orderId, review)
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, ...review } : o)),
      )
    } catch (err) {
      console.error('Failed to update review', err)
    }
  }

  const handleCancelConfirm = async (reason: string) => {
    try {
      await orderApi.updateOrder(cancelModal.orderId, {
        status: 'CANCELLED',
        admin_comment: `Cancelled by customer: ${reason}`
      })
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === cancelModal.orderId
            ? {
                ...o,
                status: 'CANCELLED',
                admin_comment: `Cancelled by customer: ${reason}`,
              }
            : o,
        ),
      )
    } catch (err) {
      console.error('Failed to cancel order', err)
    } finally {
      setCancelModal({ isOpen: false, orderId: '' })
    }
  }

  const handleConfirmReceipt = async (orderId: string) => {
    try {
      await orderApi.updateOrder(orderId, { status: 'DELIVERED' })
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === orderId ? { ...o, status: 'DELIVERED' } : o,
        ),
      )
      // Automatically switch to Review tab to show success
      setActiveTab('to-review')
    } catch (err) {
      console.error('Failed to confirm receipt', err)
    }
  }

  // ─── Filter Logic ────────────────────────────────────────────────────────
  const filterOrdersByStatus = (orders: Order[], status: string) => {
    if (status === 'ALL') return orders
    if (status === 'SCREENPLATE') return [] // Handled via filteredItems combine
    return orders.filter((o) => o.status.toUpperCase() === status)
  }

  const filteredItems = useMemo(() => {
    const targetStatus = TABS.find((t) => t.id === activeTab)?.status || 'ALL'
    
    // Filter Orders
    let currentOrders = filterOrdersByStatus(orders, targetStatus)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      currentOrders = currentOrders.filter(
        (o) =>
          o.order_id.toLowerCase().includes(query) ||
          o.order_items.some((p) => p.productName.toLowerCase().includes(query)),
      )
    }

    // Filter Screenplate Requests
    let currentRequests: ScreenplateRequest[] = []
    if (targetStatus === 'ALL' || targetStatus === 'SCREENPLATE' || targetStatus === 'PENDING') {
        currentRequests = screenplateRequests;
        if (targetStatus === 'PENDING') {
            currentRequests = currentRequests.filter(r => r.status === 'Pending')
        }
        if (targetStatus === 'SCREENPLATE') {
            // specifically show all screenplates in screenplate tab
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            currentRequests = currentRequests.filter(r => 
                r.id.toLowerCase().includes(query) || 
                r.product?.name.toLowerCase().includes(query)
            )
        }
    } else {
        currentRequests = []
    }

    const combined = [
      ...currentOrders.map(o => ({ type: 'order' as const, data: o, date: new Date(o.created_at) })),
      ...currentRequests.map(r => ({ type: 'screenplate' as const, data: r, date: new Date(r.created_at) }))
    ]

    return combined.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [orders, screenplateRequests, activeTab, searchQuery])

  return (
    <div className="order-page-wrapper min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-6 pt-10 md:px-16 md:pt-32">
        <div className="bg-pixs-mint/10 absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-7xl space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="bg-pixs-mint h-0.5 w-12" />
            <span className="text-pixs-mint text-[10px] font-black tracking-[5px] uppercase italic">
              Transaction Registry
            </span>
          </motion.div>

          <h1 className="text-6xl leading-[0.8] font-black tracking-tighter text-slate-900 uppercase italic md:text-8xl">
            My <span className="text-slate-400">Orders</span>
          </h1>
          <p className="max-w-xl text-xs font-bold tracking-[4px] text-slate-400 uppercase md:text-sm">
            Track and manage your purchases
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="order-content-container mx-auto max-w-7xl space-y-12 px-6 pb-32 md:px-16">
        {/* Search & Filters */}
        <div className="sticky top-[80px] z-[40] -mx-4 flex flex-col items-center justify-between gap-4 rounded-b-3xl border-b border-transparent bg-white/90 px-6 py-4 shadow-sm backdrop-blur-xl lg:top-[100px] lg:flex-row lg:rounded-3xl lg:border lg:bg-white/80 lg:shadow-none">
          {/* Scrollable Tabs */}
          <div className="order-tabs no-scrollbar -mb-2 flex w-full items-center gap-2 overflow-x-auto scroll-smooth pb-2 lg:w-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`order-tab-button rounded-2xl px-6 py-3 text-[10px] font-black tracking-widest whitespace-nowrap uppercase italic transition-all active:scale-95 ${
                  activeTab === tab.id
                    ? 'order-tab-active text-pixs-mint bg-slate-900 shadow-xl shadow-slate-200'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="group relative w-full lg:w-96">
            <Search
              className="group-focus-within:text-pixs-mint absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by ID or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:border-pixs-mint w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 pr-6 pl-14 text-xs font-bold text-slate-900 shadow-inner transition-all focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Feed */}
        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                item.type === 'order' ? (
                  <OrderCard
                    key={item.data.order_id}
                    order={item.data}
                    onUpdateReview={updateOrderReview}
                    onCancelOrder={(id) =>
                      setCancelModal({ isOpen: true, orderId: id })
                    }
                    onConfirmReceived={handleConfirmReceipt}
                  />
                ) : (
                  <ScreenplateRequestCard
                    key={item.data.id}
                    request={item.data}
                  />
                )
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="order-empty-state flex flex-col items-center justify-center rounded-[64px] border-2 border-dashed border-slate-100 bg-slate-50/50 py-40"
              >
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-slate-50 bg-white shadow-xl shadow-slate-100">
                  <ShoppingBag size={48} className="text-slate-100" />
                </div>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                  No items found.
                </h3>
                <p className="mt-2 mb-10 text-[10px] font-bold tracking-[4px] text-slate-400 uppercase">
                  Start shopping now.
                </p>
                <Link
                  to="/"
                  className="text-pixs-mint flex items-center gap-3 rounded-full bg-slate-900 px-10 py-5 text-xs font-black tracking-[3px] uppercase italic shadow-2xl transition-all hover:scale-105"
                >
                  Return to Store <ArrowRight size={16} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CancelOrderModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, orderId: '' })}
        onConfirm={handleCancelConfirm}
        orderId={cancelModal.orderId}
      />
      <Footer />
    </div>
  )
}

export default OrderPage
