import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Landmark, X } from 'lucide-react'

interface PaymentCodeAlertModalProps {
  isOpen: boolean
  message: string
  onClose: () => void
}

const PaymentCodeAlertModal: React.FC<PaymentCodeAlertModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="PaymentCodeAlertModal fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="PaymentCodeAlertOverlay absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 100, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 100, rotateX: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="PaymentCodeAlertContainer relative z-10 w-full max-w-md overflow-hidden rounded-[44px] border border-rose-500/20 bg-slate-900 shadow-[0_0_80px_rgba(244,63,94,0.1)]"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="space-y-6 p-10">
              <div className="flex items-start gap-4">
                <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-4">
                  <AlertCircle size={32} className="text-rose-500" />
                </div>
                <div>
                  <h2 className="text-4xl leading-none font-black tracking-tighter text-white uppercase italic">
                    PAYMENT <br /> CODE ERROR.
                  </h2>
                  <p className="mt-4 text-[10px] font-bold tracking-[4px] text-rose-400 uppercase italic opacity-80">
                    TRANSACTION DECLINED
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-[32px] border border-white/5 bg-slate-950/50 p-6">
                <div className="flex items-center gap-3 text-[9px] font-black tracking-widest text-slate-500 uppercase italic">
                  <Landmark size={14} className="text-rose-500" />
                  ERROR DETAILS:
                </div>
                <p className="text-sm font-black tracking-wide text-white uppercase italic leading-relaxed">
                  {message || 'THE ENTERED CODE IS NOT VALID OR HAS BEEN RETIRED.'}
                </p>
              </div>

              <button
                onClick={onClose}
                className="group flex h-20 w-full items-center justify-center gap-3 rounded-[32px] bg-rose-600 shadow-2xl transition-all hover:bg-rose-500 active:scale-95"
              >
                <span className="text-sm font-black tracking-[4px] text-white uppercase italic">
                  TRY ANOTHER CODE
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 bg-slate-950 px-10 py-3">
              <span className="text-[8px] font-black tracking-[6px] text-slate-600 uppercase italic">
                PIXS TRANSACTION SECURITY
              </span>
              <div className="flex gap-4">
                <div className="h-1 w-6 rounded-full bg-rose-500/30" />
                <div className="h-1 w-2 rounded-full bg-slate-800" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PaymentCodeAlertModal
