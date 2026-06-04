import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  ShieldCheck,
  ChevronRight,
  Check,
  Filter,
  Package,
  LayoutGrid,
  UserCircle,
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import axiosInstance from '../../../lib/axiosInstance'
import type { IProduct } from './types'
import BoxFallback from '../../../components/common/BoxFallback'

interface Employee {
  id: string
  name: string
  role: string
  profile_picture: string
  email: string
  allowed_categories?: string[]
  allowed_products?: string[]
}

interface Order {
  order_id: string
  user_id: string
  created_at: string
  total_amount: number
  products: Array<{
    productName: string
    category: string
    quantity: number
  }>
}

interface TechnicianAssignmentSectionProps {
  categories: { id: string; label: string }[]
}

type AssignmentMode = 'categories' | 'products'
type RoleFilter = 'all' | 'staff' | 'technician'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

const ProductImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [error, setError] = useState(false)
  if (error || !src) {
    return <BoxFallback className={cn("flex items-center justify-center bg-slate-100", className)} iconClassName="h-6 w-6 opacity-30" />
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />
}

export const TechnicianAssignmentSection: React.FC<
  TechnicianAssignmentSectionProps
> = ({ categories }) => {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [assignmentMode, setAssignmentMode] =
    useState<AssignmentMode>('categories')
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [products, setProducts] = useState<IProduct[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // View mode toggle
  const [viewMode, setViewMode] = useState<'assignments' | 'pending'>('assignments')

  // Multi-select employees
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())

  // Pending orders filter
  const [pendingOrdersFilter, setPendingOrdersFilter] = useState<{
    category: string
    orderId: string
  }>({ category: 'all', orderId: '' })

  // Pending orders data
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)

  // Fetch pending orders function
  const fetchPendingOrders = async () => {
    setIsLoadingPending(true)
    try {
      const res = await axiosInstance.post('/api/admin/employees/pending-orders', {
        employee_ids: Array.from(selectedEmployeeIds),
        category: pendingOrdersFilter.category === 'all' ? null : pendingOrdersFilter.category,
        order_id: pendingOrdersFilter.orderId || null,
      })
      setPendingOrders(res.data?.data || [])
    } catch (e) {
      console.error('Failed to fetch pending orders', e)
      toast.error('Failed to load pending orders')
    } finally {
      setIsLoadingPending(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'pending' && selectedEmployeeIds.size > 0) {
      const delayDebounceFn = setTimeout(() => {
        fetchPendingOrders()
      }, 200)
      return () => clearTimeout(delayDebounceFn)
    } else if (viewMode === 'pending' && selectedEmployeeIds.size === 0) {
      setPendingOrders([])
    }
  }, [viewMode, selectedEmployeeIds, pendingOrdersFilter.category, pendingOrdersFilter.orderId])

  const getProfilePictureUrl = (pic?: string | null) => {
    if (!pic) return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    if (pic.startsWith('http') || pic.startsWith('blob:') || pic.startsWith('data:')) {
      return pic
    }
    return `/src/assets/profile/${pic}`
  }

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const [accountsRes, productsRes] = await Promise.all([
          axiosInstance.get('/api/admin/accounts'),
          axiosInstance.get('/api/admin/products')
        ])
        
        if (isMounted) {
          const allAccounts = accountsRes.data?.data || []
          const empList = allAccounts.filter((acc: { type: string; role: string }) => 
            acc.type === 'employee' && ['staff', 'technician'].includes(acc.role)
          )
          setEmployees(empList)
          
          const prodList = productsRes.data?.data || []
          setProducts(prodList)
        }
      } catch (error) {
        console.error('Error fetching matrix data:', error)
        toast.error('Failed to load matrix data')
      } finally {
        if (isMounted) {
          setIsLoadingData(false)
        }
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter
    return matchesSearch && matchesRole
  })

  const selectedEmp = employees.find((e) => e.id === selectedEmpId)

  const handleToggleCategory = async (catLabel: string) => {
    if (!selectedEmpId) return

    const employee = employees.find(emp => emp.id === selectedEmpId)
    if (!employee) return

    const current = employee.allowed_categories || []
    const next = current.includes(catLabel)
      ? current.filter((c: string) => c !== catLabel)
      : [...current, catLabel]

    try {
      // Optimistic update
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === selectedEmpId) {
            return { ...emp, allowed_categories: next }
          }
          return emp
        }),
      )

      await axiosInstance.post(`/api/admin/accounts/employee/${selectedEmpId}/assignments`, {
        allowed_categories: next,
        allowed_products: employee.allowed_products || []
      })

      toast.success('Category accessibility updated', {
        icon: '📁',
        style: { borderRadius: '12px', background: '#0f172a', color: '#fff' },
      })
    } catch (err) {
      console.error('Failed to update category assignment:', err)
      // Revert state
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === selectedEmpId) {
            return { ...emp, allowed_categories: current }
          }
          return emp
        }),
      )
      toast.error('Failed to save assignment changes')
    }
  }

  const handleToggleProduct = async (productName: string) => {
    if (!selectedEmpId) return

    const employee = employees.find(emp => emp.id === selectedEmpId)
    if (!employee) return

    const current = employee.allowed_products || []
    const next = current.includes(productName)
      ? current.filter((p: string) => p !== productName)
      : [...current, productName]

    try {
      // Optimistic update
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === selectedEmpId) {
            return { ...emp, allowed_products: next }
          }
          return emp
        }),
      )

      await axiosInstance.post(`/api/admin/accounts/employee/${selectedEmpId}/assignments`, {
        allowed_categories: employee.allowed_categories || [],
        allowed_products: next
      })

      toast.success('Product assignment updated', {
        icon: '📦',
        style: { borderRadius: '12px', background: '#0f172a', color: '#fff' },
      })
    } catch (err) {
      console.error('Failed to update product assignment:', err)
      // Revert state
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === selectedEmpId) {
            return { ...emp, allowed_products: current }
          }
          return emp
        }),
      )
      toast.error('Failed to save assignment changes')
    }
  }

  if (isLoadingData) {
    return (
      <section className="TechnicianAssignmentSection animate-in slide-in-from-bottom-4 mt-16 space-y-8 duration-700">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
              Workforce Operational Matrix
            </h2>
            <p className="text-xs leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
              Define granular production permissions for staff and technicians.
            </p>
          </div>
        </div>
        <div className="flex h-96 items-center justify-center rounded-[32px] bg-white p-12 text-center shadow-md">
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase italic animate-pulse">
              Synchronizing Operational clearances...
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="TechnicianAssignmentSection animate-in slide-in-from-bottom-4 mt-16 space-y-8 duration-700">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
            Workforce Operational Matrix
          </h2>
          <p className="text-xs leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
            Define granular production permissions for staff and technicians.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setAssignmentMode('categories')}
              className={cn(
                'flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all',
                assignmentMode === 'categories'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <LayoutGrid size={14} /> Categories
            </button>
            <button
              onClick={() => setAssignmentMode('products')}
              className={cn(
                'flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all',
                assignmentMode === 'products'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <Package size={14} /> Specific Products
            </button>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-[#75EEA5] shadow-xl">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
        {/* Left: Personnel List & Filters */}
        <div className="sticky top-8 space-y-6 xl:col-span-4">
          <div className="rounded-[32px] border border-slate-100 bg-white p-7 shadow-2xl shadow-slate-200/50">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setViewMode('assignments')}
                className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  viewMode === 'assignments'
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck size={14} />
                Assignments
              </button>
              <button
                onClick={() => setViewMode('pending')}
                className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  viewMode === 'pending'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Package size={14} />
                Pending Orders
              </button>
            </div>

            <div className="mb-8 space-y-4">
              <div className="relative">
                <Search
                  className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-300"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by identity..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 pr-6 pl-12 text-[11px] font-bold tracking-tight text-slate-900 uppercase transition-all outline-none focus:border-emerald-300"
                />
              </div>

              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                {(['all', 'staff', 'technician'] as RoleFilter[]).map(
                  (role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={cn(
                        'rounded-xl border px-4 py-2 text-[9px] font-black tracking-widest whitespace-nowrap uppercase transition-all',
                        roleFilter === role
                          ? 'border-slate-900 bg-slate-900 text-emerald-400'
                          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300',
                      )}
                    >
                      {role}
                    </button>
                  ),
                )}
              </div>
            </div>

            {viewMode === 'assignments' ? (
              <div className="no-scrollbar max-h-[600px] space-y-2.5 overflow-y-auto pr-1">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={cn(
                      'group flex w-full items-center justify-between rounded-3xl border-2 p-4 transition-all',
                      selectedEmpId === emp.id
                        ? 'scale-[1.02] border-slate-900 bg-slate-900 shadow-2xl'
                        : 'border-slate-50 bg-white hover:border-slate-100 hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={getProfilePictureUrl(emp.profile_picture)}
                          className="h-12 w-12 rounded-2xl border border-slate-100 object-cover shadow-sm grayscale transition-all group-hover:grayscale-0"
                        />
                        <div
                          className={cn(
                            'absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-lg border-2 border-white text-[8px] font-black shadow-lg',
                            emp.role === 'admin'
                              ? 'bg-rose-500 text-white'
                              : emp.role === 'technician'
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-400 text-white',
                          )}
                        >
                          {emp.role.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="text-left">
                        <p
                          className={cn(
                            'text-xs font-black tracking-tight uppercase italic',
                            selectedEmpId === emp.id
                              ? 'text-white'
                              : 'text-slate-900',
                          )}
                        >
                          {emp.name}
                        </p>
                        <span
                          className={cn(
                            'text-[9px] font-bold tracking-[2px] uppercase',
                            selectedEmpId === emp.id
                              ? 'text-emerald-400'
                              : 'text-slate-400',
                          )}
                        >
                          {emp.id}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={
                        selectedEmpId === emp.id
                          ? 'text-emerald-400'
                          : 'text-slate-200'
                      }
                    />
                  </button>
                ))}
                {filteredEmployees.length === 0 && (
                  <div className="flex flex-col items-center gap-4 py-20 text-center opacity-40 grayscale">
                    <UserCircle size={48} className="text-slate-300" />
                    <p className="text-[10px] font-bold tracking-widest uppercase italic">
                      No matching personnel
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Select Employees ({selectedEmployeeIds.size} selected)
                  </p>
                  {selectedEmployeeIds.size > 0 && (
                    <button
                      onClick={() => setSelectedEmployeeIds(new Set())}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                {/* Employee checkbox list */}
                <div className="no-scrollbar max-h-[500px] space-y-3 overflow-y-auto pr-1">
                  {filteredEmployees.map((emp) => (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-4 p-4 rounded-3xl border cursor-pointer transition-all ${
                        selectedEmployeeIds.has(emp.id)
                          ? 'border-emerald-300 bg-emerald-50/50 shadow-md'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.has(emp.id)}
                        onChange={(e) => {
                          setSelectedEmployeeIds((prev) => {
                            const next = new Set(prev)
                            if (e.target.checked) next.add(emp.id)
                            else next.delete(emp.id)
                            return next
                          })
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="h-10 w-10 flex-shrink-0 rounded-2xl bg-slate-200 overflow-hidden border border-slate-100">
                        {emp.profile_picture ? (
                          <img 
                            src={getProfilePictureUrl(emp.profile_picture)} 
                            alt={emp.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <UserCircle size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{emp.name}</p>
                        <p className="text-[9px] text-slate-400 uppercase">{emp.role}</p>
                      </div>
                      {selectedEmployeeIds.has(emp.id) && (
                        <Check size={16} className="text-emerald-500 shrink-0" />
                      )}
                    </label>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <div className="flex flex-col items-center gap-4 py-20 text-center opacity-40 grayscale">
                      <UserCircle size={48} className="text-slate-300" />
                      <p className="text-[10px] font-bold tracking-widest uppercase italic">
                        No matching personnel
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detailed Mapping Container */}
        <div className="xl:col-span-8">
          <AnimatePresence mode="wait">
            {viewMode === 'pending' ? (
              selectedEmployeeIds.size > 0 ? (
                <m.div
                  key="pending-orders-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="relative h-full min-h-[600px] overflow-hidden rounded-[48px] border border-slate-100 bg-white p-10 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] flex flex-col"
                >
                  <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-emerald-50/50 blur-[100px]" />

                  <div className="relative z-10 flex-1 flex flex-col space-y-10">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                          Pending Orders Queue
                        </h3>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase italic mt-1">
                          Queue for {selectedEmployeeIds.size} Selected Employees
                        </p>
                      </div>
                    </div>

                    <div className="h-px w-full bg-slate-100" />

                    {/* Filter Controls */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Filter Orders
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Category Filter */}
                        <select
                          value={pendingOrdersFilter.category}
                          onChange={(e) => setPendingOrdersFilter(f => ({ ...f, category: e.target.value }))}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 outline-none"
                        >
                          <option value="all">All Categories</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.label}>{cat.label}</option>
                          ))}
                        </select>
                        
                        {/* Specific Order ID */}
                        <input
                          type="text"
                          placeholder="Or enter specific Order ID..."
                          value={pendingOrdersFilter.orderId}
                          onChange={(e) => setPendingOrdersFilter(f => ({ ...f, orderId: e.target.value }))}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold placeholder:text-slate-300 text-slate-700 outline-none"
                        />
                      </div>
                    </div>

                    {/* Pending Orders List */}
                    <div className="no-scrollbar flex-1 overflow-y-auto pr-1 space-y-4 max-h-[500px]">
                      {isLoadingPending ? (
                        <div className="flex items-center justify-center py-24">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
                        </div>
                      ) : pendingOrders.length === 0 ? (
                        <div className="py-24 text-center opacity-40">
                          <Package size={48} className="mx-auto mb-4 text-slate-300" />
                          <p className="text-xs font-bold text-slate-400 uppercase italic">No pending orders found</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pendingOrders.map(order => (
                            <PendingOrderCard 
                              key={order.order_id} 
                              order={order} 
                              employees={employees}
                              selectedEmployeeIds={selectedEmployeeIds}
                              isSpecificSearch={pendingOrdersFilter.orderId.trim() !== ''}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </m.div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-6 rounded-[48px] border border-dashed border-slate-200 bg-white p-20 text-center">
                  <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-[32px] bg-slate-50 text-slate-300">
                    <Users size={48} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                      Personnel Not Selected
                    </h4>
                    <p className="mx-auto max-w-[300px] text-xs leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
                      Select one or more employees from the registry list to load their combined pending queues.
                    </p>
                  </div>
                </div>
              )
            ) : selectedEmp ? (
              <m.div
                key={selectedEmp.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="relative h-full min-h-[600px] overflow-hidden rounded-[48px] border border-slate-100 bg-white p-10 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)]"
              >
                <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-emerald-50/50 blur-[100px]" />

                <div className="relative z-10 space-y-10">
                  <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <img
                          src={getProfilePictureUrl(selectedEmp.profile_picture)}
                          className="h-20 w-20 rounded-[32px] object-cover shadow-2xl ring-[6px] ring-emerald-50"
                        />
                        <div className="absolute -top-2 -right-2 animate-bounce rounded-xl bg-slate-900 p-2 text-[#75EEA5] shadow-lg">
                          <ShieldCheck size={16} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                          Operational Clearance
                        </h3>
                        <div className="mt-1.5 flex items-center gap-4">
                          <span className="rounded-lg bg-slate-900 px-3 py-1 text-[9px] font-black tracking-widest text-emerald-400 uppercase">
                            {selectedEmp.name}
                          </span>
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase italic">
                            {selectedEmp.role} Node
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-100" />

                  {assignmentMode === 'categories' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-500">
                      <div className="flex items-center gap-3">
                        <LayoutGrid size={18} className="text-slate-400" />
                        <h4 className="text-[11px] font-black tracking-[4px] text-slate-400 uppercase italic">
                          Mapped Categories
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((cat) => {
                          const isAllowed = (
                            selectedEmp.allowed_categories || []
                          ).includes(cat.label)
                          return (
                            <button
                              key={cat.id}
                              onClick={() => handleToggleCategory(cat.label)}
                              className={cn(
                                'group relative overflow-hidden rounded-[32px] border p-6 text-left transition-all',
                                isAllowed
                                  ? 'border-emerald-100 bg-emerald-50 shadow-lg shadow-emerald-500/5'
                                  : 'border-slate-100 bg-white hover:border-slate-200',
                              )}
                            >
                              {isAllowed && (
                                <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg">
                                  <Check size={12} strokeWidth={4} />
                                </div>
                              )}
                              <p
                                className={cn(
                                  'mb-2 text-[9px] font-black tracking-widest uppercase italic',
                                  isAllowed
                                    ? 'text-emerald-700'
                                    : 'text-slate-400',
                                )}
                              >
                                Group Tag
                              </p>
                              <h4
                                className={cn(
                                  'text-lg font-black tracking-tight uppercase italic',
                                  isAllowed
                                    ? 'text-emerald-900'
                                    : 'text-slate-900',
                                )}
                              >
                                {cat.label}
                              </h4>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-left-4 space-y-6 duration-500">
                      <div className="flex items-center gap-3">
                        <Package size={18} className="text-slate-400" />
                        <h4 className="text-[11px] font-black tracking-[4px] text-slate-400 uppercase italic">
                          Specific Asset Nodes
                        </h4>
                      </div>
                      <div className="no-scrollbar grid max-h-[500px] grid-cols-1 gap-4 overflow-y-auto pr-2 sm:grid-cols-2">
                        {products.map((prod) => {
                          const isAllowed = (
                            selectedEmp.allowed_products || []
                          ).includes(prod.name)
                          return (
                            <button
                              key={prod.id}
                              onClick={() => handleToggleProduct(prod.name)}
                              className={cn(
                                'group relative flex items-center gap-5 rounded-[28px] border p-5 text-left transition-all',
                                isAllowed
                                  ? 'border-indigo-100 bg-indigo-50 shadow-lg shadow-indigo-500/5'
                                  : 'border-slate-50 bg-white hover:border-slate-200',
                              )}
                            >
                              <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
                                <ProductImage
                                  src={`/public/images/products/${prod.main_image}`}
                                  alt={prod.name}
                                  className="h-full w-full rounded-xl object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <p
                                  className={cn(
                                    'mb-1 text-[8px] font-black tracking-widest uppercase italic',
                                    isAllowed
                                      ? 'text-indigo-400'
                                      : 'text-slate-400',
                                  )}
                                >
                                  {prod.id}
                                </p>
                                <h5
                                  className={cn(
                                    'text-xs font-black tracking-tight uppercase italic',
                                    isAllowed
                                      ? 'text-indigo-900'
                                      : 'text-slate-900',
                                  )}
                                >
                                  {prod.name}
                                </h5>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-[8px] font-bold text-slate-400 italic">
                                    {prod.category}
                                  </span>
                                </div>
                              </div>
                              {isAllowed && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-lg">
                                  <Check size={12} strokeWidth={4} />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex items-center gap-6 rounded-[40px] border border-slate-100 bg-slate-50 p-8">
                    <div className="rounded-2xl bg-white p-4 text-slate-400 shadow-xl shadow-slate-200/40">
                      <Filter size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-black tracking-widest text-slate-900 uppercase italic">
                        Node Sync Protection
                      </p>
                      <p className="max-w-[500px] text-[10px] leading-relaxed font-bold tracking-tight text-slate-400 uppercase">
                        Changes applied to this operational clearance will
                        restrict this employee's Live Queue in real-time. Only
                        processing orders matching these{' '}
                        {assignmentMode === 'categories'
                          ? 'categories'
                          : 'specific products'}{' '}
                        will be visible.
                      </p>
                    </div>
                  </div>
                </div>
              </m.div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-6 rounded-[48px] border border-dashed border-slate-200 bg-white p-20 text-center">
                <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-[32px] bg-slate-50 text-slate-300">
                  <Users size={48} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                    Identity Not Isolated
                  </h4>
                  <p className="mx-auto max-w-[300px] text-xs leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
                    Select specialized personnel from the registry dashboard to
                    configure operational mapping.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

const PendingOrderCard = ({
  order,
  employees,
  selectedEmployeeIds,
  isSpecificSearch,
}: {
  order: Order
  employees: Employee[]
  selectedEmployeeIds: Set<string>
  isSpecificSearch: boolean
}) => {
  // Build combined allowed categories of all selected employees
  const allAllowedCats = Array.from(selectedEmployeeIds).flatMap(id => {
    const emp = employees.find(e => e.id === id)
    return (emp?.allowed_categories ?? []).map(c => c.toLowerCase())
  })

  // Filter products shown
  const displayProducts = isSpecificSearch
    ? order.products // show all products when searching by specific order
    : order.products.filter(p =>
        allAllowedCats.length === 0 ||
        allAllowedCats.includes(p.category.toLowerCase())
      )

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {order.order_id}
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
            {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
        <span className="rounded-xl bg-amber-50 px-3 py-1 text-[9px] font-black tracking-widest text-amber-600 uppercase border border-amber-100">
          Pending
        </span>
      </div>
      
      <div className="space-y-3 py-3 border-t border-b border-slate-50">
        {displayProducts.map((p, i) => {
          // In specific search mode, find which selected employees can handle this product
          const eligibleEmployees = isSpecificSearch
            ? employees.filter(
                emp =>
                  selectedEmployeeIds.has(emp.id) &&
                  (emp.allowed_categories ?? []).some(
                    c => c.toLowerCase() === p.category.toLowerCase()
                  )
              )
            : []

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="uppercase truncate flex-1 mr-2">{p.productName}</span>
                <span className="text-slate-400 tracking-wider shrink-0">x{p.quantity}</span>
              </div>
              {isSpecificSearch && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {eligibleEmployees.length > 0 ? (
                    eligibleEmployees.map(emp => (
                      <span
                        key={emp.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[8px] font-black tracking-wider text-emerald-700 uppercase"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {emp.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[8px] font-bold text-slate-300 uppercase italic tracking-wider">
                      No assigned employee
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Total Amount
        </span>
        <span className="text-sm font-black text-emerald-600 italic">
          ₱{order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
