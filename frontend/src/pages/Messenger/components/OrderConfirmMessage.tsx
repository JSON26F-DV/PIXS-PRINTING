import React, { useEffect, useState } from 'react'
import { Check, MapPin, Phone } from 'lucide-react'
import { orderApi } from '../../../api/orders.api'
import type { Order } from '../../Order/components/OrderCard'
import { clsx } from 'clsx'
import axiosInstance from '../../../lib/axiosInstance'

interface OrderConfirmMessageProps {
  messageId: string
  orderId: string
  isCustomer: boolean
  isConfirm?: number
}

const OrderConfirmMessage: React.FC<OrderConfirmMessageProps> = ({ messageId, orderId, isCustomer, isConfirm }) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(() => {
    return isConfirm === 1 || localStorage.getItem(`confirmed_order_${orderId}`) === 'true'
  })

  useEffect(() => {
    let mounted = true
    orderApi.getOrderById(orderId)
      .then(data => {
        if (mounted) {
          setOrder(data)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('Failed to fetch order for message:', err)
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [orderId])

  const handleConfirm = async () => {
    setConfirmed(true)
    localStorage.setItem(`confirmed_order_${orderId}`, 'true')
    try {
      await axiosInstance.patch(`/api/messages/${messageId}/confirm`)
    } catch (err) {
      console.error('Failed to confirm message:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
      </div>
    )
  }

  if (!order) return <div className="p-4 text-[10px] uppercase font-black text-rose-500">Order Data Corrupted or Deleted</div>

  return (
    <div className={clsx(
      "w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border transition-all",
      isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
           <div className="h-0.5 w-8 bg-pixs-mint" />
           <span className="text-[10px] font-black tracking-[4px] text-pixs-mint uppercase italic">Transmission Received</span>
        </div>
        <h3 className="text-xl font-black italic uppercase leading-none">review your shipping address</h3>
        <p className="mt-2 text-[9px] font-bold opacity-50 uppercase tracking-widest">ID: {orderId}</p>
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
    </div>
  )
}

export default OrderConfirmMessage
