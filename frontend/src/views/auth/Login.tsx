import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('jason@pixs.ph');
  const [password, setPassword] = useState('topsecret123');
  const [role, setRole] = useState<'admin' | 'staff' | 'inventory' | 'customer'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const ROLE_REDIRECTS: Record<string, string> = {
    admin: '/admin/dashboard',
    staff: '/staff/overview',
    inventory: '/inventory/dashboard',
    customer: '/',
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock auth — swap for real API call when backend is ready
    setTimeout(() => {
      login({
        name: role === 'admin' ? 'Jason Admin' : `Jason ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role: role,
      });
      setIsLoading(false);
      // ✅ Instant SPA redirect — no hard refresh
      navigate(ROLE_REDIRECTS[role], { replace: true });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pixs-mint/10 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-900/5 rounded-full blur-3xl -ml-48 -mb-48" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[48px] shadow-2xl overflow-hidden border border-slate-200 relative z-10"
      >
        {/* Left Side: Brand/Visual */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 border-4 border-pixs-mint rounded-full" />
             <div className="absolute bottom-20 right-10 w-20 h-20 bg-pixs-mint rounded-full" />
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-pixs-mint flex items-center justify-center text-slate-900 font-black text-2xl rounded-2xl mb-8">
              P
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-tight">
              PIXS <span className="text-slate-400">SHOP</span><br />
              <span className="text-pixs-mint">OPERATING SYSTEM</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 mt-6 uppercase tracking-[4px]">Mission Control v8.0</p>
          </div>

          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-pixs-mint" size={20} />
                <p className="text-xs font-bold text-slate-300">Secure AES-256 Encrypted Access</p>
             </div>
             <p className="text-[10px] text-slate-500 font-mono italic">
               Unauthorized access is strictly monitored. 
               By logging in, you agree to the Pixs Printing Shop security protocols.
             </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Terminal</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Enter credentials to initialize shift.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Identity Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pixs-mint transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-pixs-mint focus:ring-4 focus:ring-pixs-mint/5 placeholder:text-slate-300 transition-all"
                  placeholder="name@pixs.ph"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Security Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pixs-mint transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold focus:outline-none focus:border-pixs-mint focus:ring-4 focus:ring-pixs-mint/5 placeholder:text-slate-300 transition-all"
                  placeholder="••••••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-pixs-mint focus:ring-pixs-mint shadow-sm" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Remember Node</span>
              </label>
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-pixs-mint hover:scale-105 transition-transform">Forgot Key?</a>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Access Level</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {(['admin', 'staff', 'inventory', 'customer'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      role === r 
                        ? "bg-pixs-mint border-pixs-mint text-slate-900 shadow-lg shadow-pixs-mint/20" 
                        : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white rounded-[24px] py-4 font-black uppercase tracking-[3px] text-xs shadow-2xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Initialize System <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Trouble logging in? Contact <span className="text-pixs-mint">Systems Admin</span><br />
            Are you a customer? <a href="/" className="text-pixs-mint underline hover:text-pixs-mint/80 transition-colors">Return to Storefront</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
