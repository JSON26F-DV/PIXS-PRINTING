import React from 'react';
import addressData from '../../data/address_book.json';
import { MapPin, Phone, User } from 'lucide-react';

interface Address {
  id: string;
  full_name: string;
  phone: string;
  region: string;
  city: string;
  barangay: string;
  street: string;
  postal_code: string;
  is_default: boolean;
}

interface AddressSectionProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const AddressSection: React.FC<AddressSectionProps> = ({ selectedId, onSelect }) => {
  const addresses = addressData as Address[];

  return (
    <section className="AddressSection space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={18} className="text-pixs-mint" />
        <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">
          Shipping Address
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {addresses.map((addr) => (
          <div 
            key={addr.id}
            onClick={() => onSelect(addr.id)}
            className={`AddressCard group relative cursor-pointer rounded-2xl border p-5 transition-all active:scale-[0.98] ${
              selectedId === addr.id 
                ? 'border-pixs-mint bg-white shadow-lg shadow-pixs-mint/5' 
                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`AddressRadio mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedId === addr.id ? 'border-pixs-mint' : 'border-slate-200'
              }`}>
                {selectedId === addr.id && <div className="h-2.5 w-2.5 rounded-full bg-pixs-mint" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase italic tracking-tight">
                    <User size={14} className="text-slate-400" />
                    {addr.full_name}
                  </div>
                  {addr.is_default && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-pixs-mint bg-slate-900 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Phone size={12} className="text-slate-300" />
                  {addr.phone}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {addr.street}, {addr.barangay}, {addr.city}, {addr.region} {addr.postal_code}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AddressSection;
