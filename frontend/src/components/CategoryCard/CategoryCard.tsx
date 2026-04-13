import React from 'react';
import { motion } from 'framer-motion';
import type { ICategory } from '../../types/product.types';

interface CategoryCardProps {
  cat: ICategory;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ cat, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ y: -8, scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="group relative aspect-[4/3] overflow-hidden rounded-[44px] border border-slate-100 bg-slate-100 shadow-2xl"
  >
    <div className="absolute inset-0">
      <img
        src={cat.image}
        alt={cat.label}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/assets/fallback-logo.png'
        }}
        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-3"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent transition-all duration-700 group-hover:from-pixs-mint/80" />
    </div>
    <div className="absolute inset-0 flex flex-col items-start justify-end p-10 text-left">
      <span className="text-xl font-black tracking-tighter text-white uppercase italic drop-shadow-2xl">
        {cat.label}
      </span>
      <span className="text-[9px] font-bold tracking-widest text-white/60 uppercase mt-1">
        {(cat.count ?? 0).toLocaleString()} Products
      </span>
    </div>
  </motion.button>
);

export default React.memo(CategoryCard);
