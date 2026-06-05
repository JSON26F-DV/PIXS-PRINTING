import React, { useState } from 'react'
import { Check, MapPin, Phone, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import type { Order } from '../../Order/components/OrderCard'
import { clsx } from 'clsx'
import axiosInstance from '../../../lib/axiosInstance'
import { useCardCache } from '../hooks/useCardCache'

interface ExtendedOrder extends Order {
  customer_name?: string | null
  company_name?: string | null
}

interface OrderConfirmMessageProps {
  messageId: string
  orderId: string
  isCustomer: boolean
  isConfirm?: number
  productConcern?: number | boolean
  messageText?: string
}

const OrderConfirmMessage: React.FC<OrderConfirmMessageProps> = ({ messageId, orderId, isCustomer, isConfirm, productConcern, messageText }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [confirmed, setConfirmed] = useState(() => {
    return isConfirm === 1 || localStorage.getItem(`confirmed_order_${orderId}`) === 'true'
  })
  const isProductConcern = productConcern === 1 || productConcern === true

  const isLiveQueueCompleted = messageText?.startsWith('[LIVE_QUEUE_COMPLETED]')
  const isLiveQueueNotCompleted = messageText?.startsWith('[LIVE_QUEUE_NOT_COMPLETED]')
  const isLiveQueueUpdate = isLiveQueueCompleted || isLiveQueueNotCompleted

  const cleanMessageText = messageText
    ? messageText
        .replace('[LIVE_QUEUE_COMPLETED] ', '')
        .replace('[LIVE_QUEUE_NOT_COMPLETED] ', '')
        .replace('[LIVE_QUEUE_COMPLETED]', '')
        .replace('[LIVE_QUEUE_NOT_COMPLETED]', '')
    : ''

  const { data: order, loading } = useCardCache<ExtendedOrder>(
    'orders',
    orderId,
    () => axiosInstance.get(`/api/messages/orders/${orderId}`).then(r => r.data),
  )

  const handleConfirm = async () => {
    setConfirmed(true)
    localStorage.setItem(`confirmed_order_${orderId}`, 'true')
    try {
      await axiosInstance.patch(`/api/messages/${messageId}/confirm`)
    } catch (err) {
      console.error('Failed to confirm message:', err)
    }
  }

  const handleCardClick = () => {
    if (!isProductConcern || !user || user.role === 'customer') return
    const base = user.role === 'staff' || user.role === 'technician'
      ? '/staff'
      : user.role === 'inventory'
        ? '/inventory'
        : '/admin'
    navigate(`${base}/orders?search=${orderId}`)
  }

  if (loading) {
    return (
      <div 
        className={clsx(
          "w-full max-w-sm h-[480px] rounded-[32px] border",
          isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
        )}
      >
        <div className="flex flex-col h-full animate-pulse">
          <div className="p-6 border-b border-white/10">
            <div className="h-3 w-24 bg-slate-700/30 rounded mb-2" />
            <div className="h-6 w-48 bg-slate-700/30 rounded mb-2" />
            <div className="h-2 w-32 bg-slate-700/30 rounded" />
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="flex gap-4 items-start">
              <div className="h-16 w-16 bg-slate-700/30 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-slate-700/30 rounded" />
                <div className="h-2 w-1/2 bg-slate-700/30 rounded" />
              </div>
            </div>
            <div className="h-20 bg-slate-700/30 rounded-xl" />
          </div>
          <div className="p-6 border-t border-white/10 flex justify-end">
            <div className="h-12 w-36 bg-slate-700/30 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className={clsx(
        "w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border transition-all",
        isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
      )}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-0.5 w-8 bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-[4px] text-rose-500 uppercase italic">Transmission</span>
            </div>
            <h3 className="text-xl font-black italic uppercase leading-none">Order Offline</h3>
          </div>
          <div className="size-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <XCircle size={18} className="text-rose-500" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 italic">
            <p className="text-[10px] font-bold text-rose-400 leading-relaxed uppercase tracking-wider">
              Order "{orderId}" is no longer available or has been removed.
            </p>
          </div>
          <p className="text-[9px] font-medium opacity-50 uppercase tracking-widest leading-relaxed">
            The order record was deleted from the system. Please verify the order ID or create a new order.
          </p>
        </div>
        <div className="px-6 py-4 bg-slate-900/20 border-t border-white/10 flex justify-between items-center text-[8px] font-black uppercase text-slate-400 tracking-wider">
          <span>Status: DELETED</span>
          <span className="opacity-30">ID: {orderId}</span>
        </div>
      </div>
    )
  }

  if (isLiveQueueUpdate) {
    return (
      <div 
        onClick={handleCardClick}
        className={clsx(
          "w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border transition-all",
          user && user.role !== 'customer' && "cursor-pointer hover:shadow-lg",
          isLiveQueueCompleted 
            ? "border-emerald-500/30 bg-emerald-50/5 hover:border-emerald-500/50" 
            : "border-rose-500/30 bg-rose-50/5 hover:border-rose-500/50",
          isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
        )}
      >
        {/* Header */}
        <div className={clsx(
          "p-6 border-b",
          isCustomer ? "border-white/10" : "border-slate-100"
        )}>
          <div className="flex items-center justify-between mb-4">
            <span className={clsx(
              "text-[10px] font-black tracking-[4px] uppercase italic px-3 py-1 rounded-full",
              isLiveQueueCompleted 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "bg-rose-500/10 text-rose-500"
            )}>
              {isLiveQueueCompleted ? "Task Completed" : "Task Incomplete"}
            </span>
            <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest">ID: {orderId}</span>
          </div>

          <h3 className="text-xl font-black italic uppercase leading-tight mb-2">
            {isLiveQueueCompleted ? "Production finished successfully" : "Production task halted"}
          </h3>

          <div className="mt-3 text-[10px] font-bold space-y-1 opacity-70 uppercase tracking-wider">
            {order.customer_name && <p>Customer: <span className="font-black text-slate-900 dark:text-white">{order.customer_name}</span></p>}
            {order.company_name && <p>Company: <span className="font-black text-slate-900 dark:text-white">{order.company_name}</span></p>}
          </div>

          {/* Status Message / Reason Section */}
          <div className={clsx(
            "mt-4 rounded-2xl p-4 text-xs font-semibold leading-relaxed border",
            isLiveQueueCompleted 
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
              : "bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400"
          )}>
            <div className="text-[9px] font-black uppercase tracking-wider mb-1 opacity-70">
              {isLiveQueueCompleted ? "Completion Message:" : "Reason / Remarks:"}
            </div>
            <p className="italic font-bold">"{cleanMessageText}"</p>
          </div>
        </div>

        {/* Items */}
        <div className={clsx(
          "p-6 space-y-4 border-b",
          isCustomer ? "border-white/10" : "border-slate-100"
        )}>
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Payload Contents</div>
          {order.order_items.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <div className="h-16 w-16 bg-white rounded-xl overflow-hidden shrink-0 border border-slate-100">
                <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-black uppercase italic truncate">{item.productName}</h4>
                <p className="text-[9px] font-bold opacity-50 uppercase mt-1">
                  {item.variant.size}
                  {item.order_item_colors && item.order_item_colors.length > 0 && (
                    <> | {item.order_item_colors.map(c => c.name).join(', ')}</>
                  )}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1">
                     <p className="text-[8px] font-black tracking-widest text-emerald-500 uppercase leading-none mb-1">Total Items</p>
                     <p className="text-[12px] font-black italic">x{item.quantity}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase leading-none mb-1">Net Price</p>
                     <p className="text-[12px] font-mono font-black italic">₱{((item.variant.unitPrice) * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Address (If available) */}
        {order.shipping_address && (
          <div className="px-6 py-5 bg-white/5 opacity-80">
             <div className="flex items-center gap-2 mb-2">
               <MapPin size={12} className={isLiveQueueCompleted ? "text-emerald-500" : "text-rose-500"} />
               <span className="text-[10px] font-black tracking-widest uppercase">{order.shipping_address.label}</span>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-bold leading-relaxed">
                  {order.shipping_address.region} {order.shipping_address.province} {order.shipping_address.city} {order.shipping_address.barangay} {order.shipping_address.street} {order.shipping_address.postal_code}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Phone size={10} className={isLiveQueueCompleted ? "text-emerald-500" : "text-rose-500"} />
                  <p className="text-[10px] font-mono font-bold tracking-tighter">{order.shipping_address.contact_number}</p>
                </div>
             </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      onClick={handleCardClick}
      className={clsx(
        "w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border transition-all",
        isProductConcern && user && user.role !== 'customer' && "cursor-pointer hover:border-amber-400 hover:shadow-amber-500/10",
        isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
           <div className={clsx("h-0.5 w-8", isProductConcern ? "bg-amber-500" : "bg-pixs-mint")} />
           <span className={clsx("text-[10px] font-black tracking-[4px] uppercase italic", isProductConcern ? "text-amber-500" : "text-pixs-mint")}>
             {isProductConcern ? "Concern Flagged" : "Transmission Received"}
           </span>
        </div>
        <h3 className="text-xl font-black italic uppercase leading-none">
          {isProductConcern ? `Product concern for order ${orderId}` : "review your shipping address"}
        </h3>
        {isProductConcern ? (
          <div className="mt-3 text-[10px] font-bold space-y-1 opacity-70 uppercase tracking-wider">
            {order.customer_name && <p>Customer: <span className="font-black text-slate-900 dark:text-white">{order.customer_name}</span></p>}
            {order.company_name && <p>Company: <span className="font-black text-slate-900 dark:text-white">{order.company_name}</span></p>}
          </div>
        ) : (
          <p className="mt-2 text-[9px] font-bold opacity-50 uppercase tracking-widest">ID: {orderId}</p>
        )}
      </div>

      {/* Items */}
      <div className="p-6 space-y-4">
        {order.order_items.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-start">
            <div className="h-16 w-16 bg-white rounded-xl overflow-hidden shrink-0 border border-white/10">
              <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-black uppercase italic truncate">{item.productName}</h4>
              <p className="text-[9px] font-bold opacity-50 uppercase mt-1">
                {item.variant.size}
                {item.order_item_colors && item.order_item_colors.length > 0 && (
                  <> | {item.order_item_colors.map(c => c.name).join(', ')}</>
                )}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1">
                   <p className="text-[8px] font-black tracking-widest text-pixs-mint uppercase leading-none mb-1">Total Items</p>
                   <p className="text-[12px] font-black italic">x{item.quantity}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase leading-none mb-1">Net Price</p>
                   <p className="text-[12px] font-mono font-black italic">₱{((item.variant.unitPrice) * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Address */}
      {order.shipping_address && (
        <div className="px-6 py-5 bg-white/5 border-t border-b border-white/10">
           <div className="flex items-center gap-2 mb-4">
             <MapPin size={14} className="text-pixs-mint" />
             <span className="text-[10px] font-black tracking-widest uppercase">{order.shipping_address.label}</span>
           </div>
           <div className="space-y-1.5 opacity-80">
              <p className="text-[10px] font-bold leading-relaxed">
                {order.shipping_address.region} {order.shipping_address.province} {order.shipping_address.city} {order.shipping_address.barangay} {order.shipping_address.street} {order.shipping_address.postal_code}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Phone size={10} className="text-pixs-mint" />
                <p className="text-[10px] font-mono font-bold tracking-tighter">{order.shipping_address.contact_number}</p>
              </div>
           </div>
        </div>
      )}

      {/* Confirm Button */}
      {!isProductConcern && (
        <div className="p-6 flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={confirmed}
            className={clsx(
              "px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95",
              confirmed 
                ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                : "bg-pixs-mint text-slate-900 shadow-xl shadow-pixs-mint/20 hover:scale-[1.02]"
            )}
          >
            {confirmed ? (
              <>
                <Check size={18} />
                <span className="text-[11px] font-black uppercase italic tracking-widest">Address Confirmed</span>
              </>
            ) : (
              <span className="text-[11px] font-black uppercase italic tracking-widest">Confirm Information</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default OrderConfirmMessage
