import React, { useState } from 'react'
import {
  MessageSquare,
  Package,
  Zap,
  Smartphone,
  Mail,
  Globe,
} from 'lucide-react'
import { SafeTerminal } from '../../../../utils/safeTerminal'
import initialSettings from '../../../../data/admin_settings.json'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface NotificationState {
  [key: string]: boolean
}

const AdminSettingsNotifications: React.FC = () => {
  const [notifs, setNotifs] = useState<NotificationState>(
    SafeTerminal.object<NotificationState>(initialSettings.notifications),
  )

  const handleToggle = (key: string) => {
    setNotifs({ ...notifs, [key]: !notifs[key] })
  }

  const handleSave = () => {
    toast.success('Notification Routing Matrix Updated')
  }

  const NOTIF_CONFIG = [
    {
      key: 'new_order',
      label: 'Inbound Order Alerts',
      icon: Package,
      desc: 'Real-time signal when a new customer order is initialized.',
    },
    {
      key: 'new_message',
      label: 'Comm-Hub Message Node',
      icon: MessageSquare,
      desc: 'Notification for new administrative or customer messages.',
    },
    {
      key: 'low_stock',
      label: 'Inventory Critical Threshold',
      icon: Zap,
      desc: 'Alert when product stock levels drop below the defined safety margin.',
    },
    {
      key: 'expiring_promo',
      label: 'Marketing Node Expiry',
      icon: Zap,
      desc: 'Notification before marketing promotions and discounts expire.',
    },
  ]

  return (
    <div className="AdminSettingsNotifications space-y-8">
      <div className="grid grid-cols-1 gap-4">
        {NOTIF_CONFIG.map((item) => {
          const Icon = item.icon
          const isEnabled = notifs[item.key]
          return (
            <div
              key={item.key}
              className="group hover:border-pixs-mint/30 flex items-center justify-between rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm transition-all"
            >
              <div className="flex items-center gap-6">
                <div
                  className={clsx(
                    'flex h-14 w-14 items-center justify-center rounded-2xl transition-all',
                    isEnabled
                      ? 'text-pixs-mint bg-slate-900 shadow-xl shadow-slate-900/10'
                      : 'bg-slate-50 text-slate-300',
                  )}
                >
                  <Icon size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black tracking-tight text-slate-900 uppercase">
                    {item.label}
                  </p>
                  <p className="max-w-[320px] text-[9px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
                    {item.desc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                className={clsx(
                  'relative h-7 w-14 rounded-full transition-all duration-500',
                  isEnabled
                    ? 'bg-pixs-mint shadow-pixs-mint/20 shadow-lg'
                    : 'bg-slate-100',
                )}
              >
                <div
                  className={clsx(
                    'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-500',
                    isEnabled ? 'left-8' : 'left-1',
                  )}
                />
              </button>
            </div>
          )
        })}
      </div>

      <div className="h-px bg-slate-50" />

      <div className="space-y-6">
        <h4 className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
          Global Delivery Channels
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: 'System Terminal', icon: Globe, enabled: true },
            { label: 'Push Notification', icon: Smartphone, enabled: false },
            { label: 'Email Dispatch', icon: Mail, enabled: true },
          ].map((channel, i) => (
            <div
              key={i}
              className={clsx(
                'flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all',
                channel.enabled
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-100 bg-white text-slate-300',
              )}
            >
              {(() => {
                const Icon = channel.icon
                return (
                  <Icon
                    size={20}
                    className={
                      channel.enabled ? 'text-pixs-mint' : 'text-slate-200'
                    }
                  />
                )
              })()}
              <span className="text-[9px] font-black tracking-widest uppercase">
                {channel.label}
              </span>
              <div
                className={clsx(
                  'rounded-md px-2 py-0.5 text-[7px] font-black uppercase',
                  channel.enabled
                    ? 'bg-pixs-mint/20 text-pixs-mint'
                    : 'bg-slate-50 text-slate-400',
                )}
              >
                {channel.enabled ? 'ACTIVE' : 'DISABLED'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6">
        <button
          onClick={handleSave}
          className="w-full rounded-[24px] bg-slate-900 px-12 py-5 text-xs font-black tracking-[3px] text-white uppercase shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 md:w-auto"
        >
          Update Routing Table
        </button>
      </div>
    </div>
  )
}

export default AdminSettingsNotifications
