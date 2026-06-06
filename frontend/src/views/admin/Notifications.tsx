import React, { useState, useEffect, useMemo } from 'react'
import {
  Bell,
  Plus,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  X,
  AlertTriangle,
  MessageSquare,
  Package,
  FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../../lib/axiosInstance'
import { useDebounce } from '../../hooks/useDebounce'

interface IAdminNotification {
  id: string
  customer_id: string | null
  employee_id: string | null
  title: string
  message: string
  type: string
  is_read: boolean | number
  created_at: string
}

interface IAccount {
  id: string
  name: string
  email: string
  role: string
  type: 'customer' | 'employee'
}

const SearchBar: React.FC<{
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}> = ({ value, onChange, placeholder = 'Search notifications...' }) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-12 text-sm font-black tracking-widest text-slate-900 placeholder-slate-300 focus:border-slate-900 focus:outline-none uppercase"
      />
    </div>
  )
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<IAdminNotification[]>([])
  const [accounts, setAccounts] = useState<IAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [rawSearch, setRawSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Modals state
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingNotif, setEditingNotif] = useState<IAdminNotification | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [notifType, setNotifType] = useState('info')
  const [targetType, setTargetType] = useState<'broadcast' | 'customer' | 'employee'>('broadcast')
  const [selectedTargetId, setSelectedTargetId] = useState('')
  const [isRead, setIsRead] = useState(false)

  const debouncedSearch = useDebounce(rawSearch, 350)

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/notifications')
      setNotifications(response.data.data || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
      toast.error('Failed to retrieve notifications.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/accounts')
      setAccounts(response.data.data || [])
    } catch (err) {
      console.error('Failed to load accounts:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchAccounts()
  }, [])

  const filteredNotifications = useMemo(() => {
    let result = notifications

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase().trim()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.message.toLowerCase().includes(term),
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter((n) => n.type === typeFilter)
    }

    return result
  }, [notifications, debouncedSearch, typeFilter])

  const filteredAccountsForTarget = useMemo(() => {
    if (targetType === 'broadcast') return []
    return accounts.filter((a) => a.type === targetType)
  }, [accounts, targetType])

  const handleCreateOpen = () => {
    setTitle('')
    setMessage('')
    setNotifType('info')
    setTargetType('broadcast')
    setSelectedTargetId('')
    setCreateOpen(true)
  }

  const handleEditOpen = (notif: IAdminNotification) => {
    setEditingNotif(notif)
    setTitle(notif.title)
    setMessage(notif.message)
    setNotifType(notif.type)
    setIsRead(Boolean(notif.is_read))
    
    if (notif.customer_id) {
      setTargetType('customer')
      setSelectedTargetId(notif.customer_id)
    } else if (notif.employee_id) {
      setTargetType('employee')
      setSelectedTargetId(notif.employee_id)
    } else {
      setTargetType('broadcast')
      setSelectedTargetId('')
    }
    
    setEditOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.')
      return
    }

    setIsSaving(true)
    const payload = {
      title,
      message,
      type: notifType,
      customer_id: targetType === 'customer' ? selectedTargetId : null,
      employee_id: targetType === 'employee' ? selectedTargetId : null,
    }

    try {
      await axiosInstance.post('/api/admin/notifications', payload)
      toast.success('Notification sent successfully.')
      setCreateOpen(false)
      fetchNotifications()
    } catch (err) {
      console.error('Failed to send notification:', err)
      toast.error('Failed to send notification.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNotif) return
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.')
      return
    }

    setIsSaving(true)
    const payload = {
      title,
      message,
      type: notifType,
      customer_id: targetType === 'customer' ? selectedTargetId : null,
      employee_id: targetType === 'employee' ? selectedTargetId : null,
      is_read: isRead,
    }

    try {
      await axiosInstance.put(`/api/admin/notifications/${editingNotif.id}`, payload)
      toast.success('Notification updated successfully.')
      setEditOpen(false)
      setEditingNotif(null)
      fetchNotifications()
    } catch (err) {
      console.error('Failed to update notification:', err)
      toast.error('Failed to update notification.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return
    }

    try {
      await axiosInstance.delete(`/api/admin/notifications/${id}`)
      toast.success('Notification deleted successfully.')
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Failed to delete notification:', err)
      toast.error('Failed to delete notification.')
    }
  }

  const getTargetLabel = (notif: IAdminNotification) => {
    if (notif.customer_id) {
      const match = accounts.find((a) => a.id === notif.customer_id)
      return match ? `Customer: ${match.name}` : `Customer (ID: ${notif.customer_id})`
    }
    if (notif.employee_id) {
      const match = accounts.find((a) => a.id === notif.employee_id)
      return match ? `Employee: ${match.name}` : `Employee (ID: ${notif.employee_id})`
    }
    return 'Broadcast (All)'
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} className="text-blue-500" />
      case 'complaint':
        return <AlertTriangle size={16} className="text-rose-500" />
      case 'low_stock':
        return <Package size={16} className="text-amber-500" />
      case 'order_update':
        return <FileText size={16} className="text-emerald-500" />
      default:
        return <Bell size={16} className="text-slate-500" />
    }
  }

  return (
    <div className="NotificationsView p-6 lg:p-10 space-y-10 min-h-screen bg-slate-50">
      {/* 🚀 Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-slate-900 text-white rounded-full px-3 py-1 text-[9px] font-black tracking-[4px] uppercase italic">
              Communication
            </span>
            <div className="h-0.5 w-12 bg-slate-200" />
          </div>
          <h1 className="text-4xl leading-none font-black tracking-tighter text-slate-900 uppercase italic lg:text-5xl">
            Notification Hub.
          </h1>
          <p className="text-xs leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
            Create, manage, and dispatch targeted alerts and broadcasts to customers and employees.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchNotifications}
            className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-5 py-3 rounded-full text-[10px] font-black tracking-[3px] text-slate-500 uppercase italic hover:text-slate-950 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Sync
          </button>
          <button
            onClick={handleCreateOpen}
            className="flex items-center justify-center gap-2 border border-slate-900 bg-slate-900 px-5 py-3 rounded-full text-[10px] font-black tracking-[3px] text-[#75EEA5] uppercase italic hover:bg-slate-800 transition-colors"
          >
            <Plus size={14} />
            Send Notification
          </button>
        </div>
      </div>

      {/* 📋 Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={rawSearch} onChange={(e) => setRawSearch(e.target.value)} />

        <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-200/60 p-1 self-start">
          {['all', 'info', 'success', 'warning', 'error', 'message', 'complaint', 'low_stock', 'order_update'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase italic transition-all ${
                typeFilter === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 📋 Table Grid */}
      <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={36} className="animate-spin text-slate-900" />
            <span className="text-[10px] font-black tracking-widest uppercase">Fetching registry...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Bell size={40} className="stroke-[1.5] text-slate-300" />
            <span className="text-[10px] font-black tracking-widest uppercase">No notifications found.</span>
          </div>
        ) : (
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Type</th>
                <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Target User</th>
                <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Title</th>
                <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Message</th>
                <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Read Status</th>
                <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Dispatched</th>
                <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.map((notif) => {
                const isReadNotif = Boolean(notif.is_read)
                return (
                  <tr key={notif.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    {/* Icon Column */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notif.type)}
                        <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">
                          {notif.type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>

                    {/* Target Label */}
                    <td className="py-4 px-4 text-xs font-black text-slate-700">
                      {getTargetLabel(notif)}
                    </td>

                    {/* Title */}
                    <td className="py-4 px-4 text-xs font-black tracking-tight text-slate-900">
                      {notif.title}
                    </td>

                    {/* Message */}
                    <td className="py-4 px-4 text-xs font-medium text-slate-400 max-w-xs truncate" title={notif.message}>
                      {notif.message}
                    </td>

                    {/* Read status */}
                    <td className="py-4 px-4">
                      {isReadNotif ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/50 text-[8px] font-black tracking-widest text-slate-500 px-2.5 py-1 uppercase">
                          <CheckCircle2 size={10} className="text-slate-400" />
                          Read
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] font-black tracking-widest text-emerald-600 px-2.5 py-1 uppercase animate-pulse">
                          <XCircle size={10} className="text-emerald-500" />
                          Unread
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-4 text-[11px] font-black tracking-wider text-slate-400">
                      {new Date(notif.created_at).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditOpen(notif)}
                          className="p-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                          title="Edit notification"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 rounded-xl border border-rose-100 text-rose-500 bg-rose-50/50 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm shadow-rose-500/5"
                          title="Delete notification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 🚀 Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 rounded-full p-1 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                Send Notification
              </h3>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                Dispatch an alert to customers or staff
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Target Scope */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Target Scope *
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value as 'broadcast' | 'customer' | 'employee')
                      setSelectedTargetId('')
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="broadcast">Broadcast (All Users)</option>
                    <option value="customer">Specific Customer</option>
                    <option value="employee">Specific Employee</option>
                  </select>
                </div>

                {/* Notification Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Alert Type *
                  </label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="message">Message</option>
                    <option value="complaint">Complaint</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="order_update">Order Update</option>
                  </select>
                </div>
              </div>

              {/* Specific User Target Select */}
              {targetType !== 'broadcast' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Select Target User *
                  </label>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    required
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose target {targetType} --</option>
                    {filteredAccountsForTarget.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                  Notification Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter clear alert headline"
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                  Message Content *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter explanation text"
                  rows={4}
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-[10px] font-black tracking-[3px] text-slate-500 uppercase hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-[3px] text-[#75EEA5] uppercase hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 Edit Modal */}
      {editOpen && editingNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setEditOpen(false)
                setEditingNotif(null)
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 rounded-full p-1 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                Update Notification
              </h3>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                Modify existing record
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Target Scope */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Target Scope *
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value as 'broadcast' | 'customer' | 'employee')
                      setSelectedTargetId('')
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="broadcast">Broadcast (All Users)</option>
                    <option value="customer">Specific Customer</option>
                    <option value="employee">Specific Employee</option>
                  </select>
                </div>

                {/* Notification Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Alert Type *
                  </label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="message">Message</option>
                    <option value="complaint">Complaint</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="order_update">Order Update</option>
                  </select>
                </div>
              </div>

              {/* Specific User Target Select */}
              {targetType !== 'broadcast' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Select Target User *
                  </label>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    required
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose target {targetType} --</option>
                    {filteredAccountsForTarget.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                  Notification Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter clear alert headline"
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                  Message Content *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter explanation text"
                  rows={4}
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Read Status Checkbox */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="isReadEdit"
                  checked={isRead}
                  onChange={(e) => setIsRead(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="isReadEdit" className="text-[10px] font-black tracking-widest text-slate-400 uppercase cursor-pointer selection:bg-transparent">
                  Mark as Read (Acknowledge Alert)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false)
                    setEditingNotif(null)
                  }}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-[10px] font-black tracking-[3px] text-slate-500 uppercase hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-[3px] text-[#75EEA5] uppercase hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications
