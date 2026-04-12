import React from 'react'
import { Search, Filter, ArrowUpDown } from 'lucide-react'

interface PayrollControlsProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  roleFilter: string
  setRoleFilter: (role: string) => void
  sortOption: string
  setSortOption: (option: string) => void
}

const PayrollControls: React.FC<PayrollControlsProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  sortOption,
  setSortOption,
}) => {
  return (
    <div className="PayrollControls mb-8 flex flex-col items-center gap-4 md:flex-row">
      <div className="PayrollSearchBar translate-transition relative w-full flex-1">
        <Search
          className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
          size={18}
        />
        <input
          type="text"
          placeholder="Search personnel entity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-slate-100 bg-white py-3.5 pr-4 pl-12 text-sm font-bold shadow-sm shadow-slate-200/40 transition-all focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
        />
      </div>

      <div className="flex w-full items-center gap-3 md:w-auto">
        <div className="PayrollFilterDropdown group relative flex-1 md:flex-none">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-100 bg-white py-3.5 pr-8 pl-10 text-xs font-bold shadow-sm shadow-slate-200/40 transition-colors hover:bg-slate-50 focus:outline-none md:w-44"
          >
            <option value="all">Unified Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="inventory">Inventory</option>
            <option value="designer">Designer</option>
          </select>
          <Filter
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-blue-500"
            size={14}
          />
        </div>

        <div className="PayrollFilterDropdown group relative flex-1 md:flex-none">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-100 bg-white py-3.5 pr-8 pl-10 text-xs font-bold shadow-sm shadow-slate-200/40 transition-colors hover:bg-slate-50 focus:outline-none md:w-48"
          >
            <option value="none">Sort Priority</option>
            <option value="salary-desc">Highest Weekly</option>
            <option value="salary-asc">Lowest Weekly</option>
            <option value="daily-desc">Highest Daily</option>
            <option value="name-asc">A-Z Name</option>
          </select>
          <ArrowUpDown
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-amber-500"
            size={14}
          />
        </div>
      </div>
    </div>
  )
}

export default PayrollControls
