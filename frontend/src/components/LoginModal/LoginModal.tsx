import React, { useState } from 'react';
import { X, ShieldCheck, Mail } from 'lucide-react';
import { FaFacebookF } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [agreed, setAgreed] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        key="login-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
        >
          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pixs-mint/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-900"
          >
            <X size={20} />
          </button>

          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-slate-200">
            <ShieldCheck className="text-pixs-mint" size={32} />
          </div>

          <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Production Portal</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Identify your terminal credentials</p>

          <div className="w-full space-y-4 mb-8">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={() => {
                  if (import.meta.env.DEV) {
                    console.log('[Auth] Google OAuth successful');
                  }
                  login({ id: 'CUST-SOC-001', name: 'Social User', role: 'customer' });
                  onClose();
                }}
                onError={() => {
                  if (import.meta.env.DEV) {
                    console.log('[Auth] Google OAuth failed');
                  }
                }}
              />
            </div>

            <FacebookLogin
              appId="YOUR_FACEBOOK_APP_ID"
              callback={() => {
                if (import.meta.env.DEV) {
                  console.log('[Auth] Facebook OAuth successful');
                }
                login({ id: 'CUST-SOC-002', name: 'Facebook User', role: 'customer' });
                onClose();
              }}
              render={(renderProps) => (
                <button 
                  onClick={renderProps.onClick}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#1877F2] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  <FaFacebookF size={16} fill="white" /> Sign in with Facebook
                </button>
              )}
            />

            <Link to="/login" className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20">
              <Mail size={16} /> Credential Login
            </Link>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 text-pixs-mint focus:ring-pixs-mint"
              />
              <span className="text-[9px] font-bold text-slate-500 uppercase text-left leading-tight">
                I agree to the <span className="text-slate-900 underline underline-offset-2">Terms of Service</span> and industrial data protocols.
              </span>
            </label>

            <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-pixs-mint transition-colors self-center">
              Forgot Access Credentials?
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoginModal;
