import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PackageOpen, 
  ScrollText, 
  UserCog,
  Users,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Settings,
  MessageSquare,
  AlertCircle,
  CalendarCheck,
  TicketPercent,
  Activity,
  Layers,
  BarChart3,
  type LucideIcon
} from 'lucide-react';
import { useAuth, type RoleType } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import AdminLogoutModal from './admin/AdminLogoutModal';
import toast from 'react-hot-toast';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, collapsed, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 transition-all duration-300 group relative rounded-xl",
        collapsed ? "px-0 justify-center h-12" : "px-4 py-3",
        active 
          ? "text-emerald-700 bg-[#75EEA5]/10 font-bold" 
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
      )}
    >
      <Icon size={20} className={cn(active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
      {!collapsed && <span className="text-sm">{label}</span>}
      
      {collapsed && (
        <div className="absolute left-[calc(100%+8px)] px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
          {label}
        </div>
      )}
    </button>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, activeTab, setActiveTab }) => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  if (!user) return null;

  const handleLogoutConfirm = () => {
    setIsLoggingOut(true);
    
    // Quick logout per user request
    logout();
    setIsLoggingOut(false);
    setShowLogoutModal(false);
    toast.success('Session terminated');
    navigate('/login');
  };

  const navItems: Record<string, { id: string, label: string, icon: LucideIcon }[]> = {
    admin: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'orders', label: 'Orders', icon: ScrollText },
      { id: 'product', label: 'Product Catalog', icon: PackageOpen },
      { id: 'screenplate', label: 'Screenplate Registry', icon: Layers },
      { id: 'stock', label: 'Stock Analytics', icon: BarChart3 },
      { id: 'account', label: 'Accounts', icon: Users },
      { id: 'payroll', label: 'Attendance & Payroll', icon: CalendarCheck },
      { id: 'marketing', label: 'Marketing & Promos', icon: TicketPercent },
      { id: 'message', label: 'Enterprise Messaging', icon: MessageSquare },
      { id: 'setting', label: 'Settings', icon: Settings },
    ],
    staff: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'chat', label: 'Shift Chat', icon: MessageSquare },
      { id: 'livequeue', label: 'Live Queue', icon: Activity },
      { id: 'complaints', label: 'Complaints & QA', icon: AlertCircle },
      { id: 'payroll', label: 'Attendance', icon: CalendarCheck },
      { id: 'history', label: 'Order History', icon: ScrollText },
      { id: 'setting', label: 'Settings', icon: Settings },
    ],
    inventory: [
      { id: 'dashboard', label: 'Stock Manager', icon: LayoutDashboard },
      { id: 'raw-materials', label: 'Raw Materials', icon: PackageOpen },
      { id: 'payroll', label: 'Attendance', icon: CalendarCheck },
      { id: 'messenger', label: 'Comm-Hub', icon: MessageSquare },
      { id: 'setting', label: 'Settings', icon: Settings },
    ],
    customer: [
      { id: 'dashboard', label: 'My Orders', icon: ScrollText },
      { id: 'messenger', label: 'Comm-Hub', icon: MessageSquare },
      { id: 'profile', label: 'Profile', icon: UserCog },
    ],
  };

  const items = navItems[user.role] || [];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col group",
        isCollapsed ? "w-20" : "w-[280px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Toggle Button (Desktop) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 bg-white border border-slate-200 rounded-full p-1 z-50 shadow-sm hover:border-pixs-mint transition-colors"
        >
          {isCollapsed ? <ChevronRight size={12} className="text-slate-600" /> : <ChevronLeft size={12} className="text-slate-600" />}
        </button>

        <div className={cn("p-6", isCollapsed && "px-4")}>
          <div className="flex items-center gap-3 mb-10 overflow-hidden">
            <div className="min-w-[36px] w-9 h-9 bg-pixs-mint flex items-center justify-center font-black text-slate-900 text-lg flex-shrink-0 rounded-[12px] shadow-sm">
              P
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-black tracking-tight whitespace-nowrap animate-in fade-in duration-500 text-slate-900">
                PIXS <span className="text-slate-400">SHOP OS</span>
              </h1>
            )}
          </div>
          
          <nav className="space-y-1.5">
            {!isCollapsed && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3">Main Menu</p>}
            {items.map((item) => (
              <SidebarItem 
                key={item.id} 
                {...item} 
                active={activeTab === item.id} 
                collapsed={isCollapsed}
                onClick={() => {
                  setActiveTab(item.id);
                  const base = user.role === 'staff' ? '/staff' : (user.role === 'admin' || user.role === 'inventory' ? '/admin' : `/${user.role}`);
                  // Map roles to their primary view if necessary, otherwise use item.id
                  const path = item.id;
                  
                  navigate(`${base}/${path}`);
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 italic text-[10px] text-slate-400 p-4">
          {!isCollapsed && "Role Switcher (Dev)"}
          <select 
            className="w-full mt-1 bg-slate-50 border border-slate-200 text-[10px] p-1 rounded font-bold uppercase focus:outline-none focus:border-pixs-mint"
            value={user.role}
            onChange={(e) => login({ ...user, role: e.target.value as RoleType })}
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="inventory">Inventory</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className={cn(
              "w-full flex items-center gap-3 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-xl font-medium",
              isCollapsed ? "px-0 justify-center h-12" : "px-4 py-3"
            )}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <AdminLogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </>
  );
};

export default Sidebar;
