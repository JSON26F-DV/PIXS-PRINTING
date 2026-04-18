import React from "react";

interface StarRatingProps {
  rating: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const full = rating >= i;
        const half = !full && rating >= i - 0.5;
        return (
          <span key={i} className="relative text-slate-200 text-base leading-none">
            ★
            <span
              className={`absolute inset-0 text-amber-400 overflow-hidden ${
                full ? "w-full" : half ? "w-1/2" : "w-0"
              }`}
            >
              ★
            </span>
          </span>
        );
      })}
      <span className="text-xs text-slate-400 ml-1 font-mono">{rating.toFixed(1)}</span>
    </div>
  );
};

export default StarRating;
