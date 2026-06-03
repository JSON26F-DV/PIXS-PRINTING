import React from 'react'
import { m } from 'framer-motion'
import {
  ChevronRight,
  Printer,
  Package,
  Activity,
  ShieldCheck,
  Cpu,
  Zap,
  ArrowRight,
  Heart,
  Star,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import CustomerNavbar from '../../components/customer/CustomerNavbar'
import Footer from '../../components/Footer/Footer'

const FloatingCard: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  yRange?: [number, number]
  rotate?: number
}> = ({
  children,
  className = '',
  delay = 0,
  duration = 4,
  yRange = [-15, 15],
  rotate = 0,
}) => (
  <m.div
    initial={{ opacity: 0, scale: 0.8, rotate: rotate - 10, y: 20 }}
    animate={{
      opacity: 1,
      scale: 1,
      rotate: rotate,
      y: 0,
    }}
    transition={{
      duration: 1,
      delay,
      ease: [0.16, 1, 0.3, 1],
    }}
    className={`absolute hidden lg:block ${className}`}
  >
    <m.div
      animate={{
        y: yRange,
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      {children}
    </m.div>
  </m.div>
)

const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="LandingPage min-h-screen bg-[#f8fafc] selection:bg-[#75EEA5] selection:text-slate-900">
      <CustomerNavbar />

      <main>
        {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 md:px-12 lg:pt-0">
          {/* Background Industrial Accents */}
          <div className="bg-[#75EEA5]/10 pointer-events-none absolute top-1/2 left-1/2 h-[80vw] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 h-full w-full opacity-[0.03] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:40px_40px]" />

          {/* Floating UI Elements Around Heading */}
          {/* 1. Product Preview Card (Top Left) */}
          <FloatingCard
            className="top-32 left-[10%]"
            delay={0.4}
            rotate={-6}
            yRange={[-10, 10]}
          >
            <div className="w-64 rounded-2xl border border-slate-200/60 bg-white p-2 shadow-xl">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100">
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5">
                  <Printer size={32} className="text-slate-300" />
                </div>
                <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 shadow-sm">
                  <Heart size={14} className="fill-rose-500 text-rose-500" />
                </div>
              </div>
              <div className="p-3">
                <div className="mb-1 text-[10px] font-black tracking-tighter text-slate-900 uppercase italic">
                  PP Matte Slim Cup
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-slate-900">
                    ₱3.50/pc
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={8}
                        className="fill-[#75EEA5] text-[#75EEA5]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>

          {/* 2. System Status Terminal (Top Right) */}
          <FloatingCard
            className="top-40 right-[12%]"
            delay={0.6}
            rotate={4}
            duration={5}
          >
            <div className="w-56 rounded-2xl border border-slate-900 bg-slate-900 p-4 shadow-2xl">
              <div className="mb-3 flex items-center gap-1.5 border-b border-white/10 pb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#75EEA5] animate-pulse" />
                <span className="text-[8px] font-mono font-bold tracking-[2px] text-[#75EEA5] uppercase">
                  LIVE_PROD_SYNC
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[7px] font-mono text-slate-400">
                  <span>PLATE_ID</span>
                  <span className="text-white">SP-4402</span>
                </div>
                <div className="flex justify-between text-[7px] font-mono text-slate-400">
                  <span>INK_LEVEL</span>
                  <span className="text-white">88%</span>
                </div>
                <div className="mt-3 h-1 w-full rounded-full bg-slate-800">
                  <m.div
                    animate={{ width: ['20%', '90%', '20%'] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="h-full rounded-full bg-[#75EEA5]"
                  />
                </div>
              </div>
            </div>
          </FloatingCard>

          {/* 3. Order Badge (Bottom Left) */}
          <FloatingCard
            className="bottom-40 left-[15%]"
            delay={0.8}
            rotate={-4}
            duration={6}
          >
            <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white/90 p-2 pr-6 shadow-lg backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#75EEA5] text-slate-900">
                <Package size={20} />
              </div>
              <div>
                <div className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                  Current Queue
                </div>
                <div className="font-mono text-xs font-black text-slate-900">
                  1,240 Units
                </div>
              </div>
            </div>
          </FloatingCard>

          {/* 4. Speed/Capacity Badge (Bottom Right) */}
          <FloatingCard
            className="bottom-48 right-[15%]"
            delay={1}
            rotate={8}
            yRange={[-20, 20]}
          >
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xl">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <Zap size={20} className="text-[#16a34a]" />
              </div>
              <div className="text-2xl font-black tracking-tighter text-slate-900 italic">
                24HR
              </div>
              <div className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                Fast Turnaround
              </div>
            </div>
          </FloatingCard>

          <m.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="relative z-10 max-w-6xl text-center"
          >
            <m.div variants={fadeInUp} className="mb-6 flex justify-center">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
                Industrial Printing Hub
              </span>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="mb-8 font-display text-5xl leading-[0.95] font-black tracking-tighter text-slate-900 uppercase italic sm:text-7xl md:text-8xl lg:text-[9rem]"
            >
              Industrial <br />
              <span className="text-slate-400 opacity-50">Precision.</span> <br />
              Every Print.
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="mx-auto mb-12 max-w-2xl text-sm leading-relaxed font-medium text-slate-500 uppercase tracking-wide md:text-lg"
            >
              The definitive substrate matrix for milk tea franchises and
              B2B packaging. High-volume screenplate manufacturing with
              technical precision.
            </m.p>

            <m.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                to="/register"
                className="group relative flex items-center gap-3 overflow-hidden rounded-[24px] bg-slate-900 px-10 py-5 text-xs font-black tracking-[4px] text-white uppercase italic shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <span className="relative z-10">Start Your Build</span>
                <ChevronRight
                  size={16}
                  className="relative z-10 transition-transform group-hover:translate-x-1"
                />
                <div className="bg-[#75EEA5] absolute inset-0 -translate-x-full transition-transform duration-500 group-hover:translate-x-0" />
              </Link>

              <button
                onClick={() => navigate('/discovery')}
                className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-10 py-5 text-xs font-black tracking-[4px] text-slate-900 uppercase italic transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
              >
                View Catalog
              </button>
            </m.div>
          </m.div>

          {/* Decorative Terminal Line at bottom */}
          <m.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="absolute bottom-10 h-[1px] bg-slate-200"
          />
        </section>

        {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
        <section className="border-y border-slate-100 bg-white py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { label: 'Units Printed', val: '12.5M+', icon: Activity },
                { label: 'Active Clients', val: '850+', icon: ShieldCheck },
                { label: 'Daily Capacity', val: '50k+', icon: Cpu },
                { label: 'Lead Time', val: '24HR', icon: Zap },
              ].map((stat, i) => (
                <div key={i} className="text-center md:text-left">
                  <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
                    <stat.icon size={14} className="text-[#16a34a]" />
                    <span className="text-[9px] font-black tracking-[3px] text-slate-400 uppercase">
                      {stat.label}
                    </span>
                  </div>
                  <div className="font-mono text-2xl font-black italic text-slate-900">
                    {stat.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CORE CAPABILITIES ─────────────────────────────────────────────── */}
        <section className="relative px-6 py-24 md:px-12 md:py-48">
          <div className="mx-auto max-w-7xl">
            <div className="mb-24 max-w-3xl">
              <h2 className="mb-6 font-display text-4xl font-black tracking-tighter text-slate-900 uppercase italic md:text-7xl">
                Manufacturing <br />
                <span className="text-slate-400 opacity-50">Core.</span>
              </h2>
              <p className="text-sm leading-relaxed font-medium text-slate-500 uppercase tracking-widest md:text-lg">
                We don\'t just print. We engineer visual identities onto industrial substrates.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: 'Screenplate Tech',
                  desc: 'Proprietary chemical etching for ultra-sharp vector reproduction on curved surfaces.',
                  icon: Printer,
                },
                {
                  title: 'Bulk Logic',
                  desc: 'Optimized for franchise-scale orders. Dynamic pricing scales with your volume.',
                  icon: Package,
                },
                {
                  title: 'Real-time Sync',
                  desc: 'Track every unit through the production terminal. Live status from ink to ship.',
                  icon: Activity,
                },
              ].map((feat, i) => (
                <m.div
                  key={i}
                  whileHover={{ y: -10 }}
                  className="group rounded-[44px] border border-slate-100 bg-white p-10 shadow-sm transition-all hover:border-[#75EEA5]/30 hover:shadow-xl"
                >
                  <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-50 transition-colors group-hover:bg-[#75EEA5]/10">
                    <feat.icon size={28} className="text-slate-900" />
                  </div>
                  <h3 className="mb-4 text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                    {feat.title}
                  </h3>
                  <p className="text-xs leading-relaxed font-medium text-slate-400 uppercase tracking-widest">
                    {feat.desc}
                  </p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SUBSTRATE MATRIX ──────────────────────────────────────────────── */}
        <section className="bg-slate-900 px-6 py-24 md:px-12 md:py-48">
          <div className="mx-auto max-w-7xl">
            <div className="mb-24 text-center">
              <h2 className="mb-6 font-display text-4xl font-black tracking-tighter text-white uppercase italic md:text-8xl">
                Substrate <br />
                <span className="text-slate-500 opacity-50">Matrix.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-2">
              <div className="relative overflow-hidden rounded-[64px] bg-slate-800 p-12 md:col-span-8 md:row-span-1">
                <div className="relative z-10 max-w-md">
                  <h3 className="mb-4 text-3xl font-black tracking-tighter text-white uppercase italic">
                    PP & PET Cups
                  </h3>
                  <p className="mb-8 text-xs font-medium text-slate-400 uppercase tracking-widest">
                    The industry standard. Available in 12oz to 22oz with matte or glossy finish.
                  </p>
                  <button
                    onClick={() => navigate('/discovery')}
                    className="flex items-center gap-2 text-[10px] font-black tracking-[4px] text-[#75EEA5] uppercase italic cursor-pointer"
                  >
                    Configure <ArrowRight size={14} />
                  </button>
                </div>
                <div className="bg-[#75EEA5]/20 absolute -right-20 -bottom-20 h-80 w-80 rounded-full blur-[80px]" />
              </div>

              <div className="relative overflow-hidden rounded-[64px] bg-slate-800 p-12 md:col-span-4 md:row-span-2">
                <h3 className="mb-4 text-3xl font-black tracking-tighter text-white uppercase italic">
                  Bulk <br /> Boxes
                </h3>
                <p className="mb-8 text-xs font-medium text-slate-400 uppercase tracking-widest">
                  Custom corrugated solutions for transit and delivery.
                </p>
                <div className="absolute bottom-12 left-12 right-12 top-48 rounded-[32px] border border-slate-700 bg-slate-900/50" />
                <button
                  onClick={() => navigate('/discovery')}
                  className="absolute bottom-12 right-12 flex h-12 w-12 items-center justify-center rounded-full bg-[#75EEA5] text-slate-900 transition-transform hover:scale-110 active:scale-90"
                >
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-[64px] bg-[#75EEA5] p-12 md:col-span-4 md:row-span-1">
                <h3 className="mb-4 text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Eco <br /> Bags
                </h3>
                <button
                  onClick={() => navigate('/discovery')}
                  className="mt-4 h-12 w-12 rounded-full bg-slate-900 text-[#75EEA5] flex items-center justify-center transition-transform hover:scale-110 active:scale-90"
                >
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-[64px] bg-slate-800 p-12 md:col-span-4 md:row-span-1">
                <h3 className="mb-4 text-3xl font-black tracking-tighter text-white uppercase italic">
                  Paper <br /> Lids
                </h3>
                <button
                  onClick={() => navigate('/discovery')}
                  className="mt-4 flex items-center gap-2 text-[10px] font-black tracking-[4px] text-[#75EEA5] uppercase italic cursor-pointer"
                >
                  Configure <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
        <section className="px-6 py-24 text-center md:px-12 md:py-48">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl rounded-[64px] bg-white p-16 shadow-2xl border border-slate-100"
          >
            <h2 className="mb-8 font-display text-4xl font-black tracking-tighter text-slate-900 uppercase italic md:text-7xl">
              Ready to <br />
              <span className="text-[#16a34a]">Deploy?</span>
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-sm font-medium text-slate-500 uppercase tracking-widest">
              Join 800+ businesses optimizing their supply chain with PIXS.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-4 rounded-[28px] bg-slate-900 px-12 py-6 text-sm font-black tracking-[4px] text-white uppercase italic transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              Initialize Account
            </Link>
          </m.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage
