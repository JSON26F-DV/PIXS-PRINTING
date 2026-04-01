import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Printer, Package, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  return (
    <div className="OrderSuccessPage min-h-screen bg-slate-50 flex items-center justify-center p-6 lg:p-16">
      <div className="max-w-3xl w-full bg-white rounded-[64px] border border-slate-100 p-12 lg:p-24 shadow-[0_60px_100px_-30px_rgba(0,0,0,0.1)] relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-80 h-80 bg-pixs-mint/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-80 h-80 bg-slate-100 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-10">
          
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center text-pixs-mint shadow-2xl"
          >
            <CheckCircle size={48} strokeWidth={2.5} />
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
               Order Sequence <br /> Initialized.
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
               Your production nodes have been successfully deployed into the queue hub. 
            </p>
          </div>

          <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100/50 w-full flex flex-col items-center gap-6 shadow-inner">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] italic">Transaction Node Identifier</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">{orderId}</h3>
             </div>
             
             <div className="flex items-center gap-6 text-[10px] font-black text-slate-900 uppercase tracking-widest italic opacity-60">
                <div className="flex items-center gap-2">
                   <Printer size={14} className="text-pixs-mint" />
                   Printing Queue Set
                </div>
                <div className="flex items-center gap-2">
                   <Package size={14} className="text-pixs-mint" />
                   Logistics Synced
                </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full pt-8">
             <button 
                onClick={() => navigate('/')} 
                className="flex-1 bg-slate-900 text-white rounded-[32px] py-6 text-xs font-black uppercase tracking-widest italic shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95"
             >
                Return to Hub <ArrowRight size={16} />
             </button>
             <button 
                onClick={() => navigate('/settings?section=orders')} 
                className="flex-1 bg-white border border-slate-100 text-slate-900 rounded-[32px] py-6 text-xs font-black uppercase tracking-widest italic shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95"
             >
                Track Deployment Node
             </button>
          </div>

          <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-[4px] italic opacity-50">
             <ShieldCheck size={14} />
             Industrial Transaction Verification Node: STABLE
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
