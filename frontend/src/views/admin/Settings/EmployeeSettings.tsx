import React, { useState, lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import { FiUser, FiMapPin, FiFileText, FiLogOut, FiSettings } from 'react-icons/fi'
import { useAuth } from '../../../context/AuthContext'
import BoxFallback from '../../../components/common/BoxFallback'

// Use same lazy imports as customer SettingsPage
const AccountInfoPage = lazy(
  () => import('../../../pages/Settings/AccountInfo/AccountInfoPage'),
)
const AddressBookSection = lazy(
  () => import('../../../pages/Settings/AddressBook/AddressBookSection'),
)
const PoliciesSection = lazy(
  () => import('../../../pages/Settings/Policies/PoliciesSection'),
)
const LogoutSection = lazy(
  () => import('../../../pages/Settings/Logout/LogoutSection'),
)

type SectionKey = 'account' | 'address' | 'policies' | 'logout'

interface EmployeeNavItem {
  key: SectionKey
  label: string
  icon: typeof FiUser
  description: string
}

const EMPLOYEE_NAV_ITEMS: EmployeeNavItem[] = [
  {
    key: 'account',
    label: 'Account Info',
    icon: FiUser,
    description: 'Name, email, phone, password',
  },
  {
    key: 'address',
    label: 'Address Book',
    icon: FiMapPin,
    description: 'Shipping & delivery nodes',
  },
  {
    key: 'policies',
    label: 'Policies',
    icon: FiFileText,
    description: 'Terms, privacy, returns',
  },
  {
    key: 'logout',
    label: 'Logout',
    icon: FiLogOut,
    description: 'Sign out of session',
  },
]

const SECTION_MAP: Record<SectionKey, React.ReactNode> = {
  account: <AccountInfoPage />,
  address: <AddressBookSection />,
  policies: <PoliciesSection />,
  logout: <LogoutSection />,
}

const SectionLoader = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="animate-pulse text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
      Initializing Component...
    </div>
  </div>
)

const EmployeeSettings: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()

  // Determine active section from URL or state, default to 'account'
  const pathParts = location.pathname.split('/')
  const lastPart = pathParts[pathParts.length - 1] as SectionKey
  const activeSection: SectionKey = ['account', 'address', 'policies', 'logout'].includes(lastPart) 
    ? lastPart 
    : (location.state as { section?: SectionKey })?.section || 'account'

  const activeItem = EMPLOYEE_NAV_ITEMS.find((n) => n.key === activeSection) || EMPLOYEE_NAV_ITEMS[0]

  return (
    <div className="EmployeeSettingsContainer animate-in fade-in flex min-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl duration-500">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 border-b border-slate-50 bg-white/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <FiSettings size={14} className="text-slate-400" />
            <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
              Employee Terminal
            </span>
            <span className="text-slate-200">/</span>
            <span className="text-[10px] font-black tracking-widest text-slate-700 uppercase italic">
              {activeItem.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/20">
          <div className="mx-auto max-w-4xl p-8 lg:p-12">
            <div className="mb-10 flex items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-slate-900 shadow-2xl shadow-slate-900/20">
                <activeItem.icon size={28} className="text-pixs-mint" />
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
              >
                <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                  <Suspense fallback={<SectionLoader />}>
                    {SECTION_MAP[activeSection]}
                  </Suspense>
                </div>
              </m.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EmployeeSettings
