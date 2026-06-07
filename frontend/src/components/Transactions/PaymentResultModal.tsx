import React from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Package,
  RefreshCcw,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PaymentResultModalProps {
  isOpen: boolean
  type: 'success' | 'failed'
  orderId?: string
  onClose: () => void
}

const PaymentResultModal: React.FC<PaymentResultModalProps> = ({
  isOpen,
  type,
  orderId,
  onClose,
}) => {
  const navigate = useNavigate()

  const isSuccess = type === 'success'

  const handlePrimary = () => {
    onClose()
    if (isSuccess) {
      navigate('/order')
    } else {
      navigate('/transactions')
    }
  }

  const handleSecondary = () => {
    onClose()
    if (!isSuccess) {
      navigate('/order')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
          />

          {/* Modal Card */}
          <m.div
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-900"
            >
              <X size={16} />
            </button>

            {/* Top Accent Banner */}
            <div
              className={`relative h-2 w-full ${
                isSuccess
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : 'bg-gradient-to-r from-rose-400 to-red-500'
              }`}
            />

            <div className="p-10 pt-8">
              {/* Icon */}
              <m.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
                className={`mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-500'
                    : 'bg-rose-50 text-rose-500'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 size={44} strokeWidth={2} />
                ) : (
                  <XCircle size={44} strokeWidth={2} />
                )}
              </m.div>

              {/* Label */}
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`h-0.5 w-6 ${
                    isSuccess ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`text-[9px] font-black tracking-[4px] uppercase ${
                    isSuccess ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {isSuccess ? 'Payment Received' : 'Transaction Failed'}
                </span>
              </div>

              {/* Title */}
              <h2 className="mb-3 text-3xl leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                {isSuccess ? (
                  <>
                    Order <span className="text-slate-400">Confirmed.</span>
                  </>
                ) : (
                  <>
                    Not <span className="text-slate-400">Completed.</span>
                  </>
                )}
              </h2>

              {/* Description */}
              <p className="mb-6 text-[11px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
                {isSuccess
                  ? 'Your payment was received. Your order is now queued for processing.'
                  : 'The transaction was cancelled or encountered an error. No charges were made. You can try again.'}
              </p>

              {/* Order ID Card */}
              {orderId && (
                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`mb-8 flex items-center gap-4 rounded-2xl border p-4 ${
                    isSuccess
                      ? 'border-emerald-100 bg-emerald-50/60'
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isSuccess ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}
                  >
                    <Package size={18} className={isSuccess ? 'text-emerald-600' : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black tracking-[4px] text-slate-400 uppercase italic">
                      Order Reference
                    </p>
                    <p className="mt-0.5 text-sm font-black tracking-tight text-slate-900 uppercase italic">
                      {orderId}
                    </p>
                  </div>

                  {isSuccess && (
                    <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-black tracking-widest text-emerald-600 uppercase">
                        Pending
                      </span>
                    </div>
                  )}
                </m.div>
              )}

              {/* Actions */}
              <div className={`flex gap-3 ${isSuccess ? 'flex-col' : 'flex-col sm:flex-row'}`}>
                <button
                  onClick={handlePrimary}
                  className={`flex flex-1 items-center justify-center gap-3 rounded-[24px] py-5 text-[11px] font-black tracking-widest uppercase italic shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${
                    isSuccess
                      ? 'bg-slate-900 text-white shadow-slate-200'
                      : 'bg-rose-500 text-white shadow-rose-200'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <Package size={16} />
                      Track My Order
                      <ArrowRight size={14} />
                    </>
                  ) : (
                    <>
                      <RefreshCcw size={16} />
                      Try Again
                    </>
                  )}
                </button>

                {!isSuccess && (
                  <button
                    onClick={handleSecondary}
                    className="flex flex-1 items-center justify-center gap-3 rounded-[24px] border border-slate-100 bg-white py-5 text-[11px] font-black tracking-widest text-slate-500 uppercase italic transition-all hover:bg-slate-50 active:scale-95"
                  >
                    View Orders
                  </button>
                )}

                {isSuccess && (
                  <button
                    onClick={onClose}
                    className="text-center text-[9px] font-black tracking-widest text-slate-300 uppercase italic transition-colors hover:text-slate-500"
                  >
                    Continue Browsing
                  </button>
                )}
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PaymentResultModal
