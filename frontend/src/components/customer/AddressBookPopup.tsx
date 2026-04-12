import React from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const AddressBookPopup: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rounded-3xl bg-white p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-2xl font-bold">Address Book</h2>
        <p className="mb-4 text-[10px] tracking-widest text-slate-500 uppercase italic">
          Not implemented yet
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-slate-900 px-6 py-3 font-bold text-white"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default AddressBookPopup
