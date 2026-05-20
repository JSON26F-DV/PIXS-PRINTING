import React, { useState } from 'react'
import {
  Package,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Truck,
  RotateCcw,
  Star,
  MessageCircle,
  ShoppingBag,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cartService } from '../../AddToCart/services/cartService'
import toast from 'react-hot-toast'
import type { AddToCartData } from '../../../types/cart'

export interface OrderItem {
  id: string
  product_id: string
  productName: string
  productImage: string
  quantity: number
  variant: {
    id: string
    size: string
    width?: string
    height?: string
    unitPrice: number
  }
  short_description?: string
  order_item_colors?: { id: string; name: string; hex: string }[]
  plate?: { id: string; name: string; type: string; channels: number; setupFee: number; printPricePerUnit: number } | null
  customRequirements?: string
}

export interface Order {
  order_id: string
  user_id: string
  order_items: OrderItem[]
  total_amount: number
  status: string // PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  created_at: string
  admin_comment: string | null
  feedback?: string
  complaint?: string
  rating?: number
  shipping_address?: {
    label: string
    region: string
    province: string
    city: string
    barangay: string
    street: string
    postal_code: string
    contact_number: string
  }
}

// Sub-components
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

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateReview,
  onCancelOrder,
  onConfirmReceived,
}) => {
  const navigate = useNavigate()
  const [isProcessingBuyAgain, setIsProcessingBuyAgain] = useState(false)
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
  }

  const handleBuyAgain = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProcessingBuyAgain(true)
    const toastId = toast.loading('Preparing your order for checkout...')

    try {
      // 1. Deselect current cart items to isolate the "Buy Again" set
      const cartItems = await cartService.getCartItems()
      await Promise.all(
        cartItems
          .filter((i) => i.selected)
          .map((i) => cartService.updateCartItem(i.id, { selected: 0 })),
      )

      // 2. Add each order item back to the cart as a temporary item
      await Promise.all(
        order.order_items.map(async (item) => {
          const payload: AddToCartData = {
            id: self.crypto.randomUUID(), // New unique ID for the recreate cart item
            product_id: item.product_id,
            variant_id: item.variant.id,
            screenplate_id: item.plate?.id || null,
            quantity: item.quantity,
            unit_price: item.variant.unitPrice,
            plate_price: item.plate?.printPricePerUnit || 0,
            temp: true,
            selected: true,
            total_cart_price:
              (item.variant.unitPrice + (item.plate?.printPricePerUnit || 0)) *
              item.quantity,
            colors: (item.order_item_colors || []).map((c, idx) => ({
              id: c.id,
              color_id: c.id,
              channel_label:
                idx === 0 ? 'Primary' : idx === 1 ? 'Secondary' : 'Accent',
              channel_order: idx,
            })),
          }
          return cartService.addToCart(payload)
        }),
      )

      toast.success('Items added to checkout', { id: toastId })
      navigate('/transactions')
    } catch (err) {
      console.error('Buy again failure:', err)
      toast.error('Failed to prepare checkout. Please try again.', {
        id: toastId,
      })
    } finally {
      setIsProcessingBuyAgain(false)
    }
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
      <div className="OrderProductList mb-8 space-y-0">
        {order.order_items.map((product, idx) => (
          <React.Fragment key={`${order.order_id}-${idx}`}>
            <article className="OrderProductCard relative bg-white py-4 md:py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                {/* Product Image */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white md:h-24 md:w-24">
                  <img
                    src={product.productImage}
                    alt={product.productName}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  {/* Title, Variant, Short Description */}
                  <div>
                    <h4 className="OrderProductTitle text-lg font-black tracking-tight text-slate-900 uppercase italic">
                      {product.productName}
                    </h4>
                    {product.variant && (
                      <p className="OrderProductVariant text-xs font-black tracking-widest text-slate-500 uppercase">
                        {product.variant.size}
                        {product.variant.width && product.variant.height && (
                          <> | {product.variant.width} x {product.variant.height}</>
                        )}
                      </p>
                    )}
                    {product.short_description && (
                      <p className="text-sm text-slate-600">
                        {product.short_description}
                      </p>
                    )}
                  </div>

                  {/* Color Info */}
                  {product.order_item_colors && product.order_item_colors.length > 0 && (
                    <div className="OrderProductColors flex flex-wrap items-center gap-2">
                      {product.order_item_colors.map((color, colorIdx) => {
                        const label = colorIdx === 0 ? 'Primary' : colorIdx === 1 ? 'Secondary' : 'Accent'
                        return (
                          <div
                            key={color.hex}
                            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black tracking-wider uppercase text-slate-600"
                          >
                            <div
                              className="h-2.5 w-2.5 rounded-full border border-slate-200"
                              style={{ backgroundColor: color.hex }}
                            />
                            {color.name}
                            <span className="text-pixs-mint ml-1 text-[8px] italic">
                              {label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Quantity & Plate */}
                  <div className="flex items-center gap-4">
                    <div className="OrderProductQuantity flex items-center gap-2">
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-900">
                        {product.quantity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">qty</span>
                    </div>

                    {product.plate && (
                      <div className="flex items-center gap-2 text-xs font-black italic text-slate-600">
                        🖨 {product.plate.name}
                        <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                          {product.plate.type === 'Flatscreen'
                            ? 'Flat'
                            : product.plate.type === 'Cylindrical'
                              ? 'Center'
                              : 'Front'}{' '}
                          | {product.plate.channels}ch
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Price / Unit
                      </p>
                      <p className="font-mono text-sm font-black text-slate-900 italic">
                        ₱{product.variant?.unitPrice?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Subtotal
                      </p>
                      <p className="font-mono text-sm font-black text-slate-900 italic">
                        ₱{((product.variant?.unitPrice || 0) * product.quantity).toFixed(2)}
                      </p>
                    </div>
                    {product.plate && (
                      <div>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Printing
                        </p>
                        <p className="font-mono text-sm font-black text-slate-900 italic">
                          ₱{(product.plate.printPricePerUnit * product.quantity).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
            {idx < order.order_items.length - 1 && (
              <div className="border-b border-slate-100" />
            )}
          </React.Fragment>
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
            <div className="mt-6 w-full rounded-3xl border border-slate-100 bg-slate-50 p-6 text-left">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-2 text-left">
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
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={handleBuyAgain}
                  disabled={isProcessingBuyAgain}
                  className="flex items-center gap-2 rounded-xl border border-pixs-mint/20 bg-pixs-mint/5 px-6 py-3 text-[10px] font-black tracking-widest text-pixs-mint uppercase italic transition-all hover:bg-pixs-mint/10 disabled:opacity-50"
                >
                  {isProcessingBuyAgain ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={14} />
                  )}
                  Buy Again
                </button>

                <div className="flex gap-3">
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
            </div>
          )}

          {order.status.toUpperCase() === 'CANCELLED' && order.admin_comment && (
            <div className="order-admin-comment mt-4 w-full rounded-2xl border border-red-100 bg-red-50/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-red-600">
                <AlertCircle size={14} />
                <span className="text-[10px] font-black tracking-widest uppercase italic">
                  Cancelled!
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
