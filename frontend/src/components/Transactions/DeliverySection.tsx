import React from 'react'
import deliveryData from '../../data/delivery_methods.json'
import { Truck, Package, Clock } from 'lucide-react'

interface DeliveryMethod {
  id: string
  name: string
  type: string
  fee: number
  note?: string
}

interface DeliverySectionProps {
  selectedId: string
  onSelect: (id: string, fee: number) => void
}

const DeliverySection: React.FC<DeliverySectionProps> = ({
  selectedId,
  onSelect,
}) => {
  const deliveryMethods = deliveryData as DeliveryMethod[]

  const getIcon = (type: string) => {
    switch (type) {
      case 'courier':
        return <Truck size={20} className="text-pixs-mint" />
      case 'pickup':
        return <Package size={20} className="text-pixs-mint" />
      default:
        return <Clock size={20} className="text-pixs-mint" />
    }
  }

  return (
    <section className="DeliverySection space-y-4">
      <div className="mb-4 flex items-center gap-2">
        <Truck size={18} className="text-pixs-mint" />
        <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
          Delivery Logistics
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {deliveryMethods.map((del) => (
          <div
            key={del.id}
            onClick={() => onSelect(del.id, del.fee)}
            className={`DeliveryCard group relative cursor-pointer rounded-2xl border p-5 transition-all active:scale-[0.98] ${
              selectedId === del.id
                ? 'border-pixs-mint shadow-pixs-mint/5 bg-white shadow-lg'
                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
            }`}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={`DeliveryRadio flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  selectedId === del.id
                    ? 'border-pixs-mint'
                    : 'border-slate-200'
                }`}
              >
                {selectedId === del.id && (
                  <div className="bg-pixs-mint h-2.5 w-2.5 rounded-full" />
                )}
              </div>

              {getIcon(del.type)}

              <div className="mt-1">
                <span className="block text-xs font-black tracking-tight text-slate-900 uppercase italic">
                  {del.name}
                </span>
                <span
                  className={`mt-1 block rounded-full border px-3 py-1 text-[9px] font-black tracking-widest uppercase ${
                    del.type === 'pickup'
                      ? 'text-pixs-mint border-pixs-mint/20 bg-pixs-mint/5'
                      : 'border-amber-200 bg-amber-50 text-amber-500'
                  }`}
                >
                  {del.type === 'pickup' ? 'NO CHARGE' : 'PAY COURIER DIRECTLY'}
                </span>
                {del.note && (
                  <p className="mt-2 text-[8px] leading-tight font-bold text-slate-400 italic">
                    {del.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default DeliverySection
