import React, { useEffect } from 'react'
import { Search, Filter, Calendar } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'

export interface FilterInputs {
  searchTerm: string
  roleFilter: string
  statusFilter: string
  dateRange: string
}

interface PayrollFiltersProps {
  onFilterChange: (filters: FilterInputs) => void
}

const PayrollFilters: React.FC<PayrollFiltersProps> = ({ onFilterChange }) => {
  const { register, control } = useForm<FilterInputs>({
    defaultValues: {
      searchTerm: '',
      roleFilter: 'all',
      statusFilter: 'all',
      dateRange: 'April 2026 Cycle',
    },
  })

  const values = useWatch({ control })

  useEffect(() => {
    // values can be partial initially or undefined if not initialized correctly with useWatch
    // so we provide default values or ensure it's not undefined
    if (values) {
      onFilterChange(values as FilterInputs)
    }
  }, [values, onFilterChange])

  return (
    <div className="payroll-toolbar mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
      <div className="relative w-full flex-1 md:max-w-md">
        <Search
          className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          {...register('searchTerm')}
          type="text"
          placeholder="Search employees..."
          className="payroll-search-input w-full rounded-2xl border border-slate-100 bg-white py-3 pr-4 pl-12 text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>

      <div className="flex w-full items-center gap-3 md:w-auto">
        <div className="group relative flex-1 md:flex-none">
          <select
            {...register('roleFilter')}
            className="payroll-role-filter w-full cursor-pointer appearance-none rounded-2xl border border-slate-100 bg-white py-3 pr-8 pl-10 text-xs font-bold shadow-sm transition-colors hover:bg-slate-50 focus:outline-none md:w-40"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="inventory">Inventory</option>
            <option value="designer">Designer</option>
          </select>
          <Filter
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
            size={14}
          />
        </div>

        <div className="group relative flex-1 md:flex-none">
          <select
            {...register('statusFilter')}
            className="payroll-status-filter w-full cursor-pointer appearance-none rounded-2xl border border-slate-100 bg-white py-3 pr-8 pl-10 text-xs font-bold shadow-sm transition-colors hover:bg-slate-50 focus:outline-none md:w-40"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <div className="pointer-events-none absolute top-1/2 left-4 h-2 w-2 -translate-y-1/2 rounded-full bg-slate-400" />
        </div>

        <div className="group relative flex-1 md:flex-none">
          <input
            {...register('dateRange')}
            type="text"
            placeholder="Payroll Period"
            className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-100 bg-white py-3 pr-4 pl-10 text-xs font-bold shadow-sm transition-colors hover:bg-slate-50 focus:outline-none md:w-48"
          />
          <Calendar
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
            size={14}
          />
        </div>
      </div>
    </div>
  )
}

export default PayrollFilters
