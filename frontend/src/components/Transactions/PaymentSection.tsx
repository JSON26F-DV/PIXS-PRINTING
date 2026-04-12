import React from 'react'
import { CreditCard, Wallet, Landmark, CheckCircle2 } from 'lucide-react'
import { usePaymentMethodStore } from '../../store/usePaymentMethodStore'

interface PaymentSectionProps {
  selectedId: string
  onSelect: (id: string) => void
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  selectedId,
  onSelect,
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
            className={`PaymentCard group relative cursor-pointer rounded-2xl border p-5 transition-all active:scale-[0.98] ${
              selectedId === pay.id
                ? 'border-pixs-mint shadow-pixs-mint/5 bg-white shadow-lg'
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
      </div>
    </section>
  )
}

export default PaymentSection
