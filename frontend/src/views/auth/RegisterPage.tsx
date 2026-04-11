import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  Users, 
  Calendar, 
  Building2, 
  Hash,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerNavbar from '../../components/customer/CustomerNavbar';
import Footer from '../../components/Footer/Footer';
import type { RoleType } from '../../context/auth.types';

/**
 * RegisterPage Interface for Form State
 * Aligned with Laravel Migration Schemas (Employees & Customers)
 */
interface RegistrationState {
  account_type: 'customer' | 'employee';
  first_name: string;
  last_name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  company_name: string;
  password: string;
  password_confirmation: string;
  // Employee specific fields
  role: RoleType;
  daily_rate: number;
  ot_rate: number;
}

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<RegistrationState>({
        account_type: 'customer',
        first_name: '',
        last_name: '',
        email: '',
        age: 21,
        gender: 'male',
        company_name: '',
        password: '',
        password_confirmation: '',
        role: 'staff',
        daily_rate: 0,
        ot_rate: 0
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    // Real-time password validation logic
    useEffect(() => {
        if (formData.password_confirmation && formData.password !== formData.password_confirmation) {
            setPasswordsMatch(false);
        } else {
            setPasswordsMatch(true);
        }
    }, [formData.password, formData.password_confirmation]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'age' || name === 'daily_rate' || name === 'ot_rate' ? Number(value) : value
        }));
    };

    const handleAccountTypeChange = (type: 'customer' | 'employee') => {
        setFormData(prev => ({ ...prev, account_type: type }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!passwordsMatch) {
            setError("Security Protocol Violation: Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        // Prepare payload based on account type
        const payload = {
            ...formData,
            status: 'active', // Default status for new registrations
            // UUID is handled by backend as per migration $table->uuid('id')
        };

        try {
            await axios.post('/register', payload);

            // Successfully registered
            // Redirect to login or auto-login depending on backend implementation
            navigate('/login');
            
        } catch (err: unknown) {
            let message = 'An unexpected error occurred during system enrollment.';
            
            if (axios.isAxiosError(err) && err.response && err.response.data) {
                const data = err.response.data as { message?: string; errors?: Record<string, string[]> };
                // Use standardized error message or validation errors
                message = data.message || message;
                
                if (data.errors) {
                    const validationErrors = Object.values(data.errors).flat().join(' ');
                    message = `${message}: ${validationErrors}`;
                }
            } else if (err instanceof Error) {
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
            
            <main className="flex-grow flex items-center justify-center p-6 bg-slate-50 py-20 bg-emoji-pattern">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden"
                >
                    <div className="grid grid-cols-1 md:grid-cols-5 min-h-[700px]">
                        {/* Sidebar: Status & Info */}
                        <div className="md:col-span-2 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 border-[40px] border-pixs-mint rounded-full" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-pixs-mint flex items-center justify-center text-slate-900 font-black text-2xl rounded-2xl mb-8 shadow-lg shadow-pixs-mint/30">
                                    P
                                </div>
                                <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-4">
                                    System <span className="text-pixs-mint">Enrollment</span>
                                </h1>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[4px] mb-12">Registry Node v2.4.0</p>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-pixs-mint group-hover:text-slate-900 transition-all">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Selected Guard</p>
                                            <p className="font-bold text-sm italic uppercase">{formData.account_type === 'employee' ? 'Employee Terminal' : 'Customer Account'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                                            <ShieldCheck size={18} className="text-pixs-mint" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Integrity</p>
                                            <p className="font-bold text-sm italic uppercase">AES-256 Auth Layers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[2px] mb-2 italic">
                                    Note: Passwords are hashed using Argon2id/Bcrypt on the PIXS Core Backend.
                                </p>
                                <div className="h-1 w-20 bg-pixs-mint/20 rounded-full" />
                            </div>
                        </div>

                        {/* Main Form Area */}
                        <div className="md:col-span-3 p-10 md:p-14 flex flex-col">
                            <div className="mb-10 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Identity Creation</h2>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[3px]">Provide credentials for matrix access.</p>
                                </div>
                                
                                <div className="flex bg-slate-100 p-1 rounded-2xl">
                                    <button 
                                        type="button"
                                        onClick={() => handleAccountTypeChange('customer')}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.account_type === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                    >Customer</button>
                                    <button 
                                        type="button"
                                        onClick={() => handleAccountTypeChange('employee')}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.account_type === 'employee' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                    >Employee</button>
                                </div>
                            </div>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                                >
                                    <AlertCircle size={16} />
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">First Name Node</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input 
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:border-pixs-mint focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                                placeholder="Jason"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Last Name Node</label>
                                        <input 
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 px-4 text-sm font-bold focus:border-pixs-mint focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                            placeholder="Derulo"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Email Terminal</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input 
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:border-pixs-mint focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                            placeholder="jason.os@pixs.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Age</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input 
                                                name="age"
                                                type="number"
                                                value={formData.age}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:border-pixs-mint focus:bg-white outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Gender Node</label>
                                        <select 
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 px-4 text-sm font-bold focus:border-pixs-mint focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Company Node (Optional)</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input 
                                            name="company_name"
                                            value={formData.company_name}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:border-pixs-mint focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                            placeholder="Cyberdyne Systems"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Employee Fields */}
                                <AnimatePresence mode="wait">
                                    {formData.account_type === 'employee' && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-6 pt-2 overflow-hidden"
                                        >
                                            <div className="p-4 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 space-y-4">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[4px] text-center mb-2 italic">Compensation & Role Metadata</p>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Access Role</label>
                                                    <select 
                                                        name="role"
                                                        value={formData.role}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-white border-2 border-transparent rounded-2xl py-3 px-4 text-sm font-bold focus:border-pixs-mint outline-none transition-all"
                                                    >
                                                        <option value="staff">Staff</option>
                                                        <option value="technician">Technician</option>
                                                        <option value="welder">Welder</option>
                                                        <option value="inventory">Inventory</option>
                                                        <option value="admin">Administrator</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Daily Rate</label>
                                                        <div className="relative">
                                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                            <input 
                                                                name="daily_rate"
                                                                type="number"
                                                                value={formData.daily_rate}
                                                                onChange={handleInputChange}
                                                                className="w-full bg-white border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:border-pixs-mint outline-none transition-all"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">OT Rate</label>
                                                        <div className="relative">
                                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                            <input 
                                                                name="ot_rate"
                                                                type="number"
                                                                value={formData.ot_rate}
                                                                onChange={handleInputChange}
                                                                className="w-full bg-white border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:border-pixs-mint outline-none transition-all"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Security Key</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pixs-mint" size={16} />
                                            <input 
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3 pl-12 pr-12 text-sm font-bold focus:border-pixs-mint focus:bg-white outline-none transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 italic font-mono">Verify Sequence</label>
                                        <div className="relative">
                                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${passwordsMatch ? 'text-pixs-mint' : 'text-red-400'}`}>
                                                {passwordsMatch && formData.password_confirmation ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                                            </div>
                                            <input 
                                                name="password_confirmation"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password_confirmation}
                                                onChange={handleInputChange}
                                                className={`w-full bg-slate-50 border-2 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none transition-all ${passwordsMatch ? 'border-transparent focus:border-pixs-mint focus:bg-white' : 'border-red-500/30'}`}
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSubmitting || !passwordsMatch}
                                    className="w-full py-5 bg-slate-900 text-white font-black uppercase italic tracking-[0.3em] rounded-3xl hover:bg-pixs-mint hover:text-slate-900 transition-all transform active:scale-[0.98] shadow-2xl shadow-slate-200 mt-4 flex items-center justify-center gap-4 group disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Execute Enrollment <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">
                                    Already have a node? <Link to="/login" className="text-pixs-mint hover:underline underline-offset-4">Initialize Login</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default RegisterPage;