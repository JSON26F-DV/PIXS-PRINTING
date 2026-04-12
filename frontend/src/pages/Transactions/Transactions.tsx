import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Gift,
  Ticket,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CryptoJS from 'crypto-js'
import { useAuth } from '../../context/AuthContext'
import AbortConfirmModal from '../../components/Transactions/AbortConfirmModal'
import type { CartItem } from '../../types/cart'

import AddressSection from '../../components/Transactions/AddressSection'
import PaymentSection from '../../components/Transactions/PaymentSection'
import DeliverySection from '../../components/Transactions/DeliverySection'
import ReceiptSection from '../../components/Transactions/ReceiptSection'
import ExtraNotesSection from '../../components/Transactions/ExtraNotesSection'

import { useCustomerAddressStore } from '../../store/useCustomerAddressStore'
import { usePaymentMethodStore } from '../../store/usePaymentMethodStore'
import { usePromotionStore } from '../../store/usePromotionStore'
import deliveryData from '../../data/delivery_methods.json'
import { ORDER_STATUS, type OrderStatus } from '../../types/order'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Zod Validation Schema ---
const OrderSchema = z.object({
  order_id: z.string(),
  user_id: z.string(),
  products: z.array(z.unknown()).min(1, 'Cart cannot be empty'),
  shipping_address: z.object({
    id: z.string(),
    full_name: z.string(),
    phone: z.string(),
    city: z.string(),
  }),
  payment_method: z.object({
    id: z.string(),
    type: z.string(),
    masked_number: z.string(),
  }),
  delivery_method: z.object({
    id: z.string(),
    name: z.string(),
    fee: z.number(),
  }),
  notes: z.string().optional(),
  status: z.enum(Object.values(ORDER_STATUS) as [string, ...string[]]),
  created_at: z.string(),
  payment_hash: z.string(),
})

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const { addresses, fetchAddresses } = useCustomerAddressStore()
  const { methods: paymentMethods, fetchMethods: fetchPayments } =
    usePaymentMethodStore()
  const { promotions, fetchPromotions } = usePromotionStore()

  const [isProcessing, setIsProcessing] = useState(false)

  // Selections
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [selectedPaymentId, setSelectedPaymentId] = useState('')
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [notes, setNotes] = useState('')

  const [isAbortModalOpen, setIsAbortModalOpen] = useState(false)
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([])

  // Discount System
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(
    null,
  )
  const [discountAmount, setDiscountAmount] = useState(0)

  // Initial Data Load
  useEffect(() => {
    fetchAddresses()
    fetchPayments()
    fetchPromotions()

    // Load selected items from localStorage
    const isDirect =
      new URLSearchParams(location.search).get('direct') === 'true'
    const sourceKey = isDirect ? 'pixs_buy_now_v1' : 'pixs_checkout_node'

    const savedItems = JSON.parse(localStorage.getItem(sourceKey) || '[]')
    setCheckoutItems(savedItems)

    if (savedItems.length === 0) {
      toast.error('No items selected for transaction.')
      if (isDirect) {
        navigate(-1)
      } else {
        navigate('/cart')
      }
    }
  }, [
    navigate,
    location.search,
    fetchAddresses,
    fetchPayments,
    fetchPromotions,
  ])

  // Set defaults once data is loaded
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0]
      setSelectedAddressId(def.id)
    }
  }, [addresses, selectedAddressId])

  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentId) {
      const def = paymentMethods.find((p) => p.is_default) || paymentMethods[0]
      setSelectedPaymentId(def.id)
    }
  }, [paymentMethods, selectedPaymentId])

  // Sync Discount Logic
  const availableDiscounts = useMemo(() => {
    return promotions.filter((promo) => {
      const isActive = promo.status === 'active'
      const isForUser =
        promo.target_type === 'all_users' ||
        (promo.target_type === 'specific_user' &&
          promo.assigned_user_id === user.id)
      const isNotExpired =
        !promo.expires_at || new Date(promo.expires_at) > new Date()
      return isActive && isForUser && isNotExpired
    })
  }, [promotions, user.id])

  useEffect(() => {
    if (!selectedDiscountId) {
      setDiscountAmount(0)
      return
    }

    const discount = availableDiscounts.find((d) => d.id === selectedDiscountId)
    if (!discount) return

    let amount = 0
    const subtotal = checkoutItems.reduce(
      (acc, item) => acc + item.quantity * (item.variant?.unitPrice || 0),
      0,
    )

    if (discount.discount_type === 'percentage') {
      amount = subtotal * (discount.discount_value / 100)
    } else if (discount.discount_type === 'unit') {
      const targetItem = checkoutItems.find(
        (i) => i.productId === discount.product_id,
      )
      if (targetItem) {
        amount = targetItem.quantity * discount.discount_value
      }
    }

    setDiscountAmount(amount)
  }, [selectedDiscountId, checkoutItems, availableDiscounts])

  const handleAbortSequence = () => {
    localStorage.removeItem('pixs_checkout_node')
    navigate('/cart')
  }

  const isFormValid =
    selectedAddressId && selectedPaymentId && selectedDeliveryId

  const handlePlaceOrder = async () => {
    if (!isFormValid) {
      toast.error(
        'Please complete all sections to proceed with the transaction.',
      )
      return
    }

    setIsProcessing(true)

    try {
      const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().slice(0, 5).toUpperCase()}`
      const selectedAddr = addresses.find((a) => a.id === selectedAddressId)
      const selectedPay = paymentMethods.find((p) => p.id === selectedPaymentId)
      const delMeta = deliveryData.find(
        (d: { id: string }) => d.id === selectedDeliveryId,
      )

      const orderData = {
        order_id: orderId,
        user_id: user.id || 'GUEST',
        products: checkoutItems.map((item) => ({
          ...item,
          colors: item.colors.map((c) => ({ name: c.name, hex: c.hex })),
          plate: item.plate
            ? {
                name: item.plate.name,
                setupFee: item.plate.setupFee,
                printPricePerUnit: item.plate.printPricePerUnit,
              }
            : null,
        })),
        shipping_address: selectedAddr,
        payment_method: selectedPay,
        delivery_method: delMeta,
        notes: notes,
        status: ORDER_STATUS.PAYMENT_VERIFIED as OrderStatus,
        created_at: new Date().toISOString(),
        payment_hash: CryptoJS.SHA256(selectedPaymentId + orderId).toString(),
        discount: {
          discount_id: selectedDiscountId,
          total_discount_amount: discountAmount,
        },
      }

      OrderSchema.parse(orderData)
      await new Promise((resolve) => setTimeout(resolve, 2500))

      const existingOrders = JSON.parse(
        localStorage.getItem('pixs_orders_v1') || '[]',
      )
      localStorage.setItem(
        'pixs_orders_v1',
        JSON.stringify([orderData, ...existingOrders]),
      )

      localStorage.removeItem('pixs_cart_v1')
      localStorage.removeItem('pixs_buy_now_v1')

      toast.success('Order sequence initialized successfully!')
      navigate(`/order-success/${orderId}`)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Industrial terminal error.'
      console.error('Order Validation Failed:', error)
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="TransactionsPage min-h-screen bg-slate-50 pt-16 pb-40">
      <div className="TransactionsContainer mx-auto max-w-[1400px] px-6 lg:px-16">
        <div className="mb-8">
          <button
            onClick={() => setIsAbortModalOpen(true)}
            className="flex items-center gap-2 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Return to Cart Hub
          </button>
        </div>

        <div className="mb-16 flex flex-col items-center justify-between gap-6 border-b border-slate-100 pb-12 lg:flex-row">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-pixs-mint rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black tracking-[4px] uppercase italic">
                Node Transaction V.1
              </span>
              <div className="h-0.5 w-12 bg-slate-200" />
            </div>
            <h1 className="text-5xl leading-none font-black tracking-tighter text-slate-900 uppercase italic lg:text-7xl">
              Checkout.
            </h1>
            <p className="max-w-[400px] text-xs leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
              FINAL PRODUCTION VERIFICATION HUB. PLEASE ENSURE ALL DATA POINTS
              ARE SYNCED.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-slate-900 uppercase italic opacity-60">
              <ShieldCheck size={14} className="text-pixs-mint" />
              SECURE ACCESS PROTOCOL ACTIVE
            </div>
            <button
              onClick={() => setIsAbortModalOpen(true)}
              className="flex items-center gap-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase italic transition-colors hover:text-slate-900"
            >
              <ArrowLeft size={14} />
              Cart Reversal Node
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_420px] lg:gap-20">
          <div className="TransactionsLeft space-y-16">
            <AddressSection
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
            />

            <div className="h-px w-full bg-slate-100" />

            <PaymentSection
              selectedId={selectedPaymentId}
              onSelect={setSelectedPaymentId}
            />

            <div className="h-px w-full bg-slate-100" />

            <DeliverySection
              selectedId={selectedDeliveryId}
              onSelect={(id, fee) => {
                setSelectedDeliveryId(id)
                setDeliveryFee(fee)
              }}
            />

            <div className="h-px w-full bg-slate-100" />

            <div className="LogisticNotice space-y-3 rounded-[32px] border border-amber-100 bg-amber-50/50 p-8">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle size={20} />
                <h3 className="text-sm font-black tracking-tighter uppercase italic">
                  Logistic Liability Disclaimer Node
                </h3>
              </div>
              <p className="text-[10px] leading-relaxed font-black tracking-widest text-slate-500 uppercase italic">
                PIXS PRINTING SHOP IS NOT AFFILIATED WITH THIRD-PARTY COURIER
                SERVICES. SHIPPING FEES ARE EXCLUDED FROM THE GRAND TOTAL AND
                MUST BE SETTLED DIRECTLY BY THE CUSTOMER UPON PICKUP OR RECEIPT.
                OUR RESPONSIBILITY ENDS ONCE THE ORDER IS HANDED OVER TO YOUR
                CHOSEN LOGISTICS TERMINAL.
              </p>
            </div>

            <ExtraNotesSection notes={notes} setNotes={setNotes} />

            <div className="h-px w-full bg-slate-100" />

            {/* 🎁 LOYALTY VOUCHER HUB */}
            <div className="LoyaltySection space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                    Available Vouchers
                  </h2>
                  <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic opacity-80">
                    PIXS_LOYALTY_VAULT
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
                        setSelectedDiscountId(
                          selectedDiscountId === discount.id
                            ? null
                            : discount.id,
                        )
                      }
                      className={cn(
                        'group relative flex cursor-pointer items-center gap-4 rounded-[28px] border p-6 transition-all',
                        selectedDiscountId === discount.id
                          ? 'scale-[1.02] border-slate-900 bg-slate-900 shadow-2xl'
                          : 'hover:border-pixs-mint border-slate-100 bg-white hover:bg-slate-50',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-[18px] transition-colors',
                          selectedDiscountId === discount.id
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
                            selectedDiscountId === discount.id
                              ? 'text-white'
                              : 'line-clamp-1 text-slate-900',
                          )}
                        >
                          {discount.title}
                        </h4>
                        <p
                          className={cn(
                            'mt-1 text-[8px] font-bold tracking-widest uppercase',
                            selectedDiscountId === discount.id
                              ? 'text-white/40'
                              : 'text-slate-400',
                          )}
                        >
                          {discount.discount_type === 'unit'
                            ? `₱${discount.discount_value} OFF PER UNIT`
                            : discount.discount_type === 'percentage'
                              ? `${discount.discount_value}% OFF TOTAL`
                              : 'VOUCHER ACTIVE'}
                        </p>
                      </div>
                      {selectedDiscountId === discount.id && (
                        <div className="bg-pixs-mint absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-slate-900">
                          <CheckCircle2 size={12} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-100 p-8 text-center opacity-40">
                  <AlertCircle size={32} className="mb-2 text-slate-300" />
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    No active loyalty vouchers detected.
                  </p>
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
                      Authorize Production
                    </>
                  )}
                </button>

                {!isFormValid && !isProcessing && (
                  <div className="flex animate-pulse items-center justify-center gap-2 text-[10px] font-black tracking-widest text-rose-500 uppercase italic opacity-80">
                    <AlertCircle size={12} />
                    Configuration Requirements Incomplete
                  </div>
                )}

                <p className="text-center text-[9px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase italic opacity-60">
                  BY AUTHORIZING THIS SEQUENCE, YOU AGREE TO OUR INDUSTRIAL
                  TERMS OF SERVICE AND REFUND POLICY NODES.
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
  )
}

export default Transactions
