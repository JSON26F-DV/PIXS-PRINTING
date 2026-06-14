import React, { useMemo } from 'react'
import type { ICategory, IProduct } from '../../../types/product.types'
import type {
  HomepageProductFilters,
} from '../../../types/homepage.types'
import ProductCard from './ProductCard'
import FilterBar from './FilterBar'
import { Pagination } from './Pagination'

interface ProductGridProps {
  products: IProduct[]
  isLoading: boolean
  filters: HomepageProductFilters
  setFilters: React.Dispatch<React.SetStateAction<HomepageProductFilters>>
  categories: ICategory[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  favoriteIds: string[]
  onToggleFavorite: (id: string) => void
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  filters,
  setFilters,
  categories,
  page,
  totalPages,
  onPageChange,
  favoriteIds,
  onToggleFavorite,
}) => {
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const visibleProducts = useMemo(() => {
    if (!filters.favoritesOnly) return products
    return products.filter((p) => favoriteIdSet.has(p.id))
  }, [products, filters.favoritesOnly, favoriteIdSet])

  return (
    <div className="w-full">
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        categories={categories}
      />

      <div className="pb-16">
        {isLoading && (
          <p className="font-mono text-sm tracking-widest text-slate-400 uppercase">
            Loading catalog…
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIdSet.has(product.id)}
              toggleFavorite={onToggleFavorite}
            />
          ))}
        </div>

        {!isLoading && visibleProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-slate-200/70">
              <span className="text-[40px] leading-none text-slate-300">
                {'\u2301'}
              </span>
            </div>
            <p className="mb-2 font-[\'Bebas_Neue\'] text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
              No Products Found
            </p>
            <p className="font-[\'Barlow_Condensed\'] text-sm text-slate-400">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}

        {!filters.favoritesOnly && totalPages > 1 && (
          <div className="mt-12">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductGrid
