import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface NavbarActionButtonProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  className?: string;
}

const NavbarActionButton: React.FC<NavbarActionButtonProps> = ({ 
  to, 
  icon: Icon, 
  label, 
  badge, 
  className = '' 
}) => {
  return (
    <Link 
      to={to} 
      className={`CustomerNavbarAction group flex flex-col items-center gap-1 hover:bg-slate-50 p-2 rounded-2xl transition-all relative ${className}`}
    >
      <div className="relative">
        <Icon size={20} className="CustomerNavbarActionIcon text-slate-400 group-hover:text-pixs-mint transition-colors" />
        {badge !== undefined && badge > 0 && (
          <span className="CustomerNavbarBadge absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1.5 bg-slate-900 text-pixs-mint text-[9px] font-black rounded-full flex items-center justify-center shadow-lg border border-pixs-mint/20">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </Link>
  );
};

export default NavbarActionButton;
