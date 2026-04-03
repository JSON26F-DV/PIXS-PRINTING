import React from 'react';
import { Clock, Check } from 'lucide-react';
import { type AttendanceDay, type AttendanceStatus } from './types';

interface PayrollCellProps {
  dayData: AttendanceDay;
  currentRate: number;
  otRate: number;
  onUpdate: (updates: Partial<AttendanceDay>) => void;
  isHoliday?: boolean;
}

const PayrollCell: React.FC<PayrollCellProps> = ({ dayData, currentRate, otRate, onUpdate, isHoliday }) => {
  const isAbsent = dayData.status === 'absent';
  const isHalf = dayData.status === 'half';
  const isFull = dayData.status === 'full';

  const handleStatusChange = (newStatus: AttendanceStatus) => {
    // If holiday, disable updates
    if (isHoliday) return;

    // Logic: if changing from absent/none to something, apply CURRENT daily rate
    const finalStatus = (dayData.status === newStatus) ? 'absent' : newStatus;
    const attendancePercentage = finalStatus === 'full' ? 1 : finalStatus === 'half' ? 0.5 : 0;
    
    // Rule: future checks use currentRate; previously kept ones use their own applied_rate
    // In this interaction, "checking" it implies an update, so we use currentRate
    const appliedRate = (finalStatus !== 'absent') ? currentRate : 0;
    const computedSalary = (attendancePercentage * appliedRate) + (dayData.overtime_hours * otRate);

    onUpdate({ 
      status: finalStatus, 
      attendance_percentage: attendancePercentage,
      applied_rate: appliedRate,
      computed_salary: computedSalary
    });
  };

  const handleOTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isHoliday || isAbsent) return;
    const hours = Math.min(24, Math.max(0, parseInt(e.target.value) || 0));
    const computedSalary = (dayData.attendance_percentage * dayData.applied_rate) + (hours * otRate);
    onUpdate({ overtime_hours: hours, computed_salary: computedSalary });
  };

  if (isHoliday) {
    return (
      <div className="PayrollHolidayCell h-full min-h-[90px] flex items-center justify-center bg-rose-50/10 border-x border-slate-50 opacity-40">
        <span className="text-[10px] font-black text-rose-400 rotate-[-45deg] select-none tracking-widest uppercase">Holiday</span>
      </div>
    );
  }

  return (
    <div className={`PayrollCell group relative flex flex-col items-center py-3 min-w-[100px] transition-all rounded-xl ${isAbsent ? 'bg-transparent' : 'bg-slate-50/50'}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <button 
          onClick={() => handleStatusChange('full')}
          className={`PayrollAttendanceCheckbox w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isFull ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          {isFull && <Check size={14} strokeWidth={4} />}
        </button>
        <button 
          onClick={() => handleStatusChange('half')}
          className={`PayrollHalfDayToggle w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-black transition-all ${isHalf ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
        >
          {isHalf ? '½' : 'H'}
        </button>
      </div>

      <div className={`relative w-16 transition-all ${isAbsent ? 'opacity-20 pointer-events-none' : ''}`}>
        <Clock className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
        <input 
          type="number"
          value={dayData.overtime_hours || ''}
          onChange={handleOTChange}
          placeholder="OT"
          className="PayrollOvertimeInput w-full pl-6 pr-1 py-1.5 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-sm"
        />
      </div>

      <div className="mt-2 text-center h-[14px]">
        {!isAbsent && (
          <span className="PayrollComputedSalary text-[10px] font-black text-slate-900 tracking-tight transition-colors">
            ₱{dayData.computed_salary.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default PayrollCell;
