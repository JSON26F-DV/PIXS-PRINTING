import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { AlertCircle } from 'lucide-react'

interface PermissionWrapperProps {
  children: React.ReactNode
  allowedRoles: string[]
  hideIfNoAccess?: boolean
  tooltipText?: string
  className?: string
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  allowedRoles,
  hideIfNoAccess = false,
  tooltipText = 'Admin permission required',
  className = '',
}) => {
  const { user } = useAuth()
  const hasAccess = user && allowedRoles.includes(user.role)

  if (hideIfNoAccess && !hasAccess) return null

  return (
    <div className={`group relative ${className}`}>
      <div
        className={!hasAccess ? 'pointer-events-none opacity-50 grayscale' : ''}
      >
        {children}
      </div>

      {!hasAccess && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="PermissionLockedBadge pointer-events-none z-50 flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900 px-3 py-1.5 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 lg:pointer-events-auto">
            <AlertCircle size={12} className="text-amber-500" />
            <span className="text-[9px] font-black tracking-widest whitespace-nowrap text-white uppercase">
              {tooltipText}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
