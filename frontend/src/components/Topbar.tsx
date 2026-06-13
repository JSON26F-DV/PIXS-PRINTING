import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Bell,
  Menu,
  Search,
  X,
  ChevronRight,
  Package,
  FileText,
  Clock,
  User,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContextInstance'
import type { INotification } from '../types/notification'
import type { User as AuthUser } from '../context/auth.types'
import type { NavigateFunction } from 'react-router-dom'
import axiosInstance from '../lib/axiosInstance'

interface IProduct {
  id: string
  name: string
  category?: string
  base_price: number
}

interface IUserData {
  id: string
  name: string
  role?: string
  type?: string
  email: string
}

interface ISearchOrderItem {
  productName: string
}

interface ISearchOrder {
  order_id: string
  user_id: string
  status: string
  products: ISearchOrderItem[]
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SearchResult {
  id: string
  type: 'product' | 'order' | 'customer' | 'menu'
  title: string
  subtitle?: string
  link: string
}

interface TopbarProps {
  onMenuClick: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

const menuItems = [
  { id: 'dashboard', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'orders', label: 'Orders', icon: 'ScrollText' },
  { id: 'products', label: 'Products', icon: 'PackageOpen' },
  { id: 'accounts', label: 'Accounts', icon: 'Users' },
  { id: 'inventory', label: 'Inventory Control', icon: 'PackageOpen' },
  { id: 'complaints', label: 'Complaints & QA', icon: 'AlertCircle' },
  { id: 'payroll', label: 'Attendance & Payroll', icon: 'CalendarCheck' },
  { id: 'marketing', label: 'Marketing & Promos', icon: 'TicketPercent' },
  { id: 'messenger', label: 'Messenger', icon: 'MessageSquare' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
  { id: 'livequeue', label: 'Live Queue', icon: 'Activity' },
  { id: 'tasklist', label: 'To-Do List', icon: 'CheckSquare' },
  { id: 'history', label: 'Order History', icon: 'ScrollText' },
]

const SmartSearch: React.FC<{
  user: AuthUser
  navigate: NavigateFunction
  setActiveTab: (tab: string) => void
  onClose: () => void
}> = ({ user, navigate, setActiveTab, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const [products, setProducts] = useState<IProduct[]>([])
  const [orders, setOrders] = useState<ISearchOrder[]>([])
  const [accounts, setAccounts] = useState<IUserData[]>([])

  useEffect(() => {
    inputRef.current?.focus()

    let isMounted = true
    Promise.all([
      axiosInstance.get('/api/admin/products').catch(() => ({ data: [] })),
      axiosInstance.get('/api/admin/orders').catch(() => ({ data: { orders: [] } })),
      axiosInstance.get('/api/admin/accounts').catch(() => ({ data: { data: [] } }))
    ]).then(([prodRes, orderRes, accountRes]) => {
      if (!isMounted) return

      const pData = prodRes.data.data || prodRes.data || []
      setProducts(Array.isArray(pData) ? pData : [])

      const oData = orderRes.data.orders || orderRes.data || []
      setOrders(Array.isArray(oData) ? oData : [])

      const aData = accountRes.data.data || accountRes.data || []
      setAccounts(Array.isArray(aData) ? aData : [])
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!query.trim()) {
        setResults([])
        return
      }

      const lowerQuery = query.toLowerCase()
      const searchResults: SearchResult[] = []

      menuItems
        .filter((item) => item.label.toLowerCase().includes(lowerQuery))
        .forEach((item) => {
          searchResults.push({
            id: `menu-${item.id}`,
            type: 'menu',
            title: item.label,
            subtitle: 'Menu',
            link: item.id,
          })
        })

      products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.category?.toLowerCase().includes(lowerQuery),
        )
        .slice(0, 3)
        .forEach((p) => {
          searchResults.push({
            id: `product-${p.id}`,
            type: 'product',
            title: p.name,
            subtitle: `${p.category || 'General'} • ₱${p.base_price}`,
            link: 'products',
          })
        })

      orders
        .filter(
          (o) =>
            o.order_id.toLowerCase().includes(lowerQuery) ||
            (o.products &&
              o.products.some((item: ISearchOrderItem) => item.productName?.toLowerCase().includes(lowerQuery))),
        )
        .slice(0, 5)
        .forEach((o) => {
          searchResults.push({
            id: `order-${o.order_id}`,
            type: 'order',
            title: `#${o.order_id} - ${o.products?.[0]?.productName || 'Order'}`,
            subtitle: `${o.user_id} • ${o.status || 'Active'}`,
            link: user.role === 'staff' ? 'history' : 'orders',
          })
        })

      accounts
        .filter(
          (u) =>
            u.name.toLowerCase().includes(lowerQuery) ||
            u.email.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .forEach((u) => {
          searchResults.push({
            id: `user-${u.id}`,
            type: 'customer',
            title: u.name,
            subtitle: `${u.role || u.type || 'Client'} • ${u.email}`,
            link: 'accounts',
          })
        })

      setResults(searchResults)
    }, 100)

    return () => clearTimeout(handler)
  }, [query, user.role, products, orders, accounts])

  const handleSelect = (result: SearchResult) => {
    onClose()
    setTimeout(() => {
      setActiveTab(result.link)
      navigate(`/${user.role}/${result.link}`)
    }, 150)
  }

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    results.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = []
      groups[r.type].push(r)
    })
    return groups
  }, [results])

  const typeLabels: Record<
    string,
    { label: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; color: string }
  > = {
    menu: { label: 'Menu', icon: ChevronRight, color: 'text-slate-500' },
    product: { label: 'Products', icon: Package, color: 'text-blue-500' },
    order: { label: 'Orders', icon: FileText, color: 'text-emerald-500' },
    customer: { label: 'Customers', icon: User, color: 'text-purple-500' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <m.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-900/20"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, products, customers, menu..."
            className="flex-1 border-none bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded p-1 hover:bg-slate-100"
            >
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!query && (
            <div className="p-8 text-center">
              <Search size={32} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">
                Start typing to search...
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Orders, products, customers, or menu items
              </p>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">
                No results found for "{query}"
              </p>
            </div>
          )}

          {Object.entries(groupedResults).map(([type, items]) => {
            const typeInfo = typeLabels[type]
            const Icon = typeInfo.icon
            return (
              <div
                key={type}
                className="border-b border-slate-50 last:border-0"
              >
                <div className="bg-slate-50/50 px-4 py-2">
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase',
                      typeInfo.color,
                    )}
                  >
                    <Icon size={10} />
                    {typeInfo.label}
                  </span>
                </div>
                {items.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="truncate text-[11px] text-slate-400">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={14}
                      className="flex-shrink-0 text-slate-300"
                    />
                  </button>
                ))}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-3 text-[10px] text-slate-400">
          <span>
            Press{' '}
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono">
              ESC
            </kbd>{' '}
            to close
          </span>
          <span>{results.length} results</span>
        </div>
      </m.div>
    </div>
  )
}

const NotificationDropdown: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications()

  const getNotificationIcon = (type: INotification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={14} className="text-blue-500" />
      case 'complaint':
        return <AlertTriangle size={14} className="text-rose-500" />
      case 'low_stock':
        return <Package size={14} className="text-amber-500" />
      case 'order_update':
        return <FileText size={14} className="text-emerald-500" />
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'bg-rose-100 text-rose-700'
      case 'medium':
        return 'bg-amber-100 text-amber-700'
      case 'low':
        return 'bg-slate-100 text-slate-600'
      default:
        return 'bg-slate-100 text-slate-600'
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

  return (
    <m.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full right-0 mt-2 w-80 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-2xl shadow-slate-900/10"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-pixs-mint rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-900">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[10px] font-medium text-[#1877F2] hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={24} className="mx-auto mb-2 text-slate-200" />
            <p className="text-sm text-slate-400">No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notif: INotification) => (
            <button
              key={notif.id}
              onClick={() => {
                markAsRead(notif.id)
                onClose()
              }}
              className={cn(
                'w-full border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50',
                !notif.isRead && 'bg-[#1877F2]/5',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[#1877F2]" />
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">
                    {notif.description}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock size={10} />
                      {formatTime(notif.timestamp)}
                    </span>
                    {notif.severity && (
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                          getSeverityColor(notif.severity),
                        )}
                      >
                        {notif.severity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
          <button className="w-full text-center text-[11px] font-medium text-slate-500 hover:text-slate-700">
            View all notifications
          </button>
        </div>
      )}
    </m.div>
  )
}

const Topbar: React.FC<TopbarProps> = ({
  onMenuClick,
  activeTab,
  setActiveTab,
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowNotifications(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-50 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="flex items-center text-sm font-bold text-slate-900 capitalize">
              {user.role}
              <span className="mx-2 font-normal text-slate-300">/</span>
              <span className="text-slate-500 capitalize">{activeTab}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={() => setShowSearch(true)}
            className="group hidden items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100 sm:flex"
          >
            <Search
              size={14}
              className="text-slate-400 group-hover:text-slate-500"
            />
            <span className="text-xs font-medium text-slate-400">
              Search...
            </span>
            <kbd className="hidden items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 lg:flex">
              <span>⌘</span>K
            </kbd>
          </button>

          <button
            onClick={() => setShowSearch(true)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 sm:hidden"
          >
            <Search size={18} />
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <NotificationDropdown
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="mx-1 h-6 w-px bg-slate-200" />

          <button
            onClick={() => {
              const base =
                user.role === 'staff' || user.role === 'technician'
                  ? '/staff'
                  : user.role === 'inventory'
                    ? '/inventory'
                    : '/admin'
              navigate(`${base}/setting/account`)
            }}
            className="group flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="hidden text-right sm:block">
              <p className="text-xs leading-none font-bold text-slate-900">
                {user.name}
              </p>
              <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                VERIFIED {user.role}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border-2 border-[#75EEA5]/30 bg-[#75EEA5]/20 font-black text-emerald-700 shadow-sm shadow-[#75EEA5]/10">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showSearch && (
          <SmartSearch
            user={user}
            navigate={navigate}
            setActiveTab={setActiveTab}
            onClose={() => setShowSearch(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Topbar
