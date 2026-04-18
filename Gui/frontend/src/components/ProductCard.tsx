import React from "react";
import { Heart } from "lucide-react";
import { formatPHP, mockRating } from "../types";
import type { Product } from "../types";
import StarRating from "./StarRating";
import cubeIcon from "../assets/icons/cube.svg";

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  toggleFavorite: (id: number) => void;
}

const BoxFallback = () => (
  <div className="w-full h-full flex items-center justify-center">
    <img
      src={cubeIcon}
      alt=""
      className="w-16 h-16 opacity-50"
      loading="lazy"
      draggable={false}
    />
  </div>
);

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  toggleFavorite,
}) => {
  const minTotal = product.base_price * product.min_order;
  const rating = product.rating || mockRating(product.id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const handleCardClick = () => {
    window.location.href = `/product/${product.id}`;
  };

  return (
    <div
      onClick={handleCardClick}
      className={[
        "group bg-white border border-slate-200/60",
        "rounded-2xl overflow-hidden",
        "cursor-pointer",
        "flex flex-col h-full p-2",
      ].join(" ")}
    >
      {/* Image */}
      <div className="relative aspect-[16/11] overflow-hidden rounded-xl border border-slate-200/50">
        {product.main_image ? (
          <img
            src={product.main_image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <BoxFallback />
        )}

        {/* Heart Button */}
        <button
          onClick={handleHeartClick}
          className={[
            "absolute top-3 right-3",
            "h-8 w-8",
            "rounded-lg",
            "bg-white/90 border border-slate-200/60",
            "active:scale-95",
            "flex items-center justify-center z-10",
          ].join(" ")}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={18}
            className={isFavorite ? "text-rose-500 fill-rose-500" : "text-slate-200"}
          />
        </button>
      </div>

      {/* Body / Title Section */}
      <div className="px-2.5 pt-3 pb-2.5 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="text-slate-900 font-black text-[11px] md:text-[15px] leading-tight uppercase italic tracking-tight truncate">
            {product.name}
          </h3>
          <p className="mt-2 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest line-clamp-1">
            {product.best_for}
          </p>
        </div>

        <div className="mt-auto pt-3 border-t border-slate-200/40">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-[9px] md:text-sm font-black text-rose-500 block">
                Min: {formatPHP(minTotal)}
              </span>
              <p className="text-slate-900 text-[10px] md:text-lg font-mono font-black italic tracking-tighter">
                {formatPHP(product.base_price)}/pc
              </p>
            </div>
            <div className="text-right">
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-300">
                Min. order
              </span>
              <div className="text-[10px] md:text-sm font-mono text-slate-500">
                {product.min_order} pcs
              </div>
            </div>
          </div>
          <div className="mt-2">
            <StarRating rating={rating} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

