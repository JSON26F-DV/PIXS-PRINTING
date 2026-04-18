import React from "react";
import type { Category } from "../types";

interface CategoryCardProps {
  category: Category;
  isMore?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isMore }) => {
  if (isMore) {
    return (
      <div className="relative aspect-[4/3] rounded-2xl border border-slate-200/70 cursor-pointer flex flex-col items-center justify-center active:scale-[0.99]">
        <span className="text-slate-900 font-['Bebas_Neue'] text-2xl md:text-3xl italic tracking-tighter flex items-center gap-2">
          VIEW ALL <span className="text-pixs-mint">&rarr;</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        backgroundImage: `url(${
          category.image ||
          `https://images.unsplash.com/photo-1562654501-a0ccc0af3ff1?q=80&w=1000&auto=format&fit=crop`
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />


      {/* Label */}
      <div className="absolute inset-x-0 bottom-6 text-center">
        <span className="text-white text-xs md:text-sm font-bold uppercase tracking-[4px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] px-4">
          {category.label}
        </span>
      </div>
    </div>
  );
};

export default CategoryCard;
