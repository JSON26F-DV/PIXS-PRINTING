import React from 'react'
import { MapPin, Phone, User } from 'lucide-react'
import { useCustomerAddressStore } from '../../store/useCustomerAddressStore'

interface AddressSectionProps {
  selectedId: string
  onSelect: (id: string) => void
}

const AddressSection: React.FC<AddressSectionProps> = ({
  selectedId,
  onSelect,
}) => {
  const { addresses } = useCustomerAddressStore()

  return (
    <section className="AddressSection space-y-4">
      <div className="mb-4 flex items-center gap-2">
        <MapPin size={18} className="text-pixs-mint" />
        <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
          Shipping Address
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            onClick={() => onSelect(addr.id)}
            className={`AddressCard group relative cursor-pointer rounded-2xl border p-4 transition-all active:scale-[0.98] ${
              selectedId === addr.id
                ? 'border-pixs-mint bg-white shadow-lg'
                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`AddressRadio mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                  selectedId === addr.id
                    ? 'border-pixs-mint'
                    : 'border-slate-200'
                }`}
              >
                {selectedId === addr.id && (
                  <div className="bg-pixs-mint h-2.5 w-2.5 rounded-full" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-900 uppercase italic">
                    <User size={14} className="text-slate-400" />
                    {addr.adress_label}
                  </div>
                  {addr.is_default && (
                    <span className="text-pixs-mint rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase">
                      Default
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Phone size={12} className="text-slate-300" />
                  {addr.contact_number}
                </div>

                <p className="pt-1 text-xs leading-relaxed text-slate-600">
                  {addr.street}, {addr.barangay}, {addr.city}, {addr.region}{' '}
                  {addr.postal_code}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AddressSection
