import { useState, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  TicketPercent, 
  Truck, 
  Layers, 
  MapPin, 
  Plus, 
  ToggleRight, 
  ToggleLeft,
  CalendarDays,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, isBefore } from 'date-fns';
import AnimatedNumber from '../../components/animations/AnimatedNumber';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility Classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Interfaces ---
interface IPromotion {
  id: string;
  code: string;
  type: 'DISCOUNT' | 'SHIPPING' | 'SERVICE';
  discountType?: 'PERCENTAGE' | 'FIXED' | 'BOGO';
  value: number;
  expiry: Date;
  isActive: boolean;
  usageCount: number;
}

const promoSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  type: z.enum(['DISCOUNT', 'SHIPPING', 'SERVICE']),
  discountType: z.enum(['PERCENTAGE', 'FIXED', 'BOGO']).optional(),
  value: z.number().min(0, "Value cannot be negative"),
  expiry: z.string().min(1, "Expiry date is required")
});

type PromoFormData = z.infer<typeof promoSchema>;

let sessionPromoCounter = Date.now();

export default function MarketingPromotions() {
  const [promos, setPromos] = useState<IPromotion[]>([
    {
      id: "PR-1",
      code: "PIXS_BULK_10",
      type: "DISCOUNT",
      discountType: "PERCENTAGE",
      value: 10,
      expiry: new Date(new Date().setDate(new Date().getDate() + 15)),
      isActive: true,
      usageCount: 142
    },
    {
      id: "PR-2",
      code: "FREE_PILA_SHIP",
      type: "SHIPPING",
      value: 0,
      expiry: new Date(new Date().setDate(new Date().getDate() + 30)),
      isActive: true,
      usageCount: 89
    }
  ]);

  const [isFreeShippingGlobal, setIsFreeShippingGlobal] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<PromoFormData>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      type: 'DISCOUNT',
      discountType: 'PERCENTAGE',
      value: 0,
      code: '',
      expiry: ''
    }
  });

  const watchType = useWatch({
    control,
    name: 'type',
    defaultValue: 'DISCOUNT'
  });

  const onSubmit = useCallback((data: PromoFormData) => {
    sessionPromoCounter += 1;
    const newPromo: IPromotion = {
      id: `PR-${sessionPromoCounter}`,
      code: data.code,
      type: data.type as IPromotion['type'],
      discountType: data.type === 'DISCOUNT' ? data.discountType as IPromotion['discountType'] : undefined,
      value: data.value,
      expiry: new Date(data.expiry),
      isActive: true,
      usageCount: 0
    };
    setPromos(prev => [newPromo, ...prev]);
    setIsAddFormOpen(false);
    reset();
  }, [reset]);

  const togglePromo = (id: string) => {
    setPromos(promos.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const deletePromo = (id: string) => {
    setPromos(promos.filter(p => p.id !== id));
  };

  const totalClaims = useMemo(() => promos.reduce((sum, p) => sum + p.usageCount, 0), [promos]);
  const activePromoCount = useMemo(() => promos.filter(p => p.isActive && isAfter(new Date(p.expiry), new Date())).length, [promos]);
  console.log('Active Promos:', activePromoCount);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Stats */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <TicketPercent className="text-[#75EEA5]" size={36} />
            Pixs Growth Engine
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage discounts, custom service tiers, and localized promotions.</p>
        </div>
        
        <div className="bg-slate-900 rounded-2xl p-6 text-white min-w-[240px] shadow-lg relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#75EEA5] rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Total Voucher Claims</p>
          <div className="text-4xl font-black text-[#75EEA5] flex items-center">
            <AnimatedNumber value={totalClaims} />
            <span className="text-xl text-slate-500 ml-2">uses</span>
          </div>
        </div>
      </div>

      {/* Global Toggles */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Peak Season Free Shipping</h3>
              <p className="text-sm text-slate-500">Overrides location logic and applies to all.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsFreeShippingGlobal(!isFreeShippingGlobal)}
            className="text-slate-400 hover:text-[#75EEA5] transition-colors"
          >
            {isFreeShippingGlobal ? <ToggleRight size={48} className="text-[#75EEA5]" /> : <ToggleLeft size={48} />}
          </button>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Auto Pila, Laguna Free Ship</h3>
              <p className="text-sm text-slate-500">&lt; 5km radius from Pixs Base [14.23, 121.36]</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-full border border-blue-200">
            Active
          </div>
        </motion.div>
      </div>

      {/* Promotion Engine Table & Calendar */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Layers size={20} className="text-slate-400" /> Promotion Rules
            </h2>
            <button 
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Plus size={16} /> New Promo Code
            </button>
          </div>

          <AnimatePresence>
            {isAddFormOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-50 border-b border-slate-200 overflow-hidden"
              >
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Promo Code</label>
                    <input 
                      {...register('code')}
                      placeholder="e.g. SUMMER_2026"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm uppercase font-mono focus:outline-none focus:border-[#75EEA5] focus:ring-1 focus:ring-[#75EEA5]"
                    />
                    {errors.code && <p className="text-red-500 text-xs mt-1">{String(errors.code.message)}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Rule Type</label>
                    <select 
                      {...register('type')}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#75EEA5]"
                    >
                      <option value="DISCOUNT">Discount Pricing</option>
                      <option value="SHIPPING">Shipping Waiver</option>
                      <option value="SERVICE">Service Tier Access</option>
                    </select>
                  </div>

                  {watchType === 'DISCOUNT' && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Discount Method</label>
                      <select 
                        {...register('discountType')}
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#75EEA5]"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount (₱)</option>
                        <option value="BOGO">Buy X Get Y</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Value</label>
                    <input 
                      type="number"
                      step="0.01"
                      {...register('value', { valueAsNumber: true })}
                      placeholder="e.g. 15"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#75EEA5]"
                    />
                    {errors.value && <p className="text-red-500 text-xs mt-1">{String(errors.value.message)}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Expiry Date</label>
                    <input 
                      type="datetime-local"
                      {...register('expiry')}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#75EEA5]"
                    />
                    {errors.expiry && <p className="text-red-500 text-xs mt-1">{String(errors.expiry.message)}</p>}
                  </div>

                  <div className="col-span-2 flex justify-end mt-2">
                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-[#75EEA5] text-slate-900 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#5ED28C] transition-colors"
                    >
                      Generate Rule
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Promo Code</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Type / Value</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Status / Uses</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map(promo => {
                  const isExpired = isBefore(new Date(promo.expiry), new Date());
                  return (
                    <motion.tr 
                      key={promo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-800">{promo.code}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <CalendarDays size={12} />
                          Exp: {format(new Date(promo.expiry), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700">
                          {promo.type === 'DISCOUNT' ? `${promo.discountType} ` : `${promo.type} `}
                          <span className="text-[#75EEA5] bg-[#75EEA5]/10 px-2 rounded-full ml-1">
                            {promo.type === 'DISCOUNT' && promo.discountType === 'PERCENTAGE' ? `${promo.value}%` : `₱${promo.value}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            promo.isActive && !isExpired ? "bg-[#75EEA5]" : "bg-slate-300"
                          )}></div>
                          <div className="text-sm text-slate-600 font-medium">
                            {promo.usageCount} uses
                          </div>
                        </div>
                        {isExpired && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1 block">Expired</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => togglePromo(promo.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-xs font-bold",
                              promo.isActive 
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                                : "bg-[#75EEA5]/20 text-[#2C523A] hover:bg-[#75EEA5]/30"
                            )}
                          >
                            {promo.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button 
                            onClick={() => deletePromo(promo.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Promo Calendar Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CalendarDays size={20} className="text-[#75EEA5]" /> Promo Calendar
          </h2>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {promos.sort((a,b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime()).map(promo => {
              const daysLeft = Math.ceil((new Date(promo.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              const isEndingSoon = daysLeft > 0 && daysLeft <= 3;
              
              return (
                <div key={`${promo.id}-cal`} className="p-4 rounded-xl border border-slate-100 bg-slate-50 relative overflow-hidden">
                  {isEndingSoon && (
                    <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                      Ending Soon
                    </div>
                  )}
                  <h4 className="font-mono font-bold text-slate-800 text-sm">{promo.code}</h4>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xs text-slate-500 font-medium">Valid until {format(new Date(promo.expiry), 'MMM dd')}</p>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-md",
                      daysLeft > 0 ? "bg-[#75EEA5]/20 text-[#2C523A]" : "bg-red-50 text-red-500"
                    )}>
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
