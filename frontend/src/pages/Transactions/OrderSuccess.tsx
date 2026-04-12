import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  ArrowRight,
  Printer,
  Package,
  ShieldCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  return (
    <div className="OrderSuccessPage flex min-h-screen items-center justify-center bg-slate-50 p-6 lg:p-16">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[64px] border border-slate-100 bg-white p-12 shadow-[0_60px_100px_-30px_rgba(0,0,0,0.1)] lg:p-24">
        {/* Decorative Background Elements */}
        <div className="bg-pixs-mint/10 absolute top-0 right-0 -mt-32 -mr-32 h-80 w-80 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 -mb-32 -ml-32 h-80 w-80 rounded-full bg-slate-100 blur-[80px]" />

        <div className="relative z-10 flex flex-col items-center space-y-10 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="text-pixs-mint flex h-24 w-24 items-center justify-center rounded-[32px] bg-slate-900 shadow-2xl"
          >
            <CheckCircle size={48} strokeWidth={2.5} />
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-4xl leading-none font-black tracking-tighter text-slate-900 uppercase italic lg:text-6xl">
              Order Sequence <br /> Initialized.
            </h1>
            <p className="text-sm leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
              Your production nodes have been successfully deployed into the
              queue hub.
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-6 rounded-[32px] border border-slate-100/50 bg-slate-50 p-8 shadow-inner">
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-[5px] text-slate-400 uppercase italic">
                Transaction Node Identifier
              </p>
              <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                {orderId}
              </h3>
            </div>

            <div className="flex items-center gap-6 text-[10px] font-black tracking-widest text-slate-900 uppercase italic opacity-60">
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

          <div className="flex w-full flex-col gap-6 pt-8 sm:flex-row">
            <button
              onClick={() => navigate('/')}
              className="flex flex-1 items-center justify-center gap-3 rounded-[32px] bg-slate-900 py-6 text-xs font-black tracking-widest text-white uppercase italic shadow-xl transition-all hover:scale-[1.02] active:scale-95"
            >
              Return to Hub <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/settings?section=orders')}
              className="flex flex-1 items-center justify-center gap-3 rounded-[32px] border border-slate-100 bg-white py-6 text-xs font-black tracking-widest text-slate-900 uppercase italic shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              Track Deployment Node
            </button>
          </div>

          <div className="flex items-center gap-3 text-[9px] font-black tracking-[4px] text-slate-400 uppercase italic opacity-50">
            <ShieldCheck size={14} />
            Industrial Transaction Verification Node: STABLE
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess
