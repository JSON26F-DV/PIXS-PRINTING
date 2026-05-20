import React, { useEffect, useState } from 'react'
import { Layers, Clock, CheckCircle2, XCircle, Info } from 'lucide-react'
import axiosInstance from '../../../lib/axiosInstance'
import { clsx } from 'clsx'

interface ScreenplateRequest {
  id: string
  product_id: string
  variant_id: string
  color_count: number
  alignment: string
  reference_image: string | null
  comment: string
  calculated_total: number
  status: 'Pending' | 'Approved' | 'Rejected'
  created_at: string
  product?: {
    name: string
    main_image: string
  }
}

interface ScreenplateConfirmMessageProps {
  requestId: string
  isCustomer: boolean
  onImageClick: (url: string) => void
}

const ScreenplateConfirmMessage: React.FC<ScreenplateConfirmMessageProps> = ({ requestId, isCustomer, onImageClick }) => {
  const [request, setRequest] = useState<ScreenplateRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    axiosInstance.get(`/api/customer/screenplate-requests`)
      .then(res => {
        if (mounted) {
          const found = res.data.find((r: ScreenplateRequest) => r.id === requestId)
          setRequest(found)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('Failed to fetch screenplate request:', err)
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [requestId])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending':
        return {
          icon: <Clock size={14} className="text-amber-500" />,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          label: 'PENDING SETUP'
        }
      case 'Approved':
        return {
          icon: <CheckCircle2 size={14} className="text-pixs-mint" />,
          bgColor: 'bg-pixs-mint/10',
          textColor: 'text-pixs-mint',
          label: 'APPROVED'
        }
      case 'Rejected':
        return {
          icon: <XCircle size={14} className="text-rose-500" />,
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-700',
          label: 'REJECTED'
        }
      default:
        return {
          icon: <Info size={14} className="text-slate-400" />,
          bgColor: 'bg-slate-50',
          textColor: 'text-slate-700',
          label: status.toUpperCase()
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
      </div>
    )
  }

  if (!request) return <div className="p-4 text-[10px] uppercase font-black text-rose-500">Request Data Not Found</div>

  const config = getStatusConfig(request.status)

  return (
    <div className={clsx(
      "w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border transition-all",
      isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
    )}>
      {/* Header / Title */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
           <div className="h-0.5 w-8 bg-pixs-mint" />
           <span className="text-[10px] font-black tracking-[4px] text-pixs-mint uppercase italic">Technical Node</span>
        </div>
        <h3 className="text-xl font-black italic uppercase leading-none">Screenplate Setup</h3>
      </div>

      {/* Screenplate For Section */}
      <div className="px-6 py-4 bg-white/5 border-b border-white/10">
        <p className="text-[9px] font-black uppercase text-pixs-mint tracking-[2px] mb-3">screenplate for :</p>
        <div className="flex gap-4 items-center">
            <div className="h-16 w-16 rounded-xl bg-white border border-white/10 p-1 shrink-0">
                {request.product?.main_image ? (
                    <img src={`/images/products/${request.product.main_image}`} className="w-full h-full object-cover rounded-lg" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg">
                        <Layers size={20} className="text-pixs-mint" />
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <h4 className="text-[11px] font-black uppercase italic truncate">{request.product?.name || 'Custom Product'}</h4>
                <p className="text-[9px] font-bold opacity-50 uppercase mt-1 tracking-widest truncate">
                  {request.product_id} x {request.variant_id} x {request.color_count} Color
                </p>
            </div>
        </div>
      </div>

      {/* Reference Image (Main Visual) */}
      {request.reference_image && (
        <div className="p-6">
            <div 
                className="group relative h-52 w-full rounded-2xl overflow-hidden cursor-pointer border border-white/10"
                onClick={() => onImageClick(request.reference_image!)}
            >
                <img 
                    src={request.reference_image} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">View Reference</span>
                </div>
            </div>
        </div>
      )}

      {/* Comment / Alignment / Status */}
      <div className="px-6 pb-6 space-y-4">
        {request.comment && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 italic">
                <p className="text-[10px] font-bold opacity-70 leading-relaxed">"{request.comment}"</p>
            </div>
        )}

        <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
                <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">Alignment</p>
                <p className="text-[12px] font-black italic uppercase">{request.alignment}</p>
            </div>
            
            <div className="text-right">
                <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">Status Protocol</p>
                <div className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-full inline-flex", config.bgColor)}>
                    {config.icon}
                    <span className={clsx("text-[9px] font-black uppercase italic", config.textColor)}>{config.label}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Footer Quote */}
      <div className="p-6 bg-slate-900/20 border-t border-white/10 flex justify-between items-end">
        <div>
            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Setup Quotation</p>
            <p className="text-2xl font-black italic text-pixs-mint leading-none">₱{request.calculated_total.toLocaleString()}</p>
        </div>
        <div className="text-right">
             <p className="text-[8px] font-black uppercase opacity-30 mb-1">ID: {requestId}</p>
        </div>
      </div>
    </div>
  )
}

export default ScreenplateConfirmMessage
