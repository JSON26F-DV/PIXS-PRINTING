import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Clock, 
  CheckCircle2, 
  Play, 
  AlertCircle, 
  ShoppingBag,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import Select, { type SingleValue } from 'react-select';
import { orderBy } from 'lodash';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

// Data Sources
import rawOrders from '../../data/order.json';
import { type Order } from '../../types/order';
import { useAuth } from '../../context/AuthContext';
import usersData from '../../data/users.json';
import allProducts from '../../data/products.json';

// Types for staff execution tracking
interface ExecutionState {
  startedIds: Record<string, string>; // order_id -> timestamp
  completedIds: string[]; // local list of orders finished in this session
}

const LiveQueue: React.FC = () => {
  const { user } = useAuth();
  
  // --- STATE ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Execution tracking (Simulating persistence via localStorage)
  const [execution, setExecution] = useState<ExecutionState>(() => {
    try {
      const saved = localStorage.getItem('pixs_staff_execution_v1');
      return saved ? JSON.parse(saved) : { startedIds: {}, completedIds: [] };
    } catch {
      return { startedIds: {}, completedIds: [] };
    }
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<SingleValue<{ value: string; label: string }>>(null);
  const [sortOption, setSortOption] = useState<SingleValue<{ value: string; label: string }>>({ value: 'date-desc', label: 'Newest First' });

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('pixs_staff_execution_v1', JSON.stringify(execution));
  }, [execution]);

  // --- LOAD DATA ---
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Simulate fetch from JSON
        const data = rawOrders as unknown as Order[];
        
        // Strict Filter: Only Processing
        const processingOrders = data.filter(o => o.status?.toLowerCase() === 'processing');
        
        setOrders(processingOrders);
        setError(null);
      } catch (err) {
        console.error("Failed to load production queue:", err);
        setError("Unable to retrieve processing orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // --- LOGIC: FILTERING & SORTING ---
  const usersOptions = useMemo(() => {
    const uniqueUsers = Array.from(new Set(orders.map(o => o.user_id)));
    return [
      { value: 'all', label: 'All Users' },
      ...uniqueUsers.map(uid => ({ value: uid, label: `Entity: ${uid}` }))
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    // 1. Get current employee assignment
    const employeeData = usersData.employees.find(emp => emp.email === user?.email) as { 
      allowed_categories?: string[],
      allowed_products?: string[]
    } | undefined;
    
    const allowedCategories = employeeData?.allowed_categories || [];
    const allowedProducts = employeeData?.allowed_products || [];

    // 2. Map product names to categories
    const productCategoryMap: Record<string, string> = {};
    (allProducts as { name: string, category: string }[]).forEach(p => {
      productCategoryMap[p.name] = p.category;
    });

    // 3. Apply category & product restriction only to non-admin users
    const filteredByCategory = orders.filter(o => !execution.completedIds.includes(o.order_id)).map(order => {
      // If admin, show all products
      const isPrivileged = user?.role === 'admin';
      const noConstraints = allowedCategories.length === 0 && allowedProducts.length === 0;
      
      if (isPrivileged || noConstraints) return order;

      // Filter products within the order
      const assignedProducts = order.products.filter(p => {
        const cat = productCategoryMap[p.productName];
        const isCatAllowed = allowedCategories.includes(cat);
        const isProdAllowed = allowedProducts.includes(p.productName);
        return isCatAllowed || isProdAllowed;
      });

      return { ...order, products: assignedProducts };
    }).filter(o => o.products.length > 0); // Hide orders that have no matching products

    let result = filteredByCategory;

    // Search logic
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.order_id.toLowerCase().includes(q) ||
        o.user_id.toLowerCase().includes(q) ||
        o.products.some((p: { productName: string }) => p.productName.toLowerCase().includes(q))
      );
    }

    // User filter
    if (userFilter && userFilter.value !== 'all') {
      result = result.filter(o => o.user_id === userFilter.value);
    }

    // Sorting logic using lodash
    switch (sortOption?.value) {
      case 'date-desc':
        result = orderBy(result, [(o) => new Date(o.created_at).getTime()], ['desc']);
        break;
      case 'date-asc':
        result = orderBy(result, [(o) => new Date(o.created_at).getTime()], ['asc']);
        break;
      case 'price-asc':
        result = orderBy(result, ['total_amount'], ['asc']);
        break;
      case 'price-desc':
        result = orderBy(result, ['total_amount'], ['desc']);
        break;
      case 'qty-desc':
        result = orderBy(result, [(o) => o.products.reduce((acc: number, p: { quantity: number }) => acc + p.quantity, 0)], ['desc']);
        break;
      case 'name-asc':
        result = orderBy(result, [(o) => o.products[0]?.productName || ''], ['asc']);
        break;
    }

    // MANDATORY logic: Started orders float to top
    return orderBy(result, [(o) => execution.startedIds[o.order_id] ? 1 : 0], ['desc']);
  }, [orders, searchQuery, userFilter, sortOption, execution, user?.email, user?.role]);

  // Split into sections
  const activeOrders = filteredOrders.filter(o => !!execution.startedIds[o.order_id]);
  const pendingOrders = filteredOrders.filter(o => !execution.startedIds[o.order_id]);

  // --- ACTIONS ---
  const handleInitiateExecution = (orderId: string) => {
    setExecution((prev: ExecutionState) => ({
      ...prev,
      startedIds: {
        ...prev.startedIds,
        [orderId]: new Date().toISOString()
      }
    }));
    toast.success(`Operational sequence initiated for ${orderId}`, {
      icon: '⚡',
      style: { borderRadius: '16px', background: '#0f172a', color: '#fff' }
    });
  };

  const handleMarkCompletion = (order: Order) => {
    const timestamp = new Date().toISOString();
    
    // SAVE PRODUCTION LOG TO LOCALSTORAGE (SIMULATED JSON LOG)
    const productionLogs = (() => {
      try {
        const saved = localStorage.getItem('pixs_production_logs');
        return saved ? JSON.parse(saved) : [];
      } catch { return []; }
    })();

    const newLogs = order.products.map(p => ({
        log_id: `LOG-${uuidv4().slice(0, 8)}`,
        user_id: user?.id || user?.email || 'unknown',
        user_name: user?.name || 'Worker Node',
        order_id: order.order_id,
        product_name: p.productName,
        quantity: p.quantity,
        category: p.category, 
        completed_at: timestamp
    }));

    localStorage.setItem('pixs_production_logs', JSON.stringify([...productionLogs, ...newLogs]));

    // Persistence: Mark as completed in session
    setExecution(prev => ({
      ...prev,
      completedIds: [...prev.completedIds, order.order_id]
    }));

    toast.success(`Production Log persistent for ${order.order_id}`, {
      icon: '🏛️',
      duration: 5000,
      style: { borderRadius: '16px', background: '#0F172A', color: '#fff' }
    });
  };

  // --- FALLBACKS ---
  if (error) {
    return (
      <div className="LiveQueueErrorFallback min-h-screen flex items-center justify-center bg-slate-50 p-10">
        <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-2xl border border-rose-100 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">System Malfunction</h2>
          <p className="text-slate-500 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all"
          >
            Re-Initialize Terminal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="LiveQueuePage min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* 🚀 HEADER */}
      <header className="LiveQueueHeader pt-12 px-6 md:px-12 max-w-[1700px] mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900 rounded-[22px] text-emerald-400 shadow-2xl shadow-slate-900/20 animate-pulse">
                <Activity size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Live Production Queue</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-1 italic">Processing Orders Only • Strict Execution Protocol</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="px-8 py-5 bg-white border border-slate-200 rounded-[24px] shadow-sm flex items-center gap-4">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Processing</span>
                   <span className="text-2xl font-black text-slate-900 italic tracking-tighter">{activeOrders.length + pendingOrders.length} Nodes</span>
                </div>
                <div className="flex -space-x-3">
                   {orders.slice(0, 3).map((o, i) => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                        {o.user_id.slice(-2)}
                     </div>
                   ))}
                   <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white">
                      +{orders.length}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* 🛠️ FILTERS BAR */}
      <section className="LiveQueueFiltersBar mt-10 px-6 md:px-12 max-w-[1700px] mx-auto">
        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col lg:flex-row items-center gap-6">
          
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID, Product, or Client..." 
              className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold focus:outline-none focus:border-emerald-200 focus:bg-white transition-all text-slate-900 italic"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="w-full sm:w-64">
              <Select 
                options={usersOptions}
                value={userFilter}
                onChange={setUserFilter}
                placeholder="Filter by Client"
                className="staff-select-container text-[11px] font-black uppercase tracking-widest"
                styles={selectStyles}
              />
            </div>
            <div className="w-full sm:w-72">
              <Select 
                options={[
                  { value: 'date-desc', label: 'Newest First' },
                  { value: 'date-asc', label: 'Oldest First' },
                  { value: 'price-asc', label: 'Yield: Low-High' },
                  { value: 'price-desc', label: 'Yield: High-Low' },
                  { value: 'qty-desc', label: 'Capacity: High-Low' },
                  { value: 'name-asc', label: 'A-Z Product' }
                ]}
                value={sortOption}
                onChange={setSortOption}
                className="staff-select-container text-[11px] font-black uppercase tracking-widest"
                styles={selectStyles}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 📋 PRODUCTION BOARD */}
      <main className="LiveQueueBoard mt-10 px-6 md:px-12 max-w-[1700px] mx-auto space-y-16">
        
        {/* ACTIVE SECTION */}
        {activeOrders.length > 0 && (
          <section className="LiveQueueActiveSection space-y-8 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
              <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-widest">Active Operations <span className="text-emerald-500 ml-2">({activeOrders.length})</span></h2>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               {activeOrders.map(order => (
                 <OrderCard 
                   key={order.order_id} 
                   order={order} 
                   startedAt={execution.startedIds[order.order_id]}
                   onComplete={() => handleMarkCompletion(order)}
                   isActive
                 />
               ))}
            </div>
          </section>
        )}

        {/* PENDING SECTION */}
        <section className="LiveQueuePendingSection space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
              <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-widest">Waiting for Execution <span className="text-slate-400 ml-2">({pendingOrders.length})</span></h2>
              <div className="flex-1 h-px bg-slate-200"></div>
           </div>

           {pendingOrders.length === 0 && !activeOrders.length ? (
             <div className="py-32 bg-white rounded-[44px] border border-dashed border-slate-200 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                   <Clock size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Queue Empty</h3>
                <p className="text-slate-400 font-bold tracking-[2px] uppercase text-[10px] mt-2">No active processing orders detected in master ledger</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               {pendingOrders.map(order => (
                 <OrderCard 
                   key={order.order_id} 
                   order={order} 
                   onStart={() => handleInitiateExecution(order.order_id)}
                 />
               ))}
             </div>
           )}
        </section>
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const OrderCard: React.FC<{ 
  order: Order; 
  isActive?: boolean;
  startedAt?: string;
  onStart?: () => void;
  onComplete?: () => void;
}> = ({ order, isActive, startedAt, onStart, onComplete }) => {
  return (
    <div className={`LiveQueueOrderCard rounded-[44px] border transition-all overflow-hidden ${isActive ? 'bg-slate-900 border-slate-800 shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-200 shadow-xl shadow-slate-200/20'}`}>
      
      {/* CARD HEADER */}
      <div className={`p-8 border-b ${isActive ? 'border-white/5 bg-white/5' : 'border-slate-50'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
           <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shadow-lg ${isActive ? 'bg-[#75EEA5] text-slate-900' : 'bg-slate-900 text-white'}`}>
                 <ShoppingBag size={24} />
              </div>
              <div>
                 <p className={`text-[10px] font-black uppercase tracking-[3px] mb-1 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                    Order Terminal {order.order_id}
                 </p>
                 <div className="flex items-center gap-3">
                    <h3 className={`text-xl font-black uppercase italic tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                       Payload Recipient: {order.user_id}
                    </h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                 </div>
              </div>
           </div>

           <div className="text-right">
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-white/40' : 'text-slate-400'}`}>Master Vault Total</p>
              <span className={`text-2xl font-black italic tracking-tighter ${isActive ? 'text-[#75EEA5]' : 'text-slate-900'}`}>
                 ₱{order.total_amount.toLocaleString()}
              </span>
           </div>
        </div>
      </div>

      {/* PRODUCTS LIST */}
      <div className="p-8 space-y-6">
         {order.products.map((p, idx) => (
           <div key={`${order.order_id}-p-${idx}`} className={`LiveQueueProductCard p-6 rounded-[32px] border transition-all ${isActive ? 'bg-white/5 border-white/10' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
              <div className="flex flex-col lg:flex-row gap-6">
                 {/* Image Node */}
                 <div className="w-24 h-24 lg:w-32 lg:h-32 shrink-0 bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-inner p-2 relative group">
                    <img src={p.productImage} alt={p.productName} className="w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <ImageIcon size={20} className="text-white" />
                    </div>
                 </div>

                 {/* Content Node */}
                 <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className={`text-lg font-black uppercase italic tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{p.productName}</h4>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[9px] font-black uppercase tracking-wider">{p.variant.size}</span>
                             <span className="text-[10px] font-bold text-slate-400">Qty: <span className={isActive ? 'text-white font-black' : 'text-slate-900 font-black'}>{p.quantity.toLocaleString()} pcs</span></span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className={`text-sm font-black italic ${isActive ? 'text-[#75EEA5]' : 'text-slate-900'}`}>₱{p.variant.unitPrice.toFixed(2)}/u</span>
                       </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex flex-wrap gap-2">
                       {p.colors.map((c, ci) => (
                         <div key={ci} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
                            <div className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: c.hex }}></div>
                            <span className="text-[9px] font-black text-slate-900 uppercase italic tracking-widest">{c.name}</span>
                         </div>
                       ))}
                    </div>

                    {/* Technical Requirement Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className={`p-4 rounded-2xl ${isActive ? 'bg-black/20' : 'bg-white shadow-sm'}`}>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plate Strategy</p>
                          <p className={`text-[10px] font-black italic ${isActive ? 'text-white' : 'text-slate-900'}`}>{p.plate?.name || 'TBD - Standard'}</p>
                          <div className="flex justify-between mt-2 pt-2 border-t border-slate-100/10">
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Setup Cost</span>
                             <span className={`text-[9px] font-black italic ${isActive ? 'text-emerald-400' : 'text-slate-900'}`}>₱{p.plate?.setupFee || 0}</span>
                          </div>
                       </div>
                       <div className={`p-4 rounded-2xl ${isActive ? 'bg-black/20' : 'bg-white shadow-sm'}`}>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Print Yield Rate</p>
                          <p className={`text-[10px] font-black italic ${isActive ? 'text-white' : 'text-slate-900'}`}>₱{p.plate?.printPricePerUnit.toFixed(2) || '0.00'}/u</p>
                       </div>
                    </div>

                    {/* Custom Req */}
                    {p.customRequirements && (
                      <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                         <AlertCircle size={14} className="text-amber-500 mt-0.5" />
                         <p className="text-[10px] font-bold text-amber-500 italic leading-relaxed uppercase tracking-tight">Requirement: {p.customRequirements}</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* FOOTER ACTIONS */}
      <div className={`p-8 flex flex-col sm:flex-row items-center justify-between gap-6 ${isActive ? 'bg-white/5 border-t border-white/5' : 'bg-slate-50/30 border-t border-slate-50'}`}>
         {isActive ? (
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#75EEA5] animate-pulse"></div>
                 <p className="text-[10px] font-black text-white uppercase tracking-[2px] italic">Execution In Progress</p>
              </div>
              <p className="text-[9px] font-medium text-slate-400">Triggered at {format(new Date(startedAt!), 'HH:mm:ss · MMM dd')}</p>
           </div>
         ) : (
           <div className="flex items-center gap-3">
              <Calendar size={14} className="text-slate-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Registered: {format(new Date(order.created_at), 'MMM dd, yyyy')}</p>
           </div>
         )}

         <div className="flex items-center gap-4 w-full sm:w-auto">
            {isActive ? (
              <button 
                onClick={onComplete}
                className="LiveQueueCompleteButton w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-[#75EEA5] text-slate-900 text-[11px] font-black uppercase tracking-[3px] rounded-[24px] hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 italic"
              >
                <CheckCircle2 size={18} />
                Mark Operational Completion
              </button>
            ) : (
              <button 
                onClick={onStart}
                className="LiveQueueStartButton w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[3px] rounded-[24px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/30 italic group"
              >
                <Play size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                Initiate Execution
              </button>
            )}
         </div>
      </div>
    </div>
  );
};

// --- STYLES ---

const selectStyles = {
  control: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    borderRadius: '16px',
    padding: '6px 8px',
    backgroundColor: '#f8fafc',
    border: state.isFocused ? '1px solid #75EEA5' : '1px solid #f1f5f9',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#75EEA5'
    }
  }),
  placeholder: (base: object) => ({
    ...base,
    color: '#94a3b8',
    fontWeight: '900'
  }),
  singleValue: (base: object) => ({
    ...base,
    color: '#0f172a',
    fontWeight: '900'
  })
};

export default LiveQueue;
