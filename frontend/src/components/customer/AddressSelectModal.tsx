import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEdit2, FiMapPin, FiPlus, FiCheckCircle } from 'react-icons/fi'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAddressStore } from '../../store/useCustomerAddressStore'

interface AddressSelectModalProps {
  isOpen: boolean
  onClose: () => void
}

const AddressSelectModal: React.FC<AddressSelectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate()
  const { addresses, setDefaultAddress, defaultAddressId } =
    useCustomerAddressStore()

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSelect = (id: string) => {
    setDefaultAddress(id)
    onClose()
  }

  const handleEdit = (id: string) => {
    onClose()
    // Redirect to settings with query params
    navigate(`/settings?section=address&edit=${id}`)
  }

  const handleAddNew = () => {
    onClose()
    navigate('/settings?section=address&action=new')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="AddressSelectModal fixed inset-0 z-[100] flex h-screen w-screen flex-col justify-end overflow-hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="AddressSelectOverlay pointer-events-auto absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="AddressSelectContainer relative z-20 flex h-[92vh] w-full flex-col overflow-hidden rounded-t-[52px] bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="AddressSelectHeader sticky top-0 z-50 flex items-center gap-4 border-b border-slate-50 bg-white/80 p-6 backdrop-blur-md">
              <button
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 active:scale-90"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="flex flex-1 items-center gap-4">
                <div className="bg-pixs-mint shadow-pixs-mint/20 flex h-10 w-10 items-center justify-center rounded-2xl text-slate-900 shadow-lg">
                  <FiMapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                    Select Address
                  </h2>
                  <p className="mt-1 text-[10px] font-bold tracking-[2px] text-slate-400 uppercase">
                    Delivery Protocol
                  </p>
                </div>
              </div>
            </div>

            {/* Address List */}
            <div className="AddressSelectList custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6 pb-32 md:p-12">
              {addresses.map((addr) => {
                const isActive = addr.id === defaultAddressId
                return (
                  <div
                    key={addr.id}
                    onClick={() => handleSelect(addr.id)}
                    className={`AddressSelectCard group relative cursor-pointer overflow-hidden rounded-[24px] border-2 p-5 transition-all ${isActive ? 'AddressSelectCard--active border-slate-900 bg-slate-50 shadow-inner' : 'hover:border-pixs-mint border-slate-100 hover:bg-slate-50/30'} `}
                  >
                    <div className="AddressSelectInfo space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs leading-none font-black tracking-widest text-slate-900 uppercase italic">
                          {addr.adress_label}
                        </p>
                        {isActive && (
                          <span className="text-pixs-mint animate-in fade-in zoom-in flex items-center gap-1 text-[9px] font-black tracking-widest uppercase duration-300">
                            <FiCheckCircle size={10} /> Active
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-1 text-xs font-bold text-slate-600">
                        {addr.street}, {addr.barangay}
                      </p>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                        {addr.city}, {addr.province} CP-{addr.postal_code}
                      </p>
                    </div>

                    <div className="AddressSelectActions mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <button
                        className="AddressSelectButton hover:text-pixs-mint text-[10px] font-black tracking-widest text-slate-900 uppercase italic transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelect(addr.id)
                        }}
                      >
                        Deliver Here
                      </button>
                      <button
                        className="AddressEditButton flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black tracking-widest text-slate-500 uppercase italic opacity-60 transition-all group-hover:opacity-100 hover:border-slate-900 hover:text-slate-900"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(addr.id)
                        }}
                      >
                        <FiEdit2 size={10} /> Edit
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer / Add New */}
            <div className="pb-safe mt-auto border-t border-slate-50 bg-white p-6 md:px-12">
              <button
                onClick={handleAddNew}
                className="AddressAddNewButton flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-5 text-[10px] font-black tracking-[4px] text-white uppercase italic shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                <FiPlus size={16} /> Add New Protocol
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AddressSelectModal
