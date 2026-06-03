import React, { useState, useRef, useMemo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import {
  Menu,
  X,
  User,
  ShieldCheck,
  Bell,
  Settings,
  ChevronRight,
  Shield,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import ErrorBoundary from '../../../components/common/ErrorBoundary'
import { SafeTerminal } from '../../../utils/safeTerminal'

// Section Components (To be created)
import AdminSettingsProfile from './sections/AdminSettingsProfile'
import AdminSettingsSecurity from './sections/AdminSettingsSecurity'
import AdminSettingsRoles from './sections/AdminSettingsRoles'
import AdminSettingsNotifications from './sections/AdminSettingsNotifications'
import AdminSettingsSystem from './sections/AdminSettingsSystem'

export type AdminSectionKey =
  | 'profile'
  | 'security'
  | 'roles'
  | 'notifications'
  | 'system'

interface AdminNavItem {
  key: AdminSectionKey
  label: string
  description: string
  icon: LucideIcon
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    key: 'profile',
    label: 'Admin Profile',
    description: 'Personal identity and shift credentials',
    icon: User,
  },
  {
    key: 'security',
    label: 'Security Settings',
    description: 'Access control and audit protocols',
    icon: ShieldCheck,
  },
  {
    key: 'roles',
    label: 'Roles & Permissions',
    description: 'Command hierarchy and access levels',
    icon: Shield,
  },
  {
    key: 'notifications',
    label: 'Notification Center',
    description: 'System alerts and signal routing',
    icon: Bell,
  },
  {
    key: 'system',
    label: 'System Preferences',
    description: 'Global constants and operational toggles',
    icon: Settings,
  },
]

const AdminSettingsContent: React.FC = () => {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<AdminSectionKey>('profile')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const activeItem = useMemo(
    () =>
      ADMIN_NAV_ITEMS.find((n) => n.key === activeSection) ||
      ADMIN_NAV_ITEMS[0],
    [activeSection],
  )

  const handleSectionChange = (key: AdminSectionKey) => {
    setActiveSection(key)
    setMobileNavOpen(false)
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <AdminSettingsProfile />
      case 'security':
        return <AdminSettingsSecurity />
      case 'roles':
        return <AdminSettingsRoles />
      case 'notifications':
        return <AdminSettingsNotifications />
      case 'system':
        return <AdminSettingsSystem />
      default:
        return <AdminSettingsProfile />
    }
  }

  return (
    <div className="AdminSettingsContainer flex min-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl">
      {/* Settings Top Bar */}
      <div className="sticky top-0 z-20 border-b border-slate-50 bg-white/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] font-black tracking-widest text-slate-300 uppercase sm:block">
              Admin Terminal
            </span>
            <span className="hidden text-slate-200 sm:block">/</span>
            <span className="text-[10px] font-black tracking-widest text-slate-700 uppercase italic">
              {activeItem.label}
            </span>
          </div>

          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2 text-[10px] font-black tracking-widest text-slate-600 uppercase shadow-sm transition-all hover:border-slate-200 lg:hidden"
          >
            {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside
          className={clsx(
            'AdminSettingsSidebar flex flex-col border-r border-slate-50 transition-all duration-300',
            mobileNavOpen
              ? 'absolute inset-0 z-30 w-full bg-white'
              : 'hidden lg:flex lg:w-[320px]',
          )}
        >
          <div className="space-y-1 p-6">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => handleSectionChange(item.key)}
                  className={clsx(
                    'group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-all',
                    isActive
                      ? 'scale-[1.02] bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  <div
                    className={clsx(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      isActive
                        ? 'bg-white/10'
                        : 'bg-slate-100 group-hover:bg-white',
                    )}
                  >
                    <Icon
                      size={18}
                      className={
                        isActive
                          ? 'text-pixs-mint'
                          : 'text-slate-400 group-hover:text-slate-700'
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={clsx(
                        'truncate text-[10px] font-black tracking-widest uppercase italic',
                        isActive ? 'text-white' : 'text-slate-700',
                      )}
                    >
                      {item.label}
                    </p>
                    <p
                      className={clsx(
                        'mt-0.5 truncate text-[8px] font-bold tracking-widest uppercase',
                        isActive ? 'text-slate-400' : 'text-slate-400',
                      )}
                    >
                      {SafeTerminal.limit(item.description, 25)}
                    </p>
                  </div>
                  {isActive && (
                    <ChevronRight size={14} className="text-pixs-mint" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-auto border-t border-slate-50 p-6">
            <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="text-pixs-mint flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-black shadow-lg">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-tight text-slate-900 uppercase">
                    {user?.name}
                  </p>
                  <p className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                    {user?.role} NODE
                  </p>
                </div>
              </div>
              <div className="text-pixs-mint flex items-center gap-2 rounded-lg bg-slate-900/5 px-3 py-2 text-[8px] font-black uppercase">
                <ShieldCheck size={12} />
                Session Secure Encryption
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main
          ref={contentRef}
          className="AdminSettingsContent custom-scrollbar flex-1 overflow-y-auto bg-slate-50/20"
        >
          <div className="mx-auto max-w-4xl p-8 lg:p-12">
            <div className="mb-10 flex items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-slate-900 shadow-2xl shadow-slate-900/20">
                {(() => {
                  const Icon = activeItem.icon
                  return <Icon size={28} className="text-pixs-mint" />
                })()}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
                  {activeItem.label}
                </h1>
                <p className="mt-1 text-xs font-bold tracking-[4px] text-slate-400 uppercase">
                  {activeItem.description}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <m.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="AdminSettingsCard"
              >
                {renderSection()}
              </m.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

const AdminSettings: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={
        <div className="AdminSettingsErrorFallback flex h-[calc(100vh-140px)] flex-col items-center justify-center rounded-[32px] bg-white p-12 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle className="text-rose-500" size={40} />
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-900 uppercase">
            System Node Desync
          </h2>
          <p className="mb-8 max-w-[320px] leading-relaxed font-bold text-slate-400 italic">
            Unable to retrieve settings data. Please refresh or contact system
            administrator.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-slate-900 px-8 py-4 text-[10px] font-black tracking-widest text-white uppercase"
            >
              Reinitialize Node
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('pixs_session')
                window.location.href = '/login'
              }}
              className="rounded-2xl bg-rose-500 px-8 py-4 text-[10px] font-black tracking-widest text-white uppercase"
            >
              Reset Session
            </button>
          </div>
        </div>
      }
    >
      <AdminSettingsContent />
    </ErrorBoundary>
  )
}

export default AdminSettings
