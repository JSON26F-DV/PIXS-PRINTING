import React from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface NavbarActionButtonProps {
  to?: string
  onClick?: () => void
  icon: LucideIcon
  label: string
  badge?: number
  className?: string
}

const NavbarActionButton: React.FC<NavbarActionButtonProps> = ({
  to,
  onClick,
  icon: Icon,
  label,
  badge,
  className = '',
}) => {
  const innerContent = (
    <>
      <div className="relative">
        <Icon
          size={20}
          className="CustomerNavbarActionIcon group-hover:text-pixs-mint text-slate-400 transition-colors"
        />
        {badge !== undefined && badge > 0 && (
          <span className="CustomerNavbarBadge text-pixs-mint border-pixs-mint/20 absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border bg-slate-900 px-1.5 text-[9px] font-black shadow-lg">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase italic transition-colors group-hover:text-slate-900">
        {label}
      </span>
    </>
  )

  const baseClasses = `CustomerNavbarAction group flex flex-col items-center gap-1 hover:bg-slate-50 p-2 rounded-2xl transition-all relative ${className}`

  if (onClick) {
    return (
      <button onClick={onClick} className={baseClasses}>
        {innerContent}
      </button>
    )
  }

  return (
    <Link to={to!} className={baseClasses}>
      <div className="relative">
        <Icon
          size={20}
          className="CustomerNavbarActionIcon group-hover:text-pixs-mint text-slate-400 transition-colors"
        />
        {badge !== undefined && badge > 0 && (
          <span className="CustomerNavbarBadge text-pixs-mint border-pixs-mint/20 absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border bg-slate-900 px-1.5 text-[9px] font-black shadow-lg">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase italic transition-colors group-hover:text-slate-900">
        {label}
      </span>
    </Link>
  )
}

export default NavbarActionButton
