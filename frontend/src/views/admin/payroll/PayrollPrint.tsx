import { forwardRef } from 'react'
import { type EmployeeTodayRecord } from './types'

interface PayrollPrintProps {
  employees: EmployeeTodayRecord[]
  date: string
}

export const PayrollPrint = forwardRef<HTMLDivElement, PayrollPrintProps>(({ employees, date }, ref) => {
  // Chunk employees into groups of 4
  const chunks = []
  for (let i = 0; i < employees.length; i += 4) {
    chunks.push(employees.slice(i, i + 4))
  }

  return (
    <div ref={ref} className="hidden print:block bg-white text-slate-900 font-sans">
      <style>{`
        @media print {
          .print-page {
            page-break-after: always !important;
            break-after: page !important;
            height: 297mm !important;
            width: 210mm !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
      {chunks.map((chunk, chunkIdx) => (
        <div 
          key={chunkIdx} 
          className="print-page p-6 grid grid-cols-2 grid-rows-2 gap-6 bg-white overflow-hidden"
          style={{ boxSizing: 'border-box' }}
        >
          {chunk.map((emp) => {
            const basicPay = (emp.status_today === 'full' || emp.status_today === 'present')
              ? emp.daily_rate
              : emp.status_today === 'half'
                ? emp.daily_rate / 2
                : 0

            const lateDeduction = emp.late * (emp.daily_rate / 480)
            const overtimePay = emp.overtime * (emp.daily_rate / 8) * 1.25

            return (
              <div 
                key={emp.id} 
                className="flex flex-col justify-between border border-dashed border-slate-400 p-5 rounded-2xl h-[135mm]"
                style={{ boxSizing: 'border-box' }}
              >
                {/* Header */}
                <div className="border-b border-slate-900 pb-2 flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-black tracking-tight uppercase italic leading-none text-slate-900">PIXS PRINTING</h2>
                    <span className="text-[7px] font-bold text-slate-400 tracking-wider">OFFICIAL PAYSLIP</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black block leading-none text-slate-900">ID: {emp.id}</span>
                    <span className="text-[6px] font-medium text-slate-400">{date}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="my-2">
                  <span className="text-[7px] font-black tracking-widest text-slate-400 uppercase">Beneficiary</span>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-base font-black tracking-tight leading-none uppercase text-slate-900">{emp.name}</h3>
                      <span className="text-[8px] font-black text-indigo-600 uppercase">{emp.role}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[6px] font-black text-slate-400 block tracking-widest uppercase">Daily Rate</span>
                      <span className="text-[10px] font-black text-slate-900">₱{emp.daily_rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="flex-1 my-2 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-y border-slate-900">
                        <th className="py-1 text-[6px] font-black uppercase text-slate-700">Description</th>
                        <th className="py-1 text-center text-[6px] font-black uppercase text-slate-700">Hrs/Min</th>
                        <th className="py-1 text-right text-[6px] font-black uppercase text-slate-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 text-[7px] font-medium uppercase text-slate-800">
                          Basic Salary ({emp.status_today})
                        </td>
                        <td className="py-1 text-center text-[7px] font-black text-slate-800">
                          {emp.hours_worked || 0} hrs
                        </td>
                        <td className="py-1 text-right text-[7px] font-black text-slate-900">
                          ₱{basicPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {emp.holiday_type !== 'none' && emp.holiday_pay > 0 && (
                        <tr className="border-b border-slate-100">
                          <td className="py-1 text-[7px] font-medium uppercase text-purple-600">
                            Holiday Pay ({emp.holiday_type.replace('_', ' ')})
                          </td>
                          <td className="py-1 text-center text-[7px] font-black text-purple-600">-</td>
                          <td className="py-1 text-right text-[7px] font-black text-purple-600">
                            ₱{emp.holiday_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      {overtimePay > 0 && (
                        <tr className="border-b border-slate-100">
                          <td className="py-1 text-[7px] font-medium uppercase text-emerald-600">Overtime Pay</td>
                          <td className="py-1 text-center text-[7px] font-black text-emerald-600">{emp.overtime} hrs</td>
                          <td className="py-1 text-right text-[7px] font-black text-emerald-600">
                            ₱{overtimePay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      {lateDeduction > 0 && (
                        <tr className="border-b border-slate-100">
                          <td className="py-1 text-[7px] font-medium uppercase text-rose-500">Late Deduction</td>
                          <td className="py-1 text-center text-[7px] font-black text-rose-500">{emp.late} min</td>
                          <td className="py-1 text-right text-[7px] font-black text-rose-500">
                            -₱{lateDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer and Signatures */}
                <div className="border-t border-slate-900 pt-2">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-[6px] font-black text-slate-400 block tracking-widest uppercase">Hours Worked</span>
                      <span className="text-[10px] font-black text-slate-700">{emp.hours_worked || 0} HRS</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[6px] font-black text-slate-400 block tracking-widest uppercase">Net Salary</span>
                      <span className="text-sm font-black text-emerald-600 italic">₱{emp.total_earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-center px-2 pt-1">
                    <div>
                      <div className="w-14 border-b border-slate-300 mb-0.5"></div>
                      <span className="text-[5px] font-black tracking-widest text-slate-400 uppercase">Authorized Signature</span>
                    </div>
                    <div>
                      <div className="w-14 border-b border-slate-300 mb-0.5"></div>
                      <span className="text-[5px] font-black tracking-widest text-slate-400 uppercase">Received By</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
})

export default PayrollPrint
