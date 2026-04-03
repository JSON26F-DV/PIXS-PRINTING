import React, { useMemo } from 'react';
import { 
  format, 
  addDays, 
  subWeeks, 
  addWeeks, 
  startOfWeek 
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Coffee, 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle 
} from 'lucide-react';
import { type PayrollRecord, type AttendanceDay } from './types';
import PayrollRow from './PayrollRow';

interface PayrollCalendarProps {
  data: PayrollRecord[];
  currentWeekStart: Date;
  onWeekChange: (date: Date) => void;
  holidays: string[];
  onToggleHoliday: (date: string) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  roleFilter: string;
  setRoleFilter: (r: string) => void;
  sortOption: string;
  setSortOption: (s: string) => void;
  onUpdateDay: (empId: string, date: string, updates: Partial<AttendanceDay>) => void;
  onUpdateRate: (empId: string, rate: number) => void;
}

const PayrollCalendar: React.FC<PayrollCalendarProps> = ({ 
  data, 
  currentWeekStart, 
  onWeekChange, 
  holidays, 
  onToggleHoliday,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  sortOption,
  setSortOption,
  onUpdateDay,
  onUpdateRate
}) => {
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
  }, [currentWeekStart]);

  return (
    <div className="PayrollCalendarContainer space-y-8 animate-in fade-in duration-700">
      {/* 1. TOP NAV: Week Switcher & Unified Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-100">
        <div className="PayrollWeekSwitcher flex items-center gap-6">
           <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 rounded-[22px] shadow-2xl shadow-slate-900/10">
              <button 
                onClick={() => onWeekChange(subWeeks(currentWeekStart, 1))}
                className="PayrollPrevWeekButton p-3 text-white hover:bg-white/10 rounded-[18px] transition-all"
              >
                <ChevronLeft size={20} strokeWidth={4} />
              </button>
              <div className="px-6 flex flex-col items-center select-none">
                 <span className="PayrollWeekLabel text-xs font-black text-[#75EEA5] uppercase tracking-[4px] opacity-70 mb-1">Time Slice Nodes</span>
                 <span className="text-[14px] font-black text-white italic uppercase tracking-tighter">
                   {format(new Date(weekDates[0]), 'MMM dd')} — {format(new Date(weekDates[6]), 'MMM dd, yyyy')}
                 </span>
              </div>
              <button 
                onClick={() => onWeekChange(addWeeks(currentWeekStart, 1))}
                className="PayrollNextWeekButton p-3 text-white hover:bg-white/10 rounded-[18px] transition-all"
              >
                <ChevronRight size={20} strokeWidth={4} />
              </button>
           </div>
        </div>

        <div className="flex items-center gap-4 flex-1 lg:max-w-3xl">
           <div className="PayrollSearchBar relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search unified personnel entity..." 
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[14px] font-black focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-xl shadow-slate-200/40"
              />
           </div>
           
           <div className="PayrollFilterDropdown relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-600 transition-colors" size={14} />
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none pl-10 pr-10 py-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none cursor-pointer hover:bg-slate-50 transition-all shadow-xl shadow-slate-200/40"
              >
                <option value="all text-slate-500">All Roles</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="designer">Designer</option>
                <option value="inventory">Inventory</option>
              </select>
           </div>

           <div className="PayrollSortDropdown relative group">
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-amber-500 transition-colors" size={14} />
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none pl-10 pr-10 py-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none cursor-pointer hover:bg-slate-50 transition-all shadow-xl shadow-slate-200/40"
              >
                <option value="none">Sort Priority</option>
                <option value="salary-desc">Highest Pay</option>
                <option value="salary-asc">Lowest Pay</option>
                <option value="name-asc">A-Z Name</option>
              </select>
           </div>
        </div>
      </div>

      {/* 2. CALENDAR TABLE HEADERS & HOLIDAY TOGGLES */}
      <div className="PayrollCalendarTable bg-white border border-slate-100 rounded-[40px] shadow-2xl shadow-slate-200/40 overflow-hidden mb-12">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-8 text-left sticky left-0 bg-slate-50 shadow-[10px_0_15px_-5px_rgba(0,0,0,0.02)] z-20 w-[300px]">
                   <div className="flex items-center gap-3">
                      <Calendar className="text-slate-900" size={20} />
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">Unified Personnel Hub</span>
                   </div>
                </th>
                
                {weekDates.map(dateStr => {
                  const isHoliday = holidays.includes(dateStr);
                  const dateObj = new Date(dateStr);
                  return (
                    <th key={dateStr} className="px-2 py-8 min-w-[120px]">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-center group">
                          <span className="block text-[11px] font-black text-slate-400 uppercase tracking-[2px]">{format(dateObj, 'EEE')}</span>
                          <span className="block text-[16px] font-black text-slate-900 mt-1">{format(dateObj, 'dd')}</span>
                        </div>
                        
                        <button 
                          onClick={() => onToggleHoliday(dateStr)}
                          className={`PayrollHolidayToggle group relative flex items-center justify-center p-2 rounded-xl transition-all ${isHoliday ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white border border-slate-100 text-slate-300 hover:text-rose-400 hover:border-rose-100'}`}
                        >
                          <Coffee size={14} />
                          <div className="hidden group-hover:block absolute top-[120%] bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                            {isHoliday ? 'Resume Work Node' : 'Enact Company Holiday'}
                          </div>
                        </button>
                      </div>
                    </th>
                  );
                })}

                <th className="px-6 py-8 text-right min-w-[150px]">
                   <div className="flex items-center justify-end gap-2 text-slate-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">AGGREGATE Matrix</span>
                      <AlertTriangle size={14} className="opacity-50" />
                   </div>
                </th>
                
                <th className="px-6 py-8 text-center min-w-[100px]">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Action Node</span>
                </th>
              </tr>
            </thead>
            
            <tbody>
              {data.map(emp => (
                <PayrollRow 
                  key={emp.employee_id} 
                  row={emp} 
                  weekDates={weekDates} 
                  holidays={holidays}
                  onUpdateDay={onUpdateDay}
                  onUpdateRate={onUpdateRate}
                />
              ))}
              
              {data.length === 0 && (
                <tr>
                   <td colSpan={10} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                         <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                            <Search size={32} className="text-slate-400" />
                         </div>
                         <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Personnel Entities Found</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollCalendar;
