import React, { useState } from 'react'
import { ChevronDown, Heart } from 'lucide-react'
import type { ICategory } from '../../../types/product.types'
import type {
  HomepageProductFilters,
} from '../../../types/homepage.types'

interface FilterBarProps {
  filters: HomepageProductFilters
  setFilters: React.Dispatch<React.SetStateAction<HomepageProductFilters>>
  categories: ICategory[]
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  categories,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id)
  }

  const updateFilters = <K extends keyof HomepageProductFilters>(
    key: K,
    value: HomepageProductFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setActiveDropdown(null)
  }

  return (
    <div className="mb-8 w-full">
      <div className="grid grid-cols-2 items-center gap-x-10 gap-y-3 md:grid-cols-4">
        <button
          type="button"
          onClick={() => updateFilters('favoritesOnly', !filters.favoritesOnly)}
          className={[
            'inline-flex items-center justify-start gap-2',
            'text-[11px] font-black tracking-[0.22em] uppercase italic md:text-xs',
            'text-slate-500 transition-colors hover:text-slate-900',
            filters.favoritesOnly ? 'text-slate-900' : '',
          ].join(' ')}
        >
          <Heart
            size={14}
            fill={filters.favoritesOnly ? 'currentColor' : 'none'}
            className={
              filters.favoritesOnly ? 'text-pixs-mint' : 'text-slate-400'
            }
          />
          FAVORITES
        </button>

        <button
          type="button"
          onClick={() => toggleDropdown('category')}
          className={[
            'inline-flex items-center justify-between gap-2 md:justify-start',
            'text-[11px] font-black tracking-[0.22em] uppercase italic md:text-xs',
            'text-slate-500 transition-colors hover:text-slate-900',
            filters.category !== 'ALL' ? 'text-slate-900' : '',
          ].join(' ')}
        >
          {filters.category === 'ALL'
            ? 'DIVISIONS'
            : categories.find((c) => c.id === filters.category)?.label}
          <ChevronDown
            size={14}
            className={[
              'transition-transform duration-200 ease-in-out',
              activeDropdown === 'category' ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>

        <button
          type="button"
          onClick={() => toggleDropdown('price')}
          className={[
            'inline-flex items-center justify-between gap-2 md:justify-start',
            'text-[11px] font-black tracking-[0.22em] uppercase italic md:text-xs',
            'text-slate-500 transition-colors hover:text-slate-900',
          ].join(' ')}
        >
          SORT PROTOCOL
          <ChevronDown
            size={14}
            className={[
              'transition-transform duration-200 ease-in-out',
              activeDropdown === 'price' ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>

        <button
          type="button"
          onClick={() =>
            updateFilters(
              'availability',
              filters.availability === 'IN_STOCK' ? 'ALL' : 'IN_STOCK',
            )
          }
          className={[
            'inline-flex items-center justify-start gap-2',
            'text-[11px] font-black tracking-[0.22em] uppercase italic md:text-xs',
            'text-slate-500 transition-colors hover:text-slate-900',
            filters.availability === 'IN_STOCK' ? 'text-slate-900' : '',
          ].join(' ')}
        >
          {filters.availability === 'IN_STOCK'
            ? 'SUPPLY: ACTIVE'
            : 'SUPPLY: ALL'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-10 md:grid-cols-4">
        {activeDropdown === 'category' && (
          <div className="filter-inline-drop col-span-2 md:col-span-1">
            <div className="max-h-64 overflow-y-auto pr-2">
              <div className="grid gap-1">
                <button
                  type="button"
                  onClick={() => updateFilters('category', 'ALL')}
                  className={[
                    'py-1.5 text-left',
                    'text-[10px] font-black tracking-widest uppercase',
                    filters.category === 'ALL'
                      ? 'text-slate-900'
                      : 'text-slate-500',
                    'transition-colors hover:text-slate-900',
                  ].join(' ')}
                >
                  ALL DIVISIONS
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateFilters('category', cat.id)}
                    className={[
                      'py-1.5 text-left',
                      'text-[10px] font-black tracking-widest uppercase',
                      filters.category === cat.id
                        ? 'text-slate-900'
                        : 'text-slate-500',
                      'transition-colors hover:text-slate-900',
                    ].join(' ')}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeDropdown === 'price' && (
          <div className="filter-inline-drop col-span-2 md:col-span-1 md:col-start-3">
            <div className="grid gap-1">
              <button
                type="button"
                onClick={() => updateFilters('priceSort', 'LOW_TO_HIGH')}
                className={[
                  'py-1.5 text-left',
                  'text-[10px] font-black tracking-widest uppercase',
                  filters.priceSort === 'LOW_TO_HIGH'
                    ? 'text-slate-900'
                    : 'text-slate-500',
                  'transition-colors hover:text-slate-900',
                ].join(' ')}
              >
                PRICE LOW → HIGH
              </button>
              <button
                type="button"
                onClick={() => updateFilters('priceSort', 'HIGH_TO_LOW')}
                className={[
                  'py-1.5 text-left',
                  'text-[10px] font-black tracking-widest uppercase',
                  filters.priceSort === 'HIGH_TO_LOW'
                    ? 'text-slate-900'
                    : 'text-slate-500',
                  'transition-colors hover:text-slate-900',
                ].join(' ')}
              >
                PRICE HIGH → LOW
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterBar
