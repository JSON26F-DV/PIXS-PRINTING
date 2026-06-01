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
import { motion, AnimatePresence } from 'framer-motion'
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
        setIsLoadingData(true)
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
              </motion.div>
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
