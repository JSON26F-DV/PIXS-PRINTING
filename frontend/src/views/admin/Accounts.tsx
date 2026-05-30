import React, { useState, useMemo, useEffect } from 'react'
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
  ShieldAlert
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import debounce from 'lodash/debounce'
import BoxFallback from '../../components/common/BoxFallback'
import AnimatedNumber from '../../components/animations/AnimatedNumber'
import axiosInstance from '../../lib/axiosInstance'

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
        className={cn(size, 'rounded-[22px] bg-slate-900 overflow-hidden')}
        iconClassName="h-8 w-8 brightness-0 invert opacity-30"
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
        'rounded-[22px] border-2 border-white bg-slate-100 object-cover shadow-xl ring-1 ring-slate-100',
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
        'group relative overflow-hidden rounded-[24px] p-6 shadow-2xl transition-all hover:-translate-y-1',
        bgClass,
      )}
    >
      <div
        className={cn(
          'absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12',
        )}
      >
        <Icon className={cn('h-32 w-32')} />
      </div>
      <p
        className={cn(
          'relative z-10 mb-3 text-xs font-black tracking-[2px] uppercase opacity-70',
        )}
      >
        {title}
      </p>
      <div className="relative z-10 flex items-baseline gap-1">
        <span className="text-xl font-bold opacity-60">{prefix}</span>
        <AnimatedNumber
          value={value}
          className="text-4xl font-black tracking-tighter"
        />
      </div>
    </div>
  )
}

// --- MAIN PAGE ---

const Accounts: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    document.title = 'Account Infrastructure | PIXS ERP'
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const { data } = await axiosInstance.get('/api/admin/accounts')
      if (data.status === 'success') {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- SEARCH LOGIC ---
  const handleSearchDebounce = useMemo(
    () => debounce((q: string) => setDebouncedSearch(q), 300),
    [],
  )

  useEffect(() => {
    handleSearchDebounce(searchTerm)
    return () => handleSearchDebounce.cancel()
  }, [searchTerm, handleSearchDebounce])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.id.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter || u.type === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [users, debouncedSearch, roleFilter, statusFilter])

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
      <header className="flex flex-col justify-between gap-4 pt-12 md:flex-row md:items-center">
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
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/account/manage/employee"
            className="flex items-center gap-2 rounded-3xl border border-blue-200 bg-blue-100 px-6 py-3 text-[11px] font-black tracking-[3px] text-blue-900 uppercase italic transition-all hover:-translate-y-1 hover:bg-blue-200"
          >
            <UserPlus size={16} />
            Create Employee
          </Link>
          <Link
            to="/admin/account/manage/customer"
            className="flex items-center gap-2 rounded-3xl border border-[#5de291]/50 bg-[#75EEA5] px-6 py-3 text-[11px] font-black tracking-[3px] text-slate-900 uppercase italic shadow-xl shadow-[#75EEA5]/20 transition-all hover:-translate-y-1 hover:bg-[#5de291]"
          >
            <UserPlus size={16} />
            Create Customer
          </Link>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
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

      {/* Control Bar */}
      <div className="search-filter-bar flex flex-col items-center justify-between gap-4 rounded-[32px] border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-200/40 md:flex-row">
        <div className="group relative w-full max-w-md flex-1">
          <Search
            className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Registry..."
            className="w-full rounded-[22px] border border-slate-100 bg-slate-50 py-4 pr-6 pl-14 font-mono text-sm font-bold text-slate-900 italic transition-all placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex w-full flex-wrap gap-3 md:w-auto">
          <select
            className="cursor-pointer appearance-none rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-100 focus:outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Role: All</option>
            <option value="admin">Role: Admin</option>
            <option value="staff">Role: Staff</option>
            <option value="customer">Role: Customer</option>
          </select>
          <select
            className="cursor-pointer appearance-none rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-100 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Status: All</option>
            <option value="active">Active Entry</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('')
              setRoleFilter('all')
              setStatusFilter('all')
            }}
            className="group flex items-center gap-2 rounded-[20px] bg-slate-100 p-4 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-900 hover:text-white"
          >
            <RefreshCw
              size={14}
              className="transition-transform duration-500 group-hover:rotate-180"
            />
          </button>
        </div>
      </div>

      {/* Account Table */}
      <div className="account-table overflow-hidden rounded-[44px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Profile
                </th>
                <th className="hidden px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase md:table-cell">
                  ID & Gmail
                </th>
                <th className="hidden px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase md:table-cell">
                  Company Name
                </th>
                <th className="hidden px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase md:table-cell">
                  Role
                </th>
                <th className="hidden px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase md:table-cell">
                  Status
                </th>
                <th className="px-6 py-6 text-right text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400">Loading accounts...</td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <UserAvatar src={user.profile_picture} name={user.name} size="h-12 w-12" />
                        <div>
                          <p className="text-sm font-black tracking-tight text-slate-900 uppercase italic">
                            {user.name}
                          </p>
                          <p className="mt-1 font-mono text-[10px] font-black tracking-[2px] text-slate-400 md:hidden">
                            {user.role} | {user.status}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-6 md:table-cell">
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
                    <td className="hidden px-6 py-6 md:table-cell">
                      <span className="text-xs font-bold text-slate-600">
                        {user.company_name || 'N/A'}
                      </span>
                    </td>
                    <td className="hidden px-6 py-6 md:table-cell">
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
                    <td className="hidden px-6 py-6 md:table-cell">
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
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/account/manage/${user.type}/${user.id}`}
                          className="rounded-[16px] p-3 text-slate-400 shadow-sm transition-all hover:bg-slate-900 hover:text-white"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <Link
                          to={`/admin/account/delete/${user.id}`}
                          className="rounded-[16px] p-3 text-slate-400 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </Link>
                      </div>
                    </td>
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
    </div>
  )
}

export default Accounts
