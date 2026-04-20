import React from 'react'
import { Info } from 'lucide-react'
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
    <div className="mt-8 space-y-8 border-t border-slate-50 pt-8">
      <div className="flex items-center gap-3">
        <div className="bg-slate-50 text-slate-400 flex h-8 w-8 items-center justify-center rounded-xl">
          <Info size={14} strokeWidth={3} />
        </div>
        <h3 className="text-[10px] font-black tracking-[4px] text-slate-900 uppercase italic">
          Product Specifications
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {/* Core Attributes */}
        <div className="space-y-1">
          <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
            Dimensions
          </p>
          <p className="text-[11px] leading-tight font-black text-slate-900">
            {selectedVariant?.width} × {selectedVariant?.height}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
            Best For
          </p>
          <p className="text-[11px] leading-tight font-black text-slate-900">
            {product.best_for}
          </p>
        </div>

        {/* Operational Attributes */}
        <div className="space-y-1">
          <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
            Print Method
          </p>
          <p className="text-[11px] leading-tight font-black text-slate-900">
            {product.print_method}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
            Min Order
          </p>
          <p className="text-[11px] leading-tight font-black text-slate-900">
            {product.min_order?.toLocaleString()} Units
          </p>
        </div>
      </div>

      {/* Identity Block & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-slate-50 pt-8">
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-slate-900 px-3 py-1 text-[8px] font-black tracking-widest text-white uppercase shadow-sm"
            >
              # {tag}
            </span>
          ))}
          <span className="bg-pixs-mint rounded-lg px-3 py-1 text-[8px] font-black tracking-widest text-slate-900 uppercase shadow-sm">
            {product.category_label}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {product.total_sold !== undefined && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                Total Sold
              </span>
              <span className="text-xs font-black text-slate-900 italic">
                {product.total_sold.toLocaleString()}+ Units
              </span>
            </div>
          )}
          {product.ratings !== undefined && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                Product Hub Rating
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-slate-900 italic">
                  {product.ratings.toFixed(1)}
                </span>
                <span className="text-pixs-mint text-[10px]">★</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductInfoCard
