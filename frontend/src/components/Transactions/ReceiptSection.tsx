import React, { useState } from 'react'
import { ShoppingBag, Tag, Package } from 'lucide-react'
import BoxFallback from '../common/BoxFallback'

// ─── Sub-Component for Image Handling ────────────────────────────────────────
const ReceiptProductImage: React.FC<{ src: string; alt: string }> = ({
  src,
  alt,
}) => {
  const [imgError, setImgError] = useState(false)

  if (imgError || !src) {
    return (
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        <BoxFallback />
      </div>
    )
  }

  return (
    <img
      src={`/images/products/${src}`}
      className="h-16 w-16 rounded-xl object-cover transition-transform duration-700 group-hover:scale-110"
      alt={alt}
      onError={() => setImgError(true)}
    />
  )
}

interface CartItem {
  id: string
  productId: string
  productName: string
  productImage: string
  quantity: number
  variant: {
    unitPrice: number
    size: string
  }
  colors: {
    id: string
    name: string
    hex: string
    type: string
  }[]
  totalCartPrice?: number
}

interface ReceiptSectionProps {
  items: CartItem[]
  deliveryFee: number
  discountAmount?: number
}

const ReceiptSection: React.FC<ReceiptSectionProps> = ({
  items,
  deliveryFee,
  discountAmount = 0,
}) => {
  const cartItems = items

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.totalCartPrice ?? item.quantity * item.variant.unitPrice),
    0,
  )
  const total = subtotal + deliveryFee - discountAmount

  return (
    <div className="ReceiptSection space-y-8 rounded-[32px] border border-slate-100 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="text-pixs-mint flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-lg">
            <ShoppingBag size={20} />
          </div>
            <h2 className="text-xl leading-none font-black tracking-tighter text-slate-900 uppercase italic">
              Order Summary
            </h2>
            <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic opacity-80">
              PIXS CHECKOUT
            </p>
        </div>
        <span className="bg-pixs-mint rounded-full px-3 py-1 text-[9px] font-black tracking-widest text-slate-900 uppercase italic">
          Ready
        </span>
      </div>

      <div className="ReceiptItems custom-scrollbar max-h-[360px] space-y-4 overflow-y-auto pr-2">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="ReceiptItem group flex items-center gap-5 rounded-2xl p-3 transition-all hover:bg-slate-50"
          >
            <div className="relative shrink-0 overflow-hidden rounded-xl border border-slate-100 shadow-sm">
              <ReceiptProductImage
                src={item.productImage}
                alt={item.productName}
              />
              <div className="bg-slate-900 text-pixs-mint absolute top-0 right-0 rounded-bl-lg px-1.5 py-0.5 text-[8px] font-black">
                x{item.quantity}
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <h3 className="group-hover:text-pixs-mint text-xs font-black tracking-tight text-slate-900 uppercase italic transition-colors">
                {item.productName}
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <p className="mr-2 text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
                  {item.variant.size}
                </p>
                {item.colors.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-1 rounded-full border border-slate-100 bg-white px-1.5 py-0.5 shadow-sm">
                    <div 
                      className="h-1.5 w-1.5 rounded-full border border-slate-200" 
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[7px] font-black text-slate-500 uppercase">{color.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-slate-500 italic">
                  PHP {item.variant.unitPrice.toFixed(2)}/ea
                </span>
                <span className="text-xs font-black text-slate-900 italic">
                  PHP{' '}
                  {(item.totalCartPrice ?? (item.quantity * item.variant.unitPrice)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ReceiptSummary mt-4 space-y-4 border-t border-slate-100 pt-8">
        <div className="flex items-center justify-between text-[11px] font-black tracking-widest text-slate-400 uppercase italic">
          <span>Subtotal</span>
          <span className="text-slate-900">
            PHP {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] font-black tracking-widest text-slate-400 uppercase italic">
          <div className="flex items-center gap-2">
            <span>Shipping Fee</span>
            <Tag size={12} className="text-slate-300" />
          </div>
          <span
            className={`${deliveryFee === 0 ? 'text-amber-500' : 'text-slate-900'}`}
          >
            {deliveryFee === 0
              ? 'COLLECT'
              : `PHP ${deliveryFee.toFixed(2)}`}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="animate-in slide-in-from-right-2 flex items-center justify-between text-[11px] font-black tracking-widest text-emerald-500 uppercase italic">
            <div className="flex items-center gap-2">
              <span>Voucher Applied</span>
              <Tag size={12} className="text-emerald-300" />
            </div>
            <span className="font-black">
              - PHP {discountAmount.toLocaleString()}
            </span>
          </div>
        )}

        <div className="ReceiptTotal mt-6 flex flex-col items-center justify-center rounded-3xl border border-slate-100/50 bg-slate-50 p-6 shadow-inner">
          <p className="mb-2 text-[9px] font-black tracking-[6px] text-slate-400 uppercase italic">
            Total Amount
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-black text-slate-300 italic line-through">
              PHP {(total * 1.05).toFixed(0)}
            </span>
            <h3 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
              PHP {total.toLocaleString()}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[8px] font-black tracking-widest text-slate-900 uppercase italic opacity-80">
            <Package size={10} className="text-pixs-mint" />
            Secure transaction
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptSection
