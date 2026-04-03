import React, { useEffect } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';

export interface FilterInputs {
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;
  dateRange: string;
}

interface PayrollFiltersProps {
  onFilterChange: (filters: FilterInputs) => void;
}

const PayrollFilters: React.FC<PayrollFiltersProps> = ({ onFilterChange }) => {
  const { register, control } = useForm<FilterInputs>({
    defaultValues: {
      searchTerm: '',
      roleFilter: 'all',
      statusFilter: 'all',
      dateRange: 'April 2026 Cycle'
    }
  });

  const values = useWatch({ control });

  useEffect(() => {
    // values can be partial initially or undefined if not initialized correctly with useWatch
    // so we provide default values or ensure it's not undefined
    if (values) {
      onFilterChange(values as FilterInputs);
    }
  }, [values, onFilterChange]);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 payroll-toolbar mb-8">
      <div className="relative flex-1 w-full md:max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          {...register('searchTerm')}
          type="text" 
          placeholder="Search employees..." 
          className="payroll-search-input w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative group flex-1 md:flex-none">
          <select 
            {...register('roleFilter')}
            className="payroll-role-filter appearance-none w-full md:w-40 pl-10 pr-8 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="inventory">Inventory</option>
            <option value="designer">Designer</option>
          </select>
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>

        <div className="relative group flex-1 md:flex-none">
          <select 
            {...register('statusFilter')}
            className="payroll-status-filter appearance-none w-full md:w-40 pl-10 pr-8 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-400 pointer-events-none" />
        </div>

        <div className="relative group flex-1 md:flex-none">
          <input 
            {...register('dateRange')}
            type="text" 
            placeholder="Payroll Period"
            className="appearance-none w-full md:w-48 pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
          />
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>
      </div>
    </div>
  );
};

export default PayrollFilters;
