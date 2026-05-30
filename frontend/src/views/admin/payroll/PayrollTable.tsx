import React from 'react'
import { Search, Filter, ArrowUpDown, Coffee } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { type EmployeeTodayRecord } from './types'

interface PayrollTableProps {
  data: EmployeeTodayRecord[]
  searchTerm: string
  setSearchTerm: (s: string) => void
  roleFilter: string
  setRoleFilter: (r: string) => void
  sortOption: string
  setSortOption: (s: string) => void
  onUpdateAttendance: (emp: EmployeeTodayRecord, status: string, totalEarnings: number, customFields?: Partial<EmployeeTodayRecord>) => void
  onSetNonWorkingHoliday: () => void
  onOpenLateModal: (emp: EmployeeTodayRecord) => void
  onBreakUpdate: (empId: string, type: 'start' | 'end') => void
}

const PayrollTable: React.FC<PayrollTableProps> = ({
  data,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  sortOption,
  setSortOption,
  onUpdateAttendance,
  onSetNonWorkingHoliday,
  onOpenLateModal,
  onBreakUpdate,
}) => {
  return (
    <div className="PayrollTableContainer animate-in fade-in space-y-8 duration-700">
      {/* 1. TOP NAV: Unified Search */}
      <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-8 lg:flex-row lg:items-center">
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
              placeholder="Search personnel..."
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
              <option value="name-asc">A-Z Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. TABLE */}
      <div className="PayrollCalendarTable mb-12 overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-6 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  Employee
                </th>
                <th className="px-6 py-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                  Today's Status
                </th>
                <th className="px-6 py-6 text-right text-xs font-black uppercase tracking-widest text-slate-400">
                  <div className="flex flex-col items-end gap-1.5">
                    <span>Action</span>
                    <button
                      onClick={onSetNonWorkingHoliday}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 transition-all hover:bg-amber-500 hover:text-white active:scale-95 cursor-pointer shadow-sm"
                      title="Mark today as Global Non-Working Holiday"
                    >
                      <Coffee size={10} />
                      Holiday
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((emp) => (
                <tr key={emp.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-500">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-slate-900">{emp.name}</div>
                        <div className="text-xs font-bold tracking-wider text-slate-400">
                          {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      {emp.holiday_type === 'special_work' && (
                        <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-600 border border-purple-200">
                          Special Day
                        </span>
                      )}
                      
                      {emp.holiday_type !== 'none' && emp.holiday_type !== 'special_work' && (
                        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600 border border-rose-200">
                          Holiday ({emp.holiday_type.replace('_', ' ')})
                        </span>
                      )}

                      {(emp.status_today === 'full' || emp.status_today === 'present') && (
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          Present {emp.status_today === 'full' && '(Full)'}
                        </span>
                      )}
                      
                      {emp.status_today === 'half' && (
                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600">
                          Present (Half)
                        </span>
                      )}
                      
                      {emp.status_today === 'absent' && (
                        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">
                          Absent
                        </span>
                      )}
                      
                      {emp.status_today === 'pending' && emp.holiday_type === 'none' && (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                          Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      {emp.status_today === 'present' && (
                        <>
                          <button
                            onClick={() => {
                              const lateDeduction = emp.late * (emp.daily_rate / 480);
                              const earnings = emp.holiday_type === 'special_work'
                                ? emp.daily_rate + emp.holiday_pay - lateDeduction
                                : emp.daily_rate - lateDeduction;
                              onUpdateAttendance(emp, 'full', Math.max(0, earnings), { end_time: format(new Date(), 'HH:mm'), hours_worked: 8 });
                            }}
                            className="inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-600 active:scale-95"
                            title="Set today's status to Full (Paid)"
                          >
                            Full
                          </button>
                          <button
                            onClick={() => {
                              const lateDeduction = emp.late * (emp.daily_rate / 480);
                              const earnings = emp.holiday_type === 'special_work'
                                ? (emp.daily_rate / 2) + emp.holiday_pay - lateDeduction
                                : (emp.daily_rate / 2) - lateDeduction;
                              onUpdateAttendance(emp, 'half', Math.max(0, earnings), { end_time: format(new Date(), 'HH:mm'), hours_worked: 4 });
                            }}
                            className="inline-flex rounded-lg bg-amber-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-amber-600 active:scale-95"
                            title="Set today's status to Half (Paid)"
                          >
                            Half
                          </button>

                          {/* Break Quick Actions */}
                          {!emp.break_start && (
                            <button
                              title="Start Break"
                              onClick={() => onBreakUpdate(emp.id, 'start')}
                              className="rounded-lg bg-amber-50 p-2 text-amber-500 transition-colors hover:bg-amber-500 hover:text-white"
                            >
                              <Coffee size={14} />
                            </button>
                          )}
                          {emp.break_start && !emp.break_end && (
                            <button
                              title="End Break"
                              onClick={() => onBreakUpdate(emp.id, 'end')}
                              className="group relative rounded-lg bg-emerald-50 p-2 text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-white overflow-hidden"
                            >
                              <Coffee size={14} />
                              <div className="absolute top-1/2 left-1/2 w-[18px] h-[2px] bg-emerald-500 -translate-x-1/2 -translate-y-1/2 -rotate-45 group-hover:bg-white"></div>
                            </button>
                          )}
                        </>
                      )}

                      {emp.status_today === 'pending' && (
                        <>
                          <button
                            onClick={() => onUpdateAttendance(emp, 'present', 0, { start_time: format(new Date(), 'HH:mm') })}
                            className="inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-600 active:scale-95"
                            title="Mark today as Present"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => onOpenLateModal(emp)}
                            className="inline-flex rounded-lg bg-amber-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-amber-600 active:scale-95"
                            title="Mark today as Late"
                          >
                            Late
                          </button>
                          <button
                            onClick={() => onUpdateAttendance(emp, 'absent', 0)}
                            className="inline-flex rounded-lg bg-rose-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-rose-600 active:scale-95"
                            title="Mark today as Absent"
                          >
                            Absent
                          </button>
                        </>
                      )}

                      <Link
                        to={`/admin/payroll/manage/${emp.id}`}
                        className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 active:scale-95"
                      >
                        Edit Data
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    No employees found.
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

export default PayrollTable
