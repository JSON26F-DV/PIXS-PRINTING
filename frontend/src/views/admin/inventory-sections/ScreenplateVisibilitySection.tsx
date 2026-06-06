import { useState, useMemo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Search, ChevronDown } from 'lucide-react'
import type { IProduct, IVariant } from './types'
import { updateProductScreenplateVisibility, updateVariantScreenplateVisibility } from '../../../api/admin-screenplates.api'
import toast from 'react-hot-toast'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

export function ScreenplateVisibilitySection({
  products,
  onProductUpdate,
  onVariantUpdate,
}: {
  products: IProduct[]
  onProductUpdate: (productId: string, isVisible: boolean) => void
  onVariantUpdate: (productId: string, variantId: string, isVisible: boolean) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  const [prices, setPrices] = useState<{ [key: number]: number }>(() => {
    const saved = localStorage.getItem('screenplate_color_pricing')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed[1] && parsed[2] && parsed[3]) {
          return parsed
        }
      } catch {
        // Fallback to default pricing
      }
    }
    return { 1: 700, 2: 1400, 3: 2100 }
  })

  const handlePriceChange = (color: number, value: string) => {
    const numeric = parseFloat(value) || 0
    const updated = { ...prices, [color]: numeric }
    setPrices(updated)
    localStorage.setItem('screenplate_color_pricing', JSON.stringify(updated))
  }

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach(p => {
      const id = p.category_id
      const label = p.category_label || p.category
      if (id) map.set(id, label)
    })
    return [{ id: 'All', label: 'All' }, ...Array.from(map.entries()).map(([id, label]) => ({ id, label }))]
  }, [products])

  const handleToggleProduct = async (e: React.MouseEvent, p: IProduct) => {
    e.stopPropagation()
    const newValue = !p.is_need_screenplate
    try {
      await updateProductScreenplateVisibility(p.id, newValue)
      onProductUpdate(p.id, newValue)
      toast.success(newValue ? 'Product visible in screenplate menu' : 'Product hidden from screenplate menu')
    } catch {
      toast.error('Failed to update product visibility')
    }
  }

  const handleToggleVariant = async (e: React.MouseEvent, productId: string, v: IVariant) => {
    e.stopPropagation()
    // default to true if undefined
    const currentValue = v.is_need_screenplate !== false 
    const newValue = !currentValue
    try {
      await updateVariantScreenplateVisibility(v.variant_id, newValue)
      onVariantUpdate(productId, v.variant_id, newValue)
      toast.success(newValue ? 'Variant visible' : 'Variant hidden')
    } catch {
      toast.error('Failed to update variant visibility')
    }
  }

  const filteredProducts = products.filter(p => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q || (
      p.name.toLowerCase().includes(q) ||
      (p.category_label || p.category || '').toLowerCase().includes(q)
    )
    const matchesCategory = categoryFilter === 'All' || p.category_id === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Color Pricing Section */}
      <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-sm font-black tracking-widest text-slate-900 uppercase italic">
          Color Pricing Matrix
        </h3>
        <p className="mb-6 text-[10px] font-bold tracking-[2px] text-slate-400 uppercase">
          Set setup fees for color separations
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex flex-col gap-1.5 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {num} Color{num > 1 ? 's' : ''} Setup Price
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono text-xs font-bold text-slate-400">₱</span>
                <input
                  type="number"
                  value={prices[num]}
                  onChange={(e) => handlePriceChange(num, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-4 font-mono text-xs font-black italic text-slate-900 outline-none transition-colors focus:border-slate-900"
                  placeholder="Enter price"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog to manage visibility..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-slate-900"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex w-full flex-col items-center gap-3 pb-2 sm:flex-row sm:gap-2">
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase sm:mr-1">Category:</span>
        <div className="flex w-full flex-wrap justify-center gap-1.5 sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-xl px-3.5 py-2 text-[9px] font-black tracking-wider uppercase transition-all ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((p) => {
          const isExpanded = expandedProduct === p.id
          
          return (
            <div
              key={p.id}
              className={cn(
                'overflow-hidden rounded-[24px] border-2 transition-all duration-300',
                isExpanded
                  ? 'border-slate-400 bg-white shadow-lg'
                  : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50',
                !p.is_need_screenplate && 'opacity-60 grayscale-[0.3]'
              )}
            >
              <div
                onClick={() => setExpandedProduct(isExpanded ? null : p.id)}
                className="cursor-pointer space-y-4 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-black tracking-tight text-slate-900 uppercase italic">
                      {p.name}
                    </p>
                    <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                      {p.category_label || p.category}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleToggleProduct(e, p)}
                    className={cn(
                      'rounded-full p-2.5 transition-colors',
                      p.is_need_screenplate 
                        ? 'bg-[#75EEA5]/20 text-emerald-600 hover:bg-[#75EEA5]/40'
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                    )}
                  >
                    {p.is_need_screenplate ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-2.5 text-slate-500">
                  <ChevronDown
                    size={14}
                    className={cn('transition-transform', isExpanded && 'rotate-180')}
                  />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {(p.variants || []).length} variants
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <m.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                  >
                    <div className="space-y-1 p-3">
                      {(p.variants || []).length === 0 ? (
                        <p className="p-3 text-[10px] text-slate-400 italic">
                          No variants available
                        </p>
                      ) : (
                        (p.variants || []).map((v: IVariant) => {
                          const isVisible = v.is_need_screenplate !== false
                          
                          return (
                            <div
                              key={v.variant_id}
                              className="flex items-center justify-between rounded-xl p-3 hover:bg-white"
                            >
                              <div>
                                <p className={cn("text-[10px] font-black tracking-tight uppercase", isVisible ? "text-slate-900" : "text-slate-400")}>
                                  {v.size}
                                </p>
                                {v.width && v.height && (
                                  <p className="text-[8px] text-slate-500 font-bold">
                                    {v.width} × {v.height}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={(e) => handleToggleVariant(e, p.id, v)}
                                className={cn(
                                  'rounded-full p-2 transition-colors',
                                  isVisible
                                    ? 'bg-[#75EEA5]/20 text-emerald-600 hover:bg-[#75EEA5]/40'
                                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                )}
                              >
                                {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
