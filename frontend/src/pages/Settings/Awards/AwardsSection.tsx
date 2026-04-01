import React, { useState } from 'react';
import { FiTag, FiCopy, FiGift } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface Voucher {
  id: string;
  code: string;
  description: string;
  expiry: string;
  used: boolean;
}

const MOCK_VOUCHERS: Voucher[] = [
  { id: 'v1', code: 'PIXS10OFF', description: '10% off on all printing orders', expiry: '2026-04-30', used: false },
  { id: 'v2', code: 'WELCOME50', description: '₱50 off your first order', expiry: '2026-04-15', used: true },
];

const AwardsSection: React.FC = () => {
  const [redeemInput, setRedeemInput] = useState('');
  const [vouchers] = useState<Voucher[]>(MOCK_VOUCHERS);
  const [copyId, setCopyId] = useState<string | null>(null);

  const handleRedeem = () => {
    // Placeholder — no backend
    setRedeemInput('');
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopyId(id);
    setTimeout(() => setCopyId(null), 1500);
  };

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
          <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            type="text"
            value={redeemInput}
            onChange={(e) => setRedeemInput(e.target.value)}
            placeholder="Enter promo or QR code..."
            className="w-full rounded-xl border border-slate-100 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold text-slate-800 italic placeholder-slate-300 focus:border-pixs-mint focus:outline-none transition-colors"
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
          {vouchers.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                'flex flex-col gap-4 rounded-[20px] border p-5 transition-all sm:flex-row sm:items-center sm:justify-between',
                v.used
                  ? 'border-slate-100 bg-slate-50 opacity-50'
                  : 'border-slate-100 bg-white shadow-sm hover:shadow-md',
              )}
            >
              <div className="flex items-center gap-4">
                <div className={clsx(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  v.used ? 'bg-slate-200' : 'bg-pixs-mint/10',
                )}>
                  <FiGift size={20} className={v.used ? 'text-slate-400' : 'text-slate-800'} />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                    {v.code}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                    {v.description}
                  </p>
                  <p className="mt-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    Expires {v.expiry}
                  </p>
                </div>
              </div>
              <div className="pl-16 sm:pl-0">
                {v.used ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    Used
                  </span>
                ) : (
                  <button
                    onClick={() => handleCopy(v.code, v.id)}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-[9px] font-black tracking-widest text-slate-600 uppercase transition-all hover:border-pixs-mint hover:text-slate-900 active:scale-90"
                  >
                    <FiCopy size={11} />
                    {copyId === v.id ? 'Copied!' : 'Copy Code'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default AwardsSection;
