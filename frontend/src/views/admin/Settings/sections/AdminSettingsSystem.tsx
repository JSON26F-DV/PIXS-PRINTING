import React, { useState } from 'react';
import { Settings, DollarSign, Percent, Truck, RotateCcw, Layers } from 'lucide-react';
import { SafeTerminal } from '../../../../utils/safeTerminal';
import initialSettings from '../../../../data/admin_settings.json';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface SystemSettings {
  currency: string;
  tax_percentage: number;
  delivery_fee: number;
  auto_complete_orders: boolean;
  allow_discount_stacking: boolean;
  [key: string]: string | number | boolean;
}

const AdminSettingsSystem: React.FC = () => {
  const [system, setSystem] = useState<SystemSettings>(SafeTerminal.object<SystemSettings>(initialSettings.system));

  const handleUpdate = (field: string, value: string | number | boolean) => {
    setSystem({...system, [field]: value});
  };

  const handleSave = () => {
    toast.success('System Operational Constants Updated');
  };

  return (
    <div className="AdminSettingsSystem space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Financial Constants */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                 <DollarSign size={16} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">Financial Constants</h4>
           </div>

           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[1px] text-slate-400">Global Currency Signifier</label>
                 <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">{system.currency}</div>
                    <select 
                      value={system.currency}
                      onChange={(e) => handleUpdate('currency', e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:outline-none focus:border-pixs-mint transition-all appearance-none"
                    >
                       <option value="₱">PHP (₱)</option>
                       <option value="$">USD ($)</option>
                       <option value="€">EUR (€)</option>
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[1px] text-slate-400">Tax Multiplier (%)</label>
                    <div className="relative">
                       <Percent className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                       <input 
                         type="number" 
                         value={system.tax_percentage}
                         onChange={(e) => handleUpdate('tax_percentage', parseInt(e.target.value))}
                         className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:outline-none focus:border-pixs-mint transition-all"
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[1px] text-slate-400">Base Delivery Fee</label>
                    <div className="relative">
                       <Truck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                       <input 
                         type="number" 
                         value={system.delivery_fee}
                         onChange={(e) => handleUpdate('delivery_fee', parseInt(e.target.value))}
                         className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:outline-none focus:border-pixs-mint transition-all"
                       />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Operational Flow */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                 <RotateCcw size={16} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">Operational Flow Control</h4>
           </div>

           <div className="space-y-3">
              {[
                { 
                  key: 'auto_complete_orders', 
                  label: 'Order Auto-Fulfillment', 
                  desc: 'Automatically mark orders as complete after QC approval.',
                  icon: Check
                },
                { 
                  key: 'allow_discount_stacking', 
                  label: 'Multi-Promo Stacking', 
                  desc: 'Enable usage of multiple discount nodes in a single transaction.',
                  icon: Layers
                }
              ].map((item) => (
                <div key={item.key} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group">
                   <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">{item.label}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                   </div>
                   <button 
                     onClick={() => handleUpdate(item.key, !system[item.key])}
                     className={clsx(
                       "w-10 h-5 rounded-full relative transition-all duration-300",
                       system[item.key] ? "bg-pixs-mint" : "bg-slate-100"
                     )}
                   >
                      <div className={clsx(
                        "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                        system[item.key] ? "left-5.5" : "left-0.5"
                      )} />
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[32px] p-8 text-white flex gap-6 items-center border border-white/5 shadow-2xl">
         <div className="w-14 h-14 rounded-2xl bg-pixs-mint/20 flex items-center justify-center text-pixs-mint shrink-0 shadow-lg">
            <Settings size={28} />
         </div>
         <div>
            <p className="text-xs font-black uppercase tracking-tight mb-1 italic">Industrial Protocol Integrity</p>
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
               These signifiers and multipliers define the global financial and operational logic of the <span className="text-white">PIXS SHOP OS</span>. Any modifications will be logged as a <span className="text-white">System Config Event</span>.
            </p>
         </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={handleSave}
          className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[3px] text-xs shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
        >
          Initialize Global Deployment
        </button>
      </div>
    </div>
  );
};

const Check = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

export default AdminSettingsSystem;
