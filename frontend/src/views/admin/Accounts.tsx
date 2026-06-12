import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Briefcase,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  type LucideIcon,
  ShieldAlert,
  User,
  ChevronDown
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import debounce from 'lodash/debounce'
import BoxFallback from '../../components/common/BoxFallback'
import AnimatedNumber from '../../components/animations/AnimatedNumber'
import axiosInstance from '../../lib/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Authenticator from '../../components/Authenticator'

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface UserData {
  id: string
  name: string
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
  date_created: string
  profile_picture: string | null
  company_name: string | null
  type: 'employee' | 'customer'
  age?: number
  gender?: string
  total_orders_value?: number
}

interface DeletedUserData {
  id: number
  original_id: string
  account_type: 'employee' | 'customer'
  email: string
  deleted_by: string
  deleted_by_type: string
  reason: string | null
  deleted_at: string
}

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// --- SUB-COMPONENTS ---
const UserAvatar = ({
  src,
  name,
  size = 'h-14 w-14',
}: {
  src?: string | null
  name: string
  size?: string
}) => {
  const [error, setError] = useState(false)

  const displaySrc =
    src && !error
      ? src.startsWith('http') ||
        src.startsWith('blob:') ||
        src.startsWith('data:')
        ? src
        : `/src/assets/profile/${src}`
      : null

  if (!displaySrc) {
    return (
      <BoxFallback
        className={cn(size, 'rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden')}
        iconClassName="h-9 w-9 brightness-0 invert opacity-30"
      />
    )
  }

  return (
    <img
      src={displaySrc}
      alt={name}
      onError={() => setError(true)}
      className={cn(
        size,
        'rounded-2xl border-2 border-white bg-slate-100 object-cover shadow-xl ring-1 ring-slate-100',
      )}
    />
  )
}

const StatCard = ({
  title,
  value,
  prefix = '',
  icon: Icon,
  variant = 'light',
}: {
  title: string
  value: number
  prefix?: string
  icon: LucideIcon
  variant?: 'light' | 'dark' | 'emerald' | 'rose'
}) => {
  const bgClass =
    variant === 'dark'
      ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white'
      : variant === 'emerald'
        ? 'bg-gradient-to-br from-[#75EEA5] to-[#5de291] text-slate-900 border-none'
        : variant === 'rose'
          ? 'bg-gradient-to-br from-rose-400 to-rose-500 text-white border-none'
          : 'bg-white border border-slate-100 shadow-xl shadow-slate-200/40 text-slate-900'

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[24px] p-4 sm:p-6 shadow-2xl transition-all hover:-translate-y-1',
        bgClass,
      )}
    >
      <div
        className={cn(
          'absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12',
        )}
      >
        <Icon className={cn('h-20 w-20 sm:h-32 sm:w-32')} />
      </div>
      <p
        className={cn(
          'relative z-10 mb-1 sm:mb-3 text-[10px] sm:text-xs font-black tracking-[2px] uppercase opacity-70',
        )}
      >
        {title}
      </p>
      <div className="relative z-10 flex items-baseline gap-1">
        <span className="text-base sm:text-xl font-bold opacity-60">{prefix}</span>
        <AnimatedNumber
          value={value}
          className="text-2xl sm:text-4xl font-black tracking-tighter"
        />
      </div>
    </div>
  )
}

const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
  icon: Icon,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  icon: LucideIcon
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedLabel = options.find(o => o.value === value)?.label

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-2xl border px-4 py-4 text-xs font-black tracking-widest uppercase transition-all',
          open
            ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm',
        )}
      >
        <Icon size={16} />
        <span className="hidden sm:inline">{selectedLabel || label}</span>
        <ChevronDown size={14} className={`hidden sm:block transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-[999] mt-1 min-w-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                'block w-full px-5 py-3.5 text-left text-xs font-black tracking-wider uppercase transition-all hover:bg-slate-50',
                value === opt.value ? 'bg-slate-900 text-white' : 'text-slate-600',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- MAIN PAGE ---
const Accounts: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  const [userTypeFilter, setUserTypeFilter] = useState<string>('all')
  const [deletedAccounts, setDeletedAccounts] = useState<DeletedUserData[]>([])
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [authenticatorModal, setAuthenticatorModal] = useState<{
    isOpen: boolean
    accountId: string
    accountEmail: string
  }>({ isOpen: false, accountId: '', accountEmail: '' })

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pagination states (10 items max per page)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchAccounts = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/admin/accounts')
      if (data.status === 'success') {
        setUsers(data.data)
      }
    } catch {
      toast.error('Failed to load active accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDeletedAccounts = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/accounts/deleted', {
        params: {
          search: debouncedSearch
        }
      })
      if (data.status === 'success') {
        setDeletedAccounts(data.data)
      }
    } catch {
      toast.error('Failed to load deleted accounts')
    }
  }, [debouncedSearch])

  useEffect(() => {
    document.title = 'Account Infrastructure | PIXS ERP'
    fetchAccounts()
  }, [fetchAccounts])

  // --- SEARCH LOGIC ---
  const handleSearchDebounce = useMemo(
    () => debounce((q: string) => setDebouncedSearch(q), 300),
    [],
  )

  useEffect(() => {
    handleSearchDebounce(searchTerm)
    return () => handleSearchDebounce.cancel()
  }, [searchTerm, handleSearchDebounce])

  useEffect(() => {
    if (userTypeFilter === 'deleted') {
      fetchDeletedAccounts()
    }
  }, [userTypeFilter, debouncedSearch, fetchDeletedAccounts])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchType = userTypeFilter === 'all' || u.type === userTypeFilter
      const matchSearch =
        u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.id.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchType && matchSearch && matchStatus
    })
  }, [users, debouncedSearch, userTypeFilter, statusFilter])

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, userTypeFilter, statusFilter])

  // Sliced accounts for current page
  const totalPages = Math.ceil(filteredUsers.length / 10) || 1
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * 10
    return filteredUsers.slice(start, start + 10)
  }, [filteredUsers, currentPage])

  // --- STATS ---
  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === 'admin').length
    const staff = users.filter((u) => u.role === 'staff' || u.type === 'employee').length
    const customers = users.filter((u) => u.role === 'customer' || u.type === 'customer').length
    const totalValue = users.reduce(
      (acc, u) => acc + (u.total_orders_value || 0),
      0,
    )
    return { total: users.length, admins, staff, customers, totalValue }
  }, [users])

  return (
    <div className="account-page-container animate-in fade-in mx-auto max-w-[1440px] space-y-8 px-4 pb-16 duration-500 lg:px-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-6 pt-12 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-[#75EEA5] shadow-2xl shadow-slate-900/20">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
              Account Infrastructure
            </h1>
            <p className="mt-1 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              Enterprise Human Capital Controller
            </p>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        <StatCard
          title="Total Registry"
          value={stats.total}
          icon={Briefcase}
          variant="dark"
        />
        <StatCard
          title="Active Customers"
          value={stats.customers}
          icon={UserCheck}
          variant="emerald"
        />
        <StatCard
          title="Administrative Nodes"
          value={stats.admins}
          icon={ShieldCheck}
          variant="light"
        />
        <StatCard
          title="Gross Customer Value"
          value={Math.floor(stats.totalValue)}
          prefix="₱"
          icon={TrendingUp}
          variant="light"
        />
      </section>

      {/* Filters Section */}
      <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="group relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <Search
                size={18}
                className="text-slate-400 group-focus-within:text-[#75EEA5] transition-colors"
              />
            </div>
            <input
              type="text"
              placeholder="Search Name, ID, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-[#75EEA5]/20 focus:border-[#75EEA5] w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-4 pl-12 text-xs font-bold text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:ring-2 focus:outline-none sm:py-4"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* User Type Dropdown */}
            <FilterDropdown
              label="All"
              value={userTypeFilter}
              onChange={setUserTypeFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'employee', label: 'Employees' },
                { value: 'customer', label: 'Customer' },
                { value: 'deleted', label: 'Deleted Account' },
              ]}
              icon={Users}
            />

            {/* Status Dropdown - hidden on mobile & when viewing deleted */}
            {userTypeFilter !== 'deleted' && (
              <FilterDropdown
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                icon={ShieldCheck}
              />
            )}

            {/* Reset */}
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setUserTypeFilter('all')
              }}
              className="group flex items-center justify-center rounded-2xl bg-slate-100 p-3.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-900 hover:text-white active:scale-95 sm:p-4"
              title="Reset Filters"
            >
              <RefreshCw
                size={14}
                className="transition-transform duration-500 group-hover:rotate-180"
              />
            </button>

            {/* Divider - desktop only */}
            <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

            {/* Create Employee */}
            <Link
              to="/admin/account/manage/employee"
              className="flex items-center gap-2 rounded-2xl bg-slate-900 p-3.5 text-xs font-black tracking-widest text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95 sm:px-5 sm:py-4"
              title="Create Employee"
            >
              <UserPlus size={16} className="text-[#75EEA5]" />
              <span className="hidden sm:inline">Employee</span>
            </Link>

            {/* Create Customer */}
            <Link
              to="/admin/account/manage/customer"
              className="flex items-center gap-2 rounded-2xl bg-[#75EEA5] p-3.5 text-xs font-black tracking-widest text-white uppercase shadow-sm transition-all hover:bg-emerald-400 active:scale-95 sm:px-5 sm:py-4"
              title="Create Customer"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Customer</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Listing View */}
      {userTypeFilter === 'deleted' ? (
        /* DELETED ACCOUNTS LIST */
        <div className="space-y-3">
          {deletedAccounts.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-8 text-center border border-dashed border-slate-200">
              <Trash2 size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-400">No deleted accounts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {deletedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 md:rounded-3xl shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200 flex items-center justify-center">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900 truncate">{account.email}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Deleted {formatDate(account.deleted_at)} by {account.deleted_by}
                      </p>
                      {account.reason && (
                        <p className="text-[10px] text-rose-600 mt-1.5 italic font-medium">
                          Reason: {account.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPurgeConfirm(String(account.id))}
                    className="w-full mt-4 rounded-2xl bg-rose-600 py-3 text-[10px] font-black text-white uppercase tracking-wider transition-all hover:bg-rose-700 hover:scale-[1.02] active:scale-95 shadow-md shadow-rose-900/10"
                  >
                    Delete from Database
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ACTIVE ACCOUNTS LIST (EMPLOYEES/CUSTOMERS) */
        <div>
          {/* Mobile Card Layout */}
          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className="text-center py-8 text-xs font-bold text-slate-400">Loading accounts...</div>
            ) : paginatedUsers.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-8 text-center border border-slate-100">
                <Search size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">No accounts found</p>
              </div>
            ) : (
              paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl border p-4 shadow-sm transition-all border-slate-100 bg-white"
                >
                  <div className="flex items-center gap-3">
                    {currentUser?.role !== 'inventory' && (
                      <UserAvatar src={user.profile_picture} name={user.name} size="h-10 w-10" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black tracking-tight text-slate-900 uppercase italic truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {user.role}
                        </span>
                        <span className={cn(
                          "text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                          user.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {user.status}
                        </span>
                      </div>
                    </div>
                    {currentUser?.role !== 'inventory' && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/admin/account/manage/${user.type}/${user.id}`}
                          className="rounded-2xl p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white transition-all active:scale-90"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => {
                            if (user.id) {
                              setShowDeleteConfirm(user.id)
                            }
                          }}
                          className="rounded-2xl p-2.5 bg-slate-50 text-slate-600 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block account-table overflow-hidden rounded-[40px] bg-white">
            <div className="custom-scrollbar overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Profile
                    </th>
                    <th className="px-6 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      ID & Email
                    </th>
                    <th className="px-6 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Company Name
                    </th>
                    <th className="px-6 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Status
                    </th>
                    {currentUser?.role !== 'inventory' && (
                      <th className="px-6 py-6 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 text-xs font-bold">Loading accounts...</td>
                    </tr>
                  ) : paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="group transition-colors cursor-pointer hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            {currentUser?.role !== 'inventory' && (
                              <UserAvatar src={user.profile_picture} name={user.name} size="h-12 w-12" />
                            )}
                            <div>
                              <p className="text-sm font-black tracking-tight text-slate-900 uppercase italic">
                                {user.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-black text-slate-500">
                              {user.id}
                            </span>
                            <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <Mail size={12} className="text-slate-300" />
                              {user.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-xs font-bold text-slate-600">
                            {user.company_name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <div
                               className={cn(
                                'rounded-[10px] border border-slate-100 bg-white p-2 shadow-sm',
                                user.role === 'admin'
                                  ? 'text-slate-900'
                                  : user.role === 'staff'
                                    ? 'text-blue-500'
                                    : 'text-emerald-500',
                              )}
                            >
                              {user.role === 'admin' ? (
                                <ShieldAlert size={16} />
                              ) : user.role === 'staff' ? (
                                <Briefcase size={16} />
                              ) : (
                                <UserCheck size={16} />
                              )}
                            </div>
                            <span
                              className={cn(
                                'text-[10px] font-black tracking-[2px] uppercase italic',
                                user.role === 'admin'
                                  ? 'text-slate-900'
                                  : 'text-slate-500',
                              )}
                            >
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span
                            className={cn(
                              'flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black tracking-widest uppercase italic shadow-sm',
                              user.status === 'active'
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                : user.status === 'suspended'
                                  ? 'border-amber-100 bg-amber-50 text-amber-600'
                                  : 'border-slate-200 bg-slate-100 text-slate-500',
                            )}
                          >
                            <div
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                user.status === 'active'
                                  ? 'bg-emerald-500'
                                  : user.status === 'suspended'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400',
                              )}
                            ></div>
                            {user.status}
                          </span>
                        </td>
                        {currentUser?.role !== 'inventory' && (
                          <td className="px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Link
                                to={`/admin/account/manage/${user.type}/${user.id}`}
                                className="rounded-2xl p-3 text-slate-400 shadow-sm transition-all hover:bg-slate-900 hover:text-white active:scale-95"
                              >
                                <Edit2 size={16} />
                              </Link>
                              <button
                                onClick={() => {
                                  if (user.id) {
                                    setShowDeleteConfirm(user.id)
                                  }
                                }}
                                className="rounded-2xl p-3 text-slate-400 shadow-sm transition-all hover:bg-rose-500 hover:text-white active:scale-95"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="bg-slate-50/30 px-8 py-20 text-center"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <Search size={32} className="text-slate-200" />
                          <p className="text-lg font-black text-slate-900 uppercase italic">
                            No Results Found
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[24px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40">
            <span className="font-mono text-[10px] font-black tracking-[2px] text-slate-400 uppercase text-center sm:text-left">
              Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, filteredUsers.length)} of {filteredUsers.length} entries
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-xl bg-slate-50 px-4 py-2.5 text-[10px] font-black tracking-widest text-slate-600 uppercase hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 transition-all focus:outline-none"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    "h-9 w-9 rounded-xl text-[10px] font-black transition-all focus:outline-none",
                    currentPage === p
                      ? "bg-slate-900 text-[#75EEA5] shadow-lg shadow-slate-900/20"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="rounded-xl bg-slate-50 px-4 py-2.5 text-[10px] font-black tracking-widest text-slate-600 uppercase hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 transition-all focus:outline-none"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authenticator Modal */}
      <AnimatePresence>
        {authenticatorModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <Authenticator
              email={authenticatorModal.accountEmail}
              codeType="delete_account"
              targetId={authenticatorModal.accountId}
              onSuccess={async () => {
                setAuthenticatorModal({ isOpen: false, accountId: '', accountEmail: '' })
                
                try {
                  await axiosInstance.delete(`/api/accounts/${authenticatorModal.accountId}/soft-delete`, {
                    data: { password: adminPassword, reason: deleteReason }
                  })
                  toast.success('Account moved to deleted accounts')
                  setShowDeleteConfirm(null)
                  setDeleteReason('')
                  setAdminPassword('')
                  setPasswordError(null)
                  fetchAccounts()
                } catch (err) {
                  const axiosError = err as { response?: { data?: { message?: string } } }
                  setPasswordError(axiosError.response?.data?.message || 'Failed to delete account')
                  toast.error(axiosError.response?.data?.message || 'Failed to delete account')
                }
              }}
              onCancel={() => setAuthenticatorModal({ isOpen: false, accountId: '', accountEmail: '' })}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Soft Delete Confirmation Modal (Mobile Bottom Sheet, Desktop Centered Modal) */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => {
                setShowDeleteConfirm(null)
                setAdminPassword('')
                setDeleteReason('')
                setPasswordError(null)
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[40px] bg-white p-6 sm:p-12 shadow-2xl border border-slate-100"
            >
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-rose-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-rose-500 uppercase italic">
                    Critical Operation
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Soft Delete Account?
                </h2>
              </div>

              {/* User details */}
              {(() => {
                const userObj = users.find(u => u.id === showDeleteConfirm)
                return userObj ? (
                  <div className="space-y-6">
                    {/* Warning Card */}
                    <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-100/80">
                      <ShieldAlert size={22} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[10px] font-black tracking-[2px] text-rose-600 uppercase italic">
                          Critical Warning
                        </h4>
                        <p className="text-[11px] font-bold text-rose-600/90 leading-relaxed mt-1">
                          You are about to soft-delete this user account. This will immediately block their access, terminate active sessions, and archive their credentials in the deleted accounts registry.
                        </p>
                      </div>
                    </div>

                    {/* Detailed Info Card */}
                    <div className="max-h-[250px] overflow-y-auto rounded-2xl bg-slate-50 border border-slate-100 p-5 text-left space-y-4">
                      <div className="flex items-center gap-3">
                        {userObj.profile_picture && (
                          <img
                            src={
                              userObj.profile_picture.startsWith('http') ||
                              userObj.profile_picture.startsWith('blob:') ||
                              userObj.profile_picture.startsWith('data:')
                                ? userObj.profile_picture
                                : `/src/assets/profile/${userObj.profile_picture}`
                            }
                            alt={userObj.name}
                            className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                          />
                        )}
                        <div>
                          <h4 className="text-[9px] font-black tracking-[3px] text-slate-400 uppercase">Account Profile</h4>
                          <p className="text-sm font-black text-slate-900 uppercase italic">{userObj.name}</p>
                          <p className="text-[10px] font-mono font-bold text-slate-500">{userObj.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200/60 pt-3 text-xs">
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">User ID</span>
                          <p className="font-mono font-bold text-slate-900">{userObj.id}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Account Type</span>
                          <p className="font-bold text-slate-900 uppercase italic">{userObj.type}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Role</span>
                          <p className="font-bold text-slate-900 uppercase italic">{userObj.role}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Status</span>
                          <p className="font-bold text-slate-900 uppercase italic">{userObj.status}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Company</span>
                          <p className="font-bold text-slate-900 truncate">{userObj.company_name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Registered On</span>
                          <p className="font-mono font-bold text-slate-900">{formatDate(userObj.date_created)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null
              })()}

              <form onSubmit={(e) => {
                e.preventDefault()
                if (!adminPassword.trim()) {
                  setPasswordError('Password is required')
                  return
                }
                if (!deleteReason.trim()) {
                  toast.error('Reason for deletion is required')
                  return
                }
                setAuthenticatorModal({
                  isOpen: true,
                  accountId: showDeleteConfirm,
                  accountEmail: currentUser?.email || '',
                })
              }}>
                <div className="mb-4 text-left">
                  <label className="mb-2 block text-[9px] font-black tracking-[3px] text-slate-400 uppercase">
                    Reason for Deletion
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide a mandatory reason..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    required
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-semibold outline-none focus:border-rose-500 focus:bg-white transition-all focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="mb-6 text-left">
                  <label className="mb-2 block text-[9px] font-black tracking-[3px] text-slate-400 uppercase">
                    Verify Admin Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password to confirm..."
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value)
                      setPasswordError(null)
                    }}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-rose-500 focus:bg-white transition-all focus:ring-2 focus:ring-rose-500/20"
                  />
                  {passwordError && (
                    <p className="mt-2 text-xs font-black text-rose-500 uppercase">
                      ⚠️ {passwordError}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(null)
                      setAdminPassword('')
                      setDeleteReason('')
                      setPasswordError(null)
                    }}
                    className="flex-1 rounded-3xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-3xl bg-rose-600 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-rose-900/20 transition-all hover:bg-rose-700 hover:scale-105 active:scale-95"
                  >
                    Soft Delete
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permanent Purge Confirmation Modal */}
      <AnimatePresence>
        {showPurgeConfirm && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => {
                setShowPurgeConfirm(null)
                setAdminPassword('')
                setPasswordError(null)
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[40px] bg-white p-6 sm:p-12 shadow-2xl border border-slate-100"
            >
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-rose-600" />
                  <span className="text-[10px] font-black tracking-[4px] text-rose-600 uppercase italic">
                    Irreversible Purge
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Purge from Database?
                </h2>
              </div>

              {/* Deleted Account Details */}
              {(() => {
                const accountObj = deletedAccounts.find(a => String(a.id) === showPurgeConfirm)
                return accountObj ? (
                  <div className="space-y-6">
                    {/* Irreversible Purge Warning Card */}
                    <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-100/80">
                      <ShieldAlert size={22} className="text-rose-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[10px] font-black tracking-[2px] text-rose-700 uppercase italic">
                          Irreversible Purge
                        </h4>
                        <p className="text-[11px] font-bold text-rose-700 leading-relaxed mt-1">
                          CRITICAL WARNING: This action will permanently purge this account from the database. This operation is IRREVERSIBLE and cannot be undone under any circumstances.
                        </p>
                      </div>
                    </div>

                    {/* Detailed Info Card */}
                    <div className="max-h-[250px] overflow-y-auto rounded-2xl bg-rose-50/50 border border-rose-100 p-5 text-left space-y-4">
                      <div>
                        <h4 className="text-[9px] font-black tracking-[3px] text-rose-500 uppercase">Archive Identity</h4>
                        <p className="text-sm font-black text-slate-900 uppercase italic">{accountObj.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rose-200/60 pt-3 text-xs">
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase">Original ID</span>
                          <p className="font-mono font-bold text-slate-900">{accountObj.original_id}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase">Account Type</span>
                          <p className="font-bold text-slate-900 uppercase italic">{accountObj.account_type}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase">Archive Record ID</span>
                          <p className="font-mono font-bold text-slate-900">{accountObj.id}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase">Deleted At</span>
                          <p className="font-mono font-bold text-slate-900">{formatDate(accountObj.deleted_at)}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase">Deleted By</span>
                          <p className="font-bold text-slate-900">{accountObj.deleted_by}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase">Deleted By Type</span>
                          <p className="font-bold text-slate-900 uppercase italic">{accountObj.deleted_by_type}</p>
                        </div>
                      </div>

                      {accountObj.reason && (
                        <div className="border-t border-rose-200/60 pt-3">
                          <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase">Reason for Deletion</span>
                          <div className="mt-1 bg-white/80 p-3 rounded-xl border border-rose-200/40 text-xs font-semibold text-slate-700 italic">
                            "{accountObj.reason}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              })()}

              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!adminPassword.trim()) {
                  setPasswordError('Password is required')
                  return
                }
                try {
                  await axiosInstance.delete(`/api/accounts/deleted/${showPurgeConfirm}/purge`, {
                    data: { password: adminPassword }
                  })
                  toast.success('Account permanently purged from database')
                  setShowPurgeConfirm(null)
                  setAdminPassword('')
                  setPasswordError(null)
                  fetchDeletedAccounts()
                } catch (err) {
                  const axiosError = err as { response?: { data?: { message?: string } } }
                  setPasswordError(axiosError.response?.data?.message || 'Failed to purge account')
                }
              }}>
                <div className="mb-6 text-left">
                  <label className="mb-2 block text-[9px] font-black tracking-[3px] text-rose-500 uppercase">
                    Verify Admin Password to Purge
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password to authorize purge..."
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value)
                      setPasswordError(null)
                    }}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-rose-600 focus:bg-white transition-all focus:ring-2 focus:ring-rose-600/20"
                  />
                  {passwordError && (
                    <p className="mt-2 text-xs font-black text-rose-500 uppercase">
                      ⚠️ {passwordError}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPurgeConfirm(null)
                      setAdminPassword('')
                      setPasswordError(null)
                    }}
                    className="flex-1 rounded-3xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-3xl bg-rose-600 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-rose-900/20 transition-all hover:bg-rose-700 hover:scale-105 active:scale-95"
                  >
                    Confirm Purge
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Accounts
