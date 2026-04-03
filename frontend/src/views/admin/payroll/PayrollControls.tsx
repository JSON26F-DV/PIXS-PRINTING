import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface PayrollControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
}

const PayrollControls: React.FC<PayrollControlsProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  sortOption,
  setSortOption
}) => {
  return (
    <div className="PayrollControls flex flex-col md:flex-row items-center gap-4 mb-8">
      <div className="PayrollSearchBar relative flex-1 w-full translate-transition">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search personnel entity..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm shadow-slate-200/40"
        />
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="PayrollFilterDropdown relative group flex-1 md:flex-none">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none w-full md:w-44 pl-10 pr-8 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm shadow-slate-200/40"
          >
            <option value="all">Unified Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="inventory">Inventory</option>
            <option value="designer">Designer</option>
          </select>
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" size={14} />
        </div>

        <div className="PayrollFilterDropdown relative group flex-1 md:flex-none">
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="appearance-none w-full md:w-48 pl-10 pr-8 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm shadow-slate-200/40"
          >
            <option value="none">Sort Priority</option>
            <option value="salary-desc">Highest Weekly</option>
            <option value="salary-asc">Lowest Weekly</option>
            <option value="daily-desc">Highest Daily</option>
            <option value="name-asc">A-Z Name</option>
          </select>
          <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-amber-500 transition-colors" size={14} />
        </div>
      </div>
    </div>
  );
};

export default PayrollControls;
