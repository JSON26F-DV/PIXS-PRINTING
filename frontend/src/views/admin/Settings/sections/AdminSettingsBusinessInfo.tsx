import React, { useState } from 'react';
import { Phone, MapPin, Clock, Camera, Globe, ExternalLink, Info } from 'lucide-react';
import { SafeTerminal } from '../../../../utils/safeTerminal';
import initialConfig from '../../../../data/settings_config.json';
import toast from 'react-hot-toast';

interface BusinessConfig {
  company_name: string;
  company_logo: string;
  business_address: string;
  contact_email: string;
  support_phone: string;
  business_hours: string;
}

const AdminSettingsBusinessInfo: React.FC = () => {
  const [config, setConfig] = useState<BusinessConfig>(SafeTerminal.object<BusinessConfig>(initialConfig.business));

  const handleUpdate = (field: keyof BusinessConfig, value: string) => {
    setConfig({...config, [field]: value});
  };

  const handleSave = () => {
    toast.success('Global Business Config Synchronized');
  };

  return (
    <div className="AdminSettingsBusinessInfo space-y-10">
      {/* Brand Visual Identity */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-pixs-mint/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-pixs-mint/10 transition-all duration-700" />
         
         <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
            <div className="relative group/logo">
              <div className="w-32 h-32 rounded-[32px] bg-white/10 backdrop-blur-xl border-2 border-white/20 overflow-hidden shadow-2xl">
                 <img src={config.company_logo} alt="Logo" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="text-white" size={24} />
                 </div>
              </div>
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-pixs-mint text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                 GLOBAL LOGO
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
               <h3 className="text-3xl font-black tracking-tight italic uppercase">{config.company_name}</h3>
               <p className="text-pixs-mint/60 font-bold text-[10px] uppercase tracking-[4px] mt-2">Enterprise Printing Infrastructure</p>
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase text-white/40">
                     <Globe size={14} className="text-pixs-mint" /> pixs-shop-os-v8.terminal
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase text-white/40">
                     <Clock size={14} className="text-pixs-mint" /> System Uptime: 99.9%
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Infrastructure */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <Phone size={16} />
             </div>
             <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">Contact Infrastructure</h4>
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[1px] text-slate-400">Business Support Phone</label>
                <input 
                  type="text" 
                  value={config.support_phone}
                  onChange={(e) => handleUpdate('support_phone', e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-pixs-mint focus:ring-4 focus:ring-pixs-mint/5 transition-all"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[1px] text-slate-400">Business Support Email</label>
                <input 
                  type="email" 
                  value={config.contact_email}
                  onChange={(e) => handleUpdate('contact_email', e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-pixs-mint focus:ring-4 focus:ring-pixs-mint/5 transition-all"
                />
             </div>
          </div>
        </div>

        {/* Operational Nodes */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <MapPin size={16} />
             </div>
             <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">Operational Nodes</h4>
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[1px] text-slate-400">Physical Business Address</label>
                <textarea 
                  value={config.business_address}
                  onChange={(e) => handleUpdate('business_address', e.target.value)}
                  rows={1}
                  className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-pixs-mint focus:ring-4 focus:ring-pixs-mint/5 transition-all resize-none"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[1px] text-slate-400">Active Business Hours</label>
                <input 
                  type="text" 
                  value={config.business_hours}
                  onChange={(e) => handleUpdate('business_hours', e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-pixs-mint focus:ring-4 focus:ring-pixs-mint/5 transition-all"
                />
             </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex gap-4">
         <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm shrink-0">
            <Info size={24} />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 mb-1">Global Configuration Impact</p>
            <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
               Changes to business information will propagate across the <span className="text-slate-900">Footer</span>, <span className="text-slate-900">Messenger</span>, <span className="text-slate-900">Invoices</span>, and <span className="text-slate-900">Order Receipts</span> in real-time.
            </p>
         </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          onClick={handleSave}
          className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[3px] text-xs shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Propagate Global Config <ExternalLink size={16} />
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsBusinessInfo;
