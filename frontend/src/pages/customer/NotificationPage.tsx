import React, { useEffect, useState, useCallback } from 'react'
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Check,
  Trash2,
  Mail,
  MailOpen,
  Inbox,
  ChevronLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import { useNotificationStore } from '../../store/useNotificationStore'
import { clsx } from 'clsx'

type FilterTab = 'all' | 'unread' | 'info' | 'success' | 'warning' | 'error'

const filterTabs: { key: FilterTab; label: string; icon: React.ReactNode }[] =
  [
    { key: 'all', label: 'All', icon: <Inbox size={16} /> },
    { key: 'unread', label: 'Unread', icon: <Mail size={16} /> },
    { key: 'info', label: 'Info', icon: <Info size={16} /> },
    { key: 'success', label: 'Success', icon: <CheckCircle2 size={16} /> },
    { key: 'warning', label: 'Warning', icon: <AlertCircle size={16} /> },
    { key: 'error', label: 'Error', icon: <X size={16} /> },
  ]

const NotificationPage: React.FC = () => {
  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotificationStore()

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchNotifications()
      setLoading(false)
    }
    load()
  }, [fetchNotifications])

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unread') return !n.isRead
    return n.type === activeFilter
  })

  const selected = notifications.find((n) => n.id === selectedId)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} className="text-emerald-500" />
      case 'warning':
        return <AlertCircle size={20} className="text-orange-500" />
      case 'error':
        return <X size={20} className="text-rose-500" />
      default:
        return <Info size={20} className="text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200'
      case 'warning':
        return 'bg-orange-50 text-orange-600 border-orange-200'
      case 'error':
        return 'bg-rose-50 text-rose-600 border-rose-200'
      default:
        return 'bg-blue-50 text-blue-600 border-blue-200'
    }
  }

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id)
      const n = notifications.find((item) => item.id === id)
      if (n && !n.isRead) {
        markAsRead(id)
      }
    },
    [notifications, markAsRead],
  )

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center bg-slate-50 p-4 pt-24 md:p-8">
      <div className="w-full max-w-[1040px] overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-200 md:rounded-[40px]">
        <div className="flex flex-col md:flex-row">
          {/* Left Sidebar - Filters */}
          <div className="w-full border-b border-slate-100 md:w-[220px] md:border-b-0 md:border-r md:border-slate-100">
            <div className="border-b border-slate-100 p-6">
              <div className="mb-1 flex items-center gap-2">
                <Bell size={18} className="text-slate-900" />
                <h2 className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                  Alerts
                </h2>
              </div>
              <p className="text-[10px] font-bold tracking-[3px] text-slate-400 uppercase italic">
                Notification Center
              </p>
            </div>
            <div className="flex flex-row gap-1 overflow-x-auto p-3 md:flex-col">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveFilter(tab.key)
                    setSelectedId(null)
                  }}
                  className={clsx(
                    'flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-all md:px-3',
                    activeFilter === tab.key
                      ? 'bg-[#1a73e8]/10 text-[#1a73e8]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                  )}
                >
                  {tab.icon}
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="hidden border-t border-slate-100 p-4 md:block">
              {notifications.length > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-[10px] font-black tracking-[2px] text-slate-900 uppercase italic transition-all hover:bg-[#1a73e8]/10 hover:text-[#1a73e8]"
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="flex min-h-[500px] flex-1 flex-col md:flex-row">
            {/* Notification List */}
            <div
              className={clsx(
                'flex flex-col border-r border-slate-100',
                selectedId ? 'hidden md:flex md:w-1/2' : 'w-full',
              )}
            >
              {/* List Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    {activeFilter === 'all'
                      ? 'All Notifications'
                      : activeFilter === 'unread'
                        ? 'Unread'
                        : activeFilter.charAt(0).toUpperCase() +
                          activeFilter.slice(1)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    {filtered.length}
                  </span>
                </div>
                <button
                  onClick={() => clearAllNotifications()}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-rose-500 transition-colors hover:bg-rose-50"
                >
                  <Trash2 size={12} />
                  Clear All
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                      <Bell
                        size={20}
                        className="animate-pulse text-slate-300"
                      />
                    </div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-60">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-100">
                      <Check
                        size={28}
                        className="text-slate-300"
                        strokeWidth={3}
                      />
                    </div>
                    <p className="mt-4 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
                      No notifications
                    </p>
                  </div>
                ) : (
                  filtered.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleSelect(n.id)}
                      className={clsx(
                        'group relative w-full border-b border-slate-50 px-6 py-4 text-left transition-all hover:bg-slate-50',
                        selectedId === n.id && 'bg-[#1a73e8]/5',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={clsx(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            !n.isRead && 'ring-2 ring-[#1a73e8]/20',
                          )}
                        >
                          <div
                            className={clsx(
                              'flex h-10 w-10 items-center justify-center rounded-xl',
                              n.type === 'success' && 'bg-emerald-50',
                              n.type === 'warning' && 'bg-orange-50',
                              n.type === 'error' && 'bg-rose-50',
                              n.type !== 'success' &&
                                n.type !== 'warning' &&
                                n.type !== 'error' &&
                                'bg-blue-50',
                            )}
                          >
                            {getTypeIcon(n.type)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={clsx(
                                'truncate text-sm font-bold text-slate-900',
                                !n.isRead && 'text-slate-900',
                                n.isRead && 'text-slate-500',
                              )}
                            >
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <div className="h-2 w-2 shrink-0 rounded-full bg-[#1a73e8]" />
                            )}
                          </div>
                          <p
                            className={clsx(
                              'mt-0.5 line-clamp-2 text-xs',
                              !n.isRead
                                ? 'font-medium text-slate-600'
                                : 'text-slate-400',
                            )}
                          >
                            {n.message}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] font-medium text-slate-400">
                              {format(
                                new Date(n.timestamp),
                                'MMM dd, hh:mm a',
                              )}
                            </span>
                            <span
                              className={clsx(
                                'rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                                getTypeColor(n.type),
                              )}
                            >
                              {n.type}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            clearNotification(n.id)
                          }}
                          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div
              className={clsx(
                'flex flex-col',
                selectedId ? 'w-full md:w-1/2' : 'hidden',
              )}
            >
              {selected ? (
                <>
                  <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 md:hidden">
                    <button
                      onClick={() => setSelectedId(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      Notification Detail
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6 flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50">
                        {getTypeIcon(selected.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">
                          {selected.title}
                        </h3>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <span
                            className={clsx(
                              'rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                              getTypeColor(selected.type),
                            )}
                          >
                            {selected.type}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {format(
                              new Date(selected.timestamp),
                              'MMM dd, yyyy hh:mm a',
                            )}
                          </span>
                          {!selected.isRead && (
                            <span className="flex items-center gap-1 rounded-full bg-[#1a73e8]/10 px-2.5 py-1 text-[10px] font-bold text-[#1a73e8]">
                              <Mail size={10} />
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-6">
                      <p className="text-sm leading-relaxed text-slate-600">
                        {selected.message}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                      {!selected.isRead && (
                        <button
                          onClick={() => markAsRead(selected.id)}
                          className="flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1557b0] active:scale-95"
                        >
                          <MailOpen size={14} />
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => clearNotification(selected.id)}
                        className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold text-rose-500 transition-all hover:bg-rose-50 active:scale-95"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex hidden h-full items-center justify-center md:flex">
                  <div className="text-center opacity-40">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-100">
                      <MailOpen
                        size={32}
                        className="text-slate-300"
                        strokeWidth={1.5}
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-400">
                      Select a notification
                    </p>
                    <p className="mt-1 text-[10px] font-medium tracking-wider text-slate-300">
                      to view its details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Mark All Read */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 md:hidden">
          <button
            onClick={() => markAllAsRead()}
            className="w-full rounded-2xl bg-white py-3 text-[10px] font-black tracking-[3px] text-slate-900 uppercase italic shadow-sm transition-all hover:bg-[#1a73e8] hover:text-white active:scale-95"
          >
            Mark All As Read
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationPage
