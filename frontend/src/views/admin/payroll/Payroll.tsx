import React, { useState, useMemo, useCallback } from 'react';
import { 
  format, 
  startOfWeek 
} from 'date-fns';
import _ from 'lodash';

// Modular Imports
import { PayrollSystemHeader } from './PayrollSystemHeader';
import PayrollCalendar from './PayrollCalendar';
import PayrollAnalytics from './PayrollAnalytics';
import { 
  type PayrollRecord, 
  type AttendanceDay, 
  type WeeklySalaryData,
  generateEmptyWeek 
} from './types';

// Data Mock
import usersData from '../../../data/users.json';
import initialSalaryData from '../../../data/salary.json';
import { useAuth } from '../../../context/AuthContext';

interface UserDataEmployee {
  id: string;
  name: string;
  role: string;
  daily_rate?: number;
  ot_rate?: number;
}

const Payroll: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State Management
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeek(new Date('2026-03-30'), { weekStartsOn: 1 }));
  const [holidays, setHolidays] = useState<string[]>([]);
  
  // Weekly Vault State (Simulated Persistent Store)
  const [weeklyVault, setWeeklyVault] = useState<Record<string, Record<string, AttendanceDay[]>>>(() => {
    const vault: Record<string, Record<string, AttendanceDay[]>> = {};
    (initialSalaryData as WeeklySalaryData[]).forEach(s => {
      if (!vault[s.week_start]) vault[s.week_start] = {};
      vault[s.week_start][s.employee_id] = s.attendance;
    });
    return vault;
  });

  // Current Individual Rates (Internal Admin Cache)
  const [employeeRates, setEmployeeRates] = useState<Record<string, number>>(() => {
    const rates: Record<string, number> = {};
    (usersData.employees as UserDataEmployee[]).forEach(e => { rates[e.id] = e.daily_rate || 850; });
    return rates;
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortOption, setSortOption] = useState('none');

  // Computed Current Week Data Matrix
  const currentWeekKey = format(currentWeekStart, 'yyyy-MM-dd');
  
  const payrollData = useMemo(() => {
    return (usersData.employees as UserDataEmployee[]).map(emp => {
      const attendance = weeklyVault[currentWeekKey]?.[emp.id] || generateEmptyWeek(currentWeekStart);
      const weeklyTotal = attendance.reduce((sum, d) => sum + d.computed_salary, 0);
      
      return {
        employee_id: emp.id,
        name: emp.name,
        role: emp.role,
        current_rate: employeeRates[emp.id] || 850,
        ot_rate: emp.ot_rate || 100,
        attendance,
        weekly_total: weeklyTotal
      } as PayrollRecord;
    });
  }, [weeklyVault, currentWeekKey, currentWeekStart, employeeRates]);

  // Unified Filtering & Sorting Selector
  const filteredData = useMemo(() => {
    let result = payrollData.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || emp.role === roleFilter;
      return matchSearch && matchRole;
    });

    if (sortOption === 'salary-desc') result = _.orderBy(result, ['weekly_total'], ['desc']);
    else if (sortOption === 'salary-asc') result = _.orderBy(result, ['weekly_total'], ['asc']);
    else if (sortOption === 'name-asc') result = _.orderBy(result, ['name'], ['asc']);

    return result;
  }, [payrollData, searchTerm, roleFilter, sortOption]);

  // Update Handlers
  const handleUpdateDay = useCallback((empId: string, date: string, updates: Partial<AttendanceDay>) => {
    if (!isAdmin) return;

    setWeeklyVault(prev => {
      const week = prev[currentWeekKey] || {};
      const empAttendance = week[empId] || generateEmptyWeek(currentWeekStart);
      
      const newAttendance = empAttendance.map(day => {
        if (day.date === date) {
          return { ...day, ...updates };
        }
        return day;
      });

      return {
        ...prev,
        [currentWeekKey]: {
          ...week,
          [empId]: newAttendance
        }
      };
    });
  }, [currentWeekKey, currentWeekStart, isAdmin]);

  const handleUpdateRate = useCallback((empId: string, rate: number) => {
    if (!isAdmin) return;
    setEmployeeRates(prev => ({ ...prev, [empId]: rate }));
  }, [isAdmin]);

  const toggleHoliday = useCallback((date: string) => {
    if (!isAdmin) return;
    setHolidays(prev => {
      const isRemoving = prev.includes(date);
      const newHolidays = isRemoving ? prev.filter(d => d !== date) : [...prev, date];
      
      // If adding a holiday, zero out everyone's salary for that day
      if (!isRemoving) {
        setWeeklyVault(v => {
          const updatedVault = { ...v };
          const week = { ...(updatedVault[currentWeekKey] || {}) };
          
          (usersData.employees as UserDataEmployee[]).forEach(emp => {
            const att = week[emp.id] || generateEmptyWeek(currentWeekStart);
            week[emp.id] = att.map(d => d.date === date ? { ...d, status: 'absent', attendance_percentage: 0, computed_salary: 0, overtime_hours: 0, applied_rate: 0 } : d);
          });
          
          updatedVault[currentWeekKey] = week;
          return updatedVault;
        });
      }
      return newHolidays;
    });
  }, [isAdmin, currentWeekKey, currentWeekStart]);

  return (
    <div className="PayrollPage space-y-10 animate-in fade-in duration-700 max-w-[1700px] mx-auto px-6 lg:px-12 pb-24">
      <PayrollSystemHeader />
      
      <PayrollAnalytics data={payrollData} weekDates={(_.first(payrollData)?.attendance || []).map(d => d.date)} />

      <PayrollCalendar 
        data={filteredData}
        currentWeekStart={currentWeekStart}
        onWeekChange={setCurrentWeekStart}
        holidays={holidays}
        onToggleHoliday={toggleHoliday}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        onUpdateDay={handleUpdateDay}
        onUpdateRate={handleUpdateRate}
      />

      {/* Monthly Archive / Export UI / PDF Generator WIP Panel */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-700 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#75EEA5]/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
         <div>
            <h4 className="text-xl font-black text-white uppercase italic tracking-tighter italic">Enterprise Accounting Ledger</h4>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[4px] mt-1 opacity-70">Unified Monthly Archive & Export Center</p>
         </div>
         <div className="flex gap-4">
            <button className="px-8 py-4 bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all opacity-50 cursor-not-allowed">
               Generate PDF Pack
            </button>
            <button className="px-8 py-4 bg-[#75EEA5] text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-[#75EEA5]/20">
               Accounting Ledger Export
            </button>
         </div>
      </div>
    </div>
  );
};

export default Payroll;
