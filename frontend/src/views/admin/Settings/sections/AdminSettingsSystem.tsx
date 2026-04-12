import React, { useState } from 'react'
import {
  Settings,
  DollarSign,
  Percent,
  Truck,
  RotateCcw,
  Layers,
} from 'lucide-react'
import { SafeTerminal } from '../../../../utils/safeTerminal'
import initialSettings from '../../../../data/admin_settings.json'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface SystemSettings {
  currency: string
  tax_percentage: number
  delivery_fee: number
  auto_complete_orders: boolean
  allow_discount_stacking: boolean
  [key: string]: string | number | boolean
}

const AdminSettingsSystem: React.FC = () => {
  const [system, setSystem] = useState<SystemSettings>(
    SafeTerminal.object<SystemSettings>(initialSettings.system),
  )

  const handleUpdate = (field: string, value: string | number | boolean) => {
    setSystem({ ...system, [field]: value })
  }

  const handleSave = () => {
    toast.success('System Operational Constants Updated')
  }

  return (
    <div className="AdminSettingsSystem space-y-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Financial Constants */}
        <div className="space-y-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <DollarSign size={16} />
            </div>
            <h4 className="text-[10px] font-black tracking-[2px] text-slate-900 uppercase">
              Financial Constants
            </h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-[1px] text-slate-400 uppercase">
                Global Currency Signifier
              </label>
              <div className="relative">
                <div className="absolute top-1/2 left-6 -translate-y-1/2 text-xs font-black text-slate-400">
                  {system.currency}
                </div>
                <select
                  value={system.currency}
                  onChange={(e) => handleUpdate('currency', e.target.value)}
                  className="focus:border-pixs-mint w-full appearance-none rounded-2xl border border-slate-100 bg-white py-4 pr-6 pl-12 text-sm font-bold transition-all focus:outline-none"
                >
                  <option value="₱">PHP (₱)</option>
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[1px] text-slate-400 uppercase">
                  Tax Multiplier (%)
                </label>
                <div className="relative">
                  <Percent
                    className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <input
                    type="number"
                    value={system.tax_percentage}
                    onChange={(e) =>
                      handleUpdate('tax_percentage', parseInt(e.target.value))
                    }
                    className="focus:border-pixs-mint w-full rounded-2xl border border-slate-100 bg-white py-4 pr-6 pl-12 text-sm font-bold transition-all focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[1px] text-slate-400 uppercase">
                  Base Delivery Fee
                </label>
                <div className="relative">
                  <Truck
                    className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-300"
                    size={14}
                  />
                  <input
                    type="number"
                    value={system.delivery_fee}
                    onChange={(e) =>
                      handleUpdate('delivery_fee', parseInt(e.target.value))
                    }
                    className="focus:border-pixs-mint w-full rounded-2xl border border-slate-100 bg-white py-4 pr-6 pl-12 text-sm font-bold transition-all focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Flow */}
        <div className="space-y-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <RotateCcw size={16} />
            </div>
            <h4 className="text-[10px] font-black tracking-[2px] text-slate-900 uppercase">
              Operational Flow Control
            </h4>
          </div>

          <div className="space-y-3">
            {[
              {
                key: 'auto_complete_orders',
                label: 'Order Auto-Fulfillment',
                desc: 'Automatically mark orders as complete after QC approval.',
                icon: Check,
              },
              {
                key: 'allow_discount_stacking',
                label: 'Multi-Promo Stacking',
                desc: 'Enable usage of multiple discount nodes in a single transaction.',
                icon: Layers,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5"
              >
                <div className="space-y-1">
                  <p className="text-[11px] font-black tracking-tight text-slate-900 uppercase">
                    {item.label}
                  </p>
                  <p className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                    {item.desc}
                  </p>
                </div>
                <button
                  onClick={() => handleUpdate(item.key, !system[item.key])}
                  className={clsx(
                    'relative h-5 w-10 rounded-full transition-all duration-300',
                    system[item.key] ? 'bg-pixs-mint' : 'bg-slate-100',
                  )}
                >
                  <div
                    className={clsx(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300',
                      system[item.key] ? 'left-5.5' : 'left-0.5',
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 rounded-[32px] border border-white/5 bg-slate-900 p-8 text-white shadow-2xl">
        <div className="bg-pixs-mint/20 text-pixs-mint flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg">
          <Settings size={28} />
        </div>
        <div>
          <p className="mb-1 text-xs font-black tracking-tight uppercase italic">
            Industrial Protocol Integrity
          </p>
          <p className="text-[10px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
            These signifiers and multipliers define the global financial and
            operational logic of the{' '}
            <span className="text-white">PIXS SHOP OS</span>. Any modifications
            will be logged as a{' '}
            <span className="text-white">System Config Event</span>.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSave}
          className="w-full rounded-[24px] bg-slate-900 px-12 py-5 text-xs font-black tracking-[3px] text-white uppercase shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 md:w-auto"
        >
          Initialize Global Deployment
        </button>
      </div>
    </div>
  )
}

const Check = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

export default AdminSettingsSystem
