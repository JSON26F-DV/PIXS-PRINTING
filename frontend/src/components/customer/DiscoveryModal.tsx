import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  Search, 
  ArrowLeft,
  Heart,
  Plus,
  Package,
  X
} from 'lucide-react';
import gsap from 'gsap';
import { Link } from 'react-router-dom';
import productsData from '../../data/products.json';
import categoriesData from '../../data/categories.json';

// --- Interfaces ---
interface IProduct {
  id: string;
  name: string;
  category: string;
  base_price: number;
  current_stock: number;
}

interface ICategory {
  id: string;
  label: string;
  count: number;
  image: string;
}

const DiscoveryModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  initialCategory?: string | null;
}> = ({ isOpen, onClose, initialCategory }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const categories = categoriesData as ICategory[];

  // 1. Strict Scroll Lock Persistence
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => setShouldRender(true), 0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // 2. Initial Setup logic
  useEffect(() => {
    if (initialCategory) {
      setTimeout(() => {
        setSelectedCategory(initialCategory);
        setQuery(initialCategory);
      }, 0);
    } else if (isOpen) {
      setTimeout(() => {
        setSelectedCategory(null);
        setQuery('');
      }, 0);
    }
  }, [initialCategory, isOpen]);

  // 3. GSAP Precision Motion
  useLayoutEffect(() => {
    if (!shouldRender || !modalRef.current) return;

    if (isOpen) {
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );
      tl.fromTo(modalRef.current, 
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.7, ease: "expo.out", force3D: true },
        "-=0.3"
      );

      if (gridRef.current) {
        tl.fromTo(gridRef.current.children,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power4.out" },
          "-=0.5"
        );
      }
    }
  }, [isOpen, shouldRender]);

  const handleClose = () => {
    if (!modalRef.current) return;
    
    const tl = gsap.timeline({
      onComplete: () => {
        setShouldRender(false);
        onClose();
      }
    });

    tl.to(modalRef.current, { yPercent: 100, opacity: 0, duration: 0.5, ease: "power4.in", force3D: true });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.3 }, "-=0.2");
  };

  const filteredResults = useMemo(() => {
    if (!query && !selectedCategory) return [];
    return (productsData as IProduct[]).filter(p => {
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase());
      const matchCategory = !selectedCategory || p.category.includes(selectedCategory);
      return matchQuery && matchCategory;
    });
  }, [query, selectedCategory]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[100] h-screen w-screen overflow-hidden flex flex-col justify-end">
      {/* Search Modal Backdrop Backdrop */}
      <div 
        ref={overlayRef}
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl pointer-events-auto"
      />
      
      {/* Modal Container: Scroll Lock Active View */}
      <div
        ref={modalRef}
        className="relative h-[92vh] w-full bg-white rounded-t-[52px] shadow-2xl flex flex-col overflow-hidden z-20"
      >
        {/* Persistent Search Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-6 border-b border-slate-50 flex items-center gap-4">
          <button 
            onClick={handleClose}
            className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all active:scale-90"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pixs-mint transition-colors" size={20} />
            <input 
              autoFocus
              type="text" 
              value={query}
              onChange={(e) => {setQuery(e.target.value); setSelectedCategory(null);}}
              placeholder="SKU Code / Keyword Search Protocol"
              className="w-full bg-slate-50 border border-slate-50 rounded-2xl py-5 pl-16 pr-14 text-sm font-black text-slate-900 focus:outline-none focus:border-pixs-mint focus:bg-white transition-all shadow-inner italic"
            />
            {query && (
               <button 
                 onClick={() => {setQuery(''); setSelectedCategory(null);}}
                 className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300"
               >
                 <X size={14} />
               </button>
            )}
          </div>
        </div>

        {/* Discovery Hub - 2 COLUMN STRICT MODALITY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 custom-scrollbar pb-24">
          
          {!query && !selectedCategory && (
            <section className="w-full">
              <h3 className="text-[10px] font-black uppercase tracking-[5px] text-slate-400 mb-10 px-2 italic">Product Classification Matrix</h3>
              <div ref={gridRef} className="grid grid-cols-2 gap-4 md:gap-8 w-full">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setQuery(cat.label);
                    }}
                    className="relative w-full aspect-square lg:aspect-[21/9] lg:h-64 rounded-[32px] md:rounded-[48px] overflow-hidden group shadow-xl bg-slate-100 border border-slate-100 hover:shadow-2xl hover:shadow-pixs-mint/20 transition-all duration-500"
                  >
                     <img 
                       src={cat.image} 
                       alt={cat.label} 
                       className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent group-hover:via-pixs-mint/40 transition-all duration-700" />
                     
                     <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-left">
                        <span className="text-base md:text-3xl font-black text-white drop-shadow-2xl italic uppercase leading-none tracking-tighter mb-2">
                           {cat.label}
                        </span>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-pixs-mint rounded-full animate-pulse shadow-[0_0_8px_#75EEA5]" />
                           <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest group-hover:text-white transition-colors">Cluster: Ready</span>
                        </div>
                     </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Results Projection */}
          {(query || selectedCategory) && (
            <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-end justify-between border-b border-slate-50 pb-8">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projection Active</p>
                     <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Units Identified: {filteredResults.length}</h2>
                  </div>
                  <button 
                    onClick={() => {setQuery(''); setSelectedCategory(null);}} 
                    className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-pixs-mint transition-all"
                  >
                    Reset Protocol
                  </button>
               </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-10">
                {filteredResults.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-100 rounded-[32px] md:rounded-[44px] p-2 flex flex-col group transition-all hover:shadow-2xl hover:shadow-slate-200/50"
                  >
                    <div className="relative aspect-square rounded-[24px] md:rounded-[36px] overflow-hidden bg-slate-50 mb-4 border border-slate-50 shadow-inner group-hover:bg-white transition-colors">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-100 group-hover:text-pixs-mint/10 transition-colors" />
                      </div>
                      <button className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-rose-500 transition-all shadow-sm active:scale-90 border border-slate-50">
                        <Heart size={18} />
                      </button>
                    </div>
                    <div className="px-4 pb-4 flex-1 flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[2px] mb-2 block italic">{product.category}</span>
                      <Link to={`/product/${product.id}`} onClick={onClose}>
                        <h4 className="text-xs md:text-sm font-black text-slate-900 leading-tight mb-4 group-hover:text-pixs-mint transition-colors tracking-tighter uppercase italic truncate">
                          {product.name}
                        </h4>
                      </Link>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                        <span className="text-sm md:text-xl font-black font-mono text-slate-900 italic tracking-tighter">₱{product.base_price.toLocaleString()}</span>
                        <button className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-pixs-mint hover:text-slate-900 transition-all shadow-md active:scale-95 group-hover:rotate-12">
                          <Plus size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredResults.length === 0 && (
                 <div className="py-32 text-center text-slate-200 space-y-4">
                    <Search size={64} className="mx-auto opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[8px]">Null Sequence Found</p>
                 </div>
              )}
            </section>
          )}

        </div>
      </div>
    </div>
  );
};

export default DiscoveryModal;
