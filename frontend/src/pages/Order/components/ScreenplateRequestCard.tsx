import React from 'react'
import { motion } from 'framer-motion'
import { Layers, Clock, CheckCircle2, XCircle, Info } from 'lucide-react'

export interface ScreenplateRequest {
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

interface ScreenplateRequestCardProps {
  request: ScreenplateRequest
}

export const ScreenplateRequestCard: React.FC<ScreenplateRequestCardProps> = ({ request }) => {
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

  const config = getStatusConfig(request.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl md:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Product Image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 md:h-32 md:w-32">
          {request.product?.main_image ? (
            <img
              src={`/images/products/${request.product.main_image}`}
              alt={request.product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900">
                <Layers size={32} className="text-pixs-mint" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className={`rounded-full ${config.bgColor} px-3 py-1 text-[9px] font-black tracking-widest ${config.textColor} uppercase`}>
                  SCREENPLATE REQUEST
                </span>
                <span className="text-[10px] font-bold text-slate-300">
                  {request.id}
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic md:text-2xl">
                {request.product?.name || 'Custom Product'}
              </h3>
              <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {request.variant_id} · {request.alignment} · {request.color_count} Color{request.color_count > 1 ? 's' : ''}
              </p>
            </div>

            <div className={`flex items-center gap-2 rounded-full ${config.bgColor} px-4 py-2`}>
              {config.icon}
              <span className={`text-[10px] font-black tracking-widest ${config.textColor} uppercase italic`}>
                {config.label}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <p className="text-[8px] font-black tracking-widest text-slate-300 uppercase">
                  Created At
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  {new Date(request.created_at).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="h-8 w-px bg-slate-100" />
              <div className="space-y-1">
                <p className="text-[8px] font-black tracking-widest text-slate-300 uppercase">
                  Setup Fee
                </p>
                <p className="text-sm font-black text-slate-900 italic">
                  ₱{request.calculated_total.toLocaleString()}
                </p>
              </div>
            </div>

            {request.comment && (
              <div className="max-w-xs rounded-xl bg-slate-50 p-3 italic">
                <p className="text-[9px] font-medium text-slate-500">
                  "{request.comment}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
