import React, { useMemo, useState } from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from 'recharts'
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
  ShieldAlert,
} from 'lucide-react'
import StatCard from './StatCard'
import { PermissionWrapper } from './guards/PermissionWrapper'
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
  parseISO,
} from 'date-fns'
import { SafeTerminal } from '../utils/safeTerminal'

// Mock Data imports (will use SafeTerminal to read them)
import orderRaw from '../data/order.json'
import productsRaw from '../data/products.json'
import restockLogsRaw from '../data/restock_logs.json'
import salaryRaw from '../data/salary.json'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

const now = new Date('2026-04-03') // Constant simulation date

interface DashboardLayoutProps {
  role: 'admin' | 'staff' | 'inventory' | string
}

interface AnalyticsItem {
  id: string
  customerName: string
  total: number
  status: string
  type: string
  createdAt: string
  itemName: string
}

interface RawOrder {
  id: string | number
  user_id: string | number
  total_amount: string | number
  status: string
  created_at: string
  items?: { productName: string }[]
}



interface RawProduct {
  id: string | number
  name: string
}

interface RawRestockLog {
  date: string
  cost: string | number
}

interface RawAttendance {
  date: string
  computed_salary: string | number
}

interface RawSalary {
  attendance: RawAttendance[]
}

interface AnalyticsResult {
  chartData: { name: string; transactions: number; spent: number }[]
  revenueChartData: { name: string; sales: number }[]
  expenditureChartData: { name: string; expense: number }[]
  orderStatusData: { name: string; value: number; color: string }[]
  totalRevenue: number
  totalOrders: number
  averageOrder: number
  totalCustomers: number
  allItems: AnalyticsItem[]
  success: boolean
}

const DashboardErrorFallback: React.FC<{
  message: string
  onRetry: () => void
}> = ({ message, onRetry }) => (
  <div className="DashboardErrorFallback flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-slate-100 bg-white p-12 text-center">
    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
      <ShieldAlert className="text-rose-500" size={40} />
    </div>
    <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-900 uppercase italic">
      Dashboard Desync
    </h2>
    <p className="mb-8 max-w-[420px] text-[10px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
      {message}. Unable to retrieve historical metrics or current operational
      state.
    </p>
    <button
      onClick={onRetry}
      className="flex items-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
    >
      <RefreshCcw size={18} />
      Retry Sync
    </button>
  </div>
)

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const [queueSearch, setQueueSearch] = useState('')
  const [queueSort] = useState<
    'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'name-asc'
  >('date-desc')
  const [revenueFilter, setRevenueFilter] = useState<'week' | 'month' | 'year'>(
    'week',
  )
  const [expenditureFilter, setExpenditureFilter] = useState<
    'week' | 'month' | 'year'
  >('week')

  const analytics = useMemo((): AnalyticsResult => {
    try {
      const orderData = SafeTerminal.array<RawOrder>(orderRaw)
      SafeTerminal.array<RawProduct>(productsRaw)
      const restockLogsData = SafeTerminal.array<RawRestockLog>(restockLogsRaw)
      const salaryData = SafeTerminal.array<RawSalary>(salaryRaw)

      const userStats: Record<
        string,
        { name: string; totalSpent: number; transactions: number }
      > = {}
      let totalRevenue = 0

      const statusCounts = {
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
      }

      // Standardize combined data
      const allItems: AnalyticsItem[] = [
        ...orderData.map(
          (o: RawOrder): AnalyticsItem => ({
            id: String(o.id),
            customerName: 'Customer #' + o.user_id,
            total: Number(o.total_amount || 0),
            status: String(o.status || 'PENDING'),
            type: 'Order',
            createdAt: String(o.created_at || new Date().toISOString()),
            itemName: String(o.items?.[0]?.productName || 'Order'),
          }),
        ),
      ]

      allItems.forEach((item: AnalyticsItem) => {
        const name = item.customerName
        const total = item.total || 0

        if (!userStats[name]) {
          userStats[name] = { name, totalSpent: 0, transactions: 0 }
        }
        userStats[name].totalSpent += total
        userStats[name].transactions += 1
        totalRevenue += total

        const st = (item.status || '').toLowerCase()
        if (st === 'pending') statusCounts.pending++
        else if (st === 'processing') statusCounts.processing++
        else if (st === 'completed') statusCounts.completed++
        else if (st === 'cancelled') statusCounts.cancelled++
      })

      // Revenue Chart Data Processing
      let revenueChartData: { name: string; sales: number }[] = []
      if (revenueFilter === 'week') {
        const start = startOfWeek(now, { weekStartsOn: 1 })
        const days = eachDayOfInterval({
          start,
          end: endOfWeek(now, { weekStartsOn: 1 }),
        })
        revenueChartData = days.map((day) => {
          const dayStr = format(day, 'EEE')
          const sales = allItems.reduce((sum, item) => {
            const itemDate = parseISO(item.createdAt)
            return isSameWeek(itemDate, now, { weekStartsOn: 1 }) &&
              format(itemDate, 'EEE') === dayStr
              ? sum + item.total
              : sum
          }, 0)
          return { name: dayStr, sales }
        })
      } else if (revenueFilter === 'month') {
        const start = startOfMonth(now)
        const days = eachDayOfInterval({ start, end: endOfMonth(now) })
        revenueChartData = days.map((day) => {
          const dayStr = format(day, 'd')
          const sales = allItems.reduce((sum, item) => {
            const itemDate = parseISO(item.createdAt)
            return isSameMonth(itemDate, now) &&
              format(itemDate, 'd') === dayStr
              ? sum + item.total
              : sum
          }, 0)
          return { name: dayStr, sales }
        })
      } else if (revenueFilter === 'year') {
        const months = eachMonthOfInterval({
          start: startOfYear(now),
          end: endOfYear(now),
        })
        revenueChartData = months.map((month) => {
          const monthStr = format(month, 'MMM')
          const sales = allItems.reduce((sum, item) => {
            const itemDate = parseISO(item.createdAt)
            return isSameYear(itemDate, now) &&
              format(itemDate, 'MMM') === monthStr
              ? sum + item.total
              : sum
          }, 0)
          return { name: monthStr, sales }
        })
      }

      // Expenditure Data Processing
      let expenditureChartData: { name: string; expense: number }[] = []
      interface ExpenseItem {
        date: string
        amount: number
        type: string
      }
      const allExpenses: ExpenseItem[] = [
        ...restockLogsData.map(
          (log: RawRestockLog): ExpenseItem => ({
            date: String(log.date),
            amount: Number(log.cost || 0),
            type: 'Restock',
          }),
        ),
        ...salaryData.flatMap((s: RawSalary): ExpenseItem[] =>
          SafeTerminal.array<RawAttendance>(s.attendance).map(
            (a: RawAttendance): ExpenseItem => ({
              date: String(a.date),
              amount: Number(a.computed_salary || 0),
              type: 'Salary',
            }),
          ),
        ),
      ]

      if (expenditureFilter === 'week') {
        const start = startOfWeek(now, { weekStartsOn: 1 })
        const days = eachDayOfInterval({
          start,
          end: endOfWeek(now, { weekStartsOn: 1 }),
        })
        expenditureChartData = days.map((day) => {
          const dayStr = format(day, 'EEE')
          const expense = allExpenses.reduce((sum, exp) => {
            const expDate = parseISO(exp.date)
            return isSameWeek(expDate, now, { weekStartsOn: 1 }) &&
              format(expDate, 'EEE') === dayStr
              ? sum + exp.amount
              : sum
          }, 0)
          return { name: dayStr, expense }
        })
      } else if (expenditureFilter === 'month') {
        const start = startOfMonth(now)
        const days = eachDayOfInterval({ start, end: endOfMonth(now) })
        expenditureChartData = days.map((day) => {
          const dayStr = format(day, 'd')
          const expense = allExpenses.reduce((sum, exp) => {
            const expDate = parseISO(exp.date)
            return isSameMonth(expDate, now) && format(expDate, 'd') === dayStr
              ? sum + exp.amount
              : sum
          }, 0)
          return { name: dayStr, expense }
        })
      } else if (expenditureFilter === 'year') {
        const months = eachMonthOfInterval({
          start: startOfYear(now),
          end: endOfYear(now),
        })
        expenditureChartData = months.map((month) => {
          const monthStr = format(month, 'MMM')
          const expense = allExpenses.reduce((sum, exp) => {
            const expDate = parseISO(exp.date)
            return isSameYear(expDate, now) &&
              format(expDate, 'MMM') === monthStr
              ? sum + exp.amount
              : sum
          }, 0)
          return { name: monthStr, expense }
        })
      }

      const chartData = Object.values(userStats)
        .sort((a, b) => b.transactions - a.transactions)
        .map((user) => ({
          name: user.name,
          transactions: user.transactions,
          spent: user.totalSpent,
        }))

      const orderStatusData = [
        { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
        {
          name: 'Processing',
          value: statusCounts.processing,
          color: '#3b82f6',
        },
        { name: 'Complete', value: statusCounts.completed, color: '#10b981' },
        { name: 'Cancelled', value: statusCounts.cancelled, color: '#ef4444' },
      ].filter((s) => s.value > 0)

      return {
        chartData,
        revenueChartData,
        expenditureChartData,
        orderStatusData,
        totalRevenue,
        totalOrders: allItems.length,
        averageOrder: totalRevenue / (allItems.length || 1),
        totalCustomers: Object.keys(userStats).length,
        allItems: allItems.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
        success: true,
      }
    } catch (e) {
      console.error(e)
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
        allItems: [],
      }
    }
  }, [revenueFilter, expenditureFilter])

  if (analytics.success === false) {
    return (
      <DashboardErrorFallback
        message="Legacy Buffer Corruption detected during parity sync"
        onRetry={() => window.location.reload()}
      />
    )
  }

  const topLoyalists = analytics.chartData

  const pendingQueue = analytics.allItems
    .filter((item: AnalyticsItem) => {
      const st = (item.status || '').toUpperCase()
      const isInStatus = st === 'PENDING' || st === 'PROCESSING'
      if (!isInStatus) return false

      const searchLower = queueSearch.toLowerCase()
      return (
        item.customerName.toLowerCase().includes(searchLower) ||
        item.itemName.toLowerCase().includes(searchLower) ||
        item.id.toLowerCase().includes(searchLower)
      )
    })
    .sort((a: AnalyticsItem, b: AnalyticsItem) => {
      switch (queueSort) {
        case 'date-desc':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        case 'date-asc':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        case 'total-desc':
          return b.total - a.total
        case 'total-asc':
          return a.total - b.total
        case 'name-asc':
          return a.customerName.localeCompare(b.customerName)
        default:
          return 0
      }
    })

  return (
    <div
      className={`DashboardLayout dash-role-${role} animate-in fade-in mx-auto max-w-[1440px] space-y-8 px-4 pb-16 duration-500 lg:px-8`}
    >
      {/* Header Section */}
      <header className="StaffOverviewHeader flex flex-col pt-6">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
          {role === 'admin' ? 'Operations Dashboard' : 'Fleet Overview'}
        </h1>
        <p className="mt-1 text-[11px] font-black tracking-widest text-slate-400 uppercase">
          {role === 'admin'
            ? 'Strategic Business Node: PIXS ERP System'
            : 'Fleet Status Monitor: Command Interface'}
        </p>
      </header>

      {/* Analytics Grid */}
      <section className="StaffOverviewContent grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={analytics.totalRevenue}
          prefix="₱"
          trend={12}
          icon={TrendingUp}
          variant="dark"
        />
        <StatCard
          title="Active Orders"
          value={analytics.totalOrders}
          trend={5}
          icon={ShoppingCart}
          variant="emerald"
        />
        <StatCard
          title="Average Order Value"
          value={analytics.averageOrder}
          prefix="₱"
          icon={Clock}
          variant="light"
        />
        <StatCard
          title="Verified Customers"
          value={analytics.totalCustomers}
          icon={Users}
          variant="light"
        />
      </section>

      {/* Primary Infrastructure Matrix */}
      <div className="grid min-h-[800px] grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6 lg:col-span-8 lg:gap-8">
          {/* Revenue Chart */}
          <div className="StaffOverviewCard flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 uppercase italic">
                  Revenue Analysis
                </h3>
                <p className="mt-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Projection Vectors
                </p>
              </div>
              <div className="flex gap-1 rounded-[18px] border border-slate-100 bg-slate-50 p-1.5">
                {(['week', 'month', 'year'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setRevenueFilter(f)}
                    className={cn(
                      'rounded-[14px] px-5 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all',
                      revenueFilter === f
                        ? 'border border-slate-100 bg-white text-blue-600 shadow-md shadow-blue-500/10'
                        : 'text-slate-400 hover:text-slate-600',
                    )}
                  >
                    {f === 'week'
                      ? 'Weekly'
                      : f === 'month'
                        ? 'Monthly'
                        : 'Yearly'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.revenueChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900 }}
                    tickFormatter={(value) =>
                      `₱${value >= 1000 ? value / 1000 + 'k' : value}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: '900',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      textTransform: 'uppercase',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Operations Queue */}
          <div className="StaffPendingOperationsQueue relative flex h-[700px] flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
            <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-[0.03]">
              <AlertCircle className="h-48 w-48 text-slate-900" />
            </div>

            <div className="relative z-10 mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="flex items-center gap-3 text-lg font-bold tracking-tight text-slate-900 uppercase italic">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                  Pending Operations
                </h3>
                <p className="mt-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Mission Critical Execution Queue
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Filter Nodes..."
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    className="w-48 rounded-xl border border-slate-100 bg-slate-50 py-2.5 pr-4 pl-10 text-xs font-bold transition-all focus:ring-2 focus:ring-blue-500/20 focus:outline-none lg:w-64"
                  />
                </div>
              </div>
            </div>

            <div className="custom-scrollbar relative z-10 flex-1 space-y-4 overflow-y-auto pr-2">
              {pendingQueue.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-slate-100 bg-slate-50 py-24 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p className="text-xs leading-loose font-black tracking-widest text-slate-400 uppercase">
                    No active anomalies detected.
                    <br />
                    Fleet state optimized.
                  </p>
                </div>
              ) : (
                pendingQueue.map((item: AnalyticsItem) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 rounded-[24px] border border-slate-200 bg-white p-5 transition-all hover:border-slate-400 md:flex-row md:items-center"
                  >
                    <div className="flex flex-col">
                      <div className="mb-1 flex items-center gap-3">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          {item.id}
                        </span>
                        <span
                          className={cn(
                            'rounded-lg px-2 py-0.5 text-[8px] font-black tracking-widest uppercase',
                            item.type === 'Order'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-purple-50 text-purple-600',
                          )}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className="text-base font-black tracking-tight text-slate-900 italic">
                        {item.customerName}
                      </p>
                      <div className="mt-1 flex items-center gap-3 underline decoration-slate-100 underline-offset-4">
                        <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
                          ₱{item.total.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                          "{item.itemName}"
                        </span>
                        <span className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-0.5 text-[9px] font-black tracking-widest text-amber-600 uppercase">
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <PermissionWrapper allowedRoles={['admin']}>
                        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                          <XCircle size={14} />
                          REJECT
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper allowedRoles={['admin']}>
                        <button className="flex items-center gap-2 rounded-xl border border-transparent bg-slate-900 px-6 py-3 text-[10px] font-black tracking-widest text-[#75EEA5] uppercase shadow-xl transition-all hover:-translate-y-0.5 hover:bg-slate-800">
                          <CheckCircle2 size={14} />
                          APPROVE
                        </button>
                      </PermissionWrapper>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 lg:col-span-4 lg:gap-8">
          {/* Order Status Pie Chart */}
          <div className="flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
            <h3 className="mb-8 text-lg font-bold tracking-tight text-slate-900 uppercase italic">
              Fleet Distribution
            </h3>
            <div className="relative min-h-[220px]">
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
                    {analytics.orderStatusData.map(
                      (entry: { color: string }, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      fontWeight: '900',
                      fontSize: '11px',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      textTransform: 'uppercase',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Total Nodes
                  </p>
                  <p className="mt-1 text-3xl font-black text-slate-900">
                    {analytics.totalOrders}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expenditure Grid */}
          <div className="flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
            <div className="mb-4">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 uppercase italic">
                Burn Rate Analysis
              </h3>
              <p className="mt-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                Resource Depletion Monitoring
              </p>
            </div>
            <div className="space-y-4">
              {(['week', 'month', 'year'] as const).map((f) => (
                <div
                  key={f}
                  className={cn(
                    'rounded-2xl border p-4 transition-all',
                    expenditureFilter === f
                      ? 'border-rose-100 bg-rose-50/30 shadow-sm'
                      : 'cursor-pointer border-slate-100 bg-slate-50/50 grayscale',
                  )}
                  onClick={() => setExpenditureFilter(f)}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <span className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                      {f === 'week'
                        ? 'Weekly'
                        : f === 'month'
                          ? 'Monthly'
                          : 'Annual'}{' '}
                      Burn
                    </span>
                    {expenditureFilter === f && (
                      <div className="h-2 w-2 animate-ping rounded-full bg-rose-500"></div>
                    )}
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    ₱
                    {analytics.expenditureChartData
                      .reduce(
                        (s: number, d: { expense: number }) => s + d.expense,
                        0,
                      )
                      .toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Rankings */}
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-[40px] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Crown className="h-48 w-48 text-white" />
            </div>
            <div className="relative z-10 mb-8">
              <h3 className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-[4px] text-[#75EEA5] uppercase italic">
                <Crown size={18} />
                Node Loyalists
              </h3>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                High Value Entities
              </p>
            </div>

            <div className="custom-scrollbar relative z-10 max-h-[400px] flex-1 space-y-4 overflow-y-auto pr-2">
              {topLoyalists.map(
                (
                  user: { name: string; transactions: number; spent: number },
                  idx: number,
                ) => (
                  <div
                    key={user.name}
                    className="group flex flex-col gap-2 rounded-3xl border border-transparent p-4 transition-all hover:border-slate-800 hover:bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black shadow-lg transition-transform group-hover:scale-110',
                          idx === 0
                            ? 'bg-[#75EEA5] text-slate-900 shadow-[#75EEA5]/20'
                            : idx === 1
                              ? 'bg-slate-700 text-slate-100'
                              : idx === 2
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-white/10 text-white/50',
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-black tracking-widest text-white uppercase italic">
                          {user.name}
                        </p>
                        <p className="mt-0.5 text-[8px] font-black tracking-[2px] text-slate-500 uppercase">
                          {user.transactions} LOGS
                        </p>
                      </div>
                    </div>
                    <p className="ml-14 text-sm font-black text-[#75EEA5]">
                      ₱{user.spent.toLocaleString()}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Registry */}
      <section className="mt-8 overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 p-8">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 uppercase italic">
              Historical Registry
            </h3>
            <p className="mt-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
              Immutable Sequence Logs
            </p>
          </div>
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-[10px] font-black tracking-widest text-slate-900 uppercase shadow-sm transition-all hover:bg-slate-100 active:scale-95">
            Export Core Log
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                  Trace
                </th>
                <th className="px-8 py-5 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                  Entity
                </th>
                <th className="px-8 py-5 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                  Node Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                  Sequence
                </th>
                <th className="px-8 py-5 text-right text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {analytics.allItems.slice(0, 15).map((txn: AnalyticsItem) => (
                <tr
                  key={txn.id}
                  className="border-b border-slate-50 transition-colors hover:bg-slate-50/40"
                >
                  <td className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {txn.id}
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black tracking-tight text-slate-900 uppercase italic">
                      {txn.customerName}
                    </p>
                    <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                      {txn.type}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={cn(
                        'rounded-xl border px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all',
                        txn.status === 'COMPLETED'
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                          : txn.status === 'PENDING'
                            ? 'border-amber-100 bg-amber-50 text-amber-600'
                            : txn.status === 'PROCESSING'
                              ? 'border-blue-100 bg-blue-50 text-blue-600'
                              : txn.status === 'CANCELLED'
                                ? 'border-rose-100 bg-rose-50 text-rose-600'
                                : 'border-slate-100 bg-slate-50 text-slate-500',
                      )}
                    >
                      {txn.status || 'VOID'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    {new Date(txn.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-8 py-6 text-right font-black tracking-wider text-slate-900">
                    ₱{txn.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default DashboardLayout
