import React from 'react'
import { Truck, Package, Clock } from 'lucide-react'

export interface DeliveryMethod {
  id: string
  name: string
  type: string
  note?: string
}

interface DeliverySectionProps {
  methods: DeliveryMethod[]
  selectedId: string
  onSelect: (id: string) => void
}

const DeliverySection: React.FC<DeliverySectionProps> = ({
  methods,
  selectedId,
  onSelect,
}) => {
  const deliveryMethods = methods

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
          Delivery Method
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {deliveryMethods.map((del) => (
          <div
            key={del.id}
            onClick={() => onSelect(String(del.id))}
            className={`DeliveryCard group relative cursor-pointer rounded-2xl border p-4 transition-all active:scale-[0.98] ${
              String(selectedId) === String(del.id)
                ? 'border-pixs-mint bg-white shadow-lg'
                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
            }`}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={`DeliveryRadio flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  String(selectedId) === String(del.id)
                    ? 'border-pixs-mint'
                    : 'border-slate-200'
                }`}
              >
                {String(selectedId) === String(del.id) && (
                  <div className="bg-pixs-mint h-2.5 w-2.5 rounded-full" />
                )}
              </div>

              {getIcon(del.type)}

              <div className="mt-1">
                <span className="block text-xs font-black tracking-tight text-slate-900 uppercase italic">
                  {del.name}
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
