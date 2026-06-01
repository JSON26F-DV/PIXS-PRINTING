import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search, CheckCircle2, Loader2, X, Trash2, ShoppingBag } from 'lucide-react'
import axiosInstance from '../../../lib/axiosInstance'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

// Hooks
import { useProducts } from '../../../hooks/useProducts'
import { useDebounce } from '../../../hooks/useDebounce'
import { getProductById } from '../../../api/products.api'
import type { IProduct, IScreenPlate } from '../../../types/product.types'
import { useProductDetail } from '../../product/hooks/useProductDetail'
import BoxFallback from '../../../components/common/BoxFallback'
import Pagination from '../../../components/Pagination/Pagination'
import VariantSelector from '../../product/components/VariantSelector'
import ColorPicker from '../../product/components/ColorPicker'
import QuantityPicker from '../../product/components/QuantityPicker'
import PlateSelector from '../../product/components/PlateSelector'
import PriceCalculatorUI from '../../product/components/PriceCalculatorUI'
import DeliverySection from '../../../components/Transactions/DeliverySection'
import type { DeliveryMethod } from '../../../components/Transactions/DeliverySection'
import ExtraNotesSection from '../../../components/Transactions/ExtraNotesSection'

// --- Interfaces ---
interface ICustomerAddress {
  id: string;
  adress_label: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
}

interface ICustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  addresses?: ICustomerAddress[];
}

interface IAdminCartItem {
  id: string;
  product: IProduct;
  variant: { variant_id: string; size: string; price: number };
  plate: IScreenPlate | null;
  colors: { id: string }[];
  quantity: number;
  priceBreakdown: { total: number };
  productName: string;
  productImage: string;
  totalCartPrice: number;
  plate_price: number;
}

// --- Sub-components ---
const AdminAddressSelector = ({ 
  addresses, 
  selectedId, 
  onSelect 
}: { 
  addresses: ICustomerAddress[]; 
  selectedId: string; 
  onSelect: (id: string) => void 
}) => {
  if (!addresses || addresses.length === 0) return <div className="text-rose-500 text-xs font-black uppercase italic p-4 bg-rose-50 rounded-xl">No address available for this customer.</div>;
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Select Shipping Address</h3>
      <div className="grid gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {addresses.map((a) => (
          <div key={a.id} onClick={() => onSelect(a.id)} className={clsx("p-4 border rounded-2xl cursor-pointer transition-all", selectedId === a.id ? "border-emerald-900 bg-emerald-900 text-white shadow-xl" : "border-slate-100 bg-white hover:border-emerald-200")}>
            <div className={clsx("font-black text-sm uppercase italic", selectedId === a.id ? "text-white" : "text-slate-900")}>{a.adress_label}</div>
            <div className={clsx("text-[10px] font-bold uppercase mt-1", selectedId === a.id ? "text-emerald-100" : "text-slate-500")}>{a.street}, {a.barangay}, {a.city}, {a.province}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ProductDetailInner = ({ product, plates, onClose, onAdd }: { product: IProduct, plates: IScreenPlate[], onClose: () => void, onAdd: (data: unknown) => void }) => {
  const hook = useProductDetail({ product, compatiblePlates: plates, preselectedPlateName: null })

  const adminCanAddToCart = hook.state.selectedVariantId && hook.state.quantity >= product.min_order && (!product.is_need_color || hook.computed.hasRequiredColor);

  const handleAdd = () => {
    if (!adminCanAddToCart) {
      toast.error('Selection incomplete (variant/color needed)')
      return
    }
    onAdd({
      product,
      variant: hook.computed.selectedVariant,
      plate: hook.computed.selectedPlate,
      colors: hook.computed.selectedColors,
      quantity: hook.state.quantity,
      priceBreakdown: hook.computed.priceBreakdown
    })
  }

  return (
    <div className="bg-white rounded-[24px] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-10 relative shadow-2xl custom-scrollbar">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors">
        <X size={20} />
      </button>
      <h2 className="text-2xl md:text-3xl font-black italic uppercase text-slate-900 mb-8 pr-12 leading-tight">{product.name}</h2>
      <div className="space-y-8">
        <VariantSelector variants={product.variants} selectedVariantId={hook.state.selectedVariantId} onSelect={hook.actions.setSelectedVariantId} minThreshold={product.min_threshold ?? 5} minOrder={product.min_order} variantCompatibilityMap={hook.state.variantCompatibilityMap} />
        {product.is_need_color && <ColorPicker colors={hook.state.colors} selectedColorIds={hook.state.selectedColorIds} maxChannels={hook.computed.selectedPlate?.channels || 1} onSelect={hook.actions.handleColorChange} />}
        <QuantityPicker quantity={hook.state.quantity} minOrder={product.min_order} maxStock={hook.computed.stockForVariant} onChange={hook.actions.setQuantity} />
        {product.is_need_screenplate && <PlateSelector selectablePlates={hook.state.selectablePlates} selectedPlateId={hook.state.selectedPlateId} onPlateChange={hook.actions.handlePlateChange} isRequired={product.is_need_screenplate} productId={product.id} selectedVariantSize={hook.computed.selectedVariant?.size} incompatiblePlateIds={hook.state.incompatiblePlateIds} />}
        <div className="pt-8 border-t border-slate-100">
          <PriceCalculatorUI breakdown={hook.computed.priceBreakdown} canAddToCart={!!adminCanAddToCart} isOutOfStock={hook.computed.isOutOfStock} minOrder={product.min_order} isQuantityTooLow={hook.computed.isQuantityTooLow} hasRequiredPlate={true} isNeedScreenplate={product.is_need_screenplate} hasRequiredColor={hook.computed.hasRequiredColor} isNeedColor={product.is_need_color} onAddToCart={handleAdd} onBuyNow={() => {}} quantity={hook.state.quantity} isStockInsufficient={hook.computed.isStockInsufficient} hideBuyNow={true} />
        </div>
      </div>
    </div>
  )
}

const ProductDetailModal = ({ productId, onClose, onAdd }: { productId: string; onClose: () => void; onAdd: (data: unknown) => void }) => {
  const [product, setProduct] = useState<IProduct | null>(null)
  const [plates, setPlates] = useState<IScreenPlate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      getProductById(productId), 
      axiosInstance.get('/api/admin/screenplates')
    ]).then(([prodRes, plsRes]) => {
      if (!mounted) return
      setProduct(prodRes.data)
      const filtered = (plsRes.data?.data || plsRes.data || []).filter((p: IScreenPlate) => p.compatibility?.some((cp: { product_id: string }) => cp.product_id === prodRes.data.id))
      setPlates(filtered)
      setIsLoading(false)
    }).catch(() => {
      if (!mounted) return
      toast.error('Failed to load product')
      onClose()
    })
    return () => { mounted = false }
  }, [productId, onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      {isLoading || !product ? (
        <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
      ) : (
        <ProductDetailInner product={product} plates={plates} onClose={onClose} onAdd={onAdd} />
      )}
    </div>
  )
}

interface IAddPayload {
  product: IProduct;
  variant: { variant_id: string; size: string; price: number };
  plate: IScreenPlate | null;
  colors: { id: string }[];
  quantity: number;
  priceBreakdown: { total: number };
}

// --- Main View ---
const ManageOrder: React.FC = () => {
  const navigate = useNavigate()
  const { customerId } = useParams()
  const [customers, setCustomers] = useState<ICustomer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [customerDetails, setCustomerDetails] = useState<ICustomer | null>(null)
  
  const [customerSearch, setCustomerSearch] = useState('')
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const [page, setPage] = useState(1)
  
  const { products, totalPages, isLoading: prodLoading } = useProducts({
    search: debouncedSearch,
    page,
    per_page: 20
  })

  const [activeProductId, setActiveProductId] = useState<string | null>(null)
  const [adminCart, setAdminCart] = useState<IAdminCartItem[]>([])

  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [deliveryData, setDeliveryData] = useState<DeliveryMethod[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('')
  const [generatePaymentCode, setGeneratePaymentCode] = useState(false)
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    axiosInstance.get('/api/admin/customers').then(res => {
      const custs = res.data.data || res.data;
      setCustomers(custs)
      if (customerId) {
        const found = custs.find((c: ICustomer) => c.id === customerId);
        if (found) {
          setSelectedCustomer(customerId);
          setCustomerSearch(`${found.first_name} ${found.last_name}`);
        }
      }
    }).catch(console.error)
    axiosInstance.get('/api/delivery-methods').then(res => {
      setDeliveryData(res.data)
      if (res.data.length > 0) setSelectedDeliveryId(res.data[0].id)
    }).catch(console.error)
  }, [customerId])

  useEffect(() => {
    if (selectedCustomer) {
      axiosInstance.get(`/api/admin/accounts/customer/${selectedCustomer}`).then(res => {
        setCustomerDetails(res.data.data)
        if (res.data.data.addresses?.length > 0) {
          setSelectedAddressId(res.data.data.addresses[0].id)
        } else {
          setSelectedAddressId('')
        }
      }).catch(console.error)
    } else {
      setCustomerDetails(null)
      setSelectedAddressId('')
    }
  }, [selectedCustomer])

  const handleAddProduct = (rawData: unknown) => {
    const data = rawData as IAddPayload;
    setAdminCart(prev => [...prev, {
      ...data,
      id: `tmp_${Math.random().toString(36).substr(2, 9)}`,
      productName: data.product.name,
      productImage: data.product.main_image,
      totalCartPrice: data.priceBreakdown.total,
      plate_price: data.plate?.compatibility?.find((c: { product_id: string, print_price_per_unit?: Record<string, number> }) => c.product_id === data.product.id)?.print_price_per_unit?.[data.variant.variant_id] ?? data.plate?.compatibility?.find((c: { product_id: string, print_price_per_unit?: Record<string, number> }) => c.product_id === data.product.id)?.print_price_per_unit?.['ALL'] ?? 0
    }])
    setActiveProductId(null)
    toast.success('Added to order list')
  }

  const removeCartItem = (id: string) => {
    setAdminCart(prev => prev.filter(i => i.id !== id))
  }

  const handlePurchase = async () => {
    if (!selectedCustomer || !selectedAddressId || !selectedDeliveryId || adminCart.length === 0) {
      toast.error('Please complete all required fields and add items')
      return
    }

    setIsProcessing(true)
    try {
      const payload = {
        customer_id: selectedCustomer,
        address_id: selectedAddressId,
        delivery_method_id: selectedDeliveryId,
        notes,
        generate_payment_code: generatePaymentCode,
        total_amount: adminCart.reduce((acc, i) => acc + i.totalCartPrice, 0),
        items: adminCart.map(i => ({
          product_id: i.product.id,
          variant_id: i.variant.variant_id,
          screenplate_id: i.plate?.id || null,
          quantity: i.quantity,
          unit_price: i.variant.price,
          plate_price: i.plate_price,
          total_price: i.totalCartPrice,
          colors: i.colors.map((c: { id: string }, colorIdx: number) => ({
            color_id: c.id,
            channel_label: colorIdx === 0 ? 'Primary' : colorIdx === 1 ? 'Secondary' : 'Accent',
            channel_order: colorIdx
          }))
        }))
      }

      await axiosInstance.post('/api/admin/orders/direct', payload)
      toast.success('Order created successfully')
      setAdminCart([])
      setNotes('')
      navigate('/admin/orders')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create order')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="orders-page animate-in fade-in mx-auto flex max-w-[1700px] flex-col gap-8 px-4 pb-16 duration-500 lg:px-10 mt-8">
      
      {/* 🚀 HEADER SECTION */}
      <section className="flex flex-col items-center justify-between gap-6 rounded-[24px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/40 lg:flex-row">
        <div className="flex items-center gap-4 w-full">
           <button onClick={() => navigate('/admin/orders')} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
              <ArrowLeft size={20} className="text-slate-900" />
           </button>
           <ShoppingBag className="text-emerald-500 shrink-0 ml-2" size={32} />
           <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase italic leading-tight">Create Direct Order</h2>
              <p className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase italic mt-1">Admin Order Processing</p>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* 📦 LEFT PANEL: CHECKOUT LOGISTICS */}
        <aside className="orders-customer-sidebar flex flex-col gap-6 lg:col-span-4 relative z-[100]">
          <div className="rounded-[24px] border border-slate-100 bg-white shadow-xl shadow-slate-200/30 p-6 md:p-8 relative">
            <h3 className="text-lg font-black text-slate-900 uppercase italic border-b border-slate-100 pb-4 mb-6">
              1. Customer Profile
            </h3>
            
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={selectedCustomer && customerDetails ? `${customerDetails.first_name} ${customerDetails.last_name}` : "Search Customer (e.g. name or email)..."}
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value)
                  setIsCustomerDropdownOpen(true)
                  if(e.target.value === '') setSelectedCustomer('')
                }}
                onFocus={() => setIsCustomerDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-[16px] text-xs font-black tracking-widest uppercase italic text-slate-900 focus:border-emerald-500 outline-none transition-colors"
              />
              {isCustomerDropdownOpen && customerSearch && (
                 <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto border border-slate-200 rounded-[16px] bg-white shadow-xl z-[100] custom-scrollbar">
                    {customers.filter(c => (c.first_name + ' ' + c.last_name + ' ' + c.email).toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                       <div 
                         key={c.id} 
                         onClick={() => { 
                           setSelectedCustomer(c.id); 
                           setCustomerSearch(''); 
                           setIsCustomerDropdownOpen(false); 
                         }}
                         className="p-4 text-xs font-black text-slate-900 uppercase hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                       >
                         {c.first_name} {c.last_name} <span className="text-[10px] text-slate-500 block mt-1">{c.email}</span>
                       </div>
                    ))}
                    {customers.filter(c => (c.first_name + ' ' + c.last_name + ' ' + c.email).toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                      <div className="p-4 text-xs font-bold text-slate-400 italic text-center">No customers found</div>
                    )}
                 </div>
              )}
            </div>

            {customerDetails && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <AdminAddressSelector 
                  addresses={customerDetails.addresses || []} 
                  selectedId={selectedAddressId} 
                  onSelect={setSelectedAddressId} 
                />
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-xl shadow-slate-200/30 p-6 md:p-8">
            <h3 className="text-lg font-black text-slate-900 uppercase italic border-b border-slate-100 pb-4 mb-6">
              2. Logistics & Notes
            </h3>
            <DeliverySection methods={deliveryData} selectedId={selectedDeliveryId} onSelect={setSelectedDeliveryId} />
            
            <div className="mt-8 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer" onClick={() => setGeneratePaymentCode(!generatePaymentCode)}>
               <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors ${generatePaymentCode ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                  {generatePaymentCode && <CheckCircle2 size={14} />}
               </div>
               <span className="text-xs font-black text-slate-900 uppercase italic">Generate Payment Code Automatically</span>
            </div>

            <div className="mt-8">
              <ExtraNotesSection notes={notes} setNotes={setNotes} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-slate-900 p-6 md:p-8 text-white shadow-xl">
            <h3 className="text-lg font-black text-white uppercase italic border-b border-white/10 pb-4 mb-6 flex items-center justify-between">
              <span>3. Order Summary</span>
              <span className="text-[10px] tracking-widest font-bold bg-white/10 px-3 py-1 rounded-full text-emerald-400">{adminCart.length} Items</span>
            </h3>
            
            {adminCart.length === 0 ? (
              <div className="text-center p-8 bg-white/5 rounded-2xl text-white/40 font-bold text-xs tracking-widest uppercase italic border border-white/5 border-dashed">Cart is empty</div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {adminCart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 rounded-[16px] border border-white/10 group">
                    <div>
                      <div className="font-black text-white text-xs uppercase italic truncate max-w-[150px]">{item.productName}</div>
                      <div className="text-[10px] font-bold text-emerald-400 mt-1 uppercase">Qty: {item.quantity} | {item.variant.size}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-black text-white italic">₱{item.totalCartPrice.toLocaleString()}</div>
                      <button onClick={() => removeCartItem(item.id)} className="text-rose-400 p-2 hover:bg-rose-500/20 rounded-xl transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {adminCart.length > 0 && (
              <>
                <div className="pt-6 mt-6 border-t border-white/10">
                  <div className="flex justify-between font-black text-2xl text-white italic tracking-tighter">
                    <span>Total:</span>
                    <span className="text-emerald-400">₱{adminCart.reduce((a, b) => a + b.totalCartPrice, 0).toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={handlePurchase}
                  disabled={isProcessing || !selectedCustomer || !selectedAddressId}
                  className="w-full mt-8 flex items-center justify-center gap-3 bg-emerald-500 text-slate-900 font-black italic uppercase tracking-widest py-5 rounded-[16px] hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
                >
                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  Complete Order
                </button>
              </>
            )}
          </div>
        </aside>

        {/* 🖼️ RIGHT PANEL: PRODUCT SELECTION */}
        <main className="orders-main-panel space-y-8 lg:col-span-8">
          <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40 p-6 md:p-8 min-h-[800px]">
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase italic">
                  Product Selection
                </h3>
                <p className="mt-1 text-[10px] font-black tracking-[2px] text-slate-400 uppercase italic">
                  Browse and add products
                </p>
              </div>
              <div className="relative w-full md:w-auto">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="SEARCH CATALOG..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-[300px] pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-[16px] text-xs font-black tracking-widest uppercase italic text-slate-900 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>

            {prodLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
              </div>
            ) : (
              <div className="animate-in fade-in duration-500 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                      <th className="p-4">Product</th>
                      <th className="p-4 text-center">Base Price</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="p-4 flex items-center gap-4">
                          {p.main_image ? (
                            <img src={p.main_image} className="w-12 h-12 rounded-xl object-cover bg-slate-100" onError={(e) => e.currentTarget.style.display = 'none'} />
                          ) : (
                            <BoxFallback className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100" iconClassName="h-5 w-5 opacity-30" />
                          )}
                          <div>
                            <div className="font-black text-sm uppercase italic text-slate-900">{p.name}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">{p.category_label || 'Uncategorized'}</div>
                          </div>
                        </td>
                        <td className="p-4 text-center font-black italic text-emerald-500">
                           ₱{p.base_price.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => setActiveProductId(p.id)} className="px-4 py-2 bg-slate-900 text-white rounded-[12px] text-[10px] font-black uppercase italic hover:bg-emerald-500 transition-colors">Select</button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-400 text-xs font-black uppercase italic tracking-widest">No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="mt-12 flex justify-center">
                  <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {activeProductId && (
        <ProductDetailModal 
          productId={activeProductId} 
          onClose={() => setActiveProductId(null)} 
          onAdd={handleAddProduct} 
        />
      )}
    </div>
  )
}

export default ManageOrder
