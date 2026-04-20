import React from 'react'
import type { ICategory } from '../../types/product.types'
import CategoryCard from '../customer/homepage/CategoryCard'
import { ArrowRight } from 'lucide-react'

interface QuickCategoryRowProps {
  categories: ICategory[]
  isLoading: boolean
  onCategoryClick: (id: string) => void
  onMoreClick: () => void
}

type ICategoryItem = (ICategory & { isMore: false }) | { id: string; label: string; isMore: true; image?: string | null; count?: number }

const CategorySkeleton = () => {
  return (
    <div className="h-40 w-full h-full animate-pulse overflow-hidden rounded-[20px] bg-slate-100 md:h-60 lg:h-72 lg:rounded-[40px]" />
  )
}

const QuickCategoryRow: React.FC<QuickCategoryRowProps> = ({
  categories,
  isLoading,
  onCategoryClick,
  onMoreClick,
}) => {
  const items = React.useMemo<ICategoryItem[]>(() => {
    const list: ICategoryItem[] = categories
      .slice(0, 4)
      .map((cat) => ({ ...cat, isMore: false }))
    list.push({ id: 'more', label: 'More', isMore: true })
    return list
  }, [categories])

  return (
    <div className="grid w-full auto-rows-fr grid-cols-2 gap-4 md:grid-cols-6 md:gap-8 min-[1251px]:flex min-[1251px]:items-stretch min-[1251px]:justify-between">
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`
                h-full
                ${i < 3 ? 'col-span-1 md:col-span-2' : ''}
                ${i === 3 ? 'col-span-1 md:col-span-3' : ''}
                ${i === 4 ? 'col-span-2 md:col-span-3' : ''}
                min-[1251px]:flex-1
              `}
            >
              <CategorySkeleton />
            </div>
          ))
        : items.map((item, index) => (
            <div
              key={item.id}
              className={`
                h-full cursor-pointer
                ${index < 3 ? 'col-span-1 md:col-span-2' : ''}
                ${index === 3 ? 'col-span-1 md:col-span-3' : ''}
                ${index === 4 ? 'col-span-2 md:col-span-3' : ''}
                min-[1251px]:flex-1
              `}
              onClick={
                item.isMore ? onMoreClick : () => onCategoryClick(item.id)
              }
            >
              {item.isMore ? (
                <>
                  <div className="hidden h-full md:block">
                    <CategoryCard category={item as ICategory} isMore />
                  </div>
                  {/* Mobile View All: Shorter height, spans 2 columns */}
                  <div className="flex h-16 items-center justify-center rounded-[20px] border border-slate-900 bg-slate-900 transition-all active:scale-[0.98] md:hidden">
                    <span className="text-pixs-mint flex items-center gap-2 text-sm font-black tracking-[2px] uppercase italic">
                      VIEW ALL <ArrowRight className="h-4 w-4 stroke-[3]" />
                    </span>
                  </div>
                </>
              ) : (
                <CategoryCard category={item as ICategory} />
              )}
            </div>
          ))}
    </div>
  )
}

export default React.memo(QuickCategoryRow)
