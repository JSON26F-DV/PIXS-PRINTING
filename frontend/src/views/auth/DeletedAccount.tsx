import React from 'react';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeletedAccount: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white rounded-[40px] shadow-2xl p-12 text-center border-t-8 border-rose-500 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <ShieldAlert size={48} className="text-rose-500" />
                </div>
                
                <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Identity Purged</h1>
                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    The account associated with these credentials has been <span className="text-rose-600 font-bold">permanently removed</span> from the active PIXS relational registry by an administrator. 
                </p>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-start gap-4 text-left mb-10">
                    <AlertCircle className="shrink-0 text-slate-400 mt-0.5" size={20} />
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Archival Policy</p>
                        <p className="text-sm font-semibold text-slate-600">
                            User data is currently held in an immutable archive for audit purposes. Please contact system support for recovery protocols.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => navigate('/login')}
                    className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-900/20"
                >
                    <ArrowLeft size={18} />
                    RETURN TO TERMINAL
                </button>
            </div>
        </div>
    );
};

export default DeletedAccount;
