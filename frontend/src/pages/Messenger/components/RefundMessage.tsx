import { User, Mail, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { clsx } from 'clsx'
import axiosInstance from '../../../lib/axiosInstance'
import { useCardCache } from '../hooks/useCardCache'
import MessageNotFound from './MessageNotFound'

interface Refund {
  id: string
  customer_id: string
  customer_first_name?: string
  customer_last_name?: string
  customer_email?: string
  employee_id?: string
  employee_first_name?: string
  employee_last_name?: string
  order_id?: string
  payment_code_id?: string
  amount: number
  message?: string
  status: 'pending' | 'completed' | 'cancelled'
  processed_at?: string
  created_at: string
}

interface RefundMessageProps {
  refundId: string
  isCustomer: boolean
}

export default function RefundMessage({ refundId, isCustomer }: RefundMessageProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: refund, loading, error } = useCardCache<Refund>(
    'refunds',
    refundId,
    () => axiosInstance.get(`/api/messages/refunds/${refundId}`).then(r => r.data),
  )

  const handleCardClick = () => {
    if (user?.role === 'admin') {
      navigate(`/admin/refund?search=${refundId}`)
    }
  }

  if (loading) {
    return (
      <div 
        className={clsx(
          "w-full max-w-sm h-[390px] rounded-[32px] border p-6",
          isCustomer ? "bg-slate-900 border-white/10" : "bg-white border-slate-100"
        )}
      >
        <div className="flex flex-col h-full justify-between animate-pulse">
          <div className="border-b border-slate-150 dark:border-white/10 pb-4 mb-4">
            <div className="h-3 w-20 bg-slate-700/30 rounded mb-2" />
            <div className="h-6 w-40 bg-slate-700/30 rounded mb-2" />
            <div className="h-2 w-32 bg-slate-700/30 rounded" />
          </div>
          <div className="space-y-4 flex-1">
            <div className="h-14 bg-slate-700/30 rounded-2xl" />
            <div className="h-16 bg-slate-700/30 rounded-2xl" />
            <div className="h-12 bg-slate-700/30 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !refund) {
    return <MessageNotFound messageType="refund" typeId={refundId} isCustomer={isCustomer} />
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          icon: <CheckCircle className="text-emerald-400 shrink-0" size={14} />,
          label: 'Completed'
        }
      case 'cancelled':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          icon: <XCircle className="text-rose-400 shrink-0" size={14} />,
          label: 'Cancelled'
        }
      default:
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          icon: <Clock className="text-amber-400 shrink-0" size={14} />,
          label: 'Pending'
        }
    }
  }

  const statusStyle = getStatusStyle(refund.status)

  return (
    <div 
      onClick={handleCardClick}
      className={clsx(
        "w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border transition-all p-6",
        user?.role === 'admin' && "cursor-pointer hover:border-emerald-400 hover:shadow-emerald-500/10",
        isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
      )}
    >
      {/* Header */}
      <div className="border-b border-slate-150 dark:border-white/10 pb-4 mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-3">
             <div className="h-0.5 w-8 bg-emerald-500" />
             <span className="text-[10px] font-black tracking-[4px] text-emerald-500 uppercase italic">Refund Slip</span>
          </div>
          <span className={clsx("rounded-full border px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm", statusStyle.bg)}>
            {statusStyle.icon}
            {statusStyle.label}
          </span>
        </div>
        <h3 className="text-xl font-black italic uppercase leading-none">Disbursement Detail</h3>
        <p className="mt-2 text-[9px] font-bold opacity-50 uppercase tracking-widest font-mono">Reference: {refund.id}</p>
      </div>

      {/* Body */}
      <div className="space-y-4">
        {/* Customer Information */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-2xl p-3 border border-slate-100 dark:border-white/5">
          <div className="h-8 w-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
            <User className="text-emerald-500" size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase leading-none mb-1">Recipient</p>
            <h4 className="text-[11px] font-black uppercase italic truncate">
              {refund.customer_first_name ? `${refund.customer_first_name} ${refund.customer_last_name}` : 'Unknown Recipient'}
            </h4>
            {refund.customer_email && (
              <p className="text-[9px] font-medium opacity-50 truncate flex items-center gap-1 mt-0.5">
                <Mail size={10} /> {refund.customer_email}
              </p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex justify-between items-center bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 p-4 rounded-2xl">
          <div className="flex flex-col">
            <span className="text-[8px] font-black tracking-widest uppercase text-emerald-500">Refund Amount</span>
            {refund.payment_code_id && (
              <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wide mt-1">
                Code: {refund.payment_code_id}
              </span>
            )}
          </div>
          <span className="text-2xl font-mono font-black italic text-emerald-500">₱{Number(refund.amount).toLocaleString()}</span>
        </div>

        {/* Reason / Admin Message */}
        <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase leading-none mb-2">Remarks</p>
          <p className="text-xs font-semibold leading-relaxed opacity-90">{refund.message || 'No additional remarks.'}</p>
        </div>

        {/* Metadata */}
        <div className="flex justify-between items-center text-[9px] font-bold opacity-50 uppercase tracking-widest pt-2 border-t border-slate-100 dark:border-white/5">
          <span>Processed By</span>
          <span className="font-black text-emerald-500">
            {refund.employee_first_name ? `Admin ${refund.employee_first_name}` : 'System Admin'}
          </span>
        </div>
      </div>
    </div>
  )
}
