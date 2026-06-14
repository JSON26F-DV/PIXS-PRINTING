import React, { useState, useEffect, useMemo } from 'react'
import {
  Ticket,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../../lib/axiosInstance'
import { useDebounce } from '../../hooks/useDebounce'

// Interface for Payment Code Data
interface IPaymentCode {
  id: string
  code: string
  is_used: boolean | number
  used_at: string | null
  created_at: string
}

// Module-level Search Bar component to prevent focus loss on re-render
const SearchBar: React.FC<{
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}> = ({ value, onChange, placeholder = 'Search codes...' }) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-12 text-sm font-black tracking-widest text-slate-900 placeholder-slate-300 focus:border-slate-900 focus:outline-none uppercase"
      />
    </div>
  )
}

const PayCode: React.FC = () => {
  const [codes, setCodes] = useState<IPaymentCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [rawSearch, setRawSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'unused'>('all')

  // Bulk Generator State
  const [customCode, setCustomCode] = useState('')
  const [quantity, setQuantity] = useState<number>(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCode, setSelectedCode] = useState<IPaymentCode | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Use approved custom debouncer hook
  const debouncedSearch = useDebounce(rawSearch, 350)

  // Fetch payment codes
  const fetchCodes = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/payment-codes')
      setCodes(response.data)
    } catch (err) {
      console.error('Failed to load payment codes:', err)
      toast.error('Failed to retrieve payment codes.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCodes()
  }, [])

  // Optimized client-side search filtering using useMemo
  const filteredCodes = useMemo(() => {
    let result = codes

    // Search query filter
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase().trim()
      result = result.filter((c) => c.code.toLowerCase().includes(term))
    }

    // Status filter
    if (statusFilter === 'used') {
      result = result.filter((c) => !!c.is_used)
    } else if (statusFilter === 'unused') {
      result = result.filter((c) => !c.is_used)
    }

    return result
  }, [codes, debouncedSearch, statusFilter])

  // Handle code generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)

    const payload = customCode.trim()
      ? { code: customCode.trim() }
      : { quantity }

    try {
      const response = await axiosInstance.post('/api/admin/payment-codes', payload)
      toast.success(response.data.message || 'Payment code(s) generated successfully.')
      setCustomCode('')
      setQuantity(1)
      
      // Refresh list
      fetchCodes()
    } catch (err: unknown) {
      console.error('Generation Error:', err)
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg = axiosErr.response?.data?.message || 'Failed to generate payment codes.'
      toast.error(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle deleting payment codes
  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/admin/payment-codes/${id}`)
      toast.success('Payment code deleted successfully.')
      
      // Local filter update for instant visual feedback
      setCodes((prev) => prev.filter((c) => c.id !== id))
    } catch (err: unknown) {
      console.error('Delete error:', err)
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg = axiosErr.response?.data?.message || 'Failed to delete payment code.'
      toast.error(msg)
    }
  }

  // Helper for copying code to clipboard
  const handleCopy = (codeStr: string, id: string) => {
    navigator.clipboard.writeText(codeStr)
    setCopiedId(id)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="PayCodeView p-6 lg:p-10 space-y-10 min-h-screen bg-slate-50">
      {/* 🚀 Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-slate-900 text-white rounded-full px-3 py-1 text-[9px] font-black tracking-[4px] uppercase italic">
              Fintech
            </span>
            <div className="h-0.5 w-12 bg-slate-200" />
          </div>
          <h1 className="text-4xl leading-none font-black tracking-tighter text-slate-900 uppercase italic lg:text-5xl">
            Payment Codes.
          </h1>
          <p className="text-xs leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
            Create, manage, and audit payment codes for cash-paying or special customer transactions.
          </p>
        </div>
        <button
          onClick={fetchCodes}
          className="flex items-center justify-center gap-2 self-start md:self-center border border-slate-200 bg-white px-5 py-3 rounded-full text-[10px] font-black tracking-[3px] text-slate-500 uppercase italic hover:text-slate-950 transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Sync Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr] lg:gap-10">
        {/* 🛠️ Generator Panel */}
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
                Generate Codes
              </h3>
              <p className="mt-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                Create custom or bulk codes
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Custom Code Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                  Custom Code (Optional)
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SPECIALCASH100"
                  maxLength={20}
                  disabled={isGenerating}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-black tracking-widest text-slate-900 placeholder-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none uppercase"
                />
              </div>

              {!customCode && (
                /* Bulk Quantity Selector */
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Bulk Quantity
                  </label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={isGenerating}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-black tracking-wider text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none uppercase italic"
                  >
                    <option value={1}>Generate 1 Code</option>
                    <option value={5}>Generate 5 Codes</option>
                    <option value={10}>Generate 10 Codes</option>
                    <option value={20}>Generate 20 Codes</option>
                    <option value={50}>Generate 50 Codes</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white font-black text-xs tracking-[4px] uppercase italic hover:bg-slate-800 transition-colors shadow-lg active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-pixs-mint" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="text-pixs-mint" />
                    Generate Now
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 📋 Listing and Search */}
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="w-full flex justify-center sm:justify-start">
              <SearchBar value={rawSearch} onChange={(e) => setRawSearch(e.target.value)} />
            </div>
            
            <div className="flex gap-2 rounded-2xl bg-slate-200/60 p-1">
              {(['all', 'unused', 'used'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setStatusFilter(mode)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase italic transition-all ${
                    statusFilter === mode
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 size={36} className="animate-spin text-slate-900" />
                <span className="text-[10px] font-black tracking-widest uppercase">Fetching payment codes...</span>
              </div>
            ) : filteredCodes.length === 0 ? (
              <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Ticket size={40} className="stroke-[1.5] text-slate-300" />
                <span className="text-[10px] font-black tracking-widest uppercase">No payment codes found.</span>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-left">
                        <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Code</th>
                        <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Status</th>
                        <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Used At</th>
                        <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">Created</th>
                        <th className="py-4 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((code) => {
                        const isUsed = Boolean(code.is_used)
                        return (
                          <tr key={code.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            {/* Monospace Code Display */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-black tracking-wider text-slate-900 uppercase">
                                  {code.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(code.code, code.id)}
                                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                                  title="Copy code"
                                >
                                  {copiedId === code.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </td>

                            {/* Status badge */}
                            <td className="py-4 px-4">
                              <div className="flex">
                                {isUsed ? (
                                  <span className="flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/50 text-[8px] font-black tracking-widest text-slate-500 px-2.5 py-1 uppercase">
                                    <XCircle size={10} className="text-slate-400" />
                                    Used
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] font-black tracking-widest text-emerald-600 px-2.5 py-1 uppercase">
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                    Unused
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Used At details */}
                            <td className="py-4 px-4 text-xs font-black tracking-wider text-slate-500">
                              {code.used_at ? new Date(code.used_at).toLocaleString() : '—'}
                            </td>

                            {/* Created At details */}
                            <td className="py-4 px-4 text-xs font-black tracking-wider text-slate-400">
                              {new Date(code.created_at).toLocaleDateString()}
                            </td>

                            {/* Deletion actions */}
                            <td className="py-4 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(code.id)}
                                disabled={isUsed}
                                className={`inline-flex items-center justify-center p-2 rounded-xl border transition-all active:scale-95 ${
                                  isUsed
                                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                    : 'border-rose-100 text-rose-500 bg-rose-50/50 hover:bg-rose-500 hover:text-white shadow-sm shadow-rose-500/5'
                                }`}
                                title={isUsed ? 'Cannot delete used code' : 'Delete code'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-4">
                  {filteredCodes.map((code) => {
                    const isUsed = Boolean(code.is_used)
                    return (
                      <div
                        key={code.id}
                        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black tracking-wider text-slate-900 uppercase">
                              {code.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(code.code, code.id)}
                              className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                              title="Copy code"
                            >
                              {copiedId === code.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>

                          <div>
                            {isUsed ? (
                              <span className="flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/50 text-[8px] font-black tracking-widest text-slate-500 px-2 py-0.5 uppercase">
                                <XCircle size={9} className="text-slate-400" />
                                Used
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] font-black tracking-widest text-emerald-600 px-2 py-0.5 uppercase">
                                <CheckCircle2 size={9} className="text-emerald-500" />
                                Unused
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedCode(code)}
                            className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-500 hover:text-slate-900 uppercase italic transition-colors"
                          >
                            <Eye size={12} />
                            View Details
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(code.id)}
                            disabled={isUsed}
                            className={`flex items-center justify-center p-2 rounded-xl border transition-all active:scale-95 ${
                              isUsed
                                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'border-rose-100 text-rose-500 bg-rose-50/50 hover:bg-rose-500 hover:text-white shadow-sm shadow-rose-500/5'
                            }`}
                            title={isUsed ? 'Cannot delete used code' : 'Delete code'}
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* 🔍 Details Modal */}
      {selectedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-sm bg-white rounded-[32px] border border-slate-100 p-6 shadow-2xl space-y-6 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase italic flex items-center gap-2">
                <Ticket size={16} className="text-slate-900" /> Code Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCode(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Code Field */}
            <div className="space-y-2">
              <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                Payment Code
              </label>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="font-mono text-base font-black tracking-wider text-slate-900 uppercase">
                  {selectedCode.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedCode.code, selectedCode.id)}
                  className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                >
                  {copiedId === selectedCode.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase italic">Status</span>
                <div className="flex">
                  {selectedCode.is_used ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/50 text-[8px] font-black tracking-widest text-slate-500 px-2.5 py-1 uppercase">
                      <XCircle size={10} className="text-slate-400" />
                      Used
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] font-black tracking-widest text-emerald-600 px-2.5 py-1 uppercase">
                      <CheckCircle2 size={10} className="text-emerald-500" />
                      Unused
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase italic">Actions</span>
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmId(selectedCode.id)
                      setSelectedCode(null)
                    }}
                    disabled={!!selectedCode.is_used}
                    className={`flex items-center justify-center gap-1.5 py-1 px-3.5 rounded-full border text-[9px] font-black tracking-widest uppercase italic transition-all ${
                      selectedCode.is_used
                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'border-rose-100 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white shadow-sm'
                    }`}
                  >
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Dates info */}
            <div className="space-y-2 pt-4 border-t border-slate-100 text-[10px] font-bold tracking-wider uppercase text-slate-500">
              <div className="flex justify-between items-center">
                <span>Created At</span>
                <span className="font-black text-slate-700">
                  {new Date(selectedCode.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Used At</span>
                <span className="font-black text-slate-700">
                  {selectedCode.used_at ? new Date(selectedCode.used_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedCode(null)}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] tracking-[3px] uppercase italic transition-colors active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-[32px] border border-slate-100 p-6 shadow-2xl space-y-6 text-center animate-scale-up">
            {/* Warning Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 border border-rose-100">
              <AlertTriangle size={28} />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase italic">
                Delete Payment Code?
              </h3>
              <p className="text-xs font-bold leading-relaxed text-slate-400 uppercase">
                Are you absolutely sure you want to delete this payment code? This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-2xl font-black text-[10px] tracking-[3px] uppercase italic transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteConfirmId)
                  setDeleteConfirmId(null)
                }}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-[10px] tracking-[3px] uppercase italic transition-colors shadow-lg shadow-rose-500/10 active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PayCode
