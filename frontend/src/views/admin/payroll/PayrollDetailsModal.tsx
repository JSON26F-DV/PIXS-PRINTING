import React from 'react';
import { X, Receipt, Download, CreditCard, User, Landmark } from 'lucide-react';
import type { PayrollRecord } from './PayrollTable';

interface PayrollDetailsModalProps {
  record: PayrollRecord | null;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
}

const PayrollDetailsModal: React.FC<PayrollDetailsModalProps> = ({ record, onClose, onToggleStatus }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 payroll-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#75EEA5]/10 rounded-2xl flex items-center justify-center text-emerald-600">
               <Receipt size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Remuneration Ledger</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px] mt-1 italic">Internal Distribution Record</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-10 space-y-10">
          <div className="flex items-center justify-between bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
            <div className="flex items-center gap-6">
              <img 
                src={record.profile_picture} 
                className="w-20 h-20 rounded-[28px] object-cover shadow-xl border-4 border-white"
                alt={record.name}
              />
              <div>
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{record.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">{record.role}</span>
                  <span className="text-[10px] font-bold text-slate-300 font-mono tracking-widest">{record.id}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-block border ${
                record.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                {record.status}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 payslip-section">
            <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4 flex items-center gap-2">
                <User size={12} className="text-slate-300" />
                Base Earnings
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">Daily Rate</span>
                  <span className="font-mono font-black text-slate-900">₱{record.daily_rate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm italic">
                  <span className="text-slate-400 font-bold">Attendance Days</span>
                  <span className="font-mono font-black text-slate-900">{record.attendance_days} Days</span>
                </div>
                <div className="h-px bg-slate-50" />
                <div className="flex justify-between text-base">
                  <span className="text-slate-900 font-black uppercase tracking-tighter">Subtotal</span>
                  <span className="font-mono font-black text-slate-900">₱{(record.daily_rate * record.attendance_days).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4 flex items-center gap-2">
                <Landmark size={12} className="text-slate-300" />
                Overtime Bonus
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">OT Hourly Rate</span>
                  <span className="font-mono font-black text-slate-900">₱{record.ot_rate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm italic">
                  <span className="text-slate-400 font-bold">Total OT Hours</span>
                  <span className="font-mono font-black text-slate-900">{record.overtime_hours} Hrs</span>
                </div>
                <div className="h-px bg-slate-50" />
                <div className="flex justify-between text-base">
                  <span className="text-slate-900 font-black uppercase tracking-tighter">Subtotal</span>
                  <span className="font-mono font-black text-[#75EEA5] drop-shadow-sm">₱{(record.ot_rate * record.overtime_hours).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[32px] flex items-center justify-between border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
               <Receipt size={64} className="text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-[#75EEA5] uppercase tracking-[4px]">Final Gross Yield</p>
              <h5 className="text-4xl font-black text-white italic tracking-tighter font-mono mt-1">₱{record.gross_pay.toLocaleString()}</h5>
            </div>
            <div className="relative z-10 flex gap-4">
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">Payment Channel</p>
                <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-tighter">
                  <CreditCard size={14} className="text-slate-500" />
                  Bank Transfer / Cash
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => onToggleStatus(record.id)}
              className="flex-1 py-4 bg-slate-900 text-white rounded-[24px] font-black uppercase text-xs tracking-[4px] hover:bg-slate-800 transition-all shadow-xl active:scale-95 border border-slate-800"
            >
              {record.status === 'Paid' ? 'Mark Unpaid' : 'Mark as Processed'}
            </button>
            <button className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-[24px] font-black uppercase text-xs tracking-[4px] hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <Download size={18} className="text-slate-400" />
              Get Slip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDetailsModal;
