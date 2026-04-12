import React from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../components/Footer/Footer'
import CustomerNavbar from '../../components/customer/CustomerNavbar'

const LandingPage: React.FC = () => {
  return (
    <div className="LandingPage flex min-h-screen flex-col bg-white">
      <CustomerNavbar />

      <main className="relative flex flex-grow flex-col items-center justify-center overflow-hidden p-6 md:p-12">
        {/* Background Industrial Accents */}
        <div className="bg-pixs-mint/5 pointer-events-none absolute top-1/2 left-1/2 h-[80vw] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />

        <div className="relative z-10 space-y-8 text-center">
          <div className="mb-4 inline-block rounded-full border-2 border-slate-900 px-6 py-2">
            <span className="text-[10px] font-black tracking-[6px] text-slate-900 uppercase italic">
              Access Protocol: GUEST
            </span>
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom-8 text-6xl leading-none font-black tracking-tighter text-slate-900 uppercase italic duration-700 md:text-9xl">
            Hello World
          </h1>

          <p className="mx-auto max-w-md text-[10px] leading-relaxed font-bold tracking-[0.4em] text-slate-400 uppercase md:text-xs">
            Synchronizing visitor identification node. <br />
            Please authenticate to access full marketplace terminal.
          </p>

          <div className="pt-4">
            <Link
              to="/login"
              className="hover:bg-pixs-mint inline-block transform rounded-full bg-slate-900 px-12 py-4 font-black tracking-[0.2em] text-white uppercase italic shadow-xl transition-all hover:scale-105 hover:text-slate-900"
            >
              Sign In to Terminal
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage
