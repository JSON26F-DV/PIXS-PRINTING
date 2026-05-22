import React, { useState, useEffect } from 'react'
import { Ticket, Tag, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import axiosInstance from '../../../lib/axiosInstance'

export interface IDiscountItem {
  id: string
  customer_id: string | null
  product_id: string | null
  variant_id: string | null
  code: string
  type: 'fixed' | 'percentage'
  value: number
  min_spend: number
  already_used: boolean
  expires_at: string | null
  product?: { name: string } | null
  variant?: { size: string | null; width: string | null; height: string | null } | null
}

interface DiscountCartItem {
  productId: string
  variant: { id: string }
  totalCartPrice?: number
}

interface DiscountProps {
  selectedId: string | null
  onSelect: (discount: IDiscountItem | null) => void
  cartItems: DiscountCartItem[]
}

const Discount: React.FC<DiscountProps> = ({ selectedId, onSelect, cartItems }) => {
  const [discounts, setDiscounts] = useState<IDiscountItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const res = await axiosInstance.get('/api/customer/discounts/mine')
        setDiscounts(res.data.data ?? [])
      } catch {
        setDiscounts([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchDiscounts()
  }, [])

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const isApplicable = (d: IDiscountItem) => {
    if (d.product_id || d.variant_id) {
      const matches = cartItems.filter((i) => {
        if (d.variant_id) return i.variant.id === d.variant_id
        return i.productId === d.product_id
      })
      if (matches.length === 0) return false
      const subtotal = matches.reduce((acc, i) => acc + (i.totalCartPrice ?? 0), 0)
      if (d.min_spend > 0 && subtotal < d.min_spend) return false
      return true
    }
    const subtotal = cartItems.reduce((acc, i) => acc + (i.totalCartPrice ?? 0), 0)
    if (d.min_spend > 0 && subtotal < d.min_spend) return false
    return true
  }

  if (isLoading) {
    return (
      <section className="DiscountSection space-y-4">
        <div className="flex items-center gap-2">
          <Ticket size={18} className="text-pixs-mint" />
          <h1 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
            Pixs Shop Discount
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-pixs-mint animate-spin" />
        </div>
      </section>
    )
  }

  return (
    <section className="DiscountSection space-y-4">
      <div className="flex items-center gap-2">
        <Ticket size={18} className="text-pixs-mint" />
        <h1 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
          Pixs Shop Discount
        </h1>
      </div>

      {discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-100 py-12 text-center opacity-50">
          <Tag size={40} className="mb-3 text-slate-300" />
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            No discounts available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {discounts.map((d) => {
            const expired = isExpired(d.expires_at) || d.already_used
            const applicable = isApplicable(d)
            const disabled = expired || !applicable
            return (
              <div
                key={d.id}
                onClick={() => !disabled && onSelect(selectedId === d.id ? null : d)}
                className={`DiscountCard group relative rounded-2xl border p-4 transition-all active:scale-[0.98] ${
                  disabled
                    ? 'cursor-not-allowed border-slate-100 bg-slate-50/30 opacity-50'
                    : 'cursor-pointer'
                } ${
                  !disabled && selectedId === d.id
                    ? 'border-pixs-mint bg-white shadow-lg'
                    : !disabled
                      ? 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                      : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`DiscountRadio mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      disabled
                        ? 'border-slate-200'
                        : selectedId === d.id
                          ? 'border-pixs-mint'
                          : 'border-slate-200'
                    }`}
                  >
                    {selectedId === d.id && !disabled && (
                      <div className="bg-pixs-mint h-2.5 w-2.5 rounded-full" />
                    )}
                  </div>

                  <div className="flex flex-1 items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-900 uppercase italic">
                        <Tag size={14} className="text-slate-400" />
                        {d.code || d.id}
                      </div>
                      <p className="text-xs font-bold text-slate-500">
                        {d.type === 'percentage'
                          ? `${d.value}% OFF`
                          : `₱${Number(d.value).toLocaleString()} OFF`}
                        {d.min_spend > 0 &&
                          ` • Min. spend ₱${Number(d.min_spend).toLocaleString()}`}
                      </p>
                      {d.expires_at && (
                        <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Clock size={10} />
                          Expires {new Date(d.expires_at).toLocaleDateString()}
                        </p>
                      )}
                      {d.variant_id && d.variant ? (
                        <p className="text-[9px] font-bold text-slate-400">
                          For: {d.product?.name ?? d.product_id}
                          {d.variant.size && ` • ${d.variant.size}`}
                          {d.variant.width && ` (${d.variant.width}×${d.variant.height})`}
                        </p>
                      ) : d.product_id && d.product ? (
                        <p className="text-[9px] font-bold text-slate-400">
                          For: {d.product.name}
                        </p>
                      ) : !d.product_id && !d.variant_id ? (
                        <p className="text-[9px] font-bold text-emerald-600">
                          All Items
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0">
                      {expired ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[9px] font-black tracking-widest text-rose-500 uppercase">
                          <XCircle size={11} />
                          {d.already_used ? 'Used' : 'Expired'}
                        </span>
                      ) : !applicable ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                          <XCircle size={11} />
                          Not Applicable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black tracking-widest text-emerald-500 uppercase">
                          <CheckCircle2 size={11} />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Discount
