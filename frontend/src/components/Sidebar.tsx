import React, { useState } from 'react'
import {
  LayoutDashboard,
  PackageOpen,
  ScrollText,
  Users,
  User,
  MapPin,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Settings,
  MessageSquare,
  CalendarCheck,
  TicketPercent,
  Activity,
  BarChart3,
  QrCode,
  Receipt,
  FileText,
  Bell,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useNavigate, useLocation } from 'react-router-dom'
import AdminLogoutModal from './admin/AdminLogoutModal'
import toast from 'react-hot-toast'
import { getHomePathForRole } from '../utils/authRouting'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  active: boolean
  collapsed: boolean
  onClick: () => void
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl transition-all duration-300',
        collapsed ? 'h-12 justify-center px-0' : 'px-4 py-3',
        active
          ? 'bg-[#75EEA5]/10 font-bold text-emerald-700'
          : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900',
      )}
    >
      <Icon
        size={20}
        className={cn(
          active
            ? 'text-emerald-600'
            : 'text-slate-400 group-hover:text-slate-600',
        )}
      />
      {!collapsed && <span className="text-sm">{label}</span>}

      {collapsed && (
        <div className="pointer-events-none absolute left-[calc(100%+8px)] z-50 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
          {label}
        </div>
      )}
    </button>
  )
}

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  activeTab,
  setActiveTab,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(() =>
    location.pathname.includes('/setting') || location.pathname.includes('/settings')
  )
  const [prevPath, setPrevPath] = useState(location.pathname)

  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname)
    if (location.pathname.includes('/setting') || location.pathname.includes('/settings')) {
      setIsSettingsExpanded(true)
    }
  }

  if (!user) return null

  const handleLogoutConfirm = () => {
    setIsLoggingOut(true)
    logout()
    setIsLoggingOut(false)
    setShowLogoutModal(false)
    toast.success('Session terminated', {
      duration: 1000,
    })
  }

  const navItems: Record<
    string,
    { id: string; label: string; icon: LucideIcon }[]
  > = {
    admin: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'orders', label: 'Orders', icon: ScrollText },
      { id: 'product', label: 'Product Catalog', icon: PackageOpen },
      { id: 'stock', label: 'Stock Analytics', icon: BarChart3 },
      { id: 'refund', label: 'Refund Management', icon: Receipt },
      { id: 'account', label: 'Accounts', icon: Users },
      { id: 'payroll', label: 'Attendance & Payroll', icon: CalendarCheck },
      { id: 'marketing', label: 'Marketing & Promos', icon: TicketPercent },
      { id: 'generatecode', label: 'Payment Codes', icon: QrCode },
      { id: 'message', label: 'Enterprise Messaging', icon: MessageSquare },
      { id: 'auditlog', label: 'Audit Log', icon: FileText },
      { id: 'blocked-ips', label: 'Blocked IPs', icon: ShieldAlert },
      { id: 'notifications', label: 'Notifications CRUD', icon: Bell },
      { id: 'setting', label: 'Settings', icon: Settings },
    ],
    staff: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'orders', label: 'Orders', icon: ScrollText },
      { id: 'livequeue', label: 'Live Queue', icon: Activity },
      { id: 'chat', label: 'Shift Chat', icon: MessageSquare },
      { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { id: 'setting', label: 'Settings', icon: Settings },
    ],
    inventory: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'orders', label: 'Orders', icon: ScrollText },
      { id: 'stock', label: 'Stock Strategy', icon: BarChart3 },
      { id: 'chat', label: 'Shift Chat', icon: MessageSquare },
      { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { id: 'setting', label: 'Settings', icon: Settings },
    ],
  }

  const SETTINGS_CHILDREN = [
    { id: 'account', label: 'Account Info', icon: User },
    { id: 'address', label: 'Address Book', icon: MapPin },
    { id: 'policies', label: 'Policies', icon: FileText },
    { id: 'logout-confirm', label: 'Logout', icon: LogOut },
  ]

  const roleKey = user.role === 'technician' ? 'staff' : user.role
  const items = navItems[roleKey as keyof typeof navItems] || []

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'group fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:static',
          isCollapsed ? 'w-20' : 'w-[280px]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:border-pixs-mint absolute top-10 -right-3 z-50 hidden rounded-full border border-slate-200 bg-white p-1 shadow-sm transition-colors lg:flex"
        >
          {isCollapsed ? (
            <ChevronRight size={12} className="text-slate-600" />
          ) : (
            <ChevronLeft size={12} className="text-slate-600" />
          )}
        </button>

        <div className={cn('flex-1 overflow-y-auto p-6 custom-scrollbar', isCollapsed && 'px-4')}>
          <div
            onClick={() => navigate(getHomePathForRole(user.role))}
            className="mb-10 flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="bg-pixs-mint flex h-9 w-9 min-w-[36px] flex-shrink-0 items-center justify-center rounded-[12px] text-lg font-black text-slate-900 shadow-sm">
              P
            </div>
            {!isCollapsed && (
              <h1 className="animate-in fade-in text-xl font-black tracking-tight whitespace-nowrap text-slate-900 duration-500">
                PIXS <span className="text-slate-400">SHOP OS</span>
              </h1>
            )}
          </div>

          <nav className="space-y-1.5">
            {!isCollapsed && (
              <p className="mb-3 px-4 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Main Menu
              </p>
            )}
            {items.map((item) => {
              if (item.id === 'setting' && !isCollapsed) {
                const isActive = activeTab === 'setting' || location.pathname.includes('/setting') || location.pathname.includes('/settings')
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all',
                        isActive
                          ? 'bg-[#75EEA5]/10 font-bold text-emerald-700'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {isSettingsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isSettingsExpanded && (
                      <div className="ml-4 space-y-1">
                        {SETTINGS_CHILDREN.map((child) => {
                          const isChildActive = location.pathname.endsWith(child.id) || (child.id === 'account' && location.pathname.endsWith('/setting'))
                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                if (child.id === 'logout-confirm') {
                                  setShowLogoutModal(true)
                                } else {
                                  setActiveTab('setting')
                                  const base =
                                    user.role === 'staff' || user.role === 'technician'
                                      ? '/staff'
                                      : user.role === 'inventory'
                                        ? '/inventory'
                                        : '/admin'
                                  navigate(`${base}/setting/${child.id}`)
                                }
                              }}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all',
                                isChildActive
                                  ? 'bg-slate-900 text-white shadow-lg'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                              )}
                            >
                              <child.icon size={14} className={isChildActive ? 'text-pixs-mint' : 'text-slate-400'} />
                              <span className="text-[11px] font-bold uppercase tracking-widest">{child.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <SidebarItem
                  key={item.id}
                  {...item}
                  active={activeTab === item.id}
                  collapsed={isCollapsed}
                  onClick={() => {
                    setActiveTab(item.id)
                    const base =
                      user.role === 'staff' || user.role === 'technician'
                        ? '/staff'
                        : user.role === 'inventory'
                          ? '/inventory'
                          : user.role === 'admin'
                            ? '/admin'
                            : `/${user.role}`
                    navigate(`${base}/${item.id}`)
                    if (isMobileOpen) setIsMobileOpen(false)
                  }}
                />
              )
            })}
          </nav>
        </div>

      </aside>

      <AdminLogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </>
  )
}

export default Sidebar
