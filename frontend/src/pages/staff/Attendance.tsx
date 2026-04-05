import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Coffee,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Landmark,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, startOfWeek, endOfWeek, isSameMonth, isSameYear, parseISO, isWithinInterval } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import initialSalaryData from '../../data/salary.json';

// --- TYPES ---
interface AttendanceRecord {
  date: string;
  status: 'full' | 'half' | 'absent';
  overtime_hours: number;
  computed_salary: number;
  is_holiday?: boolean;
}

interface WeeklySalaryData {
  employee_id: string;
  week_start: string;
  attendance: AttendanceRecord[];
  weekly_total: number;
}

const COLORS = ['#75EEA5', '#7C3AED', '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#6366F1'];

type ViewMode = 'weekly' | 'monthly' | 'yearly';

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date('2026-04-01')); // Simulation base date

  // --- DATA LOADING & FILTERING ---
  const myData = useMemo(() => {
    return (initialSalaryData as WeeklySalaryData[]).filter(s => s.employee_id === user?.id);
  }, [user?.id]);

  const allRecords = useMemo(() => {
    return myData.flatMap(week => week.attendance);
  }, [myData]);

  // --- DERIVED ANALYTICS ---
  const filteredRecords = useMemo(() => {
    if (viewMode === 'weekly') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return allRecords.filter(r => isWithinInterval(parseISO(r.date), { start, end }));
    } else if (viewMode === 'monthly') {
      return allRecords.filter(r => isSameMonth(parseISO(r.date), currentDate));
    } else {
      return allRecords.filter(r => isSameYear(parseISO(r.date), currentDate));
    }
  }, [allRecords, viewMode, currentDate]);

  const summary = useMemo(() => {
    const totalSalary = filteredRecords.reduce((sum, r) => sum + r.computed_salary, 0);
    const totalOT = filteredRecords.reduce((sum, r) => sum + r.overtime_hours, 0);
    const presentCount = filteredRecords.filter(r => r.status !== 'absent').length;
    const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
    
    return {
      totalSalary,
      totalOT,
      presentCount,
      absentCount
    };
  }, [filteredRecords]);

  // --- CHART DATA PREP ---
  const chartData = useMemo(() => {
    if (viewMode === 'weekly') {
      return filteredRecords.map(r => ({
        name: format(parseISO(r.date), 'EEE'),
        value: r.computed_salary,
        status: r.status
      }));
    } else if (viewMode === 'monthly') {
      // Group by weeks for month view
      const weeks: Record<string, number> = {};
      filteredRecords.forEach(r => {
        const weekKey = `Week ${Math.ceil(parseISO(r.date).getDate() / 7)}`;
        weeks[weekKey] = (weeks[weekKey] || 0) + r.computed_salary;
      });
      return Object.entries(weeks).map(([name, value]) => ({ name, value }));
    } else {
      // Group by months for year view
      const months: Record<string, number> = {};
      filteredRecords.forEach(r => {
        const monthKey = format(parseISO(r.date), 'MMM');
        months[monthKey] = (months[monthKey] || 0) + r.computed_salary;
      });
      // Ensure all months are listed even if zero
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames.map(m => ({ name: m, value: months[m] || 0 }));
    }
  }, [filteredRecords, viewMode]);

  const statusPieData = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredRecords.forEach(r => {
      stats[r.status] = (stats[r.status] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ 
      name: name.toUpperCase(), 
      value,
      color: name === 'full' ? '#75EEA5' : name === 'half' ? '#F59E0B' : '#EF4444'
    }));
  }, [filteredRecords]);

  // --- HELPERS ---
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'weekly') newDate.setDate(newDate.getDate() - 7);
    else if (viewMode === 'monthly') newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'weekly') newDate.setDate(newDate.getDate() + 7);
    else if (viewMode === 'monthly') newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  return (
    <div className="attendance-wrapper min-h-screen bg-[#F8FAFC] pb-24">
      <div className="attendance-page max-w-[1700px] mx-auto px-6 lg:px-12 space-y-10 pt-12 animate-in fade-in duration-700">
        
        {/* 🚀 HEADER SECTION */}
        <header className="attendance-header flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">My Attendance & Salary</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-2 italic">View your work records and salary summary • Node {user?.id}</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] shadow-sm border border-slate-100">
            {(['weekly', 'monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`attendance-view-toggle px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </header>

        {/* 📊 SALARY DASHBOARD (Summary Cards) */}
        <section className="attendance-salary-dashboard grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="attendance-summary-cards p-8 bg-slate-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Landmark size={80} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[3px] opacity-60 mb-2">Total Fiscal Yield</p>
            <h3 className="text-4xl font-black tracking-tighter italic text-[#75EEA5]">₱{summary.totalSalary.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-2">
               <TrendingUp size={14} className="text-[#75EEA5]" />
               <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Verified Payout Node</span>
            </div>
          </div>

          <div className="attendance-summary-cards p-8 bg-white border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/40 relative overflow-hidden group">
             <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Overtime Credits</p>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">{summary.totalOT}h <span className="text-xs font-bold text-blue-500 uppercase">Tracked</span></h3>
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Clock size={60} />
             </div>
          </div>

          <div className="attendance-summary-cards p-8 bg-white border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/40 relative overflow-hidden group">
             <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Temporal Attendance %</p>
             <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                   {filteredRecords.length > 0 ? ((summary.presentCount / filteredRecords.length) * 100).toFixed(0) : 0}%
                </h3>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">{summary.presentCount} Nodes Active</span>
             </div>
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <CalendarCheck size={60} />
             </div>
          </div>

          <div className="attendance-summary-cards p-8 bg-white border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/40 relative overflow-hidden group">
             <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Risk Factor / Absence</p>
             <h3 className="text-3xl font-black text-rose-500 tracking-tighter italic">{summary.absentCount} Days</h3>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Non-Fiscal Capacity</p>
          </div>
        </section>

        {/* 📈 ANALYTICS GRAPHS */}
        <section className="attendance-graph grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl relative overflow-hidden group min-h-[400px]">
              <div className="flex items-center gap-4 mb-10 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-[#75EEA5]">
                    <BarChart3 size={20} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Personal Fiscal Stream</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Salary Accumulation Flux</p>
                 </div>
              </div>
              <div className="h-[250px] w-full relative z-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                       <Tooltip cursor={{ fill: '#f1f5f9', radius: 10 }} contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                       <Bar dataKey="value" radius={[8, 8, 8, 8]} animationDuration={1500} barSize={32}>
                          {chartData.map((_, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group min-h-[400px]">
              <div className="flex items-center gap-4 mb-10 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-[#75EEA5]/10 flex items-center justify-center text-[#75EEA5]">
                    <PieIcon size={20} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter">Status Distribution</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Presence Capability Matrix</p>
                 </div>
              </div>
              <div className="h-[250px] w-full relative z-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                          {statusPieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                       </Pie>
                       <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </section>

        {/* 📅 CALENDAR / TABLE SECTION */}
        <section className="attendance-calendar-container bg-white border border-slate-100 rounded-[44px] shadow-2xl shadow-slate-200/40 overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                 <h3 className="text-lg font-black text-slate-900 uppercase italic">Attendance Protocol Registry</h3>
                 <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Temporal Focus:</span>
                    <span className="text-xs font-black text-slate-900 italic">
                       {viewMode === 'weekly' ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}` : 
                        viewMode === 'monthly' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'Year yyyy')}
                    </span>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={handlePrev} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-90 shadow-sm">
                    <ChevronLeft size={18} />
                 </button>
                 <button onClick={() => setCurrentDate(new Date('2026-04-01'))} className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all">
                    Reset Sync
                 </button>
                 <button onClick={handleNext} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-90 shadow-sm">
                    <ChevronRight size={18} />
                 </button>
              </div>
           </div>

           <div className="attendance-calendar p-8">
              {viewMode === 'weekly' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6">
                   {filteredRecords.length > 0 ? (
                     filteredRecords.map((record, idx) => (
                       <div key={idx} className="group relative flex flex-col items-center p-6 bg-slate-50/50 border border-slate-100 rounded-[32px] hover:bg-white hover:shadow-2xl hover:border-emerald-200 transition-all duration-500">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{format(parseISO(record.date), 'EEE')}</p>
                          <h4 className="text-2xl font-black text-slate-900 mb-4">{format(parseISO(record.date), 'dd')}</h4>
                          
                          <div className="flex-1 flex flex-col items-center gap-4 w-full">
                             {record.status === 'full' ? (
                               <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                                  <CheckCircle2 size={24} />
                               </div>
                             ) : record.status === 'half' ? (
                               <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
                                  <Coffee size={24} />
                               </div>
                             ) : (
                               <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner">
                                  <XCircle size={24} />
                               </div>
                             )}

                             {record.is_holiday && (
                               <div className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">
                                  HOLIDAY Node
                               </div>
                             )}

                             <div className="text-center">
                                <p className="text-[14px] font-black text-slate-900 italic tracking-tighter">₱{record.computed_salary.toLocaleString()}</p>
                                {record.overtime_hours > 0 && (
                                  <p className="text-[9px] font-bold text-blue-500 uppercase mt-0.5">+{record.overtime_hours}h OT</p>
                                )}
                             </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="col-span-full py-20 text-center opacity-30">
                        <Calendar size={48} className="mx-auto text-slate-400 mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic tracking-[3px]">Temporal Registry Void</p>
                     </div>
                   )}
                </div>
              ) : viewMode === 'monthly' ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {filteredRecords.map((record, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl border transition-all ${record.status === 'absent' ? 'bg-slate-50/20 border-slate-50 opacity-40' : 'bg-white border-slate-100 hover:shadow-lg hover:border-emerald-100'}`}>
                         <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{format(parseISO(record.date), 'dd')}</span>
                            {record.is_holiday && <div className="w-2 h-2 rounded-full bg-purple-500 shadow-sm" />}
                         </div>
                         <p className="text-xs font-black text-slate-900 italic tracking-tighter">₱{record.computed_salary.toLocaleString()}</p>
                         <div className={`w-full h-1.5 mt-3 rounded-full ${record.status === 'full' ? 'bg-[#75EEA5]' : record.status === 'half' ? 'bg-amber-400' : 'bg-slate-200'}`} />
                      </div>
                    ))}
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, mIdx) => {
                     const monthRecords = filteredRecords.filter(r => parseISO(r.date).getMonth() === mIdx);
                     const monthSalary = monthRecords.reduce((sum, r) => sum + r.computed_salary, 0);
                     const attendanceRate = monthRecords.length > 0 ? (monthRecords.filter(r => r.status !== 'absent').length / monthRecords.length) * 100 : 0;
                     
                     return (
                       <div key={month} className={`p-6 rounded-[32px] border transition-all ${monthSalary > 0 ? 'bg-slate-900 text-white shadow-xl translate-y-[-4px]' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                          <div className="flex justify-between items-center mb-6">
                             <h4 className="text-lg font-black uppercase italic italic">{month}</h4>
                             <TrendingUp size={16} className={monthSalary > 0 ? "text-[#75EEA5]" : "text-slate-300"} />
                          </div>
                          <div className="space-y-4">
                             <div>
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Monthly Yield</p>
                                <p className="text-xl font-black italic tracking-tighter">₱{monthSalary.toLocaleString()}</p>
                             </div>
                             <div>
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Attendance Reach</p>
                                <p className={`text-xs font-black ${attendanceRate > 80 ? 'text-[#75EEA5]' : 'text-amber-400'}`}>{attendanceRate.toFixed(1)}%</p>
                             </div>
                          </div>
                       </div>
                     );
                   })}
                </div>
              )}
           </div>
        </section>

        {/* 📄 FOOTER ATTESTATION */}
        <footer className="flex flex-col md:flex-row items-center justify-between p-10 bg-slate-900 rounded-[40px] text-white overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <CalendarCheck size={120} />
           </div>
           <div>
              <h4 className="text-xl font-black uppercase italic tracking-tighter">Personnel Fiscal Attestation</h4>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[4px] mt-1 opacity-70">Unified Data Node Persistence Verified</p>
           </div>
           <div className="mt-8 md:mt-0 flex gap-4">
              <button className="px-10 py-5 bg-[#75EEA5] text-slate-900 text-[11px] font-black uppercase tracking-[3px] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#75EEA5]/20 italic">
                 Download Audit Log
              </button>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default Attendance;
