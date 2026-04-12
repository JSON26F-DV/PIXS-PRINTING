import React, { useState, useMemo } from 'react'
import {
  Package,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import orderData from '../../data/order.json'
import Footer from '../../components/Footer/Footer'

import { Star, MessageCircle, Flag } from 'lucide-react'

// --- Types ---
interface OrderProduct {
  id: string
  productId: string
  productName: string
  productImage: string
  quantity: number
  variant: {
    size: string
    unitPrice: number
  }
  colors?: { name: string; hex: string }[]
  plate?: { name: string; setupFee: number; printPricePerUnit: number } | null
  customRequirements?: string
}

interface Order {
  order_id: string
  user_id: string
  products: OrderProduct[]
  total_amount: number
  status: string // PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  created_at: string
  admin_comment: string | null
  feedback?: string
  complaint?: string
  rating?: number
}

const TABS = [
  { id: 'all', label: 'All', status: 'ALL' },
  { id: 'pending', label: 'Pending', status: 'PENDING' },
  { id: 'to-ship', label: 'To Ship', status: 'PROCESSING' },
  { id: 'to-receive', label: 'To Receive', status: 'SHIPPED' },
  { id: 'to-review', label: 'To Review', status: 'DELIVERED' },
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

// --- Sub-components ---

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status.toUpperCase()
  let classes = ''
  let icon = <Clock size={12} />

  switch (s) {
    case 'PENDING':
      classes = 'badge-pending bg-yellow-50 text-yellow-600 border-yellow-100'
      icon = <Clock size={12} />
      break
    case 'PROCESSING':
      classes = 'badge-processing bg-blue-50 text-blue-600 border-blue-100'
      icon = <RotateCcw size={12} className="animate-spin-slow" />
      break
    case 'SHIPPED':
      classes = 'badge-shipped bg-purple-50 text-purple-600 border-purple-100'
      icon = <Truck size={12} />
      break
    case 'DELIVERED':
      classes = 'badge-delivered bg-green-50 text-green-600 border-green-100'
      icon = <CheckCircle2 size={12} />
      break
    case 'CANCELLED':
      classes = 'badge-cancelled bg-red-50 text-red-600 border-red-100'
      icon = <AlertCircle size={12} />
      break
    default:
      classes = 'bg-slate-50 text-slate-600 border-slate-100'
  }

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase italic ${classes}`}
    >
      {icon}
      {status}
    </div>
  )
}

interface OrderCardProps {
  order: Order
  onUpdateReview: (
    orderId: string,
    review: { rating?: number; feedback?: string; complaint?: string },
  ) => void
  onCancelOrder: (orderId: string) => void
  onConfirmReceived: (orderId: string) => void
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateReview,
  onCancelOrder,
  onConfirmReceived,
}) => {
  const [isEditing, setIsEditing] = useState(!order.rating && !order.feedback)
  const [tempRating, setTempRating] = useState(order.rating || 0)
  const [tempFeedback, setTempFeedback] = useState(order.feedback || '')
  const [tempComplaint, setTempComplaint] = useState(order.complaint || '')

  const handleAction = (e: React.MouseEvent, type: string) => {
    e.stopPropagation()

    if (type === 'submit-review') {
      onUpdateReview(order.order_id, {
        rating: tempRating,
        feedback: tempFeedback,
        complaint: tempComplaint,
      })
      setIsEditing(false)
      return
    }

    if (type === 'edit-review') {
      setTempRating(order.rating || 0)
      setTempFeedback(order.feedback || '')
      setTempComplaint(order.complaint || '')
      setIsEditing(true)
      return
    }

    if (type === 'confirm') {
      onConfirmReceived(order.order_id)
      return
    }

    if (type === 'cancel') {
      onCancelOrder(order.order_id)
      return
    }

    console.log(`Action ${type} for order ${order.order_id}`)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="order-card group rounded-[32px] border border-slate-100 bg-white p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 md:p-8"
    >
      {/* Card Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-50 pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="text-pixs-mint flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-200">
            <Package size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tighter text-slate-900 italic">
              ID: {order.order_id}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              <Calendar size={12} className="text-slate-300" />
              {new Date(order.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Product List */}
      <div className="mb-8 space-y-6">
        {order.products.map((product, idx) => (
          <div
            key={`${order.order_id}-${idx}`}
            className="flex items-center gap-4"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <img
                src={product.productImage}
                alt={product.productName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-xs font-black text-slate-900 uppercase italic">
                {product.productName}
              </h4>
              <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Size: {product.variant?.size || 'N/A'} • Qty: {product.quantity}
              </p>

              {/* Extra Infos */}
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors && product.colors.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                    <div className="flex -space-x-1">
                      {product.colors.map((c) => (
                        <div
                          key={c.hex}
                          className="h-3 w-3 rounded-full border border-slate-200"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                      Color
                    </span>
                  </div>
                )}

                {product.plate && (
                  <div className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1">
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                      Plate: {product.plate.name}
                    </span>
                  </div>
                )}

                {product.customRequirements && (
                  <div className="mt-1 w-full rounded-lg border border-slate-100 bg-slate-50 p-2">
                    <p className="text-[8px] font-bold tracking-widest text-slate-500 uppercase">
                      <span className="font-black text-slate-900">Specs:</span>{' '}
                      {product.customRequirements}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-slate-900 italic">
                ₱
                {(
                  (product.variant?.unitPrice || 0) * product.quantity
                ).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Area */}
      <div className="flex flex-col justify-between gap-6 border-t border-slate-50 pt-6 md:flex-row md:items-center">
        <div className="flex flex-col">
          <span className="mb-1 text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
            Total Amount
          </span>
          <span className="text-xl font-black tracking-tighter text-slate-900 italic">
            ₱{order.total_amount.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {order.status.toUpperCase() === 'PENDING' && (
            <button
              onClick={(e) => handleAction(e, 'cancel')}
              className="order-action-btn order-cancel-btn rounded-2xl border border-red-100 bg-white px-6 py-3 text-[10px] font-black tracking-widest text-red-500 uppercase italic transition-colors hover:bg-red-50"
            >
              Cancel Order
            </button>
          )}

          {order.status.toUpperCase() === 'SHIPPED' && (
            <button
              onClick={(e) => handleAction(e, 'confirm')}
              className="order-action-btn order-confirm-btn bg-pixs-mint shadow-pixs-mint/20 rounded-2xl px-6 py-3 text-[10px] font-black tracking-widest text-slate-900 uppercase italic shadow-lg transition-all hover:scale-105"
            >
              Confirm Received
            </button>
          )}

          {order.status.toUpperCase() === 'DELIVERED' && (
            <div className="mt-6 w-full rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                {/* Rating & Feedback */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-[3px] text-slate-900 uppercase italic">
                      Leave a Review
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={`${isEditing ? 'cursor-pointer' : 'cursor-default'} transition-colors ${tempRating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`}
                          onClick={(e) => {
                            if (isEditing) {
                              e.stopPropagation()
                              setTempRating(star)
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <MessageCircle
                      className="absolute top-3 left-3 text-slate-300"
                      size={14}
                    />
                    <textarea
                      placeholder="Tell us about the print quality..."
                      className={`focus:border-pixs-mint w-full resize-none rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-9 text-xs font-bold text-slate-600 focus:outline-none ${!isEditing && 'pointer-events-none opacity-60'}`}
                      rows={2}
                      value={tempFeedback}
                      onChange={(e) => setTempFeedback(e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>

                {/* Complaint */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 text-rose-500">
                    <Flag size={14} />
                    <span className="text-[10px] font-black tracking-[3px] uppercase italic">
                      Report Issue
                    </span>
                  </div>
                  <textarea
                    placeholder="Any damages or wrong specifications?"
                    className={`w-full resize-none rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-2 text-xs font-bold text-rose-600 placeholder:text-rose-300 focus:border-rose-300 focus:outline-none ${!isEditing && 'pointer-events-none opacity-60'}`}
                    rows={2}
                    value={tempComplaint}
                    onChange={(e) => setTempComplaint(e.target.value)}
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                {isEditing ? (
                  <button
                    onClick={(e) => handleAction(e, 'submit-review')}
                    className="rounded-xl bg-slate-900 px-6 py-3 text-[10px] font-black tracking-widest text-white uppercase italic shadow-lg shadow-slate-900/20 transition-all hover:scale-105"
                  >
                    Submit Feedback
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleAction(e, 'edit-review')}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black tracking-widest text-slate-900 uppercase italic shadow-sm transition-all hover:bg-slate-50"
                  >
                    Edit Review
                  </button>
                )}
              </div>
            </div>
          )}

          {order.status.toUpperCase() === 'CANCELLED' &&
            order.admin_comment && (
              <div className="order-admin-comment mt-4 w-full rounded-2xl border border-red-100 bg-red-50/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-red-600">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black tracking-widest uppercase italic">
                    Rejected by admin
                  </span>
                </div>
                <textarea
                  readOnly
                  className="w-full resize-none border-none bg-transparent p-0 text-xs font-medium text-slate-600 focus:outline-none"
                  rows={2}
                  value={order.admin_comment}
                />
              </div>
            )}
        </div>
      </div>
    </motion.div>
  )
}

const OrderPage: React.FC = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>(orderData as Order[])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean
    orderId: string
  }>({ isOpen: false, orderId: '' })

  const updateOrderReview = (
    orderId: string,
    review: { rating?: number; feedback?: string; complaint?: string },
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.order_id === orderId ? { ...o, ...review } : o)),
    )
  }

  const handleCancelConfirm = (reason: string) => {
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
    setCancelModal({ isOpen: false, orderId: '' })
  }

  const handleConfirmReceipt = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === orderId ? { ...o, status: 'DELIVERED' } : o,
      ),
    )
    // Automatically switch to Review tab to show success
    setActiveTab('to-review')
  }

  // ─── Filter Logic ────────────────────────────────────────────────────────
  const filterOrdersByStatus = (orders: Order[], status: string) => {
    if (status === 'ALL') return orders
    return orders.filter((o) => o.status.toUpperCase() === status)
  }

  const filteredOrders = useMemo(() => {
    // 1. Filter by User ID
    let currentOrders = orders.filter((o) => o.user_id === user.id)

    // 2. Filter by Tab Status
    const targetStatus = TABS.find((t) => t.id === activeTab)?.status || 'ALL'
    currentOrders = filterOrdersByStatus(currentOrders, targetStatus)

    // 3. Search Filter (by Order ID or Product Name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      currentOrders = currentOrders.filter(
        (o) =>
          o.order_id.toLowerCase().includes(query) ||
          o.products.some((p) => p.productName.toLowerCase().includes(query)),
      )
    }

    return currentOrders.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [orders, user.id, activeTab, searchQuery])

  return (
    <div className="order-page-wrapper min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-6 pt-32 pb-20 md:px-16">
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
        <div className="sticky top-[80px] z-30 -mx-4 flex flex-col items-center justify-between gap-8 rounded-3xl border border-transparent bg-white/80 px-4 py-4 backdrop-blur-md lg:flex-row">
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

        {/* Orders Feed */}
        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  onUpdateReview={updateOrderReview}
                  onCancelOrder={(id) =>
                    setCancelModal({ isOpen: true, orderId: id })
                  }
                  onConfirmReceived={handleConfirmReceipt}
                />
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
                  No orders found.
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
