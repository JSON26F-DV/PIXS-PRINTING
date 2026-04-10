import React from 'react';
import { Clock, Check, AlertCircle, Timer } from 'lucide-react';
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
    const appliedRate = (finalStatus !== 'absent') ? currentRate : 0;
    
    // Update hours based on status
    const defaultHours = finalStatus === 'full' ? 8 : finalStatus === 'half' ? 4 : 0;
    const computedSalary = (attendancePercentage * appliedRate) + (dayData.overtime_hours * otRate) - ((dayData.late_minutes / 60) * (appliedRate / 8));

    onUpdate({ 
      status: finalStatus, 
      attendance_percentage: attendancePercentage,
      applied_rate: appliedRate,
      hours_worked: defaultHours,
      computed_salary: Math.max(0, computedSalary)
    });
  };

  const handleOTChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isHoliday || isAbsent) return;
    const hours = Math.min(24, Math.max(0, parseInt(e.target.value) || 0));
    const computedSalary = (dayData.attendance_percentage * dayData.applied_rate) + (hours * otRate) - ((dayData.late_minutes / 60) * (dayData.applied_rate / 8));
    onUpdate({ overtime_hours: hours, computed_salary: Math.max(0, computedSalary) });
  };

  const handleLateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isHoliday || isAbsent) return;
    const mins = Math.max(0, parseInt(e.target.value) || 0);
    const lateDeduction = (mins / 60) * (dayData.applied_rate / 8);
    const computedSalary = (dayData.attendance_percentage * dayData.applied_rate) + (dayData.overtime_hours * otRate) - lateDeduction;
    onUpdate({ late_minutes: mins, computed_salary: Math.max(0, computedSalary) });
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isHoliday || isAbsent) return;
    const hrs = Math.max(0, Math.min(24, parseFloat(e.target.value) || 0));
    onUpdate({ hours_worked: hrs });
  };

  const handleSalaryOverride = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isHoliday || isAbsent) return;
    const newSalary = Math.max(0, parseFloat(e.target.value) || 0);
    onUpdate({ computed_salary: newSalary });
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

      <div className={`w-full flex flex-col gap-1.5 transition-all ${isAbsent ? 'opacity-20 pointer-events-none' : ''}`}>
        {/* Hours Worked */}
        <div className="relative w-[100px] mx-auto">
          <Timer className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
          <input 
            type="number"
            step="0.5"
            value={dayData.hours_worked || ''}
            onChange={handleHoursChange}
            placeholder="Hrs"
            title="Total Hours Worked"
            className="w-full pl-6 pr-1 py-1 bg-white border border-slate-100 rounded text-[10px] font-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-sm"
          />
        </div>
        
        {/* Overtime */}
        <div className="relative w-[100px] mx-auto group">
          <Clock className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none group-focus-within:text-emerald-600 transition-colors" size={10} />
          <select 
            value={dayData.overtime_hours || 0}
            onChange={handleOTChange}
            title="Overtime Hours"
            className="appearance-none w-full pl-6 pr-4 py-1 bg-emerald-50 border border-emerald-100/50 rounded text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/10 shadow-sm text-emerald-700 cursor-pointer"
          >
             <option value={0}>0 OT</option>
             <option value={1}>1 HR OT</option>
             <option value={2}>2 HRS OT</option>
          </select>
        </div>

        {/* Lates (Minutes) */}
        <div className="relative w-[100px] mx-auto group">
          <AlertCircle className="absolute left-2 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none group-focus-within:text-rose-600 transition-colors" size={10} />
          <select 
            value={dayData.late_minutes || 0}
            onChange={handleLateChange}
            title="Late Duration"
            className="appearance-none w-full pl-6 pr-4 py-1 bg-rose-50 border border-rose-100/50 rounded text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-rose-500/10 shadow-sm text-rose-700 cursor-pointer"
          >
             <option value={0}>ON TIME</option>
             <option value={30}>30 MINS</option>
             <option value={60}>1 HOUR</option>
             <option value={90}>1.5 HOURS</option>
             <option value={120}>2 HOURS</option>
             <option value={150}>2.5 HOURS</option>
             <option value={180}>3 HOURS</option>
          </select>
        </div>
      </div>

      <div className="mt-2 text-center relative group w-20 mx-auto">
        {!isAbsent && (
          <>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">₱</span>
            <input 
              type="number"
              value={dayData.computed_salary || ''}
              onChange={handleSalaryOverride}
              className="PayrollComputedSalary w-full pl-3 pr-1 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 rounded text-[10px] font-black text-slate-900 text-center tracking-tight transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              title="Manual Salary Override"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PayrollCell;
