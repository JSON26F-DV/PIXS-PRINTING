import React from 'react'
import { Star, MessageCircle, Calendar, User } from 'lucide-react'
import { motion } from 'framer-motion'

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
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
          Product <span className="text-slate-400">Reviews</span>
        </h3>
        <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2">
          <Star className="fill-yellow-400 text-yellow-400" size={14} />
          <span className="text-[10px] font-black tracking-widest text-white uppercase italic">
            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reviews.map((review, idx) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
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
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ProductReviews
