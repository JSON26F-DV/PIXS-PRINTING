import React, { useState, useMemo, useEffect } from 'react';
import { 
  TicketPercent, 
  Plus, 
  Search, 
  ShoppingBag, 
  Tag, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Zap, 
  Gift, 
  TrendingUp, 
  Award,
  AlertCircle,
  Copy,
  ArrowRight,
  Users,
  User
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isBefore, parseISO, addDays } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Data Sources
import rawPromos from '../../data/marketing_promotions.json';
import rawUsers from '../../data/user.json';
import rawProducts from '../../data/products.json';
import rawOrders from '../../data/order.json';

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces
interface Promotion {
  id: string;
  title: string;
  discount_type: 'unit' | 'percentage' | 'fixed' | 'product-specific';
  discount_value: number;
  target_type: 'specific_user' | 'all_users' | 'code';
  assigned_user_id?: string;
  product_id?: string;
  code?: string;
  max_uses: number;
  used_count: number;
  expires_at: string;
  status: 'active' | 'used' | 'expired';
  conditions?: {
    minimum_quantity?: number;
  };
}

interface OrderRecord {
  order_id: string;
  discount?: {
    total_discount_amount: number;
  };
}

interface DiscountNode {
  discount_id: string;
  type: string;
  value: number;
  product_id?: string;
  remaining_uses: number;
  is_one_time: boolean;
  expires_at: string;
  status: string;
}

interface UserNode {
  id: string;
  name: string;
  email: string;
  role: string;
  discounts?: DiscountNode[];
}

// Validation Schema
const promoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  discount_type: z.enum(['unit', 'percentage', 'fixed', 'product-specific']),
  discount_value: z.number().positive("Value must be greater than zero"),
  target_type: z.enum(['specific_user', 'all_users', 'code']),
  assigned_user_id: z.string().optional(),
  product_id: z.string().optional(),
  code: z.string().optional(),
  expires_at: z.string().refine(val => !isBefore(parseISO(val), new Date()), "Expiration must be a future date"),
  max_uses: z.number().int().positive().default(1),
  is_one_time: z.boolean().default(true),
  min_quantity: z.number().optional()
}).refine(data => {
  if (data.target_type === 'specific_user' && !data.assigned_user_id) return false;
  if (data.target_type === 'code' && !data.code) return false;
  if (data.discount_type === 'product-specific' && !data.product_id) return false;
  return true;
}, {
  message: "Required fields missing for selected configuration",
  path: ["target_type"]
});

type PromoFormData = z.infer<typeof promoSchema>;

const MarketingPromotions: React.FC = () => {
  const [promos, setPromos] = useState<Promotion[]>(rawPromos as Promotion[]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // --- FORM SETUP ---
  const { register, handleSubmit, setValue, reset, control, formState: { errors } } = useForm<PromoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(promoSchema) as any,
    defaultValues: {
      discount_type: 'percentage',
      target_type: 'all_users',
      max_uses: 1,
      is_one_time: true,
      expires_at: format(addDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm"),
      discount_value: 0,
      title: '',
      code: '',
      min_quantity: 0
    }
  });

  const watchType = useWatch({ control, name: 'discount_type' });
  const watchTarget = useWatch({ control, name: 'target_type' });
  const watchOneTime = useWatch({ control, name: 'is_one_time' });

  useEffect(() => {
    if (watchOneTime) setValue('max_uses', 1);
  }, [watchOneTime, setValue]);

  // --- THE TICKER SYSTEM (Expiration Checker) ---
  useEffect(() => {
    const checkExpirations = () => {
      const now = new Date();
      let changed = false;
      const updated = promos.map(p => {
        if (p.status === 'active' && isBefore(parseISO(p.expires_at), now)) {
          changed = true;
          return { ...p, status: 'expired' as const };
        }
        return p;
      });
      if (changed) setPromos(updated);
    };

    checkExpirations();
    const timer = setInterval(checkExpirations, 60000); // Every minute
    return () => clearInterval(timer);
  }, [promos]);

  // --- STATS ---
  const stats = useMemo(() => {
    const active = promos.filter(p => p.status === 'active').length;
    const expiringSoon = promos.filter(p => {
      const diff = parseISO(p.expires_at).getTime() - new Date().getTime();
      return p.status === 'active' && diff > 0 && diff < (1000 * 60 * 60 * 24 * 3); // 3 days
    }).length;
    
    const usedToday = 0; // Simulated from orders
    const totalDiscount = (rawOrders as OrderRecord[]).reduce((acc, o) => acc + (o.discount?.total_discount_amount || 0), 0);

    return { active, expiringSoon, usedToday, totalDiscount };
  }, [promos]);

  // --- ANALYTICS ---
  const analyticsData = useMemo(() => {
    return promos.slice(0, 5).map(p => ({
      name: p.title.substring(0, 10),
      usage: p.used_count,
      limit: p.max_uses
    }));
  }, [promos]);

  // --- FILTERED PROMOS ---
  const filteredPromos = useMemo(() => {
    return promos.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || p.status === filter || p.discount_type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [promos, searchTerm, filter]);

  // --- HANDLERS ---
  const onFormSubmit = (data: PromoFormData) => {
    const newPromo: Promotion = {
      id: `PROMO-${uuidv4().substring(0, 8).toUpperCase()}`,
      title: data.title,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      target_type: data.target_type,
      assigned_user_id: data.assigned_user_id,
      product_id: data.product_id,
      code: data.code?.toUpperCase(),
      max_uses: data.max_uses,
      used_count: 0,
      expires_at: data.expires_at,
      status: 'active',
      conditions: data.min_quantity ? { minimum_quantity: data.min_quantity } : undefined
    };

    setPromos([newPromo, ...promos]);
    toast.success("Promotion Engine Initialized", {
      icon: '🚀',
      style: { borderRadius: '16px', background: '#0f172a', color: '#fff' }
    });
    setIsModalOpen(false);
    reset();
  };

  const handleCopyCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success("Code copied to buffer");
  };

  return (
    <div className="admin-promo-container space-y-10 animate-in fade-in duration-500 max-w-[1700px] mx-auto px-4 lg:px-10 pb-20">
      
      {/* 🚀 HEADER & STATS */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-12">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-slate-900 rounded-[22px] text-[#75EEA5] shadow-2xl shadow-slate-900/20">
                <TicketPercent size={28} />
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Marketing Arsenal</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-1 italic">Enterprise Yield Optimization & Loyalty Controller</p>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-5 bg-[#75EEA5] text-slate-900 text-[11px] font-black uppercase tracking-[3px] rounded-[24px] hover:bg-[#5de291] transition-all shadow-xl shadow-emerald-500/20 hover:-translate-y-1 flex items-center gap-3 italic border border-[#5de291]/50"
          >
            <Plus size={18} />
            Initialize Campaign
          </button>
        </div>
      </header>

      {/* 📊 SUMMARY CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="admin-promo-card p-8 bg-slate-900 rounded-[32px] text-white overflow-hidden relative group">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Zap size={100} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[3px] opacity-60 mb-4">Active Campaigns</p>
          <div className="flex items-baseline gap-2">
             <h3 className="text-5xl font-black italic tracking-tighter">{stats.active}</h3>
             <span className="text-xs font-bold text-[#75EEA5]">LIVE</span>
          </div>
        </div>

        <div className="admin-promo-card p-8 bg-white border border-slate-100 rounded-[32px] shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <Clock size={100} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-4">Urgent Threshold</p>
          <div className="flex items-baseline gap-2">
             <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.expiringSoon}</h3>
             <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Expiring Soon</span>
          </div>
        </div>

        <div className="admin-promo-card p-8 bg-white border border-slate-100 rounded-[32px] shadow-2xl shadow-slate-200/40 relative group">
          <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-4">Yield Forgone</p>
          <div className="flex items-baseline gap-2">
             <span className="text-xl font-bold text-slate-400">₱</span>
             <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalDiscount.toLocaleString()}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Net Loyalty Impact</p>
          </div>
        </div>

        <div className="admin-promo-card p-8 bg-white border border-slate-100 rounded-[32px] shadow-2xl shadow-slate-200/40 flex flex-col justify-between">
           <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={analyticsData}>
                 <Area type="monotone" dataKey="usage" stroke="#75EEA5" fill="#75EEA5" fillOpacity={0.1} />
              </AreaChart>
           </ResponsiveContainer>
           <div className="flex justify-between items-end">
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Peak Engagement</p>
                 <p className="text-sm font-black text-slate-900 uppercase italic">Velocity Tracker</p>
              </div>
              <ArrowRight className="text-slate-200" size={20} />
           </div>
        </div>
      </section>

      {/* 🛠️ CONTROLS & TABLE */}
      <div className="space-y-6">
        <div className="admin-promo-filter flex flex-col lg:flex-row items-center justify-between gap-6 p-6 bg-white border border-slate-100 rounded-[32px] shadow-2xl shadow-slate-200/30">
          <div className="relative flex-1 w-full max-w-lg group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#75EEA5] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Campaigns, Codes, or Targets..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] text-sm font-bold focus:outline-none focus:border-emerald-200 focus:bg-white transition-all text-slate-900 font-mono italic"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {['all', 'active', 'expired', 'unit', 'percentage', 'product-specific'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[2px] transition-all italic",
                  filter === f ? "bg-slate-900 text-white shadow-xl" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 TABLE VIEW */}
        <div className="admin-promo-table bg-white border border-slate-100 rounded-[44px] shadow-2xl shadow-slate-200/40 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Campaign Node</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Logic & Yield</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Propagation Target</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Load & Usage</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Timeline</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[3px] text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPromos.map(promo => {
                  const targetUser = (rawUsers as UserNode[]).find(u => u.id === promo.assigned_user_id);
                  const targetProd = rawProducts.find(p => p.id === promo.product_id);
                  const usagePercent = (promo.used_count / promo.max_uses) * 100;

                  return (
                    <tr key={promo.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-12 h-12 rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-110",
                            promo.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                          )}>
                             {promo.discount_type === 'unit' ? <Zap size={22} /> : 
                              promo.discount_type === 'percentage' ? <TicketPercent size={22} /> : 
                              promo.discount_type === 'product-specific' ? <ShoppingBag size={22} /> : <Tag size={22} />}
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-900 tracking-tight italic uppercase">{promo.title}</p>
                            <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">{promo.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex flex-col gap-1">
                            <span className="text-lg font-black text-slate-900 italic tracking-tighter">
                               {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : 
                                promo.discount_type === 'unit' ? `₱${promo.discount_value} OFF/UNIT` :
                                `₱${promo.discount_value} OFF`}
                            </span>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit",
                              promo.discount_type === 'unit' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                            )}>{promo.discount_type}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         {promo.target_type === 'code' ? (
                           <div onClick={() => handleCopyCode(promo.code)} className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-xl cursor-pointer group/code active:scale-95 transition-all">
                              <span className="text-xs font-mono font-black text-[#75EEA5] tracking-widest">{promo.code}</span>
                              <Copy size={12} className="text-white opacity-20 group-hover/code:opacity-100 transition-opacity" />
                           </div>
                         ) : promo.target_type === 'specific_user' ? (
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                 <User size={14} />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[11px] font-black text-slate-900 truncate uppercase italic">{targetUser?.name || 'Purged User'}</p>
                                 <p className="text-[9px] font-bold text-slate-400 truncate uppercase mt-0.5">ID: {promo.assigned_user_id}</p>
                              </div>
                           </div>
                         ) : (
                           <div className="flex items-center gap-2 text-slate-500">
                              <Users size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Global Broadcast</span>
                           </div>
                         )}
                         {targetProd && (
                           <div className="mt-3 flex items-center gap-2 text-slate-400">
                              <ShoppingBag size={12} />
                              <span className="text-[9px] font-bold uppercase truncate max-w-[120px]">{targetProd.name}</span>
                           </div>
                         )}
                      </td>
                      <td className="px-10 py-8">
                         <div className="w-full max-w-[120px]">
                            <div className="flex justify-between items-baseline mb-2">
                               <p className="text-[10px] font-black text-slate-900">{promo.used_count}/{promo.max_uses}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">USES</p>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                 className={cn("h-full transition-all duration-1000", usagePercent > 90 ? "bg-rose-500" : "bg-slate-900")} 
                                 style={{ width: `${Math.min(100, usagePercent)}%` }} 
                               />
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-slate-900 italic uppercase">
                               {format(parseISO(promo.expires_at), 'MMM dd, yyyy')}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                               <Clock size={10} />
                               {format(parseISO(promo.expires_at), 'hh:mm a')}
                            </span>
                         </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <div className={cn(
                           "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest italic",
                           promo.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                           promo.status === 'expired' ? "bg-slate-100 text-slate-400 border-slate-200" :
                           "bg-amber-50 text-amber-600 border-amber-100"
                         )}>
                            <div className={cn("w-2 h-2 rounded-full", promo.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                            {promo.status}
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 📊 ANALYTICS VISUALIZER */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[48px] p-10 shadow-2xl shadow-slate-200/40">
           <div className="flex items-center justify-between mb-10">
              <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase italic">Engagement Velocity</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mt-1">Market Pulse Analysis per Campaign Node</p>
              </div>
              <div className="flex items-center gap-3 px-6 py-2 bg-slate-50 border border-slate-100 rounded-full">
                 <Activity size={14} className="text-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Live Telemetry</span>
              </div>
           </div>
           
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={analyticsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <Tooltip 
                       cursor={{ fill: '#f8fafc' }}
                       contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                    />
                    <Bar dataKey="usage" radius={[12, 12, 12, 12]} barSize={40}>
                       {analyticsData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0f172a' : '#75EEA5'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden group border border-slate-800">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-[2000ms]">
                 <TrendingUp size={120} className="text-[#75EEA5]" />
              </div>
              <div className="relative z-10">
                 <h4 className="text-xl font-black italic uppercase mb-10 text-[#75EEA5]">Awards & Milestones</h4>
                 <div className="space-y-8">
                    {[
                      { icon: Award, label: 'Loyalty Tier 1', requirement: '1,000 Points', reward: '₱200 Voucher' },
                      { icon: Gift, label: 'Boutique Bonus', requirement: '5 Orders', reward: 'Free Screenplate' },
                      { icon: Zap, label: 'Speedster Award', requirement: '3 Instant Pays', reward: '5% Perpetual' }
                    ].map((award, i) => (
                      <div key={i} className="flex items-center gap-5 border-b border-white/5 pb-6">
                         <div className="w-12 h-12 bg-white/10 rounded-[18px] flex items-center justify-center text-[#75EEA5]">
                            <award.icon size={22} />
                         </div>
                         <div>
                            <p className="text-sm font-black uppercase italic">{award.label}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{award.requirement}</span>
                               <ChevronRight size={10} className="text-white/20" />
                               <span className="text-[9px] font-black text-[#75EEA5] uppercase tracking-widest">{award.reward}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
                 <button className="w-full mt-12 py-5 bg-white/5 border border-white/10 rounded-[24px] text-[10px] font-black uppercase tracking-[3px] hover:bg-white/10 transition-all">
                    Configure Loyalty Engine
                 </button>
              </div>
           </div>

           <div className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-xl flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-[22px] flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors duration-500">
                 <AlertCircle size={28} />
              </div>
              <div>
                 <h5 className="text-sm font-black text-slate-900 uppercase italic">Anomaly Shield</h5>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1">No Negative Totals Detected</p>
              </div>
           </div>
        </div>
      </section>

      {/* 🏗️ CREATE PROMOTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 lg:p-8 bg-slate-900/90 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="bg-white w-full max-w-4xl h-full lg:h-auto lg:max-h-[85vh] rounded-none lg:rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative border-x-8 border-slate-50 animate-in slide-in-from-right-full duration-700">
              
              <div className="p-10 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-10">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-900 rounded-[18px] text-[#75EEA5]">
                       <Zap size={24} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Campaign Provisioner</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mt-1 italic">Configure Yield Logic & Target Parameters</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 bg-slate-50 text-slate-400 hover:text-white hover:bg-rose-500 rounded-full transition-all flex items-center justify-center">
                    <XCircle size={24} />
                 </button>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="p-10 overflow-y-auto custom-scrollbar space-y-10 bg-white">
                 
                 {/* Section 1: Core Meta */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] px-2 italic">Campaign Title</label>
                       <input 
                         {...register('title')}
                         className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-base font-black text-slate-900 focus:outline-none focus:border-[#75EEA5] focus:bg-white transition-all font-mono italic shadow-inner"
                         placeholder="e.g. VIP Laguna Launch"
                       />
                       {errors.title && <p className="text-[10px] text-rose-500 font-bold px-4">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] px-2 italic">Discount Logic Type</label>
                       <div className="grid grid-cols-2 gap-2">
                          {(['percentage', 'fixed', 'unit', 'product-specific'] as const).map((t) => (
                            <label key={t} className={cn(
                              "relative flex items-center justify-center p-4 border rounded-[20px] cursor-pointer transition-all",
                              watchType === t ? "bg-slate-900 border-slate-900 text-white shadow-xl" : "bg-white border-slate-100 text-slate-400 hover:border-[#75EEA5]"
                            )}>
                               <input type="radio" value={t} {...register('discount_type')} className="sr-only" />
                               <span className="text-[9px] font-black uppercase tracking-widest">{t}</span>
                            </label>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Section 2: Economics */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-slate-50 rounded-[40px] border border-slate-100">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] italic">Discount Value</label>
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black italic">{watchType === 'percentage' ? '%' : '₱'}</span>
                          <input 
                            type="number" step="0.01"
                            {...register('discount_value', { valueAsNumber: true })}
                            className="w-full pl-12 pr-6 py-5 bg-white border border-slate-200 rounded-[20px] text-xl font-black text-slate-900 focus:outline-none focus:border-[#75EEA5] transition-all font-mono"
                          />
                       </div>
                       {errors.discount_value && <p className="text-[10px] text-rose-500 font-bold px-2">{errors.discount_value.message}</p>}
                    </div>

                    {watchType === 'product-specific' && (
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] italic">Link Product Node</label>
                         <select 
                           {...register('product_id')}
                           className="w-full px-6 py-5 bg-white border border-slate-200 rounded-[20px] text-sm font-black text-slate-900 focus:outline-none focus:border-[#75EEA5] transition-all appearance-none italic"
                         >
                            <option value="">Select Product...</option>
                            {rawProducts.map(p => <option key={p.id} value={p.id}>{p.name} (₱{p.base_price})</option>)}
                         </select>
                      </div>
                    )}

                    {watchType === 'unit' && (
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] italic">Minimum Quantity Condition</label>
                         <input 
                           type="number"
                           {...register('min_quantity', { valueAsNumber: true })}
                           className="w-full px-6 py-5 bg-white border border-slate-200 rounded-[20px] text-xl font-black text-slate-900 focus:outline-none focus:border-[#75EEA5] transition-all font-mono"
                           placeholder="300"
                         />
                      </div>
                    )}

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] italic">Expiration Timer</label>
                       <input 
                         type="datetime-local"
                         {...register('expires_at')}
                         className="w-full px-6 py-5 bg-white border border-slate-200 rounded-[20px] text-xs font-black text-slate-900 focus:outline-none focus:border-[#75EEA5] transition-all font-mono uppercase"
                       />
                       {errors.expires_at && <p className="text-[10px] text-rose-500 font-bold px-2">{errors.expires_at.message}</p>}
                    </div>
                 </div>

                 {/* Section 3: Propagation Target */}
                 <div className="space-y-6">
                    <div className="flex flex-wrap gap-4">
                       {[
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         { id: 'all_users', label: 'Broadcast All', icon: Users as any },
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         { id: 'specific_user', label: 'Specific Entity', icon: User as any },
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         { id: 'code', label: 'Manual Code', icon: Tag as any }
                       ].map(t => (
                         <label key={t.id} className={cn(
                           "flex-1 min-w-[180px] p-6 rounded-[32px] border cursor-pointer transition-all flex flex-col items-center gap-3",
                           watchTarget === t.id ? "bg-slate-900 border-slate-900 text-white shadow-2xl" : "bg-white border-slate-100 text-slate-400 hover:border-[#75EEA5]"
                         )}>
                            <input type="radio" value={t.id} {...register('target_type')} className="sr-only" />
                            <t.icon size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                         </label>
                       ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                       {watchTarget === 'specific_user' && (
                         <div className="space-y-3 animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] italic">Select User Entity</label>
                            <select 
                              {...register('assigned_user_id')}
                              className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-black text-slate-900 focus:outline-none focus:border-[#75EEA5] transition-all appearance-none italic"
                            >
                               <option value="">Search user.json...</option>
                               {(rawUsers as UserNode[]).filter(u => u.role === 'customer').map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                            </select>
                         </div>
                       )}

                       {watchTarget === 'code' && (
                         <div className="space-y-3 animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] italic">Manual Redeem Code</label>
                            <div className="relative">
                               <input 
                                 {...register('code')}
                                 className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-xl font-black text-slate-900 focus:outline-none focus:border-[#75EEA5] transition-all font-mono italic tracking-widest uppercase"
                                 placeholder="SUMMER2026"
                               />
                               <button 
                                 type="button"
                                 onClick={() => setValue('code', uuidv4().substring(0, 8).toUpperCase())}
                                 className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-xl text-slate-400 hover:text-slate-900"
                               >
                                  <Zap size={18} />
                               </button>
                            </div>
                         </div>
                       )}

                       <div className="space-y-3">
                          <div className="flex items-center justify-between px-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] italic">Max Propagation Limit</label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">One-Time Use</span>
                                <div className={cn(
                                  "w-10 h-5 rounded-full relative transition-colors",
                                  watchOneTime ? "bg-[#75EEA5]" : "bg-slate-200"
                                )}>
                                   <input type="checkbox" {...register('is_one_time')} className="sr-only" />
                                   <div className={cn(
                                     "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                     watchOneTime ? "left-6" : "left-1"
                                   )} />
                                </div>
                             </label>
                          </div>
                          <input 
                            type="number"
                            disabled={watchOneTime}
                            {...register('max_uses', { valueAsNumber: true })}
                            className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-xl font-black text-slate-900 focus:outline-none focus:border-[#75EEA5] transition-all font-mono disabled:opacity-30"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="p-10 bg-slate-900 rounded-[40px] text-white space-y-6">
                    <div className="flex items-center gap-4">
                       <Shield size={24} className="text-[#75EEA5]" />
                       <h4 className="text-xl font-black italic uppercase tracking-tighter">Immunity & Safeguard Check</h4>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {[
                         "No Negative Overrides Guaranteed",
                         "Automatic Expiration Cleanup",
                         "One-Time Redeem Security Layer",
                         "Backend Migration Compatible Pivot"
                       ].map((check, i) => (
                         <li key={i} className="flex items-center gap-3 text-slate-400">
                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[#75EEA5]">
                               <CheckCircle2 size={12} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest">{check}</span>
                         </li>
                       ))}
                    </ul>
                 </div>

                 <div className="sticky bottom-0 bg-white pt-6 pb-2 border-t border-slate-50 flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-6 border border-slate-100 rounded-[28px] text-[11px] font-black uppercase tracking-[3px] text-slate-400 hover:bg-slate-50 transition-all font-mono italic"
                    >
                       Abort Mission
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-6 bg-slate-900 text-white rounded-[28px] text-[11px] font-black uppercase tracking-[3px] hover:bg-slate-800 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/40"
                    >
                       Propagate Campaign Strategy
                       <ArrowRight size={18} className="text-[#75EEA5]" />
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

// Generic Shield Icon fallback
const Shield = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export default MarketingPromotions;
