import React from 'react'
import { m } from 'framer-motion'
import { MessageSquare, Sparkles, Printer, Zap } from 'lucide-react'

const HeroSection: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="HeroSection relative flex h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden bg-white p-6 py-12 md:p-20">
      {/* Background CMYK Elements */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/30 blur-[100px]" />
      <div className="bg-magenta-100/20 absolute bottom-0 left-0 h-[300px] w-[300px] -translate-x-1/4 translate-y-1/2 rounded-full blur-[80px]" />
      <div className="bg-pixs-mint/10 absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-3xl space-y-6 md:space-y-12 text-center my-auto">
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <div className="group relative flex h-16 w-16 rotate-12 items-center justify-center rounded-[24px] bg-slate-900 shadow-2xl shadow-slate-900/20 transition-transform hover:rotate-0 md:h-24 md:w-24 md:rounded-[32px]">
            <Printer className="h-8 w-8 text-pixs-mint md:h-10 md:w-10" />
            <div className="bg-pixs-mint absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full shadow-lg md:-top-2 md:-right-2 md:h-8 md:w-8">
              <Zap className="h-3 w-3 text-slate-900 md:h-4 md:w-4" />
            </div>
          </div>
        </m.div>

        <div className="space-y-4 md:space-y-6">
          <m.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl leading-none font-black tracking-tighter text-slate-900 uppercase italic sm:text-5xl md:text-7xl"
          >
            Transforming Your <br />
            <span className="via-magenta-500 bg-gradient-to-r from-cyan-500 to-yellow-500 bg-clip-text text-transparent">
              Ideas Into Prints
            </span>
          </m.h1>

          <m.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-[9px] font-bold tracking-[2px] text-slate-400 uppercase md:text-xs md:tracking-[8px]"
          >
            Direct Administrative Channel · Powered by PIXS Printing Hub
          </m.p>
        </div>

        <m.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4"
        >
          <button
            onClick={onStart}
            className="group flex items-center gap-3 rounded-full bg-slate-900 px-8 py-4 text-[10px] font-black tracking-widest text-white uppercase shadow-2xl shadow-slate-900/40 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-95 md:px-10 md:py-5 md:text-xs"
          >
            Initialize Conversation{' '}
            <MessageSquare
              className="h-4 w-4 text-pixs-mint transition-transform group-hover:rotate-12 md:h-[18px] md:w-[18px]"
            />
          </button>

          <div className="flex items-center gap-2 rounded-full border border-slate-100 px-5 py-3.5 text-[9px] font-black tracking-widest text-slate-400 uppercase italic md:px-6 md:py-4 md:text-[10px]">
            <Sparkles className="h-3.5 w-3.5 text-yellow-400 md:h-[14px] md:w-[14px]" /> Premium Quality
            Assured
          </div>
        </m.div>
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
