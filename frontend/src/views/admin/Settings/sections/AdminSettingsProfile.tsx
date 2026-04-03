import React, { useState } from 'react';
import { Camera, Mail, Shield, Briefcase, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const AdminSettingsProfile: React.FC = () => {
  const { user } = useAuth();
  
  // Safe extraction of name parts
  const nameParts = (user?.name || '').split(' ');
  const safeFirstName = nameParts[0] || '';
  const safeLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const [formData, setFormData] = useState({
    firstName: safeFirstName,
    lastName: safeLastName,
    email: user?.email || 'admin@pixs.com',
    role: user?.role || 'admin',
    contactNumbers: [
      { number: '+63 912 345 6789', isDefault: true },
      { number: '+63 917 200 1001', isDefault: false }
    ]
  });

  const [profilePic] = useState('https://i.pravatar.cc/300?img=11');

  const handleSave = () => {
    toast.success('Admin Profile Node Updated');
  };

  return (
    <div className="AdminSettingsProfile space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="relative group">
          <div className="w-32 h-32 rounded-[32px] bg-slate-100 overflow-hidden border-4 border-white shadow-xl">
             <img src={profilePic} alt="Admin" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="text-white" size={24} />
             </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-pixs-mint flex items-center justify-center text-slate-900 shadow-lg border-4 border-white">
             <Shield size={18} />
          </div>
        </div>

        <div className="flex-1 space-y-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Identification First Name</label>
              <input 
                type="text" 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-pixs-mint focus:ring-4 focus:ring-pixs-mint/5 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Identification Last Name</label>
              <input 
                type="text" 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-pixs-mint focus:ring-4 focus:ring-pixs-mint/5 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Communication Email</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-pixs-mint focus:ring-4 focus:ring-pixs-mint/5 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-50" />

      {/* Role & Access Section */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Command Hierarchy Role</label>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-pixs-mint shadow-lg">
                  <Briefcase size={20} />
               </div>
               <div>
                  <p className="text-xs font-black uppercase text-slate-900 tracking-tight">{formData.role}</p>
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Full Administrative Authority</p>
               </div>
            </div>
            <span className="px-3 py-1 bg-pixs-mint/10 text-pixs-mint text-[8px] font-black uppercase tracking-widest rounded-lg">Immutable</span>
          </div>
        </div>
        <p className="text-[9px] font-bold text-slate-400 flex items-center gap-2 italic">
           <AlertCircle size={10} />
           Your role is locked to Super Admin status for this session projection.
        </p>
      </div>

      <div className="h-px bg-slate-50" />

      {/* Contact Nodes */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Registered Contact Nodes</label>
          <button className="flex items-center gap-2 text-[9px] font-black uppercase text-pixs-mint hover:scale-105 transition-transform">
             <Plus size={14} /> Add Node
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {formData.contactNumbers.map((num, i) => (
             <div key={i} className={clsx(
               "p-5 rounded-2xl border transition-all flex items-center justify-between group",
               num.isDefault ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/10" : "bg-white border-slate-100 hover:border-slate-200"
             )}>
                <div className="flex items-center gap-4">
                   <div className={clsx(
                     "w-10 h-10 rounded-xl flex items-center justify-center",
                     num.isDefault ? "bg-white/10 text-pixs-mint" : "bg-slate-50 text-slate-400"
                   )}>
                      {num.isDefault ? <Check size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                   </div>
                   <div>
                      <p className={clsx("text-sm font-black tracking-tight", num.isDefault ? "text-white" : "text-slate-900")}>{num.number}</p>
                      <p className={clsx("text-[8px] font-bold uppercase tracking-widest mt-1", num.isDefault ? "text-slate-400" : "text-slate-400")}>
                        {num.isDefault ? "Primary Comm-Node" : "Backup Link"}
                      </p>
                   </div>
                </div>
                {!num.isDefault && (
                  <button className="p-2 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-500 transition-all">
                    <Trash2 size={16} />
                  </button>
                )}
             </div>
           ))}
        </div>
      </div>

      <div className="pt-6">
        <button 
          onClick={handleSave}
          className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[3px] text-xs shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
        >
          Initialize Update Sequence
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsProfile;
