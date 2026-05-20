import React, { useState, useMemo } from 'react'
import {
  Search,
  MapPin,
  MessageCircle,
  Bell,
  Printer,
  ShoppingBag,
  ShoppingCart,
  Home,
  User,
  X,
  CheckCircle2,
  Circle,
  ChevronDown,
  Package,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDiscovery } from '../../context/DiscoveryContext'
import DiscoveryModal from './DiscoveryModal'
import AddressSelectModal from './AddressSelectModal'
import NotificationModal from './NotificationModal'
import NavbarActionButton from './NavbarActionButton'
import { useCustomerAddressStore } from '../../store/useCustomerAddressStore'
import { useCartStore } from '../../store/useCartStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import BoxFallback from '../common/BoxFallback'
import { clsx } from 'clsx'

const CustomerNavbar: React.FC = () => {
  const { user } = useAuth()
  const { isDiscoveryOpen, initialCategory, openDiscovery, closeDiscovery } =
    useDiscovery()
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const { addresses, defaultAddressId, fetchAddresses } =
    useCustomerAddressStore()

  React.useEffect(() => {
    if (user) {
      fetchAddresses()
    }
  }, [user, fetchAddresses])

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === defaultAddressId),
    [addresses, defaultAddressId],
  )
  const addressText = selectedAddress
    ? `${selectedAddress.city || ''}, ${selectedAddress.province || ''}`.trim()
    : 'Select Delivery Address'
  const addressLineFull = selectedAddress
    ? `${selectedAddress.city}, ${selectedAddress.province} CP-${selectedAddress.postal_code}`
    : 'Select Address'

  const { getCartCount } = useCartStore()
  const { unreadCount } = useNotificationStore()
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  const plateStatus = 'Ready'
  const cartItemCount = getCartCount()

  if (location.pathname.startsWith('/admin')) {
    return null
  }

  return (
    <>
      {/* ─────────────────────────────────────────── */}
      {/*  DESKTOP NAVBAR  (unchanged)               */}
      {/* ─────────────────────────────────────────── */}
      <header className="CustomerNavbar fixed top-0 left-0 z-50 hidden h-20 w-full z-1000 items-center border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md min-[1251px]:px-12 md:flex md:px-8">
        <div className="CustomerNavbarLayout mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 min-[1251px]:gap-8 md:gap-4">
          {/* Left: Industrial Logo & Address Hub */}
          <div className="CustomerNavbarLeft flex shrink-0 items-center gap-3 min-[1251px]:gap-8">
            <Link
              to={user?.isLoggedIn ? '/homepage' : '/'}
              className="group mr-2 flex cursor-pointer items-center gap-2 min-[1251px]:mr-0"
            >
              <div className="bg-pixs-mint shadow-pixs-mint/20 flex h-10 w-10 items-center justify-center rounded-2xl text-2xl font-black text-slate-900 shadow-lg transition-transform group-hover:scale-110">
                P
              </div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 italic min-[1251px]:block">
                PIXS <span className="text-slate-400">SHOP</span>
              </h1>
            </Link>

            {/* Tablet-only Search and Address Icons */}
            <div className="hidden items-center gap-2 md:flex min-[1251px]:!hidden">
              <button
                onClick={() => openDiscovery()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <Search size={18} strokeWidth={2.5} />
              </button>
              {user?.isLoggedIn && (
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100"
                >
                  <MapPin
                    size={18}
                    className="text-pixs-mint"
                    strokeWidth={2.5}
                  />
                </button>
              )}
            </div>

            {user?.isLoggedIn && (
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="CustomerNavbarAddressButton hidden flex-col items-start rounded-2xl border border-transparent px-4 py-2 transition-all hover:border-slate-100 hover:bg-slate-50 min-[1251px]:flex"
              >
                <span className="flex items-center gap-1.5 text-[10px] leading-none font-black tracking-[2px] text-slate-400 uppercase italic">
                  Deliver to <MapPin size={10} className="text-pixs-mint" />
                </span>
                <p className="mt-1 max-w-[140px] truncate text-xs leading-none font-bold text-slate-900 italic">
                  {addressLineFull}
                </p>
              </button>
            )}
          </div>

          {/* Center: Search (Desktop Only) */}
          <div className="CustomerNavbarCenter group relative hidden max-w-2xl flex-1 justify-center min-[1251px]:flex">
            <div className="CustomerNavbarSearch relative w-full">
              <div className="group-focus-within:text-pixs-mint absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 transition-colors" />
              <button
                onClick={() => openDiscovery()}
                className="CustomerNavbarSearchInput hover:border-pixs-mint/30 group w-full overflow-hidden rounded-[24px] border border-slate-100/50 bg-slate-50 py-4 pr-6 pl-16 text-left shadow-inner transition-all hover:bg-white"
              >
                <span className="max-w-[120px] overflow-hidden text-[10px] font-black tracking-[4px] text-ellipsis whitespace-nowrap text-slate-400 uppercase italic opacity-50 group-hover:text-slate-500 min-[1251px]:max-w-none">
                  Search products, cups, eco bags...
                </span>
              </button>
              <button
                onClick={() => openDiscovery()}
                className="CustomerNavbarSearchButton hover:bg-pixs-mint absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-slate-100 transition-colors"
              >
                <Search
                  size={18}
                  className="text-slate-400 group-hover:text-slate-900"
                />
              </button>
            </div>
          </div>

          {/* Right: Identity Terminal */}
          <div className="CustomerNavbarRight flex shrink-0 items-center gap-2 min-[1251px]:gap-4">
            {user && user.role === 'customer' ? (
              <div className="flex items-center gap-1 min-[1251px]:gap-4">
                <div className="hidden flex-col items-center px-4 min-[1251px]:flex">
                  <div className="flex items-center gap-1.5 text-[9px] font-black tracking-tighter text-slate-900 uppercase italic opacity-80">
                    {plateStatus === 'Ready' ? (
                      <CheckCircle2 size={14} className="text-pixs-mint" />
                    ) : (
                      <Circle
                        size={14}
                        className="animate-pulse text-slate-300"
                      />
                    )}
                    Sync
                  </div>
                </div>
                <NavbarActionButton
                  to="/cart"
                  icon={ShoppingBag}
                  label="Cart"
                  badge={cartItemCount}
                />
                <NavbarActionButton
                  to="/screenplate"
                  icon={Printer}
                  label="Plate"
                  className="hidden sm:flex"
                />
                <NavbarActionButton
                  to="/chat"
                  icon={MessageCircle}
                  label="Chat"
                />
                <NavbarActionButton
                  to="/order"
                  icon={Package}
                  label="Orders"
                  className="nav-orders-button hidden sm:flex"
                />
                <NavbarActionButton
                  onClick={() => setIsNotificationModalOpen(true)}
                  icon={Bell}
                  label="Alert"
                  badge={unreadCount}
                />
                <div className="ProfileTerminal ml-2">
                  <Link
                    to="/settings"
                    className="group flex items-center gap-2 rounded-full border border-transparent bg-slate-50 py-1 pr-1 pl-1 shadow-sm transition-all hover:border-slate-100 hover:bg-white active:scale-95 sm:rounded-[28px] sm:pr-4"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-900 shadow-lg">
                      {user.profile_picture ? (
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
                        className={clsx("flex h-full w-full items-center justify-center bg-slate-900", user.profile_picture ? "hidden" : "flex")}
                        iconClassName="h-6 w-6 opacity-30 brightness-0 invert" 
                      />
                    </div>
                    <span className="hidden text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-colors group-hover:text-slate-900 sm:block">
                      Profile
                    </span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden items-center gap-4 md:flex">
                  <Link
                    to="/login"
                    className="px-6 py-3 text-[10px] font-black tracking-[4px] text-slate-500 uppercase italic transition-all hover:text-slate-900"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center rounded-3xl border border-white/10 bg-slate-900 px-8 py-4 text-[10px] font-black tracking-[4px] text-white uppercase italic shadow-2xl transition-all hover:bg-slate-800"
                  >
                    Join Now
                  </Link>
                </div>
                <div className="flex items-center gap-2 md:hidden">
                  <Link
                    to="/login"
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-2.5 text-[10px] font-black tracking-[3px] text-slate-900 uppercase italic transition-all hover:bg-slate-100 active:scale-95"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────── */}
      {/*  MOBILE NAVBAR  (fully redesigned)         */}
      {/* ─────────────────────────────────────────── */}
      <div className="md:hidden">
        {/* 🔝 TOP BAR — Foodpanda-style */}
        {(location.pathname === '/' || location.pathname === '/homepage') && (
          <div className="mobile-navbar-top fixed top-0 right-0 left-0 z-50 flex flex-col bg-white/90 shadow-[0_10px_40px_rgba(0,0,0,0.03)] backdrop-blur-3xl">
          <div className="flex h-16 items-center justify-between px-4">
            {/* 📍 Left — Location Block (Authenticated Only) */}
            {user?.isLoggedIn ? (
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="location-wrapper mr-4 flex flex-1 items-center gap-3 overflow-hidden transition-opacity duration-150 active:opacity-70"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-slate-900 shadow-lg shadow-slate-200">
                  <MapPin
                    size={16}
                    className="text-pixs-mint"
                    strokeWidth={3}
                  />
                </div>
                <div className="flex flex-col items-start overflow-hidden leading-tight">
                  <span className="mb-1 flex items-center gap-1 text-[8px] leading-none font-black tracking-[3px] text-slate-400 uppercase italic">
                    Arrival Node{' '}
                    <ChevronDown size={10} className="opacity-70" />
                  </span>
                  <p className="location-text max-w-[55vw] truncate overflow-hidden text-sm leading-none font-black tracking-tighter whitespace-nowrap text-slate-900 italic">
                    {addressText}
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-slate-900 opacity-50 shadow-lg shadow-slate-200">
                  <Package
                    size={16}
                    className="text-pixs-mint"
                    strokeWidth={2.5}
                  />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="mb-1 text-[8px] leading-none font-black tracking-[3px] text-slate-400 uppercase italic">
                    Status Node
                  </span>
                  <p className="text-sm leading-none font-black tracking-tighter text-slate-900/40 italic">
                    Guest Mode
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* 🔔 Alert Icon — Mobile Top */}
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="alert-button relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-slate-100 bg-slate-50 transition-all duration-150 hover:bg-slate-100 active:scale-95"
              >
                <Bell size={20} className="text-slate-900" strokeWidth={2.5} />
                {unreadCount > 0 && (
                  <span className="bg-pixs-mint absolute -top-1.5 -right-1.5 flex h-5 min-w-[18px] items-center justify-center rounded-full border border-slate-900/5 px-1 text-[9px] font-black text-slate-900 italic shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 🛒 Right — Cart Icon */}
              <Link
                to="/cart"
                className="cart-button relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-slate-100 bg-slate-50 transition-all duration-150 hover:bg-slate-100 active:scale-95"
              >
                <ShoppingCart
                  size={20}
                  className="text-slate-900"
                  strokeWidth={2.5}
                />
                {cartItemCount > 0 && (
                  <span className="bg-pixs-mint absolute -top-1.5 -right-1.5 flex h-5 min-w-[18px] items-center justify-center rounded-full border border-slate-900/5 px-1 text-[9px] font-black text-slate-900 italic shadow-lg">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* 🔍 Search Bar */}
          <div className="px-4 pb-4">
            <button
              onClick={() => openDiscovery()}
              className="hover:border-pixs-mint flex h-12 w-full items-center gap-4 rounded-[16px] border-2 border-slate-100 bg-white px-5 shadow-inner transition-transform active:scale-[0.98]"
            >
              <Search size={18} className="text-slate-300" strokeWidth={3} />
              <span className="flex-1 bg-transparent text-left text-[10px] font-black tracking-[4px] text-slate-900 uppercase italic opacity-30">
                Search Data Matrix...
              </span>
            </button>
          </div>
        </div>
      )}

        {/* 🔻 BOTTOM NAV — visible only when logged in */}
        {user?.isLoggedIn && (
          <div className="mobile-navbar-bottom pb-safe fixed right-0 bottom-0 left-0 z-50 flex h-20 items-center justify-around rounded-t-[32px] border-t border-slate-100 bg-white/90 px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] backdrop-blur-3xl">
            <Link
              to="/homepage"
              className="nav-item flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
            >
              <Home
                size={22}
                strokeWidth={isActive('/homepage') ? 3 : 2}
                className={
                  isActive('/homepage') ? 'text-slate-900' : 'text-slate-300'
                }
              />
              <span
                className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/homepage') ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}
              >
                Home
              </span>
            </Link>

            <Link
              to="/screenplate"
              className="nav-item flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
            >
              <Printer
                size={22}
                strokeWidth={isActive('/screenplate') ? 3 : 2}
                className={
                  isActive('/screenplate') ? 'text-slate-900' : 'text-slate-300'
                }
              />
              <span
                className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/screenplate') ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}
              >
                Plate
              </span>
            </Link>

            <Link
              to="/chat"
              className="nav-item flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
            >
              <MessageCircle
                size={22}
                strokeWidth={isActive('/chat') ? 3 : 2}
                className={
                  isActive('/chat') ? 'text-slate-900' : 'text-slate-300'
                }
              />
              <span
                className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/chat') ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}
              >
                Chat
              </span>
            </Link>

            <Link
              to="/order"
              className="nav-item nav-orders-button flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
            >
              <Package
                size={22}
                strokeWidth={isActive('/order') ? 3 : 2}
                className={
                  isActive('/order') ? 'text-slate-900' : 'text-slate-300'
                }
              />
              <span
                className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/order') ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}
              >
                Orders
              </span>
            </Link>

            <Link
              to="/settings"
              className="nav-item flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
            >
              {user?.name ? (
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-slate-100 shadow-lg">
                  {user.profile_picture ? (
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
                    className={clsx("flex h-full w-full items-center justify-center bg-slate-100", user.profile_picture ? "hidden" : "flex")}
                    iconClassName="h-4 w-4 opacity-30" 
                  />
                </div>
              ) : (
                <User
                  size={22}
                  strokeWidth={isActive('/settings') ? 3 : 2}
                  className={
                    isActive('/settings') ? 'text-slate-900' : 'text-slate-300'
                  }
                />
              )}
              <span
                className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/settings') ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}
              >
                Profile
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────── */}
      {/*  MODALS & OVERLAYS (unchanged)             */}
      {/* ─────────────────────────────────────────── */}
      <DiscoveryModal
        isOpen={isDiscoveryOpen}
        onClose={() => closeDiscovery()}
        initialCategory={initialCategory}
      />

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%', rotate: 5 }}
              animate={{ x: 0, rotate: 0 }}
              exit={{ x: '100%', rotate: 5 }}
              className="fixed top-0 right-0 bottom-0 z-[101] flex w-full max-w-[320px] flex-col rounded-l-[64px] bg-white p-10 shadow-2xl"
            >
              <div className="mb-12 flex items-center justify-between">
                <div className="bg-pixs-mint flex h-10 w-10 items-center justify-center rounded-2xl text-2xl font-black text-slate-900">
                  P
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="space-y-6">
                <button className="w-full border-b border-slate-50 py-4 text-left text-xs font-black tracking-[4px] text-slate-900 uppercase italic">
                  Home
                </button>
                <button className="w-full border-b border-slate-50 py-4 text-left text-xs font-black tracking-[4px] text-slate-900 uppercase italic">
                  Categories
                </button>
                <button className="w-full border-b border-slate-50 py-4 text-left text-xs font-black tracking-[4px] text-slate-900 uppercase italic">
                  About Us
                </button>
                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <Link
                    to="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex w-full items-center justify-center rounded-2xl bg-slate-50 py-4 text-center text-xs font-black tracking-[4px] text-slate-900 uppercase italic hover:bg-slate-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setShowMobileMenu(false)}
                    className="bg-pixs-mint shadow-pixs-mint/20 flex w-full items-center justify-center rounded-2xl py-4 text-center text-xs font-black tracking-[4px] text-slate-900 uppercase italic shadow-lg transition-all hover:scale-105"
                  >
                    Join Now
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddressSelectModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </>
  )
}

export default CustomerNavbar
