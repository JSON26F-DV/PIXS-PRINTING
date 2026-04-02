import React from 'react';
import { X, Package, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-start justify-end sm:p-6"
        onClick={onClose}
      >
        <motion.div 
          initial={{ x: '100%', opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: '100%', opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full h-full sm:w-[400px] sm:h-auto sm:max-h-[85vh] bg-white sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 z-10">
             <div>
                <h2 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Alerts</h2>
                <p className="text-[10px] font-bold uppercase tracking-[4px] text-slate-400 mt-1">System Notifications</p>
             </div>
             <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <X size={18} />
             </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {/* Mock Active Order Alert */}
             <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex gap-4 relative overflow-hidden group hover:border-pixs-mint/50 transition-colors cursor-pointer">
                <div className="absolute top-0 right-0 w-20 h-20 bg-pixs-mint/5 rounded-bl-full -z-10 group-hover:bg-pixs-mint/10 transition-colors"></div>
                <div className="w-10 h-10 rounded-xl bg-pixs-mint/20 text-pixs-mint flex items-center justify-center shrink-0">
                   <Package size={18} />
                </div>
                <div>
                   <h3 className="text-sm font-black text-slate-900 italic">Screenplate Request</h3>
                   <p className="text-xs text-slate-500 mt-1">Your screenplate setup is being analyzed. We'll update the tracking in your orders.</p>
                   <p className="text-[10px] font-bold uppercase tracking-[2px] text-pixs-mint mt-3 italic">Processing</p>
                </div>
             </div>

             {/* Mock Completed Action */}
             <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex gap-4 cursor-pointer hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                   <CheckCircle2 size={18} />
                </div>
                <div>
                   <h3 className="text-sm font-black text-slate-900 italic">Delivery Dropped</h3>
                   <p className="text-xs text-slate-500 mt-1">Order #ORD-9892 was successfully completed by courier.</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-3">2 Days Ago</p>
                </div>
             </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 z-10">
             <button onClick={onClose} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[4px] bg-slate-900 text-white italic hover:scale-[1.02] active:scale-[0.98] transition-transform">
               Close Panel
             </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationModal;
