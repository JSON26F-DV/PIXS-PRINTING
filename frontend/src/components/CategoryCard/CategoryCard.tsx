import React from 'react'
import { motion } from 'framer-motion'
import type { ICategory } from '../../types/product.types'
import CategoryImage from '../CategoryImage/CategoryImage'

interface CategoryCardProps {
  cat: ICategory
  onClick: () => void
}

const CategoryCard: React.FC<CategoryCardProps> = ({ cat, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ y: -8, scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="group relative aspect-[4/3] overflow-hidden rounded-[44px] border border-slate-100 bg-slate-100 shadow-2xl"
  >
    <div className="absolute inset-0">
      <CategoryImage src={cat.image} alt={cat.label} />
      <div className="group-hover:from-pixs-mint/80 absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent transition-all duration-700" />
    </div>
    <div className="absolute inset-0 flex flex-col items-start justify-end p-10 text-left">
      <span className="text-xl font-black tracking-tighter text-white uppercase italic drop-shadow-2xl">
        {cat.label}
      </span>
      <span className="mt-1 text-[9px] font-bold tracking-widest text-white/60 uppercase">
        {(cat.count ?? 0).toLocaleString()} Products
      </span>
    </div>
  </motion.button>
)

export default React.memo(CategoryCard)
