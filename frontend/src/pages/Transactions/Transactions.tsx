import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CryptoJS from 'crypto-js';
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
import { ORDER_STATUS, type OrderStatus } from '../../types/order';

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
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Selections
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [notes, setNotes] = useState('');

  const [isAbortModalOpen, setIsAbortModalOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

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
        user_id: "user_001", // Mock User
        products: checkoutItems,
        shipping_address: selectedAddress,
        payment_method: selectedPayment,
        delivery_method: delMeta,
        notes: notes,
        status: ORDER_STATUS.PAYMENT_VERIFIED as OrderStatus,
        created_at: new Date().toISOString(),
        payment_hash: CryptoJS.SHA256(selectedPaymentId + orderId).toString()
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
          </div>

          <div className="TransactionsRight space-y-8">
            <div className="sticky top-32">
              <ReceiptSection items={checkoutItems} deliveryFee={deliveryFee} />
              
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
