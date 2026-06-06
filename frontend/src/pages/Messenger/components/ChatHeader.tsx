import React from 'react'
import { Phone, LayoutGrid, Circle, Users, ArrowLeft, Settings } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '../../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

interface ChatHeaderProps {
  onToggleGallery: () => void
  isGalleryOpen: boolean
  onToggleAccounts?: () => void
  isAccountsOpen?: boolean
  onOpenAdminControls?: () => void
  title?: string
  subtitle?: string
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleGallery,
  isGalleryOpen,
  onToggleAccounts,
  isAccountsOpen,
  onOpenAdminControls,
  title,
  subtitle,
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="ChatHeader sticky top-0 z-20 flex items-center justify-between border-b border-slate-50 bg-white/80 px-3 py-3 backdrop-blur-xl min-[360px]:px-4 min-[414px]:px-6 md:px-10 md:py-6">
      <div 
        onClick={() => onOpenAdminControls?.()}
        className="flex cursor-pointer items-center gap-3 md:gap-4 hover:opacity-85 select-none"
      >
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-800 bg-slate-900 shadow-lg shadow-slate-900/10 min-[360px]:h-11 min-[360px]:w-11 min-[414px]:h-12 min-[414px]:w-12 min-[414px]:rounded-[18px]">
            <span className="text-pixs-mint text-[10px] min-[360px]:text-[11px] min-[414px]:text-xs font-black italic">
              PIXS
            </span>
          </div>
          <div className="absolute -right-0.5 -bottom-0.5 flex h-3 w-3 min-[414px]:h-3.5 min-[414px]:w-3.5 items-center justify-center rounded-full bg-white">
            <Circle size={8} className="fill-emerald-500 text-emerald-500" />
          </div>
        </div>

        <div>
          <h2 className="text-[12px] leading-none font-black tracking-tighter text-slate-900 uppercase italic min-[360px]:text-[13px] min-[414px]:text-sm">
            {title || 'PIXS Production Admin'}
          </h2>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[9px] font-bold tracking-widest text-emerald-500 uppercase">
              Active
            </span>
            <span className="text-[8px] font-bold tracking-widest text-slate-300 uppercase opacity-40">
              ·
            </span>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              {subtitle || 'Response: ~5m'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Phone Link */}
        <a
          href="tel:+639123456789"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90 min-[360px]:h-10 min-[360px]:w-10"
          title="Direct Production Line"
        >
          <Phone size={16} />
        </a>

        {/* Admin Controls Modal Button */}
        <button
          onClick={onOpenAdminControls}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90 min-[360px]:h-10 min-[360px]:w-10"
          title="Admin Controls"
        >
          <Settings size={16} />
        </button>

        {user?.role === 'admin' && (
          /* Dashboard Navigation Button */
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex h-9 px-3 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase italic tracking-wider transition-all hover:bg-slate-800 active:scale-95 min-[360px]:h-10 shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft size={14} className="text-pixs-mint" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        )}
      </div>
    </header>
  )
}

export default ChatHeader
