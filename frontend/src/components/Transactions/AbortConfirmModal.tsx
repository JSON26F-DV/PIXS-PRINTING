import React from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Terminal, Power } from 'lucide-react'

interface AbortConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const AbortConfirmModal: React.FC<AbortConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="AbortConfirmModal fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Industrial Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="AbortConfirmOverlay absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          {/* Machine-Style Modal Container */}
          <m.div
            initial={{ opacity: 0, y: 100, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 100, rotateX: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="AbortConfirmContainer relative z-10 w-full max-w-2xl overflow-hidden rounded-[44px] border border-slate-800 bg-slate-900 shadow-[0_0_80px_rgba(244,63,94,0.15)]"
          >
            {/* Terminal Header Decoration */}
            <div className="flex h-12 w-full items-center justify-between border-b border-white/5 bg-slate-800/50 px-8">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                  <div className="h-2 w-2 rounded-full bg-slate-700" />
                  <div className="h-2 w-2 rounded-full bg-slate-700" />
                </div>
                <span className="text-[10px] font-black tracking-[4px] text-slate-500 uppercase italic">
                  Critical System Protocol: 0x882
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 transition-colors hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px]">
              {/* Left Side: System Information */}
              <div className="space-y-8 border-r border-white/5 p-10">
                <div className="flex items-start gap-4">
                  <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-4">
                    <AlertTriangle size={32} className="text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-4xl leading-none font-black tracking-tighter text-white uppercase italic">
                      ABORT <br /> TRANSACTION?
                    </h2>
                    <p className="mt-4 text-[10px] font-bold tracking-[4px] text-rose-400 uppercase italic opacity-80">
                      WARNING: SEQUENCE TERMINATION DETECTED
                    </p>
                  </div>
                </div>

                <div className="space-y-4 rounded-[32px] border border-white/5 bg-slate-950/50 p-6">
                  <div className="flex items-center gap-3 text-[9px] font-black tracking-widest text-slate-500 uppercase italic">
                    <Terminal size={14} className="text-pixs-mint" />
                    Data Loss Impact Node
                  </div>
                  <p className="text-xs leading-relaxed font-bold text-slate-400 italic">
                    By proceeding with this reversal, the following identifiers
                    will be purged from the active session terminal:
                  </p>
                  <ul className="space-y-2 border-l border-slate-800 pl-2 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                    <li className="flex items-center gap-2">
                      <span className="bg-pixs-mint h-1 w-1 rounded-full" />
                      Active Checkout Configuration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="bg-pixs-mint h-1 w-1 rounded-full" />
                      Validated Delivery Meta Data
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="bg-pixs-mint h-1 w-1 rounded-full" />
                      Security Session Token Hash
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Side: Execution Controls */}
              <div className="flex flex-col justify-center gap-6 bg-slate-950/50 p-10">
                <button
                  onClick={onConfirm}
                  className="ExecutionButton group relative h-32 w-full overflow-hidden rounded-[32px] bg-rose-600 shadow-2xl transition-all hover:bg-rose-500 active:scale-95"
                >
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 transform p-4 opacity-20 transition-transform group-hover:scale-110">
                    <Power size={44} className="text-white" />
                  </div>

                  <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center">
                    <span className="mb-2 text-[10px] font-black tracking-[3px] text-white/60 uppercase italic">
                      CONFIRM
                    </span>
                    <span className="text-sm font-black tracking-[4px] text-white uppercase italic">
                      YES, ABORT <br /> SEQUENCE
                    </span>
                  </div>
                </button>

                <button
                  onClick={onClose}
                  className="CancelButton flex h-24 w-full flex-col items-center justify-center rounded-[32px] border-2 border-slate-800 bg-transparent px-6 text-center transition-all hover:border-slate-700 hover:bg-slate-800 active:scale-95"
                >
                  <span className="mb-1 text-[9px] font-black tracking-[3px] text-slate-500 uppercase italic">
                    REVERSION
                  </span>
                  <span className="text-[10px] font-black tracking-[3px] text-slate-300 uppercase italic">
                    KEEP SESSION <br /> ACTIVE
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Footer Protocol */}
            <div className="flex items-center justify-between border-t border-white/5 bg-slate-950 px-10 py-3">
              <span className="text-[8px] font-black tracking-[6px] text-slate-600 uppercase italic">
                PIXS INDUSTRIAL TERMINAL V.1.02
              </span>
              <div className="flex gap-4">
                <div className="h-1 w-6 rounded-full bg-rose-500/30" />
                <div className="h-1 w-2 rounded-full bg-slate-800" />
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AbortConfirmModal
