import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

interface PermissionWrapperProps {
  children: React.ReactNode;
  allowedRoles: string[];
  hideIfNoAccess?: boolean;
  tooltipText?: string;
  className?: string;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({ 
  children, 
  allowedRoles, 
  hideIfNoAccess = false,
  tooltipText = "Admin permission required",
  className = ""
}) => {
  const { user } = useAuth();
  const hasAccess = user && allowedRoles.includes(user.role);

  if (hideIfNoAccess && !hasAccess) return null;

  return (
    <div className={`relative group ${className}`}>
      <div className={!hasAccess ? "opacity-50 pointer-events-none grayscale" : ""}>
        {children}
      </div>
      
      {!hasAccess && (
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="PermissionLockedBadge flex items-center gap-2 px-3 py-1.5 bg-slate-900 shadow-xl border border-slate-700/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none lg:pointer-events-auto z-50">
              <AlertCircle size={12} className="text-amber-500" />
              <span className="text-[9px] font-black uppercase text-white tracking-widest whitespace-nowrap">{tooltipText}</span>
           </div>
        </div>
      )}
    </div>
  );
};
