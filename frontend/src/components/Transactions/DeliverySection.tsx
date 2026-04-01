import React from 'react';
import deliveryData from '../../data/delivery_methods.json';
import { Truck, Package, Clock } from 'lucide-react';

interface DeliveryMethod {
  id: string;
  name: string;
  type: string;
  fee: number;
  note?: string;
}

interface DeliverySectionProps {
  selectedId: string;
  onSelect: (id: string, fee: number) => void;
}

const DeliverySection: React.FC<DeliverySectionProps> = ({ selectedId, onSelect }) => {
  const deliveryMethods = deliveryData as DeliveryMethod[];

  const getIcon = (type: string) => {
    switch (type) {
      case 'courier': return <Truck size={20} className="text-pixs-mint" />;
      case 'pickup': return <Package size={20} className="text-pixs-mint" />;
      default: return <Clock size={20} className="text-pixs-mint" />;
    }
  };

  return (
    <section className="DeliverySection space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Truck size={18} className="text-pixs-mint" />
        <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">
          Delivery Logistics
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {deliveryMethods.map((del) => (
          <div 
            key={del.id}
            onClick={() => onSelect(del.id, del.fee)}
            className={`DeliveryCard group relative cursor-pointer rounded-2xl border p-5 transition-all active:scale-[0.98] ${
              selectedId === del.id 
                ? 'border-pixs-mint bg-white shadow-lg shadow-pixs-mint/5' 
                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`DeliveryRadio h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedId === del.id ? 'border-pixs-mint' : 'border-slate-200'
              }`}>
                {selectedId === del.id && <div className="h-2.5 w-2.5 rounded-full bg-pixs-mint" />}
              </div>

              {getIcon(del.type)}
              
              <div className="mt-1">
                <span className="text-xs font-black text-slate-900 uppercase italic tracking-tight block">
                   {del.name}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest mt-1 block px-3 py-1 rounded-full border ${
                  del.type === 'pickup' 
                    ? 'text-pixs-mint border-pixs-mint/20 bg-pixs-mint/5' 
                    : 'text-amber-500 border-amber-200 bg-amber-50'
                }`}>
                   {del.type === 'pickup' ? 'NO CHARGE' : 'PAY COURIER DIRECTLY'}
                </span>
                {del.note && (
                  <p className="text-[8px] font-bold text-slate-400 mt-2 italic leading-tight">
                    {del.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DeliverySection;
