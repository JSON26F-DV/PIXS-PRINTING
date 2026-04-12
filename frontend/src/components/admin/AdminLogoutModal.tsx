import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, X } from 'lucide-react'

interface AdminLogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

const AdminLogoutModal: React.FC<AdminLogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="AdminLogoutModal w-full max-w-sm overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <LogOut size={24} />
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">
                Confirm Logout
              </h3>
              <p className="mt-2 text-[10px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
                Are you sure you want to terminate your current session? You
                will need to login again to access the dashboard.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-slate-100 py-4 text-[10px] font-black tracking-[2px] text-slate-600 uppercase transition-all hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm()}
                disabled={isLoading}
                className="flex-1 rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-[2px] text-white uppercase shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-70"
              >
                {isLoading ? 'Signing Out...' : 'Logout'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default AdminLogoutModal
