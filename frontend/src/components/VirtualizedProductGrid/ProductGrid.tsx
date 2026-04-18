import React from 'react'
import type { IProduct } from '../../types/product.types'
import ProductCard from '../ProductCard/ProductCard'

interface ProductGridProps {
  products: IProduct[]
  isLoading: boolean
  soldMap: Record<string, number>
  favorites: string[]
  onFavClick: (id: string, e: React.MouseEvent) => void
  onProductClick: (id: string) => void
}
const ProductSkeleton = () => {
  return (
    <div className="aspect-square animate-pulse overflow-hidden rounded-[32px] border border-slate-100 bg-slate-50 md:rounded-[44px]" />
  )
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  soldMap,
  favorites,
  onFavClick,
  onProductClick,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:gap-10 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
          <LayoutGrid size={40} className="text-slate-200" />
        </div>
        <h3 className="mb-2 text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
          No Products Found
        </h3>
        <p className="font-body text-sm text-slate-400">
          Try adjusting your filters or search terms.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-10 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          soldCount={soldMap[product.id] ?? 0}
          isFav={favorites.includes(product.id)}
          onFavClick={(e) => onFavClick(product.id, e)}
          onClick={() => onProductClick(product.id)}
        />
      ))}
    </div>
  )
}

// Internal icon for empty state since I can't import everything easily above
import { LayoutGrid } from 'lucide-react'

export default React.memo(ProductGrid)
