import { useState } from 'react';
import { 
  Layers, Search, Plus, Edit, Trash2, ChevronRight, X, Check, ChevronDown, 
  Building2, UserCircle, Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { IUser, IScreenplate, IProduct } from './types';
import { ALIGNMENT_OPTIONS } from './constants';
import { 
  InputField, TextArea, ImageUploader, SectionTitle, ConfirmModal 
} from './UIComponents';
import toast, { Toaster } from 'react-hot-toast';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface ScreenplateSectionProps {
  customers: IUser[];
  screenplates: IScreenplate[];
  products: IProduct[];
  setScreenplates: React.Dispatch<React.SetStateAction<IScreenplate[]>>;
}

export const ScreenplateSection: React.FC<ScreenplateSectionProps> = ({ 
  customers, screenplates, products, setScreenplates 
}) => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [plateSearch, setPlateSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<IUser | null>(customers[0] || null);
  const [editingPlate, setEditingPlate] = useState<IScreenplate | null>(null);
  const [isAddingPlate, setIsAddingPlate] = useState(false);
  const [plateToDelete, setPlateToDelete] = useState<IScreenplate | null>(null);

  const filteredCustomers = customers.filter(c => {
    const s = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) || 
      c.email.toLowerCase().includes(s) || 
      (c.company_name || '').toLowerCase().includes(s)
    );
  });

  const platesForSelected = screenplates.filter(p => {
    const matchesCustomer = selectedCustomer && p.owner_id === selectedCustomer.id;
    const matchesSearch = p.plate_name.toLowerCase().includes(plateSearch.toLowerCase()) || 
                          p.id.toLowerCase().includes(plateSearch.toLowerCase());
    return matchesCustomer && matchesSearch;
  });

  const handleSavePlate = (plate: IScreenplate) => {
    if (isAddingPlate) {
      setScreenplates(prev => [...prev, { ...plate, id: `SP-${Date.now()}` }]);
      toast.success("New screenplate registered.");
    } else {
      setScreenplates(prev => prev.map(p => p.id === plate.id ? plate : p));
      toast.success("Registry updated.");
    }
    setEditingPlate(null);
    setIsAddingPlate(false);
  };

  const handleDeletePlate = () => {
    if (!plateToDelete) return;
    setScreenplates(prev => prev.filter(p => p.id !== plateToDelete.id));
    toast.success("Entry removed.");
    setPlateToDelete(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen -mx-8 -mt-8 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* LEFT SIDEBAR: CUSTOMERS */}
      <aside className="w-full lg:w-[380px] bg-white border-r border-slate-200 flex flex-col h-full z-10">
        <div className="p-8 border-b border-slate-100 space-y-6">
           <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 italic">
                <Users className="text-[#75EEA5]" size={20} /> CUSTOMER ACCOUNTS
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select an account to view registry</p>
           </div>
           
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#75EEA5] transition-all" size={16} />
              <input 
                type="text" 
                placeholder="Search name or company..." 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-tight focus:outline-none focus:border-[#75EEA5] focus:ring-4 focus:ring-[#75EEA5]/5 transition-all text-slate-900 placeholder:text-slate-300"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <div className="h-2" /> {/* Spacer */}

           {filteredCustomers.map((c) => (
             <button 
               key={c.id}
               onClick={() => setSelectedCustomer(c)}
               className={cn(
                 "w-full p-5 rounded-[24px] transition-all text-left flex items-center gap-4 group border relative",
                 selectedCustomer?.id === c.id ? "bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.02]" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
               )}
             >
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0">
                   <img src={c.profile_picture} className="w-full h-full object-cover" alt={c.name} />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-black truncate uppercase tracking-tight italic flex items-center gap-1.5">
                     <UserCircle size={10} className={selectedCustomer?.id === c.id ? "text-[#75EEA5]" : "text-slate-300"} />
                     {c.name}
                   </p>
                   {c.company_name && (
                     <p className={cn("text-[9px] font-black uppercase tracking-widest mt-1.5 truncate flex items-center gap-1.5", selectedCustomer?.id === c.id ? "text-slate-400" : "text-slate-400")}>
                        <Building2 size={10} />
                        {c.company_name}
                     </p>
                   )}
                </div>
                <ChevronRight size={14} className={cn("transition-transform shrink-0", selectedCustomer?.id === c.id ? "rotate-90 text-[#75EEA5]" : "text-slate-200 group-hover:translate-x-1")} />
             </button>
           ))}

           {filteredCustomers.length === 0 && (
             <div className="py-20 text-center opacity-20 flex flex-col items-center">
                <Search size={40} className="mb-4" />
                <p className="text-xs font-black uppercase tracking-widest italic">No accounts matched</p>
             </div>
           )}
        </div>
      </aside>

      {/* RIGHT CONTENT: SCREENPLATES */}
      <main className="flex-1 bg-slate-50/10 backdrop-blur-3xl overflow-hidden flex flex-col relative h-full">
         <div className="p-8 lg:p-10 border-b border-slate-100 bg-white/50 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-[#75EEA5] rounded-full" />
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{selectedCustomer?.name || 'Isolated Registry'}</h2>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{selectedCustomer?.company_name || 'Individual Industrial Storage'}</p>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search plate name..." 
                    className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-slate-900 transition-all w-[240px]"
                    value={plateSearch}
                    onChange={(e) => setPlateSearch(e.target.value)}
                  />
               </div>
               <button 
                 onClick={() => {
                   setIsAddingPlate(true);
                   setEditingPlate({
                     id: '',
                     owner_id: selectedCustomer?.id || customers[0].id,
                     plate_name: 'New Screen Mesh',
                     image: '',
                     channels: 1,
                     alignment: ALIGNMENT_OPTIONS[0],
                     technical_info: '',
                     comment: '',
                     compatibility: [],
                     is_flatscreen: false,
                     incompatible_products: [],
                     base_setup_fee: 450,
                     dimensions: ''
                   });
                 }}
                 className="bg-slate-900 text-[#75EEA5] px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 active:scale-95 shrink-0"
               >
                 <Plus size={16} /> Add New Entry
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar relative z-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
               {platesForSelected.map((plate) => {
                 return (
                   <motion.div layout id={`plate-${plate.id}`} key={plate.id} className="group bg-white p-6 border border-slate-100 rounded-[32px] hover:border-[#75EEA5]/30 hover:shadow-2xl hover:shadow-[#75EEA5]/5 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
                      {/* Plate Identification */}
                      
                      <div className="aspect-[16/10] bg-slate-100 rounded-[24px] overflow-hidden mb-6 relative border-4 border-white shadow-inner">
                         <img src={plate.image || 'https://placehold.co/800x600?text=Registry+Plate'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Mesh" />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="flex-1">
                         <h4 className="text-lg font-black text-slate-900 tracking-tight italic uppercase mb-1">{plate.plate_name}</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">ID: {plate.id}</p>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                             <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[2px] mb-1">CHANNELS</p>
                                <p className="text-sm font-black text-slate-900">{plate.channels} COLORS</p>
                             </div>
                             <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[2px] mb-1">SETUP FEE</p>
                                <p className="text-sm font-black text-emerald-600 uppercase">₱{plate.base_setup_fee ?? 0}</p>
                             </div>
                             <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[2px] mb-1">ALIGNMENT</p>
                                <p className="text-xs font-black text-slate-900 uppercase truncate">{plate.alignment}</p>
                             </div>
                             <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[2px] mb-1">DIMENSIONS</p>
                                <p className="text-[10px] font-black text-slate-900 uppercase truncate">{plate.dimensions || 'N/A'}</p>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[2px] italic">Compatibility Hub</h5>
                                <span className="text-[9px] font-black text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">{plate.compatibility.length} Nodes</span>
                             </div>
                             <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-hidden group-hover:max-h-none transition-all duration-500">
                                {plate.compatibility.map(c => {
                                   const prod = products.find(p => p.id === c.product_id);
                                   return (
                                     <div key={c.product_id} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-tight text-emerald-700 hover:text-emerald-900 hover:border-emerald-600 transition-all cursor-default">
                                        {prod?.name || c.product_id}
                                     </div>
                                   );
                                })}
                                {plate.compatibility.length === 0 && <p className="text-[10px] font-bold text-slate-300 italic">No compatible nodes mapped</p>}
                             </div>
                             
                             {plate.incompatible_products && plate.incompatible_products.length > 0 && (
                                <div className="space-y-2 mt-4">
                                   <div className="flex items-center justify-between">
                                      <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-[2px] italic">Incompatibility Matrix</h5>
                                   </div>
                                   <div className="flex flex-wrap gap-1.5">
                                      {plate.incompatible_products.map(id => {
                                         const prod = products.find(p => p.id === id);
                                         return (
                                           <div key={id} className="px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-[8px] font-black uppercase tracking-tight text-rose-400">
                                              {prod?.name || id}
                                           </div>
                                         );
                                      })}
                                   </div>
                                </div>
                             )}
                          </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex gap-2">
                            <button onClick={() => setEditingPlate(plate)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 border border-slate-100 rounded-xl transition-all active:scale-90 shadow-sm"><Edit size={14} /></button>
                            <button onClick={() => setPlateToDelete(plate)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 border border-slate-100 rounded-xl transition-all active:scale-90 shadow-sm"><Trash2 size={14} /></button>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">METRIC READY</p>
                            <div className="flex items-center gap-1 justify-end text-[#75EEA5] mt-1">
                               <Check size={12} strokeWidth={4} />
                               <span className="text-[10px] font-black uppercase">VALID</span>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 );
               })}

               {platesForSelected.length === 0 && (
                 <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-10 grayscale">
                    <Layers size={100} className="mb-6" />
                    <p className="text-xl font-black uppercase tracking-widest">Registry Vacuum Detected</p>
                    <p className="text-sm font-bold mt-2 italic uppercase">No screenplates are currently stored for this node context.</p>
                 </div>
               )}
            </div>
         </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
         {editingPlate && (
            <ScreenplateModal 
              plate={editingPlate} 
              customers={customers} 
              products={products}
              onClose={() => { setEditingPlate(null); setIsAddingPlate(false); }}
              onSave={handleSavePlate}
            />
         )}
         {plateToDelete && (
            <ConfirmModal 
              isOpen={!!plateToDelete}
              onClose={() => setPlateToDelete(null)}
              onConfirm={handleDeletePlate}
              title="Purge Registry Node?"
              message={`Proceeding will permanently delete the screenplate payload for "${plateToDelete.plate_name}". This data cannot be recovered.`}
            />
         )}
      </AnimatePresence>
    </div>
  );
};

// MODAL SUBCOMPONENT
const ScreenplateModal = ({ plate, customers, products, onClose, onSave }: { plate: IScreenplate, customers: IUser[], products: IProduct[], onClose: () => void, onSave: (p: IScreenplate) => void }) => {
  const [data, setData] = useState<IScreenplate>(plate);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const update = <K extends keyof IScreenplate>(field: K, val: IScreenplate[K]) => setData(p => ({ ...p, [field]: val }));

  const toggleProductSelection = (productId: string) => {
     const exists = data.compatibility.some(c => c.product_id === productId);
     if (exists) {
        update('compatibility', data.compatibility.filter(c => c.product_id !== productId));
     } else {
        // When adding to compatibility, remove from incompatibility if present
        const nextIncompatible = (data.incompatible_products || []).filter(id => id !== productId);
        update('incompatible_products', nextIncompatible);
        update('compatibility', [...data.compatibility, { product_id: productId, allowed_variants: [], print_price_per_unit: {} }]);
     }
  };

  const toggleIncompatibility = (productId: string) => {
     const next = [...(data.incompatible_products || [])];
     const idx = next.indexOf(productId);
     if (idx > -1) {
        next.splice(idx, 1);
     } else {
        // When adding to incompatibility, remove from compatibility if present
        const nextCompat = data.compatibility.filter(c => c.product_id !== productId);
        update('compatibility', nextCompat);
        next.push(productId);
     }
     update('incompatible_products', next);
  };

  const toggleVariant = (productId: string, variantId: string) => {
     const next = [...data.compatibility];
     const idx = next.findIndex(c => c.product_id === productId);
     if (idx === -1) return;
     
     const variants = next[idx].allowed_variants;
     if (variants.includes(variantId)) {
        next[idx].allowed_variants = variants.filter(v => v !== variantId);
        // Clean up price if variant removed
        if (next[idx].print_price_per_unit) {
           delete next[idx].print_price_per_unit![variantId];
        }
     } else {
        next[idx].allowed_variants = [...variants, variantId];
        if (!next[idx].print_price_per_unit) next[idx].print_price_per_unit = {};
        next[idx].print_price_per_unit![variantId] = 1.0; // default
     }
     update('compatibility', next);
  };

  const updateVariantPrice = (productId: string, variantId: string, price: number) => {
     const next = [...data.compatibility];
     const idx = next.findIndex(c => c.product_id === productId);
     if (idx === -1) return;
     if (!next[idx].print_price_per_unit) next[idx].print_price_per_unit = {};
     next[idx].print_price_per_unit![variantId] = price;
     update('compatibility', next);
  };

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 35, stiffness: 400 }} className="relative w-full max-w-4xl h-full bg-white shadow-3xl flex flex-col overflow-hidden">
         <div className="p-8 border-b border-slate-100 bg-white sticky top-0 z-40 flex items-center justify-between">
            <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Mesh Specification</h3>
               <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Update industrial registry and mapping</p>
            </div>
            <button onClick={onClose} className="p-4 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90"><X size={24} /></button>
         </div>

         <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar pb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-8">
                  <SectionTitle title="Aura & Identity" />
                  <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Customer Owner</label>
                     <select 
                        value={data.owner_id} 
                        onChange={(e) => update('owner_id', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-tight text-slate-900 outline-none focus:border-slate-900 transition-all appearance-none italic"
                     >
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company_name})</option>)}
                     </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Node Asset Image</p>
                    <ImageUploader value={data.image || ''} onChange={(v: string) => update('image', v)} className="aspect-video" />
                  </div>
               </div>
               <div className="space-y-8">
                  <SectionTitle title="Specifications" />
                  <InputField label="Registry Name" value={data.plate_name} onChange={(v: string) => update('plate_name', v)} placeholder="Standard Mesh..." />
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Channels</label>
                      <select 
                          value={data.channels} 
                          onChange={(e) => update('channels', parseInt(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black uppercase text-slate-900 focus:border-slate-900 appearance-none italic"
                      >
                          {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} COLORS</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Alignment</label>
                      <select 
                          value={data.alignment} 
                          onChange={(e) => update('alignment', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black uppercase text-slate-900 focus:border-slate-900 appearance-none italic"
                      >
                          {ALIGNMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Dimensions" value={data.dimensions || ''} onChange={(v: string) => update('dimensions', v)} placeholder="100x150mm..." />
                    <InputField label="Setup Fee (₱)" value={data.base_setup_fee?.toString() || ''} onChange={(v: string) => update('base_setup_fee', parseFloat(v))} placeholder="450..." />
                  </div>
                  <InputField label="Internal Comment" value={data.comment} onChange={(v: string) => update('comment', v)} placeholder="..." />
                  
                  <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[24px] border border-slate-800 shadow-xl group cursor-pointer hover:bg-slate-800 transition-all" 
                       onClick={() => {
                         const nextVal = !data.is_flatscreen;
                         update('is_flatscreen', nextVal);
                         
                         // Technical Rule Enforcement based on Category mapping (Milktea Cup vs. Meal Box)
                         const targetIncompatCategory = nextVal ? 'Milktea Cup' : 'Meal Box';
                         const filteredIncompatIds = products.filter(p => p.category === targetIncompatCategory).map(p => p.id);
                         
                         const currentIncompat = data.incompatible_products || [];
                         const nextIncompat = Array.from(new Set([
                            ...currentIncompat.filter(id => {
                               const p = products.find(prod => prod.id === id);
                               // Remove the opposing category if we switch modes? 
                               // User said "vise versa", so if I switch to flatscreen, I move milktea to incompat.
                               // If I switch to curved, I move mealbox to incompat.
                               return p?.category !== (nextVal ? 'Meal Box' : 'Milktea Cup');
                            }), 
                            ...filteredIncompatIds
                         ]));
                         
                         update('incompatible_products', nextIncompat);
                         
                         // Purge the new incompatibles from the compatibility matrix
                         update('compatibility', data.compatibility.filter(c => !filteredIncompatIds.includes(c.product_id)));

                         toast.success(
                            nextVal 
                               ? "Technician Mode: Curved Milktea Profiles restricted." 
                               : "Rotary Mode: Flat surfaces (Meal Boxes) restricted.", 
                            { icon: nextVal ? '🏢' : '🎡', style: { borderRadius: '16px', background: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 'bold' } }
                         );
                       }}>
                     <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", data.is_flatscreen ? "bg-[#75EEA5] text-slate-900" : "bg-slate-700 text-slate-400 group-hover:bg-slate-600")}>
                           <Layers size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Flatscreen Mode</p>
                           <p className="text-xs font-black text-white mt-1 uppercase tracking-tight italic">{data.is_flatscreen ? 'Technician Mesh Active' : 'Rotary/Curved Standard'}</p>
                        </div>
                     </div>
                     <div className={cn("w-10 h-6 rounded-full relative transition-all duration-300", data.is_flatscreen ? "bg-[#75EEA5]" : "bg-slate-700")}>
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300", data.is_flatscreen ? "right-1" : "left-1")} />
                     </div>
                  </div>
               </div>
            </div>

            <TextArea label="Baseline Data Logs" value={data.technical_info} onChange={(v: string) => update('technical_info', v)} placeholder="..." />

            <div className="space-y-8 pt-10 border-t border-slate-100">
               <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-widest italic">Compatibility Mapping</h4>
                    <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">Connect specific catalog nodes to this mesh</p>
                  </div>
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.filter(p => !p.category.toLowerCase().includes('lid')).map(p => {
                    const isSelected = data.compatibility.some(c => c.product_id === p.id);
                    const isIncompatible = (data.incompatible_products || []).includes(p.id);
                    const isExpanded = expandedProduct === p.id;
                    
                    return (
                      <div key={p.id} className={cn(
                        "rounded-[24px] overflow-hidden transition-all duration-300 border-2",
                        isSelected ? "border-[#75EEA5] bg-white shadow-lg shadow-[#75EEA5]/5" : 
                        isIncompatible ? "border-rose-400 bg-rose-50/20" : "border-slate-50 bg-slate-50/30"
                      )}>
                         <div className="w-full flex items-center gap-3 p-4">
                            <button 
                               onClick={() => toggleProductSelection(p.id)}
                               className={cn("shrink-0 p-2 rounded-xl border-2 transition-all", isSelected ? "bg-[#75EEA5] border-[#75EEA5] text-slate-900" : "bg-white border-slate-100 text-slate-200")}
                               title="Mark as Compatible"
                            >
                               <Check size={12} strokeWidth={4} />
                            </button>
                            
                            <button 
                               onClick={() => toggleIncompatibility(p.id)}
                               className={cn("shrink-0 p-2 rounded-xl border-2 transition-all", isIncompatible ? "bg-rose-500 border-rose-500 text-white" : "bg-white border-slate-100 text-slate-200")}
                               title="Mark as Incompatible"
                            >
                               <X size={12} strokeWidth={4} />
                            </button>

                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight italic">{p.name}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{p.category}</p>
                            </div>
                            {isSelected && (
                              <div 
                                 onClick={(e) => { e.stopPropagation(); setExpandedProduct(isExpanded ? null : p.id); }} 
                                 className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                              >
                                <ChevronDown size={12} className={cn("transition-transform", isExpanded && "rotate-180")} />
                              </div>
                            )}
                         </div>

                         <AnimatePresence>
                           {isExpanded && isSelected && (
                             <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/50">
                                <div className="p-4 space-y-4">
                                   <div className="grid grid-cols-1 gap-2">
                                      {p.variants.map(v => {
                                        const config = data.compatibility.find(c => c.product_id === p.id);
                                        const isLinked = config?.allowed_variants.includes(v.variant_id);
                                        const currentPrice = config?.print_price_per_unit?.[v.variant_id] || 0;
                                        
                                        return (
                                          <div key={v.variant_id} className="flex items-center gap-2">
                                             <button 
                                               onClick={() => toggleVariant(p.id, v.variant_id)}
                                               className={cn(
                                                 "flex-1 px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border text-left",
                                                 isLinked ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"
                                               )}
                                             >
                                                {v.size}
                                             </button>
                                             {isLinked && (
                                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2">
                                                   <span className="text-[7px] font-black text-slate-400 tracking-tighter uppercase leading-none mt-0.5">₱</span>
                                                   <input 
                                                      type="number" 
                                                      step="0.1"
                                                      value={currentPrice}
                                                      onChange={(e) => updateVariantPrice(p.id, v.variant_id, parseFloat(e.target.value))}
                                                      className="w-12 py-2 text-[10px] font-black text-slate-900 bg-transparent outline-none no-spinner text-center"
                                                   />
                                                </div>
                                             )}
                                          </div>
                                        );
                                      })}
                                   </div>
                                </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
            </div>
         </div>

         <div className="p-10 border-t border-slate-100 bg-white sticky bottom-0 z-50 flex gap-4">
            <button onClick={onClose} className="px-8 py-5 bg-slate-900/5 text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-[3px] hover:bg-slate-900/10 transition-all">ABORT</button>
            <button onClick={() => onSave(data)} className="flex-1 bg-slate-900 text-[#75EEA5] font-black py-5 rounded-2xl shadow-2xl shadow-slate-900/20 hover:-translate-y-1 transition-all uppercase tracking-[3px] text-[10px]">COMMIT PAYLOAD</button>
         </div>
      </motion.div>
    </div>
  );
};
