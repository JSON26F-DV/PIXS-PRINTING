import React from 'react';
import paymentData from '../../data/payment.json';
import { CreditCard, Wallet, Landmark, CheckCircle2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  bank_name?: string;
  provider?: string;
  masked_number: string;
  is_default: boolean;
}

interface PaymentSectionProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({ selectedId, onSelect }) => {
  const paymentMethods = paymentData as PaymentMethod[];

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Landmark size={20} className="text-pixs-mint" />;
      case 'ewallet': return <Wallet size={20} className="text-pixs-mint" />;
      default: return <CreditCard size={20} className="text-pixs-mint" />;
    }
  };

  return (
    <section className="PaymentSection space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={18} className="text-pixs-mint" />
        <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">
          Payment Method
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paymentMethods.map((pay) => (
          <div 
            key={pay.id}
            onClick={() => onSelect(pay.id)}
            className={`PaymentCard group relative cursor-pointer rounded-2xl border p-5 transition-all active:scale-[0.98] ${
              selectedId === pay.id 
                ? 'border-pixs-mint bg-white shadow-lg shadow-pixs-mint/5' 
                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`PaymentRadio h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedId === pay.id ? 'border-pixs-mint' : 'border-slate-200'
              }`}>
                {selectedId === pay.id && <CheckCircle2 size={16} className="text-pixs-mint" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getIcon(pay.type)}
                  <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight">
                    {pay.bank_name || pay.provider}
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2.5px] mt-1 italic">
                  {pay.masked_number}
                </p>
              </div>
            </div>

            {pay.is_default && (
              <span className="absolute top-4 right-4 text-[7px] font-black uppercase tracking-widest text-pixs-mint bg-slate-900 px-1.5 py-0.5 rounded-full">
                Primary
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default PaymentSection;
