import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import CustomerNavbar from '../../components/customer/CustomerNavbar'
import Footer from '../../components/Footer/Footer'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await login(email, password)
      // Navigation is handled inside AuthContext.login()
    } catch (err: unknown) {
      let message = 'An unexpected error occurred during login.'
      if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CustomerNavbar />

      <main className="flex flex-grow items-center justify-center bg-slate-50 p-6">
        <div className="hover:shadow-pixs-mint/20 w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-10 shadow-2xl shadow-slate-200 transition-all">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-block rounded bg-slate-900 p-1 px-3 text-[8px] font-black tracking-widest text-white uppercase italic">
              System Authentication
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
              Marketplace <span className="text-pixs-mint">Login</span>
            </h1>
          </div>

          {error && (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-xs font-bold tracking-wider text-red-700 uppercase">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Email Node
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-slate-50 p-4 font-bold text-slate-900 transition-all outline-none focus:bg-white"
                placeholder="jason@pixs.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Security Token
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus:border-pixs-mint w-full rounded-2xl border-2 border-transparent bg-slate-50 p-4 font-bold text-slate-900 transition-all outline-none focus:bg-white"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="hover:bg-pixs-mint w-full transform rounded-2xl bg-slate-900 py-5 font-black tracking-[0.2em] text-white uppercase italic shadow-xl shadow-slate-200 transition-all hover:text-slate-900 active:scale-[0.98]"
            >
              {isSubmitting ? 'Verifying...' : 'Initiate Session'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
              Secured by PIXS CORE V2.0 <br />
              Industrial-Grade Encryption Active
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default LoginPage
