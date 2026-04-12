import React, { useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Coffee,
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
  isSameYear,
  parseISO,
  isWithinInterval,
} from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import initialSalaryData from '../../data/salary.json'

// --- TYPES ---
interface AttendanceRecord {
  date: string
  status: 'full' | 'half' | 'absent'
  overtime_hours: number
  computed_salary: number
  is_holiday?: boolean
}

interface WeeklySalaryData {
  employee_id: string
  week_start: string
  attendance: AttendanceRecord[]
  weekly_total: number
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

type ViewMode = 'weekly' | 'monthly' | 'yearly'

const Attendance: React.FC = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [currentDate, setCurrentDate] = useState(new Date('2026-04-01')) // Simulation base date

  // --- DATA LOADING & FILTERING ---
  const myData = useMemo(() => {
    return (initialSalaryData as WeeklySalaryData[]).filter(
      (s) => s.employee_id === user?.id,
    )
  }, [user?.id])

  const allRecords = useMemo(() => {
    return myData.flatMap((week) => week.attendance)
  }, [myData])

  // --- DERIVED ANALYTICS ---
  const filteredRecords = useMemo(() => {
    if (viewMode === 'weekly') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return allRecords.filter((r) =>
        isWithinInterval(parseISO(r.date), { start, end }),
      )
    } else if (viewMode === 'monthly') {
      return allRecords.filter((r) =>
        isSameMonth(parseISO(r.date), currentDate),
      )
    } else {
      return allRecords.filter((r) => isSameYear(parseISO(r.date), currentDate))
    }
  }, [allRecords, viewMode, currentDate])

  const summary = useMemo(() => {
    const totalSalary = filteredRecords.reduce(
      (sum, r) => sum + r.computed_salary,
      0,
    )
    const totalOT = filteredRecords.reduce(
      (sum, r) => sum + r.overtime_hours,
      0,
    )
    const presentCount = filteredRecords.filter(
      (r) => r.status !== 'absent',
    ).length
    const absentCount = filteredRecords.filter(
      (r) => r.status === 'absent',
    ).length

    return {
      totalSalary,
      totalOT,
      presentCount,
      absentCount,
    }
  }, [filteredRecords])

  // --- CHART DATA PREP ---
  const chartData = useMemo(() => {
    if (viewMode === 'weekly') {
      return filteredRecords.map((r) => ({
        name: format(parseISO(r.date), 'EEE'),
        value: r.computed_salary,
        status: r.status,
      }))
    } else if (viewMode === 'monthly') {
      // Group by weeks for month view
      const weeks: Record<string, number> = {}
      filteredRecords.forEach((r) => {
        const weekKey = `Week ${Math.ceil(parseISO(r.date).getDate() / 7)}`
        weeks[weekKey] = (weeks[weekKey] || 0) + r.computed_salary
      })
      return Object.entries(weeks).map(([name, value]) => ({ name, value }))
    } else {
      // Group by months for year view
      const months: Record<string, number> = {}
      filteredRecords.forEach((r) => {
        const monthKey = format(parseISO(r.date), 'MMM')
        months[monthKey] = (months[monthKey] || 0) + r.computed_salary
      })
      // Ensure all months are listed even if zero
      const monthNames = [
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
      return monthNames.map((m) => ({ name: m, value: months[m] || 0 }))
    }
  }, [filteredRecords, viewMode])

  const statusPieData = useMemo(() => {
    const stats: Record<string, number> = {}
    filteredRecords.forEach((r) => {
      stats[r.status] = (stats[r.status] || 0) + 1
    })
    return Object.entries(stats).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
      color:
        name === 'full' ? '#75EEA5' : name === 'half' ? '#F59E0B' : '#EF4444',
    }))
  }, [filteredRecords])

  // --- HELPERS ---
  const handlePrev = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'weekly') newDate.setDate(newDate.getDate() - 7)
    else if (viewMode === 'monthly') newDate.setMonth(newDate.getMonth() - 1)
    else newDate.setFullYear(newDate.getFullYear() - 1)
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'weekly') newDate.setDate(newDate.getDate() + 7)
    else if (viewMode === 'monthly') newDate.setMonth(newDate.getMonth() + 1)
    else newDate.setFullYear(newDate.getFullYear() + 1)
    setCurrentDate(newDate)
  }

  return (
    <div className="attendance-wrapper min-h-screen bg-[#F8FAFC] pb-24">
      <div className="attendance-page animate-in fade-in mx-auto max-w-[1700px] space-y-10 px-6 pt-12 duration-700 lg:px-12">
        {/* 🚀 HEADER SECTION */}
        <header className="attendance-header flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
              My Attendance & Salary
            </h1>
            <p className="mt-2 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
              View your work records and salary summary • Node {user?.id}
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-[24px] border border-slate-100 bg-white p-2 shadow-sm">
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
        </header>

        {/* 📊 SALARY DASHBOARD (Summary Cards) */}
        <section className="attendance-salary-dashboard grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="attendance-summary-cards group relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-110">
              <Landmark size={80} />
            </div>
            <p className="mb-2 text-[10px] font-black tracking-[3px] uppercase opacity-60">
              Total Fiscal Yield
            </p>
            <h3 className="text-4xl font-black tracking-tighter text-[#75EEA5] italic">
              ₱{summary.totalSalary.toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#75EEA5]" />
              <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                Verified Payout Node
              </span>
            </div>
          </div>

          <div className="attendance-summary-cards group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/40">
            <p className="mb-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              Overtime Credits
            </p>
            <h3 className="text-3xl font-black tracking-tighter text-slate-900 italic">
              {summary.totalOT}h{' '}
              <span className="text-xs font-bold text-blue-500 uppercase">
                Tracked
              </span>
            </h3>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Clock size={60} />
            </div>
          </div>

          <div className="attendance-summary-cards group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/40">
            <p className="mb-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              Temporal Attendance %
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tighter text-slate-900">
                {filteredRecords.length > 0
                  ? (
                      (summary.presentCount / filteredRecords.length) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </h3>
              <span className="text-[10px] font-bold text-emerald-500 uppercase">
                {summary.presentCount} Nodes Active
              </span>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <CalendarCheck size={60} />
            </div>
          </div>

          <div className="attendance-summary-cards group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/40">
            <p className="mb-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              Risk Factor / Absence
            </p>
            <h3 className="text-3xl font-black tracking-tighter text-rose-500 italic">
              {summary.absentCount} Days
            </h3>
            <p className="mt-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              Non-Fiscal Capacity
            </p>
          </div>
        </section>

        {/* 📈 ANALYTICS GRAPHS */}
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

        {/* 📅 CALENDAR / TABLE SECTION */}
        <section className="attendance-calendar-container overflow-hidden rounded-[44px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
          <div className="flex flex-col items-center justify-between gap-6 border-b border-slate-100 p-8 sm:flex-row">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase italic">
                Attendance Protocol Registry
              </h3>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                  Temporal Focus:
                </span>
                <span className="text-xs font-black text-slate-900 italic">
                  {viewMode === 'weekly'
                    ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`
                    : viewMode === 'monthly'
                      ? format(currentDate, 'MMMM yyyy')
                      : format(currentDate, 'Year yyyy')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-400 shadow-sm transition-all hover:text-slate-900 active:scale-90"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date('2026-04-01'))}
                className="rounded-xl bg-slate-900 px-6 py-3 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-slate-800"
              >
                Reset Sync
              </button>
              <button
                onClick={handleNext}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-400 shadow-sm transition-all hover:text-slate-900 active:scale-90"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="attendance-calendar p-8">
            {viewMode === 'weekly' ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-7">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, idx) => (
                    <div
                      key={idx}
                      className="group relative flex flex-col items-center rounded-[32px] border border-slate-100 bg-slate-50/50 p-6 transition-all duration-500 hover:border-emerald-200 hover:bg-white hover:shadow-2xl"
                    >
                      <p className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {format(parseISO(record.date), 'EEE')}
                      </p>
                      <h4 className="mb-4 text-2xl font-black text-slate-900">
                        {format(parseISO(record.date), 'dd')}
                      </h4>

                      <div className="flex w-full flex-1 flex-col items-center gap-4">
                        {record.status === 'full' ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 shadow-inner">
                            <CheckCircle2 size={24} />
                          </div>
                        ) : record.status === 'half' ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-inner">
                            <Coffee size={24} />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-inner">
                            <XCircle size={24} />
                          </div>
                        )}

                        {record.is_holiday && (
                          <div className="animate-pulse rounded-lg border border-purple-100 bg-purple-50 px-3 py-1 text-[8px] font-black tracking-widest text-purple-600 uppercase">
                            HOLIDAY Node
                          </div>
                        )}

                        <div className="text-center">
                          <p className="text-[14px] font-black tracking-tighter text-slate-900 italic">
                            ₱{record.computed_salary.toLocaleString()}
                          </p>
                          {record.overtime_hours > 0 && (
                            <p className="mt-0.5 text-[9px] font-bold text-blue-500 uppercase">
                              +{record.overtime_hours}h OT
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center opacity-30">
                    <Calendar
                      size={48}
                      className="mx-auto mb-4 text-slate-400"
                    />
                    <p className="text-sm font-black tracking-[3px] tracking-widest text-slate-400 uppercase italic">
                      Temporal Registry Void
                    </p>
                  </div>
                )}
              </div>
            ) : viewMode === 'monthly' ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
                {filteredRecords.map((record, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-5 transition-all ${record.status === 'absent' ? 'border-slate-50 bg-slate-50/20 opacity-40' : 'border-slate-100 bg-white hover:border-emerald-100 hover:shadow-lg'}`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase">
                        {format(parseISO(record.date), 'dd')}
                      </span>
                      {record.is_holiday && (
                        <div className="h-2 w-2 rounded-full bg-purple-500 shadow-sm" />
                      )}
                    </div>
                    <p className="text-xs font-black tracking-tighter text-slate-900 italic">
                      ₱{record.computed_salary.toLocaleString()}
                    </p>
                    <div
                      className={`mt-3 h-1.5 w-full rounded-full ${record.status === 'full' ? 'bg-[#75EEA5]' : record.status === 'half' ? 'bg-amber-400' : 'bg-slate-200'}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
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
                ].map((month, mIdx) => {
                  const monthRecords = filteredRecords.filter(
                    (r) => parseISO(r.date).getMonth() === mIdx,
                  )
                  const monthSalary = monthRecords.reduce(
                    (sum, r) => sum + r.computed_salary,
                    0,
                  )
                  const attendanceRate =
                    monthRecords.length > 0
                      ? (monthRecords.filter((r) => r.status !== 'absent')
                          .length /
                          monthRecords.length) *
                        100
                      : 0

                  return (
                    <div
                      key={month}
                      className={`rounded-[32px] border p-6 transition-all ${monthSalary > 0 ? 'translate-y-[-4px] bg-slate-900 text-white shadow-xl' : 'border-slate-100 bg-slate-50 opacity-60'}`}
                    >
                      <div className="mb-6 flex items-center justify-between">
                        <h4 className="text-lg font-black uppercase italic">
                          {month}
                        </h4>
                        <TrendingUp
                          size={16}
                          className={
                            monthSalary > 0
                              ? 'text-[#75EEA5]'
                              : 'text-slate-300'
                          }
                        />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[8px] font-black tracking-widest uppercase opacity-40">
                            Monthly Yield
                          </p>
                          <p className="text-xl font-black tracking-tighter italic">
                            ₱{monthSalary.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black tracking-widest uppercase opacity-40">
                            Attendance Reach
                          </p>
                          <p
                            className={`text-xs font-black ${attendanceRate > 80 ? 'text-[#75EEA5]' : 'text-amber-400'}`}
                          >
                            {attendanceRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* 📄 FOOTER ATTESTATION */}
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
      </div>
    </div>
  )
}

export default Attendance
