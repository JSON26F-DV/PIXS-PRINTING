import React from 'react'
import { ArrowRight } from 'lucide-react'
import type { ICategory } from '../../../types/product.types'

interface CategoryCardProps {
  category: ICategory
  isMore?: boolean
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isMore }) => {
  if (isMore) {
    return (
      <div className="hover:bg-pixs-mint hover:border-pixs-mint group relative flex h-full cursor-pointer flex-col items-center justify-center rounded-[20px] border border-slate-900 bg-slate-900 transition-all active:scale-[0.95] lg:rounded-[40px] min-h-[160px] md:min-h-[240px] lg:min-h-[288px]">
        <span className="text-pixs-mint flex items-center gap-2 text-lg font-black tracking-widest uppercase italic transition-colors group-hover:text-slate-900 sm:text-xl md:text-xl lg:text-2xl">
          VIEW ALL <ArrowRight className="h-5 w-5 stroke-[3] lg:h-6 lg:w-6" />
        </span>
      </div>
    )
  }

  return (
    <div
      className="group relative h-full cursor-pointer overflow-hidden rounded-[20px] lg:rounded-[40px] min-h-[160px] md:min-h-[240px] lg:min-h-[288px]"
      style={{
        backgroundImage: `url(${
          category.image ||
          'https://images.unsplash.com/photo-1562654501-a0ccc0af3ff1?q=80&w=1000&auto=format&fit=crop'
        })`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-4 text-center lg:bottom-6">
        <span className="px-4 text-[10px] font-black tracking-[4px] text-white uppercase drop-shadow-2xl md:text-xs">
          {category.label}
        </span>
      </div>
    </div>
  )
}

export default CategoryCard
