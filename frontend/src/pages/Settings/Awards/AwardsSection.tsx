import React, { useState } from 'react'
import { FiTag, FiCopy, FiGift } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

import toast from 'react-hot-toast'
import axios from 'axios'
import { usePromotionStore } from '../../../store/usePromotionStore'

const AwardsSection: React.FC = () => {
  const {
    promotions: vouchers,
    isLoading,
    fetchPromotions,
    redeemPromotion,
  } = usePromotionStore()
  const [redeemInput, setRedeemInput] = useState('')
  const [copyId, setCopyId] = useState<string | null>(null)

  React.useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  const handleRedeem = async () => {
    if (!redeemInput) return

    try {
      await redeemPromotion(redeemInput)
      toast.success('Promo code applied successfully')
      setRedeemInput('')
      fetchPromotions() // Refresh list
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Redemption failed')
      } else {
        toast.error('Redemption failed')
      }
    }
  }

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopyId(id)
    setTimeout(() => setCopyId(null), 1500)
  }

  if (isLoading && vouchers.length === 0) {
    return (
      <div className="flex h-64 animate-pulse items-center justify-center text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
        Syncing Rewards Node...
      </div>
    )
  }

  return (
    <section className="SettingsAwards space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
          Awards & Discounts
        </h2>
        <p className="text-[10px] font-bold tracking-[4px] text-slate-400 uppercase">
          Promo codes, QR rewards & vouchers
        </p>
      </div>

      {/* Redeem Input */}
      <div className="flex gap-3 rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <FiTag
            className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-300"
            size={16}
          />
          <input
            type="text"
            value={redeemInput}
            onChange={(e) => setRedeemInput(e.target.value)}
            placeholder="Enter promo or QR code..."
            className="focus:border-pixs-mint w-full rounded-xl border border-slate-100 bg-slate-50 py-3 pr-4 pl-10 text-sm font-bold text-slate-800 italic placeholder-slate-300 transition-colors focus:outline-none"
          />
        </div>
        <button
          onClick={handleRedeem}
          className="RedeemButton flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <FiGift size={14} />
          Redeem
        </button>
      </div>

      {/* Voucher List */}
      <div className="space-y-3">
        <AnimatePresence>
          {vouchers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                <FiGift size={32} />
              </div>
              <p className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                No rewards discovered yet
              </p>
            </motion.div>
          ) : (
            vouchers.map((v) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  'flex flex-col gap-4 rounded-[20px] border p-5 transition-all sm:flex-row sm:items-center sm:justify-between',
                  v.status !== 'active'
                    ? 'border-slate-100 bg-slate-50 opacity-50'
                    : 'border-slate-100 bg-white shadow-sm hover:shadow-md',
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                      v.status !== 'active' ? 'bg-slate-200' : 'bg-pixs-mint/10',
                    )}
                  >
                    <FiGift
                      size={20}
                      className={
                        v.status !== 'active' ? 'text-slate-400' : 'text-slate-800'
                      }
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                      {v.code}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                      {v.title} —{' '}
                      {v.discount_type === 'percentage'
                        ? `${v.discount_value}%`
                        : `₱${v.discount_value}`}{' '}
                      OFF
                    </p>
                    <p className="mt-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {v.expires_at
                        ? `Expires ${new Date(v.expires_at).toLocaleDateString()}`
                        : 'No Expiry'}
                    </p>
                  </div>
                </div>
                <div className="pl-16 sm:pl-0">
                  {v.status !== 'active' ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {v.status.toUpperCase()}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCopy(v.code, v.id)}
                      className="hover:border-pixs-mint flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-[9px] font-black tracking-widest text-slate-600 uppercase transition-all hover:text-slate-900 active:scale-90"
                    >
                      <FiCopy size={11} />
                      {copyId === v.id ? 'Copied!' : 'Copy Code'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default AwardsSection
