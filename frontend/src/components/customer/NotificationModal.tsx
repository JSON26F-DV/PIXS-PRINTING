import React from 'react'
import { X, Package, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-end bg-slate-900/60 backdrop-blur-md sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%', opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: '100%', opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:w-[400px] sm:rounded-[32px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6">
            <div>
              <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                Alerts
              </h2>
              <p className="mt-1 text-[10px] font-bold tracking-[4px] text-slate-400 uppercase">
                System Notifications
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {/* Mock Active Order Alert */}
            <div className="group hover:border-pixs-mint/50 relative flex cursor-pointer gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors">
              <div className="bg-pixs-mint/5 group-hover:bg-pixs-mint/10 absolute top-0 right-0 -z-10 h-20 w-20 rounded-bl-full transition-colors"></div>
              <div className="bg-pixs-mint/20 text-pixs-mint flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 italic">
                  Screenplate Request
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Your screenplate setup is being analyzed. We'll update the
                  tracking in your orders.
                </p>
                <p className="text-pixs-mint mt-3 text-[10px] font-bold tracking-[2px] uppercase italic">
                  Processing
                </p>
              </div>
            </div>

            {/* Mock Completed Action */}
            <div className="flex cursor-pointer gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:border-slate-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 italic">
                  Delivery Dropped
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Order #ORD-9892 was successfully completed by courier.
                </p>
                <p className="mt-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  2 Days Ago
                </p>
              </div>
            </div>
          </div>

          <div className="z-10 border-t border-slate-100 bg-slate-50 p-4">
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-[4px] text-white uppercase italic transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Close Panel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default NotificationModal
