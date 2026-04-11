import { memo } from 'react';
import { motion } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import type { ScrollPosition } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import type { ICategory } from '../../types/product.types';

export interface CategoryCardProps {
  category: ICategory;
  onClick: (id: string) => void;
  scrollPosition: ScrollPosition;
}

const CategoryCard = memo(function CategoryCard({ category, onClick, scrollPosition }: CategoryCardProps) {
  return (
    <motion.button
      onClick={() => onClick(category.id)}
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="group relative aspect-[4/3] overflow-hidden rounded-[44px] border border-slate-100 bg-slate-100 shadow-2xl"
    >
      <div className="absolute inset-0">
        <LazyLoadImage
          src={category.image}
          alt={category.label}
          effect="blur"
          scrollPosition={scrollPosition}
          wrapperClassName="w-full h-full"
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-3"
        />
        <div className="group-hover:from-pixs-mint/80 absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent transition-all duration-700" />
      </div>
      <div className="absolute inset-0 flex flex-col items-start justify-end p-10 text-left">
        <span className="mt-2 text-xl leading-tight font-black tracking-tighter text-white uppercase italic drop-shadow-2xl">
          {category.label}
        </span>
      </div>
    </motion.button>
  );
});

export default CategoryCard;
