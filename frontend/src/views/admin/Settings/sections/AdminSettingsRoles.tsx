import React, { useState } from 'react';
import { Shield, Plus, Settings2, Trash2, Check, AlertCircle, Users } from 'lucide-react';
import { SafeTerminal } from '../../../../utils/safeTerminal';
import initialSettings from '../../../../data/admin_settings.json';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface Permissions {
  [key: string]: boolean;
}

interface RoleMetadata {
  name: string;
  permissions: Permissions;
}

const AdminSettingsRoles: React.FC = () => {
  const [roles, setRoles] = useState<RoleMetadata[]>(SafeTerminal.array<RoleMetadata>(initialSettings.roles));

  const handleTogglePermission = (roleName: string, permKey: string) => {
    setRoles(prev => prev.map(r => {
      if (r.name === roleName) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [permKey]: !r.permissions[permKey]
          }
        };
      }
      return r;
    }));
  };

  const handleSave = () => {
    toast.success('Command Hierarchy Restructured');
  };

  return (
    <div className="AdminSettingsRoles space-y-8">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-pixs-mint shadow-lg">
               <Shield size={18} />
            </div>
            <div>
               <h4 className="text-[10px] font-black uppercase tracking-[2px] text-slate-900">Access Level Matrix</h4>
               <p className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-1">Define command hierarchy and node permissions</p>
            </div>
         </div>
         <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
            <Plus size={14} /> New Role Node
         </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {roles.map((role) => (
           <div key={role.name} className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="p-6 bg-slate-50 flex items-center justify-between border-b border-slate-100">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 shadow-sm">
                       <Users size={18} />
                    </div>
                    <div>
                       <h5 className="text-sm font-black uppercase italic tracking-tight text-slate-900">{role.name}</h5>
                       <p className="text-[8px] font-bold uppercase text-slate-400 tracking-[2px]">
                         {Object.values(role.permissions).filter(v => v === true).length} active permissions
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-pixs-mint hover:border-pixs-mint/30 rounded-xl transition-all shadow-sm">
                       <Settings2 size={16} />
                    </button>
                    {role.name !== 'admin' && (
                      <button className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 rounded-xl transition-all shadow-sm">
                        <Trash2 size={16} />
                      </button>
                    )}
                 </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {Object.entries(role.permissions).map(([key, value]) => (
                    <button 
                      key={key}
                      onClick={() => handleTogglePermission(role.name, key)}
                      className={clsx(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group/btn",
                        value 
                          ? "bg-pixs-mint/5 border-pixs-mint/20 text-slate-900 shadow-sm" 
                          : "bg-slate-50 border-slate-100 text-slate-400 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                      )}
                    >
                       <span className="text-[9px] font-black uppercase tracking-widest pr-4">
                         {key.replace(/_/g, ' ')}
                       </span>
                       <div className={clsx(
                         "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                         value ? "bg-pixs-mint text-slate-900" : "bg-slate-200 text-slate-400 group-hover/btn:bg-slate-300"
                       )}>
                          {value ? <Check size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                       </div>
                    </button>
                 ))}
              </div>
           </div>
         ))}
      </div>

      <div className="bg-slate-900 rounded-[24px] p-6 text-white flex gap-6 items-center">
         <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-pixs-mint shrink-0">
            <AlertCircle size={24} />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-tight mb-1">Authorization Enforcement</p>
            <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
               Permission updates are immediate for active sessions. The <span className="text-white">Admin</span> node retains override authority on all relational projections regardless of sub-role assignment.
            </p>
         </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={handleSave}
          className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[3px] text-xs shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
        >
          Initialize Matrix Synchronization
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsRoles;
