import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Terminal, Power } from 'lucide-react';

interface AbortConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const AbortConfirmModal: React.FC<AbortConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="AbortConfirmModal fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Industrial Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="AbortConfirmOverlay absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />

          {/* Machine-Style Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 100, rotateX: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="AbortConfirmContainer relative z-10 w-full max-w-2xl overflow-hidden rounded-[44px] bg-slate-900 shadow-[0_0_80px_rgba(244,63,94,0.15)] border border-slate-800"
          >
            {/* Terminal Header Decoration */}
            <div className="h-12 w-full bg-slate-800/50 flex items-center justify-between px-8 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-500 italic">
                  Critical System Protocol: 0x882
                </span>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px]">
              
              {/* Left Side: System Information */}
              <div className="p-10 space-y-8 border-r border-white/5">
                <div className="flex items-start gap-4">
                  <div className="bg-rose-500/10 p-4 rounded-[24px] border border-rose-500/20">
                    <AlertTriangle size={32} className="text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                      ABORT <br /> TRANSACTION?
                    </h2>
                    <p className="mt-4 text-[10px] font-bold text-rose-400 uppercase tracking-[4px] italic opacity-80">
                      WARNING: SEQUENCE TERMINATION DETECTED
                    </p>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-950/50 p-6 rounded-[32px] border border-white/5">
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                    <Terminal size={14} className="text-pixs-mint" />
                    Data Loss Impact Node
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-bold italic">
                    By proceeding with this reversal, the following identifiers will be purged from the active session terminal:
                  </p>
                  <ul className="text-[9px] font-black text-slate-500 uppercase tracking-widest space-y-2 pl-2 border-l border-slate-800">
                    <li className="flex items-center gap-2">
                       <span className="w-1 h-1 bg-pixs-mint rounded-full" />
                       Active Checkout Configuration
                    </li>
                    <li className="flex items-center gap-2">
                       <span className="w-1 h-1 bg-pixs-mint rounded-full" />
                       Validated Delivery Meta Data
                    </li>
                    <li className="flex items-center gap-2">
                       <span className="w-1 h-1 bg-pixs-mint rounded-full" />
                       Security Session Token Hash
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Side: Execution Controls */}
              <div className="p-10 bg-slate-950/50 flex flex-col justify-center gap-6">
                
                <button
                  onClick={onConfirm}
                  className="ExecutionButton group relative h-32 w-full rounded-[32px] bg-rose-600 overflow-hidden shadow-2xl transition-all hover:bg-rose-500 active:scale-95"
                >
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform">
                     <Power size={44} className="text-white" />
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-white/60 mb-2 italic">
                      CONFIRM
                    </span>
                    <span className="text-sm font-black uppercase italic tracking-[4px] text-white">
                      YES, ABORT <br /> SEQUENCE
                    </span>
                  </div>
                </button>

                <button
                  onClick={onClose}
                  className="CancelButton h-24 w-full rounded-[32px] border-2 border-slate-800 bg-transparent flex flex-col items-center justify-center text-center transition-all hover:bg-slate-800 hover:border-slate-700 active:scale-95 px-6"
                >
                  <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-500 mb-1 italic">
                    REVERSION
                  </span>
                  <span className="text-[10px] font-black uppercase italic tracking-[3px] text-slate-300">
                    KEEP SESSION <br /> ACTIVE
                  </span>
                </button>

              </div>

            </div>

            {/* Bottom Footer Protocol */}
            <div className="bg-slate-950 py-3 px-10 border-t border-white/5 flex justify-between items-center">
               <span className="text-[8px] font-black uppercase tracking-[6px] text-slate-600 italic">
                  PIXS INDUSTRIAL TERMINAL V.1.02
               </span>
               <div className="flex gap-4">
                  <div className="h-1 w-6 bg-rose-500/30 rounded-full" />
                  <div className="h-1 w-2 bg-slate-800 rounded-full" />
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AbortConfirmModal;
