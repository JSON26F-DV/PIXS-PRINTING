import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from 'lucide-react'
import SplitText from '../../components/animations/SplitText'

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ')

const ISSUE_TYPES = [
  'Defective Print',
  'Missing Item',
  'Wrong Design',
  'Color Mismatch',
  'Damaged Delivery',
  'Other',
] as const
type IssueType = (typeof ISSUE_TYPES)[number]
type DisputeStatus = 'Pending' | 'Resolved' | 'Re-print' | 'Refunded'

interface Dispute {
  id: string
  order_id: string
  customer: string
  issue_type: IssueType | string
  description: string
  photo_evidence: string
  reported_at: string
  status: DisputeStatus | string
  resolution: string | null
}

const DisputeView: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [newTicket, setNewTicket] = useState<{
    order_id: string
    customer: string
    issue_type: IssueType
    description: string
    photo_evidence: string
  }>({
    order_id: '',
    customer: '',
    issue_type: 'Defective Print',
    description: '',
    photo_evidence: '',
  })

  const handleStatusChange = (disputeId: string, newStatus: DisputeStatus) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, status: newStatus } : d)),
    )
  }

  const handleCreateTicket = () => {
    if (!newTicket.order_id || !newTicket.description) return

    const ticket: Dispute = {
      id: `DSP-${String(disputes.length + 1).padStart(3, '0')}`,
      ...newTicket,
      reported_at: new Date().toISOString(),
      status: 'Pending',
      resolution: null,
    }

    setDisputes([ticket, ...disputes])
    setShowNewTicket(false)
    setNewTicket({
      order_id: '',
      customer: '',
      issue_type: 'Defective Print',
      description: '',
      photo_evidence: '',
    })
  }

  const pendingCount = disputes.filter((d) => d.status === 'Pending').length
  const resolvedCount = disputes.filter((d) => d.status === 'Resolved').length
  const reprintCount = disputes.filter((d) => d.status === 'Re-print').length

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <section className="flex items-center justify-between">
        <div>
          <SplitText
            text="DISPUTE_RESOLUTION_CENTER"
            className="font-mono text-2xl font-bold text-slate-900"
          />
          <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Complaint tracking & ticket management
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewTicket(true)}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="h-3 w-3" />
            NEW_TICKET
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="fuzzy-overlay relative overflow-hidden border border-slate-200 bg-white p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="h-12 w-12 text-rose-500" />
          </div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Complaints Open
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-rose-500">
              {pendingCount}
            </span>
            <span className="font-mono text-sm text-slate-400">tickets</span>
          </div>
        </div>

        <div className="fuzzy-overlay relative overflow-hidden border border-slate-200 bg-white p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText className="h-12 w-12 text-amber-500" />
          </div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Re-print Orders
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-amber-500">
              {reprintCount}
            </span>
            <span className="font-mono text-sm text-slate-400">tickets</span>
          </div>
        </div>

        <div className="fuzzy-overlay relative overflow-hidden border border-slate-200 bg-white p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
          <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Resolved
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-emerald-500">
              {resolvedCount}
            </span>
            <span className="font-mono text-sm text-slate-400">tickets</span>
          </div>
        </div>
      </div>

      {showNewTicket && (
        <div className="overflow-hidden border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Create New Ticket
            </h3>
            <button
              onClick={() => setShowNewTicket(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Order ID
                </label>
                <input
                  type="text"
                  value={newTicket.order_id}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, order_id: e.target.value })
                  }
                  placeholder="ORD-XXXX"
                  className="focus:border-pixs-mint w-full border border-slate-200 px-3 py-2 font-mono text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Customer
                </label>
                <input
                  type="text"
                  value={newTicket.customer}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, customer: e.target.value })
                  }
                  placeholder="Customer name"
                  className="focus:border-pixs-mint w-full border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Issue Type
              </label>
              <select
                value={newTicket.issue_type}
                onChange={(e) =>
                  setNewTicket({
                    ...newTicket,
                    issue_type: e.target.value as IssueType,
                  })
                }
                className="focus:border-pixs-mint w-full border border-slate-200 px-3 py-2 text-sm focus:outline-none"
              >
                {ISSUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Description
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, description: e.target.value })
                }
                placeholder="Describe the issue in detail..."
                rows={3}
                className="focus:border-pixs-mint w-full resize-none border border-slate-200 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Photo Evidence URL
              </label>
              <input
                type="text"
                value={newTicket.photo_evidence}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, photo_evidence: e.target.value })
                }
                placeholder="https://..."
                className="focus:border-pixs-mint w-full border border-slate-200 px-3 py-2 font-mono text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={handleCreateTicket}
              disabled={!newTicket.order_id || !newTicket.description}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              CREATE_TICKET
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <FileText className="h-4 w-4" />
              DISPUTE_TICKETS
            </div>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            {disputes.length} total tickets
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="transition-colors">
              <div
                className={cn(
                  'cursor-pointer p-4 transition-colors hover:bg-slate-50/50',
                  dispute.status === 'Pending' && 'bg-rose-50/20',
                )}
                onClick={() =>
                  setExpandedId(expandedId === dispute.id ? null : dispute.id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-bold uppercase',
                        dispute.status === 'Pending'
                          ? 'bg-rose-500 text-white'
                          : dispute.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {dispute.status}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {dispute.id}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {dispute.order_id}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {dispute.customer}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-bold uppercase',
                        dispute.issue_type === 'Defective Print'
                          ? 'bg-purple-100 text-purple-700'
                          : dispute.issue_type === 'Missing Item'
                            ? 'bg-red-100 text-red-700'
                            : dispute.issue_type === 'Wrong Design'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {dispute.issue_type}
                    </span>
                    {expandedId === dispute.id ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedId === dispute.id && (
                <div className="bg-slate-50/30 px-4 pb-4">
                  <div className="space-y-4 border-l-2 border-slate-200 pl-4">
                    <div>
                      <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Description
                      </p>
                      <p className="text-sm text-slate-700">
                        {dispute.description}
                      </p>
                    </div>

                    {dispute.photo_evidence && (
                      <div>
                        <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                          Photo Evidence
                        </p>
                        <img
                          src={dispute.photo_evidence}
                          alt="Evidence"
                          className="h-36 w-48 border border-slate-200 object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      Reported: {new Date(dispute.reported_at).toLocaleString()}
                    </div>

                    {dispute.resolution && (
                      <div className="border border-emerald-100 bg-emerald-50 p-3">
                        <p className="mb-1 text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                          Resolution
                        </p>
                        <p className="text-sm text-emerald-700">
                          {dispute.resolution}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 border-t border-slate-200 pt-2">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Update Status:
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(dispute.id, 'Resolved')
                        }}
                        className="bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 transition-colors hover:bg-emerald-200"
                      >
                        RESOLVED
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(dispute.id, 'Re-print')
                        }}
                        className="bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700 transition-colors hover:bg-amber-200"
                      >
                        RE-PRINT
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(dispute.id, 'Refunded')
                        }}
                        className="bg-purple-100 px-2 py-1 text-[10px] font-bold text-purple-700 transition-colors hover:bg-purple-200"
                      >
                        REFUNDED
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {disputes.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p className="text-sm font-bold">No dispute tickets</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default DisputeView
