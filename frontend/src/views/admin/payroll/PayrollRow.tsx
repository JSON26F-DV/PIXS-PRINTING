import React, { useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileText, Edit2 } from 'lucide-react';
import { type PayrollRecord, type AttendanceDay } from './types';
import PayrollCell from './PayrollCell';
import { PayrollPayslipComponent } from './PayrollPayslipComponent';

interface PayrollRowProps {
  row: PayrollRecord;
  weekDates: string[];
  holidays: string[];
  onUpdateDay: (empId: string, date: string, updates: Partial<AttendanceDay>) => void;
  onUpdateRate: (empId: string, rate: number) => void;
}

import productionLogsData from '../../../data/production_logs.json';

const PayrollRow: React.FC<PayrollRowProps> = ({ row, weekDates, holidays, onUpdateDay, onUpdateRate }) => {
  const payslipRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: payslipRef,
  });

  const employeeLogs = useMemo(() => {
    // 1. Get static logs from JSON
    const staticLogs = productionLogsData.logs || [];
    
    // 2. Get dynamic logs from LocalStorage
    const localLogs = (() => {
        try {
            const saved = localStorage.getItem('pixs_production_logs');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    })();

    const allLogs = [...staticLogs, ...localLogs];

    // 3. Filter for this employee AND within this week range
    return allLogs.filter(log => {
        const isSameEmp = log.user_id === row.employee_id;
        const dateStr = log.completed_at.split('T')[0];
        const isWithinWeek = weekDates.includes(dateStr);
        return isSameEmp && isWithinWeek;
    });
  }, [row.employee_id, weekDates]);

  // Enrich row with logs for the payslip component
  const enrichedRow = { ...row, logs: employeeLogs };

  return (
    <tr className="PayrollRow border-b border-slate-50 hover:bg-slate-50/20 last:border-0 transition-colors">
      <td className="px-6 py-6 sticky left-0 bg-white shadow-[10px_0_15px_-5px_rgba(0,0,0,0.02)] z-10 w-[300px]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[22px] bg-slate-900 border border-slate-700 flex items-center justify-center text-[#75EEA5] text-sm font-black shadow-xl shadow-slate-900/10 shrink-0">
            {row.name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-black text-slate-900 uppercase tracking-tight truncate">{row.name}</span>
            <div className="flex items-center gap-1.5 mt-1.5">
               <span className="text-[10px] font-black text-slate-400">DAILY:</span>
               <div className="relative group">
                  <span className="text-[10px] font-black text-slate-900">₱</span>
                  <input 
                    type="number"
                    value={row.current_rate}
                    onChange={(e) => onUpdateRate(row.employee_id, parseInt(e.target.value) || 0)}
                    className="PayrollRateInput w-16 bg-transparent border-none focus:ring-0 text-[10px] font-black text-slate-900 p-0 hover:bg-slate-100/50 rounded transition-colors"
                  />
                  <Edit2 size={8} className="absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
            </div>
          </div>
        </div>
      </td>

      {weekDates.map(dateStr => (
        <td key={dateStr} className="px-2 py-4">
          <PayrollCell 
            dayData={row.attendance.find(a => a.date === dateStr) || { date: dateStr, status: 'absent', applied_rate: 0, attendance_percentage: 0, overtime_hours: 0, computed_salary: 0 }}
            currentRate={row.current_rate}
            otRate={row.ot_rate}
            onUpdate={(updates) => onUpdateDay(row.employee_id, dateStr, updates)}
            isHoliday={holidays.includes(dateStr)}
          />
        </td>
      ))}

      <td className="px-6 py-4 text-right">
        <div className="flex flex-col items-end pr-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AGGREGATE WEEKLY</span>
          <span className="text-lg font-black text-slate-900 leading-none">
            ₱{row.weekly_total.toLocaleString()}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 text-center">
         <button 
           onClick={() => handlePrint()}
           className="PayrollPayslipButton p-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl hover:bg-slate-900 hover:text-[#75EEA5] hover:border-slate-800 transition-all shadow-sm hover:shadow-xl hover:shadow-slate-900/10"
         >
           <FileText size={18} />
         </button>

         <div className="hidden">
           <PayrollPayslipComponent ref={payslipRef} record={enrichedRow} />
         </div>
      </td>
    </tr>
  );
};

export default PayrollRow;
