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
    <div ref={ref} className="PayrollPayslipPrintable bg-white w-full border-[1px] border-slate-900 border-dashed p-6 flex flex-col overflow-hidden relative">
      <div className="flex justify-between items-center border-b-[2px] border-slate-900 pb-2 mb-2">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic leading-none">PIXS PRINTING</h1>
          <p className="text-[7px] font-bold text-slate-500 mt-0.5 tracking-[2px] uppercase">Official Payslip</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-900 uppercase leading-none">WID: {record.employee_id}</p>
          <p className="text-[7px] font-bold text-slate-500 uppercase mt-0.5">
            {weekStart && format(new Date(weekStart), 'MMM dd')} - {weekEnd && format(new Date(weekEnd), 'MMM dd, yy')}
          </p>
        </div>
      </div>

      <div className="mb-2">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Beneficiary</p>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{record.name}</p>
            <p className="text-[9px] font-black text-blue-600 uppercase mt-1">{record.role}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Base Daily Rate</p>
            <p className="text-xs font-black text-slate-900">₱{record.current_rate.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col pt-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y-[1px] border-slate-900">
              <th className="py-1 text-left text-[7px] font-black text-slate-900 uppercase tracking-widest">Date</th>
              <th className="py-1 text-center text-[7px] font-black text-slate-900 uppercase tracking-widest">Type</th>
              <th className="py-1 text-center text-[7px] font-black text-slate-900 uppercase tracking-widest">Hrs</th>
              <th className="py-1 text-center text-[7px] font-black text-slate-900 uppercase tracking-widest">Lat/OT</th>
              <th className="py-1 text-right text-[7px] font-black text-slate-900 uppercase tracking-widest">Amt</th>
            </tr>
          </thead>
          <tbody>
            {record.attendance.map((day) => {
              if (day.status === 'absent') return null; // hide absents to save space on receipt
              return (
                 <tr key={day.date} className="border-b border-slate-100">
                   <td className="py-1 text-[8px] font-black text-slate-800 uppercase">
                     {format(new Date(day.date), 'MM/dd')}
                   </td>
                   <td className="py-1 text-center text-[7px] font-black uppercase text-slate-500">
                     {day.status}
                   </td>
                   <td className="py-1 text-center text-[8px] font-black text-slate-800">{day.hours_worked || 0}</td>
                   <td className="py-1 text-center text-[7px] font-black">
                     <span className="text-emerald-600 mr-1">+{day.overtime_hours}</span>
                     <span className="text-rose-500">-{day.late_minutes}m</span>
                   </td>
                   <td className="py-1 text-right text-[9px] font-black text-slate-900">₱{day.computed_salary.toLocaleString()}</td>
                 </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-auto">
        <div className="border-t-[1px] border-slate-900 pt-2 flex justify-between items-end mb-2">
          <div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Hours</p>
            <p className="text-xs font-black text-slate-700 leading-none mt-0.5">{record.attendance.reduce((sum, d) => sum + (d.hours_worked || 0), 0)} HRS</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Net Pay</p>
            <p className="text-lg font-black text-[#75EEA5] drop-shadow-sm leading-none italic">
              ₱{record.weekly_total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Professional Notes */}
        <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 mb-3">
          <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Professional Notes</p>
          <p className="text-[6px] font-medium text-slate-600 italic leading-tight">Please review thoroughly. By affixing your signature, you confirm the accuracy of the computed data.</p>
        </div>
        
        {/* Signatures */}
        <div className="flex justify-between items-center px-4 w-full">
           <div className="flex flex-col items-center">
              <div className="w-20 h-4 border-b border-slate-300 mb-1"></div>
              <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">HR Auth</p>
           </div>
           
           <div className="flex flex-col items-center">
              <div className="w-20 h-4 border-b border-slate-300 mb-1"></div>
              <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Received By</p>
           </div>
        </div>

        <div className="text-center mt-2 border-t border-slate-100 pt-1.5">
          <p className="text-[5px] font-black text-slate-300 uppercase tracking-widest italic leading-none">PIXS HUB</p>
        </div>
      </div>
    </div>
  );
});

export default PayrollPayslipComponent;
