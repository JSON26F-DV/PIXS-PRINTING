import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, Clock, History, Key } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminSettingsSecurity: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [requirePassForDelete, setRequirePassForDelete] = useState(true);

  // Mock Login History
  const loginHistory = [
    { device: 'Desktop Chrome / Windows', ip: '192.168.1.1', timestamp: new Date().toISOString(), status: 'Current Session' },
    { device: 'Mobile Safari / iOS', ip: '110.54.23.144', timestamp: '2026-04-01T08:15:00Z', status: 'Authorized' },
    { device: 'Desktop Firefox / Linux', ip: '172.16.0.42', timestamp: '2026-03-31T22:40:00Z', status: 'Terminated' }
  ];

  const handleUpdateSecurity = () => {
    toast.success('Security Protocol Updated');
  };

  return (
    <div className="AdminSettingsSecurity space-y-10">
      {/* Change Password Node */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-pixs-mint shadow-lg">
              <Key size={18} />
           </div>
           <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">Credential Rotation</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[32px] border border-slate-100">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[1px] text-slate-400">Current Security Key</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold focus:outline-none focus:border-pixs-mint transition-all"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[1px] text-slate-400">New Security Key</label>
              <input 
                type="password" 
                placeholder="Initialize new key..."
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-pixs-mint transition-all"
              />
           </div>
           <div className="md:col-span-2 flex justify-end">
              <button 
                onClick={handleUpdateSecurity}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-800 transition-all active:scale-95"
              >
                Rotate Security Key
              </button>
           </div>
        </div>
      </div>

      {/* Advanced Protocol Toggles */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-100">
              <ShieldAlert size={18} />
           </div>
           <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">Operational Security Protocols</h4>
        </div>

        <div className="space-y-3">
           {[
             { 
               id: 'timeout', 
               title: 'Inactivity Session Termination', 
               desc: 'Automatically logout after 30 minutes of node inactivity.',
               state: sessionTimeout,
               setter: setSessionTimeout
             },
             { 
               id: 'pass_req', 
               title: 'Destructive Action Authorization', 
               desc: 'Require security key before deleting products, users, or clearing logs.',
               state: requirePassForDelete,
               setter: setRequirePassForDelete
             }
           ].map((item) => (
             <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-pixs-mint/30 transition-all">
                <div className="space-y-1">
                   <p className="text-sm font-black uppercase tracking-tight text-slate-900">{item.title}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[400px]">
                      {item.desc}
                   </p>
                </div>
                <button 
                  onClick={() => item.setter(!item.state)}
                  className={clsx(
                    "w-12 h-6 rounded-full relative transition-all duration-300",
                    item.state ? "bg-pixs-mint" : "bg-slate-200"
                  )}
                >
                   <div className={clsx(
                     "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                     item.state ? "left-7 shadow-sm" : "left-1"
                   )} />
                </button>
             </div>
           ))}
        </div>
      </div>

      {/* Session History Node */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-100">
              <History size={18} />
           </div>
           <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">Access Node History</h4>
        </div>

        <div className="overflow-hidden border border-slate-100 rounded-[24px]">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Terminal / Device</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">IP Link</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loginHistory.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-5">
                          <p className="text-xs font-black text-slate-900">{log.device}</p>
                       </td>
                       <td className="px-6 py-5">
                          <code className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-600 font-bold">{log.ip}</code>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-400">
                             <Clock size={12} />
                             <span className="text-[10px] font-bold">
                                {(() => {
                                   try {
                                      return format(new Date(log.timestamp), 'MMM dd, HH:mm');
                                   } catch (e) {
                                      return 'Invalid Date';
                                   }
                                })()}
                             </span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className={clsx(
                            "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                            log.status === 'Current Session' ? "bg-pixs-mint/20 text-slate-900" : "bg-slate-100 text-slate-400"
                          )}>
                             {log.status}
                          </span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsSecurity;
