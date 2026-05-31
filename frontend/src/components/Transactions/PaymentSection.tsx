import React from 'react'
import { CreditCard, Wallet, Landmark, CheckCircle2, Ticket } from 'lucide-react'
import { usePaymentMethodStore } from '../../store/usePaymentMethodStore'

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
  const { methods: paymentMethods } = usePaymentMethodStore()

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Landmark size={20} className="text-pixs-mint" />
      case 'ewallet':
        return <Wallet size={20} className="text-pixs-mint" />
      default:
        return <CreditCard size={20} className="text-pixs-mint" />
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
        {paymentMethods.map((pay) => (
          <div
            key={pay.id}
            onClick={() => onSelect(pay.id)}
            className={`PaymentCard group relative cursor-pointer rounded-2xl border p-4 transition-all active:scale-[0.98] ${
              selectedId === pay.id
                ? 'border-pixs-mint bg-white shadow-lg'
                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`PaymentRadio flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  selectedId === pay.id
                    ? 'border-pixs-mint'
                    : 'border-slate-200'
                }`}
              >
                {selectedId === pay.id && (
                  <CheckCircle2 size={16} className="text-pixs-mint" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getIcon(pay.type)}
                  <span className="text-sm font-black tracking-tight text-slate-900 uppercase italic">
                    {pay.bank_name || pay.provider}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-black tracking-[2.5px] text-slate-400 uppercase italic">
                  {pay.masked_number}
                </p>
              </div>
            </div>

            {pay.is_default && (
              <span className="text-pixs-mint absolute top-4 right-4 rounded-full bg-slate-900 px-1.5 py-0.5 text-[7px] font-black tracking-widest uppercase">
                Primary
              </span>
            )}
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
