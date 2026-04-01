import React from 'react';
import { Phone, LayoutGrid, Circle } from 'lucide-react';
import { clsx } from 'clsx';

interface ChatHeaderProps {
  onToggleGallery: () => void;
  isGalleryOpen: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onToggleGallery, isGalleryOpen }) => {
  return (
    <header className="ChatHeader px-6 py-4 md:px-10 md:py-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-slate-900 rounded-[18px] flex items-center justify-center shadow-lg shadow-slate-900/10 border border-slate-800">
             <span className="text-pixs-mint font-black italic text-xs">PIXS</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
             <Circle size={10} className="fill-emerald-500 text-emerald-500" />
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter leading-none">PIXS Production Admin</h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active Node</span>
            <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest opacity-40">·</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Response: ~5m</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Phone Link */}
        <a 
          href="tel:+639123456789"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90"
          title="Direct Production Line"
        >
          <Phone size={18} />
        </a>

        <button 
          onClick={onToggleGallery}
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90",
            isGalleryOpen ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          )}
          title="Gallery Assets"
        >
          <LayoutGrid size={18} />
        </button>


      </div>
    </header>
  );
};

export default ChatHeader;
