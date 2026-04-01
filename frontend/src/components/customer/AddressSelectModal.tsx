import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiMapPin, FiPlus, FiX, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCustomerAddressStore } from '../../store/useCustomerAddressStore';


interface AddressSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddressSelectModal: React.FC<AddressSelectModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addresses, setDefaultAddress, defaultAddressId } = useCustomerAddressStore();

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSelect = (id: string) => {
    setDefaultAddress(id);
    onClose();
  };

  const handleEdit = (id: string) => {
    onClose();
    // Redirect to settings with query params
    navigate(`/settings?section=address&edit=${id}`);
  };

  const handleAddNew = () => {
    onClose();
    navigate('/settings?section=address&action=new');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="AddressSelectModal fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="AddressSelectOverlay absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="AddressSelectContainer relative z-10 w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="AddressSelectHeader flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pixs-mint text-slate-900 shadow-lg shadow-pixs-mint/20">
                  <FiMapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 leading-none">Select Address</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400 mt-1">Delivery Destination</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Address List */}
            <div className="AddressSelectList max-h-[60vh] overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {addresses.map((addr) => {
                const isActive = addr.id === defaultAddressId;
                return (
                  <div
                    key={addr.id}
                    onClick={() => handleSelect(addr.id)}
                    className={`AddressSelectCard group relative cursor-pointer overflow-hidden rounded-[24px] border-2 p-5 transition-all
                      ${isActive ? 'AddressSelectCard--active border-slate-900 bg-slate-50 shadow-inner' : 'border-slate-100 hover:border-pixs-mint hover:bg-slate-50/30'}
                    `}
                  >
                    <div className="AddressSelectInfo space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black uppercase italic tracking-widest text-slate-900 leading-none">
                          {addr.full_name}
                        </p>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-pixs-mint animate-in fade-in zoom-in duration-300">
                            <FiCheckCircle size={10} /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-600 line-clamp-1">
                        {addr.street}, {addr.barangay}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                        {addr.city}, {addr.province} CP-{addr.postal_code}
                      </p>
                    </div>

                    <div className="AddressSelectActions mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <button 
                        className="AddressSelectButton text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-pixs-mint transition-colors italic"
                        onClick={(e) => { e.stopPropagation(); handleSelect(addr.id); }}
                      >
                        Deliver Here
                      </button>
                      <button 
                        className="AddressEditButton flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-all opacity-60 group-hover:opacity-100 italic"
                        onClick={(e) => { e.stopPropagation(); handleEdit(addr.id); }}
                      >
                        <FiEdit2 size={10} /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer / Add New */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
              <button
                onClick={handleAddNew}
                className="AddressAddNewButton w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-[10px] font-black uppercase tracking-[4px] text-white italic shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                <FiPlus size={16} /> Add New Address
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddressSelectModal;
