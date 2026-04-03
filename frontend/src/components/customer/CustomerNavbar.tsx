import React, { useState, useMemo } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDiscovery } from '../../context/DiscoveryContext';
import AuthModal from './AuthModal';
import DiscoveryModal from './DiscoveryModal';
import AddressSelectModal from './AddressSelectModal';
import NotificationModal from './NotificationModal';
import NavbarActionButton from './NavbarActionButton';
import { useCustomerAddressStore } from '../../store/useCustomerAddressStore';
import { useCartStore } from '../../store/useCartStore';
import { useNotificationStore } from '../../store/useNotificationStore';

const CustomerNavbar: React.FC = () => {
  const { user } = useAuth();
  const { isDiscoveryOpen, initialCategory, openDiscovery, closeDiscovery } = useDiscovery();
  const [authModal, setAuthModal] = useState<{ open: boolean; type: 'signin' | 'signup' }>({ open: false, type: 'signin' });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { addresses, defaultAddressId } = useCustomerAddressStore();
  const selectedAddress = useMemo(() => addresses.find(a => a.id === defaultAddressId), [addresses, defaultAddressId]);
  const addressText = selectedAddress 
    ? `${selectedAddress.city || ''}, ${selectedAddress.province || ''}`.trim() 
    : 'Select Delivery Address';
  const addressLineFull = selectedAddress
    ? `${selectedAddress.city}, ${selectedAddress.province} CP-${selectedAddress.postal_code}`
    : 'Select Address';
  
  const { getCartCount } = useCartStore();
  const { unreadCount } = useNotificationStore();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const plateStatus = "Ready";
  const cartItemCount = getCartCount();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* ─────────────────────────────────────────── */}
      {/*  DESKTOP NAVBAR  (unchanged)               */}
      {/* ─────────────────────────────────────────── */}
      <header className="CustomerNavbar hidden lg:flex sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 items-center px-6">
        <div className="CustomerNavbarLayout max-w-[1440px] w-full mx-auto flex items-center justify-between gap-4 md:gap-12">
          
          {/* Left: Industrial Logo & Address Hub */}
          <div className="CustomerNavbarLeft flex items-center gap-8 shrink-0">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-pixs-mint flex items-center justify-center text-slate-900 font-black text-2xl rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-pixs-mint/20">
                P
              </div>
              <h1 className="text-xl font-black text-slate-900 hidden lg:block tracking-tighter italic">PIXS <span className="text-slate-400">SHOP</span></h1>
            </Link>

            <button 
              onClick={() => setIsAddressModalOpen(true)}
              className="CustomerNavbarAddressButton hidden lg:flex flex-col items-start px-4 py-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl transition-all"
            >
              <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 flex items-center gap-1.5 leading-none italic">
                Deliver to <MapPin size={10} className="text-pixs-mint" />
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1 truncate max-w-[140px] italic leading-none">
                {addressLineFull}
              </p>
            </button>
          </div>

          {/* Center: Search */}
          <div className="CustomerNavbarCenter flex-1 max-w-2xl relative group flex justify-end md:justify-center">
            <div className="CustomerNavbarSearch hidden md:block w-full relative">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pixs-mint transition-colors" />
               <button 
                 onClick={() => openDiscovery()}
                 className="CustomerNavbarSearchInput w-full bg-slate-50 border border-slate-100/50 hover:border-pixs-mint/30 hover:bg-white rounded-[24px] py-4 pl-16 pr-6 text-left shadow-inner transition-all group overflow-hidden"
               >
                 <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-[4px] italic opacity-50">Search products, cups, eco bags...</span>
               </button>
               <button 
                 onClick={() => openDiscovery()}
                 className="CustomerNavbarSearchButton absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-slate-100 rounded-xl hover:bg-pixs-mint transition-colors"
               >
                 <Search size={18} className="text-slate-400 group-hover:text-slate-900" />
               </button>
            </div>
          </div>

          {/* Right: Identity Terminal */}
          <div className="CustomerNavbarRight flex items-center gap-2 lg:gap-4 shrink-0">
            {user && user.role === 'customer' ? (
              <div className="flex items-center gap-1 lg:gap-4">
                <div className="hidden lg:flex flex-col items-center px-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-900 uppercase tracking-tighter italic opacity-80">
                    {plateStatus === "Ready"
                      ? <CheckCircle2 size={14} className="text-pixs-mint" />
                      : <Circle size={14} className="text-slate-300 animate-pulse" />}
                    Sync
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-100 hidden lg:block mx-2" />
                <NavbarActionButton to="/screenplate" icon={Printer} label="Plate" className="hidden sm:flex" />
                <NavbarActionButton to="/chat" icon={MessageCircle} label="Chat" />
                <NavbarActionButton onClick={() => setIsNotificationModalOpen(true)} icon={Bell} label="Alert" badge={unreadCount} />
                <NavbarActionButton to="/cart" icon={ShoppingBag} label="Cart" badge={cartItemCount} />
                <div className="ProfileTerminal ml-2">
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 pl-1 pr-1 sm:pr-4 py-1 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-full sm:rounded-[28px] transition-all group shadow-sm active:scale-95"
                  >
                    <div className="w-10 h-10 bg-slate-900 flex items-center justify-center text-pixs-mint font-black text-sm rounded-full border border-pixs-mint/20 shadow-lg shadow-pixs-mint/20 group-hover:scale-105 transition-transform">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors italic">Profile</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:flex items-center gap-4">
                  <button 
                    onClick={() => setAuthModal({ open: true, type: 'signin' })}
                    className="px-6 py-3 text-[10px] font-black text-slate-500 hover:text-slate-900 transition-all uppercase tracking-[4px] italic"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => setAuthModal({ open: true, type: 'signup' })}
                    className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black rounded-3xl shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-[4px] border border-white/10 italic"
                  >
                    Join Now
                  </button>
                </div>
                <div className="md:hidden flex items-center gap-2">
                  <button 
                    onClick={() => setAuthModal({ open: true, type: 'signin' })}
                    className="px-5 py-2.5 bg-slate-50 text-slate-900 text-[10px] font-black rounded-2xl border border-slate-100 uppercase tracking-[3px] italic hover:bg-slate-100 transition-all active:scale-95"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────── */}
      {/*  MOBILE NAVBAR  (fully redesigned)         */}
      {/* ─────────────────────────────────────────── */}
      <div className="lg:hidden">

        {/* 🔝 TOP BAR — Foodpanda-style */}
        <div className="mobile-navbar-top fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] z-50 flex flex-col rounded-b-[32px]">
          
          <div className="flex items-center justify-between px-4 h-16">
            {/* 📍 Left — Location Block */}
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="location-wrapper flex items-center gap-3 overflow-hidden flex-1 mr-4 active:opacity-70 transition-opacity duration-150"
            >
              <div className="w-10 h-10 rounded-[12px] bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-200">
                <MapPin size={16} className="text-pixs-mint" strokeWidth={3} />
              </div>
              <div className="overflow-hidden flex flex-col items-start leading-tight">
                <span className="text-[8px] font-black uppercase tracking-[3px] italic text-slate-400 leading-none mb-1 flex items-center gap-1">
                  Arrival Node <ChevronDown size={10} className="opacity-70" />
                </span>
                <p className="location-text text-sm font-black italic tracking-tighter text-slate-900 truncate whitespace-nowrap overflow-hidden max-w-[55vw] leading-none">
                  {addressText}
                </p>
              </div>
            </button>

            {/* 🛒 Right — Cart Icon */}
            <Link
              to="/cart"
              className="cart-button relative shrink-0 w-11 h-11 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-[14px] hover:bg-slate-100 active:scale-95 transition-all duration-150"
            >
              <ShoppingCart size={20} className="text-slate-900" strokeWidth={2.5} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-pixs-mint text-slate-900 border border-slate-900/5 text-[9px] font-black min-w-[18px] h-5 flex items-center justify-center rounded-full px-1 shadow-lg italic">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* 🔍 Search Bar */}
          <div className="px-4 pb-4">
            <button 
              onClick={() => openDiscovery()}
              className="w-full h-12 bg-white rounded-[16px] flex items-center px-5 gap-4 active:scale-[0.98] transition-transform border-2 border-slate-100 hover:border-pixs-mint shadow-inner"
            >
              <Search size={18} className="text-slate-300" strokeWidth={3} />
              <span className="text-[10px] font-black tracking-[4px] uppercase italic bg-transparent flex-1 text-left opacity-30 text-slate-900">
                Search Data Matrix...
              </span>
            </button>
          </div>

        </div>

        {/* 🔻 BOTTOM NAV — visible only when logged in */}
        {user?.isLoggedIn && (
          <div className="mobile-navbar-bottom fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-3xl border-t border-slate-100 flex items-center justify-around z-50 px-2 pb-safe rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">

            <Link to="/" className="nav-item flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-150 px-3 py-2 w-16">
              <Home
                size={22}
                strokeWidth={isActive('/') ? 3 : 2}
                className={isActive('/') ? 'text-slate-900' : 'text-slate-300'}
              />
              <span className={`text-[8px] font-black uppercase italic tracking-[2px] leading-none ${isActive('/') ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}>
                Home
              </span>
            </Link>

            <Link to="/screenplate" className="nav-item flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-150 px-3 py-2 w-16">
              <Printer
                size={22}
                strokeWidth={isActive('/screenplate') ? 3 : 2}
                className={isActive('/screenplate') ? 'text-slate-900' : 'text-slate-300'}
              />
              <span className={`text-[8px] font-black uppercase italic tracking-[2px] leading-none ${isActive('/screenplate') ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}>
                Plate
              </span>
            </Link>

            <Link to="/chat" className="nav-item flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-150 px-3 py-2 w-16">
              <MessageCircle
                size={22}
                strokeWidth={isActive('/chat') ? 3 : 2}
                className={isActive('/chat') ? 'text-slate-900' : 'text-slate-300'}
              />
              <span className={`text-[8px] font-black uppercase italic tracking-[2px] leading-none ${isActive('/chat') ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}>
                Chat
              </span>
            </Link>

            <button onClick={() => setIsNotificationModalOpen(true)} className="nav-item flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-150 px-3 py-2 w-16 relative">
              <div className="relative">
                <Bell
                  size={22}
                  strokeWidth={isNotificationModalOpen ? 3 : 2}
                  className={isNotificationModalOpen ? 'text-slate-900' : 'text-slate-300'}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-pixs-mint border border-slate-900/5 text-slate-900 text-[8px] font-black min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 shadow-lg italic">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[8px] font-black uppercase italic tracking-[2px] leading-none ${isNotificationModalOpen ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}>
                Alert
              </span>
            </button>

            <Link to="/settings" className="nav-item flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-150 px-3 py-2 w-16">
              {user?.name ? (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ${isActive('/settings') ? 'bg-slate-900 text-pixs-mint' : 'bg-slate-100 text-slate-400'}`}>
                  {user.name[0].toUpperCase()}
                </div>
              ) : (
                <User
                  size={22}
                  strokeWidth={isActive('/settings') ? 3 : 2}
                  className={isActive('/settings') ? 'text-slate-900' : 'text-slate-300'}
                />
              )}
              <span className={`text-[8px] font-black uppercase italic tracking-[2px] leading-none ${isActive('/settings') ? 'text-slate-900' : 'text-slate-300 opacity-60'}`}>
                User
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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: '100%', rotate: 5 }}
              animate={{ x: 0, rotate: 0 }}
              exit={{ x: '100%', rotate: 5 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[320px] bg-white z-[101] shadow-2xl p-10 flex flex-col rounded-l-[64px]"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="w-10 h-10 bg-pixs-mint flex items-center justify-center text-slate-900 font-black text-2xl rounded-2xl">P</div>
                <button onClick={() => setShowMobileMenu(false)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center active:scale-90 transition-all">
                  <X size={24} />
                </button>
              </div>
              <nav className="space-y-6">
                <button className="w-full py-4 text-xs font-black text-slate-900 uppercase tracking-[4px] border-b border-slate-50 text-left italic">Home</button>
                <button className="w-full py-4 text-xs font-black text-slate-900 uppercase tracking-[4px] border-b border-slate-50 text-left italic">Categories</button>
                <button className="w-full py-4 text-xs font-black text-slate-900 uppercase tracking-[4px] border-b border-slate-50 text-left italic">About Us</button>
                <div className="pt-6 space-y-4 border-t border-slate-100">
                  <button onClick={() => { setAuthModal({ open: true, type: 'signin' }); setShowMobileMenu(false); }} className="w-full py-4 bg-slate-50 text-xs font-black text-slate-900 uppercase tracking-[4px] rounded-2xl text-center italic hover:bg-slate-100">Sign In</button>
                  <button onClick={() => { setAuthModal({ open: true, type: 'signup' }); setShowMobileMenu(false); }} className="w-full py-4 bg-pixs-mint text-xs font-black text-slate-900 uppercase tracking-[4px] rounded-2xl text-center italic shadow-lg shadow-pixs-mint/20 hover:scale-105 transition-all">Join Now</button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={authModal.open} 
        onClose={() => setAuthModal({ ...authModal, open: false })} 
        initialType={authModal.type}
      />
      <AddressSelectModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
      />
      <NotificationModal 
        isOpen={isNotificationModalOpen} 
        onClose={() => setIsNotificationModalOpen(false)} 
      />
    </>
  );
};

export default CustomerNavbar;