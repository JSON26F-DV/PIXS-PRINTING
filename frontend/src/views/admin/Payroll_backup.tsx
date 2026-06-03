import React, { useState, useMemo, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  User,
  Download,
  CreditCard,
  Search,
  Users,
  Settings2,
  Coffee,
  Zap,
  Save,
} from 'lucide-react'
import {
  format,
  isToday,
  addWeeks,
  subWeeks,
  isSameDay,
  addDays,
  startOfISOWeek,
  endOfISOWeek,
} from 'date-fns'
import { useReactToPrint } from 'react-to-print'
import { m as M, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { usePermissions } from '../../hooks/usePermissions'
import type { Employee, AttendanceLog } from '../../types'
import axiosInstance from '../../lib/axiosInstance'
import { toast } from 'react-toastify'

interface AttendancePillProps {
  status: string
  isHalfDay: boolean
  isHoliday: boolean
}

const AttendancePill: React.FC<AttendancePillProps> = ({
  status,
  isHalfDay,
  isHoliday,
}) => {
  if (isHoliday)
    return (
      <div className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[8px] font-black tracking-tighter text-indigo-500 uppercase italic">
        Holiday Pay
      </div>
    )
  if (isHalfDay)
    return (
      <div className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[8px] font-black tracking-tighter text-amber-500 uppercase">
        Half Day
      </div>
    )

  const styles: Record<string, string> = {
    Present: 'bg-pixs-mint/10 text-pixs-mint border-pixs-mint/20',
    Absent: 'bg-rose-50 text-rose-500 border-rose-100',
    Late: 'bg-amber-50 text-amber-600 border-amber-100',
    Pending: 'bg-slate-50 text-slate-400 border-slate-100',
  }

  return (
    <div
      className={clsx(
        'rounded-full border px-2 py-0.5 text-[8px] font-black tracking-tighter uppercase',
        styles[status] || styles['Pending'],
      )}
    >
      {status}
    </div>
  )
}

interface WeeklySummaryPrintProps {
  weekData: ProcessedItem[]
  period: { start: Date; end: Date }
  stats: { totalPayout: number; totalOT: number; attendanceRate: number }
}

interface ProcessedItem {
  employee: Employee
  logs: AttendanceLog[]
  stats: {
    daysPresent: number
    halfDays: number
    otHours: number
    holidayPay: number
  }
  netPay: number
}

const WeeklySummaryPrint = React.forwardRef<
  HTMLDivElement,
  WeeklySummaryPrintProps
>(({ weekData, period, stats }, ref) => {
  return (
    <div
      ref={ref}
      className="mx-auto max-w-[1000px] bg-white p-12 font-sans text-slate-900"
    >
      <div className="mb-10 flex items-end justify-between border-b-4 border-slate-900 pb-8">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="text-pixs-mint flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-2xl font-bold">
              P
            </div>
            <div>
              <h1 className="text-4xl leading-none font-black tracking-tighter uppercase italic">
                Pixs Shop OS
              </h1>
              <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
                Enterprise Payroll Division
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
            Weekly Payroll Summary
          </h2>
          <p className="text-pixs-mint mt-2 inline-block rounded-lg bg-slate-900 px-4 py-1.5 font-mono text-sm font-bold tracking-tighter uppercase">
            {format(period.start, 'MMM dd')} —{' '}
            {format(period.end, 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="mb-12 grid grid-cols-4 gap-6">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <p className="mb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
            Total Payout
          </p>
          <p className="font-mono text-2xl font-black text-slate-900">
            ₱{stats.totalPayout.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <p className="mb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
            OT Remuneration
          </p>
          <p className="text-pixs-mint font-mono text-2xl font-black">
            ₱{stats.totalOT.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <p className="mb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
            Active Staff
          </p>
          <p className="font-mono text-2xl font-black text-slate-900">
            {weekData.length}
          </p>
        </div>
        <div className="bg-pixs-mint border-pixs-mint shadow-pixs-mint/20 rounded-2xl border p-6 shadow-xl">
          <p className="mb-1 text-[9px] font-black tracking-widest text-slate-900/40 uppercase">
            Attendance Rate
          </p>
          <p className="font-mono text-2xl font-black text-slate-900">
            {stats.attendanceRate}%
          </p>
        </div>
      </div>

      <table className="mb-12 w-full">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Employee
            </th>
            <th className="py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Present
            </th>
            <th className="py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Half Days
            </th>
            <th className="py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
              OT Hrs
            </th>
            <th className="py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Daily Rate
            </th>
            <th className="py-4 text-right text-[10px] font-black tracking-widest text-slate-900 uppercase">
              Net Pay
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {weekData.map((item) => (
            <tr key={item.employee.id}>
              <td className="py-5">
                <p className="text-sm font-black tracking-tight text-slate-900 uppercase">
                  {item.employee.name}
                </p>
                <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                  {item.employee.role}
                </p>
              </td>
              <td className="py-5 text-right font-mono text-sm font-bold">
                {item.stats.daysPresent}
              </td>
              <td className="py-5 text-right font-mono text-sm font-bold">
                {item.stats.halfDays}
              </td>
              <td className="py-5 text-right font-mono text-sm font-bold">
                {item.stats.otHours}
              </td>
              <td className="py-5 text-right font-mono text-sm text-slate-400">
                ₱{item.employee.daily_rate.toLocaleString()}
              </td>
              <td className="py-5 text-right font-mono text-lg font-black text-slate-900">
                ₱{item.netPay.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-slate-100 pt-10">
        <div>
          <p className="mb-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Certified Correct By:
          </p>
          <div className="mb-2 h-px w-64 bg-slate-900" />
          <p className="text-xs font-black uppercase italic opacity-60 grayscale">
            Admin / Operations Lead
          </p>
        </div>
        <div className="text-right text-[8px] font-black tracking-[5px] text-slate-300 uppercase">
          Confidential Enterprise Document •{' '}
          {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
        </div>
      </div>
    </div>
  )
})

const PayrollAttendance: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfISOWeek(new Date()),
  )
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [attendance, setAttendance] = useState<AttendanceLog[]>([])
  const [employeesState, setEmployeesState] = useState<Employee[]>([])
  const [isHolidayMode, setIsHolidayMode] = useState<boolean>(false)
  const [holidays, setHolidays] = useState<string[]>([]) // List of dates as strings 'yyyy-MM-dd'
  const [isCalculating, setIsCalculating] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [selectedMobileEmployee, setSelectedMobileEmployee] = useState<Employee | null>(null)

  // Fetch Payroll Data
  const fetchPayrollData = React.useCallback(async () => {
    setIsCalculating(true)
    try {
      const response = await axiosInstance.get('/api/admin/payroll', {
        params: {
          week_start: format(currentWeekStart, 'yyyy-MM-dd'),
        },
      })
      const data = response.data

      const fetchedEmployees = data.employees.map((emp: unknown) => {
        const e = emp as Employee
        return {
          id: e.id,
          name: e.name,
          role: e.role,
          daily_rate: e.daily_rate,
          ot_rate: e.ot_rate,
        }
      }) as Employee[]

      const fetchedAttendance: AttendanceLog[] = []
      const fetchedHolidays = new Set<string>()

      data.employees.forEach((emp: unknown) => {
        const e = emp as Employee & { attendance?: AttendanceLog[] }
        if (e.attendance) {
          e.attendance.forEach((log: AttendanceLog) => {
            fetchedAttendance.push({
              id: log.id,
              employee_id: log.employee_id,
              date: log.date,
              status: log.status,
              is_half_day: log.is_half_day,
              ot_hours: log.ot_hours,
              is_holiday: log.is_holiday,
            })
            if (log.is_holiday) {
              fetchedHolidays.add(log.date)
            }
          })
        }
      })

      setEmployeesState(fetchedEmployees)
      setAttendance(fetchedAttendance)
      setHolidays(Array.from(fetchedHolidays))
    } catch (error: unknown) {
      console.error('Failed to fetch payroll data:', error)
      toast.error('Failed to load payroll data.')
    } finally {
      setIsCalculating(false)
    }
  }, [currentWeekStart])

  React.useEffect(() => {
    fetchPayrollData()
  }, [fetchPayrollData])

  const { isAdmin } = usePermissions()

  // Print Refs
  const weeklySummaryRef = useRef<HTMLDivElement>(null)
  const handlePrintSummary = useReactToPrint({
    contentRef: weeklySummaryRef,
  })

  // Week Helpers
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  }, [currentWeekStart])

  const weekEnd = endOfISOWeek(currentWeekStart)

  // Stats Logic
  const processedData = useMemo<ProcessedItem[]>(() => {
    const startStr = format(currentWeekStart, 'yyyy-MM-dd')
    const endStr = format(weekEnd, 'yyyy-MM-dd')

    return employeesState
      .filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .map((emp) => {
        const logs = attendance.filter(
          (a) =>
            a.employee_id === emp.id && a.date >= startStr && a.date <= endStr,
        )

        const daysPresent = logs.filter(
          (l) =>
            (l.status === 'Present' || l.status === 'Late') && !l.is_half_day,
        ).length
        const halfDays = logs.filter(
          (l) =>
            l.is_half_day && (l.status === 'Present' || l.status === 'Late'),
        ).length
        const otHours = logs.reduce((sum, l) => sum + (l.ot_hours || 0), 0)

        // Holiday calculations
        const weekHolidays = holidays.filter(
          (h) => h >= startStr && h <= endStr,
        ).length

        const basicPay =
          daysPresent * emp.daily_rate + halfDays * 0.5 * emp.daily_rate
        const otPay = otHours * emp.ot_rate
        const holidayPay = weekHolidays * emp.daily_rate // Paid holiday logic

        const netPay = basicPay + otPay + holidayPay

        return {
          employee: emp,
          logs,
          stats: { daysPresent, halfDays, otHours, holidayPay },
          netPay,
        }
      })
  }, [
    currentWeekStart,
    weekEnd,
    searchQuery,
    attendance,
    employeesState,
    holidays,
  ])

  const summaryStats = useMemo(() => {
    const totalPayout = processedData.reduce(
      (sum, item) => sum + item.netPay,
      0,
    )
    const totalOT = processedData.reduce(
      (sum, item) => sum + item.stats.otHours * item.employee.ot_rate,
      0,
    )
    const presentCount = processedData.reduce(
      (sum, item) =>
        sum + item.stats.daysPresent + (item.stats.halfDays ? 0.5 : 0),
      0,
    )
    const totalPossibleDays = processedData.length * 7
    const attendanceRate =
      totalPossibleDays > 0
        ? Math.round((presentCount / totalPossibleDays) * 100)
        : 0

    return { totalPayout, totalOT, attendanceRate }
  }, [processedData])

  // Actions
  const handleSavePayroll = async () => {
    setIsSaving(true)
    try {
      const payload = {
        week_start: format(currentWeekStart, 'yyyy-MM-dd'),
        payroll_data: processedData.map((item) => ({
          employee_id: item.employee.id,
          daily_rate: item.employee.daily_rate,
          net_pay: item.netPay,
          attendance: item.logs,
        })),
      }

      await axiosInstance.post('/api/admin/payroll/save', payload)
      toast.success('Payroll saved successfully')
      fetchPayrollData()
    } catch (error: unknown) {
      console.error('Failed to save payroll:', error)
      toast.error('Failed to save payroll. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }
  const handleToggleHoliday = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd')
    if (holidays.includes(dStr)) {
      setHolidays(holidays.filter((h) => h !== dStr))
    } else {
      setHolidays([...holidays, dStr])
    }
  }

  const markAllPresent = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const newLogs = [...attendance]

    employeesState.forEach((emp) => {
      const existingIdx = newLogs.findIndex(
        (l) => l.employee_id === emp.id && l.date === dateStr,
      )
      if (existingIdx === -1) {
        newLogs.push({
          id: `ATT-${dateStr}-${emp.id}`,
          employee_id: emp.id,
          date: dateStr,
          status: 'Present',
          is_half_day: false,
          ot_hours: 0,
          is_holiday: holidays.includes(dateStr),
        })
      } else {
        newLogs[existingIdx] = {
          ...newLogs[existingIdx],
          status: 'Present',
          is_half_day: false,
        }
      }
    })

    setAttendance(newLogs)
  }

  const updateAttendance = (
    empId: string,
    date: Date,
    updates: Partial<AttendanceLog>,
  ) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const existingIdx = attendance.findIndex(
      (l) => l.employee_id === empId && l.date === dateStr,
    )

    if (existingIdx > -1) {
      const newAttendance = [...attendance]
      newAttendance[existingIdx] = { ...newAttendance[existingIdx], ...updates }
      setAttendance(newAttendance)
    } else {
      setAttendance([
        ...attendance,
        {
          id: `ATT-${dateStr}-${empId}`,
          employee_id: empId,
          date: dateStr,
          status: 'Present',
          is_half_day: false,
          ot_hours: 0,
          is_holiday: false,
          ...updates,
        } as AttendanceLog,
      ])
    }
  }

  const updateRate = (empId: string, newRate: string) => {
    setEmployeesState(
      employeesState.map((emp) =>
        emp.id === empId ? { ...emp, daily_rate: parseInt(newRate) || 0 } : emp,
      ),
    )
  }

  const nextWeek = () => {
    setIsCalculating(true)
    setTimeout(() => {
      setCurrentWeekStart(addWeeks(currentWeekStart, 1))
      setIsCalculating(false)
    }, 400)
  }

  const prevWeek = () => {
    setIsCalculating(true)
    setTimeout(() => {
      setCurrentWeekStart(subWeeks(currentWeekStart, 1))
      setIsCalculating(false)
    }, 400)
  }

  const parseISO = (str: string) => new Date(str)

  return (
    <div className="space-y-8 pb-20">
      {/* Search & Period Header */}
      <div className="sticky top-0 z-50 flex flex-col justify-between gap-6 bg-slate-50/80 pt-2 pb-6 backdrop-blur-md lg:flex-row lg:items-center">
        <div className="group relative max-w-xl flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Search
              size={18}
              className="group-focus-within:text-pixs-mint text-slate-400 transition-colors"
            />
          </div>
          <input
            type="text"
            placeholder="Search Intelligence (Name, ID, Department)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:ring-pixs-mint/20 focus:border-pixs-mint w-full rounded-2xl border border-slate-200 bg-white py-4 pr-4 pl-12 font-medium text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <button
            onClick={prevWeek}
            className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-slate-50 active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-[180px] px-4 text-center">
            <p className="mb-0.5 text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
              Payroll Cycle
            </p>
            <p className="font-mono text-xs font-black text-slate-900">
              {format(currentWeekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd')}
            </p>
          </div>
          <button
            onClick={nextWeek}
            className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-slate-50 active:scale-90"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={handleSavePayroll}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-2xl bg-pixs-mint px-6 py-4 text-xs font-black tracking-[2px] text-slate-900 uppercase shadow-xl transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="border-t-slate-900 h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? 'Saving...' : 'Save Payroll'}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handlePrintSummary}
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black tracking-[2px] text-white uppercase shadow-xl transition-all hover:bg-slate-800 active:scale-95"
            >
              <Download size={18} className="text-pixs-mint" />
              Export Week
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setIsHolidayMode(!isHolidayMode)}
              className={clsx(
                'flex items-center gap-2 rounded-2xl border p-4 text-xs font-black tracking-widest uppercase shadow-sm transition-all active:scale-95',
                isHolidayMode
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              <Settings2 size={18} />
              {isHolidayMode ? 'Exit Config' : 'Event Mode'}
            </button>
          )}
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <M.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div>
            <p className="mb-3 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              Projected Payout
            </p>
            <h4 className="font-mono text-3xl font-black tracking-tighter text-slate-900">
              ₱{summaryStats.totalPayout.toLocaleString()}
            </h4>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-slate-400">
            <CreditCard size={28} />
          </div>
        </M.div>

        <M.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between rounded-[32px] border border-slate-800 bg-slate-900 p-8 shadow-xl shadow-slate-900/10"
        >
          <div>
            <p className="mb-3 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              Total OT Overhead
            </p>
            <h4 className="text-pixs-mint font-mono text-3xl font-black tracking-tighter">
              ₱{summaryStats.totalOT.toLocaleString()}
            </h4>
          </div>
          <div className="text-pixs-mint shadow-pixs-mint/10 rounded-2xl bg-slate-800 p-4 shadow-lg">
            <Zap size={28} />
          </div>
        </M.div>

        <M.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div>
            <p className="mb-3 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              Cycle Health
            </p>
            <div className="flex items-end gap-2">
              <h4 className="font-mono text-3xl font-black tracking-tighter text-slate-900">
                {summaryStats.attendanceRate}%
              </h4>
              <p className="text-pixs-mint mb-1 text-[10px] font-bold tracking-widest uppercase">
                Attendance
              </p>
            </div>
          </div>
          <div className="border-r-pixs-mint flex h-16 w-16 -rotate-45 items-center justify-center rounded-full border-[6px] border-slate-50">
            <Users size={24} className="rotate-45 text-slate-300" />
          </div>
        </M.div>
      </div>

      {/* Enterprise Attendance Grid (Desktop) */}
      <div className="hidden lg:flex min-h-[500px] flex-col overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-[300px_1fr] border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 border-r border-slate-100 p-6">
            <User size={14} className="text-slate-400" />
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Employee Intelligence
            </span>
          </div>
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {weekDays.map((day) => (
              <div
                key={day.toString()}
                className="group relative p-4 text-center"
              >
                <p className="mb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  {format(day, 'EEE')}
                </p>
                <p
                  className={clsx(
                    'font-mono text-xs font-black',
                    isToday(day) ? 'text-pixs-mint' : 'text-slate-900',
                  )}
                >
                  {format(day, 'dd')}
                </p>

                {holidays.includes(format(day, 'yyyy-MM-dd')) && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Coffee size={10} className="text-indigo-400" />
                  </div>
                )}

                {isHolidayMode && isAdmin ? (
                  <button
                    onClick={() => handleToggleHoliday(day)}
                    className={clsx(
                      'mt-2 w-full rounded-full border py-1 text-[8px] font-black tracking-tighter uppercase transition-all',
                      holidays.includes(format(day, 'yyyy-MM-dd'))
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'hover:border-pixs-mint border-slate-200 text-slate-400',
                    )}
                  >
                    Set Event
                  </button>
                ) : isAdmin ? (
                  <button
                    onClick={() => markAllPresent(day)}
                    className="hover:text-pixs-mint mt-2 text-[7px] font-black text-slate-300 uppercase opacity-0 transition-colors group-hover:opacity-100"
                  >
                    Mark All
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 divide-y divide-slate-50">
          <AnimatePresence mode="popLayout">
            {isCalculating ? (
              <div className="flex flex-col items-center justify-center gap-4 p-20 text-slate-300">
                <div className="border-t-pixs-mint h-12 w-12 animate-spin rounded-full border-4 border-slate-100" />
                <p className="text-[10px] font-black tracking-[5px] uppercase">
                  Recalculating Shifts
                </p>
              </div>
            ) : (
              processedData.map((item) => (
                <div
                  key={item.employee.id}
                  className="group grid grid-cols-[300px_1fr] overflow-hidden transition-all hover:bg-slate-50/50"
                >
                  <div className="relative border-r border-slate-100 bg-white p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-400">
                          {item.employee.name[0]}
                        </div>
                        <div>
                          <p className="text-[11px] font-black tracking-tight text-slate-900 uppercase">
                            {item.employee.name}
                          </p>
                          <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                            {item.employee.role}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] leading-none font-black text-slate-900">
                          ₱{item.netPay.toLocaleString()}
                        </p>
                        <p className="mt-1 text-[8px] font-black tracking-tighter text-slate-400 uppercase">
                          Est. Week
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="mb-1.5 flex justify-between text-[8px] font-black tracking-widest text-slate-300 uppercase">
                          Daily Rate
                          {isAdmin && (
                            <span className="text-pixs-mint opacity-100 transition-transform group-hover:scale-110">
                              Editable
                            </span>
                          )}
                        </p>
                        <div className="relative">
                          <span className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[10px] text-slate-400">
                            ₱
                          </span>
                          <input
                            type="number"
                            value={item.employee.daily_rate}
                            onChange={(e) =>
                              updateRate(item.employee.id, e.target.value)
                            }
                            disabled={!isAdmin}
                            className={clsx(
                              'w-full rounded-xl border py-2 pr-3 pl-6 font-mono text-xs font-black transition-all outline-none',
                              isAdmin
                                ? 'focus:ring-pixs-mint/20 focus:border-pixs-mint border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2'
                                : 'cursor-not-allowed border-transparent bg-transparent text-slate-500',
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 divide-x divide-slate-100">
                    {weekDays.map((day) => {
                      const log = item.logs.find((l) =>
                        isSameDay(parseISO(l.date), day),
                      ) || {
                        status: 'Pending',
                        ot_hours: 0,
                        is_half_day: false,
                      }
                      const isHoliday = holidays.includes(
                        format(day, 'yyyy-MM-dd'),
                      )

                      return (
                        <div
                          key={day.toString()}
                          className="group/cell flex flex-col gap-3 p-4"
                        >
                          <button
                            disabled={isHoliday || !isAdmin}
                            onClick={() => {
                              const statuses: AttendanceLog['status'][] = [
                                'Present',
                                'Late',
                                'Absent',
                                'Pending',
                              ]
                              const next =
                                statuses[
                                  (statuses.indexOf(
                                    log.status as AttendanceLog['status'],
                                  ) +
                                    1) %
                                    statuses.length
                                ]
                              updateAttendance(item.employee.id, day, {
                                status: next,
                              })
                            }}
                            className={clsx(
                              'w-full rounded-lg py-1 text-center transition-all active:scale-95',
                              (isHoliday || !isAdmin) &&
                                'cursor-not-allowed opacity-70',
                            )}
                          >
                            <AttendancePill
                              status={log.status}
                              isHalfDay={log.is_half_day}
                              isHoliday={isHoliday}
                            />
                          </button>

                          {(log.status === 'Present' ||
                            log.status === 'Late') &&
                            !isHoliday && (
                              <div className="space-y-2">
                                <div
                                  className={clsx(
                                    'flex items-center gap-1 rounded-lg p-1',
                                    isAdmin
                                      ? 'bg-slate-50'
                                      : 'pointer-events-none opacity-50',
                                  )}
                                >
                                  <span className="ml-1 text-[8px] font-black text-slate-400 uppercase">
                                    OT
                                  </span>
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={log.ot_hours || 0}
                                    disabled={!isAdmin}
                                    onChange={(e) =>
                                      updateAttendance(item.employee.id, day, {
                                        ot_hours:
                                          parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="text-pixs-mint w-full border-none bg-transparent p-0 text-right font-mono text-[10px] font-black focus:ring-0 disabled:text-slate-400"
                                  />
                                </div>
                                {isAdmin && (
                                  <button
                                    onClick={() =>
                                      updateAttendance(item.employee.id, day, {
                                        is_half_day: !log.is_half_day,
                                      })
                                    }
                                    className={clsx(
                                      'w-full rounded-lg border py-1 text-[8px] font-black tracking-widest uppercase transition-all',
                                      log.is_half_day
                                        ? 'border-amber-500 bg-amber-500 text-white'
                                        : 'border-slate-100 text-slate-300 hover:text-amber-500',
                                    )}
                                  >
                                    Half?
                                  </button>
                                )}
                              </div>
                            )}

                          {isHoliday && (
                            <div className="flex flex-1 items-center justify-center opacity-40">
                              <Coffee size={14} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex lg:hidden flex-col gap-4">
        {processedData.map((item) => (
          <div
            key={item.employee.id}
            onClick={() => setSelectedMobileEmployee(item.employee)}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-400">
                {item.employee.name[0]}
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-slate-900 uppercase">
                  {item.employee.name}
                </p>
                <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                  {item.employee.role}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-black text-slate-900">
                ₱{item.netPay.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Modal for Editing */}
      <AnimatePresence>
        {selectedMobileEmployee && (
          <M.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 pb-10 backdrop-blur-sm lg:hidden"
            onClick={() => setSelectedMobileEmployee(null)}
          >
            <M.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="max-h-[85vh] w-full overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const item = processedData.find((d) => d.employee.id === selectedMobileEmployee.id)
                if (!item) return null

                return (
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black uppercase text-slate-900">{item.employee.name}</h3>
                        <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">{item.employee.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xl font-black text-pixs-mint">₱{item.netPay.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mb-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Daily Rate
                      </p>
                      <input
                        type="number"
                        value={item.employee.daily_rate}
                        onChange={(e) => updateRate(item.employee.id, e.target.value)}
                        disabled={!isAdmin}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 font-mono text-sm font-black transition-all outline-none focus:border-pixs-mint focus:ring-2 focus:ring-pixs-mint/20"
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase border-b pb-2">
                        Attendance Record
                      </h4>
                      {weekDays.map((day) => {
                        const log = item.logs.find((l) => isSameDay(new Date(l.date), day)) || {
                          status: 'Pending',
                          ot_hours: 0,
                          is_half_day: false,
                        }
                        const isHoliday = holidays.includes(format(day, 'yyyy-MM-dd'))

                        return (
                          <div key={day.toString()} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                            <div>
                              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                {format(day, 'EEE')}
                              </p>
                              <p className="font-mono text-sm font-black text-slate-900">
                                {format(day, 'MMM dd')}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                               <button
                                disabled={isHoliday || !isAdmin}
                                onClick={() => {
                                  const statuses: AttendanceLog['status'][] = ['Present', 'Late', 'Absent', 'Pending']
                                  const next = statuses[(statuses.indexOf(log.status as AttendanceLog['status']) + 1) % statuses.length]
                                  updateAttendance(item.employee.id, day, { status: next })
                                }}
                                className="w-20"
                              >
                                <AttendancePill status={log.status} isHalfDay={log.is_half_day} isHoliday={isHoliday} />
                              </button>
                              
                              {log.status === 'Present' && !isHoliday && isAdmin && (
                                <button
                                  onClick={() => updateAttendance(item.employee.id, day, { is_half_day: !log.is_half_day })}
                                  className={clsx(
                                    'rounded-lg px-2 py-1 text-[8px] font-black tracking-widest uppercase transition-all',
                                    log.is_half_day ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
                                  )}
                                >
                                  Half?
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </M.div>
          </M.div>
        )}
      </AnimatePresence>

      {/* Hidden Print Area */}
      <div className="hidden">
        <WeeklySummaryPrint
          ref={weeklySummaryRef}
          weekData={processedData}
          period={{ start: currentWeekStart, end: weekEnd }}
          stats={summaryStats}
        />
      </div>
    </div>
  )
}

export default PayrollAttendance
