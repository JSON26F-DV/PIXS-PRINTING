import React from 'react'
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const DeletedAccount: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="animate-in zoom-in w-full max-w-lg rounded-[40px] border-t-8 border-rose-500 bg-white p-12 text-center shadow-2xl duration-500">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-rose-50 shadow-inner">
          <ShieldAlert size={48} className="text-rose-500" />
        </div>

        <h1 className="mb-4 text-3xl font-black tracking-tighter text-slate-900 uppercase">
          Identity Purged
        </h1>
        <p className="mb-8 leading-relaxed font-medium text-slate-500">
          The account associated with these credentials has been{' '}
          <span className="font-bold text-rose-600">permanently removed</span>{' '}
          from the active PIXS relational registry by an administrator.
        </p>

        <div className="mb-10 flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
          <AlertCircle className="mt-0.5 shrink-0 text-slate-400" size={20} />
          <div>
            <p className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              Archival Policy
            </p>
            <p className="text-sm font-semibold text-slate-600">
              User data is currently held in an immutable archive for audit
              purposes. Please contact system support for recovery protocols.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 font-black text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
        >
          <ArrowLeft size={18} />
          RETURN TO TERMINAL
        </button>
      </div>
    </div>
  )
}

export default DeletedAccount
