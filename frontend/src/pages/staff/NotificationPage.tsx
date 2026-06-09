import React, { useEffect, useState, useCallback } from 'react'
import {
  Bell,
  Check,
  Trash2,
  Mail,
  MailOpen,
  Inbox,
  ChevronLeft,
  MessageSquare,
  AlertTriangle,
  Package,
  FileText,
  Clock,
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContextInstance'
import type { INotification } from '../../types/notification'
import { clsx } from 'clsx'

type FilterTab =
  | 'all'
  | 'unread'
  | 'message'
  | 'complaint'
  | 'low_stock'
  | 'order_update'

const filterTabs: {
  key: FilterTab
  label: string
  icon: React.ReactNode
}[] = [
  { key: 'all', label: 'All', icon: <Inbox size={16} /> },
  { key: 'unread', label: 'Unread', icon: <Mail size={16} /> },
  { key: 'message', label: 'Messages', icon: <MessageSquare size={16} /> },
  { key: 'complaint', label: 'Complaints', icon: <AlertTriangle size={16} /> },
  { key: 'low_stock', label: 'Low Stock', icon: <Package size={16} /> },
  { key: 'order_update', label: 'Orders', icon: <FileText size={16} /> },
]

const NotificationPage: React.FC = () => {
  const { notifications, refreshNotifications, markAsRead, markAllAsRead } =
    useNotifications()

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await refreshNotifications()
      setLoading(false)
    }
    load()
  }, [refreshNotifications])

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unread') return !n.isRead
    return n.type === activeFilter
  })

  const selected = notifications.find((n) => n.id === selectedId)

  const getTypeIcon = (type: INotification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={20} className="text-blue-500" />
      case 'complaint':
        return <AlertTriangle size={20} className="text-rose-500" />
      case 'low_stock':
        return <Package size={20} className="text-amber-500" />
      case 'order_update':
        return <FileText size={20} className="text-emerald-500" />
    }
  }

  const getTypeColor = (type: INotification['type']) => {
    switch (type) {
      case 'message':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'complaint':
        return 'bg-rose-50 text-rose-600 border-rose-200'
      case 'low_stock':
        return 'bg-amber-50 text-amber-600 border-amber-200'
      case 'order_update':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
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
    <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center bg-transparent p-4 md:p-6">
      <div className="w-full max-w-[1200px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-lg shadow-slate-200/50 md:rounded-[32px]">
        <div className="flex flex-col md:flex-row">
          {/* Left Sidebar - Filters */}
          <div className="w-full border-b border-slate-200 md:w-[200px] md:border-b-0 md:border-r md:border-slate-200">
            <div className="border-b border-slate-100 p-5">
              <div className="mb-1 flex items-center gap-2">
                <Bell size={16} className="text-slate-900" />
                <h2 className="text-xs font-black tracking-tighter text-slate-900 uppercase italic">
                  Notifications
                </h2>
              </div>
              <p className="text-[9px] font-bold tracking-[3px] text-slate-400 uppercase italic">
                Inbox
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
                    'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-bold transition-all md:px-2.5',
                    activeFilter === tab.key
                      ? 'bg-[#1877F2]/10 text-[#1877F2]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                  )}
                >
                  {tab.icon}
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="hidden border-t border-slate-100 p-3 md:block">
              {filtered.length > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="w-full rounded-lg bg-slate-50 px-3 py-2 text-[9px] font-black tracking-[2px] text-slate-900 uppercase italic transition-all hover:bg-[#1877F2]/10 hover:text-[#1877F2]"
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="flex min-h-[400px] flex-1 flex-col md:flex-row">
            {/* Notification List */}
            <div
              className={clsx(
                'flex flex-col border-r border-slate-200',
                selectedId ? 'hidden md:flex md:w-1/2' : 'w-full',
              )}
            >
              {/* List Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    {activeFilter === 'all'
                      ? 'All Notifications'
                      : activeFilter === 'unread'
                        ? 'Unread'
                        : activeFilter.charAt(0).toUpperCase() +
                          activeFilter.slice(1).replace('_', ' ')}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                    {filtered.length}
                  </span>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[600px] flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                      <Bell
                        size={18}
                        className="animate-pulse text-slate-300"
                      />
                    </div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-60">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-100">
                      <Check
                        size={24}
                        className="text-slate-300"
                        strokeWidth={3}
                      />
                    </div>
                    <p className="mt-3 text-[9px] font-black tracking-[4px] text-slate-400 uppercase italic">
                      No notifications
                    </p>
                  </div>
                ) : (
                  filtered.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleSelect(n.id)}
                      className={clsx(
                        'group relative w-full border-b border-slate-50 px-5 py-3.5 text-left transition-all hover:bg-slate-50',
                        selectedId === n.id && 'bg-[#1877F2]/5',
                        !n.isRead && 'bg-[#1877F2]/[0.02]',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={clsx(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                            n.type === 'message' && 'border-blue-100 bg-blue-50',
                            n.type === 'complaint' &&
                              'border-rose-100 bg-rose-50',
                            n.type === 'low_stock' &&
                              'border-amber-100 bg-amber-50',
                            n.type === 'order_update' &&
                              'border-emerald-100 bg-emerald-50',
                          )}
                        >
                          {getTypeIcon(n.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={clsx(
                                'truncate text-xs font-bold',
                                !n.isRead ? 'text-slate-900' : 'text-slate-500',
                              )}
                            >
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <div className="h-2 w-2 shrink-0 rounded-full bg-[#1877F2]" />
                            )}
                          </div>
                          <p
                            className={clsx(
                              'mt-0.5 line-clamp-2 text-[11px]',
                              !n.isRead
                                ? 'font-medium text-slate-600'
                                : 'text-slate-400',
                            )}
                          >
                            {n.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock size={10} />
                              {formatTime(n.timestamp)}
                            </span>
                            <span
                              className={clsx(
                                'rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider',
                                getTypeColor(n.type),
                              )}
                            >
                              {n.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
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
                  <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 md:hidden">
                    <button
                      onClick={() => setSelectedId(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-bold text-slate-700">
                      Detail
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5">
                    <div className="mb-5 flex items-start gap-3">
                      <div
                        className={clsx(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
                          selected.type === 'message' &&
                            'border-blue-100 bg-blue-50',
                          selected.type === 'complaint' &&
                            'border-rose-100 bg-rose-50',
                          selected.type === 'low_stock' &&
                            'border-amber-100 bg-amber-50',
                          selected.type === 'order_update' &&
                            'border-emerald-100 bg-emerald-50',
                        )}
                      >
                        {getTypeIcon(selected.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-black tracking-tight text-slate-900 uppercase italic">
                          {selected.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={clsx(
                              'rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                              getTypeColor(selected.type),
                            )}
                          >
                            {selected.type.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={10} />
                            {formatDate(selected.timestamp)}
                          </span>
                          {!selected.isRead && (
                            <span className="flex items-center gap-1 rounded-full bg-[#1877F2]/10 px-2 py-0.5 text-[9px] font-bold text-[#1877F2]">
                              <Mail size={9} />
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm leading-relaxed text-slate-600">
                        {selected.description}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      {!selected.isRead && (
                        <button
                          onClick={() => markAsRead(selected.id)}
                          className="flex items-center gap-1.5 rounded-full bg-[#1877F2] px-4 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-[#165cc4] active:scale-95"
                        >
                          <MailOpen size={13} />
                          Mark as Read
                        </button>
                      )}
                      {selected.severity && (
                        <span
                          className={clsx(
                            'rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider',
                            selected.severity === 'high' &&
                              'bg-rose-100 text-rose-700',
                            selected.severity === 'medium' &&
                              'bg-amber-100 text-amber-700',
                            selected.severity === 'low' &&
                              'bg-slate-100 text-slate-600',
                          )}
                        >
                          {selected.severity}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex hidden h-full items-center justify-center md:flex">
                  <div className="text-center opacity-40">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-100">
                      <MailOpen
                        size={28}
                        className="text-slate-300"
                        strokeWidth={1.5}
                      />
                    </div>
                    <p className="text-xs font-bold text-slate-400">
                      Select a notification
                    </p>
                    <p className="mt-0.5 text-[9px] font-medium tracking-wider text-slate-300">
                      to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Mark All Read */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 md:hidden">
          <button
            onClick={() => markAllAsRead()}
            className="w-full rounded-xl bg-white py-2.5 text-[9px] font-black tracking-[3px] text-slate-900 uppercase italic shadow-sm transition-all hover:bg-[#1877F2] hover:text-white active:scale-95"
          >
            Mark All As Read
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationPage
