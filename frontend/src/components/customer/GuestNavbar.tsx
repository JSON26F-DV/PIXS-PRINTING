import React from 'react'
import {
  Search,
  MapPin,
  ChevronDown,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const GuestNavbar: React.FC = () => {
  const navigate = useNavigate()

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
              to="/"
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
                onClick={() => navigate('/login')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <Search size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => navigate('/login')}
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
              onClick={() => navigate('/login')}
              className="CustomerNavbarAddressButton hidden flex-col items-start rounded-2xl border border-transparent px-4 py-2 transition-all hover:border-slate-100 hover:bg-slate-50 min-[1251px]:flex"
            >
              <span className="flex items-center gap-1.5 text-[10px] leading-none font-black tracking-[2px] text-slate-400 uppercase italic">
                Deliver to <MapPin size={10} className="text-pixs-mint" />
              </span>
              <p className="mt-1 max-w-[140px] truncate text-xs leading-none font-bold text-slate-900 italic">
                Guest Mode
              </p>
            </button>
          </div>

          {/* Center: Search (Desktop Only) */}
          <div className="CustomerNavbarCenter group relative hidden max-w-2xl flex-1 justify-center min-[1251px]:flex">
            <div className="CustomerNavbarSearch relative w-full">
              <button
                onClick={() => navigate('/login')}
                className="CustomerNavbarSearchInput hover:border-pixs-mint/30 group w-full overflow-hidden rounded-[24px] border border-slate-100/50 bg-slate-50 py-4 pr-6 pl-16 text-left shadow-inner transition-all hover:bg-white"
              >
                <span className="max-w-[120px] overflow-hidden text-[10px] font-black tracking-[4px] text-ellipsis whitespace-nowrap text-slate-400 uppercase italic opacity-50 group-hover:text-slate-500 min-[1251px]:max-w-none">
                  Search products, cups, eco bags...
                </span>
              </button>
              <button
                onClick={() => navigate('/login')}
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
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────── */}
      {/*  MOBILE NAVBAR                             */}
      {/* ─────────────────────────────────────────── */}
      <div className="md:hidden">
        {/* 🔝 TOP BAR — Foodpanda-style */}
        <div className="mobile-navbar-top fixed top-0 right-0 left-0 z-50 flex flex-col bg-white/90 shadow-[0_10px_40px_rgba(0,0,0,0.03)] backdrop-blur-3xl">
          <div className="flex h-16 items-center justify-between px-4">
            {/* 📍 Left — Location Block */}
            <button
              onClick={() => navigate('/login')}
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
                  Guest Mode
                </p>
              </div>
            </button>
          </div>

          {/* 🔍 Search Bar / Auth Actions */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 w-full">
              <Link
                to="/login"
                className="flex flex-1 items-center justify-center rounded-[16px] border border-slate-100 bg-slate-50 py-3.5 text-[10px] font-black tracking-[4px] text-slate-900 uppercase italic transition-all active:scale-95"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex flex-1 items-center justify-center rounded-[16px] border border-white/10 bg-slate-900 py-3.5 text-[10px] font-black tracking-[4px] text-white uppercase italic shadow-lg transition-all active:scale-95"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default GuestNavbar
