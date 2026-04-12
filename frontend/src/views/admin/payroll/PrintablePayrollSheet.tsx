import React from 'react'
import { format } from 'date-fns'
import { type PayrollRecord, type AttendanceDay } from './types'

interface PrintablePayrollSheetProps {
  data: PayrollRecord[]
}

const PrintablePayrollSheet: React.FC<PrintablePayrollSheetProps> = ({
  data,
}) => {
  return (
    <div className="hidden bg-white p-10 print:block">
      <div className="mb-10 flex items-start justify-between border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
            PIXS PRINTING SHOP
          </h1>
          <p className="mt-2 text-sm font-bold tracking-[4px] text-slate-500 uppercase">
            Enterprise Payroll Hub • Unified Registry
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-slate-900">WEEKLY AUDIT</p>
          <p className="mt-1 text-xs font-bold text-slate-400 uppercase">
            Cycle Range: April 2026 Node
          </p>
        </div>
      </div>

      <table className="w-full border-collapse border border-slate-200">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 p-4 text-left text-xs font-black tracking-widest text-slate-400 uppercase">
              Employee Identity
            </th>
            <th className="border border-slate-200 p-4 text-xs font-black tracking-widest text-slate-400 uppercase">
              Daily Breakdown (Mon–Sun)
            </th>
            <th className="border border-slate-200 p-4 text-right text-xs font-black tracking-widest text-slate-400 uppercase">
              Weekly Aggregate
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((emp) => (
            <tr key={emp.employee_id}>
              <td className="border border-slate-200 p-4">
                <p className="text-sm font-black text-slate-900 uppercase">
                  {emp.name}
                </p>
                <p className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {emp.role}
                </p>
              </td>
              <td className="border border-slate-200 p-4">
                <div className="grid grid-cols-7 gap-2">
                  {emp.attendance.map((day: AttendanceDay) => (
                    <div key={day.date} className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-300 uppercase">
                        {format(new Date(day.date), 'EEE')}
                      </span>
                      <span
                        className={`mt-0.5 text-[10px] font-black ${day.status === 'absent' ? 'text-rose-400' : 'text-slate-900'}`}
                      >
                        {day.status === 'full'
                          ? 'P'
                          : day.status === 'half'
                            ? '½'
                            : 'X'}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
              <td className="border border-slate-200 p-4 text-right">
                <span className="text-base font-black text-slate-900">
                  ₱{emp.weekly_total.toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-16 grid grid-cols-2 gap-20 pt-10">
        <div className="border-t-2 border-slate-200 pt-4">
          <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
            Financial Controller Signature
          </p>
        </div>
        <div className="border-t-2 border-slate-200 pt-4 text-right">
          <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
            Personnel Entity Acknowledgment
          </p>
        </div>
      </div>

      <div className="mt-20 text-center">
        <p className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">
          This is a system-generated audit from PIXS OS Payroll Hub
        </p>
      </div>
    </div>
  )
}

export default PrintablePayrollSheet
