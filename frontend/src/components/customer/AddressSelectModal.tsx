import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiMapPin, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { ArrowLeft } from 'lucide-react';
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
        <div className="AddressSelectModal fixed inset-0 z-[100] h-screen w-screen overflow-hidden flex flex-col justify-end">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="AddressSelectOverlay absolute inset-0 bg-slate-900/60 backdrop-blur-xl pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="AddressSelectContainer relative h-[92vh] w-full bg-white rounded-t-[52px] shadow-2xl flex flex-col overflow-hidden z-20"
          >
            {/* Header */}
            <div className="AddressSelectHeader sticky top-0 z-50 bg-white/80 backdrop-blur-md p-6 border-b border-slate-50 flex items-center gap-4">
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all active:scale-90"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="flex-1 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pixs-mint text-slate-900 shadow-lg shadow-pixs-mint/20">
                  <FiMapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 leading-none">Select Address</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400 mt-1">Delivery Protocol</p>
                </div>
              </div>
            </div>

            {/* Address List */}
            <div className="AddressSelectList flex-1 overflow-y-auto p-6 md:p-12 space-y-4 custom-scrollbar pb-32">
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
            <div className="p-6 md:px-12 bg-white border-t border-slate-50 mt-auto pb-safe">
              <button
                onClick={handleAddNew}
                className="AddressAddNewButton w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-5 text-[10px] font-black uppercase tracking-[4px] text-white italic shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                <FiPlus size={16} /> Add New Protocol
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddressSelectModal;
