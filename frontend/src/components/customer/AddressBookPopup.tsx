import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AddressBookPopup: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white p-10 rounded-3xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Address Book</h2>
        <p className="mb-4 text-slate-500 italic uppercase tracking-widest text-[10px]">Not implemented yet</p>
        <button onClick={onClose} className="bg-slate-900 text-white px-6 py-3 rounded-xl w-full font-bold">Close</button>
      </div>
    </div>
  );
};

export default AddressBookPopup;
