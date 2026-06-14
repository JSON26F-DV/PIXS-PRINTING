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
  X,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import StatCard from '../../components/StatCard'
import { useAuth } from '../../context/AuthContext'
import { PermissionWrapper } from '../../components/guards/PermissionWrapper'
import axiosInstance from '../../lib/axiosInstance'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { m, AnimatePresence } from 'framer-motion'

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

const PENDING_PAGE_SIZE = 10
const LOYALIST_PAGE_SIZE = 5

const GeneralDashboard: React.FC = () => {
  const { user } = useAuth()
  const [queueSearch, setQueueSearch] = useState('')
  const [queueSort, setQueueSort] = useState<
    'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'name-asc'
  >('date-desc')
  const [revenueFilter, setRevenueFilter] = useState<FilterType>('week')
  const [expenditureFilter, setExpenditureFilter] = useState<FilterType>('week')
  const [loyaltyFilter, setLoyaltyFilter] = useState<number>(10)
  const [pendingPage, setPendingPage] = useState(1)
  const [loyalistPage, setLoyalistPage] = useState(1)
  const [mobileHistoricalModal, setMobileHistoricalModal] = useState<ItemBase | null>(null)
  const [showRevenueDrop, setShowRevenueDrop] = useState(false)
  const [showExpenditureDrop, setShowExpenditureDrop] = useState(false)
  const [showLoyaltyDrop, setShowLoyaltyDrop] = useState(false)
  const [showQueueSortDrop, setShowQueueSortDrop] = useState(false)

  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardData = async (signal?: AbortSignal) => {
    try {
      const response = await axiosInstance.get('/api/admin/dashboard-stats', { signal })
      setData(response.data)
    } catch (error) {
      if (axios.isCancel(error)) {
        return
      }
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard statistics')
    } finally {
      if (!signal || !signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchDashboardData(controller.signal)
    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    setPendingPage(1)
  }, [queueSearch, queueSort])

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

  const totalPendingPages = useMemo(() => {
    return Math.max(1, Math.ceil(pendingQueue.length / PENDING_PAGE_SIZE))
  }, [pendingQueue])

  const safePendingPage = useMemo(() => {
    return Math.min(pendingPage, totalPendingPages)
  }, [pendingPage, totalPendingPages])

  const paginatedPendingQueue = useMemo(() => {
    return pendingQueue.slice(
      (safePendingPage - 1) * PENDING_PAGE_SIZE,
      safePendingPage * PENDING_PAGE_SIZE,
    )
  }, [pendingQueue, safePendingPage])

  const totalLoyalistPages = useMemo(() => {
    if (!data?.topLoyalists) return 1
    return Math.max(1, Math.ceil(data.topLoyalists.length / LOYALIST_PAGE_SIZE))
  }, [data?.topLoyalists])

  const safeLoyalistPage = useMemo(() => {
    return Math.min(loyalistPage, totalLoyalistPages)
  }, [loyalistPage, totalLoyalistPages])

  const paginatedLoyalists = useMemo(() => {
    if (!data?.topLoyalists) return []
    return data.topLoyalists.slice(
      (safeLoyalistPage - 1) * LOYALIST_PAGE_SIZE,
      safeLoyalistPage * LOYALIST_PAGE_SIZE,
    )
  }, [data?.topLoyalists, safeLoyalistPage])

  if (isLoading || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-[1440px] space-y-8 px-4 pb-16 duration-500 lg:px-8">
      <header className="flex flex-col pt-4 md:pt-6">
        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
          <span className="hidden md:inline">Operations Dashboard</span>
          <span className="md:hidden">Dashboard</span>
        </h1>
        <p className="mt-0.5 md:mt-1 text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">
          <span className="hidden md:inline">Real-time overview of business metrics and workflow.</span>
          <span className="md:hidden">Ops Overview</span>
        </p>
      </header>

      <section className={cn(
        "grid grid-cols-2 gap-3 sm:gap-6",
        user?.role === 'admin' ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-2"
      )}>
        {user?.role === 'admin' && (
          <>
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
          </>
        )}
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
          {user?.role === 'admin' && (
            <>
              {/* Revenue Stream Section */}
              <div className="flex flex-col min-w-0 rounded-2xl lg:rounded-[32px] border border-slate-100 bg-white p-4 sm:p-8 shadow-lg shadow-slate-200/50">
                <div className="mb-6 sm:mb-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Revenue Stream Analysis
                    </h3>
                    <p className="mt-1 text-[10px] font-black tracking-[2px] text-blue-500 uppercase">
                      Cash Inflow Matrix
                    </p>
                  </div>
                  {/* Desktop segmented filters */}
                  <div className="hidden sm:flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
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

                  {/* Mobile icon filter */}
                  <div className="sm:hidden relative">
                    <button
                      onClick={() => setShowRevenueDrop(!showRevenueDrop)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                      title="Filter Timeframe"
                    >
                      <Filter size={14} className="text-slate-600" />
                    </button>
                    {showRevenueDrop && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowRevenueDrop(false)} />
                        <div className="absolute right-0 mt-2 w-32 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl z-[999] animate-in fade-in slide-in-from-top-2 duration-200">
                          {(['week', 'month', 'year'] as const).map((f) => (
                            <button
                              key={f}
                              onClick={() => {
                                setRevenueFilter(f)
                                setShowRevenueDrop(false)
                              }}
                              className={cn(
                                'w-full rounded-lg px-3 py-2 text-left text-[10px] font-black tracking-widest uppercase transition-all',
                                revenueFilter === f
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                              )}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-[220px] sm:h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e293b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
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
                          stroke: '#0f172a',
                          strokeWidth: 1,
                          strokeDasharray: '3 3',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#0f172a"
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
              <div className="flex flex-col min-w-0 rounded-2xl lg:rounded-[32px] border border-slate-100 bg-white p-4 sm:p-8 shadow-lg shadow-slate-200/50">
                <div className="mb-6 sm:mb-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Expenditure Analysis
                    </h3>
                    <p className="mt-1 text-[10px] font-black tracking-[2px] text-rose-500 uppercase">
                      Operational Outflow Matrix
                    </p>
                  </div>
                  {/* Desktop segmented filters */}
                  <div className="hidden sm:flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
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

                  {/* Mobile icon filter */}
                  <div className="sm:hidden relative">
                    <button
                      onClick={() => setShowExpenditureDrop(!showExpenditureDrop)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                      title="Filter Timeframe"
                    >
                      <Filter size={14} className="text-slate-600" />
                    </button>
                    {showExpenditureDrop && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowExpenditureDrop(false)} />
                        <div className="absolute right-0 mt-2 w-32 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl z-[999] animate-in fade-in slide-in-from-top-2 duration-200">
                          {(['week', 'month', 'year'] as const).map((f) => (
                            <button
                              key={f}
                              onClick={() => {
                                setExpenditureFilter(f)
                                setShowExpenditureDrop(false)
                              }}
                              className={cn(
                                'w-full rounded-lg px-3 py-2 text-left text-[10px] font-black tracking-widest uppercase transition-all',
                                expenditureFilter === f
                                  ? 'bg-rose-600 text-white'
                                  : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600',
                              )}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-[220px] sm:h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={expenditureChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
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
            </>
          )}

          <div className="relative flex h-[700px] flex-col overflow-hidden min-w-0 rounded-2xl lg:rounded-[32px] border border-slate-100 bg-white p-4 sm:p-8 shadow-lg shadow-slate-200/50">
            <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-[0.03]">
              <AlertCircle className="h-48 w-48 text-slate-900" />
            </div>

            <div className="relative z-10 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                  Pending Operations Queue
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">
                  Review and manage active orders
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Search queue..."
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    className="w-full sm:w-48 rounded-xl border border-slate-100 bg-slate-50 py-2 pr-3 pl-9 text-xs font-bold transition-all focus:ring-2 focus:ring-blue-500/20 focus:outline-none lg:w-64"
                  />
                </div>
                
                {/* Desktop Sort Select */}
                <div className="hidden sm:block group relative">
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
                    className="cursor-pointer appearance-none rounded-xl border border-slate-100 bg-slate-50 py-2 pr-8 pl-9 text-xs font-bold transition-colors hover:bg-slate-100 focus:outline-none"
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

                {/* Mobile Sort Icon Only Dropdown */}
                <div className="sm:hidden relative">
                  <button
                    onClick={() => setShowQueueSortDrop(!showQueueSortDrop)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                    title="Sort Queue"
                  >
                    <ArrowUpDown size={14} className="text-slate-600" />
                  </button>
                  {showQueueSortDrop && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowQueueSortDrop(false)} />
                      <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl z-[999] animate-in fade-in slide-in-from-top-2 duration-200">
                        {([
                          { value: 'date-desc', label: 'Newest First' },
                          { value: 'date-asc', label: 'Oldest First' },
                          { value: 'total-desc', label: 'Highest Price' },
                          { value: 'total-asc', label: 'Lowest Price' },
                          { value: 'name-asc', label: 'A-Z Name' },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setQueueSort(opt.value)
                              setShowQueueSortDrop(false)
                            }}
                            className={cn(
                              'w-full rounded-lg px-3 py-2 text-left text-[10px] font-black tracking-widest uppercase transition-all',
                              queueSort === opt.value
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950',
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="custom-scrollbar relative z-10 flex-1 space-y-4 overflow-y-auto pr-2">
              {paginatedPendingQueue.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-100 bg-slate-50 py-24 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">
                    All pending payloads executed.
                  </p>
                </div>
              ) : (
                paginatedPendingQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 rounded-[20px] border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md md:flex-row md:items-center"
                  >
                    {/* Desktop Layout Details */}
                    <div className="hidden md:flex flex-col">
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

                    {/* Mobile Layout Details (flex-column data, badge on right) */}
                    <div className="flex md:hidden flex-col gap-3 w-full">
                      {/* Top Row: ID & Type on left, Status Badge on right */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
                            {item.id}
                          </span>
                          <span
                            className={cn(
                              'tracking-widest rounded px-2 py-0.5 text-[9px] font-black uppercase',
                              item.type === 'Order'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-purple-50 text-purple-600',
                            )}
                          >
                            {item.type}
                          </span>
                        </div>
                        <span className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-600 tracking-wider">
                          {item.status}
                        </span>
                      </div>

                      {/* Flex Column Data */}
                      <div className="flex flex-col gap-1">
                        <p className="text-base font-bold text-slate-900">
                          {item.customerName}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 italic">
                          "{item.itemName}"
                        </p>
                        <p className="text-sm font-black text-slate-950 mt-1">
                          ₱{item.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-end md:justify-start gap-2">
                      <PermissionWrapper
                        allowedRoles={['admin']}
                        hideIfNoAccess
                      >
                        <button
                          onClick={() => handleStatusUpdate(item.id, 'CANCELLED')}
                          className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 sm:px-5 sm:py-3 text-xs font-bold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 gap-2"
                          title="Reject"
                        >
                          <XCircle size={16} />
                          <span className="hidden sm:inline">REJECT</span>
                        </button>
                      </PermissionWrapper>

                      <PermissionWrapper
                        allowedRoles={['admin']}
                        hideIfNoAccess
                      >
                        <button
                          onClick={() => handleStatusUpdate(item.id, 'PROCESSING')}
                          className="flex items-center justify-center rounded-xl border border-transparent bg-slate-900 p-3 sm:px-6 sm:py-3 text-xs font-bold text-[#75EEA5] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-800 gap-2"
                          title="Confirm"
                        >
                          <CheckCircle2 size={16} />
                          <span className="hidden sm:inline">CONFIRM</span>
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

            {/* Pending operations pagination — Always visible */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 relative z-10">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Page {safePendingPage} of {totalPendingPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPendingPage(Math.max(1, safePendingPage - 1))}
                  disabled={safePendingPage <= 1}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPendingPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setPendingPage(page)}
                    className={cn(
                      "min-w-[28px] rounded-lg px-2 py-1 text-[10px] font-black tracking-widest uppercase transition-all",
                      safePendingPage === page
                        ? "bg-slate-900 text-white shadow-lg"
                        : "border border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setPendingPage(Math.min(totalPendingPages, safePendingPage + 1))}
                  disabled={safePendingPage >= totalPendingPages}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col min-w-0 rounded-2xl lg:rounded-[32px] border border-slate-100 bg-white p-4 sm:p-8 shadow-lg shadow-slate-200/50">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Loyalty Distribution Matrix
                </h3>
                <p className="mt-1 text-[10px] font-black tracking-[2px] text-blue-500 uppercase">
                  Customer volume Analysis
                </p>
              </div>
              {/* Desktop segmented filters */}
              <div className="hidden sm:flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
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

              {/* Mobile icon filter */}
              <div className="sm:hidden relative">
                <button
                  onClick={() => setShowLoyaltyDrop(!showLoyaltyDrop)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                  title="Filter Count"
                >
                  <Filter size={14} className="text-slate-600" />
                </button>
                {showLoyaltyDrop && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLoyaltyDrop(false)} />
                    <div className="absolute right-0 mt-2 w-32 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl z-[999] animate-in fade-in slide-in-from-top-2 duration-200">
                      {([10, 20, 50] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            setLoyaltyFilter(v)
                            setShowLoyaltyDrop(false)
                          }}
                          className={cn(
                            'w-full rounded-lg px-3 py-2 text-left text-[10px] font-black tracking-widest uppercase transition-all',
                            loyaltyFilter === v
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                          )}
                        >
                          Top {v}
                        </button>
                      ))}
                    </div>
                  </>
                )}
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
          <div className="flex flex-col min-w-0 rounded-2xl lg:rounded-[32px] border border-slate-100 bg-white p-4 sm:p-8 shadow-lg shadow-slate-200/50">
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

          <div className="relative flex flex-1 flex-col overflow-hidden min-w-0 rounded-2xl lg:rounded-[32px] border border-slate-800 bg-slate-900 p-4 sm:p-8 shadow-2xl">
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
              {paginatedLoyalists.map((user, idx) => {
                const rankIndex = (safeLoyalistPage - 1) * LOYALIST_PAGE_SIZE + idx
                const rank = rankIndex + 1
                return (
                  <div
                    key={user.name}
                    className="group flex cursor-default flex-col justify-between gap-4 rounded-2xl border border-transparent p-4 transition-all hover:border-slate-800 hover:bg-white/5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-lg font-black shadow-lg transition-transform group-hover:scale-110',
                          rankIndex === 0
                            ? 'bg-[#75EEA5] text-slate-900 shadow-[#75EEA5]/20'
                            : rankIndex === 1
                              ? 'bg-slate-100 text-slate-800'
                              : rankIndex === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-white/10 text-white/50',
                        )}
                      >
                        {rank}
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
                )
              })}
            </div>

            {/* Loyalist Pagination — Always visible */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-850 pt-4 relative z-10">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Page {safeLoyalistPage} of {totalLoyalistPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLoyalistPage(Math.max(1, safeLoyalistPage - 1))}
                  disabled={safeLoyalistPage <= 1}
                  className="rounded-xl border border-slate-850 bg-white/5 p-2 text-slate-400 transition-all hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalLoyalistPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setLoyalistPage(page)}
                    className={cn(
                      "min-w-[28px] rounded-lg px-2 py-1 text-[10px] font-black tracking-widest uppercase transition-all",
                      safeLoyalistPage === page
                        ? "bg-[#75EEA5] text-slate-900 shadow-lg"
                        : "border border-slate-850 bg-white/5 text-slate-400 hover:text-white"
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setLoyalistPage(Math.min(totalLoyalistPages, safeLoyalistPage + 1))}
                  disabled={safeLoyalistPage >= totalLoyalistPages}
                  className="rounded-xl border border-slate-850 bg-white/5 p-2 text-slate-400 transition-all hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 overflow-hidden min-w-0 rounded-2xl lg:rounded-[32px] border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-white p-4 sm:p-6 lg:p-8">
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
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
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
              {data.recentOrders.slice(0, 10).map((txn) => (
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

        {/* Mobile Cards View */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {data.recentOrders.slice(0, 10).map((txn) => (
            <div
              key={txn.id}
              onClick={() => setMobileHistoricalModal(txn)}
              className="p-5 cursor-pointer hover:bg-slate-50/85 active:bg-slate-100/85 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-900 leading-snug">
                    {txn.customerName}
                  </p>
                  <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                    {txn.type}
                  </p>
                </div>
                <p className="font-black text-slate-900 text-base">
                  ₱{txn.total.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                    txn.status === 'COMPLETED' || txn.status === 'DELIVERED' || txn.status === 'SHIPPED'
                      ? 'border-emerald-100 bg-emerald-50/60 text-emerald-600'
                      : txn.status === 'PENDING'
                        ? 'border-amber-100 bg-amber-50/60 text-amber-600'
                        : txn.status === 'PROCESSING'
                          ? 'border-blue-100 bg-blue-50/60 text-blue-600'
                          : txn.status === 'CANCELLED'
                            ? 'border-rose-100 bg-rose-50/60 text-rose-600'
                            : 'border-slate-100 bg-slate-50 text-slate-500',
                  )}
                >
                  {txn.status || 'UNKNOWN'}
                </span>

                <div className="text-right">
                  <p className="text-[10px] font-medium text-slate-400">
                    {new Date(txn.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="font-mono text-[9px] font-semibold text-slate-400/80 mt-0.5">
                    {txn.id}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile Historical Registry Modal (Bottom Sheet) */}
      <AnimatePresence>
        {mobileHistoricalModal && (
          <div className="fixed inset-0 z-[150] flex items-end justify-center lg:hidden">
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileHistoricalModal(null)}
            />
            {/* Bottom Sheet Drawer */}
            <m.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[85vh] overflow-hidden rounded-t-[32px] bg-white shadow-2xl flex flex-col z-10 border-t border-slate-100"
            >
              {/* Drag Handle Indicator */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 rounded-full bg-slate-200" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase italic">
                    Audit Log Details
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">
                    Trace ID: {mobileHistoricalModal.id}
                  </p>
                </div>
                <button
                  onClick={() => setMobileHistoricalModal(null)}
                  className="rounded-full bg-slate-100 p-2 text-slate-400 transition-colors hover:bg-slate-200 active:bg-slate-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Customer Entity</span>
                    <span className="text-sm font-bold text-slate-900 block mt-1">
                      {mobileHistoricalModal.customerName}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Transaction Type</span>
                    <span className="text-sm font-bold text-slate-900 block mt-1">
                      {mobileHistoricalModal.type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Value Amount</span>
                    <span className="text-lg font-black text-slate-900 block mt-0.5">
                      ₱{mobileHistoricalModal.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Status Node</span>
                    <div className="mt-1">
                      <span
                        className={cn(
                          'inline-block rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
                          mobileHistoricalModal.status === 'COMPLETED' || mobileHistoricalModal.status === 'DELIVERED' || mobileHistoricalModal.status === 'SHIPPED'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                            : mobileHistoricalModal.status === 'PENDING'
                              ? 'border-amber-100 bg-amber-50 text-amber-600'
                              : mobileHistoricalModal.status === 'PROCESSING'
                                ? 'border-blue-100 bg-blue-50 text-blue-600'
                                : mobileHistoricalModal.status === 'CANCELLED'
                                  ? 'border-rose-100 bg-rose-50 text-rose-600'
                                  : 'border-slate-100 bg-slate-50 text-slate-500',
                        )}
                      >
                        {mobileHistoricalModal.status || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Item Details / Scope</span>
                  <span className="text-sm font-semibold text-slate-700 block mt-1">
                    {mobileHistoricalModal.itemName || 'No item description available'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Timestamp</span>
                  <span className="text-sm font-semibold text-slate-700 block mt-1">
                    {new Date(mobileHistoricalModal.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })} at {new Date(mobileHistoricalModal.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Action / Dismiss Button */}
              <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex gap-3">
                <button
                  onClick={() => setMobileHistoricalModal(null)}
                  className="w-full rounded-2xl bg-slate-900 py-4 text-xs font-black tracking-widest text-white uppercase italic transition-all hover:bg-slate-800 active:scale-[0.98]"
                >
                  Close Registry Details
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GeneralDashboard
