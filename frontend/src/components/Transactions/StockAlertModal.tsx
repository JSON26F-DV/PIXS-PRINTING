import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Home, PackageX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface StockAlertItem {
  name: string
  requested: number
  available: number
}

interface StockAlertModalProps {
  isOpen: boolean
  items: StockAlertItem[]
  onClose: () => void
}

const StockAlertModal: React.FC<StockAlertModalProps> = ({
  isOpen,
  items,
  onClose,
}) => {
  const navigate = useNavigate()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="StockAlertModal fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => navigate('/homepage')}
            className="StockAlertOverlay absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 100, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 100, rotateX: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="StockAlertContainer relative z-10 w-full max-w-lg overflow-hidden rounded-[44px] border border-amber-500/20 bg-slate-900 shadow-[0_0_80px_rgba(251,191,36,0.1)]"
          >
            <div className="space-y-6 p-10">
              <div className="flex items-start gap-4">
                <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4">
                  <AlertTriangle size={32} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-4xl leading-none font-black tracking-tighter text-white uppercase italic">
                    STOCK <br /> ALERT.
                  </h2>
                  <p className="mt-4 text-[10px] font-bold tracking-[4px] text-amber-400 uppercase italic opacity-80">
                    INSUFFICIENT INVENTORY DETECTED
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-[32px] border border-white/5 bg-slate-950/50 p-6">
                <div className="flex items-center gap-3 text-[9px] font-black tracking-widest text-slate-500 uppercase italic">
                  <PackageX size={14} className="text-amber-400" />
                  The following items have insufficient stock:
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3"
                    >
                      <span className="text-xs font-black tracking-wide text-white uppercase italic">
                        {item.name}
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-amber-400">
                          Requested: {item.requested}
                        </span>
                        <span className="mx-1 text-slate-600">|</span>
                        <span className="text-[10px] font-bold text-rose-400">
                          Available: {item.available}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/homepage')}
                className="group flex h-20 w-full items-center justify-center gap-3 rounded-[32px] bg-amber-600 shadow-2xl transition-all hover:bg-amber-500 active:scale-95"
              >
                <Home size={22} className="text-white/60 transition-transform group-hover:scale-110" />
                <span className="text-sm font-black tracking-[4px] text-white uppercase italic">
                  GO BACK TO HOMEPAGE
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 bg-slate-950 px-10 py-3">
              <span className="text-[8px] font-black tracking-[6px] text-slate-600 uppercase italic">
                PIXS INVENTORY SYSTEM V.1.02
              </span>
              <div className="flex gap-4">
                <div className="h-1 w-6 rounded-full bg-amber-500/30" />
                <div className="h-1 w-2 rounded-full bg-slate-800" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default StockAlertModal
