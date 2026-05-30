import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Info, 
  DollarSign, 
  Package, 
  Box, 
  AlertCircle, 
  RefreshCw, 
  Loader2 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import axiosInstance from '../../../lib/axiosInstance'
import type { IProduct, IVariant } from '../inventory-sections/types'

// Extended interface to support category_label returned by the backend
interface IProductExtended extends IProduct {
  category_label?: string
}

export default function ManageStock() {
  const { product_id } = useParams<{ product_id: string }>()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [product, setProduct] = useState<IProductExtended | null>(null)
  const [variants, setVariants] = useState<IVariant[]>([])
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<IVariant | null>(null)
  const [actionType, setActionType] = useState<'add' | 'reduce'>('add')
  const [quantity, setQuantity] = useState<number>(1)
  const [description, setDescription] = useState('')

  // Mobile selected variant modal state
  const [mobileSelectedVariant, setMobileSelectedVariant] = useState<IVariant | null>(null)

  const fetchProductAndVariants = useCallback(async () => {
    try {
      setIsLoading(true)
      const [productRes, variantsRes] = await Promise.all([
        axiosInstance.get(`/api/admin/products/${product_id}`),
        axiosInstance.get(`/api/admin/products/${product_id}/variants`)
      ])
      
      if (productRes.data?.data) {
        setProduct(productRes.data.data)
      }
      if (variantsRes.data?.data) {
        setVariants(variantsRes.data.data)
      }
    } catch (err: unknown) {
      console.error('Failed to load stock details:', err)
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error(axiosError.response?.data?.message || 'Failed to fetch product stock details.')
    } finally {
      setIsLoading(false)
    }
  }, [product_id])

  useEffect(() => {
    if (product_id) {
      fetchProductAndVariants()
    }
  }, [product_id, fetchProductAndVariants])

  const handleOpenDrawer = (variant: IVariant, type: 'add' | 'reduce') => {
    setSelectedVariant(variant)
    setActionType(type)
    setQuantity(1)
    setDescription('')
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedVariant(null)
  }

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVariant) return

    if (quantity <= 0) {
      toast.error('Please enter a valid quantity greater than 0.')
      return
    }

    if (actionType === 'reduce' && selectedVariant.stock < quantity) {
      toast.error(`Cannot reduce stock below 0. Current stock is ${selectedVariant.stock}.`)
      return
    }

    try {
      setIsSubmitting(true)
      const response = await axiosInstance.post(
        `/api/admin/products/variants/${selectedVariant.variant_id}/stock`,
        {
          action: actionType,
          quantity,
          description: actionType === 'add' ? description : '' // Only pass description for add action
        }
      )

      if (response.data?.status === 'success') {
        toast.success(response.data?.message || 'Stock updated successfully.')
        handleCloseDrawer()
        fetchProductAndVariants()
      } else {
        toast.error(response.data?.message || 'Failed to update stock.')
      }
    } catch (err: unknown) {
      console.error('Stock update failed:', err)
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error(axiosError.response?.data?.message || 'Failed to submit stock adjustment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate real-time expenditure for adding stock
  const computedExpenditure = selectedVariant ? quantity * selectedVariant.price : 0

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-bold text-slate-500">Loading Inventory Records...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
        <AlertCircle className="h-16 w-16 text-rose-500" />
        <h2 className="mt-4 text-2xl font-black text-slate-900">Product Records Missing</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md font-medium">
          The requested product ID does not exist or may have been deleted.
        </p>
        <button
          onClick={() => navigate('/admin/inventory')}
          className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-xl hover:bg-slate-800 transition-all active:scale-95"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>
    )
  }

  return (
    <div className="ManageStockPage animate-in fade-in min-h-screen bg-slate-50/50 pb-20 duration-500">
      <Toaster position="top-right" />

      {/* Header section */}
      <header className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-4 pt-10 pb-6 md:flex-row md:items-center lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">
              Manage Inventory Stock
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Increase or decrease stock variants and manage business expenditures.
            </p>
          </div>
        </div>
        <button
          onClick={fetchProductAndVariants}
          className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </header>

      <main className="mx-auto mt-4 max-w-[1440px] px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Product Summary Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                {product.main_image ? (
                  <img
                    src={`/images/products/${product.main_image}`}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <Box size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3 rounded-full bg-slate-900/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                  {product.category_label || 'Products'}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">{product.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">ID: {product.id}</p>
                </div>

                <hr className="border-slate-100" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Base Price</p>
                    <p className="mt-1 text-lg font-black text-slate-900">₱{product.base_price.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Total Sold</p>
                    <p className="mt-1 text-lg font-black text-slate-900">{product.total_sold || 0} units</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-50 bg-blue-50/20 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-blue-900 uppercase tracking-wide">Stock Warnings</h4>
                      <p className="mt-1 text-xs text-blue-700 leading-relaxed font-semibold">
                        Adding stock to any variant automatically calculates expenditures and inserts an audit log under the &ldquo;Raw Materials / Products&rdquo; category.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Variants stock list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">Stock Variants</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Below are all size and dimension configurations for this product.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2 text-slate-500">
                  <Package size={20} />
                </div>
              </div>

              {variants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-300">
                    <Box size={36} />
                  </div>
                  <h4 className="text-base font-black text-slate-800">No Variants Defined</h4>
                  <p className="mt-1 text-xs text-slate-400 font-semibold max-w-[280px]">
                    This product has no dimensions or variations initialized in the registry.
                  </p>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-4">Variant ID</th>
                          <th className="py-4 px-4">Configuration</th>
                          <th className="py-4 px-4">Price</th>
                          <th className="py-4 px-4 text-center">Current Stock</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {variants.map((v) => {
                          const isLowStock = v.stock <= (product.min_threshold || 5)
                          return (
                            <tr key={v.variant_id} className="group hover:bg-slate-50/50 transition-all">
                              <td className="py-4 px-4 font-mono text-xs font-bold text-slate-600">
                                {v.variant_id}
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-bold text-slate-850">
                                  {v.size ? v.size : 'Standard'}
                                </div>
                                {(v.width || v.height) && (
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {v.width || 0}W &times; {v.height || 0}H
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-4 font-extrabold text-slate-900">
                                ₱{v.price.toLocaleString()}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black">
                                  <span className={`h-2.5 w-2.5 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                  <span className={isLowStock ? 'text-rose-600' : 'text-emerald-700'}>
                                    {v.stock} units
                                  </span>
                                </div>
                                {isLowStock && (
                                  <div className="text-[9px] font-extrabold text-rose-400 uppercase tracking-wide mt-1">
                                    Low Stock Warning
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenDrawer(v, 'add')}
                                    className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95"
                                  >
                                    <Plus size={14} /> Add
                                  </button>
                                  <button
                                    onClick={() => handleOpenDrawer(v, 'reduce')}
                                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-200 transition-all active:scale-95"
                                  >
                                    <Minus size={14} /> Reduce
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE LIST VIEW */}
                  <div className="block md:hidden space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                      Tap a Variant ID to view details and adjust stock:
                    </p>
                    {variants.map((v) => {
                      const isLowStock = v.stock <= (product.min_threshold || 5)
                      return (
                        <div
                          key={v.variant_id}
                          onClick={() => setMobileSelectedVariant(v)}
                          className="cursor-pointer flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-all active:bg-slate-50/50"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs font-black text-slate-700">{v.variant_id}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{v.size || 'Standard'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className={`text-xs font-black ${isLowStock ? 'text-rose-600' : 'text-slate-600'}`}>
                              {v.stock} units
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Variant Detail Modal */}
      <AnimatePresence>
        {mobileSelectedVariant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileSelectedVariant(null)}
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl space-y-6 border border-slate-100 z-10"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black tracking-tight text-slate-900">Variant Details</h4>
                <button
                  onClick={() => setMobileSelectedVariant(null)}
                  className="h-8 w-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold text-lg transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Variant ID</span>
                  <span className="font-mono text-xs font-black text-slate-800">{mobileSelectedVariant.variant_id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Configuration / Size</span>
                  <span className="text-xs font-black text-slate-800">{mobileSelectedVariant.size || 'Standard'}</span>
                </div>
                {(mobileSelectedVariant.width || mobileSelectedVariant.height) && (
                  <div className="flex justify-between border-b border-slate-50 pb-2.5">
                    <span className="text-xs text-slate-400 font-bold">Dimensions</span>
                    <span className="text-xs font-black text-slate-800">
                      {mobileSelectedVariant.width || 0}W &times; {mobileSelectedVariant.height || 0}H
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-50 pb-2.5">
                  <span className="text-xs text-slate-400 font-bold">Unit Price</span>
                  <span className="text-xs font-black text-slate-900">₱{mobileSelectedVariant.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-xs text-slate-400 font-bold">Current Stock</span>
                  <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black bg-slate-50">
                    <span className={`h-2 w-2 rounded-full ${mobileSelectedVariant.stock <= (product.min_threshold || 5) ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className={mobileSelectedVariant.stock <= (product.min_threshold || 5) ? 'text-rose-600' : 'text-emerald-750'}>
                      {mobileSelectedVariant.stock} units
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const v = mobileSelectedVariant
                    setMobileSelectedVariant(null)
                    handleOpenDrawer(v, 'add')
                  }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-100 transition-all active:scale-95"
                >
                  <Plus size={14} /> Add Stock
                </button>
                <button
                  onClick={() => {
                    const v = mobileSelectedVariant
                    setMobileSelectedVariant(null)
                    handleOpenDrawer(v, 'reduce')
                  }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-850 py-3.5 text-xs font-extrabold text-white shadow-lg transition-all active:scale-95"
                >
                  <Minus size={14} /> Reduce Stock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && selectedVariant && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleCloseDrawer}
            />

            {/* Panel */}
            <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md transform bg-white p-8 shadow-2xl flex flex-col h-full border-l border-slate-100 rounded-l-[32px]"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-900">
                      {actionType === 'add' ? 'Add Inventory Stock' : 'Reduce Inventory Stock'}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      Adjusting variant: <span className="font-mono text-slate-600">{selectedVariant.variant_id}</span>
                    </p>
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    &times;
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleStockUpdate} className="flex flex-col flex-1 justify-between overflow-y-auto">
                  <div className="space-y-6">
                    {/* Variant Overview in Form */}
                    <div className="rounded-2xl bg-slate-50 p-4 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Configuration</p>
                        <p className="text-sm font-black text-slate-800 mt-0.5">{selectedVariant.size || 'Standard Variant'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Unit Price</p>
                        <p className="text-sm font-black text-slate-800 mt-0.5">₱{selectedVariant.price.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Quantity Field */}
                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-black tracking-[1px] text-slate-500 uppercase">
                        Quantity to {actionType === 'add' ? 'Add' : 'Reduce'}
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all font-bold text-lg animate-fade"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          min={1}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                          className="flex-1 text-center h-12 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-black text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(q => q + 1)}
                          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all font-bold text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Description Field (Only for Add Action, optional) */}
                    {actionType === 'add' && (
                      <div className="space-y-2">
                        <label className="ml-1 text-[11px] font-black tracking-[1px] text-slate-500 uppercase">
                          Description / Notes (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g. Received shipment from warehouse"
                          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 transition-all outline-none placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5"
                        />
                      </div>
                    )}

                    {/* Dynamic Expenditure Calculation Card (Only for Add Action) */}
                    {actionType === 'add' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-5 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-emerald-800">
                          <DollarSign className="h-5 w-5 text-emerald-500" />
                          <h4 className="text-xs font-black uppercase tracking-wider">Expenditure Calculation</h4>
                        </div>
                        <div className="flex justify-between items-baseline pt-1">
                          <span className="text-xs text-slate-400 font-bold">
                            {quantity} units &times; ₱{selectedVariant.price.toLocaleString()}
                          </span>
                          <span className="text-xl font-black text-slate-900">
                            ₱{computedExpenditure.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-normal italic">
                          *This amount will be registered under your business expenditures trail.
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Submit / Action Buttons */}
                  <div className="flex gap-4 pt-8">
                    <button
                      type="button"
                      onClick={handleCloseDrawer}
                      className="flex-1 rounded-xl bg-slate-50 py-4 text-xs font-bold tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 rounded-xl py-4 text-xs font-bold tracking-widest text-white uppercase shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${actionType === 'add' ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-500' : 'bg-slate-900 shadow-slate-100 hover:bg-slate-800'}`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        'Save Adjustments'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
