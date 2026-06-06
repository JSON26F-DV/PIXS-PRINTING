import { useState } from 'react'
import { Layers, Clock, CheckCircle2, XCircle, Info } from 'lucide-react'
import BoxFallback from '../../../components/common/BoxFallback'
import axiosInstance from '../../../lib/axiosInstance'
import { clsx } from 'clsx'
import { useCardCache } from '../hooks/useCardCache'
import MessageNotFound from './MessageNotFound'

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

export default function ScreenplateConfirmMessage({ requestId, isCustomer, onImageClick }: ScreenplateConfirmMessageProps) {
  const [refImageError, setRefImageError] = useState(false)

  const { data: rawRequest, loading, error } = useCardCache<ScreenplateRequest>(
    'screenplate',
    requestId,
    () => axiosInstance.get(`/api/messages/screenplate-requests/${requestId}`).then(r => {
      if (r.data && !r.data.notFound) return r.data
      return null
    }),
  )

  // notFound is stored as null in cache — treat same as no data
  const request = rawRequest ?? null

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
      <div 
        className={clsx(
          "w-full max-w-sm h-[580px] rounded-[32px] border",
          isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
        )}
      >
        <div className="flex flex-col h-full animate-pulse">
          <div className="p-6 border-b border-white/10">
            <div className="h-3 w-20 bg-slate-700/30 rounded mb-2" />
            <div className="h-6 w-40 bg-slate-700/30 rounded" />
          </div>
          <div className="px-6 py-4 border-b border-white/10">
            <div className="h-16 bg-slate-700/30 rounded-xl" />
          </div>
          <div className="p-6 flex-1">
            <div className="h-52 bg-slate-700/30 rounded-2xl" />
          </div>
          <div className="px-6 pb-6 space-y-4">
            <div className="h-10 bg-slate-700/30 rounded-2xl" />
            <div className="h-10 bg-slate-700/30 rounded-2xl" />
          </div>
          <div className="p-6 border-t border-white/10">
            <div className="h-12 bg-slate-700/30 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !request || !request.status || request.calculated_total === undefined) {
    return <MessageNotFound messageType="screenplate_request" typeId={requestId} isCustomer={isCustomer} />
  }

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
            <div className="size-16 rounded-xl bg-white border border-white/10 p-1 shrink-0">
                {request.product?.main_image ? (
                    <img src={`/images/products/${request.product.main_image}`} alt={request.product?.name || 'Product'} className="w-full h-full object-cover rounded-lg" />
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
      <div className="p-6">
        {request.reference_image && !refImageError ? (
            <div 
                className="group relative h-52 w-full rounded-2xl overflow-hidden cursor-pointer border border-white/10"
                onClick={() => {
                    const url = request.reference_image?.startsWith('data:') 
                        ? request.reference_image 
                        : (request.reference_image ? `/images/screenplate_request/${request.reference_image}` : '');
                    if (url) onImageClick(url);
                }}
            >
                <img 
                    src={request.reference_image?.startsWith('data:') ? request.reference_image : `/images/screenplate_request/${request.reference_image}`} 
                    alt="Screenplate reference design"
                    onError={() => setRefImageError(true)}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[9px] font-black uppercase text-white tracking-widest bg-slate-900/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">View Reference</span>
                </div>
            </div>
        ) : (
            <div className="h-52 w-full rounded-2xl overflow-hidden border border-white/10">
                <BoxFallback className="flex h-full w-full items-center justify-center bg-white/5" iconClassName="size-10 opacity-20" />
            </div>
        )}
      </div>

      {/* Comment / Alignment / Status */}
      <div className="px-6 pb-6 space-y-4 pt-4">
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
