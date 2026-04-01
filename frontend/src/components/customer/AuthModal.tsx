import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'signin' | 'signup';
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white p-10 rounded-3xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Authentication</h2>
        <p className="mb-4 text-slate-500 italic uppercase tracking-widest text-[10px]">Development Redirect Node</p>
        <div className="flex flex-col gap-4">
           <a href="/login" className="bg-slate-900 text-white px-6 py-3 rounded-xl text-center font-bold">Go to Login Terminal</a>
           <button onClick={onClose} className="text-slate-400 text-[10px] font-bold uppercase">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
