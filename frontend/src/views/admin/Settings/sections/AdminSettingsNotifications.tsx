import React, { useState } from 'react';
import { MessageSquare, Package, Zap, Smartphone, Mail, Globe } from 'lucide-react';
import { SafeTerminal } from '../../../../utils/safeTerminal';
import initialSettings from '../../../../data/admin_settings.json';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface NotificationState {
  [key: string]: boolean;
}

const AdminSettingsNotifications: React.FC = () => {
  const [notifs, setNotifs] = useState<NotificationState>(SafeTerminal.object<NotificationState>(initialSettings.notifications));

  const handleToggle = (key: string) => {
    setNotifs({...notifs, [key]: !notifs[key]});
  };

  const handleSave = () => {
    toast.success('Notification Routing Matrix Updated');
  };

  const NOTIF_CONFIG = [
    { key: 'new_order', label: 'Inbound Order Alerts', icon: Package, desc: 'Real-time signal when a new customer order is initialized.' },
    { key: 'new_message', label: 'Comm-Hub Message Node', icon: MessageSquare, desc: 'Notification for new administrative or customer messages.' },
    { key: 'low_stock', label: 'Inventory Critical Threshold', icon: Zap, desc: 'Alert when product stock levels drop below the defined safety margin.' },
    { key: 'expiring_promo', label: 'Marketing Node Expiry', icon: Zap, desc: 'Notification before marketing promotions and discounts expire.' },
  ];

  return (
    <div className="AdminSettingsNotifications space-y-8">
      <div className="grid grid-cols-1 gap-4">
         {NOTIF_CONFIG.map((item) => {
           const Icon = item.icon;
           const isEnabled = notifs[item.key];
           return (
             <div key={item.key} className="p-6 bg-white border border-slate-100 rounded-[28px] flex items-center justify-between group hover:border-pixs-mint/30 transition-all shadow-sm">
                <div className="flex items-center gap-6">
                   <div className={clsx(
                     "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                     isEnabled ? "bg-slate-900 text-pixs-mint shadow-xl shadow-slate-900/10" : "bg-slate-50 text-slate-300"
                   )}>
                      <Icon size={24} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-sm font-black uppercase tracking-tight text-slate-900">{item.label}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[320px]">
                        {item.desc}
                      </p>
                   </div>
                </div>
                <button 
                  onClick={() => handleToggle(item.key)}
                  className={clsx(
                    "w-14 h-7 rounded-full relative transition-all duration-500",
                    isEnabled ? "bg-pixs-mint shadow-lg shadow-pixs-mint/20" : "bg-slate-100"
                  )}
                >
                   <div className={clsx(
                     "absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-sm",
                     isEnabled ? "left-8" : "left-1"
                   )} />
                </button>
             </div>
           );
         })}
      </div>

      <div className="h-px bg-slate-50" />

      <div className="space-y-6">
         <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Global Delivery Channels</h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'System Terminal', icon: Globe, enabled: true },
              { label: 'Push Notification', icon: Smartphone, enabled: false },
              { label: 'Email Dispatch', icon: Mail, enabled: true }
            ].map((channel, i) => (
              <div key={i} className={clsx(
                "p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all",
                channel.enabled ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-100 text-slate-300"
              )}>
                 {(() => {
                   const Icon = channel.icon;
                   return <Icon size={20} className={channel.enabled ? "text-pixs-mint" : "text-slate-200"} />;
                 })()}
                 <span className="text-[9px] font-black uppercase tracking-widest">{channel.label}</span>
                 <div className={clsx(
                   "px-2 py-0.5 rounded-md text-[7px] font-black uppercase",
                   channel.enabled ? "bg-pixs-mint/20 text-pixs-mint" : "bg-slate-50 text-slate-400"
                 )}>
                   {channel.enabled ? "ACTIVE" : "DISABLED"}
                 </div>
              </div>
            ))}
         </div>
      </div>

      <div className="pt-6">
        <button 
          onClick={handleSave}
          className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[3px] text-xs shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
        >
          Update Routing Table
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsNotifications;
