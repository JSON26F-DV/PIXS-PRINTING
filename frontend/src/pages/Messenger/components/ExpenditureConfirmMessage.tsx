import React, { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { clsx } from 'clsx'
import axiosInstance from '../../../lib/axiosInstance'

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
  const [expenditure, setExpenditure] = useState<Expenditure | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    axiosInstance.get(`/api/messages/expenditures/${expenditureId}`)
      .then(res => {
        if (mounted) {
          setExpenditure(res.data)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('Failed to fetch expenditure:', err)
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [expenditureId])

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
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
      </div>
    )
  }

  if (!expenditure) return <div className="p-4 text-[10px] uppercase font-black text-rose-500">Expenditure Data Corrupted or Deleted</div>

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
