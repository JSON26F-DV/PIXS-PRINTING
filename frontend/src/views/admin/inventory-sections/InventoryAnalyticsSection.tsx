import React, { useState, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext'
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Filter,
  Package,
  AlertCircle,
  History as HistoryIcon,
  FileText,
  PlusCircle,
  Search,
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
import type { IProduct, ICategory, IRestockLog } from './types'
import { STOCK_STATUS_OPTIONS } from './constants'

interface InventoryAnalyticsSectionProps {
  products: IProduct[]
  categories: ICategory[]
  restockLogs: IRestockLog[]
  setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>
  setRestockLogs: React.Dispatch<React.SetStateAction<IRestockLog[]>>
}

interface IInventoryLog {
  id: string
  user_id: string
  user_name: string
  action: string
  product_id: string
  product_name: string
  previous_value: unknown
  new_value: unknown
  timestamp: string
  notes?: string
}

export const InventoryAnalyticsSection: React.FC<
  InventoryAnalyticsSectionProps
> = ({ products, categories, restockLogs, setProducts, setRestockLogs }) => {
  const [chartFilter, setChartFilter] = useState<'asc' | 'desc'>('desc')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [stockStatusFilter, setStockStatusFilter] = useState<string | null>(
    null,
  )
  const [productSearch, setProductSearch] = useState('')
  const [logSearch, setLogSearch] = useState('')
  const [logTypeFilter, setLogTypeFilter] = useState<
    | 'ALL'
    | 'RESTOCK'
    | 'MISC'
    | 'UPDATE_STOCK'
    | 'UPDATE_BASE_PRICE'
    | 'UPDATE_RAW_MATERIAL_COST'
  >('ALL')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [restockForm, setRestockForm] = useState<{
    productId: string
    qty: number
    cost: number
  } | null>(null)
  const [miscExpenseForm, setMiscExpenseForm] = useState<{
    name: string
    cost: number
  } | null>(null)

  const outOfStockProducts = products.filter((p) => p.current_stock <= 0)

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter)
    }

    if (productSearch) {
      const q = productSearch.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
      )
    }

    if (stockStatusFilter === 'Low Stock Only') {
      result = result.filter(
        (p) => p.current_stock < p.min_threshold && p.current_stock > 0,
      )
    } else if (stockStatusFilter === 'Out of Stock') {
      result = result.filter((p) => p.current_stock <= 0)
    } else if (stockStatusFilter === 'High Stock') {
      result = result.filter(
        (p) => (p.current_stock || 0) >= (p.min_threshold || 0),
      )
    }

    result.sort((a, b) => {
      if (chartFilter === 'asc') return a.current_stock - b.current_stock
      return b.current_stock - a.current_stock
    })

    return result
  }, [products, categoryFilter, stockStatusFilter, chartFilter, productSearch])

  const [inventoryLogs, setInventoryLogs] = useState<IInventoryLog[]>(() => {
    try {
      const saved = localStorage.getItem('pixs_inventory_logs')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const { user } = useAuth()

  // SHARED LOGGER FUNCTION
  const logInventoryAction = (
    action: string,
    productId: string,
    productName: string,
    prev: unknown,
    current: unknown,
    notes: string = '',
  ) => {
    try {
      const saved = localStorage.getItem('pixs_inventory_logs')
      const allLogs = saved ? JSON.parse(saved) : []
      const newLog: IInventoryLog = {
        id: `INV-LOG-${new Date().getTime()}`,
        user_id: user?.id || 'unknown',
        user_name: user?.name || 'Inventory Node',
        action,
        product_id: productId,
        product_name: productName,
        previous_value: prev,
        new_value: current,
        timestamp: new Date().toISOString(),
        notes,
      }
      const updatedLogs = [newLog, ...allLogs]
      localStorage.setItem('pixs_inventory_logs', JSON.stringify(updatedLogs))
      setInventoryLogs(updatedLogs)
    } catch (e) {
      console.error('Logging failure', e)
    }
  }

  const combinedLogs = useMemo(() => {
    // Standardize inventory logs into the restock log format for the UI
    const mappedInvLogs = inventoryLogs.map((l) => ({
      id: l.id,
      product_id: l.product_id,
      product_name: l.product_name,
      qty_added:
        l.action === 'RESTOCK'
          ? Number(l.new_value) - Number(l.previous_value)
          : 0,
      cost: l.action === 'MISC_EXPENSE' ? Number(l.new_value) : 0,
      date: l.timestamp,
      type: l.action,
      staff_name: l.user_name,
      notes:
        l.notes || `${l.action} from ${l.previous_value} to ${l.new_value}`,
    }))

    // Merge with financial restock logs
    const mappedRestockLogs = restockLogs.map((l) => ({
      ...l,
      type: l.type as string,
    }))

    return [...mappedRestockLogs, ...mappedInvLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [restockLogs, inventoryLogs])

  const filteredLogs = useMemo(() => {
    let result = [...combinedLogs]

    if (logTypeFilter !== 'ALL') {
      result = result.filter(
        (l) =>
          l.type === logTypeFilter ||
          (logTypeFilter === 'RESTOCK' && l.type === 'RESTOCK'),
      )
    }

    if (logSearch) {
      const q = logSearch.toLowerCase()
      result = result.filter(
        (l) =>
          l.product_name.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.staff_name?.toLowerCase().includes(q),
      )
    }

    return result
  }, [combinedLogs, logTypeFilter, logSearch])

  const chartData = useMemo(
    () =>
      filteredProducts.slice(0, 15).map((p) => ({
        name: p.name,
        stock: p.current_stock,
        min: p.min_threshold,
        isLow: p.current_stock < p.min_threshold,
      })),
    [filteredProducts],
  )

  const updateStock = (id: string, val: number) => {
    if (isNaN(val)) return
    const prod = products.find((p) => p.id === id)
    if (!prod) return

    const prev = prod.current_stock
    const current = Math.max(0, val)

    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === id ? { ...p, current_stock: current } : p,
      ),
    )

    logInventoryAction(
      'UPDATE_STOCK',
      id,
      prod.name,
      prev,
      current,
      `Manual adjustment of stock count.`,
    )
  }

  const updateProductField = (
    id: string,
    field: keyof IProduct,
    val: number,
  ) => {
    if (isNaN(val)) return
    const prod = products.find((p) => p.id === id)
    if (!prod) return

    const prev = prod[field]
    const current = val

    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === id ? { ...p, [field]: val } : p)),
    )

    logInventoryAction(
      `UPDATE_${field.toUpperCase()}`,
      id,
      prod.name,
      prev,
      current,
      `Configurable node [${field}] remapped.`,
    )
  }

  const handleRestock = (
    productId: string,
    productName: string,
    qty: number,
    cost: number,
  ) => {
    if (qty <= 0 || cost < 0) return

    const timestamp = new Date().getTime()
    const prod = products.find((p) => p.id === productId)
    const prevStock = prod?.current_stock || 0

    // Update Stock
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, current_stock: (p.current_stock || 0) + qty }
          : p,
      ),
    )

    // Financial Log (restock_logs.json concept)
    const newRestockLog: IRestockLog = {
      id: `RL-${timestamp}`,
      product_id: productId,
      product_name: productName,
      qty_added: qty,
      cost: cost,
      date: new Date().toISOString(),
      type: 'RESTOCK',
      staff_name: user?.name || 'Inventory Node',
      notes: `Restocked ${qty} units via Direct Control.`,
    }
    setRestockLogs((prev) => [newRestockLog, ...prev])

    // Operational Log (inventory_logs.json concept)
    logInventoryAction(
      'RESTOCK',
      productId,
      productName,
      prevStock,
      prevStock + qty,
      `Inbound stock injection of ${qty} units at total cost ₱${cost.toLocaleString()}.`,
    )

    setRestockForm(null)
  }

  const handleAddMiscExpense = (name: string, cost: number) => {
    if (!name || cost < 0) return
    const timestamp = new Date().getTime()
    const newLog: IRestockLog = {
      id: `RL-${timestamp}`,
      product_id: null,
      product_name: name,
      qty_added: 0,
      cost: cost,
      date: new Date().toISOString(),
      type: 'MISC',
      staff_name: user?.name || 'Inventory Node',
      notes: 'Unexpected miscellaneous expense.',
    }
    setRestockLogs((prev) => [newLog, ...prev])

    logInventoryAction(
      'MISC_EXPENSE',
      'N/A',
      name,
      0,
      cost,
      `Recorded external expenditure: ${name}.`,
    )

    setMiscExpenseForm(null)
  }

  const weeklyExpenseData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const data = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(today.getDate() - (6 - i))
      const dayName = days[d.getDay()]
      const dayISO = d.toISOString().split('T')[0]

      const dayTotal = restockLogs
        .filter((l) => l.date.startsWith(dayISO))
        .reduce((acc, l) => acc + l.cost, 0)

      return { name: dayName, total: dayTotal }
    })
    return data
  }, [restockLogs])

  return (
    <section
      id="inventory-analytics"
      className="h-[calc(100vh-280px)] max-h-[850px] min-h-[650px] space-y-8"
    >
      <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12">
        {/* CHART SECTION */}
        <div className="flex h-full flex-col gap-6 lg:col-span-8">
          <div className="flex flex-wrap items-center gap-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50">
            <div className="mr-4 flex items-center gap-2">
              <Filter className="text-slate-300" size={18} />
              <span className="text-xs font-bold text-slate-400">Filters</span>
            </div>
            <select
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value as 'asc' | 'desc')}
              className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold tracking-widest uppercase outline-none focus:border-emerald-400"
            >
              <option value="desc">High Stock First</option>
              <option value="asc">Low Stock First</option>
            </select>

            <select
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold tracking-widest uppercase outline-none focus:border-emerald-400"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={stockStatusFilter || ''}
              onChange={(e) => setStockStatusFilter(e.target.value || null)}
              className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold tracking-widest uppercase outline-none focus:border-emerald-400"
            >
              <option value="">Full Catalog</option>
              {STOCK_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <button
              onClick={() => setMiscExpenseForm({ name: '', cost: 0 })}
              className="ml-auto rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black tracking-[2px] text-white uppercase shadow-lg shadow-slate-900/20 transition hover:scale-105 active:scale-95"
            >
              + Log Misc Expense
            </button>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-2 gap-6">
            {/* STOCK CHART */}
            <div className="inventory-stock-chart group relative overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
              <div className="absolute top-6 left-8 flex items-center gap-2 opacity-50">
                <Package className="text-emerald-400" size={14} />
                <h4 className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">
                  Stock Level Visualization
                </h4>
              </div>
              <ResponsiveContainer width="100%" height="100%" className="mt-4">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#ffffff0a"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="none"
                    tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="none"
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                  />
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
                      <Cell
                        key={i}
                        fill={e.isLow ? '#f43f5e' : '#10b981'}
                        fillOpacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* EXPENDITURE CHART */}
            <div className="expenditure-chart group relative overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
              <div className="absolute top-6 left-8 flex items-center gap-2 opacity-50">
                <TrendingUp className="text-blue-400" size={14} />
                <h4 className="text-[9px] font-black tracking-widest text-blue-400 uppercase">
                  Weekly Expenditure Analytics (₱)
                </h4>
              </div>
              <ResponsiveContainer width="100%" height="100%" className="mt-4">
                <BarChart
                  data={weeklyExpenseData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#ffffff0a"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="none"
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }}
                  />
                  <YAxis
                    stroke="none"
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                  />
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
                  <Bar
                    dataKey="total"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                    fill="#3b82f6"
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* QUICK STOCK EDIT SECTION */}
        <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50 lg:col-span-4">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900">
              <Briefcase className="text-emerald-500" size={20} /> Direct
              Control
            </h3>
            {outOfStockProducts.length > 0 && (
              <div className="animate-bounce rounded-lg bg-rose-500 px-2 py-1 text-[8px] font-black tracking-widest text-white uppercase">
                {outOfStockProducts.length} Depleted
              </div>
            )}
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Find Node, Product ID..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black tracking-widest text-slate-900 uppercase shadow-sm transition-all outline-none placeholder:text-slate-300 focus:border-emerald-400"
            />
            <Search
              size={14}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-300"
            />
          </div>

          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-3 pb-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className={`rounded-[24px] border bg-slate-50/50 p-4 transition-all duration-300 ${
                  editingProductId === p.id
                    ? 'border-blue-400 bg-white shadow-xl ring-4 ring-blue-50'
                    : 'border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-lg'
                }`}
              >
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() =>
                    setEditingProductId(editingProductId === p.id ? null : p.id)
                  }
                >
                  <div className="max-w-[40%]">
                    <p className="truncate text-xs leading-tight font-bold tracking-tight text-slate-900 uppercase">
                      {p.name}
                    </p>
                    <div className="mt-1 flex gap-2">
                      <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                        ID: {p.id.slice(-4)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setRestockForm({ productId: p.id, qty: 500, cost: 0 })
                        }}
                        className="text-[8px] font-black tracking-widest text-emerald-500 uppercase underline underline-offset-2 hover:text-emerald-700"
                      >
                        Restock Node
                      </button>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => updateStock(p.id, p.current_stock - 50)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                    >
                      <TrendingDown size={14} />
                    </button>
                    <input
                      type="number"
                      value={p.current_stock}
                      onChange={(e) =>
                        updateStock(p.id, parseInt(e.target.value))
                      }
                      className="no-spinner w-14 rounded-lg border border-slate-200 bg-white py-1.5 text-center text-[10px] font-bold text-slate-900 transition-all outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={() =>
                        updateStock(p.id, (p.current_stock || 0) + 50)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
                    >
                      <TrendingUp size={14} />
                    </button>
                  </div>
                </div>

                {editingProductId === p.id && (
                  <div className="animate-in slide-in-from-top-2 -mx-4 mt-4 -mb-4 grid grid-cols-2 gap-3 rounded-b-[24px] border-t border-blue-100 bg-blue-50/50 px-4 pt-4 pb-4 duration-300">
                    <div className="space-y-1">
                      <label className="text-[8px] leading-none font-black tracking-widest text-blue-400 uppercase">
                        Price (₱)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={p.base_price}
                        onChange={(e) =>
                          updateProductField(
                            p.id,
                            'base_price',
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-[10px] font-bold text-slate-900 shadow-sm outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] leading-none font-black tracking-widest text-blue-400 uppercase">
                        Mat. Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={p.raw_material_cost}
                        onChange={(e) =>
                          updateProductField(
                            p.id,
                            'raw_material_cost',
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-[10px] font-bold text-slate-900 shadow-sm outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] leading-none font-black tracking-widest text-blue-400 uppercase">
                        Threshold
                      </label>
                      <input
                        type="number"
                        value={p.min_threshold ?? ''}
                        onChange={(e) =>
                          updateProductField(
                            p.id,
                            'min_threshold',
                            parseInt(e.target.value),
                          )
                        }
                        className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-[10px] font-bold text-slate-900 shadow-sm outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] leading-none font-black tracking-widest text-blue-400 uppercase">
                        Min Order
                      </label>
                      <input
                        type="number"
                        value={p.min_order ?? ''}
                        onChange={(e) =>
                          updateProductField(
                            p.id,
                            'min_order',
                            parseInt(e.target.value),
                          )
                        }
                        className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-[10px] font-bold text-slate-900 shadow-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                )}

                {restockForm?.productId === p.id && (
                  <div className="animate-in slide-in-from-top-2 -mx-4 mt-4 -mb-4 rounded-b-[24px] border-t border-emerald-100 bg-emerald-50/50 px-4 pt-4 pb-4 duration-300">
                    <p className="mb-3 text-[9px] font-black tracking-[2px] text-emerald-600 uppercase">
                      Inventory Injection Node
                    </p>
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] leading-none font-black tracking-widest text-emerald-400 uppercase">
                          Adding Qty
                        </label>
                        <input
                          type="number"
                          value={restockForm.qty}
                          onChange={(e) =>
                            setRestockForm({
                              ...restockForm,
                              qty: parseInt(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] leading-none font-black tracking-widest text-emerald-400 uppercase">
                          Total Cost (₱)
                        </label>
                        <input
                          type="number"
                          value={restockForm.cost}
                          onChange={(e) =>
                            setRestockForm({
                              ...restockForm,
                              cost: parseFloat(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[10px] font-bold text-slate-900 outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleRestock(
                          p.id,
                          p.name,
                          restockForm.qty,
                          restockForm.cost,
                        )
                      }
                      className="w-full rounded-xl bg-emerald-600 py-2 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      Execute Restock
                    </button>
                  </div>
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

          <div className="mt-auto border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <AlertCircle className="shrink-0 text-blue-500" size={18} />
              <p className="text-[9px] leading-tight font-bold tracking-widest text-blue-700 uppercase">
                Production terminal active. All direct stock adjustments are
                logged for audit.
              </p>
            </div>
          </div>

          {/* MODALS / OVERLAYS */}
          {miscExpenseForm && (
            <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm duration-300">
              <div className="animate-in zoom-in-95 w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl duration-300">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">
                    Miscellaneous Expense
                  </h3>
                  <button
                    onClick={() => setMiscExpenseForm(null)}
                    className="text-slate-400 hover:text-slate-900"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Expense Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ink Procurement, Machine Repair"
                      value={miscExpenseForm.name}
                      onChange={(e) =>
                        setMiscExpenseForm({
                          ...miscExpenseForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Total Cost (₱)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={miscExpenseForm.cost || ''}
                      onChange={(e) =>
                        setMiscExpenseForm({
                          ...miscExpenseForm,
                          cost: parseFloat(e.target.value),
                        })
                      }
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleAddMiscExpense(
                        miscExpenseForm.name,
                        miscExpenseForm.cost,
                      )
                    }
                    className="w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-[4px] text-white uppercase shadow-2xl transition hover:scale-105"
                  >
                    Record Expenditure
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: EXTRA EXPENSES & LOG HISTORY */}
      <div className="mt-12 grid grid-cols-1 gap-8 border-t border-slate-200 pt-10 pb-20 lg:grid-cols-12">
        {/* EXTRA EXPENSES TERMINAL */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm lg:col-span-4">
          <h3 className="mb-6 flex items-center gap-3 text-lg font-black tracking-tight text-slate-900 uppercase">
            <PlusCircle className="text-blue-500" size={20} /> Extra Expenses
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block px-1 font-mono text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                Entry Reason
              </label>
              <input
                type="text"
                id="extra-expense-name-final"
                placeholder="e.g. Utility - Maintenance"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block px-1 font-mono text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                Investment (₱)
              </label>
              <input
                type="number"
                id="extra-expense-cost-final"
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition-all outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => {
                const name = (
                  document.getElementById(
                    'extra-expense-name-final',
                  ) as HTMLInputElement
                ).value
                const cost = parseFloat(
                  (
                    document.getElementById(
                      'extra-expense-cost-final',
                    ) as HTMLInputElement
                  ).value,
                )
                handleAddMiscExpense(name, cost)
                ;(
                  document.getElementById(
                    'extra-expense-name-final',
                  ) as HTMLInputElement
                ).value = ''
                ;(
                  document.getElementById(
                    'extra-expense-cost-final',
                  ) as HTMLInputElement
                ).value = ''
              }}
              className="w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-[3px] text-white uppercase shadow-2xl transition hover:scale-105 active:scale-95"
            >
              Log Extra Expense
            </button>
          </div>
        </div>

        {/* LOG HISTORY TABLE */}
        <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm lg:col-span-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="flex items-center gap-3 text-lg font-black tracking-tight text-slate-900 uppercase italic">
              <HistoryIcon className="text-violet-500" size={20} /> Operational
              Logs
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter Trace..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-48 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 pl-9 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all outline-none focus:border-violet-400"
                />
                <Search
                  size={12}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300"
                />
              </div>

              <select
                value={logTypeFilter}
                onChange={(e) =>
                  setLogTypeFilter(e.target.value as 'ALL' | 'RESTOCK' | 'MISC')
                }
                className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black tracking-widest uppercase shadow-sm outline-none focus:border-violet-400"
              >
                <option value="ALL">All Protocols</option>
                <option value="RESTOCK">Restocks</option>
                <option value="MISC">Miscellaneous</option>
              </select>
            </div>
          </div>
          <div className="custom-scrollbar -mx-4 flex-1 overflow-y-auto px-4 pr-1">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="rounded-xl bg-slate-50/50 text-left">
                  <th className="rounded-l-xl py-3 pl-4 text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Detail Trace
                  </th>
                  <th className="py-3 text-center text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Category
                  </th>
                  <th className="rounded-r-xl py-3 pr-4 text-right text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Net Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs
                  .slice()
                  .reverse()
                  .slice(0, 100)
                  .map((log) => (
                    <tr
                      key={log.id}
                      className="group transition-colors hover:bg-slate-50/50"
                    >
                      <td className="rounded-l-2xl border-y border-r-0 border-l border-slate-100 bg-white py-4 pl-4 shadow-sm group-hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <FileText
                            className={
                              log.type === 'RESTOCK'
                                ? 'text-emerald-500'
                                : 'text-blue-500'
                            }
                            size={16}
                          />
                          <div>
                            <p className="text-xs leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                              {log.product_name}
                            </p>
                            <p className="mt-1 text-[8px] font-black tracking-widest text-slate-400 uppercase">
                              {new Date(log.date).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border-x-0 border-y border-slate-100 bg-white py-4 text-center shadow-sm group-hover:bg-slate-50">
                        <span
                          className={`rounded px-2 py-0.5 text-[8px] font-black tracking-widest uppercase ${log.type === 'RESTOCK' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-l-0 border-slate-100 bg-white py-4 pr-4 text-right shadow-sm group-hover:bg-slate-50">
                        <p className="font-mono text-xs font-black tracking-tighter text-slate-900">
                          ₱{log.cost.toLocaleString()}
                        </p>
                        {log.qty_added > 0 && (
                          <p className="text-[8px] font-black tracking-[1px] text-slate-400 uppercase">
                            +{log.qty_added} Qty
                          </p>
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
