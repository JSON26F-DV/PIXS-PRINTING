import React, { useState } from 'react'
import {
  FiPlus,
  FiTrash2,
  FiCheck,
  FiCreditCard,
  FiSmartphone,
  FiBriefcase,
  FiChevronDown,
  FiAlertCircle,
  FiSave,
  FiX,
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

// ─── Payment Protocol Interfaces ─────────────────────────────────────────────
interface PaymentMethod {
  id: string
  type: 'bank' | 'ewallet'
  bank_name: string | null
  provider: string | null
  masked_number: string
  is_default: boolean
}

// ─── Validation Node Schema ──────────────────────────────────────────────────
const paymentSchema = z.object({
  type: z.enum(['GCash', 'PayMaya', 'Chinabank', 'BPI']),
  accountName: z.string().min(2, 'Identification string required'),
  accountNumber: z.string().min(6, 'Invalid sequence length'),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

// ─── Helper: Icon Mapping ────────────────────────────────────────────────────
const TYPE_ICONS: Record<string, React.ElementType> = {
  GCash: FiSmartphone,
  PayMaya: FiSmartphone,
  Chinabank: FiBriefcase,
  BPI: FiBriefcase,
  bank: FiBriefcase,
  ewallet: FiSmartphone,
}

// ─── Component: PaymentMethodCard ────────────────────────────────────────────
const PaymentMethodCard: React.FC<{
  method: PaymentMethod
  onSetDefault: (id: string) => void
  onRemove: (id: string) => void
}> = ({ method, onSetDefault, onRemove }) => {
  const displayType = method.provider || method.bank_name || method.type
  const Icon = TYPE_ICONS[displayType] || FiCreditCard

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={clsx(
        'PaymentMethodCard group relative flex flex-col justify-between gap-4 rounded-[24px] border p-6 transition-all duration-300 sm:flex-row sm:items-center',
        method.is_default
          ? 'border-slate-900 bg-slate-900 shadow-xl shadow-slate-200'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md',
      )}
    >
      <div className="flex items-center gap-5">
        <div
          className={clsx(
            'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300',
            method.is_default
              ? 'text-pixs-mint bg-white/10'
              : 'bg-slate-50 text-slate-400 group-hover:text-slate-900',
          )}
        >
          <Icon size={24} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h4
              className={clsx(
                'PaymentType text-sm font-black tracking-widest uppercase italic',
                method.is_default ? 'text-white' : 'text-slate-900',
              )}
            >
              {displayType}
            </h4>
            {method.is_default && (
              <span className="bg-pixs-mint rounded-full px-2.5 py-0.5 text-[8px] font-black tracking-widest text-slate-900 uppercase">
                Primary Node
              </span>
            )}
          </div>
          <p
            className={clsx(
              'PaymentMaskedInfo mt-1 font-mono text-xs font-black tracking-tighter italic',
              method.is_default ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            {method.masked_number}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-18 sm:pl-0">
        <div className="flex flex-col items-center">
          <label className="group/selector flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="default-payment"
              checked={method.is_default}
              onChange={() => onSetDefault(method.id)}
              className="DefaultPaymentSelector hidden"
            />
            <div
              className={clsx(
                'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                method.is_default
                  ? 'border-pixs-mint bg-pixs-mint shadow-[0_0_10px_#75EEA5]'
                  : 'group-hover/selector:border-pixs-mint border-slate-200 bg-white',
              )}
            >
              {method.is_default && (
                <FiCheck className="text-slate-900" size={14} strokeWidth={4} />
              )}
            </div>
            <span
              className={clsx(
                'text-[9px] font-black tracking-widest uppercase italic transition-colors',
                method.is_default
                  ? 'text-pixs-mint'
                  : 'text-slate-400 group-hover/selector:text-slate-600',
              )}
            >
              {method.is_default ? 'Active' : 'Set Default'}
            </span>
          </label>
        </div>

        <button
          onClick={() => onRemove(method.id)}
          className="RemovePaymentMethodButton ml-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-300 transition-all duration-300 hover:bg-red-500 hover:text-white hover:shadow-lg active:scale-90"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Section: PaymentMethodsSection ─────────────────────────────────────
import axiosInstance from '../../../lib/axiosInstance'

const PaymentMethodsSection: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchMethods = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const resp = await axiosInstance.get('/api/customer/payment-methods')
      setMethods(resp.data.data)
    } catch {
      toast.error('Failed to load payment nodes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'GCash',
      accountName: '',
      accountNumber: '',
    },
  })

  React.useEffect(() => {
    fetchMethods()
  }, [fetchMethods])

  const handleSetDefault = async (id: string) => {
    try {
      await axiosInstance.post(`/api/customer/payment-methods/${id}/default`)
      setMethods((prev) => prev.map((m) => ({ ...m, is_default: m.id === id })))
      toast.success('Primary node updated')
    } catch {
      toast.error('Failed to update primary node')
    }
  }

  const handleRemove = (id: string) => {
    setConfirmDelete(id)
  }

  const executeRemove = async () => {
    if (confirmDelete) {
      try {
        await axiosInstance.delete(
          `/api/customer/payment-methods/${confirmDelete}`,
        )
        setMethods((prev) => prev.filter((m) => m.id !== confirmDelete))
        setConfirmDelete(null)
        toast.success('Node decommissioned')
      } catch {
        toast.error('Failed to decommission node')
      }
    }
  }

  const onAddMethod = async (data: PaymentFormValues) => {
    const isEwallet = ['GCash', 'PayMaya'].includes(data.type)

    const payload = {
      type: (isEwallet ? 'ewallet' : 'bank') as 'ewallet' | 'bank',
      provider: isEwallet ? data.type : '',
      bank_name: isEwallet ? '' : data.type,
      masked_number: data.accountNumber
        .slice(-4)
        .padStart(data.accountNumber.length, '•'),
    }

    try {
      const resp = await axiosInstance.post(
        '/api/customer/payment-methods',
        payload,
      )
      const newMethod = resp.data.data
      setMethods((prev) => [
        newMethod,
        ...prev.map((m) =>
          newMethod.is_default ? { ...m, is_default: false } : m,
        ),
      ])
      setIsAdding(false)
      reset()
      toast.success('Payment method initialized')
    } catch {
      toast.error('Failed to initialize payment node')
    }
  }

  if (isLoading && methods.length === 0) {
    return (
      <div className="flex h-64 animate-pulse items-center justify-center text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
        Syncing Financial Nodes...
      </div>
    )
  }

  return (
    <div className="SettingsPaymentMethods space-y-12">
      {/* ── Header Node ── */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="mb-2 text-2xl leading-none font-black tracking-tighter text-slate-900 uppercase italic">
            Finance Hub
          </h2>
          <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
            Configure automated transaction clusters
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="AddPaymentMethodButton flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-8 py-4 text-[10px] font-black tracking-[4px] text-white uppercase italic shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <FiPlus size={16} className="text-pixs-mint" />
            Add Method Node
          </button>
        )}
      </div>

      {/* ── Add/Edit Logic Area ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              className="space-y-8 rounded-[32px] border border-white bg-slate-50 p-8"
              onSubmit={handleSubmit(onAddMethod)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
                    <FiCreditCard className="text-pixs-mint" size={18} />
                  </div>
                  <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase">
                    New Payment Protocol
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 transition-colors hover:text-slate-900"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Method Selector Dropdown */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[30%] text-slate-400 uppercase italic">
                    Type Cluster
                  </label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <div className="group relative">
                        <select
                          {...field}
                          className="group-focus-within:border-pixs-mint h-14 w-full cursor-pointer appearance-none rounded-2xl border border-slate-100 bg-white px-6 text-sm font-bold text-slate-800 transition-all outline-none"
                        >
                          <option value="GCash">GCash Node</option>
                          <option value="PayMaya">PayMaya Node</option>
                          <option value="Chinabank">Chinabank Protocol</option>
                          <option value="BPI">BPI Network</option>
                        </select>
                        <FiChevronDown
                          className="absolute top-1/2 right-5 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                      </div>
                    )}
                  />
                </div>

                {/* Account Name Node */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[30%] text-slate-400 uppercase italic">
                    Identity String
                  </label>
                  <div className="group relative">
                    <input
                      {...register('accountName')}
                      placeholder="Jason Rivera"
                      className="focus:border-pixs-mint h-14 w-full rounded-2xl border border-slate-100 bg-white px-6 text-sm font-bold text-slate-800 italic transition-all outline-none"
                    />
                  </div>
                  {errors.accountName && (
                    <p className="text-[8px] font-black tracking-widest text-rose-500 uppercase">
                      {errors.accountName.message}
                    </p>
                  )}
                </div>

                {/* Account Number Node */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[30%] text-slate-400 uppercase italic">
                    Account Matrix
                  </label>
                  <div className="group relative">
                    <input
                      {...register('accountNumber')}
                      placeholder="0917 XXX XXXX"
                      className="focus:border-pixs-mint h-14 w-full rounded-2xl border border-slate-100 bg-white px-6 font-mono text-sm font-bold text-slate-800 transition-all outline-none"
                    />
                  </div>
                  {errors.accountNumber && (
                    <p className="text-[8px] font-black tracking-widest text-rose-500 uppercase">
                      {errors.accountNumber.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200/50 pt-4">
                <button
                  type="submit"
                  disabled={!isValid}
                  className="SavePaymentMethodButton bg-pixs-mint flex items-center gap-3 rounded-2xl px-12 py-5 text-[10px] font-black tracking-[4px] text-slate-900 uppercase italic shadow-xl transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:grayscale"
                >
                  <FiSave size={16} />
                  Initialize Node
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Matrix area ── */}
      <div className="space-y-4">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-[9px] font-black tracking-[5px] text-slate-400 uppercase">
            Security Encrypted Nodes
          </span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {methods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onSetDefault={handleSetDefault}
                onRemove={handleRemove}
              />
            ))}
          </AnimatePresence>

          {methods.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-[48px] border-2 border-dashed border-slate-100 bg-slate-50/50 py-24"
            >
              <FiCreditCard size={48} className="mb-6 text-slate-100" />
              <p className="text-sm font-black tracking-[5px] text-slate-300 uppercase italic">
                No Active Payment Clusters
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Security Declaration ── */}
      <div className="relative flex items-start gap-4 overflow-hidden rounded-[32px] bg-slate-900 p-8">
        <div className="absolute top-0 right-0 p-12 text-white opacity-5">
          <FiCheck size={120} strokeWidth={1} />
        </div>
        <div className="bg-pixs-mint flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
          <FiAlertCircle className="text-slate-900" size={24} />
        </div>
        <div>
          <h4 className="mb-2 text-sm font-black tracking-widest text-white uppercase italic">
            Protocol Protection
          </h4>
          <p className="max-w-xl text-xs leading-relaxed font-bold text-slate-400">
            PIXS does not store full encryption keys within this node. All
            payment data is decentralized and tokenized by our industrial
            banking partners. Synchronized with PCI-DSS Compliance Node V4.0.
          </p>
        </div>
      </div>

      {/* ── Removal Confirmation Modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-md"
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 z-[501] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[48px] bg-white p-12 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-red-50 text-red-500">
                  <FiTrash2 size={32} />
                </div>
                <h3 className="mb-4 text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Decommission Node?
                </h3>
                <p className="mb-10 text-sm leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
                  Are you sure you want to terminate this payment cluster
                  sequence? This action is irreversible.
                </p>
                <div className="grid w-full grid-cols-2 gap-4">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="h-16 rounded-2xl border border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-all hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeRemove}
                    className="h-16 rounded-2xl bg-red-500 text-[10px] font-black tracking-widest text-white uppercase shadow-xl shadow-red-200 transition-all hover:bg-red-600 active:scale-95"
                  >
                    Confirm Deletion
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PaymentMethodsSection
