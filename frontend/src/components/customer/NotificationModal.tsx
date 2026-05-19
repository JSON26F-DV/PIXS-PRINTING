import React, { useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, Info, Check, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useNotificationStore } from '../../store/useNotificationStore'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    clearNotification,
    clearAllNotifications 
  } = useNotificationStore()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-end bg-slate-900/60 backdrop-blur-md sm:p-6 md:pt-24"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%', opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: '100%', opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:w-[400px] sm:rounded-[44px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50 p-8">
            <div>
              <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                Alerts
              </h2>
              <p className="mt-1 text-[10px] font-bold tracking-[4px] text-slate-400 uppercase">
                System Notifications
              </p>
            </div>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <button
                  onClick={() => clearAllNotifications()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-500 transition-all hover:bg-rose-50 active:scale-95"
                  title="Clear All Protocol"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-60">
                <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-slate-100">
                  <Check size={32} className="text-slate-300" strokeWidth={3} />
                </div>
                <p className="mt-6 text-[10px] font-black tracking-[5px] text-slate-400 uppercase italic">
                  No Active Segments
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.isRead
                let Icon = Info
                let colorClass = 'text-blue-500 bg-blue-50'
                
                if (notif.type === 'success') {
                  Icon = CheckCircle2
                  colorClass = 'text-pixs-mint bg-pixs-mint/20'
                } else if (notif.type === 'warning') {
                  Icon = AlertCircle
                  colorClass = 'text-orange-500 bg-orange-50'
                } else if (notif.type === 'error') {
                  Icon = X
                  colorClass = 'text-rose-500 bg-rose-50'
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className={`group relative flex cursor-pointer gap-4 overflow-hidden rounded-[24px] border p-5 shadow-sm transition-all ${
                      isUnread
                        ? 'border-pixs-mint/30 bg-white shadow-pixs-mint/10'
                        : 'border-slate-50 bg-slate-50/50 opacity-80'
                    } hover:border-pixs-mint/40 hover:shadow-md`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colorClass} transition-transform group-hover:scale-110`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 pr-6">
                      <h3 className="text-sm font-black text-slate-900 italic uppercase tracking-tight">
                        {notif.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {notif.message}
                      </p>
                      <p className="mt-4 text-[9px] font-black tracking-[2px] text-slate-400 uppercase italic">
                        {format(new Date(notif.timestamp), 'MMM dd, hh:mm a')}
                      </p>
                    </div>
                    
                    {/* Individual Clear Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearNotification(notif.id)
                      }}
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          <div className="z-10 border-t border-slate-100 bg-slate-50/50 p-8">
            <button
              onClick={() => markAllAsRead()}
              className="mb-4 w-full rounded-2xl bg-white py-5 text-[10px] font-black tracking-[4px] text-slate-900 shadow-sm uppercase italic transition-all hover:bg-pixs-mint active:scale-95"
            >
              Mark All As Read
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-slate-900 py-5 text-[10px] font-black tracking-[4px] text-white uppercase italic shadow-xl transition-all hover:scale-[1.02] active:scale-95"
            >
              Terminate View
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default NotificationModal
