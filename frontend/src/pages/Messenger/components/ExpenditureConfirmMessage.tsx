import React from 'react'
import { FileText, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { clsx } from 'clsx'
import axiosInstance from '../../../lib/axiosInstance'
import { useCardCache } from '../hooks/useCardCache'

interface Expenditure {
  id: number
  category: string
  amount: number
  description?: string
  created_at: string
}

interface ExpenditureConfirmMessageProps {
  expenditureId: string | number
  isCustomer: boolean
}

const ExpenditureConfirmMessage: React.FC<ExpenditureConfirmMessageProps> = ({ expenditureId, isCustomer }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: expenditure, loading } = useCardCache<Expenditure>(
    'expenditures',
    expenditureId,
    () => axiosInstance.get(`/api/messages/expenditures/${expenditureId}`).then(r => r.data),
  )

  const handleCardClick = () => {
    if (!user || user.role === 'customer') return
    const base = user.role === 'staff' || user.role === 'technician'
      ? '/staff'
      : user.role === 'inventory'
        ? '/inventory'
        : '/admin'
    navigate(`${base}/stock?search=${expenditureId}`)
  }

  if (loading) {
    return (
      <div 
        className={clsx(
          "w-full max-w-sm h-[290px] rounded-[32px] border p-6",
          isCustomer ? "bg-slate-900 border-white/10" : "bg-white border-slate-100"
        )}
      >
        <div className="flex flex-col h-full justify-between animate-pulse">
          <div className="border-b border-white/10 pb-4 mb-4">
            <div className="h-3 w-20 bg-slate-700/30 rounded mb-2" />
            <div className="h-6 w-40 bg-slate-700/30 rounded mb-2" />
            <div className="h-2 w-32 bg-slate-700/30 rounded" />
          </div>
          <div className="space-y-4 flex-1">
            <div className="h-12 bg-slate-700/30 rounded-xl" />
            <div className="h-14 bg-slate-700/30 rounded-xl" />
            <div className="h-12 bg-slate-700/30 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!expenditure) {
    return (
      <div className={clsx(
        "w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border transition-all",
        isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
      )}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-0.5 w-8 bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-[4px] text-rose-500 uppercase italic">Operational Log</span>
            </div>
            <h3 className="text-xl font-black italic uppercase leading-none">Expenditure Removed</h3>
          </div>
          <div className="size-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <XCircle size={18} className="text-rose-500" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 italic">
            <p className="text-[10px] font-bold text-rose-400 leading-relaxed uppercase tracking-wider">
              Expenditure "{expenditureId}" is no longer available or has been removed.
            </p>
          </div>
          <p className="text-[9px] font-medium opacity-50 uppercase tracking-widest leading-relaxed">
            The expenditure record was deleted from the system. Please verify the log ID.
          </p>
        </div>
        <div className="px-6 py-4 bg-slate-900/20 border-t border-white/10 flex justify-between items-center text-[8px] font-black uppercase text-slate-400 tracking-wider">
          <span>Status: DELETED</span>
          <span className="opacity-30">ID: {expenditureId}</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      onClick={handleCardClick}
      className={clsx(
        "w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border transition-all p-6",
        user && user.role !== 'customer' && "cursor-pointer hover:border-amber-400 hover:shadow-amber-500/10",
        isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
      )}
    >
      {/* Header */}
      <div className="border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
           <div className="h-0.5 w-8 bg-amber-500" />
           <span className="text-[10px] font-black tracking-[4px] text-amber-500 uppercase italic">Operational Log</span>
        </div>
        <h3 className="text-xl font-black italic uppercase leading-none">Expenditure Concern</h3>
        <p className="mt-2 text-[9px] font-bold opacity-50 uppercase tracking-widest">Log ID: {expenditureId}</p>
      </div>

      {/* Body */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="text-amber-500" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-black uppercase italic truncate">{expenditure.category}</h4>
            <p className="text-[9px] font-bold opacity-50 uppercase mt-0.5">
              Logged on {new Date(expenditure.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
            </p>
          </div>
        </div>

        <div className="bg-slate-55 dark:bg-black/20 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
          <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase leading-none mb-2">Description</p>
          <p className="text-xs font-semibold leading-relaxed opacity-90">{expenditure.description || 'No description provided.'}</p>
        </div>

        <div className="flex justify-between items-center bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 p-4 rounded-2xl">
          <span className="text-[10px] font-black tracking-widest uppercase text-amber-500">Net Cost</span>
          <span className="text-lg font-mono font-black italic text-amber-500">₱{Number(expenditure.amount).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default ExpenditureConfirmMessage
