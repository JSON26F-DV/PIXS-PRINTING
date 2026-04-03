import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

interface AdminLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const AdminLogoutModal: React.FC<AdminLogoutModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="AdminLogoutModal w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                <LogOut size={24} />
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Confirm Logout</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 leading-relaxed">
                Are you sure you want to terminate your current session? You will need to login again to access the dashboard.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-[2px] transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => onConfirm()}
                disabled={isLoading}
                className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-[10px] uppercase tracking-[2px] transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-70"
              >
                {isLoading ? "Signing Out..." : "Logout"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminLogoutModal;
