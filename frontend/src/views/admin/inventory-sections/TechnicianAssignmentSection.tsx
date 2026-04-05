import { useState } from 'react';
import { 
  Users, Search, ShieldCheck, ChevronRight, Check, Filter, Package, LayoutGrid, UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import usersData from '../../../data/users.json';
import productsData from '../../../data/products.json';

interface Employee {
  id: string;
  name: string;
  role: string;
  profile_picture: string;
  email: string;
  allowed_categories?: string[];
  allowed_products?: string[];
}

interface TechnicianAssignmentSectionProps {
  categories: { id: string; label: string }[];
}

type AssignmentMode = 'categories' | 'products';
type RoleFilter = 'all' | 'staff' | 'technician' | 'welder';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export const TechnicianAssignmentSection: React.FC<TechnicianAssignmentSectionProps> = ({ categories }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('categories');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  
  const [employees, setEmployees] = useState<Employee[]>(() => {
    return usersData.employees.filter(emp => ['staff', 'technician', 'welder'].includes(emp.role)) as Employee[];
  });

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  const handleToggleCategory = (catLabel: string) => {
    if (!selectedEmpId) return;

    setEmployees(prev => prev.map(emp => {
      if (emp.id === selectedEmpId) {
        const current = emp.allowed_categories || [];
        const next = current.includes(catLabel) 
          ? current.filter((c: string) => c !== catLabel)
          : [...current, catLabel];
        
        return { ...emp, allowed_categories: next };
      }
      return emp;
    }));

    toast.success('Category accessibility updated', {
      icon: '📁',
      style: { borderRadius: '12px', background: '#0f172a', color: '#fff' }
    });
  };

  const handleToggleProduct = (productName: string) => {
    if (!selectedEmpId) return;

    setEmployees(prev => prev.map(emp => {
      if (emp.id === selectedEmpId) {
        const current = emp.allowed_products || [];
        const next = current.includes(productName) 
          ? current.filter((p: string) => p !== productName)
          : [...current, productName];
        
        return { ...emp, allowed_products: next };
      }
      return emp;
    }));

    toast.success('Product assignment updated', {
      icon: '📦',
      style: { borderRadius: '12px', background: '#0f172a', color: '#fff' }
    });
  };

  return (
    <section className="TechnicianAssignmentSection space-y-8 mt-16 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Workforce Operational Matrix</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Define granular production permissions for staff, technicians, and welders.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button 
                    onClick={() => setAssignmentMode('categories')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        assignmentMode === 'categories' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <LayoutGrid size={14} /> Categories
                </button>
                <button 
                    onClick={() => setAssignmentMode('products')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        assignmentMode === 'products' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Package size={14} /> Specific Products
                </button>
            </div>
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-[#75EEA5] shadow-xl">
                <ShieldCheck size={24} />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left: Personnel List & Filters */}
        <div className="xl:col-span-4 space-y-6 sticky top-8">
          <div className="bg-white p-7 border border-slate-100 rounded-[32px] shadow-2xl shadow-slate-200/50">
            <div className="space-y-4 mb-8">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by identity..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-900 outline-none focus:border-emerald-300 transition-all uppercase tracking-tight" 
                    />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {(['all', 'staff', 'technician', 'welder'] as RoleFilter[]).map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                roleFilter === role 
                                    ? "bg-slate-900 text-emerald-400 border-slate-900" 
                                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                            )}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
              {filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={cn(
                    "w-full group p-4 rounded-3xl border-2 transition-all flex items-center justify-between",
                    selectedEmpId === emp.id 
                      ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]' 
                      : 'bg-white border-slate-50 hover:bg-slate-50 hover:border-slate-100'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                        <img src={emp.profile_picture} className="w-12 h-12 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all border border-slate-100 shadow-sm" />
                        <div className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white flex items-center justify-center text-[8px] font-black shadow-lg",
                            emp.role === 'admin' ? "bg-rose-500 text-white" : 
                            emp.role === 'technician' ? "bg-blue-500 text-white" :
                            emp.role === 'welder' ? "bg-amber-500 text-white" : "bg-slate-400 text-white"
                        )}>
                            {emp.role.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="text-left">
                      <p className={cn("text-xs font-black uppercase italic tracking-tight", selectedEmpId === emp.id ? 'text-white' : 'text-slate-900')}>{emp.name}</p>
                      <span className={cn("text-[9px] font-bold uppercase tracking-[2px]", selectedEmpId === emp.id ? 'text-emerald-400' : 'text-slate-400')}>{emp.id}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={selectedEmpId === emp.id ? 'text-emerald-400' : 'text-slate-200'} />
                </button>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="py-20 text-center opacity-40 grayscale flex flex-col items-center gap-4">
                    <UserCircle size={48} className="text-slate-300" />
                    <p className="text-[10px] font-bold uppercase tracking-widest italic">No matching personnel</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Detailed Mapping Container */}
        <div className="xl:col-span-8">
          <AnimatePresence mode="wait">
            {selectedEmp ? (
              <motion.div
                key={selectedEmp.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden h-full min-h-[600px]"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-[100px] -mr-32 -mt-32" />
                
                <div className="space-y-10 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <img src={selectedEmp.profile_picture} className="w-20 h-20 rounded-[32px] object-cover ring-[6px] ring-emerald-50 shadow-2xl" />
                            <div className="absolute -top-2 -right-2 p-2 bg-slate-900 text-[#75EEA5] rounded-xl shadow-lg animate-bounce">
                                <ShieldCheck size={16} />
                            </div>
                        </div>
                        <div>
                        <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Operational Clearance</h3>
                        <div className="flex items-center gap-4 mt-1.5">
                            <span className="px-3 py-1 bg-slate-900 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedEmp.name}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{selectedEmp.role} Node</span>
                        </div>
                        </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  {assignmentMode === 'categories' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3">
                            <LayoutGrid size={18} className="text-slate-400" />
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] italic">Mapped Categories</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {categories.map(cat => {
                            const isAllowed = (selectedEmp.allowed_categories || []).includes(cat.label);
                            return (
                                <button
                                key={cat.id}
                                onClick={() => handleToggleCategory(cat.label)}
                                className={cn(
                                    "p-6 rounded-[32px] border transition-all text-left group relative overflow-hidden",
                                    isAllowed ? 'bg-emerald-50 border-emerald-100 shadow-lg shadow-emerald-500/5' : 'bg-white border-slate-100 hover:border-slate-200'
                                )}
                                >
                                {isAllowed && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Check size={12} strokeWidth={4} />
                                    </div>
                                )}
                                <p className={cn("text-[9px] font-black uppercase tracking-widest italic mb-2", isAllowed ? 'text-emerald-700' : 'text-slate-400')}>Group Tag</p>
                                <h4 className={cn("text-lg font-black uppercase italic tracking-tight", isAllowed ? 'text-emerald-900' : 'text-slate-900')}>{cat.label}</h4>
                                </button>
                            );
                            })}
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center gap-3">
                            <Package size={18} className="text-slate-400" />
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[4px] italic">Specific Asset Nodes</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                            {productsData.map(prod => {
                                const isAllowed = (selectedEmp.allowed_products || []).includes(prod.name);
                                return (
                                    <button
                                        key={prod.id}
                                        onClick={() => handleToggleProduct(prod.name)}
                                        className={cn(
                                            "p-5 rounded-[28px] border transition-all flex items-center gap-5 text-left group relative",
                                            isAllowed ? 'bg-indigo-50 border-indigo-100 shadow-lg shadow-indigo-500/5' : 'bg-white border-slate-50 hover:border-slate-200'
                                        )}
                                    >
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm p-1">
                                            <img src={prod.main_image} className="w-full h-full object-cover rounded-xl" />
                                        </div>
                                        <div className="flex-1">
                                            <p className={cn("text-[8px] font-black uppercase tracking-widest italic mb-1", isAllowed ? 'text-indigo-400' : 'text-slate-400')}>{prod.id}</p>
                                            <h5 className={cn("text-xs font-black uppercase italic tracking-tight", isAllowed ? 'text-indigo-900' : 'text-slate-900')}>{prod.name}</h5>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] font-bold text-slate-400 italic">{prod.category}</span>
                                            </div>
                                        </div>
                                        {isAllowed && (
                                            <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex items-center gap-6 mt-8">
                     <div className="p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/40 text-slate-400">
                        <Filter size={20} />
                     </div>
                     <div className="space-y-1">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">Node Sync Protection</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed max-w-[500px]">
                            Changes applied to this operational clearance will restrict this employee's Live Queue in real-time. Only processing orders matching these {assignmentMode === 'categories' ? 'categories' : 'specific products'} will be visible.
                        </p>
                     </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 bg-white rounded-[48px] border border-dashed border-slate-200 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-[32px] flex items-center justify-center animate-pulse">
                  <Users size={48} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Identity Not Isolated</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[300px] mx-auto leading-relaxed">Select specialized personnel from the registry dashboard to configure operational mapping.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
