import React, { useState, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Download,
  CreditCard,
  Search,
  Users,
  Settings2,
  Coffee,
  Zap
} from 'lucide-react';
import { 
  format, 
  isToday,
  addWeeks,
  subWeeks,
  isSameDay,
  addDays,
  startOfISOWeek,
  endOfISOWeek
} from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { motion as M, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { usePermissions } from '../../hooks/usePermissions';
import type { Employee, AttendanceLog } from '../../types';
import attendanceData from '../../data/attendance.json';
import usersData from '../../data/users.json';

interface AttendancePillProps {
  status: string;
  isHalfDay: boolean;
  isHoliday: boolean;
}

const AttendancePill: React.FC<AttendancePillProps> = ({ status, isHalfDay, isHoliday }) => {
  if (isHoliday) return <div className="px-2 py-0.5 rounded-full bg-indigo-50 text-[8px] font-black text-indigo-500 uppercase tracking-tighter border border-indigo-100 italic">Holiday Pay</div>;
  if (isHalfDay) return <div className="px-2 py-0.5 rounded-full bg-amber-50 text-[8px] font-black text-amber-500 uppercase tracking-tighter border border-amber-100">Half Day</div>;
  
  const styles: Record<string, string> = {
    'Present': 'bg-pixs-mint/10 text-pixs-mint border-pixs-mint/20',
    'Absent': 'bg-rose-50 text-rose-500 border-rose-100',
    'Late': 'bg-amber-50 text-amber-600 border-amber-100',
    'Pending': 'bg-slate-50 text-slate-400 border-slate-100'
  };

  return (
    <div className={clsx("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border", styles[status] || styles['Pending'])}>
      {status}
    </div>
  );
};

interface WeeklySummaryPrintProps {
  weekData: ProcessedItem[];
  period: { start: Date; end: Date };
  stats: { totalPayout: number; totalOT: number; attendanceRate: number };
}

interface ProcessedItem {
  employee: Employee;
  logs: AttendanceLog[];
  stats: { daysPresent: number; halfDays: number; otHours: number; holidayPay: number };
  netPay: number;
}

const WeeklySummaryPrint = React.forwardRef<HTMLDivElement, WeeklySummaryPrintProps>(({ weekData, period, stats }, ref) => {
  return (
    <div ref={ref} className="p-12 bg-white text-slate-900 font-sans max-w-[1000px] mx-auto">
      <div className="flex justify-between items-end border-b-4 border-slate-900 pb-8 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-slate-900 flex items-center justify-center rounded-xl font-bold text-pixs-mint text-2xl">P</div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Pixs Shop OS</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-1">Enterprise Payroll Division</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Weekly Payroll Summary</h2>
          <p className="font-mono text-sm font-bold text-pixs-mint bg-slate-900 px-4 py-1.5 inline-block rounded-lg uppercase tracking-tighter mt-2">
            {format(period.start, 'MMM dd')} — {format(period.end, 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payout</p>
          <p className="text-2xl font-mono font-black text-slate-900">₱{stats.totalPayout.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">OT Remuneration</p>
          <p className="text-2xl font-mono font-black text-pixs-mint">₱{stats.totalOT.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Staff</p>
          <p className="text-2xl font-mono font-black text-slate-900">{weekData.length}</p>
        </div>
        <div className="p-6 bg-pixs-mint rounded-2xl border border-pixs-mint shadow-xl shadow-pixs-mint/20">
          <p className="text-[9px] font-black text-slate-900/40 uppercase tracking-widest mb-1">Attendance Rate</p>
          <p className="text-2xl font-mono font-black text-slate-900">{stats.attendanceRate}%</p>
        </div>
      </div>

      <table className="w-full mb-12">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
            <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Present</th>
            <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Half Days</th>
            <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">OT Hrs</th>
            <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Rate</th>
            <th className="text-right py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">Net Pay</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {weekData.map(item => (
            <tr key={item.employee.id}>
              <td className="py-5">
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.employee.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.employee.role}</p>
              </td>
              <td className="py-5 text-right font-mono text-sm font-bold">{item.stats.daysPresent}</td>
              <td className="py-5 text-right font-mono text-sm font-bold">{item.stats.halfDays}</td>
              <td className="py-5 text-right font-mono text-sm font-bold">{item.stats.otHours}</td>
              <td className="py-5 text-right font-mono text-sm text-slate-400">₱{item.employee.daily_rate.toLocaleString()}</td>
              <td className="py-5 text-right font-mono text-lg font-black text-slate-900">₱{item.netPay.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center pt-10 border-t border-slate-100">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Certified Correct By:</p>
          <div className="w-64 h-px bg-slate-900 mb-2" />
          <p className="text-xs font-black uppercase italic grayscale opacity-60">Admin / Operations Lead</p>
        </div>
        <div className="text-right text-[8px] text-slate-300 font-black uppercase tracking-[5px]">
          Confidential Enterprise Document • {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
        </div>
      </div>
    </div>
  );
});

const PayrollAttendance: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfISOWeek(new Date()));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [attendance, setAttendance] = useState<AttendanceLog[]>(attendanceData as unknown as AttendanceLog[]);
  const [employeesState, setEmployeesState] = useState<Employee[]>(usersData.employees as unknown as Employee[]);
  const [isHolidayMode, setIsHolidayMode] = useState<boolean>(false);
  const [holidays, setHolidays] = useState<string[]>([]); // List of dates as strings 'yyyy-MM-dd'
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  const { isAdmin } = usePermissions();

  // Print Refs
  const weeklySummaryRef = useRef<HTMLDivElement>(null);
  const handlePrintSummary = useReactToPrint({
    contentRef: weeklySummaryRef,
  });

  // Week Helpers
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const weekEnd = endOfISOWeek(currentWeekStart);

  // Stats Logic
  const processedData = useMemo<ProcessedItem[]>(() => {
    const startStr = format(currentWeekStart, 'yyyy-MM-dd');
    const endStr = format(weekEnd, 'yyyy-MM-dd');

    return employeesState.filter(emp => 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(emp => {
      const logs = attendance.filter(a => a.employee_id === emp.id && a.date >= startStr && a.date <= endStr);
      
      const daysPresent = logs.filter(l => (l.status === 'Present' || l.status === 'Late') && !l.is_half_day).length;
      const halfDays = logs.filter(l => l.is_half_day && (l.status === 'Present' || l.status === 'Late')).length;
      const otHours = logs.reduce((sum, l) => sum + (l.ot_hours || 0), 0);
      
      // Holiday calculations
      const weekHolidays = holidays.filter(h => h >= startStr && h <= endStr).length;
      
      const basicPay = (daysPresent * emp.daily_rate) + (halfDays * 0.5 * emp.daily_rate);
      const otPay = otHours * emp.ot_rate;
      const holidayPay = weekHolidays * emp.daily_rate; // Paid holiday logic
      
      const netPay = basicPay + otPay + holidayPay;

      return {
        employee: emp,
        logs,
        stats: { daysPresent, halfDays, otHours, holidayPay },
        netPay
      };
    });
  }, [currentWeekStart, weekEnd, searchQuery, attendance, employeesState, holidays]);

  const summaryStats = useMemo(() => {
    const totalPayout = processedData.reduce((sum, item) => sum + item.netPay, 0);
    const totalOT = processedData.reduce((sum, item) => sum + (item.stats.otHours * item.employee.ot_rate), 0);
    const presentCount = processedData.reduce((sum, item) => sum + item.stats.daysPresent + (item.stats.halfDays ? 0.5 : 0), 0);
    const totalPossibleDays = processedData.length * 7;
    const attendanceRate = totalPossibleDays > 0 ? Math.round((presentCount / totalPossibleDays) * 100) : 0;

    return { totalPayout, totalOT, attendanceRate };
  }, [processedData]);

  // Actions
  const handleToggleHoliday = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    if (holidays.includes(dStr)) {
      setHolidays(holidays.filter(h => h !== dStr));
    } else {
      setHolidays([...holidays, dStr]);
    }
  };

  const markAllPresent = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const newLogs = [...attendance];
    
    employeesState.forEach(emp => {
      const existingIdx = newLogs.findIndex(l => l.employee_id === emp.id && l.date === dateStr);
      if (existingIdx === -1) {
        newLogs.push({
          id: `ATT-${dateStr}-${emp.id}`,
          employee_id: emp.id,
          date: dateStr,
          status: 'Present',
          is_half_day: false,
          ot_hours: 0,
          is_holiday: holidays.includes(dateStr)
        });
      } else {
        newLogs[existingIdx] = { ...newLogs[existingIdx], status: 'Present', is_half_day: false };
      }
    });

    setAttendance(newLogs);
  };

  const updateAttendance = (empId: string, date: Date, updates: Partial<AttendanceLog>) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingIdx = attendance.findIndex(l => l.employee_id === empId && l.date === dateStr);
    
    if (existingIdx > -1) {
      const newAttendance = [...attendance];
      newAttendance[existingIdx] = { ...newAttendance[existingIdx], ...updates };
      setAttendance(newAttendance);
    } else {
      setAttendance([...attendance, {
        id: `ATT-${dateStr}-${empId}`,
        employee_id: empId,
        date: dateStr,
        status: 'Present',
        is_half_day: false,
        ot_hours: 0,
        is_holiday: false,
        ...updates
      } as AttendanceLog]);
    }
  };

  const updateRate = (empId: string, newRate: string) => {
    setEmployeesState(employeesState.map(emp => 
      emp.id === empId ? { ...emp, daily_rate: parseInt(newRate) || 0 } : emp
    ));
  };

  const nextWeek = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setCurrentWeekStart(addWeeks(currentWeekStart, 1));
      setIsCalculating(false);
    }, 400);
  };

  const prevWeek = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setCurrentWeekStart(subWeeks(currentWeekStart, 1));
      setIsCalculating(false);
    }, 400);
  };

  const parseISO = (str: string) => new Date(str);

  return (
    <div className="space-y-8 pb-20">
      {/* Search & Period Header */}
      <div className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md pt-2 pb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 max-w-xl relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-pixs-mint transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search Intelligence (Name, ID, Department)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pixs-mint/20 focus:border-pixs-mint transition-all font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-2">
          <button onClick={prevWeek} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400 active:scale-90">
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 text-center min-w-[180px]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mb-0.5">Payroll Cycle</p>
            <p className="text-xs font-mono font-black text-slate-900">
              {format(currentWeekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd')}
            </p>
          </div>
          <button onClick={nextWeek} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400 active:scale-90">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={handlePrintSummary}
              className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-[2px] rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              <Download size={18} className="text-pixs-mint" />
              Export Week
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setIsHolidayMode(!isHolidayMode)}
              className={clsx(
                "p-4 rounded-2xl border transition-all shadow-sm active:scale-95 flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                isHolidayMode ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Settings2 size={18} />
              {isHolidayMode ? "Exit Config" : "Event Mode"}
            </button>
          )}
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <M.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Projected Payout</p>
            <h4 className="text-3xl font-mono font-black text-slate-900 tracking-tighter">
              ₱{summaryStats.totalPayout.toLocaleString()}
            </h4>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
            <CreditCard size={28} />
          </div>
        </M.div>

        <M.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-900/10 flex items-center justify-between border border-slate-800"
        >
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Total OT Overhead</p>
            <h4 className="text-3xl font-mono font-black text-pixs-mint tracking-tighter">
              ₱{summaryStats.totalOT.toLocaleString()}
            </h4>
          </div>
          <div className="p-4 bg-slate-800 rounded-2xl text-pixs-mint shadow-lg shadow-pixs-mint/10">
            <Zap size={28} />
          </div>
        </M.div>

        <M.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Cycle Health</p>
            <div className="flex items-end gap-2">
              <h4 className="text-3xl font-mono font-black text-slate-900 tracking-tighter">{summaryStats.attendanceRate}%</h4>
              <p className="text-[10px] font-bold text-pixs-mint uppercase tracking-widest mb-1">Attendance</p>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-[6px] border-slate-50 border-r-pixs-mint flex items-center justify-center -rotate-45">
            <Users size={24} className="text-slate-300 rotate-45" />
          </div>
        </M.div>
      </div>

      {/* Enterprise Attendance Grid */}
      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-[300px_1fr] border-b border-slate-100 bg-slate-50/50">
          <div className="p-6 border-r border-slate-100 flex items-center gap-2">
            <User size={14} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Intelligence</span>
          </div>
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {weekDays.map(day => (
              <div key={day.toString()} className="p-4 text-center relative group">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{format(day, 'EEE')}</p>
                <p className={clsx(
                  "text-xs font-mono font-black",
                  isToday(day) ? "text-pixs-mint" : "text-slate-900"
                )}>{format(day, 'dd')}</p>
                
                {holidays.includes(format(day, 'yyyy-MM-dd')) && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Coffee size={10} className="text-indigo-400" />
                  </div>
                )}

                {isHolidayMode && isAdmin ? (
                  <button 
                    onClick={() => handleToggleHoliday(day)}
                    className={clsx(
                      "mt-2 text-[8px] font-black uppercase tracking-tighter w-full py-1 rounded-full border transition-all",
                      holidays.includes(format(day, 'yyyy-MM-dd')) ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-200 text-slate-400 hover:border-pixs-mint"
                    )}
                  >
                    Set Event
                  </button>
                ) : isAdmin ? (
                  <button 
                    onClick={() => markAllPresent(day)}
                    className="mt-2 text-[7px] font-black uppercase text-slate-300 hover:text-pixs-mint transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Mark All
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 divide-y divide-slate-50">
          <AnimatePresence mode='popLayout'>
            {isCalculating ? (
              <div className="p-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-pixs-mint animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[5px]">Recalculating Shifts</p>
              </div>
            ) : processedData.map(item => (
              <div key={item.employee.id} className="grid grid-cols-[300px_1fr] hover:bg-slate-50/50 transition-all group overflow-hidden">
                <div className="p-6 border-r border-slate-100 bg-white relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                        {item.employee.name[0]}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.employee.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.employee.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono font-black text-slate-900 leading-none">₱{item.netPay.toLocaleString()}</p>
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-tighter mt-1">Est. Week</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5 flex justify-between">
                        Daily Rate 
                        {isAdmin && <span className="text-pixs-mint opacity-100 group-hover:scale-110 transition-transform">Editable</span>}
                      </p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">₱</span>
                        <input 
                          type="number"
                          value={item.employee.daily_rate}
                          onChange={(e) => updateRate(item.employee.id, e.target.value)}
                          disabled={!isAdmin}
                          className={clsx(
                            "w-full pl-6 pr-3 py-2 border rounded-xl text-xs font-mono font-black outline-none transition-all",
                            isAdmin ? "bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-pixs-mint/20 focus:border-pixs-mint" : "bg-transparent border-transparent text-slate-500 cursor-not-allowed"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-7 divide-x divide-slate-100">
                  {weekDays.map(day => {
                    const log = item.logs.find(l => isSameDay(parseISO(l.date), day)) || { status: 'Pending', ot_hours: 0, is_half_day: false };
                    const isHoliday = holidays.includes(format(day, 'yyyy-MM-dd'));
                    
                    return (
                      <div key={day.toString()} className="p-4 flex flex-col gap-3 group/cell">
                        <button 
                          disabled={isHoliday || !isAdmin}
                          onClick={() => {
                            const statuses: AttendanceLog['status'][] = ['Present', 'Late', 'Absent', 'Pending'];
                            const next = statuses[(statuses.indexOf(log.status as AttendanceLog['status']) + 1) % statuses.length];
                            updateAttendance(item.employee.id, day, { status: next });
                          }}
                          className={clsx(
                            "w-full py-1 rounded-lg transition-all active:scale-95 text-center",
                            (isHoliday || !isAdmin) && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          <AttendancePill status={log.status} isHalfDay={log.is_half_day} isHoliday={isHoliday} />
                        </button>
                        
                        {(log.status === 'Present' || log.status === 'Late') && !isHoliday && (
                          <div className="space-y-2">
                            <div className={clsx("flex items-center gap-1 p-1 rounded-lg", isAdmin ? "bg-slate-50" : "opacity-50 pointer-events-none")}>
                              <span className="text-[8px] font-black text-slate-400 uppercase ml-1">OT</span>
                              <input 
                                type="number"
                                step="0.5"
                                value={log.ot_hours || 0}
                                disabled={!isAdmin}
                                onChange={(e) => updateAttendance(item.employee.id, day, { ot_hours: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent border-none text-[10px] font-mono font-black text-pixs-mint text-right focus:ring-0 p-0 disabled:text-slate-400"
                              />
                            </div>
                            {isAdmin && (
                              <button 
                                onClick={() => updateAttendance(item.employee.id, day, { is_half_day: !log.is_half_day })}
                                className={clsx(
                                  "w-full py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all",
                                  log.is_half_day ? "bg-amber-500 border-amber-500 text-white" : "border-slate-100 text-slate-300 hover:text-amber-500"
                                )}
                              >
                                Half?
                              </button>
                            )}
                          </div>
                        )}
                        
                        {isHoliday && (
                          <div className="flex-1 flex items-center justify-center opacity-40">
                            <Coffee size={14} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Hidden Print Area */}
      <div className="hidden">
        <WeeklySummaryPrint 
          ref={weeklySummaryRef} 
          weekData={processedData} 
          period={{ start: currentWeekStart, end: weekEnd }}
          stats={summaryStats}
        />
      </div>
    </div>
  );
};

export default PayrollAttendance;
