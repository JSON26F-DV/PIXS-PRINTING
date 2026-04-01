import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Printer, Zap } from 'lucide-react';

const HeroSection: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="HeroSection h-full w-full flex items-center justify-center p-6 md:p-20 relative overflow-hidden bg-white">
      {/* Background CMYK Elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-100/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-magenta-100/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-pixs-mint/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-3xl w-full text-center space-y-12 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl shadow-slate-900/20 relative rotate-12 group hover:rotate-0 transition-transform">
            <Printer size={40} className="text-pixs-mint" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-pixs-mint rounded-full flex items-center justify-center shadow-lg">
              <Zap size={16} className="text-slate-900" />
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic uppercase leading-none"
          >
            Transforming Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-magenta-500 to-yellow-500">
               Ideas Into Prints
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-slate-400 font-bold uppercase tracking-[4px] md:tracking-[8px] text-[10px] md:text-xs"
          >
            Direct Administrative Channel · Powered by PIXS Printing Hub
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onStart}
            className="px-10 py-5 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-slate-900/40 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all group"
          >
            Initialize Conversation <MessageSquare size={18} className="text-pixs-mint group-hover:rotate-12 transition-transform" />
          </button>
          
          <div className="flex items-center gap-2 px-6 py-4 rounded-full border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
            <Sparkles size={14} className="text-yellow-400" /> Premium Quality Assured
          </div>
        </motion.div>
      </div>

      {/* Decorative Grid Node */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    </div>
  );
};

export default HeroSection;
