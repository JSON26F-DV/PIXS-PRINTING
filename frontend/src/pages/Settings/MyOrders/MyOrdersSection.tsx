import React, { useState } from 'react';

import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Truck, Star, XCircle, History, AlertCircle, ShoppingCart, LayoutGrid } from 'lucide-react';
import { ORDER_STATUS, type Order, type OrderStatus, type OrderProduct } from '../../../types/order';

import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Import static order data
import staticOrders from '../../../data/order.json';

type OrderTab = 'ALL' | 'PROCESSING' | 'TO_RECEIVE' | 'HISTORY' | 'TO_REVIEW' | 'RETURNS';

const TAB_CONFIG: Record<OrderTab, { label: string; icon: React.ElementType; statuses: OrderStatus[] }> = {


  'ALL': { 
    label: 'Active Orders', 
    icon: LayoutGrid, 
    statuses: [
      ORDER_STATUS.PAYMENT_VERIFIED, 
      ORDER_STATUS.PRINTING, 
      ORDER_STATUS.READY_FOR_SHIPPING, 
      ORDER_STATUS.ON_DELIVERY
    ] as OrderStatus[] 
  },
  'PROCESSING': { 
    label: 'Processing', 
    icon: Package, 
    statuses: [ORDER_STATUS.PAYMENT_VERIFIED, ORDER_STATUS.PRINTING] as OrderStatus[] 
  },
  'TO_RECEIVE': { 
    label: 'To Receive', 
    icon: Truck, 
    statuses: [ORDER_STATUS.READY_FOR_SHIPPING, ORDER_STATUS.ON_DELIVERY] as OrderStatus[] 
  },
  'HISTORY': { 
    label: 'History', 
    icon: History, 
    statuses: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED] as OrderStatus[] 
  },
  'TO_REVIEW': { 
    label: 'To Review', 
    icon: Star, 
    statuses: [ORDER_STATUS.COMPLETED] as OrderStatus[] 
  },
  'RETURNS': { 
    label: 'Returns', 
    icon: XCircle, 
    statuses: [ORDER_STATUS.CANCELLED] as OrderStatus[] 
  },
};

const TABS = Object.keys(TAB_CONFIG) as OrderTab[];

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  const navigate = useNavigate();
  const statusConfig = Object.values(TAB_CONFIG).find(t => t.statuses.includes(order.status)) || TAB_CONFIG.ALL;
  const Icon = statusConfig.icon;
  
  // Get primary product info
  const firstProduct: OrderProduct = order.items[0] ?? { productName: 'Unknown Product', quantity: 0 };
  const moreCount = order.items.length - 1;



  const handleReview = () => {
    toast.success(`Opening review terminal for ${order.id}`);
  };

  const handleBuyAgain = () => {
    toast.success('Redirecting to product terminal...');
    navigate('/');
  };

  const handleAbort = () => {
    alert(`Initiating termination sequence for ${order.id}`);
  };

  // Calculate total price
  const totalPrice = order.total_amount ?? order.items.reduce((acc: number, p: OrderProduct) => acc + (p.quantity * (p.variant?.unitPrice ?? 0)), 0);



  // Determine if it's a history item based on status
  const isHistoryItem = order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "OrderCard flex flex-col gap-6 rounded-[32px] border p-6 shadow-sm transition-all hover:shadow-lg",
        order.status === ORDER_STATUS.CANCELLED ? "bg-slate-50/50 border-slate-100 opacity-80" : "bg-white border-slate-100 hover:border-slate-200"
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
           <div className={clsx(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] shadow-xl relative text-white",
              order.status === ORDER_STATUS.COMPLETED ? "bg-pixs-mint shadow-pixs-mint/20" : 
              order.status === ORDER_STATUS.CANCELLED ? "bg-slate-300 shadow-none text-slate-500" : "bg-slate-900 shadow-slate-900/10"
           )}>
              <Icon size={24} />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] font-black text-rose-500">
                 {order.items.length}
              </div>
           </div>
           <div>
              <h3 className="text-sm font-black tracking-tighter text-slate-900 uppercase italic leading-none">
                {firstProduct.productName} {moreCount > 0 && `& ${moreCount} More`}
              </h3>
              <p className="mt-2 text-[10px] font-bold tracking-[3px] text-slate-400 uppercase">
                {order.id} · {format(new Date(order.created_at), 'MMM dd, yyyy')}
              </p>
           </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-2xl">
           <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Value Node</p>
              <span className="font-mono text-lg font-black tracking-tighter text-slate-900 italic">
                PHP {totalPrice.toFixed(2)}
              </span>
           </div>
           <div className={clsx(
             "px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
             order.status === ORDER_STATUS.COMPLETED ? 'bg-pixs-mint/10 text-pixs-mint border-pixs-mint/20' : 
             order.status === ORDER_STATUS.CANCELLED ? 'bg-rose-50 text-rose-500 border-rose-100' :
             'bg-slate-900 text-white border-transparent'
           )}>
              <Icon size={12} />
              {order.status.replace(/_/g, ' ')}
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-100">
         <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic leading-none">
              Node Security: {order.payment_hash.slice(0, 10)}...
            </span>
         </div>
         
         <div className="flex items-center gap-2 w-full md:w-auto">
           {isHistoryItem ? (
             <>
               {order.status === ORDER_STATUS.COMPLETED && (
                 <button 
                   onClick={handleReview}
                   className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all italic"
                 >
                   <Star size={14} />
                   Review Print
                 </button>
               )}
               <button 
                 onClick={handleBuyAgain}
                 className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all italic shadow-lg shadow-slate-900/10"
               >
                 <ShoppingCart size={14} />
                 Buy Again
               </button>
             </>
           ) : (
             <button 
               onClick={handleAbort}
               className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-rose-100 bg-rose-50/50 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-all italic"
             >
               <AlertCircle size={14} />
               Abort Sequence
             </button>
           )}
         </div>
      </div>
    </motion.div>
  );
};

const MyOrdersSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OrderTab>('ALL');
  const [orders] = useState<Order[]>(() => {
    // Merge order.json with localStorage
    const saved = localStorage.getItem('pixs_orders_v1');
    const liveOrders: Order[] = saved ? JSON.parse(saved) : [];
    
    // Combine and sort by date descending
    const combined = [...liveOrders, ...(staticOrders as unknown as Order[])].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Deduplicate by id
    const uniqueOrders = combined.filter((order, index, self) =>
      index === self.findIndex((t) => t.id === order.id)
    );
    
    return uniqueOrders;
  });


  const filteredOrders = orders.filter((o) => TAB_CONFIG[activeTab].statuses.includes(o.status));

  return (
    <section className="SettingsMyOrders space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            Production Records
          </h2>
          <p className="text-[10px] font-bold tracking-[4px] text-slate-400 uppercase">
            {activeTab === 'HISTORY' ? 'Archived fulfillment nodes' : 'Active transaction history logs'}
          </p>
        </div>
        
        <button 
          onClick={() => setActiveTab(activeTab === 'HISTORY' ? 'ALL' : 'HISTORY')}
          className={clsx(
            "flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] transition-all italic border-b border-dashed pb-1",
            activeTab === 'HISTORY' ? "text-pixs-mint border-pixs-mint" : "text-slate-400 border-slate-200 hover:text-slate-900"
          )}
        >
          {activeTab === 'HISTORY' ? <LayoutGrid size={14} /> : <History size={14} />}
          {activeTab === 'HISTORY' ? 'Switch to Active Production' : 'Access History Terminal'}
        </button>
      </div>

      {/* Tabs Terminal */}
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
        {TABS.map((tab) => {
          const config = TAB_CONFIG[tab];
          // Hide processing/shipping tabs if in History mode, or hide Review/Returns if in Active mode?
          // User said "all orders yung mga proccesing palang... history lahat ng complete/cancelled"
          // So let's show only relevant tabs based on the 'mode' (Active vs History)
          
          const isProcessingShipping = tab === 'PROCESSING' || tab === 'TO_RECEIVE';
          const isHistoryRelated = tab === 'TO_REVIEW' || tab === 'RETURNS';

          if (activeTab === 'HISTORY' && isProcessingShipping) return null;
          if (activeTab !== 'HISTORY' && isHistoryRelated) return null;
          if (activeTab === 'HISTORY' && tab === 'ALL') return null;
          if (activeTab !== 'HISTORY' && tab === 'HISTORY') return null;


          const Icon = config.icon;
          const count = orders.filter((o) => config.statuses.includes(o.status)).length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex shrink-0 items-center gap-3 rounded-[24px] px-6 py-3.5 text-[10px] font-black tracking-widest uppercase transition-all relative overflow-hidden',
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20'
                  : 'border border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600',
              )}
            >
              <Icon size={16} />
              {config.label}
              {count > 0 && (
                <span className={clsx(
                    'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[9px] font-black',
                    activeTab === tab ? 'bg-pixs-mint text-slate-900' : 'bg-slate-100 text-slate-600',
                  )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Order List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
              />
            ))
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-[32px] border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white shadow-inner">
                <Package size={24} className="text-slate-300" />
              </div>
              <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
                No active production nodes in this category
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default MyOrdersSection;
