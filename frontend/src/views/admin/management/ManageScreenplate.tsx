import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Layers,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  Upload,
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { useDebounce } from '../../../hooks/useDebounce'
import toast from 'react-hot-toast'
import type { IProduct, IScreenplate, IUser, ICompatibilityNode, IVariant } from '../inventory-sections/types'
import { ALIGNMENT_OPTIONS } from '../inventory-sections/constants'
import {
  InputField,
  TextArea,
  SectionTitle,
  Pagination,
} from '../inventory-sections/UIComponents'
import {
  getAdminScreenplate,
  createAdminScreenplate,
  updateAdminScreenplate,
  uploadScreenplateImage,
  updateScreenplateRequestStatus,
} from '../../../api/admin-screenplates.api'
import { getAdminCustomers } from '../../../api/customers.api'
import { getProducts, getProductById } from '../../../api/products.api'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

const DEFAULT_PLATE: IScreenplate = {
  id: '',
  owner_id: '',
  plate_name: 'New Screen Mesh',
  image: '',
  channels: 1,
  alignment: ALIGNMENT_OPTIONS[0],
  technical_info: '',
  comment: '',
  compatibility: [],
  is_flatscreen: false,
  base_setup_fee: 450,
  dimensions: '',
}

export default function ManageScreenplate() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isCreate = !id

  const [isLoading, setIsLoading] = useState(!isCreate)
  const [isSaving, setIsSaving] = useState(false)
  const [customers, setCustomers] = useState<IUser[]>([])
  const [products, setProducts] = useState<IProduct[]>([])
  const [data, setData] = useState<IScreenplate>(DEFAULT_PLATE)
  const [isUploading, setIsUploading] = useState(false)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [mappingPage, setMappingPage] = useState(1)
  const MAPPING_PER_PAGE = 9
  const [searchParams] = useSearchParams()
  const [saveModal, setSaveModal] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    message: '',
  })

  // Customer Dropdown state
  const [customerSearch, setCustomerSearch] = useState('')
  const debouncedCustomerSearch = useDebounce(customerSearch, 350)
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(debouncedCustomerSearch.toLowerCase()) || 
    (c.company_name && c.company_name.toLowerCase().includes(debouncedCustomerSearch.toLowerCase()))
  )

  useEffect(() => {
    Promise.all([getAdminCustomers(), getProducts()])
      .then(([custs, prods]) => {
        setCustomers(custs)
        const raw = Array.isArray(prods) ? prods : (prods && (prods.data || prods.items)) || []
        setProducts(Array.isArray(raw) ? raw : [])
        const initCustomerId = searchParams.get('customer_id')
        const initProductId = searchParams.get('product_id')
        const initVariantId = searchParams.get('variant_id')
        const initColorCount = searchParams.get('color_count')
        const initAlignment = searchParams.get('alignment')

        if (isCreate && custs.length > 0) {
          setData((prev: IScreenplate) => ({ 
            ...prev, 
            owner_id: initCustomerId || custs[0].id,
            channels: initColorCount ? parseInt(initColorCount) : prev.channels,
            alignment: initAlignment || prev.alignment
          }))
        }
        
        if (initProductId && initVariantId) {
          // Trigger variant fetch and toggle
          getProductById(initProductId).then((res: unknown) => {
            const raw = (res as { data?: { variants?: IVariant[] } })?.data || (res as { variants?: IVariant[] })
            const variants = Array.isArray(raw?.variants) ? raw.variants : []
            setProducts((p: IProduct[]) => p.map((prod: IProduct) => (prod.id === initProductId ? { ...prod, variants } : prod)))
            setExpandedProduct(initProductId)
            
            // Toggle variant
            setData((prevData: IScreenplate) => {
               return {
                 ...prevData,
                 compatibility: [{ product_id: initProductId, allowed_variants: [initVariantId] }]
               }
             })
          })
        }
      })
      .catch(() => {
        toast.error('Failed to load customers or products.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (id) {
      setIsLoading(true)
      getAdminScreenplate(id)
        .then((plate: IScreenplate) => {
          setData(plate)
        })
        .catch(() => {
          toast.error('Failed to load screenplate.')
          navigate('/admin/screenplate')
        })
        .finally(() => setIsLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const update = <K extends keyof IScreenplate>(
    field: K,
    val: IScreenplate[K],
  ) => setData((p: IScreenplate) => ({ ...p, [field]: val }))


  const toggleVariant = (productId: string, variantId: string, forceState?: boolean) => {
    const next = [...data.compatibility]
    const idx = next.findIndex((c) => c.product_id === productId)
    
    let isCurrentlyChecked = false
    if (idx !== -1) {
      isCurrentlyChecked = next[idx].allowed_variants.includes(variantId)
    }

    const targetState = forceState !== undefined ? forceState : !isCurrentlyChecked

    if (targetState === isCurrentlyChecked) return

      if (targetState) {
        if (idx === -1) {
          next.push({ product_id: productId, allowed_variants: [variantId] })
        } else {
          next[idx].allowed_variants.push(variantId)
        }
        update('compatibility', next)
      } else {
        if (idx !== -1) {
          next[idx].allowed_variants = next[idx].allowed_variants.filter((v: string) => v !== variantId)
          if (next[idx].allowed_variants.length === 0) {
            next.splice(idx, 1)
          }
          update('compatibility', next)
        }
      }
  }





  const loadVariants = async (productId: string) => {
    try {
      const res = await getProductById(productId)
      const raw = res?.data || res
      const variants = Array.isArray(raw?.variants) ? raw.variants : raw?.variants || []
      setProducts((prev) =>
        prev.map((prod) => (prod.id === productId ? { ...prod, variants } : prod)),
      )
    } catch (err) {
      console.error('Failed to load variants for', productId, err)
      toast.error('Failed to load product variants.')
    }
  }

  const handleAbort = async () => {
    const requestId = searchParams.get('request_id')
    if (requestId) {
      try {
        await updateScreenplateRequestStatus(requestId, 'Pending')
        toast.success('Request reverted to Pending')
      } catch (err) {
        console.error('Failed to revert request status', err)
        toast.error('Failed to revert request status to Pending')
      }
    }
    navigate('/admin/screenplate')
  }

  const closeSaveModal = () => {
    setSaveModal((prev) => ({ ...prev, open: false }))
    if (saveModal.type === 'success') {
      navigate('/admin/screenplate', { replace: true })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...data,
        base_setup_fee: data.base_setup_fee ?? 0,
      }

      if (isCreate) {
        await createAdminScreenplate(payload)
        setSaveModal({
          open: true,
          type: 'success',
          message: 'Screenplate created successfully.',
        })
      } else {
        await updateAdminScreenplate(id!, payload)
        setSaveModal({
          open: true,
          type: 'success',
          message: 'Registry updated successfully.',
        })
      }
    } catch {
      setSaveModal({
        open: true,
        type: 'error',
        message: 'Failed to save screenplate.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 opacity-40">
          <Layers size={48} className="animate-pulse text-slate-400" />
          <p className="text-sm font-black tracking-widest uppercase text-slate-400">
            Loading specification...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <button type="button"
            onClick={() => navigate('/admin/screenplate')}
            className="rounded-2xl p-3 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic lg:text-2xl">
              Mesh Specification
            </h3>
            <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {isCreate
                ? 'Register a new industrial mesh'
                : `Editing ${data.id || ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-8 overflow-y-auto p-6 pb-32 lg:space-y-12 lg:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-6 lg:space-y-8">
            <SectionTitle title="Aura & Identity" />
            <div>
              <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Customer Owner
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={isCustomerDropdownOpen ? customerSearch : customers.find(c => c.id === data.owner_id)?.name || ''}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setIsCustomerDropdownOpen(true)
                  }}
                  onFocus={() => {
                    setCustomerSearch('')
                    setIsCustomerDropdownOpen(true)
                  }}
                  onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                  placeholder="Search customer..."
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xs font-black tracking-tight text-slate-900 uppercase italic transition-all outline-none focus:border-slate-900"
                />
                {isCustomerDropdownOpen && (
                  <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl">
                    {filteredCustomers.length === 0 ? (
                       <div className="p-4 text-xs text-slate-400">No customers found.</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            update('owner_id', c.id)
                            setIsCustomerDropdownOpen(false)
                          }}
                          className="cursor-pointer border-b border-slate-50 p-4 text-xs font-bold hover:bg-slate-50 last:border-0 text-slate-900"
                        >
                          {c.name} {c.company_name ? `(${c.company_name})` : ''}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Node Asset Image
              </p>
              <div className="group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed bg-slate-50/50 transition-all hover:border-slate-400">
                {data.image ? (
                  <>
                    <img
                      src={`/images/screenplate/${data.image}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      alt="Screenplate"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <div className="rounded-full bg-white p-3 text-slate-900 shadow-xl">
                        <Upload size={20} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Upload size={32} />
                    <p className="text-[10px] font-black tracking-widest uppercase">
                      Upload Key View Image
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    const allowed = ['image/jpeg', 'image/png', 'image/webp']
                    if (!allowed.includes(file.type)) {
                      toast.error('Only JPG, PNG & WEBP files are allowed.')
                      e.target.value = ''
                      return
                    }

                    if (file.size > 3 * 1024 * 1024) {
                      toast.error('Image must be under 3MB.')
                      e.target.value = ''
                      return
                    }

                    setIsUploading(true)
                    try {
                      const plateId = data.id || id
                      if (!plateId) {
                        toast.error('Save the screenplate first, then upload an image.')
                        return
                      }
                      const filename = await uploadScreenplateImage(plateId, file)
                      update('image', filename)
                      toast.success('Image uploaded.')
                    } catch {
                      toast.error('Failed to upload image.')
                    } finally {
                      setIsUploading(false)
                      e.target.value = ''
                    }
                  }}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                    <div className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                      Uploading...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6 lg:space-y-8">
            <SectionTitle title="Specifications" />
            <InputField
              label="Registry Name"
              value={data.plate_name}
              onChange={(v: string) => update('plate_name', v)}
              placeholder="Standard Mesh..."
            />
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Channels
                </label>
                <select
                  value={data.channels}
                  onChange={(e) =>
                    update('channels', parseInt(e.target.value))
                  }
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xs font-black text-slate-900 uppercase italic focus:border-slate-900"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} COLORS
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Alignment
                </label>
                <select
                  value={data.alignment}
                  onChange={(e) => update('alignment', e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xs font-black text-slate-900 uppercase italic focus:border-slate-900"
                >
                  {ALIGNMENT_OPTIONS.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <InputField
                label="Dimensions"
                value={data.dimensions || ''}
                onChange={(v: string) => update('dimensions', v)}
                placeholder="100x150mm..."
              />
              <InputField
                label="Setup Fee (₱)"
                value={data.base_setup_fee?.toString() || ''}
                onChange={(v: string) =>
                  update('base_setup_fee', parseFloat(v))
                }
                placeholder="450..."
              />
            </div>
            <InputField
              label="Internal Comment"
              value={data.comment}
              onChange={(v: string) => update('comment', v)}
              placeholder="..."
            />

            <div
              className="group flex cursor-pointer items-center justify-between rounded-[24px] border border-slate-800 bg-slate-900 p-6 shadow-xl transition-all hover:bg-slate-800"
              onClick={() => {
                const nextVal = !data.is_flatscreen
                update('is_flatscreen', nextVal)

                const restrictedCategory = nextVal
                  ? 'Milktea Cup'
                  : 'Meal Box'
                const restrictedIds = products
                  .filter((p) => p.category === restrictedCategory)
                  .map((p) => p.id)

                update(
                  'compatibility',
                  data.compatibility.filter(
                    (c: ICompatibilityNode) => !restrictedIds.includes(c.product_id),
                  ),
                )

                toast.success(
                  nextVal
                    ? 'Technician Mode: Curved Milktea Profiles restricted.'
                    : 'Rotary Mode: Flat surfaces (Meal Boxes) restricted.',
                  {
                    icon: nextVal ? '🏢' : '🎡',
                    style: {
                      borderRadius: '16px',
                      background: '#0f172a',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    },
                  },
                )
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex size-12 items-center justify-center rounded-2xl transition-all',
                    data.is_flatscreen
                      ? 'bg-[#75EEA5] text-slate-900'
                      : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600',
                  )}
                >
                  <Layers size={20} />
                </div>
                <div>
                  <p className="text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Flatscreen Mode
                  </p>
                  <p className="mt-1 text-xs font-black tracking-tight text-white uppercase italic">
                    {data.is_flatscreen
                      ? 'Technician Mesh Active'
                      : 'Rotary/Curved Standard'}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  'relative h-6 w-10 rounded-full transition-all duration-300',
                  data.is_flatscreen ? 'bg-[#75EEA5]' : 'bg-slate-700',
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 size-4 rounded-full bg-white transition-all duration-300',
                    data.is_flatscreen ? 'right-1' : 'left-1',
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <TextArea
          label="Baseline Data Logs"
          value={data.technical_info}
          onChange={(v: string) => update('technical_info', v)}
          placeholder="..."
        />

        <div className="space-y-6 border-t border-slate-100 pt-8 lg:space-y-8 lg:pt-10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-black tracking-widest text-slate-900 uppercase italic">
                Compatibility Mapping
              </h4>
              <p className="mt-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                Connect specific catalog nodes to this mesh
              </p>
            </div>
          </div>

          <div className="mt-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or categories..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-900"
            />
          </div>

          {/* Category Filter */}
          <div className="flex w-full flex-col items-center gap-3 pb-2 sm:flex-row sm:gap-2">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase sm:mr-1">Category:</span>
            <div className="flex w-full flex-wrap justify-center gap-1.5 sm:w-auto">
              {(() => {
                const map = new Map<string, string>()
                products.forEach(p => {
                  if (!p.is_need_screenplate) return
                  const id = p.category_id || ''
                  const label = p.category_label || p.category
                  if (id) map.set(id, label)
                })
                return [{ id: 'All', label: 'All' }, ...Array.from(map.entries()).map(([id, label]) => ({ id, label }))]
              })().map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryFilter(cat.id); setMappingPage(1) }}
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {products
              .filter((p) => {
                // Only show products that need screenplate
                if (!p.is_need_screenplate) return false
                const matchesCategory = categoryFilter === 'All' || p.category_id === categoryFilter
                if (!matchesCategory) return false
                const q = searchQuery.trim().toLowerCase()
                if (!q) return true
                return (
                  p.name.toLowerCase().includes(q) ||
                  (p.category_label || p.category || '').toLowerCase().includes(q) ||
                  (p.variants || []).some((v: IVariant) => v.size.toLowerCase().includes(q))
                )
              })
              .slice((mappingPage - 1) * MAPPING_PER_PAGE, mappingPage * MAPPING_PER_PAGE)
              .map((p) => {
                const isExpanded = expandedProduct === p.id

                return (
                  <div
                    key={p.id}
                    className={cn(
                      'overflow-hidden rounded-[24px] border-2 transition-all duration-300',
                      isExpanded
                        ? 'border-[#75EEA5] bg-white shadow-lg shadow-[#75EEA5]/5'
                        : 'border-slate-50 bg-slate-50/30',
                    )}
                  >
                    <div
                      onClick={() => {
                        if (!isExpanded) loadVariants(p.id)
                        setExpandedProduct(isExpanded ? null : p.id)
                      }}
                      className="cursor-pointer space-y-3 p-4 hover:bg-slate-50"
                    >
                      <div>
                        <p className="truncate text-[10px] font-black tracking-tight text-slate-900 uppercase italic">
                          {p.name}
                        </p>
                        <p className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                          {p.category_label || p.category}
                        </p>
                      </div>

                      {p.short_description && (
                        <p className="text-[8px] leading-relaxed text-slate-600">
                          {p.short_description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-slate-400">
                        <ChevronDown
                          size={12}
                          className={cn(
                            'transition-transform',
                            isExpanded && 'rotate-180',
                          )}
                        />
                        <span className="text-[7px] font-black uppercase">
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
                          <div className="space-y-3 p-4">
                            {(p.variants || []).length === 0 ? (
                              <p className="text-[8px] text-slate-400 italic">
                                No variants available
                              </p>
                            ) : (
                              (p.variants || [])
                                .filter((v: IVariant) => v.is_need_screenplate !== false)
                                .map((v: IVariant) => {
                                const config = data.compatibility.find(
                                  (c: ICompatibilityNode) => c.product_id === p.id,
                                )
                                const isLinked =
                                  config?.allowed_variants.includes(
                                    v.variant_id,
                                  )
                                return (
                                  <div
                                    key={v.variant_id}
                                    className="space-y-2"
                                  >
                                    <div className="flex items-start gap-2">
                                      <button type="button"
                                        onClick={() => toggleVariant(p.id, v.variant_id, true)}
                                        className={cn(
                                          'mt-0.5 shrink-0 rounded-lg border p-1.5 transition-all',
                                          isLinked
                                            ? 'border-[#75EEA5] bg-[#75EEA5] text-slate-900'
                                            : 'border-slate-200 bg-white text-slate-200',
                                        )}
                                        title={isLinked ? 'Compatible' : 'Add compatibility'}
                                      >
                                        <Check size={10} strokeWidth={4} />
                                      </button>

                                      <button type="button"
                                        onClick={() => toggleVariant(p.id, v.variant_id, false)}
                                        className={cn(
                                          'mt-0.5 shrink-0 rounded-lg border p-1.5 transition-all',
                                          !isLinked
                                            ? 'border-rose-500 bg-rose-500 text-white'
                                            : 'border-slate-200 bg-white text-slate-200',
                                        )}
                                        title={!isLinked ? 'Incompatible' : 'Mark incompatible'}
                                      >
                                        <X size={10} strokeWidth={3} />
                                      </button>

                                      <div className="min-w-0 flex-1">
                                        <p className="text-[8px] font-black tracking-tight text-slate-900 uppercase">
                                          {v.size}
                                        </p>
                                        {v.width && v.height && (
                                          <p className="text-[7px] text-slate-500">
                                            {v.width} × {v.height}
                                          </p>
                                        )}
                                      </div>

                                      {isLinked && (
                                        <div className="rounded-full bg-[#75EEA5] px-1.5 py-0.5 text-[7px] font-black text-slate-900">
                                          ✓
                                        </div>
                                      )}
                                    </div>
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

          <Pagination
            currentPage={mappingPage}
            totalPages={Math.max(1, Math.ceil(products.filter(p => {
              if (!p.is_need_screenplate) return false
              if (categoryFilter !== 'All' && p.category_id !== categoryFilter) return false
              const q = searchQuery.trim().toLowerCase()
              if (!q) return true
              return (
                p.name.toLowerCase().includes(q) ||
                (p.category_label || p.category || '').toLowerCase().includes(q) ||
                (p.variants || []).some((v: IVariant) => v.size.toLowerCase().includes(q))
              )
            }).length / MAPPING_PER_PAGE))}
            onPageChange={setMappingPage}
          />
        </div>
      </div>

      {saveModal.open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl shadow-slate-950/20">
            <h2 className="text-xl font-black uppercase tracking-[0.3em] text-slate-900">
              {saveModal.type === 'success' ? 'Success' : 'Error'}
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {saveModal.message}
            </p>
            <div className="mt-8 flex justify-end">
              <button type="button"
                onClick={closeSaveModal}
                className="rounded-2xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#75EEA5] transition-all hover:bg-slate-800"
              >
                {saveModal.type === 'success' ? 'Go to registry' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="sticky bottom-0 z-50 mt-auto flex gap-4 border-t border-slate-100 bg-white p-6 lg:p-10">
        <button type="button"
          onClick={handleAbort}
          className="rounded-2xl bg-slate-900/5 px-8 py-4 text-[10px] font-black tracking-[3px] text-slate-900 uppercase transition-all hover:bg-slate-900/10 lg:py-5"
        >
          ABORT
        </button>
        <button type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-[3px] text-[#75EEA5] uppercase shadow-2xl shadow-slate-900/20 transition-all hover:-translate-y-1 disabled:opacity-50 lg:py-5"
        >
          {isSaving ? 'SAVING...' : 'COMMIT PAYLOAD'}
        </button>
      </div>
    </div>
  )
}