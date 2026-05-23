import React, { useMemo, useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
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
  Filter,
  ArrowUpDown,
  TrendingDown,
} from 'lucide-react'
import StatCard from '../../components/StatCard'
import { useAuth } from '../../context/AuthContext'
import { PermissionWrapper } from '../../components/guards/PermissionWrapper'
import axiosInstance from '../../lib/axiosInstance'
import { toast } from 'react-hot-toast'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

type FilterType = 'week' | 'month' | 'year'

interface DashboardData {
  totalRevenue: number
  totalExpenditure: number
  revenuePoints: { date: string; total_amount: number }[]
  revenueTableData: { id: string; date: string; customer: string; amount: number; discount: number; status: string }[]
  expenditurePoints: { date: string; value: number }[]
  orderStatusData: { name: string; value: number; color: string }[]
  pendingQueue: ItemBase[]
  topLoyalists: { name: string; transactions: number; spent: number }[]
  loyaltyDistribution: { name: string; transactions: number; spent: number }[]
  recentOrders: ItemBase[]
  totalOrders: number
  totalCustomers: number
}

interface ItemBase {
  id: string
  customerName: string
  total: number
  status: string
  type: string
  createdAt: string
  itemName: string
}

interface DataPoint {
  date: string
  [key: string]: string | number
}

const GeneralDashboard: React.FC = () => {
  const { user } = useAuth()
  const [queueSearch, setQueueSearch] = useState('')
  const [queueSort, setQueueSort] = useState<
    'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'name-asc'
  >('date-desc')
  const [revenueFilter, setRevenueFilter] = useState<FilterType>('week')
  const [expenditureFilter, setExpenditureFilter] = useState<FilterType>('week')
  const [loyaltyFilter, setLoyaltyFilter] = useState<number>(10)

  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/dashboard-stats')
      setData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard statistics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axiosInstance.patch(`/api/admin/orders/${id}/status`, { status })
      toast.success(`Order ${status.toLowerCase()}ed`)
      fetchDashboardData()
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update order status')
    }
  }

  // Time Series Aggregator
  const processTimeSeries = (
    dataPoints: DataPoint[],
    filter: FilterType,
    valueKey: string = 'value',
  ) => {
    if (filter === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const map: Record<string, number> = {}
      days.forEach((d) => (map[d] = 0))

      dataPoints.forEach((item) => {
        const d = new Date(item.date)
        const dayName = days[d.getDay()]
        map[dayName] += (item[valueKey] as number) || 0
      })

      const ordered = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      return ordered.map((name) => ({ name, value: map[name] }))
    }

    if (filter === 'month') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      const map: Record<string, number> = {
        'Week 1': 0,
        'Week 2': 0,
        'Week 3': 0,
        'Week 4': 0,
      }

      dataPoints.forEach((item) => {
        const d = new Date(item.date)
        const day = d.getDate()
        if (day <= 7) map['Week 1'] += (item[valueKey] as number) || 0
        else if (day <= 14) map['Week 2'] += (item[valueKey] as number) || 0
        else if (day <= 21) map['Week 3'] += (item[valueKey] as number) || 0
        else map['Week 4'] += (item[valueKey] as number) || 0
      })

      return weeks.map((name) => ({ name, value: map[name] }))
    }

    if (filter === 'year') {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      const map: Record<string, number> = {}
      months.forEach((m) => (map[m] = 0))

      dataPoints.forEach((item) => {
        const d = new Date(item.date)
        const monthName = months[d.getMonth()]
        map[monthName] += (item[valueKey] as number) || 0
      })

      return months.map((name) => ({ name, value: map[name] }))
    }

    return []
  }


  const revenueChartData = useMemo(
    () =>
      processTimeSeries(
        data?.revenuePoints || [],
        revenueFilter,
        'total_amount',
      ),
    [data?.revenuePoints, revenueFilter],
  )

  const expenditureChartData = useMemo(
    () => processTimeSeries(data?.expenditurePoints || [], expenditureFilter),
    [data?.expenditurePoints, expenditureFilter],
  )

  const filteredLoyaltyData = useMemo(() => {
    if (!data?.loyaltyDistribution) return []
    return data.loyaltyDistribution.slice(0, loyaltyFilter)
  }, [data?.loyaltyDistribution, loyaltyFilter])

  const pendingQueue = useMemo(() => {
    if (!data) return []
    return data.pendingQueue
      .filter((item) => {
        const searchLower = queueSearch.toLowerCase()
        return (
          item.customerName.toLowerCase().includes(searchLower) ||
          (item.itemName && item.itemName.toLowerCase().includes(searchLower)) ||
          item.id.toLowerCase().includes(searchLower)
        )
      })
      .sort((a, b) => {
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
  }, [data, queueSearch, queueSort])

  if (isLoading || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-[1440px] space-y-8 px-4 pb-16 duration-500 lg:px-8">
      <header className="flex flex-col pt-6">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">
          Operations Dashboard
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Real-time overview of business metrics and workflow.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={data.totalRevenue}
          prefix="₱"
          trend={12}
          icon={TrendingUp}
          variant="dark"
        />
        <StatCard
          title="Total Expenditure"
          value={data.totalExpenditure}
          prefix="₱"
          trend={-8}
          icon={TrendingDown}
          variant="light"
        />
        <StatCard
          title="Active Orders"
          value={data.totalOrders}
          trend={5}
          icon={ShoppingCart}
          variant="emerald"
        />
        <StatCard
          title="Verified Customers"
          value={data.totalCustomers}
          icon={Users}
          variant="light"
        />
      </section>

      <div className="grid min-h-[800px] grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-6 lg:col-span-8 lg:gap-8">
          {/* Revenue Stream Section */}
          <div className="flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Revenue Stream Analysis
                </h3>
                <p className="mt-1 text-[10px] font-black tracking-[2px] text-blue-500 uppercase">
                  Cash Inflow Matrix
                </p>
              </div>
              <div className="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
                {(['week', 'month', 'year'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setRevenueFilter(f)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all',
                      revenueFilter === f
                        ? 'bg-slate-900 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-900',
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                    tickFormatter={(value) => `₱${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                    cursor={{
                      stroke: '#3b82f6',
                      strokeWidth: 1,
                      strokeDasharray: '3 3',
                    }}
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
          <div className="flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Expenditure Analysis
                </h3>
                <p className="mt-1 text-[10px] font-black tracking-[2px] text-rose-500 uppercase">
                  Operational Outflow Matrix
                </p>
              </div>
              <div className="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
                {(['week', 'month', 'year'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setExpenditureFilter(f)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all',
                      expenditureFilter === f
                        ? 'bg-rose-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-900',
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={expenditureChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorExpenditure"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
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
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                    tickFormatter={(value) => `₱${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                    cursor={{
                      stroke: '#e11d48',
                      strokeWidth: 1,
                      strokeDasharray: '3 3',
                    }}
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

          <div className="relative flex h-[700px] flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
            <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-[0.03]">
              <AlertCircle className="h-48 w-48 text-slate-900" />
            </div>

            <div className="relative z-10 mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                  Pending Operations Queue
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Review orders and screenplate requests
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
                    placeholder="Search queue..."
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    className="w-48 rounded-xl border border-slate-100 bg-slate-50 py-2.5 pr-4 pl-10 text-xs font-bold transition-all focus:ring-2 focus:ring-blue-500/20 focus:outline-none lg:w-64"
                  />
                </div>
                <div className="group relative">
                  <select
                    value={queueSort}
                    onChange={(e) =>
                      setQueueSort(
                        e.target.value as
                          | 'date-desc'
                          | 'date-asc'
                          | 'total-desc'
                          | 'total-asc'
                          | 'name-asc',
                      )
                    }
                    className="cursor-pointer appearance-none rounded-xl border border-slate-100 bg-slate-50 py-2.5 pr-8 pl-9 text-xs font-bold transition-colors hover:bg-slate-100 focus:outline-none"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="total-desc">Highest Price</option>
                    <option value="total-asc">Lowest Price</option>
                    <option value="name-asc">A-Z Name</option>
                  </select>
                  <Filter
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <ArrowUpDown
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
                    size={12}
                  />
                </div>
              </div>
            </div>

            <div className="custom-scrollbar relative z-10 flex-1 space-y-4 overflow-y-auto pr-2">
              {pendingQueue.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-100 bg-slate-50 py-24 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">
                    All pending payloads executed.
                  </p>
                </div>
              ) : (
                pendingQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 rounded-[20px] border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md md:flex-row md:items-center"
                  >
                    <div className="flex flex-col">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
                          {item.id}
                        </span>
                        <span
                          className={cn(
                            'tracing-widest rounded px-2 py-0.5 text-[9px] font-black uppercase',
                            item.type === 'Order'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-purple-50 text-purple-600',
                          )}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className="text-base font-bold text-slate-900">
                        {item.customerName}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-500">
                        <span className="font-bold text-slate-900">
                          ₱{item.total.toLocaleString()}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="text-slate-400 italic">
                          "{item.itemName}"
                        </span>
                        <span className="mx-2">•</span>
                        <span className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-600">
                          {item.status}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <PermissionWrapper
                        allowedRoles={['admin', 'inventory']}
                        hideIfNoAccess
                      >
                        <button
                          onClick={() => handleStatusUpdate(item.id, 'CANCELLED')}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <XCircle size={16} />
                          REJECT
                        </button>
                      </PermissionWrapper>

                      <PermissionWrapper
                        allowedRoles={['admin', 'inventory']}
                        hideIfNoAccess
                      >
                        <button
                          onClick={() => handleStatusUpdate(item.id, 'PROCESSING')}
                          className="flex items-center gap-2 rounded-xl border border-transparent bg-slate-900 px-6 py-3 text-xs font-bold text-[#75EEA5] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                        >
                          <CheckCircle2 size={16} />
                          CONFIRM
                        </button>
                      </PermissionWrapper>

                      {user.role === 'staff' && (
                        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          <Clock size={14} />
                          Awaiting Admin
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Loyalty Distribution Matrix
                </h3>
                <p className="mt-1 text-[10px] font-black tracking-[2px] text-blue-500 uppercase">
                  Customer volume Analysis
                </p>
              </div>
              <div className="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
                {([10, 20, 50] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setLoyaltyFilter(v)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all',
                      loyaltyFilter === v
                        ? 'bg-slate-900 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-900',
                    )}
                  >
                    Top {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredLoyaltyData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="transactions"
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  >
                    {filteredLoyaltyData.map((_, index) => (
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

        <div className="flex flex-col gap-6 lg:col-span-4 lg:gap-8">
          <div className="flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50">
            <h3 className="mb-8 text-lg font-bold text-slate-900">
              Order Status Distribution
            </h3>
            <div className="relative min-h-[220px]">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data.orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={6}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {data.orderStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-4">
              {data.orderStatusData.map((status) => (
                <div
                  key={status.name}
                  className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3.5 w-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="text-sm font-semibold text-slate-600">
                      {status.name}
                    </span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {status.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-1 flex-col overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Crown className="h-48 w-48 text-white" />
            </div>
            <div className="relative z-10 mb-8">
              <h3 className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-[4px] text-[#75EEA5] uppercase">
                <Crown size={18} />
                LOYALIST TIER 1
              </h3>
              <p className="text-sm font-medium text-slate-400">
                Exclusive VIP node distribution
              </p>
            </div>

            <div className="custom-scrollbar relative z-10 max-h-[440px] flex-1 space-y-4 overflow-y-auto pr-2">
              {data.topLoyalists.map((user, idx) => (
                <div
                  key={user.name}
                  className="group flex cursor-default flex-col justify-between gap-4 rounded-2xl border border-transparent p-4 transition-all hover:border-slate-800 hover:bg-white/5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-lg font-black shadow-lg transition-transform group-hover:scale-110',
                        idx === 0
                          ? 'bg-[#75EEA5] text-slate-900 shadow-[#75EEA5]/20'
                          : idx === 1
                            ? 'bg-slate-100 text-slate-800'
                            : idx === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-white/10 text-white/50',
                      )}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight text-white">
                        {user.name}
                      </p>
                      <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        {user.transactions} TOTAL ORDERS
                      </p>
                    </div>
                  </div>
                  <div className="px-16 sm:px-0 sm:text-right">
                    <p className="mb-1 text-[11px] font-bold tracking-widest text-slate-500 uppercase sm:hidden">
                      Spend
                    </p>
                    <p className="text-base font-black text-white">
                      ₱{user.spent.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white p-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Historical Registry
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Unified immutable payload record log
            </p>
          </div>
          <button className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-100">
            Download Audit
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-5 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Trace ID
                </th>
                <th className="px-8 py-5 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Customer Entity
                </th>
                <th className="px-8 py-5 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Status Node
                </th>
                <th className="px-8 py-5 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Timestamp
                </th>
                <th className="px-8 py-5 text-right text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Value Amount
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.recentOrders.slice(0, 15).map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-slate-50 transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-8 py-6 font-mono text-xs font-semibold text-slate-500">
                    {txn.id}
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900">
                      {txn.customerName}
                    </p>
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      {txn.type}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase',
                        txn.status === 'COMPLETED' || txn.status === 'DELIVERED' || txn.status === 'SHIPPED'
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
                      {txn.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-500">
                    {new Date(txn.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900">
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

export default GeneralDashboard
