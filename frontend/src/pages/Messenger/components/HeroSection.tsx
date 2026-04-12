import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Sparkles, Printer, Zap } from 'lucide-react'

const HeroSection: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="HeroSection relative flex h-full w-full items-center justify-center overflow-hidden bg-white p-6 md:p-20">
      {/* Background CMYK Elements */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/30 blur-[100px]" />
      <div className="bg-magenta-100/20 absolute bottom-0 left-0 h-[300px] w-[300px] -translate-x-1/4 translate-y-1/2 rounded-full blur-[80px]" />
      <div className="bg-pixs-mint/10 absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-3xl space-y-12 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <div className="group relative flex h-24 w-24 rotate-12 items-center justify-center rounded-[32px] bg-slate-900 shadow-2xl shadow-slate-900/20 transition-transform hover:rotate-0">
            <Printer size={40} className="text-pixs-mint" />
            <div className="bg-pixs-mint absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-lg">
              <Zap size={16} className="text-slate-900" />
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl leading-none font-black tracking-tighter text-slate-900 uppercase italic md:text-7xl"
          >
            Transforming Your <br />
            <span className="via-magenta-500 bg-gradient-to-r from-cyan-500 to-yellow-500 bg-clip-text text-transparent">
              Ideas Into Prints
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-[10px] font-bold tracking-[4px] text-slate-400 uppercase md:text-xs md:tracking-[8px]"
          >
            Direct Administrative Channel · Powered by PIXS Printing Hub
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col items-center justify-center gap-4 md:flex-row"
        >
          <button
            onClick={onStart}
            className="group flex items-center gap-3 rounded-full bg-slate-900 px-10 py-5 text-xs font-black tracking-widest text-white uppercase shadow-2xl shadow-slate-900/40 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-95"
          >
            Initialize Conversation{' '}
            <MessageSquare
              size={18}
              className="text-pixs-mint transition-transform group-hover:rotate-12"
            />
          </button>

          <div className="flex items-center gap-2 rounded-full border border-slate-100 px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
            <Sparkles size={14} className="text-yellow-400" /> Premium Quality
            Assured
          </div>
        </motion.div>
      </div>

      {/* Decorative Grid Node */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  )
}

export default HeroSection
