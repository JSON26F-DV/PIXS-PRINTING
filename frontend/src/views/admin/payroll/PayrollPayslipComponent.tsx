import { forwardRef } from 'react';
import { format } from 'date-fns';
import { type PayrollRecord } from './types';

interface PayrollPayslipProps {
  record: PayrollRecord;
}

export const PayrollPayslipComponent = forwardRef<HTMLDivElement, PayrollPayslipProps>(({ record }, ref) => {
  const weekStart = record.attendance[0]?.date || '';
  const weekEnd = record.attendance[record.attendance.length - 1]?.date || '';

  return (
    <div ref={ref} className="PayrollPayslipPrintable p-12 bg-white min-h-[800px] font-sans">
      <div className="flex justify-between items-start border-b-[6px] border-slate-900 pb-10 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">PIXS PRINTING SHOP</h1>
          <p className="text-sm font-bold text-slate-400 mt-2 tracking-[4px] uppercase opacity-70">Unified Personnel Payroll Ledger</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-slate-900 uppercase">OFFICIAL PAYSLIP</p>
          <p className="text-xs font-black text-slate-400 mt-1 uppercase tracking-widest">WID: {record.employee_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 mb-16 px-4">
        <div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Entity Beneficiary</p>
          <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">{record.name}</p>
          <p className="text-xs font-black text-blue-600 mt-1 uppercase tracking-widest">{record.role}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Fiscal Reference Cycle</p>
          <p className="text-sm font-black text-slate-900 mt-1.5 uppercase">
            {weekStart && format(new Date(weekStart), 'MMM dd, yyyy')} — {weekEnd && format(new Date(weekEnd), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="mb-16">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 px-4">Temporal Attendance Audit</p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-100">
              <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Node</th>
              <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Identity</th>
              <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied Rate</th>
              <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">OT Duration</th>
              <th className="p-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Yield</th>
            </tr>
          </thead>
          <tbody>
            {record.attendance.map((day) => (
              <tr key={day.date} className="border-b border-slate-50">
                <td className="p-4 text-[12px] font-black text-slate-900 uppercase tracking-tighter">
                  {format(new Date(day.date), 'EEEE, MMM dd')}
                </td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${day.status === 'full' ? 'bg-emerald-50 text-emerald-600' : day.status === 'half' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-400'}`}>
                    {day.status}
                  </span>
                </td>
                <td className="p-4 text-center text-xs font-black text-slate-900">₱{(day.applied_rate || 0).toLocaleString()}</td>
                <td className="p-4 text-center text-xs font-black text-slate-900">{day.overtime_hours} HRS</td>
                <td className="p-4 text-right text-sm font-black text-slate-900">₱{day.computed_salary.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 h-20 shadow-2xl">
              <td colSpan={4} className="p-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrix Aggregate Yield</td>
              <td className="p-4 text-right text-[28px] font-black text-[#75EEA5] tracking-tighter pr-6 italic uppercase">
                ₱{record.weekly_total.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-20 pt-16 flex justify-between gap-24 px-4">
        <div className="flex-1 border-t-2 border-slate-200 pt-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px] mb-1.5 opacity-60">Entity Acknowledgment</p>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">X</div>
             <div className="h-0.5 flex-1 bg-slate-50" />
          </div>
        </div>
        <div className="flex-1 border-t-2 border-slate-200 pt-4 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px] mb-1.5 opacity-60">Financial Authorization</p>
          <div className="flex items-center justify-end gap-3 italic font-black text-slate-900 text-sm">
             PIXS COMMAND OS
          </div>
        </div>
      </div>

      <div className="mt-24 text-center">
        <div className="inline-block px-10 py-3 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[6px] italic">Automated Fiscal Node • PIXS Enterprise Hub</p>
        </div>
      </div>
    </div>
  );
});

export default PayrollPayslipComponent;
