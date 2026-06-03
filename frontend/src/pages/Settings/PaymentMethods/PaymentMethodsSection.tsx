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
  FiX,
  FiEdit2
} from 'react-icons/fi';
import { m, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { usePaymentMethodStore } from '../../../store/usePaymentMethodStore';

// ─── Payment Interfaces ──────────────────────────────────────────────────────
interface PaymentMethod {
  id: string;
  type: 'bank' | 'ewallet' | 'credit_card' | 'cod';
  bank_name: 'BDO' | 'BPI' | 'Metrobank' | 'Landbank' | 'Unionbank' | 'Security Bank' | 'Chinabank' | 'RCBC' | 'EastWest' | 'PNB' | 'Other' | null;
  provider: 'GCash' | 'Maya' | 'ShopeePay' | 'Visa' | 'Mastercard' | 'Other' | null;
  masked_number: string;
  is_default: boolean;
}

// ─── Validation Schema ───────────────────────────────────────────────────────
const paymentSchema = z.object({
  provider: z.string().min(1, 'Selection is required'),
  accountName: z.string().min(2, 'Cardholder or account name is required'),
  accountNumber: z.string().min(6, 'Account or card number is incomplete'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// ─── Constants: Icon Mapping ─────────────────────────────────────────────────
const BRAND_ICONS: Record<string, React.ElementType> = {
  'GCash': FiSmartphone,
  'Maya': FiSmartphone,
  'ShopeePay': FiSmartphone,
  'Visa': FiCreditCard,
  'Mastercard': FiCreditCard,
  // Banks
  'BDO': FiBriefcase,
  'BPI': FiBriefcase,
  'Metrobank': FiBriefcase,
  'Unionbank': FiBriefcase,
  'Chinabank': FiBriefcase,
  'Security Bank': FiBriefcase,
  'Other': FiCreditCard,
};

// ─── Component: PaymentMethodCard ────────────────────────────────────────────
const PaymentMethodCard: React.FC<{
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onEdit: (method: PaymentMethod) => void;
  onRemove: (id: string) => void;
}> = ({ method, onSetDefault, onEdit, onRemove }) => {
  const displayLabel = method.provider || method.bank_name || method.type;
  const Icon = BRAND_ICONS[method.provider || method.bank_name || ''] || (method.type === 'bank' ? FiBriefcase : FiCreditCard);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={clsx(
        "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[24px] border transition-all duration-300",
        method.is_default 
          ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-200" 
          : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md"
      )}
    >
      <div className="flex items-center gap-5">
        <div className={clsx(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300",
          method.is_default ? "bg-white/10 text-pixs-mint" : "bg-slate-50 text-slate-400 group-hover:text-slate-900"
        )}>
          <Icon size={24} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h4 className={clsx(
              "text-sm font-black uppercase tracking-widest italic",
              method.is_default ? "text-white" : "text-slate-900"
            )}>
              {displayLabel}
            </h4>
            {method.is_default && (
              <span className="px-2.5 py-0.5 bg-pixs-mint text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-full">Default</span>
            )}
          </div>
          <p className={clsx(
            "mt-1 text-xs font-mono font-black tracking-tighter italic",
            method.is_default ? "text-slate-400" : "text-slate-500"
          )}>
            {method.masked_number}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-18 sm:pl-0">
        <div className="flex flex-col items-center">
            <label className="flex items-center gap-2 cursor-pointer group/selector">
                <input 
                    type="radio" 
                    name="default-payment"
                    checked={method.is_default}
                    onChange={() => onSetDefault(method.id)}
                    className="hidden"
                />
                <div className={clsx(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    method.is_default 
                        ? "border-pixs-mint bg-pixs-mint shadow-[0_0_10px_#75EEA5]" 
                        : "border-slate-200 bg-white group-hover/selector:border-pixs-mint"
                )}>
                    {method.is_default && <FiCheck className="text-slate-900" size={14} strokeWidth={4} />}
                </div>
                <span className={clsx(
                    "text-[9px] font-black uppercase tracking-widest italic transition-colors",
                    method.is_default ? "text-pixs-mint" : "text-slate-400 group-hover/selector:text-slate-600"
                )}>
                    {method.is_default ? "Default" : "Use as Default"}
                </span>
            </label>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onEdit(method)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white hover:shadow-lg active:scale-95"
            title="Edit Payment Method"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => onRemove(method.id)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-red-50 text-red-300 hover:bg-red-500 hover:text-white hover:shadow-lg active:scale-95"
            title="Remove Payment Method"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    </m.div>
  );
};

// ─── Main Section: PaymentMethodsSection ─────────────────────────────────────
const PaymentMethodsSection: React.FC = () => {
  const { methods, isLoading, fetchMethods, addMethod, updateMethod, setDefault, removeMethod } = usePaymentMethodStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid }
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    mode: 'onChange',
    defaultValues: {
        provider: 'GCash',
        accountName: '',
        accountNumber: ''
    }
  });

  React.useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault(id);
      toast.success('Default payment method updated');
    } catch {
      toast.error('Failed to update default payment method');
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setValue('provider', (method.provider || method.bank_name || 'Other') as PaymentFormValues['provider']);
    setValue('accountName', ''); // Account name isn't stored, prompting re-entry or placeholder
    setValue('accountNumber', method.masked_number.replace(/•/g, ''));
    setIsAdding(true);
  };

  const handleRemove = (id: string) => {
    setConfirmDelete(id);
  };

  const executeRemove = async () => {
    if (confirmDelete) {
      try {
        await removeMethod(confirmDelete);
        setConfirmDelete(null);
        toast.success('Payment method removed');
      } catch {
        toast.error('Failed to remove payment method');
      }
    }
  };

  const onFormSubmit = async (data: PaymentFormValues) => {
    const isEwallet = ['GCash', 'Maya', 'ShopeePay'].includes(data.provider);
    const isCard = ['Visa', 'Mastercard'].includes(data.provider);
    const isBank = ['BDO', 'BPI', 'Metrobank', 'Landbank', 'Unionbank', 'Security Bank', 'Chinabank', 'RCBC', 'EastWest', 'PNB'].includes(data.provider);
    
    let type: 'bank' | 'ewallet' | 'credit_card' | 'cod' = 'bank';
    if (isEwallet) type = 'ewallet';
    else if (isCard) type = 'credit_card';

    const payload: Omit<PaymentMethod, 'id' | 'is_default'> = {
      type,
      provider: (isEwallet || isCard || data.provider === 'Other') ? (data.provider as PaymentMethod['provider']) : null,
      bank_name: isBank ? (data.provider as PaymentMethod['bank_name']) : (data.provider === 'Other' ? 'Other' : null),
      masked_number: data.accountNumber.length > 4 
        ? data.accountNumber.slice(-4).padStart(data.accountNumber.length, '•')
        : data.accountNumber,
    };

    try {
      if (editingId) {
        await updateMethod(editingId, payload);
        toast.success('Payment method updated');
      } else {
        await addMethod(payload);
        toast.success('Payment method added');
      }
      handleCancel();
    } catch {
      toast.error(editingId ? 'Failed to update payment method' : 'Failed to add payment method');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  if (isLoading && methods.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-[10px] font-black uppercase tracking-[4px] text-slate-400 animate-pulse">
        Syncing Payment Methods...
      </div>
    );
  }

  return (
    <div className="space-y-12">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic leading-none mb-2">Payment Methods</h2>
          <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">Manage your connected accounts and cards</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-[4px] italic border border-white/10 shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <FiPlus size={16} className="text-pixs-mint" />
            Add New Method
          </button>
        )}
      </div>

      {/* ── Add/Edit Form ── */}
      <AnimatePresence mode="wait">
        {isAdding && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form 
                className="bg-slate-50 border border-white rounded-[32px] p-8 space-y-8"
                onSubmit={handleSubmit(onFormSubmit)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 flex items-center justify-center rounded-xl">
                            <FiCreditCard className="text-pixs-mint" size={18} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                          {editingId ? 'Edit Payment Method' : 'Add New Payment Method'}
                        </h3>
                    </div>
                    <button type="button" onClick={handleCancel} className="text-slate-400 hover:text-slate-900 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[30%] text-slate-400 italic">Provider</label>
                        <Controller
                            control={control}
                            name="provider"
                            render={({ field }) => (
                                <div className="relative group">
                                    <select 
                                        {...field}
                                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-800 outline-none appearance-none group-focus-within:border-pixs-mint transition-all cursor-pointer"
                                    >
                                        <optgroup label="E-Wallets">
                                            <option value="GCash">GCash</option>
                                            <option value="Maya">Maya</option>
                                            <option value="ShopeePay">ShopeePay</option>
                                        </optgroup>
                                        <optgroup label="Cards">
                                            <option value="Visa">Visa Card</option>
                                            <option value="Mastercard">Mastercard</option>
                                        </optgroup>
                                        <optgroup label="Banks">
                                            <option value="BDO">BDO Unibank</option>
                                            <option value="BPI">BPI</option>
                                            <option value="Metrobank">Metrobank</option>
                                            <option value="Unionbank">Unionbank</option>
                                            <option value="Landbank">Landbank</option>
                                            <option value="Security Bank">Security Bank</option>
                                            <option value="Chinabank">China Bank</option>
                                            <option value="RCBC">RCBC</option>
                                            <option value="PNB">PNB</option>
                                        </optgroup>
                                        <option value="Other">Other / Manual</option>
                                    </select>
                                    <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                </div>
                            )}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[30%] text-slate-400 italic">Account Name</label>
                        <div className="relative group">
                            <input 
                                {...register('accountName')}
                                placeholder="e.g. Jason Rivera"
                                className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-sm font-bold text-slate-800 outline-none focus:border-pixs-mint transition-all"
                            />
                        </div>
                        {errors.accountName && <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{errors.accountName.message}</p>}
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[30%] text-slate-400 italic">Account / Card Number</label>
                        <div className="relative group">
                            <input 
                                {...register('accountNumber')}
                                placeholder="09XX XXX XXXX or Card Number"
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
                        className="flex items-center gap-3 bg-pixs-mint text-slate-900 rounded-2xl px-12 py-5 text-[10px] font-black uppercase tracking-[4px] italic shadow-xl transition-all hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50 disabled:scale-100"
                    >
                        <FiSave size={16} />
                        {editingId ? 'Save Changes' : 'Confirm Method'}
                    </button>
                </div>
            </form>
          </m.div>
        )}
      </AnimatePresence>

      {/* ── Active Matrix area ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
            <span className="text-[9px] font-black uppercase tracking-[5px] text-slate-400">Connected Accounts</span>
            <div className="h-px flex-1 bg-slate-100" />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {methods.map(method => (
              <PaymentMethodCard 
                key={method.id} 
                method={method as unknown as PaymentMethod} 
                onSetDefault={handleSetDefault}
                onEdit={handleEdit}
                onRemove={handleRemove}
              />
            ))}
          </AnimatePresence>

          {methods.length === 0 && !isLoading && (
            <m.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-100 rounded-[48px] bg-slate-50/50"
            >
                <FiCreditCard size={48} className="text-slate-100 mb-6" />
                <p className="text-sm font-black uppercase tracking-[5px] text-slate-300 italic">No Payment Methods Found</p>
            </m.div>
          )}
        </div>
      </div>

      {/* ── Security ── */}
      <div className="flex items-start gap-4 p-8 bg-slate-900 rounded-[32px] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-5 text-white">
              <FiCheck size={120} strokeWidth={1} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pixs-mint flex items-center justify-center shrink-0">
              <FiAlertCircle className="text-slate-900" size={24} />
          </div>
          <div>
              <h4 className="text-white text-sm font-black uppercase tracking-widest italic mb-2">Secure Transactions</h4>
              <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-xl">
                  Your payment details are encrypted and stored securely. We do not store your full card details on our servers to ensure maximum safety. 
                  All transactions are handled according to PCI-DSS standards.
              </p>
          </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <m.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500]"
                onClick={() => setConfirmDelete(null)}
            />
            <m.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[48px] p-12 shadow-2xl z-[501]"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center text-red-500 mb-8">
                        <FiTrash2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic mb-4">Delete Payment Method?</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-10 leading-relaxed">
                        Are you sure you want to remove this payment method? This action cannot be undone.
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
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </m.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PaymentMethodsSection;