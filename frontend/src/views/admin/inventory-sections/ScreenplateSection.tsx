import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Check,
  Building2,
  UserCircle,
  Users,
  Menu,
  X,
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import type { IUser, IScreenplate, IProduct } from './types'
import {
  ConfirmModal,
} from './UIComponents'
import BoxFallback from '../../../components/common/BoxFallback'
import toast from 'react-hot-toast'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

const SafeImage = ({
  src,
  alt,
  className,
  pathPrefix,
}: {
  src: string
  alt: string
  className: string
  pathPrefix?: string
}) => {
  const [error, setError] = useState(false)
  const resolved =
    !src || src.startsWith('http') || src.startsWith('data:') || src.startsWith('/')
      ? src
      : `${pathPrefix || ''}${src}`

  if (error || !src) {
    return (
      <BoxFallback
        className="flex h-full w-full items-center justify-center bg-slate-100"
        iconClassName="h-8 w-8 opacity-30"
      />
    )
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  )
}

interface ScreenplateSectionProps {
  customers: IUser[]
  screenplates: IScreenplate[]
  products: IProduct[]
  onDelete: (id: string) => Promise<void>
}

export const ScreenplateSection: React.FC<ScreenplateSectionProps> = ({
  customers,
  screenplates,
  products,
  onDelete,
}) => {
  const navigate = useNavigate()
  const [customerSearch, setCustomerSearch] = useState('')
  const [plateSearch, setPlateSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<IUser | null>(
    customers[0] || null,
  )
  const [plateToDelete, setPlateToDelete] = useState<IScreenplate | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  const handleDeletePlate = async () => {
    if (!plateToDelete) return
    try {
      await onDelete(plateToDelete.id)
      toast.success('Entry removed.')
      setPlateToDelete(null)
    } catch {
      toast.error('Failed to delete screenplate.')
    }
  }

  const selectCustomer = (c: IUser) => {
    setSelectedCustomer(c)
    setIsMobileSidebarOpen(false)
  }

  const sidebarContent = (
    <aside
      className={cn(
        'flex h-full w-full flex-col bg-white',
        isDesktop ? 'border-r border-slate-200' : '',
      )}
    >
      <div className="space-y-6 border-b border-slate-100 p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 italic">
              <Users className="text-[#75EEA5]" size={20} /> CUSTOMER ACCOUNTS
            </h2>
            <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Select an account to view registry
            </p>
          </div>
          {!isDesktop && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          )}
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
        {filteredCustomers.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCustomer(c)}
            className={cn(
              'group relative flex w-full items-center gap-4 rounded-[24px] border p-5 text-left transition-all',
              selectedCustomer?.id === c.id
                ? 'scale-[1.02] border-slate-900 bg-slate-900 text-white shadow-2xl'
                : 'border-slate-100 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20">
              <SafeImage
                src={c.profile_picture}
                alt={c.name}
                className="h-full w-full object-cover"
                pathPrefix="/src/assets/profile/"
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
  )

  return (
    <div className="-mx-4 flex min-h-[70vh] flex-col overflow-hidden lg:-mx-8 lg:flex-row lg:min-h-screen">
      {/* DESKTOP SIDEBAR */}
      {isDesktop && (
        <div className="z-10 hidden w-full lg:flex lg:w-[380px]">
          {sidebarContent}
        </div>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {!isDesktop && isMobileSidebarOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <m.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="relative h-full w-[320px] max-w-[85vw] overflow-hidden bg-white shadow-2xl"
            >
              {sidebarContent}
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* RIGHT CONTENT: SCREENPLATES */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-slate-50/10 backdrop-blur-3xl">
        {/* Header */}
        <div className="relative z-10 flex flex-col gap-4 border-b border-slate-100 bg-white/50 p-4 backdrop-blur-md lg:p-8 lg:gap-6">
          {/* Mobile: Customer selector + header row */}
          <div className="flex items-center gap-3">
            {!isDesktop && (
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
              >
                <Menu size={18} />
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="h-8 w-2 shrink-0 rounded-full bg-[#75EEA5]" />
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black tracking-tighter text-slate-900 uppercase italic lg:text-2xl">
                    {selectedCustomer?.name || 'Isolated Registry'}
                  </h2>
                  <p className="mt-0.5 truncate text-[10px] font-bold tracking-widest text-slate-500 uppercase lg:text-xs">
                    {selectedCustomer?.company_name ||
                      'Individual Industrial Storage'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Add button row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="group relative flex-1">
              <Search
                className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search plate name..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-[10px] font-black tracking-widest uppercase transition-all focus:border-slate-900 focus:outline-none"
                value={plateSearch}
                onChange={(e) => setPlateSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => navigate('/admin/screenplate/manage')}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-[10px] font-black tracking-widest text-[#75EEA5] uppercase shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95"
            >
              <Plus size={16} /> Add New Entry
            </button>
          </div>
        </div>

        {/* Plate grid */}
        <div className="custom-scrollbar relative z-0 flex-1 overflow-y-auto p-4 lg:p-8 xl:p-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {platesForSelected.map((plate) => (
              <m.div
                layout
                id={`plate-${plate.id}`}
                key={plate.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-100 bg-white p-5 transition-all duration-500 hover:border-[#75EEA5]/30 hover:shadow-2xl hover:shadow-[#75EEA5]/5 lg:rounded-[32px] lg:p-6"
              >
                <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-[20px] border-4 border-white bg-slate-100 shadow-inner lg:rounded-[24px] lg:mb-6">
                  <SafeImage
                    src={plate.image}
                    alt={plate.plate_name || 'Mesh'}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    pathPrefix="/images/screenplate/"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <div className="flex-1">
                  <h4 className="mb-1 text-base font-black tracking-tight text-slate-900 uppercase italic lg:text-lg">
                    {plate.plate_name}
                  </h4>
                  <p className="mb-5 text-[10px] font-black tracking-widest text-slate-400 uppercase lg:mb-6">
                    ID: {plate.id}
                  </p>

                  <div className="mb-4 grid grid-cols-2 gap-3 lg:gap-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 lg:p-3.5">
                      <p className="mb-1 text-[8px] font-black tracking-[2px] text-slate-400 uppercase">
                        CHANNELS
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        {plate.channels} COLORS
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 lg:p-3.5">
                      <p className="mb-1 text-[8px] font-black tracking-[2px] text-slate-400 uppercase">
                        SETUP FEE
                      </p>
                      <p className="text-sm font-black text-emerald-600 uppercase">
                        ₱{plate.base_setup_fee ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 lg:p-3.5">
                      <p className="mb-1 text-[8px] font-black tracking-[2px] text-slate-400 uppercase">
                        ALIGNMENT
                      </p>
                      <p className="truncate text-xs font-black text-slate-900 uppercase">
                        {plate.alignment}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 lg:p-3.5">
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

                <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-5 lg:mt-8 lg:pt-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/screenplate/manage/${plate.id}`)}
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
              </m.div>
            ))}

            {platesForSelected.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-10 grayscale lg:py-40">
                <Layers size={80} className="mb-4 lg:mb-6 lg:h-[100px] lg:w-[100px]" />
                <p className="text-lg font-black tracking-widest uppercase lg:text-xl">
                  Registry Vacuum Detected
                </p>
                <p className="mt-2 text-xs font-bold uppercase italic lg:text-sm">
                  No screenplates are currently stored for this node context.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* DELETE MODAL */}
      {plateToDelete && (
        <ConfirmModal
          isOpen={!!plateToDelete}
          onClose={() => setPlateToDelete(null)}
          onConfirm={handleDeletePlate}
          title="Purge Registry Node?"
          message={`Proceeding will permanently delete the screenplate payload for "${plateToDelete.plate_name}". This data cannot be recovered.`}
        />
      )}
    </div>
  )
}
