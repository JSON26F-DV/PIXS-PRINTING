import { memo } from 'react'
import { Heart, Plus } from 'lucide-react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import type { ScrollPosition } from 'react-lazy-load-image-component'
import Skeleton from 'react-loading-skeleton'
import { clsx } from 'clsx'
import type { IProduct } from '../../types/product.types'
import 'react-loading-skeleton/dist/skeleton.css'
import 'react-lazy-load-image-component/src/effects/blur.css'

export interface ProductCardProps {
  product: IProduct
  soldCount: number
  isFavorite: boolean
  isLoggedIn: boolean
  onToggleFavorite: (id: string) => void
  onClick: (id: string) => void
  scrollPosition: ScrollPosition
}

const ProductCard = memo(function ProductCard({
  product,
  soldCount,
  isFavorite,
  isLoggedIn,
  onToggleFavorite,
  onClick,
  scrollPosition,
}: ProductCardProps) {
  return (
    <div
      onClick={() => onClick(product.id)}
      className="HomepageProductCard ProductCardWrapper group relative cursor-pointer rounded-[32px] border border-slate-100 bg-white p-2 transition-all hover:-translate-y-3 md:rounded-[44px] md:p-2.5"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px] border border-slate-50 bg-slate-50 shadow-inner transition-colors duration-500 group-hover:bg-white md:rounded-[36px]">
        <LazyLoadImage
          src={
            (product.gallery?.[0] && typeof product.gallery[0] === 'object' 
              ? (product.gallery[0] as { image_url: string }).image_url 
              : (product.gallery?.[0] as string)) || product.main_image || '/placeholder.png'
          }
          alt={product.name}
          effect="blur"
          scrollPosition={scrollPosition}
          wrapperClassName="w-full h-full"
          className="ProductCardImage h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
          placeholder={
            <div className="h-full w-full overflow-hidden rounded-[24px] md:rounded-[36px]">
              <Skeleton height="100%" borderRadius="36px" />
            </div>
          }
        />

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(product.id)
          }}
          className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-xl border border-white bg-white/90 shadow-lg backdrop-blur-xl transition-all md:top-6 md:right-6 md:h-12 md:w-12 md:rounded-[22px]"
        >
          <Heart
            size={20}
            className={clsx(
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-200',
            )}
          />
        </button>

        <div
          className={clsx(
            'absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[8px] font-black tracking-widest uppercase shadow-2xl md:bottom-6 md:left-6 md:gap-2.5 md:rounded-xl md:px-4 md:py-2 md:text-[9px]',
            product.current_stock > 50
              ? 'bg-slate-900 text-white'
              : 'bg-rose-500 text-white',
          )}
        >
          <div
            className={clsx(
              'h-1.5 w-1.5 animate-pulse rounded-full md:h-2 md:w-2',
              product.current_stock > 50 ? 'bg-pixs-mint' : 'bg-white',
            )}
          />
          {product.current_stock.toLocaleString()}{' '}
          <span className="hidden md:inline">Units Available</span>
        </div>
      </div>

      <div className="ProductCardContent p-3 pb-2 md:p-6 md:pb-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="ProductCardName group-hover:text-pixs-mint flex-1 truncate text-[11px] leading-tight font-black tracking-tight text-slate-900 uppercase italic transition-colors md:text-lg">
            {product.name}
          </h4>
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[8px] font-black text-slate-400 md:text-[9px]">
            {soldCount.toLocaleString()}+ sold
          </span>
        </div>

        <p className="ProductCardShortDescription mb-4 line-clamp-2 text-[8px] font-bold tracking-widest text-slate-300 uppercase italic opacity-60 md:text-[9px]">
          {product.short_description}
        </p>

        {product.tags && product.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1 mb-3">
            {product.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
          <div className="flex flex-col">
            {isLoggedIn ? (
              <>
                <span className="text-[9px] font-black tracking-tighter text-rose-500 md:text-sm">
                  Min: ₱
                  {(
                    (product.base_price || 0) * (product.min_order || 1)
                  ).toLocaleString()}
                </span>
                <span className="font-mono text-[10px] leading-none font-black tracking-tighter text-slate-900 italic md:text-lg">
                  ₱{product.base_price.toLocaleString()}/pc
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
          <button className="hover:bg-pixs-mint hover:border-pixs-mint flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-900 shadow-lg transition-all group-hover:rotate-12 active:scale-95 md:h-12 md:w-12 md:rounded-2xl">
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )
})

export default ProductCard
