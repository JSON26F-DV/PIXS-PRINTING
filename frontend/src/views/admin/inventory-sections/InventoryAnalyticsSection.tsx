import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Briefcase, Filter, Package, AlertCircle, 
  History as HistoryIcon, FileText, PlusCircle, Search 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { IProduct, ICategory, IRestockLog } from './types';
import { STOCK_STATUS_OPTIONS } from './constants';


interface InventoryAnalyticsSectionProps {
  products: IProduct[];
  categories: ICategory[];
  restockLogs: IRestockLog[];
  setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>;
  setRestockLogs: React.Dispatch<React.SetStateAction<IRestockLog[]>>;
}

export const InventoryAnalyticsSection: React.FC<InventoryAnalyticsSectionProps> = ({ 
  products, categories, restockLogs, setProducts, setRestockLogs 
}) => {
  const [chartFilter, setChartFilter] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockStatusFilter, setStockStatusFilter] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'ALL' | 'RESTOCK' | 'MISC'>('ALL');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [restockForm, setRestockForm] = useState<{ productId: string; qty: number; cost: number } | null>(null);
  const [miscExpenseForm, setMiscExpenseForm] = useState<{ name: string; cost: number } | null>(null);

  const outOfStockProducts = products.filter(p => p.current_stock <= 0);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }

    if (productSearch) {
      const q = productSearch.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.id.toLowerCase().includes(q)
      );
    }

    if (stockStatusFilter === "Low Stock Only") {
      result = result.filter(p => p.current_stock < p.min_threshold && p.current_stock > 0);
    } else if (stockStatusFilter === "Out of Stock") {
      result = result.filter(p => p.current_stock <= 0);
    } else if (stockStatusFilter === "High Stock") {
      result = result.filter(p => (p.current_stock || 0) >= (p.min_threshold || 0));
    }

    result.sort((a, b) => {
      if (chartFilter === 'asc') return a.current_stock - b.current_stock;
      return b.current_stock - a.current_stock;
    });

    return result;
  }, [products, categoryFilter, stockStatusFilter, chartFilter, productSearch]);

  const filteredLogs = useMemo(() => {
    let result = [...restockLogs];

    if (logTypeFilter !== 'ALL') {
      result = result.filter(l => l.type === logTypeFilter);
    }

    if (logSearch) {
      const q = logSearch.toLowerCase();
      result = result.filter(l => 
        l.product_name.toLowerCase().includes(q) || 
        l.notes?.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [restockLogs, logTypeFilter, logSearch]);

  const chartData = useMemo(() => 
    filteredProducts.slice(0, 15).map(p => ({ 
      name: p.name, 
      stock: p.current_stock, 
      min: p.min_threshold, 
      isLow: p.current_stock < p.min_threshold 
    })), 
  [filteredProducts]);

  const updateStock = (id: string, val: number) => {
    if (isNaN(val)) return;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, current_stock: Math.max(0, val) } : p));
  };

  const updateProductField = (id: string, field: keyof IProduct, val: number) => {
    if (isNaN(val)) return;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleRestock = (productId: string, productName: string, qty: number, cost: number) => {
    if (qty <= 0 || cost < 0) return;
    
    const timestamp = new Date().getTime();
    
    // Update Stock
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, current_stock: (p.current_stock || 0) + qty } : p));
    
    // Log Activity
    const newLog: IRestockLog = {
      id: `RL-${timestamp}`,
      product_id: productId,
      product_name: productName,
      qty_added: qty,
      cost: cost,
      date: new Date().toISOString(),
      type: 'RESTOCK',
      staff_name: 'Admin',
      notes: `Restocked ${qty} units via Direct Control.`
    };
    setRestockLogs(prev => [newLog, ...prev]);
    setRestockForm(null);
  };

  const handleAddMiscExpense = (name: string, cost: number) => {
    if (!name || cost < 0) return;
    const timestamp = new Date().getTime();
    const newLog: IRestockLog = {
      id: `RL-${timestamp}`,
      product_id: null,
      product_name: name,
      qty_added: 0,
      cost: cost,
      date: new Date().toISOString(),
      type: 'MISC',
      staff_name: 'Admin',
      notes: 'Unexpected miscellaneous expense.'
    };
    setRestockLogs(prev => [newLog, ...prev]);
    setMiscExpenseForm(null);
  };

  const weeklyExpenseData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dayName = days[d.getDay()];
      const dayISO = d.toISOString().split('T')[0];
      
      const dayTotal = restockLogs
        .filter(l => l.date.startsWith(dayISO))
        .reduce((acc, l) => acc + l.cost, 0);
        
      return { name: dayName, total: dayTotal };
    });
    return data;
  }, [restockLogs]);

  return (
    <section id="inventory-analytics" className="space-y-8 h-[calc(100vh-280px)] min-h-[650px] max-h-[850px]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        {/* CHART SECTION */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
           <div className="bg-white p-6 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 mr-4">
                 <Filter className="text-slate-300" size={18} />
                 <span className="text-xs font-bold text-slate-400">Filters</span>
              </div>
              <select 
                value={chartFilter} 
                onChange={e => setChartFilter(e.target.value as 'asc' | 'desc')}
                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="desc">High Stock First</option>
                <option value="asc">Low Stock First</option>
              </select>

              <select 
                value={categoryFilter || ''} 
                onChange={e => setCategoryFilter(e.target.value || null)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
              </select>

              <select 
                value={stockStatusFilter || ''} 
                onChange={e => setStockStatusFilter(e.target.value || null)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="">Full Catalog</option>
                {STOCK_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>

              <button 
                onClick={() => setMiscExpenseForm({ name: '', cost: 0 })}
                className="ml-auto bg-slate-900 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[2px] transition hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/20"
              >
                + Log Misc Expense
              </button>
           </div>

           <div className="flex-1 grid grid-rows-2 gap-6 min-h-0">
             {/* STOCK CHART */}
             <div className="inventory-stock-chart bg-slate-950 p-8 rounded-[32px] shadow-2xl border border-slate-800 relative overflow-hidden group">
                <div className="absolute top-6 left-8 flex items-center gap-2 opacity-50">
                   <Package className="text-emerald-400" size={14} />
                   <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Stock Level Visualization</h4>
                </div>
                <ResponsiveContainer width="100%" height="100%" className="mt-4">
                   <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                      <XAxis 
                         dataKey="name" 
                         stroke="none" 
                         tick={{fontSize: 8, fontWeight: 700, fill: '#64748b'}} 
                         interval={0}
                         angle={-45}
                         textAnchor="end"
                         height={60}
                      />
                      <YAxis 
                         stroke="none" 
                         tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} 
                      />
                      <Tooltip 
                         contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px', fontWeight: 'bold'}}
                         itemStyle={{color: '#10b981'}}
                         cursor={{fill: '#ffffff08'}}
                      />
                      <Bar dataKey="stock" radius={[6, 6, 0, 0]} barSize={24}>
                         {chartData.map((e, i) => (
                           <Cell key={i} fill={e.isLow ? '#f43f5e' : '#10b981'} fillOpacity={0.9} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>

             {/* EXPENDITURE CHART */}
             <div className="expenditure-chart bg-slate-950 p-8 rounded-[32px] shadow-2xl border border-slate-800 relative overflow-hidden group">
                <div className="absolute top-6 left-8 flex items-center gap-2 opacity-50">
                   <TrendingUp className="text-blue-400" size={14} />
                   <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Weekly Expenditure Analytics (₱)</h4>
                </div>
                <ResponsiveContainer width="100%" height="100%" className="mt-4">
                   <BarChart data={weeklyExpenseData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                      <XAxis 
                         dataKey="name" 
                         stroke="none" 
                         tick={{fontSize: 10, fontWeight: 900, fill: '#475569'}} 
                      />
                      <YAxis 
                         stroke="none" 
                         tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} 
                      />
                      <Tooltip 
                         contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px', fontWeight: 'bold'}}
                         itemStyle={{color: '#3b82f6'}}
                         cursor={{fill: '#ffffff08'}}
                      />
                      <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40} fill="#3b82f6" fillOpacity={0.8} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
           </div>
        </div>

        {/* QUICK STOCK EDIT SECTION */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 p-8 flex flex-col h-full overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                 <Briefcase className="text-emerald-500" size={20} /> Direct Control
              </h3>
              {outOfStockProducts.length > 0 && (
                <div className="bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-lg animate-bounce tracking-widest uppercase">
                   {outOfStockProducts.length} Depleted
                </div>
              )}
           </div>

           <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Find Node, Product ID..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-black text-slate-900 outline-none focus:border-emerald-400 shadow-sm transition-all placeholder:text-slate-300 uppercase tracking-widest"
              />
              <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
           </div>
           
           <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-scrollbar pb-6">
              {filteredProducts.map((p) => (
                 <div 
                   key={p.id} 
                   className={`p-4 bg-slate-50/50 border rounded-[24px] transition-all duration-300 ${
                     editingProductId === p.id 
                       ? 'bg-white border-blue-400 shadow-xl ring-4 ring-blue-50' 
                       : 'border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-lg'
                   }`}
                 >
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setEditingProductId(editingProductId === p.id ? null : p.id)}>
                       <div className="max-w-[40%]">
                          <p className="text-xs font-bold text-slate-900 truncate leading-tight uppercase tracking-tight">{p.name}</p>
                          <div className="flex gap-2 mt-1">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ID: {p.id.slice(-4)}</p>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setRestockForm({ productId: p.id, qty: 500, cost: 0 });
                               }}
                               className="text-[8px] font-black text-emerald-500 hover:text-emerald-700 uppercase tracking-widest underline underline-offset-2"
                             >
                               Restock Node
                             </button>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => updateStock(p.id, p.current_stock - 50)} 
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                          >
                             <TrendingDown size={14} />
                          </button>
                          <input 
                            type="number" 
                            value={p.current_stock} 
                            onChange={(e) => updateStock(p.id, parseInt(e.target.value))}
                            className="w-14 bg-white border border-slate-200 rounded-lg py-1.5 text-center text-[10px] font-bold text-slate-900 outline-none focus:border-blue-400 transition-all no-spinner" 
                          />
                          <button 
                            onClick={() => updateStock(p.id, (p.current_stock || 0) + 50)} 
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-95"
                          >
                             <TrendingUp size={14} />
                          </button>
                       </div>
                    </div>

                    {editingProductId === p.id && (
                      <div className="mt-4 pt-4 border-t border-blue-100 bg-blue-50/50 -mx-4 -mb-4 px-4 pb-4 rounded-b-[24px] grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">Price (₱)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={p.base_price} 
                              onChange={(e) => updateProductField(p.id, 'base_price', parseFloat(e.target.value))}
                              className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:border-blue-400 shadow-sm"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">Mat. Cost</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={p.raw_material_cost} 
                              onChange={(e) => updateProductField(p.id, 'raw_material_cost', parseFloat(e.target.value))}
                              className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:border-blue-400 shadow-sm"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">Threshold</label>
                            <input 
                              type="number" 
                              value={p.min_threshold ?? ''} 
                              onChange={(e) => updateProductField(p.id, 'min_threshold', parseInt(e.target.value))}
                              className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:border-blue-400 shadow-sm"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">Min Order</label>
                            <input 
                              type="number" 
                              value={p.min_order ?? ''} 
                              onChange={(e) => updateProductField(p.id, 'min_order', parseInt(e.target.value))}
                              className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:border-blue-400 shadow-sm"
                            />
                         </div>
                      </div>
                    )}

                    {restockForm?.productId === p.id && (
                       <div className="mt-4 pt-4 border-t border-emerald-100 bg-emerald-50/50 -mx-4 -mb-4 px-4 pb-4 rounded-b-[24px] animate-in slide-in-from-top-2 duration-300">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[2px] mb-3">Inventory Injection Node</p>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">Adding Qty</label>
                                <input 
                                  type="number" 
                                  value={restockForm.qty} 
                                  onChange={(e) => setRestockForm({...restockForm, qty: parseInt(e.target.value)})}
                                  className="w-full bg-white border border-emerald-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:border-emerald-400"
                                />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">Total Cost (₱)</label>
                                <input 
                                  type="number" 
                                  value={restockForm.cost} 
                                  onChange={(e) => setRestockForm({...restockForm, cost: parseFloat(e.target.value)})}
                                  className="w-full bg-white border border-emerald-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:border-emerald-400"
                                />
                             </div>
                          </div>
                          <button 
                            onClick={() => handleRestock(p.id, p.name, restockForm.qty, restockForm.cost)}
                            className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
                          >
                            Execute Restock
                          </button>
                       </div>
                    )}
                 </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                   <Package size={40} className="mb-4 text-slate-300" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No Products Found</p>
                </div>
              )}
           </div>
           
           <div className="pt-6 border-t border-slate-100 mt-auto">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                 <AlertCircle className="text-blue-500 shrink-0" size={18} />
                 <p className="text-[9px] font-bold text-blue-700 leading-tight uppercase tracking-widest">
                   Production terminal active. All direct stock adjustments are logged for audit.
                 </p>
              </div>
           </div>

           {/* MODALS / OVERLAYS */}
           {miscExpenseForm && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-900">Miscellaneous Expense</h3>
                     <button onClick={() => setMiscExpenseForm(null)} className="text-slate-400 hover:text-slate-900">Close</button>
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Ink Procurement, Machine Repair"
                          value={miscExpenseForm.name}
                          onChange={e => setMiscExpenseForm({...miscExpenseForm, name: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-slate-900" 
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cost (₱)</label>
                        <input 
                          type="number" 
                          placeholder="0.00"
                          value={miscExpenseForm.cost || ''}
                          onChange={e => setMiscExpenseForm({...miscExpenseForm, cost: parseFloat(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-slate-900" 
                        />
                     </div>
                     <button 
                       onClick={() => handleAddMiscExpense(miscExpenseForm.name, miscExpenseForm.cost)}
                       className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:scale-105 transition shadow-2xl"
                     >
                       Record Expenditure
                     </button>
                  </div>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* ROW 2: EXTRA EXPENSES & LOG HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-10 border-t border-slate-200 mt-12 pb-20">
         {/* EXTRA EXPENSES TERMINAL */}
         <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6 uppercase tracking-tight">
               <PlusCircle className="text-blue-500" size={20} /> Extra Expenses
            </h3>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1 font-mono leading-none">Entry Reason</label>
                  <input 
                    type="text" 
                    id="extra-expense-name-final"
                    placeholder="e.g. Utility - Maintenance"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1 font-mono leading-none">Investment (₱)</label>
                  <input 
                    type="number" 
                    id="extra-expense-cost-final"
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                  />
               </div>
               <button 
                 onClick={() => {
                   const name = (document.getElementById('extra-expense-name-final') as HTMLInputElement).value;
                   const cost = parseFloat((document.getElementById('extra-expense-cost-final') as HTMLInputElement).value);
                   handleAddMiscExpense(name, cost);
                   (document.getElementById('extra-expense-name-final') as HTMLInputElement).value = '';
                   (document.getElementById('extra-expense-cost-final') as HTMLInputElement).value = '';
                 }}
                 className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition shadow-2xl"
               >
                 Log Extra Expense
               </button>
            </div>
         </div>

         {/* LOG HISTORY TABLE */}
         <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col h-full min-h-[500px] overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
               <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight italic">
                  <HistoryIcon className="text-violet-500" size={20} /> Operational Logs
               </h3>
               
               <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                     <input 
                       type="text" 
                       placeholder="Filter Trace..."
                       value={logSearch}
                       onChange={(e) => setLogSearch(e.target.value)}
                       className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 pl-9 text-[10px] font-black uppercase tracking-widest outline-none focus:border-violet-400 w-48 shadow-sm transition-all"
                     />
                     <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                  
                  <select 
                    value={logTypeFilter}
                    onChange={(e) => setLogTypeFilter(e.target.value as 'ALL' | 'RESTOCK' | 'MISC')}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-violet-400 cursor-pointer shadow-sm"
                  >
                    <option value="ALL">All Protocols</option>
                    <option value="RESTOCK">Restocks</option>
                    <option value="MISC">Miscellaneous</option>
                  </select>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-4 px-4 pr-1">
               <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                     <tr className="text-left bg-slate-50/50 rounded-xl">
                        <th className="py-3 pl-4 rounded-l-xl text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Detail Trace</th>
                        <th className="py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">Category</th>
                        <th className="py-3 text-right pr-4 rounded-r-xl text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Cost</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredLogs.slice().reverse().slice(0, 100).map((log) => (
                       <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-slate-100 bg-white group-hover:bg-slate-50 shadow-sm border-r-0">
                             <div className="flex items-center gap-3">
                                <FileText className={log.type === 'RESTOCK' ? 'text-emerald-500' : 'text-blue-500'} size={16} />
                                <div>
                                   <p className="text-xs font-black text-slate-900 uppercase tracking-tighter italic leading-none">{log.product_name}</p>
                                   <p className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">
                                      {new Date(log.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                   </p>
                                </div>
                             </div>
                          </td>
                          <td className="py-4 border-y border-slate-100 bg-white group-hover:bg-slate-50 shadow-sm text-center border-x-0">
                             <span className={`text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase ${log.type === 'RESTOCK' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}>
                                {log.type}
                             </span>
                          </td>
                          <td className="py-4 pr-4 rounded-r-2xl border-y border-r border-slate-100 bg-white group-hover:bg-slate-50 shadow-sm text-right border-l-0">
                             <p className="text-xs font-black text-slate-900 font-mono tracking-tighter">₱{log.cost.toLocaleString()}</p>
                             {log.qty_added > 0 && <p className="text-[8px] font-black text-slate-400 uppercase tracking-[1px]">+{log.qty_added} Qty</p>}
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
               {filteredLogs.length === 0 && (
                 <div className="py-20 text-center opacity-10 flex flex-col items-center">
                    <HistoryIcon size={40} className="mb-4" />
                    <p className="text-[14px] font-black uppercase tracking-[10px]">No Logs Found</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </section>
  );
};
