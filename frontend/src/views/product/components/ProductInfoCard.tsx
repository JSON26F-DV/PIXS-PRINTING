import React from 'react';
import { MapPin, Printer, Info, Maximize, Activity } from 'lucide-react';
import type { IProduct, IProductVariant } from '../../../types/product.types';

interface ProductInfoCardProps {
  product: IProduct;
  selectedVariant: IProductVariant | null;
}

/**
 * Enterprise Product Logic Card.
 * Displays derived technical node specifications and item metadata.
 * Pattern: High-density layout with categorized informational nodes.
 */
const ProductInfoCard: React.FC<ProductInfoCardProps> = ({ product, selectedVariant }) => {
  return (
    <div className="bg-white rounded-[44px] p-8 md:p-12 shadow-2xl shadow-slate-100 border border-slate-50 space-y-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-pixs-mint/10 flex items-center justify-center text-pixs-mint">
           <Info size={18} strokeWidth={3} />
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[4px] italic">Technical Identification Node</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Core Attributes */}
        <div className="space-y-6">
           <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[32px] border border-transparent hover:border-slate-100 transition-colors">
              <Maximize className="text-slate-400 mt-1" size={18} />
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dimensions</p>
                 <p className="text-sm font-black text-slate-900 leading-none">
                   Rim: {selectedVariant?.width ?? 'Standard'} · Height: {selectedVariant?.height ?? 'Varies'}
                 </p>
              </div>
           </div>

           <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[32px] border border-transparent hover:border-slate-100 transition-colors">
              <MapPin className="text-slate-400 mt-1" size={18} />
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Strategic Fit</p>
                 <p className="text-sm font-black text-slate-900 leading-tight">
                   Best for: {product.best_for}
                 </p>
              </div>
           </div>
        </div>

        {/* Operational Attributes */}
        <div className="space-y-6">
           <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[32px] border border-transparent hover:border-slate-100 transition-colors">
              <Printer className="text-slate-400 mt-1" size={18} />
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Production Logic</p>
                 <p className="text-sm font-black text-slate-900 leading-none">
                   Method: {product.print_method}
                 </p>
              </div>
           </div>

           <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[32px] border border-transparent hover:border-slate-100 transition-colors">
              <Activity className="text-slate-400 mt-1" size={18} />
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Threshold Metadata</p>
                 <p className="text-sm font-black text-slate-900 leading-none">
                   Min Order: {product.min_order.toLocaleString()} Units
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Identity Block */}
      <div className="pt-8 border-t border-slate-50">
         <div className="flex flex-wrap gap-2">
            {product.tags.map(tag => (
              <span key={tag} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10"># {tag}</span>
            ))}
            <span className="px-4 py-2 bg-pixs-mint text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-pixs-mint/10">{product.category}</span>
         </div>
      </div>
    </div>
  );
};

export default ProductInfoCard;
