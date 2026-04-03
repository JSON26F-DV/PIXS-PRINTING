import React from 'react';
import { ShoppingBag, Tag, Package } from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  variant: {
    unitPrice: number;
    size: string;
  };
}

interface ReceiptSectionProps {
  items: CartItem[];
  deliveryFee: number;
  discountAmount?: number;
}

const ReceiptSection: React.FC<ReceiptSectionProps> = ({ items, deliveryFee, discountAmount = 0 }) => {
  const cartItems = items;
  
  const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.variant.unitPrice), 0);
  const total = subtotal + deliveryFee - discountAmount;

  return (
    <div className="ReceiptSection space-y-8 bg-white/80 rounded-[32px] border border-slate-100 p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-pixs-mint shadow-lg">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Order Receipt</h2>
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mt-1 italic opacity-80">PIXS_TERMINAL_V1</p>
          </div>
        </div>
        <span className="text-[9px] font-black text-slate-900 bg-pixs-mint px-3 py-1 rounded-full uppercase tracking-widest italic animate-pulse">
           Secure Check
        </span>
      </div>

      <div className="ReceiptItems space-y-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-2">
        {cartItems.map((item) => (
          <div key={item.id} className="ReceiptItem flex items-center gap-5 p-3 hover:bg-slate-50 rounded-2xl transition-all group">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shrink-0 shadow-sm">
               <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute top-0 right-0 bg-slate-900 text-pixs-mint text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg">
                  x{item.quantity}
               </div>
            </div>
            
            <div className="flex-1 space-y-1">
              <h3 className="text-xs font-black uppercase italic tracking-tight text-slate-900 group-hover:text-pixs-mint transition-colors">
                 {item.productName}
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">
                {item.variant.size} Node Sequence
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-slate-500 italic">PHP {item.variant.unitPrice.toFixed(2)}/ea</span>
                <span className="text-xs font-black text-slate-900 italic">PHP {(item.quantity * item.variant.unitPrice).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ReceiptSummary space-y-4 border-t border-slate-100 pt-8 mt-4">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 italic">
           <span>Subtotal Node</span>
           <span className="text-slate-900">PHP {subtotal.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 italic">
           <div className="flex items-center gap-2">
             <span>Logistics Fee</span>
             <Tag size={12} className="text-slate-300" />
           </div>
           <span className={`${deliveryFee === 0 ? 'text-amber-500' : 'text-slate-900'}`}>
             {deliveryFee === 0 ? 'COLLECT (DIRECT)' : `PHP ${deliveryFee.toFixed(2)}`}
           </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-emerald-500 italic animate-in slide-in-from-right-2">
             <div className="flex items-center gap-2">
               <span>Voucher Optimization</span>
               <Tag size={12} className="text-emerald-300" />
             </div>
             <span className="font-black">- PHP {discountAmount.toLocaleString()}</span>
          </div>
        )}

        <div className="ReceiptTotal flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100/50 mt-6 shadow-inner">
          <p className="text-[9px] font-black uppercase tracking-[6px] text-slate-400 mb-2 italic">Terminal Net Total</p>
          <div className="flex items-center gap-3">
             <span className="text-[14px] font-black text-slate-300 line-through italic">PHP {(total * 1.05).toFixed(0)}</span>
             <h3 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
               PHP {total.toLocaleString()}
             </h3>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[8px] font-black text-pixs-mint uppercase tracking-widest italic opacity-80">
             <Package size={10} />
             Industrial Pricing Standards Applied
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptSection;
