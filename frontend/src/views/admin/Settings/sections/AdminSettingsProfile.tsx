import React, { useState } from 'react'
import {
  Camera,
  Mail,
  Shield,
  Briefcase,
  Plus,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import BoxFallback from '../../../../components/common/BoxFallback'

const AdminSettingsProfile: React.FC = () => {
  const { user } = useAuth()

  // Safe extraction of name parts
  const nameParts = (user?.name || '').split(' ')
  const safeFirstName = nameParts[0] || ''
  const safeLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

  const [formData, setFormData] = useState({
    firstName: safeFirstName,
    lastName: safeLastName,
    email: user?.email || 'admin@pixs.com',
    role: user?.role || 'admin',
    contactNumbers: [
      { number: '+63 912 345 6789', isDefault: true },
      { number: '+63 917 200 1001', isDefault: false },
    ],
  })

  const [profilePic] = useState('https://i.pravatar.cc/300?img=11')
  const [hasImageError, setHasImageError] = useState(false)

  const handleSave = () => {
    toast.success('Admin Profile Node Updated')
  }

  return (
    <div className="AdminSettingsProfile space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col items-start gap-8 md:flex-row">
        <div className="group relative">
          <div className="h-32 w-32 overflow-hidden rounded-[32px] border-4 border-white bg-slate-100 shadow-xl">
            {profilePic && !hasImageError ? (
              <img
                src={profilePic}
                alt=""
                onError={() => setHasImageError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <BoxFallback 
                className="flex h-full w-full items-center justify-center bg-slate-900" 
                iconClassName="h-12 w-12 brightness-0 invert opacity-30" 
              />
            )}
            <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="text-white" size={24} />
            </div>
          </div>
          <div className="bg-pixs-mint absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white text-slate-900 shadow-lg">
            <Shield size={18} />
          </div>
        </div>

        <div className="w-full flex-1 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                Identification First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="focus:border-pixs-mint focus:ring-pixs-mint/5 w-full rounded-2xl border border-slate-100 bg-white px-6 py-4 text-sm font-bold transition-all focus:ring-4 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                Identification Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="focus:border-pixs-mint focus:ring-pixs-mint/5 w-full rounded-2xl border border-slate-100 bg-white px-6 py-4 text-sm font-bold transition-all focus:ring-4 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
              Communication Email
            </label>
            <div className="relative">
              <Mail
                className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-300"
                size={18}
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="focus:border-pixs-mint focus:ring-pixs-mint/5 w-full rounded-2xl border border-slate-100 bg-white py-4 pr-6 pl-14 text-sm font-bold transition-all focus:ring-4 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-50" />

      {/* Role & Access Section */}
      <div className="space-y-4">
        <label className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
          Command Hierarchy Role
        </label>
        <div className="flex items-center gap-4">
          <div className="flex flex-1 items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center gap-4">
              <div className="text-pixs-mint flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-lg">
                <Briefcase size={20} />
              </div>
              <div>
                <p className="text-xs font-black tracking-tight text-slate-900 uppercase">
                  {formData.role}
                </p>
                <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                  Full Administrative Authority
                </p>
              </div>
            </div>
            <span className="bg-pixs-mint/10 text-pixs-mint rounded-lg px-3 py-1 text-[8px] font-black tracking-widest uppercase">
              Immutable
            </span>
          </div>
        </div>
        <p className="flex items-center gap-2 text-[9px] font-bold text-slate-400 italic">
          <AlertCircle size={10} />
          Your role is locked to Super Admin status for this session projection.
        </p>
      </div>

      <div className="h-px bg-slate-50" />

      {/* Contact Nodes */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
            Registered Contact Nodes
          </label>
          <button className="text-pixs-mint flex items-center gap-2 text-[9px] font-black uppercase transition-transform hover:scale-105">
            <Plus size={14} /> Add Node
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {formData.contactNumbers.map((num, i) => (
            <div
              key={i}
              className={clsx(
                'group flex items-center justify-between rounded-2xl border p-5 transition-all',
                num.isDefault
                  ? 'border-slate-900 bg-slate-900 shadow-xl shadow-slate-900/10'
                  : 'border-slate-100 bg-white hover:border-slate-200',
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    num.isDefault
                      ? 'text-pixs-mint bg-white/10'
                      : 'bg-slate-50 text-slate-400',
                  )}
                >
                  {num.isDefault ? (
                    <Check size={18} />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <div>
                  <p
                    className={clsx(
                      'text-sm font-black tracking-tight',
                      num.isDefault ? 'text-white' : 'text-slate-900',
                    )}
                  >
                    {num.number}
                  </p>
                  <p
                    className={clsx(
                      'mt-1 text-[8px] font-bold tracking-widest uppercase',
                      num.isDefault ? 'text-slate-400' : 'text-slate-400',
                    )}
                  >
                    {num.isDefault ? 'Primary Comm-Node' : 'Backup Link'}
                  </p>
                </div>
              </div>
              {!num.isDefault && (
                <button className="p-2 text-rose-400 opacity-0 transition-all group-hover:opacity-100 hover:text-rose-500">
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
          className="w-full rounded-[24px] bg-slate-900 px-10 py-5 text-xs font-black tracking-[3px] text-white uppercase shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 md:w-auto"
        >
          Initialize Update Sequence
        </button>
      </div>
    </div>
  )
}

export default AdminSettingsProfile
