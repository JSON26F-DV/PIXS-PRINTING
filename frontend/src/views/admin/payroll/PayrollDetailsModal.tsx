import React from 'react'
import { X, Receipt, Download, CreditCard, User, Landmark } from 'lucide-react'
import type { PayrollRecord } from './types'

interface PayrollDetailsModalProps {
  record: PayrollRecord | null
  onClose: () => void
  onToggleStatus: (id: string) => void
}

const PayrollDetailsModal: React.FC<PayrollDetailsModalProps> = ({
  record,
  onClose,
  onToggleStatus,
}) => {
  if (!record) return null

  return (
    <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md duration-300">
      <div
        className="animate-in zoom-in-95 payroll-details-modal w-full max-w-2xl overflow-hidden rounded-[40px] bg-white shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-50 p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#75EEA5]/10 text-emerald-600">
              <Receipt size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                Remuneration Ledger
              </h3>
              <p className="mt-1 text-[10px] font-bold tracking-[4px] text-slate-400 uppercase italic">
                Internal Distribution Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-10 p-10">
          <div className="flex items-center justify-between rounded-[32px] border border-slate-100 bg-slate-50/50 p-8">
            <div className="flex items-center gap-6">
              <img
                src={record.profile_picture}
                className="h-20 w-20 rounded-[28px] border-4 border-white object-cover shadow-xl"
                alt={record.name}
              />
              <div>
                <h4 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
                  {record.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {record.role}
                  </span>
                  <span className="font-mono text-[10px] font-bold tracking-widest text-slate-300">
                    {record.id}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`inline-block rounded-2xl border px-4 py-2 text-[10px] font-black tracking-widest uppercase ${
                  record.status === 'Paid'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : 'border-rose-200 bg-rose-50 text-rose-600'
                }`}
              >
                {record.status}
              </div>
            </div>
          </div>

          <div className="payslip-section grid grid-cols-2 gap-8">
            <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <p className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                <User size={12} className="text-slate-300" />
                Base Earnings
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-500">Daily Rate</span>
                  <span className="font-mono font-black text-slate-900">
                    ₱{(record.daily_rate || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm italic">
                  <span className="font-bold text-slate-400">
                    Attendance Days
                  </span>
                  <span className="font-mono font-black text-slate-900">
                    {record.attendance_days} Days
                  </span>
                </div>
                <div className="h-px bg-slate-50" />
                <div className="flex justify-between text-base">
                  <span className="font-black tracking-tighter text-slate-900 uppercase">
                    Subtotal
                  </span>
                  <span className="font-mono font-black text-slate-900">
                    ₱
                    {(
                      (record.daily_rate || 0) * (record.attendance_days || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <p className="mb-4 flex items-center gap-2 text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                <Landmark size={12} className="text-slate-300" />
                Overtime Bonus
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-500">
                    OT Hourly Rate
                  </span>
                  <span className="font-mono font-black text-slate-900">
                    ₱{record.ot_rate.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm italic">
                  <span className="font-bold text-slate-400">
                    Total OT Hours
                  </span>
                  <span className="font-mono font-black text-slate-900">
                    {record.overtime_hours} Hrs
                  </span>
                </div>
                <div className="h-px bg-slate-50" />
                <div className="flex justify-between text-base">
                  <span className="font-black tracking-tighter text-slate-900 uppercase">
                    Subtotal
                  </span>
                  <span className="font-mono font-black text-[#75EEA5] drop-shadow-sm">
                    ₱{((record.ot_rate || 0) * (record.overtime_hours || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative flex items-center justify-between overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12">
              <Receipt size={64} className="text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black tracking-[4px] text-[#75EEA5] uppercase">
                Final Gross Yield
              </p>
              <h5 className="mt-1 font-mono text-4xl font-black tracking-tighter text-white italic">
                ₱{(record.gross_pay || 0).toLocaleString()}
              </h5>
            </div>
            <div className="relative z-10 flex gap-4">
              <div className="text-right">
                <p className="mb-1 text-[9px] font-bold tracking-widest text-slate-500 uppercase italic">
                  Payment Channel
                </p>
                <div className="flex items-center gap-2 text-xs font-black tracking-tighter text-white uppercase">
                  <CreditCard size={14} className="text-slate-500" />
                  Bank Transfer / Cash
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => onToggleStatus(record.id)}
              className="flex-1 rounded-[24px] border border-slate-800 bg-slate-900 py-4 text-xs font-black tracking-[4px] text-white uppercase shadow-xl transition-all hover:bg-slate-800 active:scale-95"
            >
              {record.status === 'Paid' ? 'Mark Unpaid' : 'Mark as Processed'}
            </button>
            <button className="flex items-center gap-2 rounded-[24px] border border-slate-200 bg-white px-8 py-4 text-xs font-black tracking-[4px] text-slate-900 uppercase shadow-sm transition-all hover:bg-slate-50 active:scale-95">
              <Download size={18} className="text-slate-400" />
              Get Slip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PayrollDetailsModal
