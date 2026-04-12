import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { IProduct } from '../../types/product.types';
import { useAuth } from '../../context/AuthContext';

interface ProductCardProps {
  product: IProduct;
  soldCount: number;
  isFav: boolean;
  onFavClick: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  soldCount,
  isFav,
  onFavClick,
  onClick,
}) => {
  const { user } = useAuth();
  const isLoggedIn = user?.isLoggedIn;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onClick={onClick}
      className="HomepageProductCard ProductCardWrapper group relative cursor-pointer rounded-[32px] border border-slate-100 bg-white p-2 transition-all md:rounded-[44px] md:p-2.5 hover:-translate-y-3"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px] border border-slate-50 bg-slate-50 shadow-inner transition-colors duration-500 group-hover:bg-white md:rounded-[36px]">
        <img
          src={product.main_image}
          alt={product.name}
          className="ProductCardImage h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />

        <button
          onClick={onFavClick}
          className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-xl border border-white bg-white/90 shadow-lg backdrop-blur-xl transition-all md:top-6 md:right-6 md:h-12 md:w-12 md:rounded-[22px]"
        >
          <Heart
            size={20}
            className={clsx(
              isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-200',
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
    </motion.div>
  );
};

export default ProductCard;
