import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PurchaseSuccessModalProps {
  isOpen: boolean
  orderId: string
  totalAmount: number
  onClose: () => void
}

const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  isOpen,
  orderId,
  totalAmount,
  onClose,
}) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-8 text-center shadow-2xl md:p-12"
        >
          {/* Animated Success Icon */}
          <div className="mb-8 flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-pixs-mint/10"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pixs-mint shadow-lg shadow-pixs-mint/40">
                <CheckCircle2 size={32} className="text-white" />
              </div>
            </motion.div>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
              Order Confirmed.
            </h2>
            <p className="text-sm font-bold tracking-widest text-slate-400 uppercase italic">
              Your transaction has been successfully recorded.
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="mt-10 grid grid-cols-2 gap-4 rounded-[32px] border border-slate-50 bg-slate-50/50 p-6">
            <div className="text-left space-y-1">
              <span className="flex items-center gap-2 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                <Package size={10} /> Order ID
              </span>
              <p className="text-xs font-black text-slate-900">{orderId}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="flex items-center justify-end gap-2 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                Total Amount
              </span>
              <p className="text-xs font-black text-pixs-mint italic">PHP {totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-10 space-y-3">
            <button
              onClick={() => navigate(`/order-success/${orderId}`)}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-5 text-[11px] font-black tracking-[4px] text-white uppercase italic shadow-xl transition-all hover:bg-slate-800 active:scale-95"
            >
              Track Order Status
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic transition-colors hover:text-slate-900"
            >
              Back to Marketplace
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 opacity-30">
            <div className="h-1 w-1 rounded-full bg-slate-400" />
            <div className="h-1 w-1 rounded-full bg-slate-400" />
            <div className="h-1 w-1 rounded-full bg-slate-400" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default PurchaseSuccessModal
