import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  Crown,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  TrendingDown
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import orderData from '../../data/order.json';
import requestScreenplateData from '../../data/request_screenplate.json';
import productsData from '../../data/products.json';
import usersData from '../../data/users.json';
import restockLogsData from '../../data/restock_logs.json';
import salaryData from '../../data/salary.json';
import { useAuth } from '../../context/AuthContext';
import { PermissionWrapper } from '../../components/guards/PermissionWrapper';
import { SafeTerminal } from '../../utils/safeTerminal';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

type FilterType = 'week' | 'month' | 'year';

interface RawOrder {
  id: string;
  user_id: string;
  items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  total_amount: number;
  status: string;
  created_at: string;
}

interface RawRequest {
  request_id: string;
  customer_id: string;
  calculated_total: number;
  status: string;
  created_at: string;
  product_id: string;
}

interface ItemBase {
  id: string;
  customerName: string;
  total: number;
  status: string;
  type: string;
  createdAt: string;
  itemName: string;
}

interface RawUsersData {
  employees: { id: string, name: string }[];
  customers: { id: string, name: string }[];
}

interface RawRestockLog {
  date: string;
  cost: number;
}

interface RawSalaryNode {
  attendance: { date: string, computed_salary: number }[];
}

const GeneralDashboard: React.FC = () => {
  const { user } = useAuth();
  const [queueSearch, setQueueSearch] = useState('');
  const [queueSort, setQueueSort] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'name-asc'>('date-desc');
  const [revenueFilter, setRevenueFilter] = useState<FilterType>('week');
  const [expenditureFilter, setExpenditureFilter] = useState<FilterType>('week');

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    const employees = SafeTerminal.array<{id: string, name: string}>((usersData as unknown as RawUsersData).employees);
    const customers = SafeTerminal.array<{id: string, name: string}>((usersData as unknown as RawUsersData).customers);
    [...employees, ...customers].forEach((u) => {
      if (u && u.id) map[u.id] = u.name;
    });
    return map;
  }, []);

  // Time Series Aggregator
  const processTimeSeries = (data: { date: string, value: number }[], filter: FilterType) => {
    if (filter === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const map: Record<string, number> = {};
      days.forEach(d => map[d] = 0);
      
      data.forEach(item => {
        const d = new Date(item.date);
        // Simplified: just match the day of the week
        const dayName = days[d.getDay()];
        map[dayName] += item.value;
      });
      
      // Return in order starting Mon
      const ordered = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return ordered.map(name => ({ name, value: map[name] }));
    }

    if (filter === 'month') {
      // Group by weeks of the month (simplified: 4 weeks)
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const map: Record<string, number> = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };
      
      data.forEach(item => {
        const d = new Date(item.date);
        const day = d.getDate();
        if (day <= 7) map['Week 1'] += item.value;
        else if (day <= 14) map['Week 2'] += item.value;
        else if (day <= 21) map['Week 3'] += item.value;
        else map['Week 4'] += item.value;
      });
      
      return weeks.map(name => ({ name, value: map[name] }));
    }

    if (filter === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const map: Record<string, number> = {};
      months.forEach(m => map[m] = 0);
      
      data.forEach(item => {
        const d = new Date(item.date);
        const monthName = months[d.getMonth()];
        map[monthName] += item.value;
      });
      
      return months.map(name => ({ name, value: map[name] }));
    }

    return [];
  };

  const analytics = useMemo(() => {
    const userStats: Record<string, { name: string, totalSpent: number, transactions: number }> = {};
    let totalRevenueAmount = 0;
    const statusCounts = { pending: 0, processing: 0, completed: 0, cancelled: 0 };

    // Revenue Data points
    const revenuePoints: { date: string, value: number }[] = [];

    const allItems: ItemBase[] = [
      ...SafeTerminal.array<RawOrder>(orderData as unknown as RawOrder[]).map((o: RawOrder): ItemBase => {
        revenuePoints.push({ date: o.created_at, value: Number(o.total_amount || 0) });
        return {
          id: o.id,
          customerName: userNameMap[o.user_id] || 'Anonymous',
          total: Number(o.total_amount || 0),
          status: o.status || 'Pending',
          type: 'Order',
          createdAt: o.created_at,
          itemName: o.items?.[0]?.productName || 'Order'
        };
      }),
      ...SafeTerminal.array<RawRequest>(requestScreenplateData as unknown as RawRequest[]).map((r: RawRequest): ItemBase => {
        revenuePoints.push({ date: r.created_at, value: Number(r.calculated_total || 0) });
        const product = SafeTerminal.array<{id: string, name: string}>(productsData as unknown as {id: string, name: string}[]).find((p) => p.id === r.product_id);
        return {
          id: r.request_id,
          customerName: userNameMap[r.customer_id] || 'Customer #'+r.customer_id,
          total: Number(r.calculated_total || 0),
          status: (r.status || 'pending').toUpperCase(),
          type: 'Screenplate Req',
          createdAt: r.created_at,
          itemName: product?.name || 'Screenplate'
        };
      })
    ];

    allItems.forEach(item => {
      const name = item.customerName;
      const total = item.total || 0;
      if (!userStats[name]) userStats[name] = { name, totalSpent: 0, transactions: 0 };
      userStats[name].totalSpent += total;
      userStats[name].transactions += 1;
      totalRevenueAmount += total;

      const st = (item.status || '').toLowerCase();
      if (st === 'pending') statusCounts.pending++;
      else if (st === 'processing') statusCounts.processing++;
      else if (st === 'completed') statusCounts.completed++;
      else if (st === 'cancelled') statusCounts.cancelled++;
    });

    const chartData = Object.values(userStats)
      .sort((a, b) => b.transactions - a.transactions)
      .map(user => ({ name: user.name, transactions: user.transactions, spent: user.totalSpent }));

    const orderStatusData = [
      { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Processing', value: statusCounts.processing, color: '#3b82f6' },
      { name: 'Complete', value: statusCounts.completed, color: '#10b981' },
      { name: 'Cancelled', value: statusCounts.cancelled, color: '#ef4444' }
    ].filter(s => s.value > 0);

    // Expenditure Data points
    const expenditurePoints: { date: string, value: number }[] = [];
    
    // Restock logs
    SafeTerminal.array<RawRestockLog>(restockLogsData as unknown as RawRestockLog[]).forEach((log) => {
      expenditurePoints.push({ date: log.date, value: Number(log.cost || 0) });
    });

    // Salary data
    SafeTerminal.array<RawSalaryNode>(salaryData as unknown as RawSalaryNode[]).forEach((sal) => {
      SafeTerminal.array<{ date: string, computed_salary: number }>(sal.attendance).forEach((att) => {
        expenditurePoints.push({ date: att.date, value: Number(att.computed_salary || 0) });
      });
    });

    const totalExpenditureAmount = expenditurePoints.reduce((sum, p) => sum + p.value, 0);

    return {
      chartData,
      revenuePoints,
      expenditurePoints,
      orderStatusData,
      totalRevenue: totalRevenueAmount,
      totalExpenditure: totalExpenditureAmount,
      totalOrders: allItems.length,
      averageOrder: totalRevenueAmount / (allItems.length || 1),
      totalCustomers: Object.keys(userStats).length,
      allItems: allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  }, [userNameMap]);

  const revenueChartData = useMemo(() => processTimeSeries(analytics.revenuePoints, revenueFilter), [analytics.revenuePoints, revenueFilter]);
  const expenditureChartData = useMemo(() => processTimeSeries(analytics.expenditurePoints, expenditureFilter), [analytics.expenditurePoints, expenditureFilter]);

  const topLoyalists = analytics.chartData;

  const pendingQueue = useMemo(() => {
    return analytics.allItems
      .filter(item => {
        const st = (item.status || '').toUpperCase();
        const isInStatus = st === 'PENDING' || st === 'PROCESSING';
        if (!isInStatus) return false;
        
        const searchLower = queueSearch.toLowerCase();
        return (
          item.customerName.toLowerCase().includes(searchLower) ||
          item.itemName.toLowerCase().includes(searchLower) ||
          item.id.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        switch (queueSort) {
          case 'date-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'date-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'total-desc': return b.total - a.total;
          case 'total-asc': return a.total - b.total;
          case 'name-asc': return a.customerName.localeCompare(b.customerName);
          default: return 0;
        }
      });
  }, [analytics.allItems, queueSearch, queueSort]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1440px] mx-auto px-4 lg:px-8 pb-16">
      
      <header className="flex flex-col pt-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Operations Dashboard</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Real-time overview of business metrics and workflow.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={analytics.totalRevenue} prefix="₱" trend={12} icon={TrendingUp} variant="dark" />
        <StatCard title="Total Expenditure" value={analytics.totalExpenditure} prefix="₱" trend={-8} icon={TrendingDown} variant="light" />
        <StatCard title="Active Orders" value={analytics.totalOrders} trend={5} icon={ShoppingCart} variant="emerald" />
        <StatCard title="Verified Customers" value={analytics.totalCustomers} icon={Users} variant="light" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-[800px]">
        
        <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
          
          {/* Revenue Stream Section */}
          <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revenue Stream Analysis</h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[2px] mt-1">Cash Inflow Matrix</p>
              </div>
              <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 gap-1">
                {(['week', 'month', 'year'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setRevenueFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      revenueFilter === f ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b', fontWeight: 800}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b', fontWeight: 800}}
                    tickFormatter={(value) => `₱${value}`}
                  />
                  <Tooltip 
                    contentStyle={{border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    cursor={{stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expenditure Section */}
          <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Expenditure Analysis</h3>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[2px] mt-1">Operational Outflow Matrix</p>
              </div>
              <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 gap-1">
                {(['week', 'month', 'year'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setExpenditureFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      expenditureFilter === f ? "bg-rose-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={expenditureChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorExpenditure" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b', fontWeight: 800}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b', fontWeight: 800}}
                    tickFormatter={(value) => `₱${value}`}
                  />
                  <Tooltip 
                    contentStyle={{border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    cursor={{stroke: '#e11d48', strokeWidth: 1, strokeDasharray: '3 3'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#e11d48" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorExpenditure)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col relative overflow-hidden h-[700px]">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <AlertCircle className="w-48 h-48 text-slate-900" />
             </div>
             
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
                <div>
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                      <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]"></span>
                      Pending Operations Queue
                   </h3>
                   <p className="text-sm font-medium text-slate-500 mt-1">Review orders and screenplate requests</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search queue..." 
                        value={queueSearch}
                        onChange={(e) => setQueueSearch(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 lg:w-64 transition-all"
                      />
                   </div>
                   <div className="relative group">
                      <select 
                        value={queueSort}
                        onChange={(e) => setQueueSort(e.target.value as 'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'name-asc')}
                        className="appearance-none pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="total-desc">Highest Price</option>
                        <option value="total-asc">Lowest Price</option>
                        <option value="name-asc">A-Z Name</option>
                      </select>
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                      <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                   </div>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto pr-2 space-y-4 relative z-10 custom-scrollbar">
                {pendingQueue.length === 0 ? (
                  <div className="py-24 bg-slate-50 border border-slate-100 border-dashed rounded-[24px] text-center">
                     <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                     <p className="text-sm font-bold text-slate-400">All pending payloads executed.</p>
                  </div>
                ) : pendingQueue.map(item => (
                  <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-[20px] transition-all gap-4">
                     <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{item.id}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracing-widest",
                            item.type === 'Order' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                          )}>{item.type}</span>
                        </div>
                        <p className="text-base font-bold text-slate-900">{item.customerName}</p>
                        <p className="text-sm font-semibold text-slate-500 mt-0.5">
                          <span className="text-slate-900 font-bold">₱{item.total.toLocaleString()}</span>
                          <span className="mx-2">•</span> 
                          <span className="text-slate-400 italic">"{item.itemName}"</span>
                          <span className="mx-2">•</span> 
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-xs border border-amber-100 font-black">{item.status}</span>
                        </p>
                     </div>
                     <div className="flex items-center gap-3 shrink-0">
                        <PermissionWrapper allowedRoles={['admin', 'inventory']} hideIfNoAccess>
                          <button className="flex items-center gap-2 px-5 py-3 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-xs font-bold rounded-xl transition-colors">
                            <XCircle size={16} />
                            REJECT
                          </button>
                        </PermissionWrapper>
                        
                        <PermissionWrapper allowedRoles={['admin', 'inventory']} hideIfNoAccess>
                          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-[#75EEA5] hover:bg-slate-800 border border-transparent shadow-lg text-xs font-bold rounded-xl transition-all hover:-translate-y-0.5">
                            <CheckCircle2 size={16} />
                            CONFIRM
                          </button>
                        </PermissionWrapper>

                        {user.role === 'staff' && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                             <Clock size={14} />
                             Awaiting Admin
                          </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">Loyalty Distribution Matrix</h3>
            </div>
            
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b', fontWeight: 800}} 
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b', fontWeight: 800}}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{
                      border: 'none', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="transactions" radius={[8, 8, 0, 0]} barSize={40}>
                    {analytics.chartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index < 3 ? '#10b981' : '#cbd5e1'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
        
        <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
          
          <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-8">Order Status Distribution</h3>
            <div className="min-h-[220px] relative">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={analytics.orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={6}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {analytics.orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-4">
              {analytics.orderStatusData.map((status) => (
                <div key={status.name} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{backgroundColor: status.color}}></div>
                    <span className="text-sm text-slate-600 font-semibold">{status.name}</span>
                  </div>
                  <span className="text-base font-bold text-slate-900">{status.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl flex flex-col flex-1 relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Crown className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10 mb-8">
               <h3 className="text-[11px] font-black text-[#75EEA5] uppercase tracking-[4px] flex items-center gap-2 mb-2">
                  <Crown size={18} />
                  LOYALIST TIER 1
               </h3>
               <p className="text-sm font-medium text-slate-400">Exclusive VIP node distribution</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar relative z-10 max-h-[600px]">
              {topLoyalists.map((user, idx) => (
                <div key={user.name} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all cursor-default border border-transparent hover:border-slate-800 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-[16px] flex items-center justify-center font-black text-lg shadow-lg transition-transform group-hover:scale-110 shrink-0",
                      idx === 0 ? "bg-[#75EEA5] text-slate-900 shadow-[#75EEA5]/20" : 
                      idx === 1 ? "bg-slate-100 text-slate-800" :
                      idx === 2 ? "bg-orange-100 text-orange-800" :
                      "bg-white/10 text-white/50"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">{user.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.transactions} TOTAL ORDERS</p>
                    </div>
                  </div>
                  <div className="sm:text-right px-16 sm:px-0">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:hidden">Spend</p>
                    <p className="text-base font-black text-white">₱{user.spent.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <section className="bg-white border border-slate-100 overflow-hidden rounded-[32px] shadow-lg shadow-slate-200/50 mt-8">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
             <h3 className="text-lg font-bold text-slate-900">Historical Registry</h3>
             <p className="text-sm font-medium text-slate-500 mt-1">Unified immutable payload record log</p>
          </div>
          <button className="text-sm font-bold bg-slate-50 text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors shadow-sm">
            Download Audit
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Trace ID</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Entity</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status Node</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Value Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {analytics.allItems.slice(0, 15).map((txn) => (
                <tr key={txn.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-6 font-mono text-slate-500 text-xs font-semibold">{txn.id}</td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900">{txn.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{txn.type}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg border",
                      txn.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      txn.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      txn.status === 'PROCESSING' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      txn.status === 'CANCELLED' ? "bg-rose-50 text-rose-600 border-rose-100" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {txn.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-slate-500 font-medium text-sm">
                    {new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900">₱{txn.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default GeneralDashboard;
