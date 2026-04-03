import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Menu, Search, X, ChevronRight, Package, FileText, Clock, User, MessageSquare, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContextInstance';
import type { INotification } from '../types/notification';
import type { User as AuthUser } from '../context/AuthContext';
import type { NavigateFunction } from 'react-router-dom';
import productsData from '../data/products.json';
import workflowData from '../data/workflow.json';
import usersData from '../data/users.json';

interface IProduct {
  id: string;
  name: string;
  category?: string;
  base_price: number;
}

interface IWorkflowOrder {
  id: string;
  product: string;
  customer: string;
  qty?: number;
  status?: string;
}

interface IUserData {
  id: string;
  name: string;
  role?: string;
  type?: string;
  email: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'customer' | 'menu';
  title: string;
  subtitle?: string;
  link: string;
}

interface TopbarProps {
  onMenuClick: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'orders', label: 'Orders', icon: 'ScrollText' },
  { id: 'products', label: 'Products', icon: 'PackageOpen' },
  { id: 'accounts', label: 'Accounts', icon: 'Users' },
  { id: 'inventory', label: 'Inventory Control', icon: 'PackageOpen' },
  { id: 'complaints', label: 'Complaints & QA', icon: 'AlertCircle' },
  { id: 'payroll', label: 'Attendance & Payroll', icon: 'CalendarCheck' },
  { id: 'marketing', label: 'Marketing & Promos', icon: 'TicketPercent' },
  { id: 'messenger', label: 'Messenger', icon: 'MessageSquare' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
  { id: 'livequeue', label: 'Live Queue', icon: 'Activity' },
  { id: 'tasklist', label: 'To-Do List', icon: 'CheckSquare' },
  { id: 'history', label: 'Order History', icon: 'ScrollText' },
];

const SmartSearch: React.FC<{ 
  user: AuthUser;
  navigate: NavigateFunction;
  setActiveTab: (tab: string) => void; 
  onClose: () => void 
}> = ({ user, navigate, setActiveTab, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const searchResults: SearchResult[] = [];

      menuItems
        .filter(item => item.label.toLowerCase().includes(lowerQuery))
        .forEach(item => {
          searchResults.push({
            id: `menu-${item.id}`,
            type: 'menu',
            title: item.label,
            subtitle: 'Menu',
            link: item.id,
          });
        });

      (productsData as IProduct[])
        .filter(p => p.name.toLowerCase().includes(lowerQuery) || p.category?.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach(p => {
          searchResults.push({
            id: `product-${p.id}`,
            type: 'product',
            title: p.name,
            subtitle: `${p.category} • ₱${p.base_price}`,
            link: 'products',
          });
        });

      (workflowData.cartOrders as IWorkflowOrder[])
        .filter(o => o.id.toLowerCase().includes(lowerQuery) || o.product.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach(o => {
          searchResults.push({
            id: `order-${o.id}`,
            type: 'order',
            title: `#${o.id} - ${o.product}`,
            subtitle: `${o.customer} • ${o.qty} pcs`,
            link: 'orders',
          });
        });

      (workflowData.productionQueue as IWorkflowOrder[])
        .filter(o => o.id.toLowerCase().includes(lowerQuery) || o.product.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach(o => {
          searchResults.push({
            id: `prod-${o.id}`,
            type: 'order',
            title: `#${o.id} - ${o.product}`,
            subtitle: `${o.customer} • ${o.status}`,
            link: 'orders',
          });
        });

      ([...usersData.employees, ...usersData.customers] as IUserData[])
        .filter(u => u.name.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach(u => {
          searchResults.push({
            id: `user-${u.id}`,
            type: 'customer',
            title: u.name,
            subtitle: `${u.role || u.type} • ${u.email}`,
            link: 'accounts',
          });
        });

      setResults(searchResults);
    }, 100);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    setTimeout(() => {
      setActiveTab(result.link);
      navigate(`/${user.role}/${result.link}`);
    }, 150);
  };

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(r => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  const typeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    menu: { label: 'Menu', icon: ChevronRight, color: 'text-slate-500' },
    product: { label: 'Products', icon: Package, color: 'text-blue-500' },
    order: { label: 'Orders', icon: FileText, color: 'text-emerald-500' },
    customer: { label: 'Customers', icon: User, color: 'text-purple-500' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl shadow-slate-900/20 overflow-hidden"
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search orders, products, customers, menu..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-100 rounded">
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!query && (
            <div className="p-8 text-center">
              <Search size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">Start typing to search...</p>
              <p className="text-xs text-slate-300 mt-1">Orders, products, customers, or menu items</p>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">No results found for "{query}"</p>
            </div>
          )}

          {Object.entries(groupedResults).map(([type, items]) => {
            const typeInfo = typeLabels[type];
            const Icon = typeInfo.icon;
            return (
              <div key={type} className="border-b border-slate-50 last:border-0">
                <div className="px-4 py-2 bg-slate-50/50">
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5', typeInfo.color)}>
                    <Icon size={10} />
                    {typeInfo.label}
                  </span>
                </div>
                {items.map(result => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono">ESC</kbd> to close</span>
          <span>{results.length} results</span>
        </div>
      </motion.div>
    </div>
  );
};

const NotificationDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: INotification['type']) => {
    switch (type) {
      case 'message': return <MessageSquare size={14} className="text-blue-500" />;
      case 'complaint': return <AlertTriangle size={14} className="text-rose-500" />;
      case 'low_stock': return <Package size={14} className="text-amber-500" />;
      case 'order_update': return <FileText size={14} className="text-emerald-500" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'bg-rose-100 text-rose-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-[24px] shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-pixs-mint text-slate-900 text-[10px] font-bold rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[10px] text-[#1877F2] hover:underline font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={24} className="mx-auto text-slate-200 mb-2" />
            <p className="text-sm text-slate-400">No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notif: INotification) => (
            <button
              key={notif.id}
              onClick={() => {
                markAsRead(notif.id);
                onClose();
              }}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0',
                !notif.isRead && 'bg-[#1877F2]/5'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">{notif.title}</p>
                    {!notif.isRead && <div className="w-2 h-2 bg-[#1877F2] rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{notif.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(notif.timestamp)}
                    </span>
                    {notif.severity && (
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase', getSeverityColor(notif.severity))}>
                        {notif.severity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <button className="w-full text-center text-[11px] text-slate-500 hover:text-slate-700 font-medium">
            View all notifications
          </button>
        </div>
      )}
    </motion.div>
  );
};

const Topbar: React.FC<TopbarProps> = ({ onMenuClick, activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-md transition-colors"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-900 capitalize flex items-center">
              {user.role}
              <span className="text-slate-300 mx-2 font-normal">/</span>
              <span className="text-slate-500 capitalize">{activeTab}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={() => setShowSearch(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group"
          >
            <Search size={14} className="text-slate-400 group-hover:text-slate-500" />
            <span className="text-xs text-slate-400 font-medium">Search...</span>
            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono">
              <span>⌘</span>K
            </kbd>
          </button>

          <button
            onClick={() => setShowSearch(true)}
            className="sm:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Search size={18} />
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
                VERIFIED {user.role}
              </p>
            </div>
            <div className="w-10 h-10 rounded-[14px] bg-[#75EEA5]/20 border-2 border-[#75EEA5]/30 flex items-center justify-center font-black text-emerald-700 shadow-sm shadow-[#75EEA5]/10">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showSearch && (
          <SmartSearch 
             user={user} 
             navigate={navigate} 
             setActiveTab={setActiveTab} 
             onClose={() => setShowSearch(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Topbar;
