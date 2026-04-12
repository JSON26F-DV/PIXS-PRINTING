import React, { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Clock,
  History,
  Key,
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const AdminSettingsSecurity: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(true)
  const [requirePassForDelete, setRequirePassForDelete] = useState(true)

  // Mock Login History
  const loginHistory = [
    {
      device: 'Desktop Chrome / Windows',
      ip: '192.168.1.1',
      timestamp: new Date().toISOString(),
      status: 'Current Session',
    },
    {
      device: 'Mobile Safari / iOS',
      ip: '110.54.23.144',
      timestamp: '2026-04-01T08:15:00Z',
      status: 'Authorized',
    },
    {
      device: 'Desktop Firefox / Linux',
      ip: '172.16.0.42',
      timestamp: '2026-03-31T22:40:00Z',
      status: 'Terminated',
    },
  ]

  const handleUpdateSecurity = () => {
    toast.success('Security Protocol Updated')
  }

  return (
    <div className="AdminSettingsSecurity space-y-10">
      {/* Change Password Node */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="text-pixs-mint flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-lg">
            <Key size={18} />
          </div>
          <h4 className="text-[10px] font-black tracking-[2px] text-slate-900 uppercase">
            Credential Rotation
          </h4>
        </div>

        <div className="grid grid-cols-1 gap-6 rounded-[32px] border border-slate-100 bg-slate-50 p-8 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black tracking-[1px] text-slate-400 uppercase">
              Current Security Key
            </label>
            <div className="relative">
              <Lock
                className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-300"
                size={16}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                className="focus:border-pixs-mint w-full rounded-2xl border border-slate-100 bg-white py-4 pr-12 pl-14 text-sm font-bold transition-all focus:outline-none"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-300 transition-colors hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black tracking-[1px] text-slate-400 uppercase">
              New Security Key
            </label>
            <input
              type="password"
              placeholder="Initialize new key..."
              className="focus:border-pixs-mint w-full rounded-2xl border border-slate-100 bg-white px-6 py-4 text-sm font-bold transition-all focus:outline-none"
            />
          </div>
          <div className="flex justify-end md:col-span-2">
            <button
              onClick={handleUpdateSecurity}
              className="rounded-xl bg-slate-900 px-8 py-3 text-[9px] font-black tracking-widest text-white uppercase transition-all hover:bg-slate-800 active:scale-95"
            >
              Rotate Security Key
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Protocol Toggles */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 shadow-lg shadow-rose-100">
            <ShieldAlert size={18} />
          </div>
          <h4 className="text-[10px] font-black tracking-[2px] text-slate-900 uppercase">
            Operational Security Protocols
          </h4>
        </div>

        <div className="space-y-3">
          {[
            {
              id: 'timeout',
              title: 'Inactivity Session Termination',
              desc: 'Automatically logout after 30 minutes of node inactivity.',
              state: sessionTimeout,
              setter: setSessionTimeout,
            },
            {
              id: 'pass_req',
              title: 'Destructive Action Authorization',
              desc: 'Require security key before deleting products, users, or clearing logs.',
              state: requirePassForDelete,
              setter: setRequirePassForDelete,
            },
          ].map((item) => (
            <div
              key={item.id}
              className="group hover:border-pixs-mint/30 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-6 transition-all"
            >
              <div className="space-y-1">
                <p className="text-sm font-black tracking-tight text-slate-900 uppercase">
                  {item.title}
                </p>
                <p className="max-w-[400px] text-[9px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
                  {item.desc}
                </p>
              </div>
              <button
                onClick={() => item.setter(!item.state)}
                className={clsx(
                  'relative h-6 w-12 rounded-full transition-all duration-300',
                  item.state ? 'bg-pixs-mint' : 'bg-slate-200',
                )}
              >
                <div
                  className={clsx(
                    'absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300',
                    item.state ? 'left-7 shadow-sm' : 'left-1',
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Session History Node */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 shadow-lg shadow-blue-100">
            <History size={18} />
          </div>
          <h4 className="text-[10px] font-black tracking-[2px] text-slate-900 uppercase">
            Access Node History
          </h4>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-100">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-4 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Terminal / Device
                </th>
                <th className="px-6 py-4 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  IP Link
                </th>
                <th className="px-6 py-4 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loginHistory.map((log, i) => (
                <tr key={i} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-5">
                    <p className="text-xs font-black text-slate-900">
                      {log.device}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <code className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                      {log.ip}
                    </code>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold">
                        {(() => {
                          try {
                            return format(
                              new Date(log.timestamp),
                              'MMM dd, HH:mm',
                            )
                          } catch {
                            return 'Invalid Date'
                          }
                        })()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={clsx(
                        'rounded-lg px-2 py-1 text-[8px] font-black tracking-widest uppercase',
                        log.status === 'Current Session'
                          ? 'bg-pixs-mint/20 text-slate-900'
                          : 'bg-slate-100 text-slate-400',
                      )}
                    >
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
  )
}

export default AdminSettingsSecurity
