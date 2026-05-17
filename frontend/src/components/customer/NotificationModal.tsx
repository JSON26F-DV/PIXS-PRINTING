import React, { useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, Info, Check } from 'lucide-react'
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
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore()

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
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-60">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Check size={24} className="text-slate-400" />
                </div>
                <p className="mt-4 text-xs font-black tracking-widest text-slate-400 uppercase">
                  No New Alerts
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
                    className={`group relative flex cursor-pointer gap-4 overflow-hidden rounded-2xl border p-4 shadow-sm transition-colors ${
                      isUnread
                        ? 'border-pixs-mint/50 bg-white shadow-pixs-mint/10'
                        : 'border-slate-100 bg-slate-50 opacity-80'
                    } hover:border-pixs-mint/40`}
                  >
                    {isUnread && (
                      <div className="bg-pixs-mint/5 absolute top-0 right-0 -z-10 h-20 w-20 rounded-bl-full"></div>
                    )}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 italic">
                        {notif.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {notif.message}
                      </p>
                      <p className="mt-3 text-[10px] font-bold tracking-[2px] text-slate-400 uppercase italic">
                        {format(new Date(notif.timestamp), 'MMM dd, hh:mm a')}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="z-10 border-t border-slate-100 bg-slate-50 p-4">
            <button
              onClick={() => markAllAsRead()}
              className="mb-2 w-full rounded-2xl bg-white py-4 text-[10px] font-black tracking-[4px] text-slate-700 shadow-sm uppercase italic transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Mark All As Read
            </button>
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
