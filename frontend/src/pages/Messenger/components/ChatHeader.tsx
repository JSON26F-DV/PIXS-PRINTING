import React from 'react'
import { Phone, LayoutGrid, Circle } from 'lucide-react'
import { clsx } from 'clsx'

interface ChatHeaderProps {
  onToggleGallery: () => void
  isGalleryOpen: boolean
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleGallery,
  isGalleryOpen,
}) => {
  return (
    <header className="ChatHeader sticky top-0 z-20 flex items-center justify-between border-b border-slate-50 bg-white/80 px-6 py-4 backdrop-blur-xl md:px-10 md:py-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-slate-800 bg-slate-900 shadow-lg shadow-slate-900/10">
            <span className="text-pixs-mint text-xs font-black italic">
              PIXS
            </span>
          </div>
          <div className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
            <Circle size={10} className="fill-emerald-500 text-emerald-500" />
          </div>
        </div>

        <div>
          <h2 className="text-sm leading-none font-black tracking-tighter text-slate-900 uppercase italic">
            PIXS Production Admin
          </h2>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[9px] font-bold tracking-widest text-emerald-500 uppercase">
              Active Node
            </span>
            <span className="text-[8px] font-bold tracking-widest text-slate-300 uppercase opacity-40">
              ·
            </span>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              Response: ~5m
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Phone Link */}
        <a
          href="tel:+639123456789"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90"
          title="Direct Production Line"
        >
          <Phone size={18} />
        </a>

        <button
          onClick={onToggleGallery}
          className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90',
            isGalleryOpen
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900',
          )}
          title="Gallery Assets"
        >
          <LayoutGrid size={18} />
        </button>
      </div>
    </header>
  )
}

export default ChatHeader
