import React, { useMemo, useState } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
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
  RefreshCcw,
  ShieldAlert
} from 'lucide-react';
import StatCard from './StatCard';
import { PermissionWrapper } from './guards/PermissionWrapper';
import { 
  format, 
  isSameWeek, 
  isSameMonth, 
  isSameYear, 
  startOfWeek, 
  eachDayOfInterval, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  parseISO
} from 'date-fns';
import { SafeTerminal } from '../utils/safeTerminal';

// Mock Data imports (will use SafeTerminal to read them)
import orderRaw from '../data/order.json';
import requestScreenplateRaw from '../data/request_screenplate.json';
import productsRaw from '../data/products.json';
import restockLogsRaw from '../data/restock_logs.json';
import salaryRaw from '../data/salary.json';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const now = new Date('2026-04-03'); // Constant simulation date

interface DashboardLayoutProps {
  role: 'admin' | 'staff' | 'inventory' | string;
}

interface AnalyticsItem {
  id: string;
  customerName: string;
  total: number;
  status: string;
  type: string;
  createdAt: string;
  itemName: string;
}

interface RawOrder {
  id: string | number;
  user_id: string | number;
  total_amount: string | number;
  status: string;
  created_at: string;
  items?: { productName: string }[];
}

interface RawRequest {
  request_id?: string | number;
  id?: string | number;
  customer_id: string | number;
  product_id: string | number;
  calculated_total: string | number;
  status: string;
  created_at: string;
}

interface RawProduct {
  id: string | number;
  name: string;
}

interface RawRestockLog {
  date: string;
  cost: string | number;
}

interface RawAttendance {
  date: string;
  computed_salary: string | number;
}

interface RawSalary {
  attendance: RawAttendance[];
}

interface AnalyticsResult {
  chartData: { name: string, transactions: number, spent: number }[];
  revenueChartData: { name: string, sales: number }[];
  expenditureChartData: { name: string, expense: number }[];
  orderStatusData: { name: string, value: number, color: string }[];
  totalRevenue: number;
  totalOrders: number;
  averageOrder: number;
  totalCustomers: number;
  allItems: AnalyticsItem[];
  success: boolean;
}

const DashboardErrorFallback: React.FC<{ message: string, onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="DashboardErrorFallback min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[32px] p-12 text-center border border-slate-100">
    <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
      <ShieldAlert className="text-rose-500" size={40} />
    </div>
    <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase italic">Dashboard Desync</h2>
    <p className="text-slate-400 font-bold max-w-[420px] mb-8 leading-relaxed uppercase text-[10px] tracking-widest">
      {message}. Unable to retrieve historical metrics or current operational state.
    </p>
    <button 
      onClick={onRetry}
      className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
    >
      <RefreshCcw size={18} />
      Retry Sync
    </button>
  </div>
);

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const [queueSearch, setQueueSearch] = useState('');
  const [queueSort] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'name-asc'>('date-desc');
  const [revenueFilter, setRevenueFilter] = useState<'week' | 'month' | 'year'>('week');
  const [expenditureFilter, setExpenditureFilter] = useState<'week' | 'month' | 'year'>('week');

  const analytics = useMemo((): AnalyticsResult => {
    try {
      const orderData = SafeTerminal.array<RawOrder>(orderRaw);
      const requestScreenplateData = SafeTerminal.array<RawRequest>(requestScreenplateRaw);
      const productsData = SafeTerminal.array<RawProduct>(productsRaw);
      const restockLogsData = SafeTerminal.array<RawRestockLog>(restockLogsRaw);
      const salaryData = SafeTerminal.array<RawSalary>(salaryRaw);

      const userStats: Record<string, { name: string, totalSpent: number, transactions: number }> = {};
      let totalRevenue = 0;
      
      const statusCounts = { pending: 0, processing: 0, completed: 0, cancelled: 0 };

      // Standardize combined data
      const allItems: AnalyticsItem[] = [
        ...orderData.map((o: RawOrder): AnalyticsItem => ({
          id: String(o.id),
          customerName: 'Customer #' + o.user_id,
          total: Number(o.total_amount || 0),
          status: String(o.status || 'PENDING'),
          type: 'Order',
          createdAt: String(o.created_at || new Date().toISOString()),
          itemName: String(o.items?.[0]?.productName || 'Order')
        })),
        ...requestScreenplateData.map((r: RawRequest): AnalyticsItem => {
          const product = productsData.find((p: RawProduct) => String(p.id) === String(r.product_id));
          return {
            id: String(r.request_id || r.id),
            customerName: 'Customer #' + r.customer_id,
            total: Number(r.calculated_total || 0),
            status: String(r.status || 'PENDING').toUpperCase(),
            type: 'Screenplate Req',
            createdAt: String(r.created_at || new Date().toISOString()),
            itemName: String(product?.name || 'Screenplate')
          };
        })
      ];

      allItems.forEach((item: AnalyticsItem) => {
        const name = item.customerName;
        const total = item.total || 0;
        
        if (!userStats[name]) {
          userStats[name] = { name, totalSpent: 0, transactions: 0 };
        }
        userStats[name].totalSpent += total;
        userStats[name].transactions += 1;
        totalRevenue += total;

        const st = (item.status || '').toLowerCase();
        if (st === 'pending') statusCounts.pending++;
        else if (st === 'processing') statusCounts.processing++;
        else if (st === 'completed') statusCounts.completed++;
        else if (st === 'cancelled') statusCounts.cancelled++;
      });

      // Revenue Chart Data Processing
      let revenueChartData: { name: string, sales: number }[] = [];
      if (revenueFilter === 'week') {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end: endOfWeek(now, { weekStartsOn: 1 }) });
        revenueChartData = days.map(day => {
          const dayStr = format(day, 'EEE');
          const sales = allItems.reduce((sum, item) => {
            const itemDate = parseISO(item.createdAt);
            return isSameWeek(itemDate, now, { weekStartsOn: 1 }) && format(itemDate, 'EEE') === dayStr ? sum + item.total : sum;
          }, 0);
          return { name: dayStr, sales };
        });
      } else if (revenueFilter === 'month') {
        const start = startOfMonth(now);
        const days = eachDayOfInterval({ start, end: endOfMonth(now) });
        revenueChartData = days.map(day => {
          const dayStr = format(day, 'd');
          const sales = allItems.reduce((sum, item) => {
            const itemDate = parseISO(item.createdAt);
            return isSameMonth(itemDate, now) && format(itemDate, 'd') === dayStr ? sum + item.total : sum;
          }, 0);
          return { name: dayStr, sales };
        });
      } else if (revenueFilter === 'year') {
        const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) });
        revenueChartData = months.map(month => {
          const monthStr = format(month, 'MMM');
          const sales = allItems.reduce((sum, item) => {
            const itemDate = parseISO(item.createdAt);
            return isSameYear(itemDate, now) && format(itemDate, 'MMM') === monthStr ? sum + item.total : sum;
          }, 0);
          return { name: monthStr, sales };
        });
      }

      // Expenditure Data Processing
      let expenditureChartData: { name: string, expense: number }[] = [];
      interface ExpenseItem { date: string, amount: number, type: string }
      const allExpenses: ExpenseItem[] = [
        ...restockLogsData.map((log: RawRestockLog): ExpenseItem => ({ date: String(log.date), amount: Number(log.cost || 0), type: 'Restock' })),
        ...salaryData.flatMap((s: RawSalary): ExpenseItem[] => SafeTerminal.array<RawAttendance>(s.attendance).map((a: RawAttendance): ExpenseItem => ({ date: String(a.date), amount: Number(a.computed_salary || 0), type: 'Salary' })))
      ];

      if (expenditureFilter === 'week') {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end: endOfWeek(now, { weekStartsOn: 1 }) });
        expenditureChartData = days.map(day => {
          const dayStr = format(day, 'EEE');
          const expense = allExpenses.reduce((sum, exp) => {
            const expDate = parseISO(exp.date);
            return isSameWeek(expDate, now, { weekStartsOn: 1 }) && format(expDate, 'EEE') === dayStr ? sum + exp.amount : sum;
          }, 0);
          return { name: dayStr, expense };
        });
      } else if (expenditureFilter === 'month') {
        const start = startOfMonth(now);
        const days = eachDayOfInterval({ start, end: endOfMonth(now) });
        expenditureChartData = days.map(day => {
          const dayStr = format(day, 'd');
          const expense = allExpenses.reduce((sum, exp) => {
            const expDate = parseISO(exp.date);
            return isSameMonth(expDate, now) && format(expDate, 'd') === dayStr ? sum + exp.amount : sum;
          }, 0);
          return { name: dayStr, expense };
        });
      } else if (expenditureFilter === 'year') {
        const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) });
        expenditureChartData = months.map(month => {
          const monthStr = format(month, 'MMM');
          const expense = allExpenses.reduce((sum, exp) => {
            const expDate = parseISO(exp.date);
            return isSameYear(expDate, now) && format(expDate, 'MMM') === monthStr ? sum + exp.amount : sum;
          }, 0);
          return { name: monthStr, expense };
        });
      }

      const chartData = Object.values(userStats)
        .sort((a, b) => b.transactions - a.transactions)
        .map(user => ({
          name: user.name,
          transactions: user.transactions,
          spent: user.totalSpent
        }));

      const orderStatusData = [
        { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
        { name: 'Processing', value: statusCounts.processing, color: '#3b82f6' },
        { name: 'Complete', value: statusCounts.completed, color: '#10b981' },
        { name: 'Cancelled', value: statusCounts.cancelled, color: '#ef4444' }
      ].filter(s => s.value > 0);

      return {
        chartData,
        revenueChartData,
        expenditureChartData,
        orderStatusData,
        totalRevenue,
        totalOrders: allItems.length,
        averageOrder: totalRevenue / (allItems.length || 1),
        totalCustomers: Object.keys(userStats).length,
        allItems: allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        success: true
      };
    } catch (e) {
      console.error(e);
      return { 
        chartData: [],
        revenueChartData: [],
        expenditureChartData: [],
        orderStatusData: [],
        totalRevenue: 0,
        totalOrders: 0,
        averageOrder: 0,
        totalCustomers: 0,
        success: false, 
        allItems: [] 
      };
    }
  }, [revenueFilter, expenditureFilter]);

  if (analytics.success === false) {
    return <DashboardErrorFallback message="Legacy Buffer Corruption detected during parity sync" onRetry={() => window.location.reload()} />;
  }

  const topLoyalists = analytics.chartData;

  const pendingQueue = analytics.allItems
    .filter((item: AnalyticsItem) => {
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
    .sort((a: AnalyticsItem, b: AnalyticsItem) => {
      switch (queueSort) {
        case 'date-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'total-desc': return b.total - a.total;
        case 'total-asc': return a.total - b.total;
        case 'name-asc': return a.customerName.localeCompare(b.customerName);
        default: return 0;
      }
    });

  return (
    <div className={`DashboardLayout dash-role-${role} space-y-8 animate-in fade-in duration-500 max-w-[1440px] mx-auto px-4 lg:px-8 pb-16`}>
      
      {/* Header Section */}
      <header className="StaffOverviewHeader flex flex-col pt-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
          {role === 'admin' ? 'Operations Dashboard' : 'Fleet Overview'}
        </h1>
        <p className="text-[11px] font-black uppercase text-slate-400 mt-1 tracking-widest">
          {role === 'admin' ? 'Strategic Business Node: PIXS ERP System' : 'Fleet Status Monitor: Command Interface'}
        </p>
      </header>

      {/* Analytics Grid */}
      <section className="StaffOverviewContent grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={analytics.totalRevenue} prefix="₱" trend={12} icon={TrendingUp} variant="dark" />
        <StatCard title="Active Orders" value={analytics.totalOrders} trend={5} icon={ShoppingCart} variant="emerald" />
        <StatCard title="Average Order Value" value={analytics.averageOrder} prefix="₱" icon={Clock} variant="light" />
        <StatCard title="Verified Customers" value={analytics.totalCustomers} icon={Users} variant="light" />
      </section>

      {/* Primary Infrastructure Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-[800px]">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
          
          {/* Revenue Chart */}
          <div className="StaffOverviewCard bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase italic">Revenue Analysis</h3>
                <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">Projection Vectors</p>
              </div>
              <div className="flex bg-slate-50 p-1.5 rounded-[18px] border border-slate-100 gap-1">
                {(['week', 'month', 'year'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setRevenueFilter(f)}
                    className={cn(
                      "px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-[14px] transition-all",
                      revenueFilter === f ? "bg-white text-blue-600 shadow-md shadow-blue-500/10 border border-slate-100" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {f === 'week' ? 'Weekly' : f === 'month' ? 'Monthly' : 'Yearly'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 900}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 900}} tickFormatter={(value) => `₱${value >= 1000 ? value / 1000 + 'k' : value}`} />
                  <Tooltip contentStyle={{border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: '900', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', textTransform: 'uppercase'}} />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Operations Queue */}
          <div className="StaffPendingOperationsQueue bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col relative overflow-hidden h-[700px]">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <AlertCircle className="w-48 h-48 text-slate-900" />
             </div>
             
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
                <div>
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 tracking-tight uppercase italic">
                      <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]"></span>
                      Pending Operations
                   </h3>
                   <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">Mission Critical Execution Queue</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Filter Nodes..." 
                        value={queueSearch}
                        onChange={(e) => setQueueSearch(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 lg:w-64 transition-all"
                      />
                   </div>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto pr-2 space-y-4 relative z-10 custom-scrollbar">
                {pendingQueue.length === 0 ? (
                  <div className="py-24 bg-slate-50 border border-slate-100 border-dashed rounded-[32px] text-center">
                     <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-loose">No active anomalies detected.<br/>Fleet state optimized.</p>
                  </div>
                ) : pendingQueue.map((item: AnalyticsItem) => (
                  <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-slate-200 hover:border-slate-400 rounded-[24px] transition-all gap-4">
                     <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.id}</span>
                           <span className={cn(
                             "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest",
                             item.type === 'Order' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                           )}>{item.type}</span>
                        </div>
                        <p className="text-base font-black text-slate-900 tracking-tight italic">{item.customerName}</p>
                        <div className="flex items-center gap-3 mt-1 underline decoration-slate-100 underline-offset-4">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">₱{item.total.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">"{item.itemName}"</span>
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-[9px] border border-amber-100 font-black uppercase tracking-widest">{item.status}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 shrink-0">
                        <PermissionWrapper allowedRoles={['admin']}>
                          <button className="flex items-center gap-2 px-5 py-3 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest">
                            <XCircle size={14} />
                            REJECT
                          </button>
                        </PermissionWrapper>
                        <PermissionWrapper allowedRoles={['admin']}>
                          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-[#75EEA5] hover:bg-slate-800 border border-transparent shadow-xl text-[10px] font-black rounded-xl transition-all hover:-translate-y-0.5 uppercase tracking-widest">
                            <CheckCircle2 size={14} />
                            APPROVE
                          </button>
                        </PermissionWrapper>
                     </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
        
        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
          
          {/* Order Status Pie Chart */}
          <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-8 tracking-tight uppercase italic">Fleet Distribution</h3>
            <div className="min-h-[220px] relative">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={analytics.orderStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={6} dataKey="value" isAnimationActive={false}>
                    {analytics.orderStatusData.map((entry: { color: string }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '11px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Nodes</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{analytics.totalOrders}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Expenditure Grid */}
          <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase italic">Burn Rate Analysis</h3>
              <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">Resource Depletion Monitoring</p>
            </div>
            <div className="space-y-4">
              {(['week', 'month', 'year'] as const).map(f => (
                <div key={f} className={cn("p-4 rounded-2xl border transition-all", expenditureFilter === f ? "bg-rose-50/30 border-rose-100 shadow-sm" : "bg-slate-50/50 border-slate-100 grayscale cursor-pointer")} onClick={() => setExpenditureFilter(f)}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">{f === 'week' ? 'Weekly' : f === 'month' ? 'Monthly' : 'Annual'} Burn</span>
                    {expenditureFilter === f && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>}
                  </div>
                  <p className="text-2xl font-black text-slate-900">₱{analytics.expenditureChartData.reduce((s: number, d: { expense: number }) => s + d.expense, 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Rankings */}
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl flex flex-col flex-1 relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Crown className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10 mb-8">
               <h3 className="text-[11px] font-black text-[#75EEA5] uppercase tracking-[4px] flex items-center gap-2 mb-2 italic">
                  <Crown size={18} />
                  Node Loyalists
               </h3>
               <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">High Value Entities</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar relative z-10 max-h-[400px]">
              {topLoyalists.map((user: { name: string, transactions: number, spent: number }, idx: number) => (
                <div key={user.name} className="group flex flex-col p-4 rounded-3xl hover:bg-white/5 transition-all border border-transparent hover:border-slate-800 gap-2">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-lg transition-transform group-hover:scale-110 shrink-0",
                      idx === 0 ? "bg-[#75EEA5] text-slate-900 shadow-[#75EEA5]/20" : 
                      idx === 1 ? "bg-slate-700 text-slate-100" :
                      idx === 2 ? "bg-slate-800 text-slate-300" :
                      "bg-white/10 text-white/50"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white tracking-widest uppercase italic">{user.name}</p>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[2px] mt-0.5">{user.transactions} LOGS</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#75EEA5] ml-14">₱{user.spent.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Historical Registry */}
      <section className="bg-white border border-slate-100 overflow-hidden rounded-[40px] shadow-lg shadow-slate-200/50 mt-8">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
             <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase italic">Historical Registry</h3>
             <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">Immutable Sequence Logs</p>
          </div>
          <button className="text-[10px] font-black bg-slate-50 text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest shadow-sm active:scale-95">
            Export Core Log
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Trace</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Entity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Node Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Sequence</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px] text-right">Value</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {analytics.allItems.slice(0, 15).map((txn: AnalyticsItem) => (
                <tr key={txn.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-400 text-[10px] tracking-widest uppercase">{txn.id}</td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 tracking-tight uppercase italic">{txn.customerName}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{txn.type}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl border transition-all",
                      txn.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      txn.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      txn.status === 'PROCESSING' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      txn.status === 'CANCELLED' ? "bg-rose-50 text-rose-600 border-rose-100" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {txn.status || 'VOID'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                    {new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 tracking-wider">₱{txn.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DashboardLayout;
