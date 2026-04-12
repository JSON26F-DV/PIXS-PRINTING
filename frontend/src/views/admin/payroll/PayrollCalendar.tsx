import React, { useMemo } from 'react'
import { format, addDays, subWeeks, addWeeks, startOfWeek } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Coffee,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react'
import { type PayrollRecord, type AttendanceDay } from './types'
import PayrollRow from './PayrollRow'

interface PayrollCalendarProps {
  data: PayrollRecord[]
  currentWeekStart: Date
  onWeekChange: (date: Date) => void
  holidays: string[]
  onToggleHoliday: (date: string) => void
  searchTerm: string
  setSearchTerm: (s: string) => void
  roleFilter: string
  setRoleFilter: (r: string) => void
  sortOption: string
  setSortOption: (s: string) => void
  onUpdateDay: (
    empId: string,
    date: string,
    updates: Partial<AttendanceDay>,
  ) => void
  onUpdateRate: (empId: string, rate: number) => void
}

const PayrollCalendar: React.FC<PayrollCalendarProps> = ({
  data,
  currentWeekStart,
  onWeekChange,
  holidays,
  onToggleHoliday,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  sortOption,
  setSortOption,
  onUpdateDay,
  onUpdateRate,
}) => {
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentWeekStart, { weekStartsOn: 1 })
    return Array.from({ length: 7 }).map((_, i) =>
      format(addDays(start, i), 'yyyy-MM-dd'),
    )
  }, [currentWeekStart])

  return (
    <div className="PayrollCalendarContainer animate-in fade-in space-y-8 duration-700">
      {/* 1. TOP NAV: Week Switcher & Unified Search */}
      <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-8 lg:flex-row lg:items-center">
        <div className="PayrollWeekSwitcher flex items-center gap-6">
          <div className="flex items-center gap-1.5 rounded-[22px] bg-slate-900 p-1.5 shadow-2xl shadow-slate-900/10">
            <button
              onClick={() => onWeekChange(subWeeks(currentWeekStart, 1))}
              className="PayrollPrevWeekButton rounded-[18px] p-3 text-white transition-all hover:bg-white/10"
            >
              <ChevronLeft size={20} strokeWidth={4} />
            </button>
            <div className="flex flex-col items-center px-6 select-none">
              <span className="PayrollWeekLabel mb-1 text-xs font-black tracking-[4px] text-[#75EEA5] uppercase opacity-70">
                Time Slice Nodes
              </span>
              <span className="text-[14px] font-black tracking-tighter text-white uppercase italic">
                {format(new Date(weekDates[0]), 'MMM dd')} —{' '}
                {format(new Date(weekDates[6]), 'MMM dd, yyyy')}
              </span>
            </div>
            <button
              onClick={() => onWeekChange(addWeeks(currentWeekStart, 1))}
              className="PayrollNextWeekButton rounded-[18px] p-3 text-white transition-all hover:bg-white/10"
            >
              <ChevronRight size={20} strokeWidth={4} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-4 lg:max-w-3xl">
          <div className="PayrollSearchBar group relative flex-1">
            <Search
              className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search unified personnel entity..."
              className="w-full rounded-2xl border border-slate-100 bg-white py-4 pr-6 pl-14 text-[14px] font-black shadow-xl shadow-slate-200/40 transition-all focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
            />
          </div>

          <div className="PayrollFilterDropdown group relative">
            <Filter
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-blue-600"
              size={14}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="cursor-pointer appearance-none rounded-2xl border border-slate-100 bg-white py-4 pr-10 pl-10 text-[11px] font-black tracking-widest uppercase shadow-xl shadow-slate-200/40 transition-all hover:bg-slate-50 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="technician">Technician</option>
              <option value="welder">Welder</option>
              <option value="inventory">Inventory</option>
            </select>
          </div>

          <div className="PayrollSortDropdown group relative">
            <ArrowUpDown
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-amber-500"
              size={14}
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="cursor-pointer appearance-none rounded-2xl border border-slate-100 bg-white py-4 pr-10 pl-10 text-[11px] font-black tracking-widest uppercase shadow-xl shadow-slate-200/40 transition-all hover:bg-slate-50 focus:outline-none"
            >
              <option value="none">Sort Priority</option>
              <option value="salary-desc">Highest Pay</option>
              <option value="salary-asc">Lowest Pay</option>
              <option value="name-asc">A-Z Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. CALENDAR TABLE HEADERS & HOLIDAY TOGGLES */}
      <div className="PayrollCalendarTable mb-12 overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="sticky left-0 z-20 w-[300px] bg-slate-50 px-6 py-8 text-left shadow-[10px_0_15px_-5px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-slate-900" size={20} />
                    <span className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                      Unified Personnel Hub
                    </span>
                  </div>
                </th>

                {weekDates.map((dateStr) => {
                  const isHoliday = holidays.includes(dateStr)
                  const dateObj = new Date(dateStr)
                  return (
                    <th key={dateStr} className="min-w-[120px] px-2 py-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="group text-center">
                          <span className="block text-[11px] font-black tracking-[2px] text-slate-400 uppercase">
                            {format(dateObj, 'EEE')}
                          </span>
                          <span className="mt-1 block text-[16px] font-black text-slate-900">
                            {format(dateObj, 'dd')}
                          </span>
                        </div>

                        <button
                          onClick={() => onToggleHoliday(dateStr)}
                          className={`PayrollHolidayToggle group relative flex items-center justify-center rounded-xl p-2 transition-all ${isHoliday ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'border border-slate-100 bg-white text-slate-300 hover:border-rose-100 hover:text-rose-400'}`}
                        >
                          <Coffee size={14} />
                          <div className="absolute top-[120%] z-50 hidden rounded bg-slate-900 px-2 py-1 text-[8px] font-black whitespace-nowrap text-white shadow-xl group-hover:block">
                            {isHoliday
                              ? 'Resume Work Node'
                              : 'Enact Company Holiday'}
                          </div>
                        </button>
                      </div>
                    </th>
                  )
                })}

                <th className="min-w-[150px] px-6 py-8 text-right">
                  <div className="flex items-center justify-end gap-2 text-slate-400">
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      AGGREGATE Matrix
                    </span>
                    <AlertTriangle size={14} className="opacity-50" />
                  </div>
                </th>

                <th className="min-w-[100px] px-6 py-8 text-center">
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Action Node
                  </span>
                </th>
              </tr>
            </thead>

            <tbody>
              {data.map((emp) => (
                <PayrollRow
                  key={emp.employee_id}
                  row={emp}
                  weekDates={weekDates}
                  holidays={holidays}
                  onUpdateDay={onUpdateDay}
                  onUpdateRate={onUpdateRate}
                />
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <Search size={32} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-black tracking-widest text-slate-400 uppercase">
                        No Personnel Entities Found
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PayrollCalendar
