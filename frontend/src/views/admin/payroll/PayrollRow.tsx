import React, { useRef, useMemo } from 'react'
import { useReactToPrint } from 'react-to-print'
import { FileText, Edit2 } from 'lucide-react'
import { type PayrollRecord, type AttendanceDay } from './types'
import PayrollCell from './PayrollCell'
import { PayrollPayslipComponent } from './PayrollPayslipComponent'

interface PayrollRowProps {
  row: PayrollRecord
  weekDates: string[]
  holidays: string[]
  onUpdateDay: (
    empId: string,
    date: string,
    updates: Partial<AttendanceDay>,
  ) => void
  onUpdateRate: (empId: string, rate: number) => void
}

import productionLogsData from '../../../data/production_logs.json'

const PayrollRow: React.FC<PayrollRowProps> = ({
  row,
  weekDates,
  holidays,
  onUpdateDay,
  onUpdateRate,
}) => {
  const payslipRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: payslipRef,
  })

  const employeeLogs = useMemo(() => {
    // 1. Get static logs from JSON
    const staticLogs = productionLogsData.logs || []

    // 2. Get dynamic logs from LocalStorage
    const localLogs = (() => {
      try {
        const saved = localStorage.getItem('pixs_production_logs')
        return saved ? JSON.parse(saved) : []
      } catch {
        return []
      }
    })()

    const allLogs = [...staticLogs, ...localLogs]

    // 3. Filter for this employee AND within this week range
    return allLogs.filter((log) => {
      const isSameEmp = log.user_id === row.employee_id
      const dateStr = log.completed_at.split('T')[0]
      const isWithinWeek = weekDates.includes(dateStr)
      return isSameEmp && isWithinWeek
    })
  }, [row.employee_id, weekDates])

  // Enrich row with logs for the payslip component
  const enrichedRow = { ...row, logs: employeeLogs }

  return (
    <tr className="PayrollRow border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/20">
      <td className="sticky left-0 z-10 w-[300px] bg-white px-6 py-6 shadow-[10px_0_15px_-5px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[22px] border border-slate-700 bg-slate-900 text-sm font-black text-[#75EEA5] shadow-xl shadow-slate-900/10">
            {row.name.charAt(0)}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] font-black tracking-tight text-slate-900 uppercase">
              {row.name}
            </span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-400">
                DAILY:
              </span>
              <div className="group relative">
                <span className="text-[10px] font-black text-slate-900">₱</span>
                <input
                  type="number"
                  value={row.current_rate}
                  onChange={(e) =>
                    onUpdateRate(row.employee_id, parseInt(e.target.value) || 0)
                  }
                  className="PayrollRateInput w-16 rounded border-none bg-transparent p-0 text-[10px] font-black text-slate-900 transition-colors hover:bg-slate-100/50 focus:ring-0"
                />
                <Edit2
                  size={8}
                  className="absolute top-1/2 -right-3 -translate-y-1/2 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
            </div>
          </div>
        </div>
      </td>

      {weekDates.map((dateStr) => (
        <td key={dateStr} className="px-2 py-4">
          <PayrollCell
            dayData={
              row.attendance.find((a) => a.date === dateStr) || {
                date: dateStr,
                status: 'absent',
                applied_rate: 0,
                attendance_percentage: 0,
                overtime_hours: 0,
                late_minutes: 0,
                hours_worked: 0,
                computed_salary: 0,
              }
            }
            currentRate={row.current_rate}
            otRate={row.ot_rate}
            onUpdate={(updates) =>
              onUpdateDay(row.employee_id, dateStr, updates)
            }
            isHoliday={holidays.includes(dateStr)}
          />
        </td>
      ))}

      <td className="px-6 py-4 text-right">
        <div className="flex flex-col items-end pr-2">
          <span className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            AGGREGATE WEEKLY
          </span>
          <span className="text-lg leading-none font-black text-slate-900">
            ₱{row.weekly_total.toLocaleString()}
          </span>
          <span className="mt-1.5 text-[10px] font-black tracking-widest text-emerald-600 uppercase">
            {row.attendance.reduce((sum, d) => sum + (d.hours_worked || 0), 0)}{' '}
            HRS TOTAL
          </span>
        </div>
      </td>

      <td className="px-6 py-4 text-center">
        <button
          onClick={() => handlePrint()}
          className="PayrollPayslipButton rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-600 shadow-sm transition-all hover:border-slate-800 hover:bg-slate-900 hover:text-[#75EEA5] hover:shadow-xl hover:shadow-slate-900/10"
        >
          <FileText size={18} />
        </button>

        <div className="hidden">
          <PayrollPayslipComponent ref={payslipRef} record={enrichedRow} />
        </div>
      </td>
    </tr>
  )
}

export default PayrollRow
