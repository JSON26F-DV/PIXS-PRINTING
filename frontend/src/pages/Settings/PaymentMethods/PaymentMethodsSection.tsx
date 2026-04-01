import React, { useState } from 'react';
import { 
  FiPlus, 
  FiTrash2, 
  FiCheck, 
  FiCreditCard, 
  FiSmartphone, 
  FiBriefcase,
  FiChevronDown,
  FiAlertCircle,
  FiSave,
  FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ─── Payment Protocol Interfaces ─────────────────────────────────────────────
type PaymentType = 'GCash' | 'PayMaya' | 'Chinabank' | 'BPI';

interface PaymentMethod {
  id: string;
  type: PaymentType;
  accountNumber: string; // Stored masked (last 4) or full
  accountName: string;
  isDefault: boolean;
}

const MOCK_PAYMENTS: PaymentMethod[] = [
  { id: 'pay_1', type: 'GCash', accountNumber: '09171234567', accountName: 'Jason R.', isDefault: true },
  { id: 'pay_2', type: 'BPI', accountNumber: '1234567890', accountName: 'Jason Rivera', isDefault: false },
];

// ─── Validation Node Schema ──────────────────────────────────────────────────
const paymentSchema = z.object({
  type: z.enum(['GCash', 'PayMaya', 'Chinabank', 'BPI']),
  accountName: z.string().min(2, 'Identification string required'),
  accountNumber: z.string().min(6, 'Invalid sequence length'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// ─── Helper: Icon Mapping ────────────────────────────────────────────────────
const TYPE_ICONS: Record<PaymentType, React.ElementType> = {
  'GCash': FiSmartphone,
  'PayMaya': FiSmartphone,
  'Chinabank': FiBriefcase,
  'BPI': FiBriefcase,
};

// ─── Component: PaymentMethodCard ────────────────────────────────────────────
const PaymentMethodCard: React.FC<{
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ method, onSetDefault, onRemove }) => {
  const Icon = TYPE_ICONS[method.type];
  const maskedNumber = method.accountNumber.slice(-4).padStart(method.accountNumber.length, '•').replace(/(.{4})/g, '$1 ').trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={clsx(
        "PaymentMethodCard group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[24px] border transition-all duration-300",
        method.isDefault 
          ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-200" 
          : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md"
      )}
    >
      <div className="flex items-center gap-5">
        <div className={clsx(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300",
          method.isDefault ? "bg-white/10 text-pixs-mint" : "bg-slate-50 text-slate-400 group-hover:text-slate-900"
        )}>
          <Icon size={24} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h4 className={clsx(
              "PaymentType text-sm font-black uppercase tracking-widest italic",
              method.isDefault ? "text-white" : "text-slate-900"
            )}>
              {method.type}
            </h4>
            {method.isDefault && (
              <span className="px-2.5 py-0.5 bg-pixs-mint text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-full">Primary Node</span>
            )}
          </div>
          <p className={clsx(
            "PaymentMaskedInfo mt-1 text-xs font-mono font-black tracking-tighter italic",
            method.isDefault ? "text-slate-400" : "text-slate-500"
          )}>
            {maskedNumber}
          </p>
          <p className={clsx(
            "mt-0.5 text-[10px] font-bold uppercase tracking-widest",
            method.isDefault ? "text-slate-500" : "text-slate-300"
          )}>
            {method.accountName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-18 sm:pl-0">
        <div className="flex flex-col items-center">
            <label className="flex items-center gap-2 cursor-pointer group/selector">
                <input 
                    type="radio" 
                    name="default-payment"
                    checked={method.isDefault}
                    onChange={() => onSetDefault(method.id)}
                    className="DefaultPaymentSelector hidden"
                />
                <div className={clsx(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    method.isDefault 
                        ? "border-pixs-mint bg-pixs-mint shadow-[0_0_10px_#75EEA5]" 
                        : "border-slate-200 bg-white group-hover/selector:border-pixs-mint"
                )}>
                    {method.isDefault && <FiCheck className="text-slate-900" size={14} strokeWidth={4} />}
                </div>
                <span className={clsx(
                    "text-[9px] font-black uppercase tracking-widest italic transition-colors",
                    method.isDefault ? "text-pixs-mint" : "text-slate-400 group-hover/selector:text-slate-600"
                )}>
                    {method.isDefault ? "Active" : "Set Default"}
                </span>
            </label>
        </div>
        
        <button
          onClick={() => onRemove(method.id)}
          className="RemovePaymentMethodButton w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-red-50 text-red-300 hover:bg-red-500 hover:text-white hover:shadow-lg active:scale-90 ml-4"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Section: PaymentMethodsSection ─────────────────────────────────────
const PaymentMethodsSection: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>(MOCK_PAYMENTS);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    mode: 'onChange'
  });

  const handleSetDefault = (id: string) => {
    setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
  };

  const handleRemove = (id: string) => {
    setConfirmDelete(id);
  };

  const executeRemove = () => {
    if (confirmDelete) {
      setMethods(prev => prev.filter(m => m.id !== confirmDelete));
      setConfirmDelete(null);
    }
  };

  const onAddMethod = (data: PaymentFormValues) => {
    const newMethod: PaymentMethod = {
      id: `pay_${crypto.randomUUID()}`,
      type: data.type,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      isDefault: methods.length === 0
    };
    setMethods(prev => [...prev, newMethod]);
    setIsAdding(false);
    reset();
  };

  return (
    <div className="SettingsPaymentMethods space-y-12">
      
      {/* ── Header Node ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic leading-none mb-2">Finance Hub</h2>
          <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">Configure automated transaction clusters</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="AddPaymentMethodButton flex items-center gap-3 bg-slate-900 text-white rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-[4px] italic border border-white/10 shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <FiPlus size={16} className="text-pixs-mint" />
            Add Method Node
          </button>
        )}
      </div>

      {/* ── Add/Edit Logic Area ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form 
                className="bg-slate-50 border border-white rounded-[32px] p-8 space-y-8"
                onSubmit={handleSubmit(onAddMethod)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 flex items-center justify-center rounded-xl">
                            <FiCreditCard className="text-pixs-mint" size={18} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">New Payment Protocol</h3>
                    </div>
                    <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Method Selector Dropdown */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[30%] text-slate-400 italic">Type Cluster</label>
                        <Controller
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <div className="relative group">
                                    <select 
                                        {...field}
                                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-800 outline-none appearance-none group-focus-within:border-pixs-mint transition-all cursor-pointer"
                                    >
                                        <option value="GCash">GCash Node</option>
                                        <option value="PayMaya">PayMaya Node</option>
                                        <option value="Chinabank">Chinabank Protocol</option>
                                        <option value="BPI">BPI Network</option>
                                    </select>
                                    <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                </div>
                            )}
                        />
                    </div>

                    {/* Account Name Node */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[30%] text-slate-400 italic">Identity String</label>
                        <div className="relative group">
                            <input 
                                {...register('accountName')}
                                placeholder="Jason Rivera"
                                className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-800 outline-none focus:border-pixs-mint transition-all italic"
                            />
                        </div>
                        {errors.accountName && <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{errors.accountName.message}</p>}
                    </div>

                    {/* Account Number Node */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[30%] text-slate-400 italic">Account Matrix</label>
                        <div className="relative group">
                            <input 
                                {...register('accountNumber')}
                                placeholder="0917 XXX XXXX"
                                className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-sm font-bold font-mono text-slate-800 outline-none focus:border-pixs-mint transition-all"
                            />
                        </div>
                        {errors.accountNumber && <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{errors.accountNumber.message}</p>}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200/50">
                    <button 
                        type="submit"
                        disabled={!isValid}
                        className="SavePaymentMethodButton flex items-center gap-3 bg-pixs-mint text-slate-900 rounded-2xl px-12 py-5 text-[10px] font-black uppercase tracking-[4px] italic shadow-xl transition-all hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50 disabled:scale-100"
                    >
                        <FiSave size={16} />
                        Initialize Node
                    </button>
                </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Matrix area ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
            <span className="text-[9px] font-black uppercase tracking-[5px] text-slate-400">Security Encrypted Nodes</span>
            <div className="h-px flex-1 bg-slate-100" />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {methods.map(method => (
              <PaymentMethodCard 
                key={method.id} 
                method={method} 
                onSetDefault={handleSetDefault}
                onRemove={handleRemove}
              />
            ))}
          </AnimatePresence>

          {methods.length === 0 && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-100 rounded-[48px] bg-slate-50/50"
            >
                <FiCreditCard size={48} className="text-slate-100 mb-6" />
                <p className="text-sm font-black uppercase tracking-[5px] text-slate-300 italic">No Active Payment Clusters</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Security Declaration ── */}
      <div className="flex items-start gap-4 p-8 bg-slate-900 rounded-[32px] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-5 text-white">
              <FiCheck size={120} strokeWidth={1} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pixs-mint flex items-center justify-center shrink-0">
              <FiAlertCircle className="text-slate-900" size={24} />
          </div>
          <div>
              <h4 className="text-white text-sm font-black uppercase tracking-widest italic mb-2">Protocol Protection</h4>
              <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-xl">
                  PIXS does not store full encryption keys within this node. All payment data is decentralized and tokenized by our industrial banking partners. 
                  Synchronized with PCI-DSS Compliance Node V4.0.
              </p>
          </div>
      </div>

      {/* ── Removal Confirmation Modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500]"
                onClick={() => setConfirmDelete(null)}
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[48px] p-12 shadow-2xl z-[501]"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center text-red-500 mb-8">
                        <FiTrash2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic mb-4">Decommission Node?</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-10 leading-relaxed">
                        Are you sure you want to terminate this payment cluster sequence? This action is irreversible.
                    </p>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button 
                            onClick={() => setConfirmDelete(null)}
                            className="h-16 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={executeRemove}
                            className="h-16 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
                        >
                            Confirm Deletion
                        </button>
                    </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PaymentMethodsSection;
