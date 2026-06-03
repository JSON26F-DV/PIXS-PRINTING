import React from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Receipt, MapPin, CreditCard, Truck, CheckCircle2, Loader2 } from 'lucide-react'
import BoxFallback from '../common/BoxFallback'
import type { IOrderData } from '../../pages/Transactions/Transactions'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isProcessing: boolean
  orderData: IOrderData | null
}

const OrderReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  orderData,
}) => {
  if (!isOpen || !orderData) return null

  const { products, shipping_address, payment_method, delivery_method, total_amount, total_discount_amount } = orderData

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-50 p-6 md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-pixs-mint shadow-lg">
                <Receipt size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">Final Review</h2>
                <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">Confirm your order summary</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
            {/* Products List */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">Items in Node</h3>
              <div className="space-y-3">
                {products.map((item: IOrderData['products'][number], idx: number) => (
                  <div key={idx} className="flex items-center gap-4 rounded-2xl border border-slate-50 bg-slate-50/30 p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white bg-white shadow-sm">
                      {item.product_image ? (
                        <img 
                          src={`/images/products/${item.product_image}`} 
                          className="h-full w-full object-cover" 
                          alt={item.product_name} 
                        />
                      ) : (
                        <BoxFallback />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate text-xs font-black tracking-tight text-slate-900 uppercase italic">{item.product_name}</h4>
                      <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        {item.quantity} Unit{item.quantity > 1 ? 's' : ''}
                      </p>
                      {item.screenplate_id && (
                        <span className="mt-1 flex items-center gap-1 text-[8px] font-black tracking-widest text-pixs-mint uppercase">
                          Custom Plate Configured
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 italic">PHP {(item.quantity * item.unit_price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping & Payment */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                    <MapPin size={12} /> Shipping Destination
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-black text-slate-900 uppercase italic">{shipping_address.full_name}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase">{shipping_address.phone}</p>
                    <p className="mt-2 text-[10px] leading-relaxed text-slate-400 uppercase">
                      {shipping_address.street}, {shipping_address.barangay}, {shipping_address.city}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                    <CreditCard size={12} /> Payment Method
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4">
                    <div className="text-pixs-mint"><CreditCard size={16} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase italic">{payment_method?.type}</p>
                      <p className="text-[9px] font-bold text-slate-400">{payment_method?.masked_number}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery & Pricing */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic">
                    <Truck size={12} /> Delivery via
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs font-black text-slate-900 uppercase italic">{delivery_method?.name}</p>
                  </div>
                </div>

                <div className="rounded-[24px] bg-slate-900 p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between opacity-60 text-[10px] font-black tracking-widest uppercase mb-4">
                    <span>Final Amount</span>
                    <span>Secure Node</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter italic">PHP {total_amount.toLocaleString()}</h3>
                  {total_discount_amount > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-emerald-400 uppercase italic">
                      Voucher Applied: -PHP {total_discount_amount.toLocaleString()}
                    </div>
                  ) }
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-50 bg-slate-50/30 p-6 md:px-8">
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 py-4 text-[11px] font-black tracking-[4px] text-white uppercase italic shadow-lg transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin text-pixs-mint" />
                  Processing Order...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} className="text-pixs-mint" />
                  Confirm and Place Order
                </>
              )}
            </button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  )
}

export default OrderReceiptModal
