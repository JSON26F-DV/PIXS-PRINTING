import { forwardRef } from 'react'
import { format } from 'date-fns'
import { type PayrollRecord } from './types'

interface PayrollPayslipProps {
  record: PayrollRecord
}

export const PayrollPayslipComponent = forwardRef<
  HTMLDivElement,
  PayrollPayslipProps
>(({ record }, ref) => {
  const weekStart = record.attendance[0]?.date || ''
  const weekEnd = record.attendance[record.attendance.length - 1]?.date || ''

  return (
    <div
      ref={ref}
      className="PayrollPayslipPrintable relative flex w-full flex-col overflow-hidden border-[1px] border-dashed border-slate-900 bg-white p-6"
    >
      <div className="mb-2 flex items-center justify-between border-b-[2px] border-slate-900 pb-2">
        <div>
          <h1 className="text-lg leading-none font-black tracking-tighter text-slate-900 uppercase italic">
            PIXS PRINTING
          </h1>
          <p className="mt-0.5 text-[7px] font-bold tracking-[2px] text-slate-500 uppercase">
            Official Payslip
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] leading-none font-black text-slate-900 uppercase">
            WID: {record.employee_id}
          </p>
          <p className="mt-0.5 text-[7px] font-bold text-slate-500 uppercase">
            {weekStart && format(new Date(weekStart), 'MMM dd')} -{' '}
            {weekEnd && format(new Date(weekEnd), 'MMM dd, yy')}
          </p>
        </div>
      </div>

      <div className="mb-2">
        <p className="mb-0.5 text-[8px] font-black tracking-widest text-slate-400 uppercase">
          Beneficiary
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg leading-none font-black tracking-tight text-slate-900 uppercase">
              {record.name}
            </p>
            <p className="mt-1 text-[9px] font-black text-blue-600 uppercase">
              {record.role}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-0.5 text-[8px] font-black tracking-widest text-slate-400 uppercase">
              Base Daily Rate
            </p>
            <p className="text-xs font-black text-slate-900">
              ₱{record.current_rate.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y-[1px] border-slate-900">
              <th className="py-1 text-left text-[7px] font-black tracking-widest text-slate-900 uppercase">
                Date
              </th>
              <th className="py-1 text-center text-[7px] font-black tracking-widest text-slate-900 uppercase">
                Type
              </th>
              <th className="py-1 text-center text-[7px] font-black tracking-widest text-slate-900 uppercase">
                Hrs
              </th>
              <th className="py-1 text-center text-[7px] font-black tracking-widest text-slate-900 uppercase">
                Lat/OT
              </th>
              <th className="py-1 text-right text-[7px] font-black tracking-widest text-slate-900 uppercase">
                Amt
              </th>
            </tr>
          </thead>
          <tbody>
            {record.attendance.map((day) => {
              if (day.status === 'absent') return null // hide absents to save space on receipt
              return (
                <tr key={day.date} className="border-b border-slate-100">
                  <td className="py-1 text-[8px] font-black text-slate-800 uppercase">
                    {format(new Date(day.date), 'MM/dd')}
                  </td>
                  <td className="py-1 text-center text-[7px] font-black text-slate-500 uppercase">
                    {day.status}
                  </td>
                  <td className="py-1 text-center text-[8px] font-black text-slate-800">
                    {day.hours_worked || 0}
                  </td>
                  <td className="py-1 text-center text-[7px] font-black">
                    <span className="mr-1 text-emerald-600">
                      +{day.overtime_hours}
                    </span>
                    <span className="text-rose-500">-{day.late_minutes}m</span>
                  </td>
                  <td className="py-1 text-right text-[9px] font-black text-slate-900">
                    ₱{day.computed_salary.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-auto">
        <div className="mb-2 flex items-end justify-between border-t-[1px] border-slate-900 pt-2">
          <div>
            <p className="text-[7px] font-black tracking-widest text-slate-400 uppercase">
              Total Hours
            </p>
            <p className="mt-0.5 text-xs leading-none font-black text-slate-700">
              {record.attendance.reduce(
                (sum, d) => sum + (d.hours_worked || 0),
                0,
              )}{' '}
              HRS
            </p>
          </div>
          <div className="text-right">
            <p className="mb-0.5 text-[7px] font-black tracking-widest text-slate-400 uppercase">
              Net Pay
            </p>
            <p className="text-lg leading-none font-black text-[#75EEA5] italic drop-shadow-sm">
              ₱{record.weekly_total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Professional Notes */}
        <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
          <p className="mb-0.5 text-[6px] font-black tracking-widest text-slate-400 uppercase">
            Professional Notes
          </p>
          <p className="text-[6px] leading-tight font-medium text-slate-600 italic">
            Please review thoroughly. By affixing your signature, you confirm
            the accuracy of the computed data.
          </p>
        </div>

        {/* Signatures */}
        <div className="flex w-full items-center justify-between px-4">
          <div className="flex flex-col items-center">
            <div className="mb-1 h-4 w-20 border-b border-slate-300"></div>
            <p className="text-[6px] font-black tracking-widest text-slate-400 uppercase">
              HR Auth
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-1 h-4 w-20 border-b border-slate-300"></div>
            <p className="text-[6px] font-black tracking-widest text-slate-400 uppercase">
              Received By
            </p>
          </div>
        </div>

        <div className="mt-2 border-t border-slate-100 pt-1.5 text-center">
          <p className="text-[5px] leading-none font-black tracking-widest text-slate-300 uppercase italic">
            PIXS HUB
          </p>
        </div>
      </div>
    </div>
  )
})

export default PayrollPayslipComponent
