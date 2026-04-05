import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Users, 
  ShoppingBag, 
  Star, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
  MoreVertical
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

// Data Sources (Simulated relational structure)
import rawOrders from '../../data/order.json';
import rawUsers from '../../data/user.json';

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sub-components declared outside to avoid re-creation on render
const RatingStars = ({ rating }: { rating: number }) => (
  <div className="orders-rating-stars flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star 
        key={s} 
        size={12} 
        className={cn(s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} 
      />
    ))}
  </div>
);

// Interfaces
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  quantity: number;
  variant: {
    unitPrice: number;
    size: string;
    id: string;
  };
  colors: { name: string; hex: string }[];
  plate: { name: string; setupFee: number; printPricePerUnit: number } | null;
  customRequirements?: string;
}

interface Order {
  order_id: string; // Changed from id to order_id to match order.json
  user_id: string;
  products: OrderItem[]; // Changed from items to products
  total_amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
  feedback?: string;
  complaint?: string;
  rating?: number;
  discount?: {
    discount_id: string | null;
    total_discount_amount: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  // --- STATE ---
  const [orders, setOrders] = useState<Order[]>(rawOrders);
  const [users] = useState<User[]>(rawUsers);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('date-desc');
  const [ratingFilter, setRatingFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- DERIVED STATE / MEMOIZED LOGIC ---
  const customers = useMemo(() => {
    return users.filter(u => u.role === 'customer').map(c => {
      const customerOrders = orders.filter(o => o.user_id === c.id);
      const totalSpent = customerOrders.reduce((sum, o) => sum + o.total_amount, 0);
      return {
        ...c,
        orderCount: customerOrders.length,
        totalSpent
      };
    }).sort((a, b) => b.orderCount - a.orderCount);
  }, [users, orders]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Customer Selection
    if (selectedCustomerId) {
      result = result.filter(o => o.user_id === selectedCustomerId);
    }

    // Global Search
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      result = result.filter(o => {
        const customer = users.find(u => u.id === o.user_id);
        return (
          o.order_id.toLowerCase().includes(q) ||
          customer?.name.toLowerCase().includes(q) ||
          customer?.email.toLowerCase().includes(q)
        );
      });
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Rating Filter
    if (ratingFilter !== 'all') {
      result = result.filter(o => o.rating === parseInt(ratingFilter));
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount-desc': return b.total_amount - a.total_amount;
        case 'amount-asc': return a.total_amount - b.total_amount;
        case 'name-asc': {
          const nameA = users.find(u => u.id === a.user_id)?.name || '';
          const nameB = users.find(u => u.id === b.user_id)?.name || '';
          return nameA.localeCompare(nameB);
        }
        default: return 0;
      }
    });

    return result;
  }, [orders, selectedCustomerId, globalSearch, statusFilter, ratingFilter, sortOption, users]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'Completed').length;
    const cancelled = orders.filter(o => o.status === 'Cancelled').length;
    const ratedOrders = orders.filter(o => (o.rating || 0) > 0);
    const avgRating = ratedOrders.length > 0 
      ? (ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1)
      : '0.0';

    return {
      total: orders.length,
      completed,
      cancelled,
      avgRating
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    orders.forEach(o => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });

    const statusPie = Object.entries(statusMap).map(([name, value]) => ({
      name,
      value,
      color: 
        name === 'Completed' ? '#10b981' : 
        name === 'Pending' ? '#f59e0b' : 
        name === 'Processing' ? '#3b82f6' : 
        name === 'Cancelled' ? '#ef4444' : '#64748b'
    }));

    const customerBar = customers.slice(0, 5).map(c => ({
      name: c.name.split(' ')[0],
      orders: c.orderCount
    }));

    return { statusPie, customerBar };
  }, [orders, customers]);

  // --- HANDLERS ---
  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => {
      if (o.order_id === orderId) {
        // Validation: Cannot update Completed -> Pending
        if (o.status === 'Completed' && newStatus === 'Pending') return o;
        return {
          ...o,
          status: newStatus,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    }));
  };

  return (
    <div className="orders-page flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1700px] mx-auto px-4 lg:px-10 pb-16">
      
      {/* 🚀 ANALYTICS HEADER */}
      <section className="orders-analytics grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="orders-stats-card p-6 bg-slate-900 rounded-[24px] text-white overflow-hidden relative group">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
             <ShoppingBag size={80} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[3px] opacity-70 mb-2">Total System Load</p>
          <h3 className="text-4xl font-black italic tracking-tighter">{stats.total} <span className="text-xs font-bold text-[#75EEA5]">ORDERS</span></h3>
        </div>
        <div className="orders-stats-card p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden relative group">
          <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Yield Efficiency</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{(stats.completed / (stats.total || 1) * 100).toFixed(0)}%</h3>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{stats.completed} Finished</span>
          </div>
        </div>
        <div className="orders-stats-card p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden relative group">
          <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Satisfaction Quotient</p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stats.avgRating}</h3>
            <RatingStars rating={Math.floor(parseFloat(stats.avgRating))} />
          </div>
        </div>
        <div className="orders-stats-card p-6 bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden relative group">
           <div className="h-full w-full">
              <ResponsiveContainer width="100%" height={60}>
                 <BarChart data={chartData.customerBar}>
                    <Bar dataKey="orders" fill="#f1f5f9" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
              <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-widest mt-2">Activity Pulsar</p>
           </div>
        </div>
      </section>

      {/* 🛠️ HEADER CONTROLS */}
      <section className="orders-header sticky top-0 z-40 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[32px] p-6 shadow-2xl shadow-slate-200/40 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="relative flex-1 w-full max-w-xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search Order ID, Customer Entity, or Trace Map..." 
            className="orders-search-input w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] text-sm font-bold focus:outline-none focus:border-emerald-200 focus:bg-white transition-all text-slate-900 font-mono italic"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <select 
            className="orders-filter-dropdown px-6 py-4 bg-slate-100 border border-transparent rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none hover:bg-slate-200 transition-colors cursor-pointer appearance-none pr-10 italic"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Status: Unified</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select 
            className="orders-filter-dropdown px-6 py-4 bg-slate-100 border border-transparent rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none hover:bg-slate-200 transition-colors cursor-pointer appearance-none pr-10 italic"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">Rating: All Nodes</option>
            <option value="5">Rating: 5 Stars</option>
            <option value="4">Rating: 4 Stars</option>
            <option value="3">Rating: 3 Stars</option>
            <option value="2">Rating: 2 Stars</option>
            <option value="1">Rating: 1 Star</option>
          </select>

          <select 
            className="orders-sort-control px-6 py-4 bg-slate-100 border border-transparent rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none hover:bg-slate-200 transition-colors cursor-pointer appearance-none pr-10 italic"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="date-desc">Newest Epoch</option>
            <option value="date-asc">Oldest Epoch</option>
            <option value="amount-desc">Top Magnitude</option>
            <option value="amount-asc">Low Magnitude</option>
            <option value="name-asc">Customer A-Z</option>
          </select>
          
          <button className="p-4 bg-slate-900 text-[#75EEA5] rounded-[20px] hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-slate-900/20">
             <Download size={20} />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 👤 2️⃣ LEFT PANEL — CUSTOMER LIST */}
        <aside className="orders-customer-sidebar lg:col-span-3 bg-white border border-slate-100 rounded-[40px] shadow-xl shadow-slate-200/30 overflow-hidden flex flex-col h-[800px]">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50">
             <h3 className="text-lg font-black text-slate-900 italic uppercase">Customer Registry</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1 italic">Active Wallet Entities</p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
             <div 
               className={cn(
                 "orders-customer-card p-4 rounded-[24px] cursor-pointer transition-all border group",
                 !selectedCustomerId ? "orders-customer-active bg-slate-900 border-slate-900 shadow-xl" : "bg-white border-transparent hover:bg-slate-50"
               )}
               onClick={() => setSelectedCustomerId(null)}
             >
                <div className="flex items-center gap-4">
                   <div className={cn("w-12 h-12 rounded-[18px] flex items-center justify-center transition-colors", !selectedCustomerId ? "bg-white/10 text-[#75EEA5]" : "bg-slate-100 text-slate-400")}>
                      <Users size={20} />
                   </div>
                   <div>
                      <p className={cn("text-xs font-black uppercase tracking-widest", !selectedCustomerId ? "text-white" : "text-slate-900")}>Unified Feed</p>
                      <p className={cn("text-[10px] font-bold", !selectedCustomerId ? "text-white/50" : "text-slate-400")}>Show all active nodes</p>
                   </div>
                </div>
             </div>

             {customers.map(customer => (
               <div 
                 key={customer.id} 
                 className={cn(
                   "orders-customer-card p-5 rounded-[28px] cursor-pointer transition-all border group",
                   selectedCustomerId === customer.id ? "orders-customer-active bg-slate-900 border-slate-900 shadow-2xl" : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30"
                 )}
                 onClick={() => setSelectedCustomerId(customer.id)}
               >
                  <div className="flex items-center gap-4">
                     <div className="relative">
                        <div className={cn("w-14 h-14 rounded-[22px] flex items-center justify-center font-black text-lg shadow-inner", selectedCustomerId === customer.id ? "bg-white text-slate-900" : "bg-slate-100 text-slate-300")}>
                           {customer.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white"></div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-black truncate uppercase italic tracking-tighter", selectedCustomerId === customer.id ? "text-white" : "text-slate-900")}>{customer.name}</p>
                        <p className={cn("text-[9px] font-bold truncate transition-colors", selectedCustomerId === customer.id ? "text-white/40" : "text-slate-400")}>{customer.email}</p>
                     </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-200/10 pt-4">
                     <div>
                        <p className={cn("text-[8px] font-black uppercase tracking-widest mb-1", selectedCustomerId === customer.id ? "text-white/40" : "text-slate-400")}>Load</p>
                        <p className={cn("text-xs font-black", selectedCustomerId === customer.id ? "text-[#75EEA5]" : "text-slate-900")}>{customer.orderCount} Orders</p>
                     </div>
                     <div className="text-right">
                        <p className={cn("text-[8px] font-black uppercase tracking-widest mb-1", selectedCustomerId === customer.id ? "text-white/40" : "text-slate-400")}>Yield</p>
                        <p className={cn("text-xs font-black", selectedCustomerId === customer.id ? "text-white" : "text-slate-900")}>₱{customer.totalSpent.toLocaleString()}</p>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </aside>

        {/* 📦 3️⃣ MAIN PANEL — ORDERS TABLE VIEW */}
        <main className="orders-main-panel lg:col-span-9 space-y-8">
           
           <div className="bg-white border border-slate-100 rounded-[44px] shadow-2xl shadow-slate-200/40 overflow-hidden">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase italic">Immutable Payload Ledger</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1 italic">
                     {selectedCustomerId ? `Trace: ${customers.find(c => c.id === selectedCustomerId)?.name}` : 'Trace: Unified Global Registry'}
                   </p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[2px]">
                      Filter Impact: {filteredOrders.length} Nodes
                   </div>
                </div>
             </div>
             
             <div className="overflow-x-auto custom-scrollbar">
                <table className="orders-table w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trace ID</th>
                         {!selectedCustomerId && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Entity</th>}
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload Items</th>
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Value</th>
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Hub</th>
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Epoch</th>
                         <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {paginatedOrders.map(order => {
                        const customer = users.find(u => u.id === order.user_id);
                        return (
                          <React.Fragment key={order.order_id}>
                            <tr className="orders-row group hover:bg-slate-50/80 transition-colors">
                               <td className="px-8 py-6 font-mono text-[11px] font-bold text-slate-500">
                                  {order.order_id}
                               </td>
                               {!selectedCustomerId && (
                                 <td className="px-8 py-6">
                                    <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{customer?.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{customer?.id}</p>
                                 </td>
                               )}
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs">
                                        {order.products.reduce((sum, i) => sum + i.quantity, 0)}
                                     </div>
                                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {order.products.length} Product Types
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <span className="text-base font-black text-slate-900 tracking-tighter italic">₱{order.total_amount.toLocaleString()}</span>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="relative group/status flex items-center gap-3">
                                     <select 
                                       disabled={user?.role === 'staff'}
                                       className={cn(
                                         "orders-status-dropdown px-4 py-2 text-[10px] font-black uppercase rounded-xl border appearance-none pr-8 transition-all",
                                         user?.role === 'staff' ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                                         order.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                         order.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                         order.status === 'Processing' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                         order.status === 'Cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                         "bg-slate-100 text-slate-600 border-slate-200"
                                       )}
                                       value={order.status}
                                       onChange={(e) => handleUpdateStatus(order.order_id, e.target.value)}
                                     >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                     </select>
                                     <MoreVertical className="absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-30 pointer-events-none" size={12} />
                                     
                                     {/* ⚠️ DISPUTE SIGNAL */}
                                     {order.complaint && (
                                       <div className="animate-pulse">
                                          <AlertTriangle className="text-rose-500" size={16} />
                                       </div>
                                     )}
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <p className="text-xs font-black text-slate-900 italic">{format(parseISO(order.created_at), 'MMM dd, yyyy')}</p>
                                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{format(parseISO(order.created_at), 'hh:mm a')}</p>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <button className="orders-action-btn p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                                     <ArrowUpDown size={18} />
                                  </button>
                               </td>
                            </tr>
                            
                            {/* ⭐ DETAILED PRODUCTION TRACE */}
                             <tr className="bg-slate-50/30">
                                <td colSpan={selectedCustomerId ? 6 : 7} className="px-12 py-8">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-l-4 border-slate-900 pl-8">
                                      <div className="space-y-6">
                                         <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[3px]">Payload Breakdown</h4>
                                         {order.products.map((item, idx) => (
                                           <div key={idx} className="flex flex-col gap-3 p-5 bg-white border border-slate-100 rounded-[28px] shadow-sm">
                                              <div className="flex items-center justify-between">
                                                 <p className="text-xs font-black text-slate-900 uppercase italic">{item.productName}</p>
                                                 <span className="text-[10px] font-black px-2 py-0.5 bg-slate-900 text-white rounded uppercase">{item.variant.size}</span>
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                 {item.colors.map((c, i) => (
                                                   <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-full border border-slate-100">
                                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.hex }} />
                                                      <span className="text-[8px] font-bold uppercase text-slate-500">{c.name}</span>
                                                   </div>
                                                 ))}
                                              </div>
                                              {item.plate && (
                                                <div className="mt-1 flex items-center gap-2">
                                                   <div className="p-1 bg-emerald-50 rounded text-emerald-600">
                                                      <Download size={10} />
                                                   </div>
                                                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Plate: {item.plate.name}</p>
                                                </div>
                                              )}
                                              {item.customRequirements && (
                                                <div className="mt-3 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                                                   <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Production Requisition</p>
                                                   <p className="text-[10px] font-bold text-slate-600 italic">"{item.customRequirements}"</p>
                                                </div>
                                              )}
                                           </div>
                                         ))}
                                      </div>
                                      
                                      <div className="space-y-6">
                                         <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[3px]">Financial Synthesis</h4>
                                            <div className="p-6 bg-slate-900 rounded-[32px] text-white">
                                               <div className="flex items-center justify-between mb-4">
                                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Gross Value</span>
                                                  <span className="text-sm font-black italic">₱{order.total_amount.toLocaleString()}</span>
                                               </div>
                                               {order.discount && order.discount.total_discount_amount > 0 && (
                                                  <div className="flex items-center justify-between text-emerald-400">
                                                     <span className="text-[10px] font-black uppercase tracking-widest">Loyalty Discount Applied</span>
                                                     <span className="text-sm font-black italic">-₱{order.discount.total_discount_amount.toLocaleString()}</span>
                                                  </div>
                                               )}
                                            </div>
                                         </div>

                                         {(order.feedback || order.complaint || (order.rating || 0) > 0) && (
                                            <div className="space-y-4">
                                               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[3px]">Customer Audit Logic</h4>
                                               
                                               <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[32px]">
                                                  <div className="flex items-center gap-2 mb-3">
                                                     <RatingStars rating={order.rating || 0} />
                                                     <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-auto">Client Rating</span>
                                                  </div>
                                                  <p className="text-xs font-bold text-slate-700 italic">
                                                     "{order.feedback || 'No textual feedback provided'}"
                                                  </p>
                                               </div>

                                               {order.complaint && (
                                                  <div className="p-6 bg-rose-50 border border-rose-100 rounded-[32px] relative overflow-hidden">
                                                     <div className="absolute top-0 right-0 p-4 opacity-10">
                                                        <AlertTriangle className="text-rose-600" size={40} />
                                                     </div>
                                                     <div className="flex items-center gap-2 mb-2">
                                                        <AlertTriangle className="text-rose-600" size={14} />
                                                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Dispute Signal Detected</span>
                                                     </div>
                                                     <p className="text-xs font-bold text-rose-900 leading-relaxed italic">
                                                        {order.complaint}
                                                     </p>
                                                  </div>
                                               )}
                                            </div>
                                         )}
                                      </div>
                                   </div>
                                </td>
                             </tr>
                          </React.Fragment>
                        );
                      })}
                      
                      {paginatedOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-8 py-32 text-center bg-slate-50/20">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                              <ShoppingBag size={48} className="text-slate-400" />
                              <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Payload Void Detected</p>
                            </div>
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>

             {/* 📄 PAGINATION */}
             <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                   Transmitting {paginatedOrders.length} of {filteredOrders.length} Load Nodes
                </p>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                     disabled={currentPage === 1}
                     className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
                   >
                      <ChevronLeft size={18} />
                   </button>
                   <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all",
                            currentPage === i + 1 ? "bg-slate-900 text-white shadow-xl" : "bg-white border border-slate-200 text-slate-400 hover:border-slate-400"
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                   </div>
                   <button 
                     onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                     disabled={currentPage === totalPages}
                     className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
                   >
                      <ChevronRight size={18} />
                   </button>
                </div>
             </div>
           </div>

           {/* 📊 PIE CHART AREA */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 border border-slate-100 rounded-[44px] shadow-xl">
                 <h4 className="text-sm font-black text-slate-900 uppercase italic mb-8">Load Priority Distribution</h4>
                 <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                            data={chartData.statusPie}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                             {chartData.statusPie.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                             ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {chartData.statusPie.map(item => (
                      <div key={item.name} className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                         <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{item.name}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[44px] shadow-2xl relative overflow-hidden border border-slate-800">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <TrendingUp className="text-[#75EEA5]" size={100} />
                 </div>
                 <div className="relative z-10">
                    <h4 className="text-sm font-black text-white uppercase italic mb-8">Top Yield Entities</h4>
                    <div className="space-y-6">
                       {customers.slice(0, 3).map((c, idx) => (
                         <div key={c.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#75EEA5] font-black italic">
                                  #{idx + 1}
                               </div>
                               <div>
                                  <p className="text-sm font-black text-white uppercase tracking-tight italic">{c.name}</p>
                                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{c.orderCount} ACTIVE LOADS</p>
                               </div>
                            </div>
                            <p className="text-base font-black text-[#75EEA5] italic">₱{c.totalSpent.toLocaleString()}</p>
                         </div>
                       ))}
                    </div>
                    <div className="mt-10 pt-8 border-t border-white/10">
                       <p className="text-[9px] font-bold text-white/30 uppercase tracking-[4px] text-center">Load Optimization Metrics Integrated</p>
                    </div>
                 </div>
              </div>
           </div>
           
        </main>
      </div>
    </div>
  );
};

export default Orders;
