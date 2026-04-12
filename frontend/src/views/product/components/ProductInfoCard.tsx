import React from 'react'
import { MapPin, Printer, Info, Maximize, Activity } from 'lucide-react'
import type { IProduct, IProductVariant } from '../../../types/product.types'

interface ProductInfoCardProps {
  product: IProduct
  selectedVariant: IProductVariant | null
}

/**
 * Enterprise Product Logic Card.
 * Displays derived technical node specifications and item metadata.
 * Pattern: High-density layout with categorized informational nodes.
 */
const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  product,
  selectedVariant,
}) => {
  return (
    <div className="space-y-12 rounded-[44px] border border-slate-50 bg-white p-8 shadow-2xl shadow-slate-100 md:p-12">
      <div className="flex items-center gap-3">
        <div className="bg-pixs-mint/10 text-pixs-mint flex h-10 w-10 items-center justify-center rounded-2xl">
          <Info size={18} strokeWidth={3} />
        </div>
        <h3 className="text-sm font-black tracking-[4px] text-slate-900 uppercase italic">
          Technical Identification Node
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Core Attributes */}
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-[32px] border border-transparent bg-slate-50 p-6 transition-colors hover:border-slate-100">
            <Maximize className="mt-1 text-slate-400" size={18} />
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Dimensions
              </p>
              <p className="text-sm leading-none font-black text-slate-900">
                Rim: {selectedVariant?.width ?? 'Standard'} · Height:{' '}
                {selectedVariant?.height ?? 'Varies'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-[32px] border border-transparent bg-slate-50 p-6 transition-colors hover:border-slate-100">
            <MapPin className="mt-1 text-slate-400" size={18} />
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Strategic Fit
              </p>
              <p className="text-sm leading-tight font-black text-slate-900">
                Best for: {product.best_for}
              </p>
            </div>
          </div>
        </div>

        {/* Operational Attributes */}
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-[32px] border border-transparent bg-slate-50 p-6 transition-colors hover:border-slate-100">
            <Printer className="mt-1 text-slate-400" size={18} />
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Production Logic
              </p>
              <p className="text-sm leading-none font-black text-slate-900">
                Method: {product.print_method}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-[32px] border border-transparent bg-slate-50 p-6 transition-colors hover:border-slate-100">
            <Activity className="mt-1 text-slate-400" size={18} />
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Threshold Metadata
              </p>
              <p className="text-sm leading-none font-black text-slate-900">
                Min Order: {product.min_order.toLocaleString()} Units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Identity Block */}
      <div className="border-t border-slate-50 pt-8">
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-xl bg-slate-900 px-4 py-2 text-[9px] font-black tracking-widest text-white uppercase shadow-lg shadow-slate-900/10"
            >
              # {tag}
            </span>
          ))}
          <span className="bg-pixs-mint shadow-pixs-mint/10 rounded-xl px-4 py-2 text-[9px] font-black tracking-widest text-slate-900 uppercase shadow-lg">
            {product.category_label}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProductInfoCard
