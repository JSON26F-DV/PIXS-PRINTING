import React, { useState, useMemo, useEffect } from 'react'
import {
  TrendingUp,
  Briefcase,
  Package,
  History as HistoryIcon,
  FileText,
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  RotateCcw,
  User,
  MessageSquare
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { m, AnimatePresence } from 'framer-motion'
import type { IProduct, IProductVariant } from '../../../types/product.types'
import type { IExpenditure, IInventoryLog } from '../../../hooks/useStockAnalytics'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { toast } from 'react-hot-toast'
import axiosInstance from '../../../lib/axiosInstance'

interface IProductExtended extends IProduct {
  variantsFiltered?: IProductVariant[]
}

interface InventoryAnalyticsSectionProps {
  products: IProduct[]
  expenditures: IExpenditure[]
  inventoryLogs: IInventoryLog[]
  setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>
  addExpenditure: (data: Partial<IExpenditure>) => Promise<void>
  updateExpenditure: (id: number, data: Partial<IExpenditure>) => Promise<void>
  deleteExpenditure: (id: number) => Promise<void>
  undoInventoryLog: (id: string) => Promise<void>
  initialLogSearch?: string
}

const renderPagination = (
  currentPage: number,
  totalItems: number,
  itemsPerPage: number,
  onPageChange: React.Dispatch<React.SetStateAction<number>>
) => {
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1)

  return (
    <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 px-4 py-3 sm:px-6 mt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <button type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="relative inline-flex items-center rounded-xl bg-transparent px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-all"
        >
          Previous
        </button>
        <button type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="relative ml-3 inline-flex items-center rounded-xl bg-transparent px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-all"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-555">
            Showing <span className="font-mono text-slate-900">{totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-mono text-slate-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
            <span className="font-mono text-slate-900">{totalItems}</span> entries
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex gap-1" aria-label="Pagination">
            <button type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="relative inline-flex items-center rounded-xl bg-transparent p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <span className="sr-only">Previous</span>
              &lsaquo;
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1
              const isCurrent = p === currentPage
              return (
                <button type="button"
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`relative inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 text-white'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="relative inline-flex items-center rounded-xl bg-transparent p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <span className="sr-only">Next</span>
              &rsaquo;
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

export const InventoryAnalyticsSection: React.FC<InventoryAnalyticsSectionProps> = ({ 
  products, 
  expenditures, 
  inventoryLogs,
  addExpenditure,
  updateExpenditure,
  deleteExpenditure,
  undoInventoryLog,
  initialLogSearch
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [productSearch, setProductSearch] = useState('')
  const [logSearch, setLogSearch] = useState(initialLogSearch || '')
  const [logCategoryFilter, setLogCategoryFilter] = useState('ALL')
  
  // Stock Level chart sorting and category states
  const [chartSortOrder, setChartSortOrder] = useState<'default' | 'highest' | 'lowest'>('default')
  const [chartCategory, setChartCategory] = useState('ALL')

  // Direct Control low/insufficient stock filters state
  const [directControlStockFilter, setDirectControlStockFilter] = useState<'ALL' | 'INSUFFICIENT' | 'RUNNING_LOW'>('ALL')
  
  // Extra Expense form state
  const [extraExpenseForm, setExtraExpenseForm] = useState({ category: 'Others', description: '', amount: '' })
  
  // Edit form state
  const [editingExpId, setEditingExpId] = useState<number | null>(null)
  const [editExpenseForm, setEditExpenseForm] = useState({ category: '', description: '', amount: '' })

  // Mobile selected log modal state
  const [mobileSelectedLog, setMobileSelectedLog] = useState<IExpenditure | null>(null)
  const [isEditingInMobileModal, setIsEditingInMobileModal] = useState(false)

  // Inventory Logs states
  const [invLogSearch, setInvLogSearch] = useState('')
  const [invLogTypeFilter, setInvLogTypeFilter] = useState('ALL')
  const [mobileSelectedInvLog, setMobileSelectedInvLog] = useState<IInventoryLog | null>(null)

  const [concernModal, setConcernModal] = useState<{
    isOpen: boolean
    expenditureId: string | number
    concernText: string
  }>({ isOpen: false, expenditureId: '', concernText: '' })

  // Pagination States
  const [directControlPage, setDirectControlPage] = useState(1)
  const [operationalLogsPage, setOperationalLogsPage] = useState(1)
  const [auditTrailPage, setAuditTrailPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    if (initialLogSearch && initialLogSearch !== logSearch) {
      const timer = setTimeout(() => {
        setLogSearch(initialLogSearch)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [initialLogSearch, logSearch])

  const filteredInventoryLogs = useMemo(() => {
    let result = [...inventoryLogs]
    if (invLogTypeFilter !== 'ALL') {
      result = result.filter(l => l.type === invLogTypeFilter)
    }
    if (invLogSearch.trim()) {
      const q = invLogSearch.toLowerCase().trim()
      result = result.filter(l => 
        l.id.toLowerCase().includes(q) ||
        l.product_name.toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q) ||
        (l.employee?.first_name || '').toLowerCase().includes(q) ||
        (l.employee?.last_name || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [inventoryLogs, invLogTypeFilter, invLogSearch])



  const handleCreateExpenditureConcernConfirm = async () => {
    if (!concernModal.expenditureId || !concernModal.concernText.trim()) return
    try {
      await axiosInstance.post('/api/messages/send', {
        message: concernModal.concernText.trim(),
        receiver_id: '1',  // Admin ID
        receiver_type: 'employee',
        expenditures_id: String(concernModal.expenditureId),
        product_concern: false,
      })
      toast.success('Expenditure concern message created')
      setConcernModal({ isOpen: false, expenditureId: '', concernText: '' })
    } catch (error) {
      console.error('Failed to create message', error)
      toast.error('Failed to create message')
    }
  }

  // Generate unique categories for chart filtering (maps category_id to category_label)
  const uniqueProductCategories = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach(p => {
      if (p.category_id && p.category_label) {
        map.set(p.category_id, p.category_label)
      }
    })
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [products])

  const filteredProducts = useMemo(() => {
    let result = products.map(p => {
      const threshold = p.min_threshold || 5
      const runningLowThreshold = threshold + (threshold / 2)
      
      let variantsFiltered = p.variants ? [...p.variants] : []
      
      if (directControlStockFilter === 'INSUFFICIENT') {
        variantsFiltered = variantsFiltered.filter(v => v.stock < threshold)
      } else if (directControlStockFilter === 'RUNNING_LOW') {
        variantsFiltered = variantsFiltered.filter(v => v.stock >= threshold && v.stock < runningLowThreshold)
      }
      
      return {
        ...p,
        variantsFiltered
      }
    })

    if (directControlStockFilter !== 'ALL') {
      result = result.filter(p => p.variantsFiltered.length > 0)
    }

    if (productSearch) {
      const q = productSearch.toLowerCase()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
      )
    }
    return result
  }, [products, productSearch, directControlStockFilter])

  const chartData = useMemo(() => {
    let filtered = [...products]

    if (chartCategory !== 'ALL') {
      filtered = filtered.filter(p => p.category_id === chartCategory)
    }

    const mapped = filtered.map((p) => {
      const totalVariantStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0
      return {
        name: p.name,
        stock: totalVariantStock,
        min: p.min_threshold || 0,
        isLow: totalVariantStock < (p.min_threshold || 0),
      }
    })

    if (chartSortOrder === 'highest') {
      mapped.sort((a, b) => b.stock - a.stock)
    } else if (chartSortOrder === 'lowest') {
      mapped.sort((a, b) => a.stock - b.stock)
    }

    return mapped.slice(0, 15)
  }, [products, chartSortOrder, chartCategory])

  const weeklyExpenseData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(today.getDate() - (6 - i))
      const dayName = days[d.getDay()]
      const dayISO = d.toISOString().split('T')[0]

      const dayTotal = expenditures
        .filter((l) => l.created_at.startsWith(dayISO))
        .reduce((acc, l) => acc + Number(l.amount), 0)

      return { name: dayName, total: dayTotal }
    })
  }, [expenditures])

  const filteredLogs = useMemo(() => {
    let result = [...expenditures]
    if (logCategoryFilter !== 'ALL') {
      result = result.filter((l) => l.category === logCategoryFilter)
    }
    if (logSearch) {
      const q = logSearch.toLowerCase().trim()
      result = result.filter((l) => 
        l.description?.toLowerCase().includes(q) ||
        String(l.id).toLowerCase().includes(q)
      )
    }
    return result
  }, [expenditures, logCategoryFilter, logSearch])

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((directControlPage - 1) * ITEMS_PER_PAGE, directControlPage * ITEMS_PER_PAGE)
  }, [filteredProducts, directControlPage])

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice((operationalLogsPage - 1) * ITEMS_PER_PAGE, operationalLogsPage * ITEMS_PER_PAGE)
  }, [filteredLogs, operationalLogsPage])

  const paginatedInventoryLogs = useMemo(() => {
    return filteredInventoryLogs.slice((auditTrailPage - 1) * ITEMS_PER_PAGE, auditTrailPage * ITEMS_PER_PAGE)
  }, [filteredInventoryLogs, auditTrailPage])

  const handleAddExpense = async () => {
    if (!extraExpenseForm.description || !extraExpenseForm.amount) {
      toast.error('Please provide a description and amount')
      return
    }
    await addExpenditure({
      category: extraExpenseForm.category,
      description: extraExpenseForm.description,
      amount: parseFloat(extraExpenseForm.amount)
    })
    setExtraExpenseForm({ category: 'Others', description: '', amount: '' })
  }

  const handleUpdateExpense = async () => {
    if (editingExpId === null) return
    await updateExpenditure(editingExpId, {
      category: editExpenseForm.category,
      description: editExpenseForm.description,
      amount: parseFloat(editExpenseForm.amount)
    })
    setEditingExpId(null)
  }

  const handleUpdateExpenseFromMobileModal = async () => {
    if (!mobileSelectedLog) return
    await updateExpenditure(mobileSelectedLog.id, {
      category: editExpenseForm.category,
      description: editExpenseForm.description,
      amount: parseFloat(editExpenseForm.amount)
    })
    setIsEditingInMobileModal(false)
    setMobileSelectedLog(null)
  }

  const handleDeleteExpense = async (id: number) => {
    if (confirm('Are you sure you want to delete this expenditure?')) {
      await deleteExpenditure(id)
      if (mobileSelectedLog && mobileSelectedLog.id === id) {
        setMobileSelectedLog(null)
      }
    }
  }

  return (
    <section id="inventory-analytics" className="space-y-8 pb-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* CHART SECTION */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="grid min-h-[400px] flex-1 grid-cols-1 md:grid-rows-2 gap-6">
            
            {/* STOCK CHART */}
            <div className="inventory-stock-chart group relative min-h-[300px] overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4 mb-4">
                <div className="flex items-center gap-2 opacity-80">
                  <Package className="text-emerald-400" size={14} />
                  <h4 className="text-[10px] font-black tracking-widest text-slate-255 text-emerald-400 uppercase">
                    Stock Level Visualization
                  </h4>
                </div>
                
                {/* SORT & CATEGORY FILTERS */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={chartSortOrder}
                    onChange={(e) => setChartSortOrder(e.target.value as 'default' | 'highest' | 'lowest')}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[9px] font-black tracking-wider text-slate-300 uppercase outline-none focus:border-emerald-400 transition-colors cursor-pointer"
                  >
                    <option value="default">Default Sort</option>
                    <option value="highest">High to Low</option>
                    <option value="lowest">Low to High</option>
                  </select>
                  <select
                    value={chartCategory}
                    onChange={(e) => setChartCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[9px] font-black tracking-wider text-slate-300 uppercase outline-none focus:border-emerald-400 transition-colors cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {uniqueProductCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis
                      dataKey="name"
                      stroke="none"
                      tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis stroke="none" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}
                      itemStyle={{ color: '#10b981' }}
                      cursor={{ fill: '#ffffff05' }}
                    />
                    <Bar dataKey="stock" radius={[4, 4, 0, 0]} barSize={20}>
                      {chartData.map((e, i) => (
                        <Cell key={i} fill={e.isLow ? '#f43f5e' : '#10b981'} fillOpacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* EXPENDITURE CHART */}
            <div className="expenditure-chart group relative min-h-[300px] overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
              <div className="absolute top-6 left-8 flex items-center gap-2 opacity-50">
                <TrendingUp className="text-blue-400" size={14} />
                <h4 className="text-[9px] font-black tracking-widest text-blue-400 uppercase">
                  Weekly Expenditure Analytics (₱)
                </h4>
              </div>
              <ResponsiveContainer width="100%" height="100%" className="mt-4">
                <BarChart data={weeklyExpenseData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                  <XAxis dataKey="name" stroke="none" tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }} />
                  <YAxis stroke="none" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}
                    itemStyle={{ color: '#3b82f6' }}
                    cursor={{ fill: '#ffffff08' }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40} fill="#3b82f6" fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* DIRECT CONTROL SECTION */}
        <div className="flex h-[750px] flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50 lg:col-span-4">
          <div className="mb-4 flex flex-col gap-3">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900 uppercase tracking-tight">
              <Briefcase className="text-emerald-500" size={20} /> Direct Control
            </h3>

            {/* INSUFFICIENT & RUNNING LOW STOCK FILTERS */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-50 pb-3">
              <button type="button"
                onClick={() => { setDirectControlStockFilter('ALL'); setDirectControlPage(1); }}
                className={`rounded-xl px-3 py-1.5 text-[8px] font-black tracking-wider uppercase border transition-all ${directControlStockFilter === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-700'}`}
              >
                All
              </button>
              <button type="button"
                onClick={() => { setDirectControlStockFilter('INSUFFICIENT'); setDirectControlPage(1); }}
                className={`rounded-xl px-3 py-1.5 text-[8px] font-black tracking-wider uppercase border transition-all ${directControlStockFilter === 'INSUFFICIENT' ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200' : 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100/50'}`}
              >
                Insufficient
              </button>
              <button type="button"
                onClick={() => { setDirectControlStockFilter('RUNNING_LOW'); setDirectControlPage(1); }}
                className={`rounded-xl px-3 py-1.5 text-[8px] font-black tracking-wider uppercase border transition-all ${directControlStockFilter === 'RUNNING_LOW' ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200' : 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100/50'}`}
              >
                Running Low
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Find Product..."
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setDirectControlPage(1); }}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-xs font-black tracking-widest text-slate-900 uppercase shadow-sm transition-all outline-none placeholder:text-slate-350 focus:border-emerald-400 focus:bg-white"
            />
            <Search size={14} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-300" />
          </div>

          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2 pb-6">
            {paginatedProducts.map((p) => {
              const activeVariants = (p as IProductExtended).variantsFiltered || p.variants || []
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/${user?.role === 'inventory' ? 'inventory' : 'admin'}/stock/manage/${p.id}`)}
                  className="cursor-pointer rounded-[24px] border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:border-emerald-200 hover:bg-white hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                    <div>
                      <p className="truncate text-xs leading-tight font-black tracking-tight text-slate-900 uppercase">
                        {p.name}
                      </p>
                      <p className="mt-0.5 text-[8px] font-black tracking-widest text-slate-400 uppercase">
                        ID: {p.id.slice(-4)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-600">
                      Variants: {activeVariants.length || 0}
                    </div>
                  </div>
                  
                  {/* Variant List with Status Badges */}
                  {activeVariants.length > 0 ? (
                    <div className="space-y-1.5">
                      {activeVariants.map((v: IProductVariant) => {
                        const threshold = p.min_threshold || 5
                        const runningLowThreshold = threshold + (threshold / 2)
                        
                        let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-150'
                        let badgeLabel = 'Healthy'
                        
                        if (v.stock < threshold) {
                          badgeColor = 'bg-rose-50 text-rose-600 border-rose-100'
                          badgeLabel = 'Critical'
                        } else if (v.stock < runningLowThreshold) {
                          badgeColor = 'bg-amber-50 text-amber-600 border-amber-100'
                          badgeLabel = 'Low'
                        }

                        return (
                          <div key={v.variant_id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm border border-slate-100 hover:border-slate-200 transition-colors">
                            <span className="text-[10px] font-mono font-bold text-slate-500">ID: {v.variant_id.slice(-5)}</span>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${badgeColor}`}>
                                {badgeLabel}
                              </span>
                              <span className="text-[10px] font-black text-slate-800">
                                {v.stock}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] italic text-slate-400">No matching variants</p>
                  )}
                </div>
              )
            })}
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center opacity-30">
                <Package size={40} className="mb-4 text-slate-350" />
                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                  No Products Found
                </p>
              </div>
            )}
            {renderPagination(
              directControlPage,
              filteredProducts.length,
              ITEMS_PER_PAGE,
              setDirectControlPage
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: EXTRA EXPENSES & LOG HISTORY */}
      <div className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-12">
        {/* EXTRA EXPENSES TERMINAL */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm lg:col-span-4 h-fit">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-black tracking-tight text-slate-900 uppercase">
            <PlusCircle className="text-blue-500" size={20} /> Extra Expenses
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block px-1 font-mono text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                Category
              </label>
              <select
                value={extraExpenseForm.category}
                onChange={(e) => setExtraExpenseForm({ ...extraExpenseForm, category: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="Others">Others</option>
                <option value="Employee Salaries">Employee Salaries</option>
                <option value="Raw Materials / Products">Raw Materials / Products</option>
                <option value="Utilities">Utilities</option>
                <option value="Office / Operational Expenses">Office / Operational</option>
                <option value="Extra / Miscellaneous Expenses">Extra / Misc</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block px-1 font-mono text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                Entry Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Utility - Maintenance"
                value={extraExpenseForm.description}
                onChange={(e) => setExtraExpenseForm({ ...extraExpenseForm, description: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block px-1 font-mono text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                Investment (₱)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={extraExpenseForm.amount}
                onChange={(e) => setExtraExpenseForm({ ...extraExpenseForm, amount: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all outline-none focus:border-blue-500"
              />
            </div>
            <button type="button"
              onClick={handleAddExpense}
              className="w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-[3px] text-white uppercase shadow-2xl transition hover:scale-105 active:scale-95"
            >
              Log Extra Expense
            </button>
          </div>
        </div>

        {/* LOG HISTORY TABLE */}
        <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm lg:col-span-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="flex items-center gap-3 text-lg font-black tracking-tight text-slate-900 uppercase italic">
              <HistoryIcon className="text-violet-500" size={20} /> Operational Logs
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Logs..."
                  value={logSearch}
                  onChange={(e) => { setLogSearch(e.target.value); setOperationalLogsPage(1); }}
                  className="w-full md:w-48 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 pl-9 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all outline-none focus:border-violet-400"
                />
                <Search size={12} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300" />
              </div>

              <select
                value={logCategoryFilter}
                onChange={(e) => { setLogCategoryFilter(e.target.value); setOperationalLogsPage(1); }}
                className="w-full md:w-auto cursor-pointer rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black tracking-widest uppercase shadow-sm outline-none focus:border-violet-400"
              >
                <option value="ALL">All Categories</option>
                <option value="Others">Others</option>
                <option value="Employee Salaries">Employee Salaries</option>
                <option value="Raw Materials / Products">Raw Materials / Products</option>
                <option value="Utilities">Utilities</option>
                <option value="Office / Operational Expenses">Office / Operational</option>
                <option value="Extra / Miscellaneous Expenses">Extra / Misc</option>
              </select>
            </div>
          </div>

          {/* DESKTOP VIEW TABLE */}
          <div className="hidden md:block custom-scrollbar -mx-4 flex-1 overflow-x-auto overflow-y-auto px-4 pr-1">
            <table className="w-full min-w-[600px] border-separate border-spacing-y-2">
              <thead>
                <tr className="rounded-xl bg-slate-50/50 text-left">
                  <th className="rounded-l-xl py-3 pl-4 text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Description & Date
                  </th>
                  <th className="py-3 text-center text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Category
                  </th>
                  <th className="py-3 pr-4 text-right text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Net Cost
                  </th>
                  <th className="rounded-r-xl py-3 pr-4 text-center text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="rounded-l-2xl border-y border-r-0 border-l border-slate-100 bg-white py-4 pl-4 shadow-sm group-hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <FileText className="text-blue-500" size={16} />
                        <div>
                          {editingExpId === log.id ? (
                            <input
                              type="text"
                              value={editExpenseForm.description}
                              onChange={(e) => setEditExpenseForm({ ...editExpenseForm, description: e.target.value })}
                              className="text-xs font-bold border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                            />
                          ) : (
                            <div className="flex flex-col">
                              <p className="text-xs leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                                {log.description || 'No Description'}
                              </p>
                              {log.variant_id && (
                                <span className="mt-1 font-mono text-[9px] font-black text-slate-550">
                                  Variant: {log.variant_id}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="mt-1 text-[8px] font-black tracking-widest text-slate-400 uppercase">
                            {new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-x-0 border-y border-slate-100 bg-white py-4 text-center shadow-sm group-hover:bg-slate-50">
                      {editingExpId === log.id ? (
                        <select
                          value={editExpenseForm.category}
                          onChange={(e) => setEditExpenseForm({ ...editExpenseForm, category: e.target.value })}
                          className="text-[10px] font-bold border border-slate-200 rounded px-1 py-1 outline-none"
                        >
                          <option value="Others">Others</option>
                          <option value="Employee Salaries">Employee Salaries</option>
                          <option value="Raw Materials / Products">Raw Materials / Products</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Office / Operational Expenses">Office / Operational</option>
                          <option value="Extra / Miscellaneous Expenses">Extra / Misc</option>
                        </select>
                      ) : (
                        <span className="rounded px-2 py-1 text-[9px] font-black tracking-widest uppercase bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                          {log.category.split(' / ')[0]}
                        </span>
                      )}
                    </td>
                    <td className="border-y border-r-0 border-l-0 border-slate-100 bg-white py-4 pr-4 text-right shadow-sm group-hover:bg-slate-50">
                      {editingExpId === log.id ? (
                         <input
                           type="number"
                           value={editExpenseForm.amount}
                           onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })}
                           className="text-xs font-bold border border-slate-200 rounded px-2 py-1 outline-none w-24 text-right"
                         />
                      ) : (
                        <p className="font-mono text-xs font-black tracking-tighter text-slate-900">
                          ₱{Number(log.amount).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="rounded-r-2xl border-y border-l-0 border-r border-slate-100 bg-white py-4 pr-4 text-center shadow-sm group-hover:bg-slate-50">
                      {editingExpId === log.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button type="button" onClick={handleUpdateExpense} className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded font-bold">Save</button>
                          <button type="button" onClick={() => setEditingExpId(null)} className="text-[10px] bg-slate-300 text-slate-800 px-2 py-1 rounded font-bold">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          {user?.role === 'admin' ? (
                            <>
                              <button type="button" 
                                onClick={() => {
                                  setEditingExpId(log.id)
                                  setEditExpenseForm({ category: log.category, description: log.description || '', amount: String(log.amount) })
                                }}
                                className="text-blue-500 hover:text-blue-700 transition"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button type="button" 
                                onClick={() => handleDeleteExpense(log.id)}
                                className="text-rose-500 hover:text-rose-700 transition"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <button type="button"
                              onClick={() => setConcernModal({ isOpen: true, expenditureId: log.id, concernText: '' })}
                              className="text-emerald-500 hover:text-emerald-700 transition"
                              title="Report Concern"
                            >
                              <MessageSquare size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW LIST */}
          <div className="block md:hidden custom-scrollbar flex-1 overflow-y-auto space-y-3 pb-6">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Tap an Operational Log to manage details:
            </p>
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => {
                  setMobileSelectedLog(log)
                  setIsEditingInMobileModal(false)
                  setEditExpenseForm({ category: log.category, description: log.description || '', amount: String(log.amount) })
                }}
                className="cursor-pointer flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm active:bg-slate-50 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs font-black text-slate-750">
                    {log.variant_id ? log.variant_id : 'General Log'}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    {new Date(log.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded px-2 py-0.5 text-[8px] font-black tracking-widest uppercase bg-blue-500 text-white shadow">
                    {log.category.split(' / ')[0]}
                  </span>
                  <span className="font-mono text-xs font-black text-slate-900">
                    ₱{Number(log.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {renderPagination(
            operationalLogsPage,
            filteredLogs.length,
            ITEMS_PER_PAGE,
            setOperationalLogsPage
          )}

          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center opacity-10">
              <HistoryIcon size={40} className="mb-4" />
              <p className="text-[14px] font-black tracking-[10px] uppercase">
                No Logs Found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE LOG DETAILS & ACTIONS MODAL */}
      <AnimatePresence>
        {mobileSelectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => {
                setMobileSelectedLog(null)
                setIsEditingInMobileModal(false)
              }}
            />
            {/* Modal Body */}
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl space-y-6 border border-slate-100 z-10"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black tracking-tight text-slate-900">
                  {isEditingInMobileModal ? 'Edit Log Entry' : 'Log Details'}
                </h4>
                <button type="button"
                  onClick={() => {
                    setMobileSelectedLog(null)
                    setIsEditingInMobileModal(false)
                  }}
                  className="size-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-650 font-bold text-lg transition-colors"
                >
                  &times;
                </button>
              </div>

              {isEditingInMobileModal ? (
                /* EDIT FORM IN MODAL */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="ml-1 text-[9px] font-black tracking-[1px] text-slate-400 uppercase">Category</label>
                    <select
                      value={editExpenseForm.category}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none"
                    >
                      <option value="Others">Others</option>
                      <option value="Employee Salaries">Employee Salaries</option>
                      <option value="Raw Materials / Products">Raw Materials / Products</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Office / Operational Expenses">Office / Operational</option>
                      <option value="Extra / Miscellaneous Expenses">Extra / Misc</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="ml-1 text-[9px] font-black tracking-[1px] text-slate-400 uppercase">Reason / Description</label>
                    <input
                      type="text"
                      value={editExpenseForm.description}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="ml-1 text-[9px] font-black tracking-[1px] text-slate-400 uppercase">Net Cost (₱)</label>
                    <input
                      type="number"
                      value={editExpenseForm.amount}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button"
                      onClick={() => setIsEditingInMobileModal(false)}
                      className="flex-1 rounded-xl bg-slate-50 py-3 text-xs font-bold tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100"
                    >
                      Back
                    </button>
                    <button type="button"
                      onClick={handleUpdateExpenseFromMobileModal}
                      className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* READ-ONLY VIEW IN MODAL */
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-50 pb-2.5">
                      <span className="text-xs text-slate-400 font-bold">Variant ID</span>
                      <span className="font-mono text-xs font-black text-slate-800">
                        {mobileSelectedLog.variant_id ? mobileSelectedLog.variant_id : 'General Expenditure Log'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2.5">
                      <span className="text-xs text-slate-400 font-bold">Category</span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase text-blue-600 border border-blue-100">
                        {mobileSelectedLog.category}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2.5">
                      <span className="text-xs text-slate-400 font-bold">Log Reason</span>
                      <span className="text-xs font-black text-slate-800 text-right max-w-[200px] leading-relaxed">
                        {mobileSelectedLog.description || 'No Description'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2.5">
                      <span className="text-xs text-slate-400 font-bold">Date & Time</span>
                      <span className="text-[10px] font-black text-slate-500">
                        {new Date(mobileSelectedLog.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-xs text-slate-400 font-bold">Net Cost</span>
                      <span className="font-mono text-sm font-black text-slate-900">
                        ₱{Number(mobileSelectedLog.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {user?.role === 'admin' ? (
                      <>
                        <button type="button"
                          onClick={() => setIsEditingInMobileModal(true)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-blue-50 hover:bg-blue-100 py-3 text-xs font-extrabold text-blue-700 border border-blue-100 transition-all active:scale-95"
                        >
                          <Edit2 size={12} /> Edit Entry
                        </button>
                        <button type="button"
                          onClick={() => handleDeleteExpense(mobileSelectedLog.id)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 py-3 text-xs font-extrabold text-rose-600 border border-rose-100 transition-all active:scale-95"
                        >
                          <Trash2 size={12} /> Delete Entry
                        </button>
                      </>
                    ) : (
                      <button type="button"
                        onClick={() => {
                          setMobileSelectedLog(null)
                          setConcernModal({ isOpen: true, expenditureId: mobileSelectedLog.id, concernText: '' })
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 py-3 text-xs font-extrabold text-emerald-700 border border-emerald-100 transition-all active:scale-95"
                      >
                        <MessageSquare size={12} /> Report Concern
                      </button>
                    )}
                  </div>
                </>
              )}
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECTION 3: DETAILED INVENTORY OPERATIONAL LOGS */}
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-3 text-lg font-black tracking-tight text-slate-900 uppercase italic">
              <HistoryIcon className="text-emerald-500" size={20} /> Inventory Audit Trail (Operational Logs)
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Complete historical trail of inventory adjustments, restocks, and damage logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                value={invLogSearch}
                onChange={(e) => { setInvLogSearch(e.target.value); setAuditTrailPage(1); }}
                className="w-full md:w-48 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 pl-9 text-[10px] font-black tracking-widest uppercase shadow-sm outline-none focus:border-emerald-400"
              />
              <Search size={12} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-355" />
            </div>

            <select
              value={invLogTypeFilter}
              onChange={(e) => { setInvLogTypeFilter(e.target.value); setAuditTrailPage(1); }}
              className="w-full md:w-auto cursor-pointer rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black tracking-widest uppercase shadow-sm outline-none focus:border-emerald-400"
            >
              <option value="ALL">All Types</option>
              <option value="RESTOCK">Restocks Only</option>
              <option value="ADJUSTMENT">Adjustments Only</option>
              <option value="DAMAGE">Damages Only</option>
              <option value="MISC">Misc Logs</option>
            </select>
          </div>
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block custom-scrollbar -mx-4 overflow-x-auto overflow-y-auto px-4 pr-1 max-h-[500px]">
          <table className="w-full min-w-[800px] border-separate border-spacing-y-2">
            <thead>
              <tr className="rounded-xl bg-slate-50/50 text-left">
                <th className="rounded-l-xl py-3 pl-4 text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                  Log ID & Date
                </th>
                <th className="py-3 text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                  Product
                </th>
                <th className="py-3 text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                  Employee
                </th>
                <th className="py-3 text-center text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                  Type
                </th>
                <th className="py-3 text-center text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                  Qty Adjusted
                </th>
                <th className="py-3 text-right text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                  Valuation Cost
                </th>
                <th className="py-3 pl-6 text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase max-w-[200px]">
                  Notes
                </th>
                <th className="rounded-r-xl py-3 pr-4 text-center text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventoryLogs.map((log) => {
                const isAddition = log.qty_added > 0
                return (
                  <tr key={log.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="rounded-l-2xl border-y border-r-0 border-l border-slate-100 bg-white py-4 pl-4 shadow-sm group-hover:bg-slate-50">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-black text-slate-800 uppercase tracking-tight">
                          {log.id}
                        </span>
                        <span className="mt-1 text-[8px] font-black tracking-widest text-slate-400 uppercase">
                          {new Date(log.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                    </td>
                    <td className="border-y border-slate-100 bg-white py-4 shadow-sm group-hover:bg-slate-50">
                      <div className="flex flex-col">
                        <span className="text-xs font-black tracking-tight text-slate-900 uppercase italic">
                          {log.product_name}
                        </span>
                        {log.variant_id && (
                          <span className="mt-1 font-mono text-[8px] font-bold text-slate-400">
                            Variant: {log.variant_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border-y border-slate-100 bg-white py-4 shadow-sm group-hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                          <User size={10} className="text-slate-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {log.employee ? `${log.employee.first_name} ${log.employee.last_name}` : 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="border-y border-slate-100 bg-white py-4 text-center shadow-sm group-hover:bg-slate-50">
                      <span className={`rounded-xl border px-2 py-0.5 text-[8px] font-black tracking-wider uppercase ${
                        log.type === 'RESTOCK'
                          ? 'bg-emerald-50 text-emerald-755 border-emerald-100'
                          : log.type === 'DAMAGE'
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="border-y border-slate-100 bg-white py-4 text-center shadow-sm group-hover:bg-slate-50">
                      <span className={`text-xs font-black font-mono ${isAddition ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isAddition ? `+${log.qty_added}` : log.qty_added}
                      </span>
                    </td>
                    <td className="border-y border-slate-100 bg-white py-4 pr-4 text-right shadow-sm group-hover:bg-slate-50">
                      <span className="font-mono text-xs font-black text-slate-900">
                        {log.cost > 0 ? `₱${Number(log.cost).toLocaleString()}` : '—'}
                      </span>
                    </td>
                    <td className="border-y border-slate-100 bg-white py-4 pl-6 shadow-sm group-hover:bg-slate-50 max-w-[200px] truncate text-xs text-slate-500 font-semibold" title={log.notes}>
                      {log.notes || '—'}
                    </td>
                    <td className="rounded-r-2xl border-y border-l-0 border-r border-slate-100 bg-white py-4 pr-4 text-center shadow-sm group-hover:bg-slate-50">
                      {user?.role === 'admin' ? (
                        <button type="button"
                          onClick={() => {
                            if (confirm('Undo this stock adjustment? This will revert the stock level and delete any linked expenditures.')) {
                              undoInventoryLog(log.id)
                            }
                          }}
                          className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-rose-600 transition-all hover:bg-rose-100 active:scale-95 flex items-center gap-1.5 mx-auto"
                          title="Revert stock change and expenditures"
                        >
                          <RotateCcw size={10} /> Undo
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW LIST */}
        <div className="block md:hidden custom-scrollbar max-h-[500px] overflow-y-auto space-y-3 pb-6">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Tap an Audit Log to view details and revert:
          </p>
          {paginatedInventoryLogs.map((log) => {
            const isAddition = log.qty_added > 0
            return (
              <div
                key={log.id}
                onClick={() => setMobileSelectedInvLog(log)}
                className="cursor-pointer flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm active:bg-slate-50 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs font-black text-slate-800">
                    {log.id}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    {log.product_name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-xl px-2 py-0.5 text-[7px] font-black tracking-wider uppercase ${
                    log.type === 'RESTOCK'
                      ? 'bg-emerald-50 text-emerald-700'
                      : log.type === 'DAMAGE'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {log.type}
                  </span>
                  <span className={`font-mono text-xs font-black ${isAddition ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isAddition ? `+${log.qty_added}` : log.qty_added}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {renderPagination(
          auditTrailPage,
          filteredInventoryLogs.length,
          ITEMS_PER_PAGE,
          setAuditTrailPage
        )}

        {filteredInventoryLogs.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center opacity-10">
            <HistoryIcon size={40} className="mb-4" />
            <p className="text-[14px] font-black tracking-[10px] uppercase">
              No Logs Found
            </p>
          </div>
        )}
      </div>

      {/* MOBILE INVENTORY LOG DETAILS MODAL */}
      <AnimatePresence>
        {mobileSelectedInvLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileSelectedInvLog(null)}
            />
            {/* Modal Body */}
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl space-y-6 border border-slate-100 z-10"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black tracking-tight text-slate-900">Audit Log Details</h4>
                <button type="button"
                  onClick={() => setMobileSelectedInvLog(null)}
                  className="size-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-650 font-bold text-lg transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Log ID</span>
                  <span className="font-mono text-xs font-black text-slate-800">{mobileSelectedInvLog.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Product</span>
                  <span className="text-xs font-black text-slate-800 text-right">{mobileSelectedInvLog.product_name}</span>
                </div>
                {mobileSelectedInvLog.variant_id && (
                  <div className="flex justify-between border-b border-slate-50 pb-2.5">
                    <span className="text-xs text-slate-400 font-bold">Variant ID</span>
                    <span className="font-mono text-xs font-bold text-slate-600">{mobileSelectedInvLog.variant_id}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Employee</span>
                  <span className="text-xs font-bold text-slate-700">
                    {mobileSelectedInvLog.employee ? `${mobileSelectedInvLog.employee.first_name} ${mobileSelectedInvLog.employee.last_name}` : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Type</span>
                  <span className={`rounded-xl px-2 py-0.5 text-[8px] font-black tracking-wider uppercase border ${
                    mobileSelectedInvLog.type === 'RESTOCK'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : mobileSelectedInvLog.type === 'DAMAGE'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {mobileSelectedInvLog.type}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Quantity</span>
                  <span className={`font-mono text-xs font-black ${mobileSelectedInvLog.qty_added > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {mobileSelectedInvLog.qty_added > 0 ? `+${mobileSelectedInvLog.qty_added}` : mobileSelectedInvLog.qty_added}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Cost Valuation</span>
                  <span className="font-mono text-xs font-black text-slate-900">
                    {mobileSelectedInvLog.cost > 0 ? `₱${Number(mobileSelectedInvLog.cost).toLocaleString()}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Date</span>
                  <span className="text-[10px] font-black text-slate-500">
                    {new Date(mobileSelectedInvLog.date).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-bold">Notes</span>
                  <span className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {mobileSelectedInvLog.notes || 'No description provided.'}
                  </span>
                </div>
              {user?.role === 'admin' && (
                <div className="pt-2">
                  <button type="button"
                    onClick={() => {
                      if (confirm('Undo this stock adjustment? This will revert the stock level and delete any linked expenditures.')) {
                        undoInventoryLog(mobileSelectedInvLog.id)
                        setMobileSelectedInvLog(null)
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 py-3.5 text-xs font-extrabold text-rose-600 border border-rose-100 transition-all active:scale-95 shadow-sm"
                  >
                    <RotateCcw size={14} /> Revert Stock Change
                  </button>
                </div>
              )}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expenditure Concern Message Confirmation Modal */}
      <AnimatePresence>
        {concernModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setConcernModal({ ...concernModal, isOpen: false })}
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-8 shadow-2xl md:p-12"
            >
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-emerald-500" />
                  <span className="text-[10px] font-black tracking-[4px] text-emerald-500 uppercase italic">
                    Log Concern
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Create Concern Message?
                </h2>
                <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400 uppercase italic">
                  Expenditure ID: <span className="text-slate-900 font-mono">{concernModal.expenditureId}</span>
                </p>
                <div className="mt-6">
                  <label className="mb-2 block px-1 font-mono text-[9px] font-black tracking-widest text-slate-400 uppercase leading-none">
                    Concern Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the operational log concern in detail..."
                    value={concernModal.concernText}
                    onChange={(e) => setConcernModal({ ...concernModal, concernText: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-semibold text-slate-900 shadow-sm transition-all outline-none focus:border-emerald-500 focus:bg-white resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button"
                  onClick={() => setConcernModal({ ...concernModal, isOpen: false })}
                  className="flex-1 rounded-xl border border-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="button"
                  disabled={!concernModal.concernText.trim()}
                  onClick={handleCreateExpenditureConcernConfirm}
                  className="flex-1 rounded-xl bg-emerald-500 py-5 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl shadow-emerald-900/20 transition-all hover:bg-emerald-600 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Confirm & Transmit
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
