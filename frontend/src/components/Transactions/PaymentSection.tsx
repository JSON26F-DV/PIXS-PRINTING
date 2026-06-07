import React from 'react'
import { CreditCard, Wallet, Landmark, CheckCircle2, Ticket, Lock } from 'lucide-react'

interface PaymentOption {
  id: string
  name: string
  type: string
  masked_number: string
  disabled?: boolean
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'gcash', name: 'GCash', type: 'ewallet', masked_number: 'E-Wallet' },
  { id: 'bdo', name: 'BDO', type: 'bank', masked_number: 'Online Banking' },
  { id: 'paymaya', name: 'PayMaya', type: 'ewallet', masked_number: 'E-Wallet' },
]

interface PaymentSectionProps {
  selectedId: string
  onSelect: (id: string) => void
  paymentCode?: string
  onPaymentCodeChange?: (code: string) => void
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  selectedId,
  onSelect,
  paymentCode = '',
  onPaymentCodeChange,
}) => {

  const getIcon = (type: string, disabled?: boolean) => {
    const cls = disabled ? 'text-slate-300' : 'text-pixs-mint'
    switch (type) {
      case 'bank':
        return <Landmark size={20} className={cls} />
      case 'ewallet':
        return <Wallet size={20} className={cls} />
      default:
        return <CreditCard size={20} className={cls} />
    }
  }

  return (
    <section className="PaymentSection space-y-4">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard size={18} className="text-pixs-mint" />
        <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
          Payment Method
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PAYMENT_OPTIONS.map((pay) => (
          <div
            key={pay.id}
            onClick={() => !pay.disabled && onSelect(pay.id)}
            className={`PaymentCard group relative rounded-2xl border p-4 transition-all ${
              pay.disabled
                ? 'cursor-not-allowed border-slate-100 bg-slate-50/30 opacity-50'
                : `cursor-pointer active:scale-[0.98] ${
                    selectedId === pay.id
                      ? 'border-pixs-mint bg-white shadow-lg'
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                  }`
            }`}
          >
            {/* Unavailable badge */}
            {pay.disabled && (
              <div className="absolute top-2.5 right-3 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                <Lock size={8} className="text-slate-400" />
                <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                  Unavailable
                </span>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div
                className={`PaymentRadio flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  pay.disabled
                    ? 'border-slate-200 bg-slate-100'
                    : selectedId === pay.id
                    ? 'border-pixs-mint'
                    : 'border-slate-200'
                }`}
              >
                {!pay.disabled && selectedId === pay.id && (
                  <CheckCircle2 size={16} className="text-pixs-mint" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getIcon(pay.type, pay.disabled)}
                  <span className={`text-sm font-black tracking-tight uppercase italic ${pay.disabled ? 'text-slate-400' : 'text-slate-900'}`}>
                    {pay.name}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-black tracking-[2.5px] text-slate-400 uppercase italic">
                  {pay.masked_number}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Payment Code Option Card */}
        <div
          onClick={() => onSelect('payment_code')}
          className={`PaymentCard group relative cursor-pointer rounded-2xl border p-4 transition-all active:scale-[0.98] ${
            selectedId === 'payment_code'
              ? 'border-pixs-mint bg-white shadow-lg'
              : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`PaymentRadio flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                selectedId === 'payment_code'
                  ? 'border-pixs-mint'
                  : 'border-slate-200'
              }`}
            >
              {selectedId === 'payment_code' && (
                <CheckCircle2 size={16} className="text-pixs-mint" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Ticket size={20} className="text-pixs-mint" />
                <span className="text-sm font-black tracking-tight text-slate-900 uppercase italic">
                  Payment Code
                </span>
              </div>
              <p className="mt-1 text-[10px] font-black tracking-[2.5px] text-slate-400 uppercase italic">
                Use Admin Code
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedId === 'payment_code' && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-6 space-y-3">
          <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
            Enter Payment Code
          </label>
          <input
            type="text"
            value={paymentCode}
            onChange={(e) => onPaymentCodeChange?.(e.target.value)}
            placeholder="e.g. PIXS-ABC123XYZ"
            maxLength={20}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black tracking-widest text-slate-900 placeholder-slate-300 focus:border-pixs-mint focus:bg-white focus:outline-none uppercase"
          />
          <p className="text-[9px] font-bold text-slate-400 tracking-wider">
            CODES ARE GENERATED BY THE ADMINISTRATOR FOR CASH OR CUSTOM TRANSACTIONS.
          </p>
        </div>
      )}
    </section>
  )
}

export default PaymentSection
