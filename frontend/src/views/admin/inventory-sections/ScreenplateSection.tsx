import { useState } from 'react'
import {
  Layers,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  X,
  Check,
  ChevronDown,
  Building2,
  UserCircle,
  Users,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { IUser, IScreenplate, IProduct } from './types'
import { ALIGNMENT_OPTIONS } from './constants'
import {
  InputField,
  TextArea,
  ImageUploader,
  SectionTitle,
  ConfirmModal,
} from './UIComponents'
import toast, { Toaster } from 'react-hot-toast'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

interface ScreenplateSectionProps {
  customers: IUser[]
  screenplates: IScreenplate[]
  products: IProduct[]
  setScreenplates: React.Dispatch<React.SetStateAction<IScreenplate[]>>
}

export const ScreenplateSection: React.FC<ScreenplateSectionProps> = ({
  customers,
  screenplates,
  products,
  setScreenplates,
}) => {
  const [customerSearch, setCustomerSearch] = useState('')
  const [plateSearch, setPlateSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<IUser | null>(
    customers[0] || null,
  )
  const [editingPlate, setEditingPlate] = useState<IScreenplate | null>(null)
  const [isAddingPlate, setIsAddingPlate] = useState(false)
  const [plateToDelete, setPlateToDelete] = useState<IScreenplate | null>(null)

  const filteredCustomers = customers.filter((c) => {
    const s = customerSearch.toLowerCase()
    return (
      c.name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      (c.company_name || '').toLowerCase().includes(s)
    )
  })

  const platesForSelected = screenplates.filter((p) => {
    const matchesCustomer =
      selectedCustomer && p.owner_id === selectedCustomer.id
    const matchesSearch =
      p.plate_name.toLowerCase().includes(plateSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(plateSearch.toLowerCase())
    return matchesCustomer && matchesSearch
  })

  const handleSavePlate = (plate: IScreenplate) => {
    if (isAddingPlate) {
      setScreenplates((prev) => [...prev, { ...plate, id: `SP-${Date.now()}` }])
      toast.success('New screenplate registered.')
    } else {
      setScreenplates((prev) =>
        prev.map((p) => (p.id === plate.id ? plate : p)),
      )
      toast.success('Registry updated.')
    }
    setEditingPlate(null)
    setIsAddingPlate(false)
  }

  const handleDeletePlate = () => {
    if (!plateToDelete) return
    setScreenplates((prev) => prev.filter((p) => p.id !== plateToDelete.id))
    toast.success('Entry removed.')
    setPlateToDelete(null)
  }

  return (
    <div className="-mx-8 -mt-8 flex h-screen flex-col overflow-hidden lg:flex-row">
      <Toaster position="top-right" />

      {/* LEFT SIDEBAR: CUSTOMERS */}
      <aside className="z-10 flex h-full w-full flex-col border-r border-slate-200 bg-white lg:w-[380px]">
        <div className="space-y-6 border-b border-slate-100 p-8">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 italic">
              <Users className="text-[#75EEA5]" size={20} /> CUSTOMER ACCOUNTS
            </h2>
            <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Select an account to view registry
            </p>
          </div>

          <div className="group relative">
            <Search
              className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300 transition-all group-focus-within:text-[#75EEA5]"
              size={16}
            />
            <input
              type="text"
              placeholder="Search name or company..."
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pr-4 pl-11 text-[11px] font-black tracking-tight text-slate-900 uppercase transition-all placeholder:text-slate-300 focus:border-[#75EEA5] focus:ring-4 focus:ring-[#75EEA5]/5 focus:outline-none"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
          <div className="h-2" /> {/* Spacer */}
          {filteredCustomers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCustomer(c)}
              className={cn(
                'group relative flex w-full items-center gap-4 rounded-[24px] border p-5 text-left transition-all',
                selectedCustomer?.id === c.id
                  ? 'scale-[1.02] border-slate-900 bg-slate-900 text-white shadow-2xl'
                  : 'border-slate-100 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20">
                <img
                  src={c.profile_picture}
                  className="h-full w-full object-cover"
                  alt={c.name}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-xs font-black tracking-tight uppercase italic">
                  <UserCircle
                    size={10}
                    className={
                      selectedCustomer?.id === c.id
                        ? 'text-[#75EEA5]'
                        : 'text-slate-300'
                    }
                  />
                  {c.name}
                </p>
                {c.company_name && (
                  <p
                    className={cn(
                      'mt-1.5 flex items-center gap-1.5 truncate text-[9px] font-black tracking-widest uppercase',
                      selectedCustomer?.id === c.id
                        ? 'text-slate-400'
                        : 'text-slate-400',
                    )}
                  >
                    <Building2 size={10} />
                    {c.company_name}
                  </p>
                )}
              </div>
              <ChevronRight
                size={14}
                className={cn(
                  'shrink-0 transition-transform',
                  selectedCustomer?.id === c.id
                    ? 'rotate-90 text-[#75EEA5]'
                    : 'text-slate-200 group-hover:translate-x-1',
                )}
              />
            </button>
          ))}
          {filteredCustomers.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center opacity-20">
              <Search size={40} className="mb-4" />
              <p className="text-xs font-black tracking-widest uppercase italic">
                No accounts matched
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT CONTENT: SCREENPLATES */}
      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-slate-50/10 backdrop-blur-3xl">
        <div className="relative z-10 flex flex-col justify-between gap-6 border-b border-slate-100 bg-white/50 p-8 backdrop-blur-md md:flex-row md:items-center lg:p-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-2 rounded-full bg-[#75EEA5]" />
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                  {selectedCustomer?.name || 'Isolated Registry'}
                </h2>
                <p className="mt-1 text-xs font-bold tracking-widest text-slate-500 uppercase">
                  {selectedCustomer?.company_name ||
                    'Individual Industrial Storage'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="group relative">
              <Search
                className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search plate name..."
                className="w-[240px] rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-[10px] font-black tracking-widest uppercase transition-all focus:border-slate-900 focus:outline-none"
                value={plateSearch}
                onChange={(e) => setPlateSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setIsAddingPlate(true)
                setEditingPlate({
                  id: '',
                  owner_id: selectedCustomer?.id || customers[0].id,
                  plate_name: 'New Screen Mesh',
                  image: '',
                  channels: 1,
                  alignment: ALIGNMENT_OPTIONS[0],
                  technical_info: '',
                  comment: '',
                  compatibility: [],
                  is_flatscreen: false,
                  incompatible_products: [],
                  base_setup_fee: 450,
                  dimensions: '',
                })
              }}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-[10px] font-black tracking-widest text-[#75EEA5] uppercase shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95"
            >
              <Plus size={16} /> Add New Entry
            </button>
          </div>
        </div>

        <div className="custom-scrollbar relative z-0 flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {platesForSelected.map((plate) => {
              return (
                <motion.div
                  layout
                  id={`plate-${plate.id}`}
                  key={plate.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 transition-all duration-500 hover:border-[#75EEA5]/30 hover:shadow-2xl hover:shadow-[#75EEA5]/5"
                >
                  {/* Plate Identification */}

                  <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-[24px] border-4 border-white bg-slate-100 shadow-inner">
                    <img
                      src={
                        plate.image ||
                        'https://placehold.co/800x600?text=Registry+Plate'
                      }
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt="Mesh"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>

                  <div className="flex-1">
                    <h4 className="mb-1 text-lg font-black tracking-tight text-slate-900 uppercase italic">
                      {plate.plate_name}
                    </h4>
                    <p className="mb-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      ID: {plate.id}
                    </p>

                    <div className="mb-4 grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="mb-1 text-[8px] font-black tracking-[2px] text-slate-400 uppercase">
                          CHANNELS
                        </p>
                        <p className="text-sm font-black text-slate-900">
                          {plate.channels} COLORS
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="mb-1 text-[8px] font-black tracking-[2px] text-slate-400 uppercase">
                          SETUP FEE
                        </p>
                        <p className="text-sm font-black text-emerald-600 uppercase">
                          ₱{plate.base_setup_fee ?? 0}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="mb-1 text-[8px] font-black tracking-[2px] text-slate-400 uppercase">
                          ALIGNMENT
                        </p>
                        <p className="truncate text-xs font-black text-slate-900 uppercase">
                          {plate.alignment}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="mb-1 text-[8px] font-black tracking-[2px] text-slate-400 uppercase">
                          DIMENSIONS
                        </p>
                        <p className="truncate text-[10px] font-black text-slate-900 uppercase">
                          {plate.dimensions || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-black tracking-[2px] text-slate-900 uppercase italic">
                          Compatibility Hub
                        </h5>
                        <span className="rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[9px] font-black text-[#10b981]">
                          {plate.compatibility.length} Nodes
                        </span>
                      </div>
                      <div className="flex max-h-[70px] flex-wrap gap-1.5 overflow-hidden transition-all duration-500 group-hover:max-h-none">
                        {plate.compatibility.map((c) => {
                          const prod = products.find(
                            (p) => p.id === c.product_id,
                          )
                          return (
                            <div
                              key={c.product_id}
                              className="cursor-default rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black tracking-tight text-emerald-700 uppercase transition-all hover:border-emerald-600 hover:text-emerald-900"
                            >
                              {prod?.name || c.product_id}
                            </div>
                          )
                        })}
                        {plate.compatibility.length === 0 && (
                          <p className="text-[10px] font-bold text-slate-300 italic">
                            No compatible nodes mapped
                          </p>
                        )}
                      </div>

                      {plate.incompatible_products &&
                        plate.incompatible_products.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-[10px] font-black tracking-[2px] text-rose-500 uppercase italic">
                                Incompatibility Matrix
                              </h5>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {plate.incompatible_products.map((id) => {
                                const prod = products.find((p) => p.id === id)
                                return (
                                  <div
                                    key={id}
                                    className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-[8px] font-black tracking-tight text-rose-400 uppercase"
                                  >
                                    {prod?.name || id}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPlate(plate)}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-400 shadow-sm transition-all hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 active:scale-90"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setPlateToDelete(plate)}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-400 shadow-sm transition-all hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 active:scale-90"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black tracking-widest text-slate-300 uppercase">
                        METRIC READY
                      </p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[#75EEA5]">
                        <Check size={12} strokeWidth={4} />
                        <span className="text-[10px] font-black uppercase">
                          VALID
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {platesForSelected.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-40 opacity-10 grayscale">
                <Layers size={100} className="mb-6" />
                <p className="text-xl font-black tracking-widest uppercase">
                  Registry Vacuum Detected
                </p>
                <p className="mt-2 text-sm font-bold uppercase italic">
                  No screenplates are currently stored for this node context.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {editingPlate && (
          <ScreenplateModal
            plate={editingPlate}
            customers={customers}
            products={products}
            onClose={() => {
              setEditingPlate(null)
              setIsAddingPlate(false)
            }}
            onSave={handleSavePlate}
          />
        )}
        {plateToDelete && (
          <ConfirmModal
            isOpen={!!plateToDelete}
            onClose={() => setPlateToDelete(null)}
            onConfirm={handleDeletePlate}
            title="Purge Registry Node?"
            message={`Proceeding will permanently delete the screenplate payload for "${plateToDelete.plate_name}". This data cannot be recovered.`}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// MODAL SUBCOMPONENT
const ScreenplateModal = ({
  plate,
  customers,
  products,
  onClose,
  onSave,
}: {
  plate: IScreenplate
  customers: IUser[]
  products: IProduct[]
  onClose: () => void
  onSave: (p: IScreenplate) => void
}) => {
  const [data, setData] = useState<IScreenplate>(plate)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  const update = <K extends keyof IScreenplate>(
    field: K,
    val: IScreenplate[K],
  ) => setData((p) => ({ ...p, [field]: val }))

  const toggleProductSelection = (productId: string) => {
    const exists = data.compatibility.some((c) => c.product_id === productId)
    if (exists) {
      update(
        'compatibility',
        data.compatibility.filter((c) => c.product_id !== productId),
      )
    } else {
      // When adding to compatibility, remove from incompatibility if present
      const nextIncompatible = (data.incompatible_products || []).filter(
        (id) => id !== productId,
      )
      update('incompatible_products', nextIncompatible)
      update('compatibility', [
        ...data.compatibility,
        {
          product_id: productId,
          allowed_variants: [],
          print_price_per_unit: {},
        },
      ])
    }
  }

  const toggleIncompatibility = (productId: string) => {
    const next = [...(data.incompatible_products || [])]
    const idx = next.indexOf(productId)
    if (idx > -1) {
      next.splice(idx, 1)
    } else {
      // When adding to incompatibility, remove from compatibility if present
      const nextCompat = data.compatibility.filter(
        (c) => c.product_id !== productId,
      )
      update('compatibility', nextCompat)
      next.push(productId)
    }
    update('incompatible_products', next)
  }

  const toggleVariant = (productId: string, variantId: string) => {
    const next = [...data.compatibility]
    const idx = next.findIndex((c) => c.product_id === productId)
    if (idx === -1) return

    const variants = next[idx].allowed_variants
    if (variants.includes(variantId)) {
      next[idx].allowed_variants = variants.filter((v) => v !== variantId)
      // Clean up price if variant removed
      if (next[idx].print_price_per_unit) {
        delete next[idx].print_price_per_unit![variantId]
      }
    } else {
      next[idx].allowed_variants = [...variants, variantId]
      if (!next[idx].print_price_per_unit) next[idx].print_price_per_unit = {}
      next[idx].print_price_per_unit![variantId] = 1.0 // default
    }
    update('compatibility', next)
  }

  const updateVariantPrice = (
    productId: string,
    variantId: string,
    price: number,
  ) => {
    const next = [...data.compatibility]
    const idx = next.findIndex((c) => c.product_id === productId)
    if (idx === -1) return
    if (!next[idx].print_price_per_unit) next[idx].print_price_per_unit = {}
    next[idx].print_price_per_unit![variantId] = price
    update('compatibility', next)
  }

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 35, stiffness: 400 }}
        className="shadow-3xl relative flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white"
      >
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white p-8">
          <div>
            <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
              Mesh Specification
            </h3>
            <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Update industrial registry and mapping
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-4 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-12 overflow-y-auto p-10 pb-32">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="space-y-8">
              <SectionTitle title="Aura & Identity" />
              <div>
                <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Customer Owner
                </label>
                <select
                  value={data.owner_id}
                  onChange={(e) => update('owner_id', e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xs font-black tracking-tight text-slate-900 uppercase italic transition-all outline-none focus:border-slate-900"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company_name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Node Asset Image
                </p>
                <ImageUploader
                  value={data.image || ''}
                  onChange={(v: string) => update('image', v)}
                  className="aspect-video"
                />
              </div>
            </div>
            <div className="space-y-8">
              <SectionTitle title="Specifications" />
              <InputField
                label="Registry Name"
                value={data.plate_name}
                onChange={(v: string) => update('plate_name', v)}
                placeholder="Standard Mesh..."
              />
              <div className="grid grid-cols-2 gap-6">
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
                    {ALIGNMENT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
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

                  // Technical Rule Enforcement based on Category mapping (Milktea Cup vs. Meal Box)
                  const targetIncompatCategory = nextVal
                    ? 'Milktea Cup'
                    : 'Meal Box'
                  const filteredIncompatIds = products
                    .filter((p) => p.category === targetIncompatCategory)
                    .map((p) => p.id)

                  const currentIncompat = data.incompatible_products || []
                  const nextIncompat = Array.from(
                    new Set([
                      ...currentIncompat.filter((id) => {
                        const p = products.find((prod) => prod.id === id)
                        // Remove the opposing category if we switch modes?
                        // User said "vise versa", so if I switch to flatscreen, I move milktea to incompat.
                        // If I switch to curved, I move mealbox to incompat.
                        return (
                          p?.category !== (nextVal ? 'Meal Box' : 'Milktea Cup')
                        )
                      }),
                      ...filteredIncompatIds,
                    ]),
                  )

                  update('incompatible_products', nextIncompat)

                  // Purge the new incompatibles from the compatibility matrix
                  update(
                    'compatibility',
                    data.compatibility.filter(
                      (c) => !filteredIncompatIds.includes(c.product_id),
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
                      'flex h-12 w-12 items-center justify-center rounded-2xl transition-all',
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
                      'absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300',
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

          <div className="space-y-8 border-t border-slate-100 pt-10">
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products
                .filter((p) => !p.category.toLowerCase().includes('lid'))
                .map((p) => {
                  const isSelected = data.compatibility.some(
                    (c) => c.product_id === p.id,
                  )
                  const isIncompatible = (
                    data.incompatible_products || []
                  ).includes(p.id)
                  const isExpanded = expandedProduct === p.id

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'overflow-hidden rounded-[24px] border-2 transition-all duration-300',
                        isSelected
                          ? 'border-[#75EEA5] bg-white shadow-lg shadow-[#75EEA5]/5'
                          : isIncompatible
                            ? 'border-rose-400 bg-rose-50/20'
                            : 'border-slate-50 bg-slate-50/30',
                      )}
                    >
                      <div className="flex w-full items-center gap-3 p-4">
                        <button
                          onClick={() => toggleProductSelection(p.id)}
                          className={cn(
                            'shrink-0 rounded-xl border-2 p-2 transition-all',
                            isSelected
                              ? 'border-[#75EEA5] bg-[#75EEA5] text-slate-900'
                              : 'border-slate-100 bg-white text-slate-200',
                          )}
                          title="Mark as Compatible"
                        >
                          <Check size={12} strokeWidth={4} />
                        </button>

                        <button
                          onClick={() => toggleIncompatibility(p.id)}
                          className={cn(
                            'shrink-0 rounded-xl border-2 p-2 transition-all',
                            isIncompatible
                              ? 'border-rose-500 bg-rose-500 text-white'
                              : 'border-slate-100 bg-white text-slate-200',
                          )}
                          title="Mark as Incompatible"
                        >
                          <X size={12} strokeWidth={4} />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-black tracking-tight text-slate-900 uppercase italic">
                            {p.name}
                          </p>
                          <p className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                            {p.category}
                          </p>
                        </div>
                        {isSelected && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedProduct(isExpanded ? null : p.id)
                            }}
                            className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                          >
                            <ChevronDown
                              size={12}
                              className={cn(
                                'transition-transform',
                                isExpanded && 'rotate-180',
                              )}
                            />
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && isSelected && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-slate-50/50"
                          >
                            <div className="space-y-4 p-4">
                              <div className="grid grid-cols-1 gap-2">
                                {p.variants.map((v) => {
                                  const config = data.compatibility.find(
                                    (c) => c.product_id === p.id,
                                  )
                                  const isLinked =
                                    config?.allowed_variants.includes(
                                      v.variant_id,
                                    )
                                  const currentPrice =
                                    config?.print_price_per_unit?.[
                                      v.variant_id
                                    ] || 0

                                  return (
                                    <div
                                      key={v.variant_id}
                                      className="flex items-center gap-2"
                                    >
                                      <button
                                        onClick={() =>
                                          toggleVariant(p.id, v.variant_id)
                                        }
                                        className={cn(
                                          'flex-1 rounded-xl border px-3 py-2 text-left text-[8px] font-black tracking-widest uppercase transition-all',
                                          isLinked
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-200 bg-white text-slate-400',
                                        )}
                                      >
                                        {v.size}
                                      </button>
                                      {isLinked && (
                                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2">
                                          <span className="mt-0.5 text-[7px] leading-none font-black tracking-tighter text-slate-400 uppercase">
                                            ₱
                                          </span>
                                          <input
                                            type="number"
                                            step="0.1"
                                            value={currentPrice}
                                            onChange={(e) =>
                                              updateVariantPrice(
                                                p.id,
                                                v.variant_id,
                                                parseFloat(e.target.value),
                                              )
                                            }
                                            className="no-spinner w-12 bg-transparent py-2 text-center text-[10px] font-black text-slate-900 outline-none"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-50 flex gap-4 border-t border-slate-100 bg-white p-10">
          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-900/5 px-8 py-5 text-[10px] font-black tracking-[3px] text-slate-900 uppercase transition-all hover:bg-slate-900/10"
          >
            ABORT
          </button>
          <button
            onClick={() => onSave(data)}
            className="flex-1 rounded-2xl bg-slate-900 py-5 text-[10px] font-black tracking-[3px] text-[#75EEA5] uppercase shadow-2xl shadow-slate-900/20 transition-all hover:-translate-y-1"
          >
            COMMIT PAYLOAD
          </button>
        </div>
      </motion.div>
    </div>
  )
}
