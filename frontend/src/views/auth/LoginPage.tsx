import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import CustomerNavbar from '../../components/customer/CustomerNavbar';
import Footer from '../../components/Footer/Footer';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { login } = useAuth();


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await login(email, password);
            // Navigation is handled inside AuthContext.login()
        } catch (err: unknown) {
            let message = 'An unexpected error occurred during login.';
            if (err instanceof Error) {
                message = err.message;
            }
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <CustomerNavbar />
            
            <main className="flex-grow flex items-center justify-center p-6 bg-slate-50">
                <div className="max-w-md w-full bg-white p-10 rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 transition-all hover:shadow-pixs-mint/20">
                    <div className="text-center mb-10">
                        <div className="inline-block p-1 px-3 bg-slate-900 text-[8px] font-black text-white uppercase italic tracking-widest rounded mb-4">
                            System Authentication
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
                            Marketplace <span className="text-pixs-mint">Login</span>
                        </h1>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-wider">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Email Node</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-pixs-mint focus:bg-white outline-none transition-all font-bold text-slate-900"
                                placeholder="jason@pixs.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Security Token</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-pixs-mint focus:bg-white outline-none transition-all font-bold text-slate-900"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-5 bg-slate-900 text-white font-black uppercase italic tracking-[0.2em] rounded-2xl hover:bg-pixs-mint hover:text-slate-900 transition-all transform active:scale-[0.98] shadow-xl shadow-slate-200"
                        >
                            {isSubmitting ? 'Verifying...' : 'Initiate Session'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Secured by PIXS CORE V2.0 <br/>
                            Industrial-Grade Encryption Active
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default LoginPage;
