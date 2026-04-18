import React from 'react'

interface StarRatingProps {
  rating: number
}

const STAR = '\u2605'

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const diff = rating - (i - 1)
        const fillWidth =
          diff >= 1 ? '100%' : diff > 0 ? `${diff * 100}%` : '0%'

        return (
          <span
            key={i}
            className="relative text-[10px] leading-none text-slate-200 md:text-xs"
          >
            {STAR}
            <span
              className="absolute inset-0 overflow-hidden font-black text-amber-400 transition-all"
              style={{ width: fillWidth }}
            >
              {STAR}
            </span>
          </span>
        )
      })}
      <span className="ml-1 text-[8px] font-black text-slate-400 italic md:text-[10px]">
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

export default StarRating
