import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { Check, X, ImageIcon, Search, ArrowUpDown } from 'lucide-react'
import type { IScreenplateRequest } from './types'
import { updateScreenplateRequestStatus } from '../../../api/admin-screenplates.api'
import { Pagination } from './UIComponents'
import toast from 'react-hot-toast'

export function ScreenplateRequestSection({
  requests,
  onUpdateStatus,
}: {
  requests: IScreenplateRequest[]
  onUpdateStatus: (id: string, status: string) => void
}) {
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All')
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest')
  const [requestPage, setRequestPage] = useState(1)
  const REQUESTS_PER_PAGE = 12

  const filteredAndSortedRequests = useMemo(() => {
    let res = requests
    if (statusFilter !== 'All') {
      res = res.filter((req) => req.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      res = res.filter((req) => {
        return (
          (req.customer?.name || '').toLowerCase().includes(q) ||
          (req.customer?.company_name || '').toLowerCase().includes(q) ||
          (req.customer?.email || '').toLowerCase().includes(q) ||
          (req.product?.name || '').toLowerCase().includes(q) ||
          (req.alignment || '').toLowerCase().includes(q)
        )
      })
    }

    return [...res].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB
    })
  }, [requests, statusFilter, searchQuery, sortOrder])

  const paginatedRequests = filteredAndSortedRequests.slice(
    (requestPage - 1) * REQUESTS_PER_PAGE,
    requestPage * REQUESTS_PER_PAGE,
  )
  const totalRequestPages = Math.max(1, Math.ceil(filteredAndSortedRequests.length / REQUESTS_PER_PAGE))

  const handleApprove = async (req: IScreenplateRequest) => {
    try {
      await updateScreenplateRequestStatus(req.id, 'Approved')
      onUpdateStatus(req.id, 'Approved')
      toast.success('Request approved')
      
      const params = new URLSearchParams({
        request_id: req.id,
        customer_id: req.customer_id,
        product_id: req.product_id,
        variant_id: req.variant_id,
        color_count: req.color_count.toString(),
        alignment: req.alignment,
      })
      navigate(`/admin/screenplate/manage?${params.toString()}`)
    } catch {
      toast.error('Failed to approve request')
    }
  }

  const handleReject = async (req: IScreenplateRequest) => {
    try {
      await updateScreenplateRequestStatus(req.id, 'Rejected')
      onUpdateStatus(req.id, 'Rejected')
      toast.success('Request rejected')
    } catch {
      toast.error('Failed to reject request')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filtering Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setRequestPage(1) }}
            placeholder="Search requests by customer, product..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-slate-900"
          />
        </div>

        {/* Filters and Sorting Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Toggles */}
          <div className="flex items-center rounded-2xl bg-slate-100 p-1">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setRequestPage(1) }}
                className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value as 'latest' | 'oldest'); setRequestPage(1) }}
              className="bg-transparent text-[10px] font-black uppercase tracking-wider text-slate-700 outline-none cursor-pointer"
            >
              <option value="latest">LATEST</option>
              <option value="oldest">OLDEST</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Request Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAndSortedRequests.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-black tracking-widest uppercase">No requests found</p>
          </div>
        ) : (
          paginatedRequests.map((req) => (
            <m.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-xl shadow-slate-200/20"
            >
              <div className="relative aspect-video bg-slate-100">
                {req.reference_image ? (
                  <img
                    src={`/images/screenplate_request/${req.reference_image}`}
                    alt="Reference"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className="absolute top-4 right-4 rounded-full bg-black/50 px-3 py-1 backdrop-blur-md">
                  <span className="text-[9px] font-black tracking-widest text-white uppercase">
                    {req.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-4">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Customer
                  </p>
                  <p className="text-sm font-black text-slate-900 italic uppercase">
                    {req.customer?.name}
                  </p>
                  {req.customer?.company_name && (
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                      {req.customer.company_name}
                    </p>
                  )}
                  {req.customer?.email && (
                    <p className="text-[9px] font-medium text-slate-400 mt-0.5 lowercase">
                      {req.customer.email}
                    </p>
                  )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Product
                    </p>
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {req.product?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Variant
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {req.variant?.size}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Colors
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {req.color_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Alignment
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {req.alignment}
                    </p>
                  </div>
                </div>

                {req.status === 'Pending' && (
                  <div className="mt-auto flex gap-3">
                    <button
                      onClick={() => handleReject(req)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-[10px] font-black tracking-widest text-rose-500 uppercase transition-colors hover:bg-rose-50"
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(req)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-[10px] font-black tracking-widest text-[#75EEA5] uppercase transition-all hover:bg-slate-800"
                    >
                      <Check size={14} /> Approve
                    </button>
                  </div>
                )}
              </div>
            </m.div>
          ))
        )}
      </div>

      <Pagination
        currentPage={requestPage}
        totalPages={totalRequestPages}
        onPageChange={setRequestPage}
      />
    </div>
  )
}
