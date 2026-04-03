import React from 'react';
import { format } from 'date-fns';
import { type PayrollRecord, type AttendanceDay } from './types';

interface PrintablePayrollSheetProps {
  data: PayrollRecord[];
}

const PrintablePayrollSheet: React.FC<PrintablePayrollSheetProps> = ({ data }) => {
  return (
    <div className="hidden print:block p-10 bg-white">
      <div className="flex justify-between items-start mb-10 pb-6 border-b-4 border-slate-900">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">PIXS PRINTING SHOP</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-[4px] mt-2">Enterprise Payroll Hub • Unified Registry</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-slate-900">WEEKLY AUDIT</p>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Cycle Range: April 2026 Node</p>
        </div>
      </div>

      <table className="w-full border-collapse border border-slate-200">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 p-4 text-left text-xs font-black uppercase text-slate-400 tracking-widest">Employee Identity</th>
            <th className="border border-slate-200 p-4 text-xs font-black uppercase text-slate-400 tracking-widest">Daily Breakdown (Mon–Sun)</th>
            <th className="border border-slate-200 p-4 text-right text-xs font-black uppercase text-slate-400 tracking-widest">Weekly Aggregate</th>
          </tr>
        </thead>
        <tbody>
          {data.map(emp => (
            <tr key={emp.employee_id}>
              <td className="border border-slate-200 p-4">
                <p className="text-sm font-black text-slate-900 uppercase">{emp.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{emp.role}</p>
              </td>
              <td className="border border-slate-200 p-4">
                <div className="grid grid-cols-7 gap-2">
                  {emp.attendance.map((day: AttendanceDay) => (
                    <div key={day.date} className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-300 uppercase">{format(new Date(day.date), 'EEE')}</span>
                      <span className={`text-[10px] font-black mt-0.5 ${day.status === 'absent' ? 'text-rose-400' : 'text-slate-900'}`}>
                        {day.status === 'full' ? 'P' : day.status === 'half' ? '½' : 'X'}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
              <td className="border border-slate-200 p-4 text-right">
                <span className="text-base font-black text-slate-900">₱{emp.weekly_total.toLocaleString()}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-16 pt-10 grid grid-cols-2 gap-20">
        <div className="border-t-2 border-slate-200 pt-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Financial Controller Signature</p>
        </div>
        <div className="border-t-2 border-slate-200 pt-4 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Personnel Entity Acknowledgment</p>
        </div>
      </div>

      <div className="mt-20 text-center">
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">This is a system-generated audit from PIXS OS Payroll Hub</p>
      </div>
    </div>
  );
};

export default PrintablePayrollSheet;
