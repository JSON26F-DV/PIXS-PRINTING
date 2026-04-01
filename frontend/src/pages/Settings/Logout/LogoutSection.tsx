import React, { useState } from 'react';
import { FiLogOut, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const LogoutSection: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <section className="SettingsLogout space-y-4">
      <div className="rounded-[20px] border border-red-100 bg-red-50/50 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100">
            <FiAlertTriangle size={18} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
              Logout
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-slate-500">
              You will be signed out of your current session and returned to the homepage.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-red-200 transition-all hover:bg-red-600 hover:scale-105 active:scale-95"
          >
            <FiLogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 z-[201] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <FiLogOut size={28} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
                    Confirm Logout
                  </h3>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    Are you sure you want to sign out?
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-slate-100 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-2xl bg-red-500 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:bg-red-600 active:scale-95"
                >
                  Yes, Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
};

export default LogoutSection;
