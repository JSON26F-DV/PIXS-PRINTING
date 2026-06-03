import React, { useState, useMemo, useEffect } from 'react'
import {
  Clock,
  TrendingUp,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Landmark,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  format,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  parseISO,
  isWithinInterval,
} from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../lib/axiosInstance'

interface AttendanceLog {
  id: number
  date: string
  status: string
  holiday_type: string
  is_paid: boolean | number
  start_time: string | null
  end_time: string | null
  break_start: string | null
  break_end: string | null
  overtime: number
  late: number
  total_earnings: number
  total_amount?: number
  holiday_pay: number
  hours_worked: number
}

const COLORS = [
  '#75EEA5',
  '#7C3AED',
  '#3B82F6',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#6366F1',
]

type ViewMode = 'weekly' | 'monthly'

const PAGE_SIZE = 7

const Attendance: React.FC = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [tablePage, setTablePage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null)

  useEffect(() => {
    let mounted = true
    axiosInstance
      .get('/api/admin/payroll/my-attendance')
      .then((res) => {
        if (!mounted) return
        setLogs(res.data?.attendance || [])
      })
      .catch(() => {
        if (mounted) setLogs([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const allRecords = useMemo(() => {
    return logs.map((log) => ({
      ...log,
      total_amount: log.total_earnings,
    }))
  }, [logs])

  const filteredRecords = useMemo(() => {
    if (viewMode === 'weekly') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return allRecords.filter((r) =>
        isWithinInterval(parseISO(r.date), { start, end }),
      )
    } else {
      return allRecords.filter((r) =>
        isSameMonth(parseISO(r.date), currentDate),
      )
    }
  }, [allRecords, viewMode, currentDate])

  const summary = useMemo(() => {
    const totalFiscalYield = filteredRecords
      .filter((r) => r.is_paid === true || Number(r.is_paid) === 1)
      .reduce((sum, r) => sum + (r.total_amount ?? r.total_earnings), 0)

    const totalHoursWorked = filteredRecords.reduce(
      (sum, r) => sum + (r.hours_worked ?? 0),
      0,
    )

    const presentCount = filteredRecords.filter(
      (r) => r.status !== 'absent' && r.status !== 'holiday',
    ).length

    const absentCount = filteredRecords.filter(
      (r) => r.status === 'absent',
    ).length

    return { totalFiscalYield, totalHoursWorked, presentCount, absentCount }
  }, [filteredRecords])

  const chartData = useMemo(() => {
    if (viewMode === 'weekly') {
      return filteredRecords.map((r) => ({
        name: format(parseISO(r.date), 'EEE'),
        value: r.total_amount ?? r.total_earnings,
        status: r.status,
      }))
    } else {
      const weeks: Record<string, number> = {}
      filteredRecords.forEach((r) => {
        const weekKey = `Week ${Math.ceil(parseISO(r.date).getDate() / 7)}`
        weeks[weekKey] = (weeks[weekKey] || 0) + (r.total_amount ?? r.total_earnings)
      })
      return Object.entries(weeks).map(([name, value]) => ({ name, value }))
    }
  }, [filteredRecords, viewMode])

  const statusPieData = useMemo(() => {
    const stats: Record<string, number> = {}
    filteredRecords.forEach((r) => {
      const key = r.status || 'unknown'
      stats[key] = (stats[key] || 0) + 1
    })

    const colorsMap: Record<string, string> = {
      full: '#75EEA5',
      present: '#75EEA5',
      half: '#F59E0B',
      pending: '#94A3B8',
      absent: '#EF4444',
      holiday: '#3B82F6',
    }

    return Object.entries(stats).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
      color: colorsMap[name.toLowerCase()] || '#6366F1',
    }))
  }, [filteredRecords])

  const temporalAttendancePct = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const todayLog = logs.find((r) => r.date === todayStr)
    if (!todayLog || !todayLog.start_time) return 0

    const now = new Date()
    const [sh, sm] = todayLog.start_time.split(':').map(Number)
    const startTime = new Date(now)
    startTime.setHours(sh, sm, 0, 0)

    let endTime = now
    if (todayLog.end_time) {
      const [eh, em] = todayLog.end_time.split(':').map(Number)
      endTime = new Date(now)
      endTime.setHours(eh, em, 0, 0)
    }

    if (endTime < startTime) return 0
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const pct = (diffHours / 8) * 100
    return Math.min(100, Math.max(0, Math.round(pct)))
  }, [logs])

  const handlePrev = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'weekly') newDate.setDate(newDate.getDate() - 7)
    else newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'weekly') newDate.setDate(newDate.getDate() + 7)
    else newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const totalPages = Math.max(1, Math.ceil(allRecords.length / PAGE_SIZE))
  const safePage = Math.min(tablePage, totalPages)
  const paginatedLogs = allRecords.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const statusBadge = (status: string, holidayType: string) => {
    if (holidayType !== 'none') {
      return (
        <span className="inline-flex rounded bg-rose-100 px-2 py-1 text-[9px] font-black uppercase text-rose-600">
          Holiday
        </span>
      )
    }
    switch (status) {
      case 'full':
      case 'present':
        return (
          <span className="inline-flex rounded bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-emerald-600">
            Present
          </span>
        )
      case 'half':
        return (
          <span className="inline-flex rounded bg-amber-100 px-2 py-1 text-[9px] font-black uppercase text-amber-600">
            Half
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex rounded bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-600">
            Pending
          </span>
        )
      default:
        return (
          <span className="inline-flex rounded bg-rose-100 px-2 py-1 text-[9px] font-black uppercase text-rose-600">
            Absent
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-slate-400">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="attendance-wrapper min-h-screen bg-[#F8FAFC] pb-24">
      <div className="attendance-page animate-in fade-in mx-auto max-w-[1700px] space-y-10 px-6 pt-12 duration-700 lg:px-12">
        {/* HEADER */}
        <header className="attendance-header flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
              My Attendance & Salary
            </h1>
            <p className="mt-2 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
              View your work records and salary summary &bull; Node {user?.id}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2 rounded-[24px] border border-slate-100 bg-white p-2 shadow-sm">
              <button
                onClick={handlePrev}
                className="rounded-2xl p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-xs font-black tracking-widest uppercase text-slate-600">
                {viewMode === 'weekly' ? (
                  <>
                    {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd')} -{' '}
                    {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                  </>
                ) : (
                  format(currentDate, 'MMMM yyyy')
                )}
              </span>
              <button
                onClick={handleNext}
                className="rounded-2xl p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 rounded-[24px] border border-slate-100 bg-white p-2 shadow-sm">
              {(['weekly', 'monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`attendance-view-toggle rounded-2xl px-6 py-3 text-[10px] font-black tracking-widest uppercase transition-all ${viewMode === mode ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* SALARY DASHBOARD */}
        <section className="attendance-salary-dashboard grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="attendance-summary-cards group relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-slate-900 p-4 sm:p-6 md:p-8 text-white shadow-2xl">
            <div className="absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-110">
              <Landmark className="h-10 w-10 sm:h-16 sm:w-16 md:h-20 md:w-20" />
            </div>
            <p className="mb-2 text-[8px] sm:text-[10px] font-black tracking-[2px] sm:tracking-[3px] uppercase opacity-60">
              Total Fiscal Yield
            </p>
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter text-[#75EEA5] italic">
              ₱{summary.totalFiscalYield.toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#75EEA5]" />
              <span className="text-[8px] sm:text-[10px] font-bold tracking-widest text-white/50 uppercase">
                Verified Payout
              </span>
            </div>
          </div>

          <div className="attendance-summary-cards group relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-slate-100 bg-white p-4 sm:p-6 md:p-8 shadow-lg shadow-slate-200/40">
            <p className="mb-2 text-[8px] sm:text-[10px] font-black tracking-[2px] sm:tracking-[3px] text-slate-400 uppercase">
              Overtime Credits
            </p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-slate-900 italic">
              {summary.totalHoursWorked}h{' '}
              <span className="text-[10px] font-bold text-blue-500 uppercase block sm:inline">
                Tracked
              </span>
            </h3>
            <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5">
              <Clock className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16" />
            </div>
          </div>

          <div className="attendance-summary-cards group relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-slate-100 bg-white p-4 sm:p-6 md:p-8 shadow-lg shadow-slate-200/40">
            <p className="mb-2 text-[8px] sm:text-[10px] font-black tracking-[2px] sm:tracking-[3px] text-slate-400 uppercase">
              Temporal Attendance
            </p>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-slate-900">
                {temporalAttendancePct}%
              </h3>
              <span className="text-[8px] sm:text-[10px] font-bold text-emerald-500 uppercase">
                Active Cycle
              </span>
            </div>
            <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5">
              <CalendarCheck className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16" />
            </div>
          </div>

          <div className="attendance-summary-cards group relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-slate-100 bg-white p-4 sm:p-6 md:p-8 shadow-lg shadow-slate-200/40">
            <p className="mb-2 text-[8px] sm:text-[10px] font-black tracking-[2px] sm:tracking-[3px] text-slate-400 uppercase">
              Risk Factor / Absence
            </p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-rose-500 italic">
              {summary.absentCount} Days
            </h3>
            <p className="mt-1 text-[8px] sm:text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              Non-Fiscal
            </p>
          </div>
        </section>

        {/* ANALYTICS GRAPHS */}
        <section className="attendance-graph grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="group relative min-h-[400px] overflow-hidden rounded-[40px] border border-slate-100 bg-white p-8 shadow-xl">
            <div className="relative z-10 mb-10 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-[#75EEA5]">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tighter text-slate-900 uppercase">
                  Personal Fiscal Stream
                </h3>
                <p className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                  Salary Accumulation Flux
                </p>
              </div>
            </div>
            <div className="relative z-10 h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9', radius: 10 }}
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      fontWeight: 'bold',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 8, 8]}
                    animationDuration={1500}
                    barSize={32}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="group relative min-h-[400px] overflow-hidden rounded-[40px] bg-slate-900 p-8 shadow-2xl">
            <div className="relative z-10 mb-10 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#75EEA5]/10 text-[#75EEA5]">
                <PieIcon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tighter text-white uppercase">
                  Status Distribution
                </h3>
                <p className="text-[10px] font-black tracking-[2px] text-slate-500 uppercase">
                  Presence Capability Matrix
                </p>
              </div>
            </div>
            <div className="relative z-10 h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      fontWeight: 'bold',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* REGISTER HISTORY TABLE */}
        <section className="overflow-hidden rounded-[44px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 min-h-[76px]">
            <h3 className="text-xs font-black tracking-widest text-slate-900 uppercase">
              Register History
            </h3>
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {allRecords.length} record{allRecords.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Desktop Table View — Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Start</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">End</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Break Start</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Break End</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">OT / Late</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Paid</th>
                  <th className="px-6 py-4 text-[10px] text-right font-black tracking-widest text-slate-400 uppercase">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                        {format(parseISO(log.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                        {log.start_time || '--:--'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                        {log.end_time || '--:--'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                        {log.break_start || '--:--'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                        {log.break_end || '--:--'}
                      </td>
                      <td className="px-6 py-4">
                        {statusBadge(log.status, log.holiday_type)}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {log.overtime > 0 && <span className="text-blue-500">{log.overtime}h OT </span>}
                        {log.late > 0 && <span className="text-rose-400">{log.late}m Late</span>}
                        {log.overtime === 0 && log.late === 0 && '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">
                        {log.is_paid ? (
                          <span className="text-emerald-500">Yes</span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm font-black text-slate-900">
                        ₱{(log.total_amount ?? log.total_earnings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm font-bold">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View — Visible only on Mobile */}
          <div className="block md:hidden divide-y divide-slate-100">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="flex items-center justify-between p-5 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="font-mono text-xs font-bold text-slate-900">
                      {format(parseISO(log.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {statusBadge(log.status, log.holiday_type)}
                      {log.overtime > 0 && (
                        <span className="inline-flex rounded bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-600">
                          +{log.overtime}h OT
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-mono text-sm font-black text-slate-900">
                      ₱{(log.total_amount ?? log.total_earnings).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[9px] font-black tracking-widest text-[#75EEA5] uppercase italic">
                      View Details &bull;
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-slate-400 text-sm font-bold">
                No attendance records found.
              </div>
            )}
          </div>

          {/* PAGINATION — always visible */}
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTablePage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setTablePage(page)}
                  className={`min-w-[36px] rounded-xl px-3 py-2 text-[11px] font-black tracking-widest uppercase transition-all ${
                    safePage === page
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'border border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setTablePage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER ATTESTATION */}
        <footer className="group relative flex flex-col items-center justify-between overflow-hidden rounded-[40px] bg-slate-900 p-10 text-white md:flex-row">
          <div className="pointer-events-none absolute top-0 right-0 p-12 opacity-5">
            <CalendarCheck size={120} />
          </div>
          <div>
            <h4 className="text-xl font-black tracking-tighter uppercase italic">
              Personnel Fiscal Attestation
            </h4>
            <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-500 uppercase opacity-70">
              Unified Data Node Persistence Verified
            </p>
          </div>
          <div className="mt-8 flex gap-4 md:mt-0">
            <button className="rounded-2xl bg-[#75EEA5] px-10 py-5 text-[11px] font-black tracking-[3px] text-slate-900 uppercase italic shadow-xl shadow-[#75EEA5]/20 transition-all hover:scale-105 active:scale-95">
              Download Audit Log
            </button>
          </div>
        </footer>
        {/* Details Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
              className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-black tracking-tight uppercase italic">
                    Attendance Details
                  </h4>
                  <p className="text-[9px] font-bold tracking-widest text-[#75EEA5] uppercase">
                    {format(parseISO(selectedLog.date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    <div className="mt-1">{statusBadge(selectedLog.status, selectedLog.holiday_type)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Earned Amount</span>
                    <div className="font-mono text-base font-black text-slate-900 mt-0.5">
                      ₱{(selectedLog.total_amount ?? selectedLog.total_earnings).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start Time</span>
                    <span className="font-mono text-sm font-bold text-slate-700">{selectedLog.start_time || '--:--'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End Time</span>
                    <span className="font-mono text-sm font-bold text-slate-700">{selectedLog.end_time || '--:--'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Break Start</span>
                    <span className="font-mono text-sm font-bold text-slate-700">{selectedLog.break_start || '--:--'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Break End</span>
                    <span className="font-mono text-sm font-bold text-slate-700">{selectedLog.break_end || '--:--'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hours Worked</span>
                    <span className="text-sm font-bold text-slate-700">{selectedLog.hours_worked ?? 0}h</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overtime</span>
                    <span className="text-sm font-bold text-slate-700">{selectedLog.overtime > 0 ? `${selectedLog.overtime}h` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Late Minutes</span>
                    <span className="text-sm font-bold text-slate-700">{selectedLog.late > 0 ? `${selectedLog.late}m` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid Status</span>
                    <span className={`text-sm font-bold ${selectedLog.is_paid ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {selectedLog.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>

                {selectedLog.holiday_type !== 'none' && (
                  <div className="mt-2 rounded-2xl bg-rose-50 p-4 border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Holiday Pay</span>
                    <span className="font-mono text-sm font-black text-rose-700">
                      ₱{selectedLog.holiday_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-black tracking-widest text-white uppercase hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Attendance
