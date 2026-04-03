import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Gift, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import CryptoJS from 'crypto-js';
import { useAuth } from '../../context/AuthContext';
import AbortConfirmModal from '../../components/Transactions/AbortConfirmModal';
import type { CartItem } from '../../types/cart';

import AddressSection from '../../components/Transactions/AddressSection';
import PaymentSection from '../../components/Transactions/PaymentSection';
import DeliverySection from '../../components/Transactions/DeliverySection';
import ReceiptSection from '../../components/Transactions/ReceiptSection';
import ExtraNotesSection from '../../components/Transactions/ExtraNotesSection';

import addressData from '../../data/address_book.json';
import paymentData from '../../data/payment.json';
import deliveryData from '../../data/delivery_methods.json';
import userData from '../../data/user.json';
import { ORDER_STATUS, type OrderStatus } from '../../types/order';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface LocalDiscount {
  discount_id: string;
  type: 'unit' | 'percentage' | 'fixed' | 'product-specific';
  value: number;
  product_id?: string;
  expires_at: string;
  status: string;
}

interface LocalUser {
  id: string;
  discounts?: LocalDiscount[];
}

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Zod Validation Schema ---
const OrderSchema = z.object({
  order_id: z.string(),
  user_id: z.string(),
  products: z.array(z.unknown()).min(1, "Cart cannot be empty"),
  shipping_address: z.object({
    id: z.string(),
    full_name: z.string(),
    phone: z.string(),
    city: z.string()
  }),
  payment_method: z.object({
    id: z.string(),
    type: z.string(),
    masked_number: z.string()
  }),
  delivery_method: z.object({
    id: z.string(),
    name: z.string(),
    fee: z.number()
  }),
  notes: z.string().optional(),
  status: z.enum(Object.values(ORDER_STATUS) as [string, ...string[]]),
  created_at: z.string(),
  payment_hash: z.string()
});

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Selections
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [notes, setNotes] = useState('');

  const [isAbortModalOpen, setIsAbortModalOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  
  // Discount System
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Initial Data Load
  useEffect(() => {
    const defaultAddr = addressData.find(a => a.is_default);
    if (defaultAddr) setSelectedAddressId(defaultAddr.id);

    const defaultPay = paymentData.find(p => p.is_default);
    if (defaultPay) setSelectedPaymentId(defaultPay.id);

    // Load selected items from localStorage
    const isDirect = new URLSearchParams(location.search).get('direct') === 'true';
    const sourceKey = isDirect ? 'pixs_buy_now_v1' : 'pixs_checkout_node';
    
    const savedItems = JSON.parse(localStorage.getItem(sourceKey) || '[]');
    setCheckoutItems(savedItems);

    if (savedItems.length === 0) {
      toast.error("No items selected for transaction.");
      if (isDirect) {
        navigate(-1);
      } else {
        navigate('/cart');
      }
    }
  }, [navigate, location.search]);

  // Sync Discount Logic
  const currentUserData = useMemo(() => (userData as LocalUser[]).find(u => u.id === user.id), [user.id]);
  const availableDiscounts = useMemo(() => 
    currentUserData?.discounts?.filter(d => d.status === 'active') || [],
    [currentUserData]
  );

  useEffect(() => {
    if (!selectedDiscountId) {
      setDiscountAmount(0);
      return;
    }

    const discount = availableDiscounts.find(d => d.discount_id === selectedDiscountId);
    if (!discount) return;

    let amount = 0;
    const subtotal = checkoutItems.reduce((acc, item) => acc + (item.quantity * item.variant.unitPrice), 0);

    if (discount.type === 'percentage') {
      amount = subtotal * (discount.value / 100);
    } else if (discount.type === 'fixed') {
      amount = discount.value;
    } else if (discount.type === 'unit') {
      // Find matching product
      const targetItem = checkoutItems.find(i => i.productId === discount.product_id);
      if (targetItem) {
        amount = targetItem.quantity * discount.value;
      }
    } else if (discount.type === 'product-specific') {
      const targetItem = checkoutItems.find(i => i.productId === discount.product_id);
      if (targetItem) {
        amount = (targetItem.quantity * targetItem.variant.unitPrice) * (discount.value / 100);
      }
    }

    setDiscountAmount(amount);
  }, [selectedDiscountId, checkoutItems, availableDiscounts]);

  const handleAbortSequence = () => {
    localStorage.removeItem('pixs_checkout_node');
    navigate('/cart');
  };

  const isFormValid = selectedAddressId && selectedPaymentId && selectedDeliveryId;

  const handlePlaceOrder = async () => {
    if (!isFormValid) {
      toast.error("Please complete all sections to proceed with the transaction.");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate industrial-grade security processing
      const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().slice(0, 5).toUpperCase()}`;
      const selectedAddress = addressData.find(a => a.id === selectedAddressId);
      const selectedPayment = paymentData.find(p => p.id === selectedPaymentId);
      
      // We need to re-find delivery meta because it wasn't store in state directly
      const delMeta = deliveryData.find((d: { id: string }) => d.id === selectedDeliveryId);

      const orderData = {
        order_id: orderId,
        user_id: user.id || "GUEST",
        products: checkoutItems,
        shipping_address: selectedAddress,
        payment_method: selectedPayment,
        delivery_method: delMeta,
        notes: notes,
        status: ORDER_STATUS.PAYMENT_VERIFIED as OrderStatus,
        created_at: new Date().toISOString(),
        payment_hash: CryptoJS.SHA256(selectedPaymentId + orderId).toString(),
        discount: {
          discount_id: selectedDiscountId,
          total_discount_amount: discountAmount
        }
      };

      // Validate via Zod
      OrderSchema.parse(orderData);

      // Simulate API Lag for professional UX
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Persist to Mock orders (Simulated persistence)
      const existingOrders = JSON.parse(localStorage.getItem('pixs_orders_v1') || '[]');
      localStorage.setItem('pixs_orders_v1', JSON.stringify([orderData, ...existingOrders]));

      // Clear Cart (Simulated)
      localStorage.removeItem('pixs_cart_v1');

      toast.success("Order sequence initialized successfully!");
      navigate(`/order-success/${orderId}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Industrial terminal error.";
      console.error("Order Validation Failed:", error);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="TransactionsPage min-h-screen bg-slate-50 pt-16 pb-40">
      <div className="TransactionsContainer max-w-[1400px] mx-auto px-6 lg:px-16">
        
        <div className="mb-8">
           <button 
             onClick={() => setIsAbortModalOpen(true)}
             className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[4px] italic"
           >
              <ArrowLeft size={16} />
              Return to Cart Hub
           </button>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-16 border-b border-slate-100 pb-12">
           <div className="space-y-3">
             <div className="flex items-center gap-3">
               <span className="bg-slate-900 text-pixs-mint text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[4px] italic">
                  Node Transaction V.1
               </span>
               <div className="h-0.5 w-12 bg-slate-200" />
             </div>
             <h1 className="text-5xl lg:text-7xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
               Checkout.
             </h1>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[400px] leading-relaxed">
               FINAL PRODUCTION VERIFICATION HUB. PLEASE ENSURE ALL DATA POINTS ARE SYNCED.
             </p>
           </div>

           <div className="flex flex-col items-end gap-3">
             <div className="flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-widest italic opacity-60">
                <ShieldCheck size={14} className="text-pixs-mint" />
                SECURE ACCESS PROTOCOL ACTIVE
             </div>
             <button onClick={() => setIsAbortModalOpen(true)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[3px] italic">
                <ArrowLeft size={14} />
                Cart Reversal Node
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-20">
          
          <div className="TransactionsLeft space-y-16">
            <AddressSection 
              selectedId={selectedAddressId} 
              onSelect={setSelectedAddressId} 
            />
            
            <div className="h-px bg-slate-100 w-full" />

            <PaymentSection 
              selectedId={selectedPaymentId} 
              onSelect={setSelectedPaymentId} 
            />

            <div className="h-px bg-slate-100 w-full" />

            <DeliverySection 
              selectedId={selectedDeliveryId} 
              onSelect={(id, fee) => {
                setSelectedDeliveryId(id);
                setDeliveryFee(fee);
              }} 
            />

            <div className="h-px bg-slate-100 w-full" />

            <div className="LogisticNotice p-8 bg-amber-50/50 border border-amber-100 rounded-[32px] space-y-3">
               <div className="flex items-center gap-3 text-amber-600">
                  <AlertCircle size={20} />
                  <h3 className="text-sm font-black uppercase italic tracking-tighter">Logistic Liability Disclaimer Node</h3>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic leading-relaxed">
                  PIXS PRINTING SHOP IS NOT AFFILIATED WITH THIRD-PARTY COURIER SERVICES. SHIPPING FEES ARE EXCLUDED FROM THE GRAND TOTAL AND MUST BE SETTLED DIRECTLY BY THE CUSTOMER UPON PICKUP OR RECEIPT. 
                  OUR RESPONSIBILITY ENDS ONCE THE ORDER IS HANDED OVER TO YOUR CHOSEN LOGISTICS TERMINAL.
               </p>
            </div>

            <ExtraNotesSection notes={notes} setNotes={setNotes} />

            <div className="h-px bg-slate-100 w-full" />

            {/* 🎁 LOYALTY VOUCHER HUB */}
            <div className="LoyaltySection space-y-8">
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Available Vouchers</h2>
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mt-1 italic opacity-80">PIXS_LOYALTY_VAULT</p>
                  </div>
                  <Gift className="text-pixs-mint animate-bounce" size={24} />
               </div>

               {availableDiscounts.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableDiscounts.map((discount) => (
                      <div 
                        key={discount.discount_id}
                        onClick={() => setSelectedDiscountId(selectedDiscountId === discount.discount_id ? null : discount.discount_id)}
                        className={cn(
                          "relative p-6 rounded-[28px] border cursor-pointer transition-all flex items-center gap-4 group",
                          selectedDiscountId === discount.discount_id 
                            ? "bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]" 
                            : "bg-white border-slate-100 hover:border-pixs-mint hover:bg-slate-50"
                        )}
                      >
                         <div className={cn(
                           "w-12 h-12 rounded-[18px] flex items-center justify-center transition-colors",
                           selectedDiscountId === discount.discount_id ? "bg-pixs-mint text-slate-900 font-black shadow-lg shadow-pixs-mint/20" : "bg-slate-50 text-slate-400 group-hover:text-pixs-mint"
                         )}>
                            <Ticket size={24} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className={cn("text-xs font-black uppercase italic tracking-widest", selectedDiscountId === discount.discount_id ? "text-white" : "text-slate-900 line-clamp-1")}>
                               {discount.type === 'unit' ? `₱${discount.value} OFF PER UNIT` : 
                                discount.type === 'percentage' ? `${discount.value}% OFF TOTAL` :
                                discount.type === 'fixed' ? `₱${discount.value} OFF` : 'DIRECT VOUCHER'}
                            </h4>
                            <p className={cn("text-[8px] font-bold uppercase tracking-widest mt-1", selectedDiscountId === discount.discount_id ? "text-white/40" : "text-slate-400")}>
                               EXPIRES: {new Date(discount.expires_at).toLocaleDateString()}
                            </p>
                         </div>
                         {selectedDiscountId === discount.discount_id && (
                           <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-pixs-mint rounded-full text-slate-900">
                              <CheckCircle2 size={12} strokeWidth={4} />
                           </div>
                         )}
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="p-8 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-center opacity-40">
                    <AlertCircle size={32} className="text-slate-300 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No active loyalty vouchers detected.</p>
                 </div>
               )}
            </div>
          </div>

          <div className="TransactionsRight space-y-8">
            <div className="sticky top-32">
              <ReceiptSection 
                items={checkoutItems} 
                deliveryFee={deliveryFee} 
                discountAmount={discountAmount}
              />
              
              <div className="mt-8 space-y-4">
                <button 
                  disabled={!isFormValid || isProcessing}
                  onClick={handlePlaceOrder}
                  className={`PlaceOrderButton w-full py-6 rounded-[32px] text-sm font-black uppercase italic tracking-[6px] shadow-2xl transition-all relative overflow-hidden flex items-center justify-center gap-3 active:scale-95 ${
                    isFormValid && !isProcessing
                      ? 'bg-slate-900 text-white hover:bg-slate-800' 
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border border-slate-200'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin text-pixs-mint" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} className={isFormValid ? 'text-pixs-mint' : 'text-slate-300'} />
                      Authorize Production
                    </>
                  )}
                </button>

                {!isFormValid && !isProcessing && (
                  <div className="flex items-center gap-2 justify-center text-[10px] font-black text-rose-500 uppercase tracking-widest italic opacity-80 animate-pulse">
                    <AlertCircle size={12} />
                    Configuration Requirements Incomplete
                  </div>
                )}

                <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest italic leading-relaxed opacity-60">
                   BY AUTHORIZING THIS SEQUENCE, YOU AGREE TO OUR INDUSTRIAL TERMS OF SERVICE AND REFUND POLICY NODES.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <AbortConfirmModal 
        isOpen={isAbortModalOpen} 
        onClose={() => setIsAbortModalOpen(false)} 
        onConfirm={handleAbortSequence}
      />
    </div>
  );
};

export default Transactions;
