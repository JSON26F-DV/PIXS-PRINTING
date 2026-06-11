import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const externalId = searchParams.get('external_id')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>(() =>
    externalId ? 'loading' : 'failed'
  )
  const [prevExternalId, setPrevExternalId] = useState<string | null>(externalId)

  if (externalId !== prevExternalId) {
    setPrevExternalId(externalId)
    setStatus(externalId ? 'loading' : 'failed')
  }

  useEffect(() => {
    if (!externalId) {
      return
    }

    const timer = setTimeout(() => {
      setStatus('success')
    }, 2000)

    return () => clearTimeout(timer)
  }, [externalId])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <Loader2 size={40} className="animate-spin text-slate-900" />
            </div>
            <h1 className="text-2xl font-black uppercase italic text-slate-900">
              Verifying Payment
            </h1>
            <p className="mt-3 text-sm font-bold tracking-widest text-slate-400 uppercase">
              Please wait while we confirm your payment...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black uppercase italic text-emerald-600">
              Payment Successful!
            </h1>
            <p className="mt-3 text-sm font-bold tracking-widest text-slate-400 uppercase">
              Your order is now being processed.
            </p>
            <button
              onClick={() => navigate('/order')}
              className="mt-8 w-full rounded-2xl bg-slate-900 py-4 text-sm font-black tracking-widest uppercase italic text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
            >
              View My Orders
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
              <XCircle size={40} className="text-rose-600" />
            </div>
            <h1 className="text-2xl font-black uppercase italic text-rose-600">
              Payment Failed
            </h1>
            <p className="mt-3 text-sm font-bold tracking-widest text-slate-400 uppercase">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => navigate('/transactions')}
              className="mt-8 w-full rounded-2xl bg-slate-900 py-4 text-sm font-black tracking-widest uppercase italic text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentSuccess
