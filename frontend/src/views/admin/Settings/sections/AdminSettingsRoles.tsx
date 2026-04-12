import React, { useState } from 'react'
import {
  Shield,
  Plus,
  Settings2,
  Trash2,
  Check,
  AlertCircle,
  Users,
} from 'lucide-react'
import { SafeTerminal } from '../../../../utils/safeTerminal'
import initialSettings from '../../../../data/admin_settings.json'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface Permissions {
  [key: string]: boolean
}

interface RoleMetadata {
  name: string
  permissions: Permissions
}

const AdminSettingsRoles: React.FC = () => {
  const [roles, setRoles] = useState<RoleMetadata[]>(
    SafeTerminal.array<RoleMetadata>(initialSettings.roles),
  )

  const handleTogglePermission = (roleName: string, permKey: string) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.name === roleName) {
          return {
            ...r,
            permissions: {
              ...r.permissions,
              [permKey]: !r.permissions[permKey],
            },
          }
        }
        return r
      }),
    )
  }

  const handleSave = () => {
    toast.success('Command Hierarchy Restructured')
  }

  return (
    <div className="AdminSettingsRoles space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-pixs-mint flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-lg">
            <Shield size={18} />
          </div>
          <div>
            <h4 className="text-[10px] font-black tracking-[2px] text-slate-900 uppercase">
              Access Level Matrix
            </h4>
            <p className="mt-1 text-[8px] font-bold tracking-widest text-slate-400 uppercase">
              Define command hierarchy and node permissions
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[9px] font-black tracking-widest text-white uppercase transition-all hover:scale-105">
          <Plus size={14} /> New Role Node
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {roles.map((role) => (
          <div
            key={role.name}
            className="group overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm">
                  <Users size={18} />
                </div>
                <div>
                  <h5 className="text-sm font-black tracking-tight text-slate-900 uppercase italic">
                    {role.name}
                  </h5>
                  <p className="text-[8px] font-bold tracking-[2px] text-slate-400 uppercase">
                    {
                      Object.values(role.permissions).filter((v) => v === true)
                        .length
                    }{' '}
                    active permissions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="hover:text-pixs-mint hover:border-pixs-mint/30 rounded-xl border border-slate-100 bg-white p-2.5 text-slate-400 shadow-sm transition-all">
                  <Settings2 size={16} />
                </button>
                {role.name !== 'admin' && (
                  <button className="rounded-xl border border-slate-100 bg-white p-2.5 text-slate-400 shadow-sm transition-all hover:border-rose-100 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(role.permissions).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleTogglePermission(role.name, key)}
                  className={clsx(
                    'group/btn flex items-center justify-between rounded-2xl border p-4 text-left transition-all',
                    value
                      ? 'bg-pixs-mint/5 border-pixs-mint/20 text-slate-900 shadow-sm'
                      : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60 grayscale hover:opacity-100 hover:grayscale-0',
                  )}
                >
                  <span className="pr-4 text-[9px] font-black tracking-widest uppercase">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <div
                    className={clsx(
                      'flex h-6 w-6 items-center justify-center rounded-lg transition-all',
                      value
                        ? 'bg-pixs-mint text-slate-900'
                        : 'bg-slate-200 text-slate-400 group-hover/btn:bg-slate-300',
                    )}
                  >
                    {value ? (
                      <Check size={12} />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6 rounded-[24px] bg-slate-900 p-6 text-white">
        <div className="text-pixs-mint flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <AlertCircle size={24} />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-black tracking-tight uppercase">
            Authorization Enforcement
          </p>
          <p className="text-[9px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
            Permission updates are immediate for active sessions. The{' '}
            <span className="text-white">Admin</span> node retains override
            authority on all relational projections regardless of sub-role
            assignment.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSave}
          className="w-full rounded-[24px] bg-slate-900 px-12 py-5 text-xs font-black tracking-[3px] text-white uppercase shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 md:w-auto"
        >
          Initialize Matrix Synchronization
        </button>
      </div>
    </div>
  )
}

export default AdminSettingsRoles
