import React, { useState, useRef, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { FiArrowLeft, FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import BoxFallback from '../../components/common/BoxFallback'
import type { User } from '../../context/auth.types'
import { NAV_ITEMS } from '../../pages/Settings/settingsNav'
import type { SectionKey, NavItem } from '../../pages/Settings/settingsNav'

// Lazy Loaded Sections
const AccountInfoPage = lazy(
  () => import('../../pages/Settings/AccountInfo/AccountInfoPage'),
)

const AddressBookSection = lazy(
  () => import('../../pages/Settings/AddressBook/AddressBookSection'),
)
const AwardsSection = lazy(
  () => import('../../pages/Settings/Awards/AwardsSection'),
)
const HelpSupportSection = lazy(
  () => import('../../pages/Settings/HelpSupport/HelpSupportSection'),
)
const PoliciesSection = lazy(
  () => import('../../pages/Settings/Policies/PoliciesSection'),
)
const LogoutSection = lazy(
  () => import('../../pages/Settings/Logout/LogoutSection'),
)

const SectionLoader = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="animate-pulse text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
      Initializing Component...
    </div>
  </div>
)

const SECTION_MAP: Partial<Record<SectionKey, React.ReactNode>> = {
  account: <AccountInfoPage />,
  address: <AddressBookSection />,

  awards: <AwardsSection />,
  help: <HelpSupportSection />,
  policies: <PoliciesSection />,
  logout: <LogoutSection />,
}

// ── Sidebar Nav Item ──────────────────────────────────────────────
const SideNavItem: React.FC<{
  item: NavItem
  isActive: boolean
  onClick: () => void
}> = ({ item, isActive, onClick }) => {
  const Icon = item.icon
  const isDanger = item.key === 'logout'

  return (
    <button
      onClick={onClick}
      className={clsx(
        'group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all',
        isActive
          ? isDanger
            ? 'bg-red-500 text-white shadow-lg shadow-red-200'
            : 'bg-slate-900 text-white shadow-lg'
          : isDanger
            ? 'text-red-400 hover:bg-red-50 hover:text-red-500'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
      )}
    >
      <div
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
          isActive
            ? isDanger
              ? 'bg-white/20'
              : 'bg-white/10'
            : isDanger
              ? 'bg-red-50 group-hover:bg-red-100'
              : 'bg-slate-100 group-hover:bg-white',
        )}
      >
        <Icon
          size={16}
          className={clsx(
            isActive
              ? isDanger
                ? 'text-white'
                : 'text-pixs-mint'
              : isDanger
                ? 'text-red-400'
                : 'text-slate-400 group-hover:text-slate-700',
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            'truncate text-[11px] font-black tracking-widest uppercase italic',
            isActive
              ? 'text-white'
              : isDanger
                ? 'text-red-400'
                : 'text-slate-700',
          )}
        >
          {item.label}
        </p>
      </div>
      {isActive && !isDanger && (
        <div className="bg-pixs-mint h-1.5 w-1.5 animate-pulse rounded-full" />
      )}
    </button>
  )
}

// ── Sidebar Content (standalone so it doesn't re-create on each render) ──
const SidebarContent: React.FC<{
  user: User | null
  activeSection: SectionKey
  onSelect: (key: SectionKey) => void
}> = ({ user, activeSection, onSelect }) => (
  <div className="flex h-full flex-col">
    {/* Profile Card */}
    <div className="mb-6 rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-900 shadow-lg">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture.startsWith('http') ? user.profile_picture : `/src/assets/profile/${user.profile_picture}`}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <BoxFallback 
            className={clsx("flex h-full w-full items-center justify-center bg-slate-900", user?.profile_picture ? "hidden" : "flex")}
            iconClassName="h-8 w-8 opacity-30 brightness-0 invert" 
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black tracking-tighter text-slate-900 uppercase italic">
            {user?.name ?? 'Guest'}
          </p>
          <p className="mt-0.5 truncate text-[9px] font-bold tracking-widest text-slate-400 uppercase">
            {user?.email ?? 'Not logged in'}
          </p>
          <span className="bg-pixs-mint/10 mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest text-slate-700 uppercase">
            {user?.role ?? 'Guest'}
          </span>
        </div>
      </div>
    </div>

    {/* Nav Items */}
    <nav className="flex-1 space-y-1">
      {NAV_ITEMS.map((item) => (
        <SideNavItem
          key={item.key}
          item={item}
          isActive={activeSection === item.key}
          onClick={() => onSelect(item.key)}
        />
      ))}
    </nav>
  </div>
)

// ── Main SettingsPage ──────────────────────────────────────────────
const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoading } = useAuth()
  
  // Initialize with section from navigation state, defaulting to 'account'
  const [activeSection, setActiveSection] = useState<SectionKey>(
    (location.state as { section?: SectionKey })?.section || 'account'
  )
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
          Synchronizing Identity Node...
        </div>
      </div>
    )
  }

  if (!user.isLoggedIn) {
    return null // AppRouter handles redirect
  }

  const activeItem = NAV_ITEMS.find((n) => n.key === activeSection)!

  const handleSectionChange = (key: SectionKey) => {
    setActiveSection(key)
    setMobileNavOpen(false)
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-0 md:pt-20">
      {/* Desktop Breadcrumb Bar */}
      <div className="hidden lg:block sticky top-20 z-30 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
          <button
            onClick={() => navigate('/')}
            className="SettingsBackButton flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2 text-[10px] font-black tracking-widest text-slate-600 uppercase shadow-sm transition-all hover:border-slate-200 hover:text-slate-900 active:scale-95"
          >
            <FiArrowLeft size={14} />
            <span>Back to Marketplace</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
              Settings
            </span>
            <span className="text-slate-200">/</span>
            <span className="text-[10px] font-black tracking-widest text-slate-700 uppercase italic">
              {activeItem.label}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Top Navbar */}
      <div className="lg:hidden relative z-40 flex h-16 w-full items-center justify-between bg-transparent px-4">
        {/* Left: Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-start text-slate-800 transition-transform active:scale-95"
        >
          <FiArrowLeft size={24} />
        </button>

        {/* Center: Badge */}
        <div className="flex w-[192px] h-10 items-center justify-center gap-2 rounded-[43px] bg-[#DCF5E1] px-3 font-bold text-slate-800 shadow-sm">
          <activeItem.icon size={16} className="shrink-0 text-emerald-600" />
          <span className="truncate text-xs font-bold uppercase tracking-wider">
            {activeItem.label}
          </span>
        </div>

        {/* Right: Burger Menu Toggle */}
        <button
          onClick={() => setMobileNavOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-end text-slate-800 transition-transform active:scale-95"
        >
          {mobileNavOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm lg:hidden"
            />
            <m.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 bottom-0 left-0 z-[110] w-[300px] overflow-y-auto bg-slate-50 p-5 shadow-2xl lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-pixs-mint flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black text-slate-900 shadow-md">
                    P
                  </div>
                  <span className="text-sm font-black tracking-tighter text-slate-900 italic">
                    PIXS <span className="text-slate-400">SETTINGS</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 active:scale-90"
                >
                  <FiX size={16} />
                </button>
              </div>
              <SidebarContent
                user={user}
                activeSection={activeSection}
                onSelect={handleSectionChange}
              />
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block xl:w-72">
            <div className="sticky top-24">
              <SidebarContent
                user={user}
                activeSection={activeSection}
                onSelect={handleSectionChange}
              />
            </div>
          </aside>

          {/* Content Area */}
          <main ref={contentRef} className="min-w-0 flex-1">
            {/* Section Header */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 shadow-lg">
                <activeItem.icon size={20} className="text-pixs-mint" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                  {activeItem.label}
                </h1>
                <p className="text-[10px] font-bold tracking-[3px] text-slate-400 uppercase">
                  {activeItem.description}
                </p>
              </div>
            </div>

            {/* Section Content */}
            <AnimatePresence mode="wait">
              <m.div
                key={activeSection}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {/* AccountInfoPage has its own layout wrapper; strip outer padding for it */}
                {activeSection === 'account' ? (
                  <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
                    <Suspense fallback={<SectionLoader />}>
                      {SECTION_MAP[activeSection] || null}
                    </Suspense>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm md:p-8">
                    <Suspense fallback={<SectionLoader />}>
                      {SECTION_MAP[activeSection] || null}
                    </Suspense>
                  </div>
                )}
              </m.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
