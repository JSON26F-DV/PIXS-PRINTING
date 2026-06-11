import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Gift,
  Ticket,
  Truck,
} from 'lucide-react'
import toast from 'react-hot-toast'
// import { useAuth } from '../../context/AuthContext'
import type { CartItem } from '../../types/cart'
import AbortConfirmModal from '../../components/Transactions/AbortConfirmModal'
import PurchaseSuccessModal from '../../components/Transactions/PurchaseSuccessModal'
import StockAlertModal from '../../components/Transactions/StockAlertModal'
import PaymentCodeAlertModal from '../../components/Transactions/PaymentCodeAlertModal'
import { orderApi } from '../../api/orders.api'
import { cartService } from '../AddToCart/services/cartService'

import AddressSection from '../../components/Transactions/AddressSection'
import PaymentSection from '../../components/Transactions/PaymentSection'
import DeliverySection from '../../components/Transactions/DeliverySection'
import ReceiptSection from '../../components/Transactions/ReceiptSection'
import ExtraNotesSection from '../../components/Transactions/ExtraNotesSection'
import Discount from './components/Discount'

import { useCustomerAddressStore } from '../../store/useCustomerAddressStore'

import { useNotificationStore } from '../../store/useNotificationStore'
// import { usePromotionStore, type Promotion } from '../../store/usePromotionStore'
import axiosInstance from '../../lib/axiosInstance'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface IOrderData {
  order_id: string
  user_id: string
  total_amount: number
  total_discount_amount: number
  discount_id: string | null
  delivery_method: {
    id: string
    name: string
  }
  notes?: string
  shipping_address: {
    id: string
    full_name: string
    phone: string
    city: string
    street: string
    barangay: string
  }
  payment_method: {
    id: string  // Xendit payment ID
    type: string  // 'gcash', 'card', 'bank_transfer', etc.
    provider?: string  // Optional: 'xendit'
  }
  products: {
    product_id: string
    variant_id: string
    screenplate_id: string | null
    product_name: string
    product_image: string
    quantity: number
    unit_price: number
    plate_setup_fee: number
    plate_print_price: number
    custom_requirements?: string
    colors: { name: string; hex: string }[]
  }[]
}

export interface IDeliveryMethod {
  id: string
  name?: string
  type?: string
}

import type { IDiscountItem } from './components/Discount'

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // const { user } = useAuth()

  const { addresses, fetchAddresses } = useCustomerAddressStore()

  const { fetchNotifications } = useNotificationStore()
  // const { promotions, fetchPromotions } = usePromotionStore()
  
  const [isProcessing, setIsProcessing] = useState(false)

  // Selections
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [selectedPaymentId, setSelectedPaymentId] = useState('gcash')
  const [deliveryData, setDeliveryData] = useState<IDeliveryMethod[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('')
  const [notes, setNotes] = useState('')

  const [isAbortModalOpen, setIsAbortModalOpen] = useState(false)
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([])

  // Discount System
  const [selectedDiscount, setSelectedDiscount] = useState<IDiscountItem | null>(null)

  const discountAmount = useMemo(() => {
    if (!selectedDiscount) return 0

    let matchingItems = checkoutItems
    if (selectedDiscount.variant_id) {
      matchingItems = checkoutItems.filter((i) => i.variant.id === selectedDiscount.variant_id)
    } else if (selectedDiscount.product_id) {
      matchingItems = checkoutItems.filter((i) => i.productId === selectedDiscount.product_id)
    }

    if (matchingItems.length === 0) return 0

    const matchSubtotal = matchingItems.reduce(
      (acc, item) => acc + (item.totalCartPrice ?? item.quantity * item.variant.unitPrice),
      0,
    )

    if (selectedDiscount.type === 'fixed') {
      return selectedDiscount.value
    }

    return matchSubtotal * (selectedDiscount.value / 100)
  }, [selectedDiscount, checkoutItems])
 
  // Order Submission State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [lastOrderId, setLastOrderId] = useState('')
  const [lastOrderTotal, setLastOrderTotal] = useState(0)

  // Stock Alert State
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false)
  const [stockAlertItems, setStockAlertItems] = useState<{ name: string; requested: number; available: number }[]>([])

  // Payment Code State
  const [paymentCode, setPaymentCode] = useState('')
  const [isCodeAlertOpen, setIsCodeAlertOpen] = useState(false)
  const [codeAlertMessage, setCodeAlertMessage] = useState('')




  // Initial Data Load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [delRes] = await Promise.all([
          axiosInstance.get('/api/delivery-methods'),
          fetchAddresses(),

        ])

        setDeliveryData(delRes.data)
        const def =
          delRes.data.find((d: IDeliveryMethod) => d.id === 'del_001') ||
          delRes.data[0]
        if (def) {
          setSelectedDeliveryId(def.id)
        }

        // Load checkout items directly from server mapping
        try {
          const items = await cartService.getCartItems()
          // Focus exclusively on actively 'selected' cart items
          const selected = items.filter((i) => i.selected)
          
          setCheckoutItems(selected)
          if (selected.length === 0) {
            toast.error('No selected items found in checkout.')
            navigate('/cart')
          }
        } catch (err) {
          console.error('Failed to fetch transaction cart items:', err)
          toast.error('Failed to load transaction data.')
          navigate('/cart')
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }

    fetchInitialData()
  }, [navigate, location.search, fetchAddresses])

  // Set defaults once data is loaded
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0]
      setSelectedAddressId(def.id)
    }
  }, [addresses, selectedAddressId])



  const availableDiscounts: IDiscountItem[] = []

  const handleAbortSequence = () => {
    localStorage.removeItem('pixs_checkout_node')
    navigate('/cart')
  }

  const isFormValid =
    selectedAddressId &&
    (selectedPaymentId === 'payment_code' ? paymentCode.trim().length > 0 : selectedPaymentId) &&
    selectedDeliveryId

  interface CreateOrderResponse {
    id?: string
    total_amount?: number
    checkout_url?: string | null
  }

  const handleOrderCreated = useCallback(async (response: CreateOrderResponse) => {
    const currentCartRaw = localStorage.getItem('pixs_cart_v1')
    if (currentCartRaw) {
      try {
        const currentCart: CartItem[] = JSON.parse(currentCartRaw)
        const purchasedIds = checkoutItems.map((i) => i.id)
        const remainingCart = currentCart.filter((i) => !purchasedIds.includes(i.id))
        localStorage.setItem('pixs_cart_v1', JSON.stringify(remainingCart))
        window.dispatchEvent(new Event('storage'))
      } catch {
        // silently ignore parse errors
      }
    }

    localStorage.removeItem('pixs_checkout_node')
    localStorage.removeItem('pixs_buy_now_v1')

    const orderId = response?.id || 'ORD-NEW'
    const orderTotal = response?.total_amount || 0
    const checkoutUrl = response?.checkout_url

    setLastOrderId(orderId)
    setLastOrderTotal(orderTotal)

    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200])
    }

    // Construct message for admin
    try {
      const messageBody = `review your shipping address ${orderId}`
      const formData = new FormData()
      formData.append('message', messageBody)
      formData.append('receiver_id', '1')
      formData.append('receiver_type', 'employee')
      formData.append('message_type', 'order')
      formData.append('type_id', orderId)

      await axiosInstance.post('/api/messages/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } catch (msgErr) {
      console.error('Failed to send order message to admin:', msgErr)
    }

    if (checkoutUrl) {
      toast.success('Order placed! Redirecting to GCash...')
      setTimeout(() => {
        window.location.href = checkoutUrl
      }, 1500)
      return
    }

    setIsSuccessModalOpen(true)
    toast.success('Order placed successfully!')
    fetchNotifications()

    setTimeout(() => {
      navigate('/orders')
    }, 3000)
  }, [checkoutItems, fetchNotifications, navigate])

  const handleOrderError = useCallback((err: unknown) => {
    console.error('Purchase Error:', err)

    const axiosErr = err as { response?: { status?: number; data?: { message?: string; error_code?: string; stock_errors?: { product_name: string; requested: number; available: number }[] } } }
    const backendData = axiosErr.response?.data

    if (backendData?.error_code === 'PAYMENT_CODE_ALREADY_USED') {
      setCodeAlertMessage('THIS PAYMENT CODE HAS ALREADY BEEN USED. CODES ARE ONE-TIME USE ONLY.')
      setIsCodeAlertOpen(true)
      return
    }

    if (axiosErr.response?.status === 404 && backendData?.message?.toLowerCase().includes('payment code')) {
      setCodeAlertMessage('THE PAYMENT CODE IS INVALID. PLEASE VERIFY THE SPELLING.')
      setIsCodeAlertOpen(true)
      return
    }

    if (backendData?.message === 'INSUFFICIENT_STOCK' && backendData?.stock_errors) {
      setStockAlertItems(
        backendData.stock_errors.map((item) => ({
          name: item.product_name,
          requested: item.requested,
          available: item.available,
        }))
      )
      setIsStockAlertOpen(true)
      return
    }

    const msg = backendData?.message || 'Failed to place order.'
    toast.error(msg)
    fetchNotifications()
  }, [fetchNotifications])

  const handlePurchase = useCallback(async () => {
    if (!isFormValid) {
      toast.error('Please complete all sections to proceed.')
      return
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId)
    const delMeta = deliveryData.find((d: { id: string }) => d.id === selectedDeliveryId)

    if (!selectedAddr || !selectedAddr.contact_number) {
        toast.error('Shipping contact information is incomplete.')
        return
    }

    // Stock validation: check if any selected item quantity exceeds available stock
    const lowStockItems = checkoutItems.filter(
      (item) => item.quantity > (item.variant?.stock ?? 0)
    )
    if (lowStockItems.length > 0) {
      setStockAlertItems(
        lowStockItems.map((item) => ({
          name: item.productName,
          requested: item.quantity,
          available: item.variant?.stock ?? 0,
        }))
      )
      setIsStockAlertOpen(true)
      return
    }

    setIsProcessing(true)

    if (selectedPaymentId === 'payment_code') {
      // Payment Code flow: create order immediately
      const payload: import('../../api/orders.api').CreateOrderPayload = {
        cart_item_ids: checkoutItems.map(i => i.id),
        address_id: selectedAddr.id,
        payment_type: null,
        payment_code: paymentCode.trim(),
        delivery_method_id: delMeta?.id || selectedDeliveryId,
        production_notes: notes,
        discount_id: selectedDiscount?.id ?? null,
      }

      try {
        const response = await orderApi.createOrder(payload)
        await handleOrderCreated(response)
      } catch (err) {
        handleOrderError(err)
      } finally {
        setIsProcessing(false)
      }
      return
    }

    // Xendit flow: create checkout URL without creating order
    try {
      const response = await axiosInstance.post('/api/customer/xendit/checkout', {
        cart_item_ids: checkoutItems.map(i => i.id),
        address_id: selectedAddr.id,
        delivery_method_id: delMeta?.id || selectedDeliveryId,
        production_notes: notes,
        discount_id: selectedDiscount?.id ?? null,
        payment_method: selectedPaymentId,
      })

      const checkoutUrl = response.data.checkout_url

      if (checkoutUrl) {
        localStorage.removeItem('pixs_checkout_node')
        localStorage.removeItem('pixs_buy_now_v1')

        toast.success('Redirecting to payment...')
        setTimeout(() => {
          window.location.href = checkoutUrl
        }, 1000)
        return
      }

      toast.error('Failed to get payment URL')
    } catch (err) {
      console.error('Checkout Error:', err)
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; stock_errors?: { product_name: string; requested: number; available: number }[] } } }
      const backendData = axiosErr.response?.data

      if (backendData?.message === 'INSUFFICIENT_STOCK' && backendData?.stock_errors) {
        setStockAlertItems(
          backendData.stock_errors.map((item) => ({
            name: item.product_name,
            requested: item.requested,
            available: item.available,
          }))
        )
        setIsStockAlertOpen(true)
        setIsProcessing(false)
        return
      }

      const msg = backendData?.message || 'Failed to initialize payment.'
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }, [
    isFormValid,
    addresses,
    selectedAddressId,
    deliveryData,
    selectedDeliveryId,
    checkoutItems,
    selectedPaymentId,
    paymentCode,
    notes,
    selectedDiscount,
    handleOrderCreated,
    handleOrderError,
  ])

  useEffect(() => {
    const handlePurchaseEvent = () => {
      handlePurchase()
    }
    window.addEventListener('pixs-purchase', handlePurchaseEvent)
    return () => {
      window.removeEventListener('pixs-purchase', handlePurchaseEvent)
    }
  }, [handlePurchase])

  return (
    <div className="TransactionsPage min-h-screen bg-slate-50 pt-8 pb-32 mt-7 md:mt-20">
      <div className="TransactionsContainer mx-auto max-w-[1400px] px-6 lg:px-16">
        <div className="mb-8 hidden md:block">
          <button
            onClick={() => setIsAbortModalOpen(true)}
            className="flex items-center gap-2 text-[10px] font-black tracking-[4px] text-slate-400 border border-slate-200 bg-white px-5 py-2 rounded-full uppercase italic transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to Cart
          </button>
        </div>

        <div className="mb-8 flex flex-col items-center justify-between gap-6 border-b border-slate-100 pb-6 lg:flex-row">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-pixs-mint rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black tracking-[4px] uppercase italic">
                Checkout
              </span>
              <div className="h-0.5 w-12 bg-slate-200" />
            </div>
            <h1 className="text-5xl leading-none font-black tracking-tighter text-slate-900 uppercase italic lg:text-7xl">
              Order Details.
            </h1>
            <p className="max-w-[400px] text-xs leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
              Please review all information before confirming your order.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-slate-900 uppercase italic">
              <ShieldCheck size={14} className="text-pixs-mint" />
              Secure Checkout
            </div>
            <button
              onClick={() => setIsAbortModalOpen(true)}
              className="flex items-center gap-2 text-[10px] font-black tracking-[3px] text-rose-500 uppercase italic transition-colors hover:text-rose-600"
            >
              Cancel Transaction
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
          <div className="TransactionsLeft space-y-10">
            {/* 📍 ADDRESS SELECTION FALLBACK */}
            {/* If no addresses found, prompt user to add one in their profile/settings */}
            {addresses.length > 0 ? (
              <AddressSection
                selectedId={selectedAddressId}
                onSelect={setSelectedAddressId}
              />
            ) : (
              <div className="AddressFallback rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                  <Truck size={32} />
                </div>
                <h3 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
                  No Shipping Address Found.
                </h3>
                <p className="mt-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase italic">
                  PLEASE ADD A SHIPPING ADDRESS IN YOUR PROFILE TO PROCEED.
                </p>
                <button 
                  onClick={() => navigate('/settings', { state: { section: 'address' } })}
                  className="mt-6 text-[10px] font-black tracking-[4px] text-pixs-mint border border-pixs-mint/20 px-6 py-3 rounded-full hover:bg-pixs-mint/5 transition-all uppercase italic"
                >
                  Add Address Now
                </button>
              </div>
            )}

            <div className="h-px w-full bg-slate-100" />

            {/* 💳 PAYMENT METHOD FALLBACK */}
            {/* If no payment methods found, prompt user to add one to continue checkout */}
            <PaymentSection
              selectedId={selectedPaymentId}
              onSelect={setSelectedPaymentId}
              paymentCode={paymentCode}
              onPaymentCodeChange={setPaymentCode}
            />

            <div className="h-px w-full bg-slate-100" />

            <DeliverySection
              methods={deliveryData as unknown as Array<{ id: string; name: string; type: string; note?: string }>}
              selectedId={selectedDeliveryId}
              onSelect={(id) => {
                setSelectedDeliveryId(id)
              }}
            />

            <div className="h-px w-full bg-slate-100" />

            <div className="LogisticNotice space-y-3 rounded-[32px] border border-amber-100 bg-amber-50/50 p-4 transition-all">
              <div className="flex items-center gap-3 text-amber-600">
                <Truck size={18} className="text-pixs-mint" />
                <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
                  Delivery Method
                </h2>
              </div>
              <p className="text-[10px] leading-relaxed font-black tracking-widest text-slate-500 uppercase italic">
                PIXS IS NOT AFFILIATED WITH THIRD-PARTY COURIERS. SHIPPING FEES ARE PAID DIRECTLY TO THE COURIER UPON RECEIPT.
              </p>
            </div>

            <ExtraNotesSection notes={notes} setNotes={setNotes} />

            <div className="h-px w-full bg-slate-100" />

            <Discount
              selectedId={selectedDiscount?.id ?? null}
              onSelect={(d) => setSelectedDiscount(d)}
              cartItems={checkoutItems}
            />

            {/* 🎁 LOYALTY VOUCHER HUB  (Temporarily Disabled) */}
            <div className="hidden LoyaltySection space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                    Available Vouchers
                  </h2>
                  <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic opacity-80">
                    LOYALTY PROGRAM
                  </p>
                </div>
                <Gift className="text-pixs-mint animate-bounce" size={24} />
              </div>

              {availableDiscounts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {availableDiscounts.map((discount) => (
                    <div
                      key={discount.id}
                      onClick={() =>
                        setSelectedDiscount(
                          selectedDiscount?.id === discount.id
                            ? null
                            : discount,
                        )
                      }
                      className={cn(
                        'group relative flex cursor-pointer items-center gap-4 rounded-[28px] border p-4 transition-all',
                        selectedDiscount?.id === discount.id
                          ? 'scale-[1.02] border-slate-900 bg-slate-900 shadow-2xl'
                          : 'hover:border-pixs-mint border-slate-100 bg-white hover:bg-slate-50',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-[18px] transition-colors',
                          selectedDiscount?.id === discount.id
                            ? 'bg-pixs-mint shadow-pixs-mint/20 font-black text-slate-900 shadow-lg'
                            : 'group-hover:text-pixs-mint bg-slate-50 text-slate-400',
                        )}
                      >
                        <Ticket size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={cn(
                            'text-xs font-black tracking-widest uppercase italic',
                            selectedDiscount?.id === discount.id
                              ? 'text-white'
                              : 'line-clamp-1 text-slate-900',
                          )}
                        >
                          {discount.code}
                        </h4>
                        <p
                          className={cn(
                            'mt-1 text-[8px] font-bold tracking-widest uppercase',
                            selectedDiscount?.id === discount.id
                              ? 'text-white/40'
                              : 'text-slate-400',
                          )}
                        >
                          {discount.type === 'fixed'
                            ? `₱${discount.value} OFF PER UNIT`
                            : discount.type === 'percentage'
                              ? `${discount.value}% OFF TOTAL`
                              : 'VOUCHER ACTIVE'}
                        </p>
                      </div>
                      {selectedDiscount?.id === discount.id && (
                        <div className="bg-pixs-mint absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-slate-900">
                          <CheckCircle2 size={12} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-100 p-4 text-center opacity-40">
                  <AlertCircle size={32} className="mb-2 text-slate-300" />
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    No active vouchers available.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="TransactionsRight space-y-8">
            <div className="sticky top-0 md:top-24">
              <ReceiptSection
                items={checkoutItems}
                discountAmount={discountAmount}
                discountLabel={selectedDiscount?.code ?? null}
              />

              <div className="mt-8 space-y-4">
                <button
                  disabled={!isFormValid || isProcessing}
                  onClick={handlePurchase}
                  className={`PlaceOrderButton relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[32px] py-6 text-sm font-black tracking-[6px] uppercase italic shadow-2xl transition-all active:scale-95 ${
                    isFormValid && !isProcessing
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-300 shadow-none'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2
                        size={20}
                        className="text-pixs-mint animate-spin"
                      />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={20}
                        className={
                          isFormValid ? 'text-pixs-mint' : 'text-slate-300'
                        }
                      />
                      Purchase Now
                    </>
                  )}
                </button>

                {!isFormValid && !isProcessing && (
                  <div className="flex animate-pulse items-center justify-center gap-2 text-[10px] font-black tracking-widest text-rose-500 uppercase italic opacity-80">
                    <AlertCircle size={12} />
                    Please complete all sections
                  </div>
                )}

                <p className="text-center text-[9px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase italic opacity-60">
                  By confirming, you agree to our Terms of Service.
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

      <PurchaseSuccessModal
        isOpen={isSuccessModalOpen}
        orderId={lastOrderId}
        totalAmount={lastOrderTotal}
        onClose={() => navigate('/orders')}
      />

      <StockAlertModal
        isOpen={isStockAlertOpen}
        items={stockAlertItems}
        onClose={() => setIsStockAlertOpen(false)}
      />

      <PaymentCodeAlertModal
        isOpen={isCodeAlertOpen}
        message={codeAlertMessage}
        onClose={() => setIsCodeAlertOpen(false)}
      />
    </div>
  )
}

export default Transactions
