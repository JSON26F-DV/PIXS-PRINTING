import React, { useMemo } from 'react'
import { Heart, Plus } from 'lucide-react'
import { m } from 'framer-motion'
import { clsx } from 'clsx'
import type { IProduct } from '../../types/product.types'
import { useAuth } from '../../context/AuthContext'

import ProductImage from '../ProductImage/ProductImage'
import StarRating from '../customer/homepage/StarRating'

interface ProductCardProps {
  product: IProduct
  soldCount: number
  isFav: boolean
  onFavClick: (e: React.MouseEvent) => void
  onClick: () => void
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  soldCount,
  isFav,
  onFavClick,
  onClick,
}) => {
  const { user } = useAuth()
  
    // Aggregate stock intelligently across all internal variants natively to represent accurately
  const totalStock = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)
    }
    return product.is_in_stock ? 1000 : 0
  }, [product.variants, product.is_in_stock])

  const isOutOfStock = !product.is_in_stock
  const isLoggedIn = user?.isLoggedIn

  const imageSrc = useMemo(() => {
    if (!product.main_image) return null
    if (
      product.main_image.startsWith('http') ||
      product.main_image.startsWith('data:')
    ) {
      return product.main_image
    }
    // Assumes local names in public/images/products/ (e.g., "cup-1")
    return `/images/products/${product.main_image}`
  }, [product.main_image])

  const handleCardClick = () => {
    if (!isOutOfStock) {
      onClick()
    }
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      onClick={handleCardClick}
      className={clsx(
        'HomepageProductCard ProductCardWrapper group relative rounded-[32px] border border-slate-100 bg-white p-2 transition-all md:rounded-[44px] md:p-2.5',
        isOutOfStock ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      )}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px] border border-slate-50 bg-slate-50 shadow-inner transition-colors duration-500 group-hover:bg-white md:rounded-[36px]">
        <div
          className={clsx(
            'h-full w-full transition-all duration-700',
            isOutOfStock && 'opacity-50 grayscale',
          )}
        >
          <ProductImage
            src={imageSrc}
            alt={product.name}
            className="transition-transform duration-1000"
            skeletonClassName="rounded-[24px] md:rounded-[36px]"
          />
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
            <div className="rounded-2xl bg-slate-900 px-6 py-3 shadow-2xl">
              <span className="text-[10px] font-black tracking-[4px] text-white uppercase italic">
                Sold Out
              </span>
            </div>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            if (!isOutOfStock) onFavClick(e)
          }}
          className={clsx(
            'absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-xl border border-white bg-white/90 shadow-lg backdrop-blur-xl transition-all md:top-6 md:right-6 md:h-12 md:w-12 md:rounded-[22px]',
            isOutOfStock && 'opacity-50 grayscale',
          )}
        >
          <Heart
            size={20}
            strokeWidth={2.5}
            className={clsx(
              isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400',
            )}
          />
        </button>

        <div
          className={clsx(
            'absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[8px] font-black tracking-widest uppercase shadow-2xl md:bottom-6 md:left-6 md:gap-2.5 md:rounded-xl md:px-4 md:py-2 md:text-[9px]',
            isOutOfStock
              ? 'bg-slate-400 text-white'
              : totalStock > 50
                ? 'bg-slate-900 text-white'
                : 'bg-rose-500 text-white',
          )}
        >
          <div
            className={clsx(
              'h-1.5 w-1.5 animate-pulse rounded-full md:h-2 md:w-2',
              isOutOfStock
                ? 'bg-white/50'
                : totalStock > 50
                  ? 'bg-pixs-mint'
                  : 'bg-white',
            )}
          />
          {totalStock.toLocaleString()}{' '}
          <span className="hidden md:inline">
            {isOutOfStock ? 'Units Remaining' : 'Units Available'}
          </span>
        </div>
      </div>

      <div className="ProductCardContent p-3 pb-2 md:p-6 md:pb-4">
        <div className="mb-2 flex items-center justify-between">
          <h4
            className={clsx(
              'ProductCardName flex-1 truncate text-[11px] leading-tight font-black tracking-tight uppercase italic transition-colors md:text-lg',
              isOutOfStock
                ? 'text-slate-400'
                : 'group-hover:text-pixs-mint text-slate-900',
            )}
          >
            {product.name}
          </h4>
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[8px] font-black text-slate-400 md:text-[9px]">
            {(product.total_sold ?? soldCount).toLocaleString()}+ sold
          </span>
        </div>

        <div className={clsx('mb-4', isOutOfStock && 'opacity-50 grayscale')}>
          <StarRating rating={product.ratings ?? 0} />
        </div>

        <p
          className={clsx(
            'ProductCardShortDescription mb-4 line-clamp-2 text-[8px] font-bold tracking-widest uppercase italic md:text-[9px]',
            isOutOfStock ? 'text-slate-300/40' : 'text-slate-300 opacity-60',
          )}
        >
          {product.short_description}
        </p>

        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
          <div className="flex flex-col">
            {isLoggedIn ? (
              <>
                <span
                  className={clsx(
                    'text-[9px] font-black tracking-tighter md:text-sm',
                    isOutOfStock ? 'text-slate-300' : 'text-rose-500',
                  )}
                >
                  Min: ₱
                  {(
                    (product.base_price || 0) * (product.min_order || 1)
                  ).toLocaleString()}
                </span>
                <span
                  className={clsx(
                    'font-mono text-[10px] leading-none font-black tracking-tighter italic md:text-lg',
                    isOutOfStock ? 'text-slate-400' : 'text-slate-900',
                  )}
                >
                  ₱{(product.base_price ?? 0).toLocaleString()}/pc
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-slate-200" />
                <span className="text-[8px] font-black tracking-widest text-slate-300 uppercase">
                  Locked Rate
                </span>
              </div>
            )}
          </div>
          <button
            disabled={isOutOfStock}
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-xl border shadow-lg transition-all md:h-12 md:w-12 md:rounded-2xl',
              isOutOfStock
                ? 'border-slate-50 bg-slate-50 text-slate-200'
                : 'hover:bg-pixs-mint hover:border-pixs-mint border-slate-100 bg-slate-50 text-slate-900 group-hover:rotate-12 active:scale-95',
            )}
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </m.div>
  )
}

export default React.memo(ProductCard)
