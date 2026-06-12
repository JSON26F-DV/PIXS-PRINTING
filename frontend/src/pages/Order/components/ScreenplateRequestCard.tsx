import React from 'react'
import { m } from 'framer-motion'
import { Layers, Clock, CheckCircle2, XCircle, Info, Calendar } from 'lucide-react'

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
    const iconClass = "h-5 w-5 sm:h-3.5 sm:w-3.5"
    switch (status) {
      case 'Pending':
        return {
          icon: <Clock className={`text-amber-500 ${iconClass}`} />,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          label: 'PENDING SETUP'
        }
      case 'Approved':
        return {
          icon: <CheckCircle2 className={`text-pixs-mint ${iconClass}`} />,
          bgColor: 'bg-pixs-mint/10',
          textColor: 'text-pixs-mint',
          label: 'APPROVED'
        }
      case 'Rejected':
        return {
          icon: <XCircle className={`text-rose-500 ${iconClass}`} />,
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-700',
          label: 'REJECTED'
        }
      default:
        return {
          icon: <Info className={`text-slate-400 ${iconClass}`} />,
          bgColor: 'bg-slate-50',
          textColor: 'text-slate-700',
          label: status.toUpperCase()
        }
    }
  }

  const config = getStatusConfig(request.status)

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl md:p-8"
    >
      {/* Card Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-50 pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="text-pixs-mint flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-200">
            <Layers size={24} />
          </div>
          <div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className={`w-fit rounded-full ${config.bgColor} px-2 py-0.5 text-[8px] font-black tracking-widest ${config.textColor} uppercase`}>
                SCREENPLATE REQUEST
              </span>
              <h3 className="text-sm font-black tracking-tighter text-slate-900 italic">
                ID: {request.id}
              </h3>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              <Calendar size={12} className="text-slate-300" />
              {new Date(request.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
        <div className="absolute top-6 right-6 sm:static">
          <div className={`flex items-center justify-center gap-2 rounded-2xl sm:rounded-full ${config.bgColor} p-2.5 sm:px-4 sm:py-2`}>
            {config.icon}
            <span className={`hidden sm:inline text-[10px] font-black tracking-widest ${config.textColor} uppercase italic`}>
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Product Card Details */}
      <article className="relative bg-white py-4 md:py-5">
        <div className="flex flex-row items-start gap-4">
          {/* Product Image */}
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 md:h-24 md:w-24">
            {request.product?.main_image ? (
              <img
                src={`/images/products/${request.product.main_image}`}
                alt={request.product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-900">
                <Layers size={24} className="text-pixs-mint" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            {/* Title & Variants */}
            <div>
              <h4 className="text-base font-black tracking-tight text-slate-900 uppercase italic md:text-lg">
                {request.product?.name || 'Custom Product'}
              </h4>
              <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase md:text-xs">
                {request.variant_id} · {request.alignment} · {request.color_count} Color{request.color_count > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* Footer Area */}
      <div className="flex flex-row items-center justify-between gap-4 border-t border-slate-50 pt-5 md:pt-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Action buttons can go here if needed, matching OrderCard layout */}
        </div>

        <div className="flex flex-col text-right">
          <span className="mb-0.5 text-[9px] font-black tracking-[2px] text-slate-400 uppercase italic md:mb-1 md:text-[10px] md:tracking-[3px]">
            Setup Fee
          </span>
          <span className="text-lg font-black tracking-tighter text-slate-900 italic md:text-xl">
            ₱{request.calculated_total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Comment Section */}
      {request.comment && (
        <div className="mt-4 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-1 text-[8px] font-black tracking-widest text-slate-300 uppercase">
            Comment
          </div>
          <p className="text-xs font-medium text-slate-600 italic">
            "{request.comment}"
          </p>
        </div>
      )}
    </m.div>
  )
}

