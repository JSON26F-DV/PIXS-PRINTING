import React from 'react';
import Footer from '../../components/Footer/Footer';
import CustomerNavbar from '../../components/customer/CustomerNavbar';

const LandingPage: React.FC = () => {
  return (
    <div className="LandingPage flex flex-col min-h-screen bg-white">
      <CustomerNavbar />
      
      <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background Industrial Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-pixs-mint/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-8">
          <div className="inline-block py-2 px-6 border-2 border-slate-900 rounded-full mb-4">
            <span className="text-[10px] font-black uppercase tracking-[6px] text-slate-900 italic">Access Protocol: GUEST</span>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black text-slate-900 uppercase italic tracking-tighter leading-none animate-in fade-in slide-in-from-bottom-8 duration-700">
            Hello World
          </h1>
          
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.4em] max-w-md mx-auto leading-relaxed">
            Synchronizing visitor identification node. <br/>
            Please authenticate to access full marketplace terminal.
          </p>
        </div>
      </main>

      <Footer />    
    </div>
  );
};

export default LandingPage;
