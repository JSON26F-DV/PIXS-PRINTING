import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  Briefcase,
  Package,
  History as HistoryIcon,
  FileText,
  PlusCircle,
  Search,
  Trash2,
  Edit2
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
import type { IProduct } from '../../../types/product.types'
import type { IExpenditure } from '../../../hooks/useStockAnalytics'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

interface InventoryAnalyticsSectionProps {
  products: IProduct[]
  expenditures: IExpenditure[]
  setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>
  addExpenditure: (data: Partial<IExpenditure>) => Promise<void>
  updateExpenditure: (id: number, data: Partial<IExpenditure>) => Promise<void>
  deleteExpenditure: (id: number) => Promise<void>
}

export const InventoryAnalyticsSection: React.FC<InventoryAnalyticsSectionProps> = ({ 
  products, 
  expenditures, 
  addExpenditure,
  updateExpenditure,
  deleteExpenditure
}) => {
  const navigate = useNavigate()

  const [productSearch, setProductSearch] = useState('')
  const [logSearch, setLogSearch] = useState('')
  const [logCategoryFilter, setLogCategoryFilter] = useState('ALL')
  
  // Extra Expense form state
  const [extraExpenseForm, setExtraExpenseForm] = useState({ category: 'Others', description: '', amount: '' })
  
  // Edit form state
  const [editingExpId, setEditingExpId] = useState<number | null>(null)
  const [editExpenseForm, setEditExpenseForm] = useState({ category: '', description: '', amount: '' })

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (productSearch) {
      const q = productSearch.toLowerCase()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
      )
    }
    return result
  }, [products, productSearch])

  const chartData = useMemo(() => {
    return products.slice(0, 15).map((p) => {
      // Sum all variants stock
      const totalVariantStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0
      
      return {
        name: p.name,
        stock: totalVariantStock,
        min: p.min_threshold || 0,
        isLow: totalVariantStock < (p.min_threshold || 0),
      }
    })
  }, [products])

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
      const q = logSearch.toLowerCase()
      result = result.filter((l) => l.description?.toLowerCase().includes(q))
    }
    return result
  }, [expenditures, logCategoryFilter, logSearch])

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

  const handleDeleteExpense = async (id: number) => {
    if (confirm('Are you sure you want to delete this expenditure?')) {
      await deleteExpenditure(id)
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
              <div className="absolute top-6 left-8 flex items-center gap-2 opacity-50">
                <Package className="text-emerald-400" size={14} />
                <h4 className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">
                  Stock Level Visualization
                </h4>
              </div>
              <ResponsiveContainer width="100%" height="100%" className="mt-4">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                  <XAxis
                    dataKey="name"
                    stroke="none"
                    tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
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
                    cursor={{ fill: '#ffffff08' }}
                  />
                  <Bar dataKey="stock" radius={[6, 6, 0, 0]} barSize={24}>
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={e.isLow ? '#f43f5e' : '#10b981'} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900">
              <Briefcase className="text-emerald-500" size={20} /> Direct Control
            </h3>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Find Product..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black tracking-widest text-slate-900 uppercase shadow-sm transition-all outline-none placeholder:text-slate-300 focus:border-emerald-400"
            />
            <Search size={14} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-300" />
          </div>

          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-3 pb-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/admin/stock/manage/${p.id}`)}
                className="cursor-pointer rounded-[24px] border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:border-emerald-200 hover:bg-white hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                  <div>
                    <p className="truncate text-xs leading-tight font-bold tracking-tight text-slate-900 uppercase">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-[8px] font-black tracking-widest text-slate-400 uppercase">
                      ID: {p.id.slice(-4)}
                    </p>
                  </div>
                  <div className="rounded bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600">
                    Variants: {p.variants?.length || 0}
                  </div>
                </div>
                
                {/* Variant List layout */}
                {p.variants && p.variants.length > 0 ? (
                  <div className="space-y-1">
                    {p.variants.map((v) => (
                      <div key={v.variant_id} className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 shadow-sm border border-slate-100">
                        <span className="text-[10px] font-black text-slate-600">ID: {v.variant_id.slice(-5)}</span>
                        <span className={`text-[10px] font-black ${v.stock < (p.min_threshold || 0) ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {v.stock} in stock
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] italic text-slate-400">No variants</p>
                )}
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center opacity-30">
                <Package size={40} className="mb-4 text-slate-300" />
                <p className="text-[10px] font-black tracking-widest uppercase">
                  No Products Found
                </p>
              </div>
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
            <button
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
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full md:w-48 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 pl-9 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all outline-none focus:border-violet-400"
                />
                <Search size={12} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300" />
              </div>

              <select
                value={logCategoryFilter}
                onChange={(e) => setLogCategoryFilter(e.target.value)}
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

          <div className="custom-scrollbar -mx-4 flex-1 overflow-x-auto overflow-y-auto px-4 pr-1">
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
                {filteredLogs.map((log) => (
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
                              className="text-xs font-bold border border-slate-200 rounded px-2 py-1 outline-none"
                            />
                          ) : (
                            <p className="text-xs leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                              {log.description || 'No Description'}
                            </p>
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
                          {log.category}
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
                          <button onClick={handleUpdateExpense} className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded font-bold">Save</button>
                          <button onClick={() => setEditingExpId(null)} className="text-[10px] bg-slate-300 text-slate-800 px-2 py-1 rounded font-bold">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => {
                              setEditingExpId(log.id)
                              setEditExpenseForm({ category: log.category, description: log.description || '', amount: String(log.amount) })
                            }}
                            className="text-blue-500 hover:text-blue-700 transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(log.id)}
                            className="text-rose-500 hover:text-rose-700 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      </div>
    </section>
  )
}
