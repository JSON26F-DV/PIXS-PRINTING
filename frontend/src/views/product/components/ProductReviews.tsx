import React, { useState } from 'react'
import { Star, MessageCircle, Calendar, User, Filter } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

interface Review {
  id: number
  rating: number
  feedback: string
  customer_name: string
  created_at: string
}

interface ProductReviewsProps {
  reviews?: Review[]
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ reviews = [] }) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  const filteredReviews = selectedRating 
    ? reviews.filter(r => r.rating === selectedRating)
    : reviews

  if (reviews.length === 0) {
    return (
      <div className="rounded-[40px] border-2 border-dashed border-slate-100 bg-slate-50/50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-100">
          <MessageCircle className="text-slate-200" size={24} />
        </div>
        <h3 className="text-sm font-black tracking-widest text-slate-400 uppercase italic">
          No reviews yet
        </h3>
        <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-300 uppercase">
          Be the first to share your experience
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
          Product <span className="text-slate-400">Reviews</span>
        </h3>
        
        {/* Filter Interaction Protocol */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2 flex items-center gap-1.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
            <Filter size={12} /> Filter:
          </div>
          <button
            onClick={() => setSelectedRating(null)}
            className={clsx(
              "rounded-full px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all",
              selectedRating === null 
                ? "bg-slate-900 text-white shadow-lg" 
                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            )}
          >
            All ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter(r => r.rating === star).length;
            return (
              <button
                key={star}
                disabled={count === 0}
                onClick={() => setSelectedRating(star)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all",
                  selectedRating === star 
                    ? "bg-pixs-mint text-slate-900 shadow-lg shadow-pixs-mint/20" 
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100",
                  count === 0 && "opacity-30 grayscale cursor-not-allowed"
                )}
              >
                {star} <Star size={10} className={star <= (selectedRating || 6) ? 'fill-current' : ''} /> ({count})
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AnimatePresence mode='popLayout'>
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <m.div
                key={review.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-[32px] border border-slate-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-slate-100"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase italic">
                        {review.customer_name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400">
                        <Calendar size={10} />
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-100'}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs font-bold leading-relaxed text-slate-500">
                  "{review.feedback}"
                </p>

                <div className="absolute -right-2 -bottom-2 -rotate-12 opacity-5 transition-opacity group-hover:opacity-10">
                  <MessageCircle size={64} />
                </div>
              </m.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-xs font-black tracking-widest text-slate-300 uppercase italic">
              No {selectedRating}-star reviews found
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ProductReviews
