import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { format, startOfWeek } from 'date-fns'
import _ from 'lodash'

// Modular Imports
import { PayrollSystemHeader } from './PayrollSystemHeader'
import PayrollCalendar from './PayrollCalendar'
import PayrollAnalytics from './PayrollAnalytics'
import { PayrollPayslipComponent } from './PayrollPayslipComponent'
import {
  type PayrollRecord,
  type AttendanceDay,
  type WeeklySalaryData,
  generateEmptyWeek,
} from './types'

// Data Mock
import usersData from '../../../data/users.json'
import initialSalaryData from '../../../data/salary.json'
import { useAuth } from '../../../context/AuthContext'

interface UserDataEmployee {
  id: string
  name: string
  role: string
  daily_rate?: number
  ot_rate?: number
}

const Payroll: React.FC = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  // State Management
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date('2026-03-30'), { weekStartsOn: 1 }),
  )
  const [holidays, setHolidays] = useState<string[]>([])

  // Weekly Vault State (Simulated Persistent Store)
  const [weeklyVault, setWeeklyVault] = useState<
    Record<string, Record<string, AttendanceDay[]>>
  >(() => {
    const vault: Record<string, Record<string, AttendanceDay[]>> = {}
    ;(initialSalaryData as unknown as WeeklySalaryData[]).forEach((s) => {
      if (!vault[s.week_start]) vault[s.week_start] = {}
      vault[s.week_start][s.employee_id] =
        s.attendance as unknown as AttendanceDay[]
    })
    return vault
  })

  // Current Individual Rates (Internal Admin Cache)
  const [employeeRates, setEmployeeRates] = useState<Record<string, number>>(
    () => {
      const rates: Record<string, number> = {}
      ;(usersData.employees as UserDataEmployee[]).forEach((e) => {
        rates[e.id] = e.daily_rate || 850
      })
      return rates
    },
  )

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortOption, setSortOption] = useState('none')

  // Computed Current Week Data Matrix
  const currentWeekKey = format(currentWeekStart, 'yyyy-MM-dd')

  const payrollData = useMemo(() => {
    return (usersData.employees as UserDataEmployee[]).map((emp) => {
      const attendance =
        weeklyVault[currentWeekKey]?.[emp.id] ||
        generateEmptyWeek(currentWeekStart, employeeRates[emp.id] || 850)
      const weeklyTotal = attendance.reduce(
        (sum, d) => sum + d.computed_salary,
        0,
      )

      return {
        employee_id: emp.id,
        name: emp.name,
        role: emp.role,
        current_rate: employeeRates[emp.id] || 850,
        ot_rate: emp.ot_rate || 100,
        attendance,
        weekly_total: weeklyTotal,
      } as PayrollRecord
    })
  }, [weeklyVault, currentWeekKey, currentWeekStart, employeeRates])

  // Unified Filtering & Sorting Selector
  const filteredData = useMemo(() => {
    let result = payrollData.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchRole = roleFilter === 'all' || emp.role === roleFilter
      return matchSearch && matchRole
    })

    if (sortOption === 'salary-desc')
      result = _.orderBy(result, ['weekly_total'], ['desc'])
    else if (sortOption === 'salary-asc')
      result = _.orderBy(result, ['weekly_total'], ['asc'])
    else if (sortOption === 'name-asc')
      result = _.orderBy(result, ['name'], ['asc'])

    return result
  }, [payrollData, searchTerm, roleFilter, sortOption])

  // Update Handlers
  const handleUpdateDay = useCallback(
    (empId: string, date: string, updates: Partial<AttendanceDay>) => {
      if (!isAdmin) return

      setWeeklyVault((prev) => {
        const week = prev[currentWeekKey] || {}
        const empAttendance =
          week[empId] ||
          generateEmptyWeek(currentWeekStart, employeeRates[empId] || 850)

        const newAttendance = empAttendance.map((day) => {
          if (day.date === date) {
            return { ...day, ...updates }
          }
          return day
        })

        return {
          ...prev,
          [currentWeekKey]: {
            ...week,
            [empId]: newAttendance,
          },
        }
      })
    },
    [currentWeekKey, currentWeekStart, isAdmin, employeeRates],
  )

  const handleUpdateRate = useCallback(
    (empId: string, rate: number) => {
      if (!isAdmin) return
      setEmployeeRates((prev) => ({ ...prev, [empId]: rate }))
    },
    [isAdmin],
  )

  const toggleHoliday = useCallback(
    (date: string) => {
      if (!isAdmin) return
      setHolidays((prev) => {
        const isRemoving = prev.includes(date)
        const newHolidays = isRemoving
          ? prev.filter((d) => d !== date)
          : [...prev, date]

        // If adding a holiday, zero out everyone's salary for that day
        if (!isRemoving) {
          setWeeklyVault((v) => {
            const updatedVault = { ...v }
            const week = { ...(updatedVault[currentWeekKey] || {}) }

            ;(usersData.employees as UserDataEmployee[]).forEach((emp) => {
              const att =
                week[emp.id] ||
                generateEmptyWeek(
                  currentWeekStart,
                  employeeRates[emp.id] || 850,
                )
              week[emp.id] = att.map((d) =>
                d.date === date
                  ? {
                      ...d,
                      status: 'absent',
                      attendance_percentage: 0,
                      computed_salary: 0,
                      overtime_hours: 0,
                      applied_rate: 0,
                      late_minutes: 0,
                      hours_worked: 0,
                    }
                  : d,
              )
            })

            updatedVault[currentWeekKey] = week
            return updatedVault
          })
        }
        return newHolidays
      })
    },
    [isAdmin, currentWeekKey, currentWeekStart, employeeRates],
  )

  const printAllRef = useRef<HTMLDivElement>(null)
  const handlePrintAll = useReactToPrint({
    contentRef: printAllRef,
  })

  return (
    <div className="PayrollPage animate-in fade-in mx-auto max-w-[1700px] space-y-10 px-6 pb-24 duration-700 lg:px-12">
      <PayrollSystemHeader />

      <PayrollAnalytics
        data={payrollData}
        weekDates={(_.first(payrollData)?.attendance || []).map((d) => d.date)}
      />

      <PayrollCalendar
        data={filteredData}
        currentWeekStart={currentWeekStart}
        onWeekChange={setCurrentWeekStart}
        holidays={holidays}
        onToggleHoliday={toggleHoliday}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        onUpdateDay={handleUpdateDay}
        onUpdateRate={handleUpdateRate}
      />

      {/* Monthly Archive / Export UI / PDF Generator WIP Panel */}
      <div className="group relative flex items-center justify-between overflow-hidden rounded-[40px] border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#75EEA5]/10 blur-[80px] transition-transform duration-1000 group-hover:scale-150" />
        <div>
          <h4 className="text-xl font-black tracking-tighter text-white uppercase italic">
            Enterprise Accounting Ledger
          </h4>
          <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-500 uppercase opacity-70">
            Unified Monthly Archive & Export Center
          </p>
        </div>
        <div className="relative z-10 flex gap-4">
          <button
            onClick={() => handlePrintAll()}
            className="rounded-2xl border border-white/10 bg-white px-8 py-4 text-[10px] font-black tracking-widest text-slate-900 uppercase shadow-xl transition-all hover:scale-105 hover:bg-slate-50"
          >
            Print All Payslips (2x2 Grid)
          </button>
          <button className="rounded-2xl bg-[#75EEA5] px-8 py-4 text-[10px] font-black tracking-widest text-slate-900 uppercase shadow-xl shadow-[#75EEA5]/20 transition-all hover:scale-105">
            Accounting Ledger Export
          </button>
        </div>
      </div>

      <div className="hidden">
        <div ref={printAllRef} className="print-grid-container">
          <style type="text/css" media="print">
            {`
               @page { size: A4; margin: 0; }
               body { 
                 margin: 0; 
                 padding: 0; 
                 -webkit-print-color-adjust: exact; 
               }
               .print-grid-container {
                 display: grid;
                 grid-template-columns: 1fr 1fr;
                 width: 21cm;
                 gap: 0;
                 margin: 0;
                 padding: 0;
               }
               .PayrollPayslipPrintable {
                 page-break-inside: avoid;
                 box-sizing: border-box;
                 width: 10.5cm;
                 height: 14.85cm;
               }
               .PayrollPayslipPrintable:nth-child(4n) {
                 page-break-after: always;
               }
             `}
          </style>
          {filteredData.map((emp) => (
            <PayrollPayslipComponent key={emp.employee_id} record={emp} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Payroll
