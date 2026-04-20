import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import {
  formatPHP,
  mockRatingFromProductId,
} from '../../../types/homepage.types'
import type { IProduct } from '../../../types/product.types'
import StarRating from './StarRating'
import BoxFallback from '../../common/BoxFallback'

interface ProductCardProps {
  product: IProduct
  isFavorite: boolean
  toggleFavorite: (id: string) => void
}


const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  toggleFavorite,
}) => {
  const [imgError, setImgError] = useState(false)
  const navigate = useNavigate()
  const base = Number(product.base_price) || 0
  const minOrder = Number(product.min_order) || 1
  const minTotal = base * minOrder
  const rating = mockRatingFromProductId(product.id)
  const subtitle =
    product.best_for?.trim() ||
    product.short_description?.trim() ||
    product.category_label

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  const handleCardClick = () => {
    navigate(`/product/${encodeURIComponent(product.id)}`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      className={[
        'group flex h-full cursor-pointer flex-col',
        'rounded-2xl border border-slate-200/60 bg-white p-2',
        'overflow-hidden',
      ].join(' ')}
    >
      <div className="relative aspect-[16/11] overflow-hidden rounded-xl border border-slate-200/50">
        {product.main_image && !imgError ? (
          <img
            src={`/images/products/${product.main_image}`}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <BoxFallback />
        )}

        <button
          type="button"
          onClick={handleHeartClick}
          className={[
            'absolute top-3 right-3 z-10',
            'flex h-8 w-8 items-center justify-center',
            'rounded-lg border border-slate-200/60 bg-white/90',
            'active:scale-95',
          ].join(' ')}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={18}
            className={
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-200'
            }
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pt-3 pb-2.5">
        <div className="mb-3">
          <h3 className="truncate text-[11px] font-black tracking-tight text-slate-900 uppercase italic md:text-[15px]">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-1 font-[\'Barlow_Condensed\'] text-[9px] font-black tracking-widest text-slate-500 uppercase md:text-[10px]">
            {subtitle}
          </p>
        </div>

        <div className="mt-auto border-t border-slate-200/40 pt-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="block text-[9px] font-black text-rose-500 md:text-sm">
                Min: {formatPHP(minTotal)}
              </span>
              <p className="font-mono text-[10px] font-black tracking-tighter text-slate-900 italic md:text-lg">
                {formatPHP(base)}/pc
              </p>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black tracking-widest text-slate-300 uppercase md:text-[9px]">
                Min. order
              </span>
              <div className="font-mono text-[10px] text-slate-500 md:text-sm">
                {minOrder} pcs
              </div>
            </div>
          </div>
          <div className="mt-2">
            <StarRating rating={rating} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
