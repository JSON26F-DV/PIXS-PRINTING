import React, { useState, useMemo, useEffect } from 'react'
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
  CheckCircle2,
  Circle,
  ChevronDown,
  Package,
  ArrowLeft,
  ShieldCheck,
  Check,
  CreditCard,
  type LucideIcon,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AddressSelectModal from './AddressSelectModal'
import NotificationModal from './NotificationModal'
import NavbarActionButton from './NavbarActionButton'
import { useCustomerAddressStore } from '../../store/useCustomerAddressStore'
import { useCartStore } from '../../store/useCartStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import BoxFallback from '../common/BoxFallback'
import { clsx } from 'clsx'
import { getProductById } from '../../api/products.api'

const CustomerNavbar: React.FC = () => {
  const { user } = useAuth()
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)

  const { addresses, defaultAddressId, fetchAddresses } =
    useCustomerAddressStore()

  React.useEffect(() => {
    // Only fetch customer addresses for customer accounts.
    // Staff/admin using the Messenger page would 401 otherwise.
    if (user?.isLoggedIn && user?.role === 'customer') {
      fetchAddresses()
    }
  }, [user?.isLoggedIn, user?.role, fetchAddresses])

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
  const { unreadCount, fetchNotifications } = useNotificationStore()

  useEffect(() => {
    if (user?.isLoggedIn && user?.role === 'customer') {
      fetchNotifications()
    }
  }, [user?.isLoggedIn, user?.role, fetchNotifications])
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = (path: string) => location.pathname === path

  const [productCategoryLabel, setProductCategoryLabel] = useState<string>('')

  useEffect(() => {
    const match = location.pathname.match(/^\/product\/([^/]+)/)
    if (match) {
      const id = match[1]
      getProductById(id)
        .then((res) => {
          if (res && res.data) {
            setProductCategoryLabel(res.data.category_label || '')
          }
        })
        .catch((err) => {
          console.error('Failed to fetch category label in navbar:', err)
        })
    } else {
      const handle = setTimeout(() => {
        setProductCategoryLabel('')
      }, 0)
      return () => clearTimeout(handle)
    }
  }, [location.pathname])

  const plateStatus = 'Ready'
  const cartItemCount = getCartCount()

  const handleAddressClick = () => {
    setIsAddressModalOpen(true)
  }

  if (location.pathname.startsWith('/admin')) {
    return null
  }

  // Also hide for non-customer roles on any path
  // (staff/inventory/technician use the Messenger via nested routes)
  if (user?.isLoggedIn && user?.role !== 'customer') {
    return null
  }

  // If user is not logged in, this layout component shouldn't be rendered (it is under ProtectedRoute)
  if (!user?.isLoggedIn) {
    return null
  }

  return (
    <>
      {/* ─────────────────────────────────────────── */}
      {/*  DESKTOP NAVBAR                             */}
      {/* ─────────────────────────────────────────── */}
      <header className="CustomerNavbar fixed top-0 left-0 z-50 hidden h-20 w-full items-center border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md min-[1251px]:px-12 md:flex md:px-8">
        <div className="CustomerNavbarLayout mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 min-[1251px]:gap-8 md:gap-4">
          {/* Left: Industrial Logo & Address Hub */}
          <div className="CustomerNavbarLeft flex shrink-0 items-center gap-3 min-[1251px]:gap-8">
            <Link
              to="/homepage"
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
                onClick={() => navigate('/discovery')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <Search size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={handleAddressClick}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <MapPin
                  size={18}
                  className="text-pixs-mint"
                  strokeWidth={2.5}
                />
              </button>
            </div>

            <button
              onClick={handleAddressClick}
              className="CustomerNavbarAddressButton hidden flex-col items-start rounded-2xl border border-transparent px-4 py-2 transition-all hover:border-slate-100 hover:bg-slate-50 min-[1251px]:flex"
            >
              <span className="flex items-center gap-1.5 text-[10px] leading-none font-black tracking-[2px] text-slate-400 uppercase italic">
                Deliver to <MapPin size={10} className="text-pixs-mint" />
              </span>
              <p className="mt-1 max-w-[140px] truncate text-xs leading-none font-bold text-slate-900 italic">
                {addressLineFull}
              </p>
            </button>
          </div>

          {/* Center: Search (Desktop Only) */}
          <div className="CustomerNavbarCenter group relative hidden max-w-2xl flex-1 justify-center min-[1251px]:flex">
            <div className="CustomerNavbarSearch relative w-full">
              <button
                onClick={() => navigate('/discovery')}
                className="CustomerNavbarSearchInput hover:border-pixs-mint/30 group w-full overflow-hidden rounded-[24px] border border-slate-100/50 bg-slate-50 py-4 pr-6 pl-16 text-left shadow-inner transition-all hover:bg-white"
              >
                <span className="max-w-[120px] overflow-hidden text-[10px] font-black tracking-[4px] text-ellipsis whitespace-nowrap text-slate-400 uppercase italic opacity-50 group-hover:text-slate-500 min-[1251px]:max-w-none">
                  Search products, cups, eco bags...
                </span>
              </button>
              <button
                onClick={() => navigate('/discovery')}
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
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────── */}
      {/*  MOBILE NAVBAR                             */}
      {/* ─────────────────────────────────────────── */}
      <div className="md:hidden">
        {/* 🔝 TOP BAR */}
        {(() => {
          const isProductPage = location.pathname.startsWith('/product/')
          const isCartPage = location.pathname === '/cart'
          const isTransactionsPage = location.pathname === '/transactions'
          const isOrdersPage = location.pathname === '/order'
          const isScreenplatePage = location.pathname === '/screenplate'
          const isHomepage = location.pathname === '/homepage' || location.pathname === '/'

          if (isHomepage) {
            return (
              <div className="mobile-navbar-top fixed top-0 left-0 right-0 z-40 flex flex-col bg-pixs-mint shadow-[0_10px_40px_rgba(0,0,0,0.03)] backdrop-blur-3xl w-full">
                <div className="flex h-16 items-center justify-between px-4">
                  {/* 📍 Left — Location Block */}
                  <button
                    onClick={handleAddressClick}
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
                      <span className="mb-1 flex items-center gap-1 text-[9px] leading-none text-white tracking-[3px] text-slate-400 uppercase italic">
                        Location {' '}
                        <ChevronDown size={10} className="opacity-70" />
                      </span>
                      <p className="location-text max-w-[55vw] truncate overflow-hidden text-white text-sm leading-none font-black tracking-tighter whitespace-nowrap text-slate-900 italic">
                        {addressText}...
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* 🔔 Alert Icon — Mobile Top */}
                    <button
                      onClick={() => setIsNotificationModalOpen(true)}
                      className="alert-button relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-pixs-mint transition-all duration-150 active:scale-95"
                    >
                      <Bell size={20} className="text-white" strokeWidth={2.5} />
                      {unreadCount > 0 && (
                        <span className="bg-white absolute -top-1.5 -right-1.5 flex h-5 min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-black text-pixs-mint italic shadow-lg">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* 🛒 Right — Cart Icon */}
                    <Link
                      to="/cart"
                      className="cart-button relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-pixs-mint transition-all duration-150 active:scale-95"
                    >
                      <ShoppingCart
                        size={20}
                        className="text-white"
                        strokeWidth={2.5}
                      />
                      {cartItemCount > 0 && (
                        <span className="bg-white absolute -top-1.5 -right-1.5 flex h-5 min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-black text-pixs-mint italic shadow-lg">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>

                {/* 🔍 Search Bar */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => navigate('/discovery')}
                    className="hover:border-pixs-mint flex h-12 w-full items-center gap-4 rounded-[16px] border-2 border-slate-100 bg-white px-5 shadow-inner transition-transform active:scale-[0.98]"
                  >
                    <Search size={18} className="text-slate-300" strokeWidth={3} />
                    <span className="flex-1 bg-transparent text-left text-[10px] font-black tracking-[4px] text-slate-900 uppercase italic opacity-30">
                      Search Data Matrix...
                    </span>
                  </button>
                </div>
              </div>
            )
          }

          if (isProductPage || isCartPage || isTransactionsPage || isOrdersPage || isScreenplatePage) {
            let centerText = ''
            let CenterIcon: LucideIcon = ShoppingBag
            let rightElement: React.ReactNode = null

            if (isProductPage) {
              centerText = productCategoryLabel || 'Product'
              CenterIcon = ShoppingBag
              rightElement = (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pixs-add-to-cart'))}
                  className="flex h-11 w-11 items-center justify-end text-slate-800 transition-transform active:scale-95"
                >
                  <ShoppingCart size={24} strokeWidth={2.5} />
                </button>
              )
            } else if (isCartPage) {
              centerText = 'Add To Cart'
              CenterIcon = ShoppingCart
              rightElement = (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pixs-checkout'))}
                  className="flex h-11 w-11 items-center justify-end text-slate-800 transition-transform active:scale-95"
                >
                  <Check size={24} strokeWidth={2.5} />
                </button>
              )
            } else if (isTransactionsPage) {
              centerText = 'Checkout'
              CenterIcon = ShieldCheck
              rightElement = (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pixs-purchase'))}
                  className="flex h-11 w-11 items-center justify-end text-slate-800 transition-transform active:scale-95"
                >
                  <CreditCard size={24} strokeWidth={2.5} />
                </button>
              )
            } else if (isOrdersPage) {
              centerText = 'Orders'
              CenterIcon = Package
              rightElement = null
            } else if (isScreenplatePage) {
              centerText = 'Screenplate'
              CenterIcon = Printer
              rightElement = (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pixs-screenplate-pay'))}
                  className="flex h-11 w-11 items-center justify-end text-slate-800 transition-transform active:scale-95"
                >
                  <Check size={24} strokeWidth={2.5} />
                </button>
              )
            }

            return (
              <div className="mobile-navbar-top relative z-40 flex h-16 items-center justify-between bg-transparent px-4 w-full">
                {/* Left: Back Button */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex h-11 w-11 items-center justify-start text-slate-800 transition-transform active:scale-95"
                >
                  <ArrowLeft size={24} strokeWidth={2.5} />
                </button>

                {/* Center: Badge */}
                <div className="flex w-[192px] h-10 items-center justify-center gap-2 rounded-[43px] bg-[#DCF5E1] px-3 font-bold text-slate-800 shadow-sm">
                  <CenterIcon size={16} className="shrink-0 text-emerald-600" />
                  <span className="truncate text-xs font-bold uppercase tracking-wider">
                    {centerText}
                  </span>
                </div>

                {/* Right: Action/Icon */}
                <div className="flex h-11 w-11 items-center justify-end">
                  {rightElement}
                </div>
              </div>
            )
          }

          return null
        })()}

        {/* 🔻 BOTTOM NAV */}
        <div className="mobile-navbar-bottom pb-safe fixed right-0 bottom-0 left-0 z-40 flex h-20 items-center justify-around rounded-t-[32px] border-t border-slate-100 bg-white px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          {/* Option 1: Home */}
          <Link
            to="/homepage"
            className="nav-item flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
          >
            <Home
              size={22}
              strokeWidth={isActive('/homepage') ? 3 : 2}
              className={
                isActive('/homepage') ? 'text-slate-900' : 'text-slate-400'
              }
            />
            <span
              className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/homepage') ? 'text-slate-900' : 'text-slate-400'}`}
            >
              Home
            </span>
          </Link>

          {/* Option 2: Cart / Discover (dynamic) */}
          {!(location.pathname.startsWith('/product/') || location.pathname === '/cart' || location.pathname === '/transactions') ? (
            <Link
              to="/discovery"
              className="nav-item flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
            >
              <Search
                size={22}
                strokeWidth={isActive('/discovery') ? 3 : 2}
                className={
                  isActive('/discovery') ? 'text-slate-900' : 'text-slate-400'
                }
              />
              <span
                className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/discovery') ? 'text-slate-900' : 'text-slate-400'}`}
              >
                Discover
              </span>
            </Link>
          ) : (
            <Link
              to="/cart"
              className="nav-item flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
            >
              <div className="relative">
                <ShoppingCart
                  size={22}
                  strokeWidth={isActive('/cart') ? 3 : 2}
                  className={
                    isActive('/cart') ? 'text-slate-900' : 'text-slate-400'
                  }
                />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white italic">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/cart') ? 'text-slate-900' : 'text-slate-400'}`}
              >
                Cart
              </span>
            </Link>
          )}


          {/* Option 3: Chat */}
          <Link
            to="/chat"
            className="nav-item flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
          >
            <MessageCircle
              size={22}
              strokeWidth={isActive('/chat') ? 3 : 2}
              className={
                isActive('/chat') ? 'text-slate-900' : 'text-slate-400'
              }
            />
            <span
              className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/chat') ? 'text-slate-900' : 'text-slate-400'}`}
            >
              Chat
            </span>
          </Link>

          {/* Option 4: Orders */}
          <Link
            to="/order"
            className="nav-item nav-orders-button flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
          >
            <Package
              size={22}
              strokeWidth={isActive('/order') ? 3 : 2}
              className={
                isActive('/order') ? 'text-slate-900' : 'text-slate-400'
              }
            />
            <span
              className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/order') ? 'text-slate-900' : 'text-slate-400'}`}
            >
              Orders
            </span>
          </Link>

          {/* Option 5: Profile */}
          <Link
            to="/settings"
            className="nav-item flex w-16 flex-col items-center gap-1.5 px-3 py-2 transition-all duration-150 active:scale-90"
          >
            {user?.name ? (
              <div className={clsx(
                "relative h-6 w-6 shrink-0 overflow-hidden rounded-full shadow-lg border",
                isActive('/settings') ? 'border-slate-900' : 'border-slate-200'
              )}>
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
                  isActive('/settings') ? 'text-slate-900' : 'text-slate-400'
                }
              />
            )}
            <span
              className={`text-[8px] leading-none font-black tracking-[2px] uppercase italic ${isActive('/settings') ? 'text-slate-900' : 'text-slate-400'}`}
            >
              Profile
            </span>
          </Link>
        </div>
      </div>

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
