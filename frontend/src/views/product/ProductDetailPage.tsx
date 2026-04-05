import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, PackageCheck } from 'lucide-react';

import { clsx } from 'clsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import gsap from 'gsap';
import toast from 'react-hot-toast';

// Core Technical Implementation Dependencies
import type { IProduct, IScreenPlate } from '../../types/product.types';
import { fetchProductById, fetchCompatiblePlates } from './services/mockDataService';
import { useProductDetail } from './hooks/useProductDetail';
import { getStockStatus } from './utils/priceCalculator';

// Local Component Nodes
import ImageGallery from './components/ImageGallery';
import VariantSelector from './components/VariantSelector';
import QuantityPicker from './components/QuantityPicker';
import ColorPicker from './components/ColorPicker';
import PlateSelector from './components/PlateSelector';
import ProductInfoCard from './components/ProductInfoCard';
import PriceCalculatorUI from './components/PriceCalculatorUI';
import FullscreenGalleryModal from '../../components/common/FullscreenGalleryModal';
import { mockCartService } from '../../pages/AddToCart/services/mockCartService';


// ─── Loading State UI Protocol ────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('bg-slate-100 animate-pulse rounded-[44px]', className)} />
);

// ─── Product Detail Inner Configuration (Data Hydrated) ───────────────────────
const ProductDetailInner: React.FC<{ product: IProduct; compatiblePlates: IScreenPlate[]; preselectedPlateName?: string | null }> = ({
  product, compatiblePlates, preselectedPlateName
}) => {
  const navigate = useNavigate();
  const stockStatus = getStockStatus(product.current_stock, product.min_threshold);
  
  // Logic Engine Integration
  const { state, actions, computed } = useProductDetail({ product, compatiblePlates, preselectedPlateName });

  // Gallery Modal State Protocol
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Cross-Table Logic Matrix: Identify compat variants based on selected screenplate
  const compatibleVariantSizes = React.useMemo(() => {
    if (!state.selectedPlateId) return null;
    const selectedPlate = compatiblePlates.find(p => p.id === state.selectedPlateId);
    if (!selectedPlate) return null;
    
    const compatibility = selectedPlate.compatibility.find(cp => cp.product_id === product.id);
    return compatibility?.allowed_variants || null;
  }, [state.selectedPlateId, compatiblePlates, product.id]);


  // Automatic Top-0 Scroll Protocol
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [product.id]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stagger-item', {
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power4.out',
        clearProps: 'all'
      });
    });
    return () => ctx.revert();
  }, []);

  const handleAddToCart = () => {
    const variant = computed.selectedVariant;
    if (!variant) {
      toast.error('Please select a product variant.');
      return;
    }

    mockCartService.addCartItem({
      productId: product.id,
      productName: product.name,
      productImage: product.main_image,
      category: product.category,
      minOrder: product.min_order,
      currentStock: computed.stockForVariant,
      quantity: state.quantity,
      variant: {
        id: variant.variant_id,
        size: variant.size,
        width: variant.width,
        height: variant.height,
        unitPrice: variant.price,
        stock: variant.stock,
      },
      colors: computed.selectedColors.map((c) => ({
        id: c.id,
        name: c.name,
        hex: c.hex,
        type: c.type,
      })),
      plate: computed.selectedPlate
        ? {
            id: computed.selectedPlate.id,
            name: computed.selectedPlate.plate_name,
            type: computed.selectedPlate.is_flatscreen ? 'Flatscreen' : 'Cylindrical',
            printPricePerUnit:
              computed.selectedVariant 
                ? (computed.selectedPlate.compatibility.find((cp) => cp.product_id === product.id)?.print_price_per_unit?.[computed.selectedVariant.size] ?? 0)
                : 0,
            setupFee: computed.selectedPlate.base_setup_fee,
            channels: computed.selectedPlate.channels,
            printingInfo: computed.selectedPlate.technical_info || 'High-accuracy production node.',
            isOwned: state.ownedPlateIds.includes(computed.selectedPlate.id),
          }
        : null,
      customRequirements: state.customRequirements,
    });

    toast.success('Product added to cart.');
    navigate('/addtocart');
  };

  const handleBuyNow = () => {
    const variant = computed.selectedVariant;
    if (!variant) {
      toast.error('Please select a product variant.');
      return;
    }

    const buyNowItem = {
      productId: product.id,
      productName: product.name,
      productImage: product.main_image,
      category: product.category,
      minOrder: product.min_order,
      currentStock: computed.stockForVariant,
      quantity: state.quantity,
      variant: {
        id: variant.variant_id,
        size: variant.size,
        width: variant.width,
        height: variant.height,
        unitPrice: variant.price,
        stock: variant.stock,
      },
      colors: computed.selectedColors.map((c) => ({
        id: c.id,
        name: c.name,
        hex: c.hex,
        type: c.type,
      })),
      plate: computed.selectedPlate
        ? {
            id: computed.selectedPlate.id,
            name: computed.selectedPlate.plate_name,
            type: computed.selectedPlate.is_flatscreen ? 'Flatscreen' : 'Cylindrical',
            printPricePerUnit:
              computed.selectedVariant 
                ? (computed.selectedPlate.compatibility.find((cp) => cp.product_id === product.id)?.print_price_per_unit?.[computed.selectedVariant.size] ?? 0)
                : 0,
            setupFee: computed.selectedPlate.base_setup_fee,
            channels: computed.selectedPlate.channels,
            printingInfo: computed.selectedPlate.technical_info || 'High-accuracy production node.',
            isOwned: state.ownedPlateIds.includes(computed.selectedPlate.id),
          }
        : null,
      customRequirements: state.customRequirements,
    };

    localStorage.setItem('pixs_buy_now_v1', JSON.stringify([buyNowItem]));
    navigate('/transactions?direct=true');
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <ToastContainer position="bottom-right" theme="dark" hideProgressBar />

      {/* Persistent Breadcrumb Architecture */}
      <div className="sticky top-24 z-30 bg-white/60 backdrop-blur-3xl border-b border-slate-50 px-6 md:px-16 py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> BACK TO MARKET
            </button> 
            <div className="h-4 w-px bg-slate-100 mx-2" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{product.category}</span>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={!computed.canAddToCart}
            className={clsx(
              'px-6 py-2 rounded-full flex items-center justify-center gap-4 transition-all duration-500 relative overflow-hidden group active:scale-[0.98]',
              computed.canAddToCart 
                ? 'bg-slate-900 text-white shadow-xl hover:scale-[1.01]' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed grayscale opacity-60'
            )}
          >
            <span className="text-[10px] font-black uppercase italic tracking-tighter">
              {computed.canAddToCart ? 'BUY NOW' : computed.isOutOfStock ? 'OUT OF STOCK' : 'Protocol Locked'}
            </span>
            <PackageCheck size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Master Content Logic Area */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-16 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 xl:gap-32 items-start">

          {/* ── Left Projection Space: Image Gallery ──────────────────────────── */}
          <div className="lg:sticky lg:top-56 stagger-item">
            <ImageGallery
              mainImage={product.main_image}
              gallery={product.gallery}
              productName={product.name}
              onImageClick={(idx) => {
                setGalleryIndex(idx);
                setIsGalleryOpen(true);
              }}
            />
          </div>


          {/* ── Right Control Space: Order Configuration ──────────────────────── */}
          <div className="space-y-12">
            
            {/* Semantic Identity Identification */}
            <div className="stagger-item">
              <div className="flex items-center gap-3 mb-4">
                 <span className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">SKU · {product.id}</span>
                 <div className={clsx('flex items-center gap-1.5', stockStatus.color)}>
                    <div className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', stockStatus.dot)} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{stockStatus.label}</span>
                 </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic uppercase leading-none mb-6">
                {product.name}
              </h1>
              <p className="text-base text-slate-500 font-bold leading-relaxed pr-10">{product.long_description}</p>
            </div>

            {/* Matrix Divider Protocol */}
            <div className="h-px bg-slate-50 stagger-item" />

            {/* Selection Node: Variant Identification */}
            <div className="stagger-item">
              <VariantSelector
                variants={product.variants}
                selectedVariantId={state.selectedVariantId}
                onSelect={actions.setSelectedVariantId}
                minThreshold={product.min_threshold}
                compatibleVariantSizes={compatibleVariantSizes}
              />
            </div>


            {/* Selection Node: Master Color Inventory (Condition Protocol) */}
            {product.is_need_color && (
              <div className="stagger-item">
                <ColorPicker
                  colors={state.colors}
                  selectedColorIds={state.selectedColorIds}
                  maxChannels={computed.selectedPlate?.channels || 1}
                  onSelect={actions.handleColorChange}
                />
              </div>
            )}

            {/* Selection Node: Operational Quantity Unit Picker (with Quick Select) */}
            <div className="stagger-item">
              <QuantityPicker
                quantity={state.quantity}
                minOrder={product.min_order}
                maxStock={computed.stockForVariant}
                onChange={actions.setQuantity}
              />
            </div>

            {/* Selection Node: Screen Plate Logic Allocation (Filtered Inventory) */}
            <div className="stagger-item">
              <PlateSelector
                selectablePlates={state.selectablePlates}
                selectedPlateId={state.selectedPlateId}
                onPlateChange={actions.handlePlateChange}
                isRequired={product.is_need_screenplate}
                productId={product.id}
                selectedVariantSize={computed.selectedVariant?.size}
              />
            </div>

            {/* Selection Node: Custom Production Requisition */}
            <div className="stagger-item space-y-4">
               <div>
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[3px] mb-2 flex items-center gap-2">
                     <PackageCheck size={14} className="text-slate-900" />
                     Production Requisition Node
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     Specify custom printing instructions, logo placements, or specialized material requirements for this item.
                  </p>
               </div>
               <textarea 
                 value={state.customRequirements}
                 onChange={(e) => actions.setCustomRequirements(e.target.value)}
                 placeholder="Terminal Input: Enter custom specifications..."
                 className="w-full h-32 bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-300 resize-none transition-all"
               />
            </div>

            {/* Dynamic Finalization Logic: Price Calculation UI (Inclusive Protocol) */}
            <div className="stagger-item pt-8 border-t-4 border-slate-50">
              <PriceCalculatorUI
                breakdown={computed.priceBreakdown}
                canAddToCart={computed.canAddToCart}
                isOutOfStock={computed.isOutOfStock}
                minOrder={product.min_order}
                isQuantityTooLow={computed.isQuantityTooLow}
                hasRequiredPlate={computed.hasRequiredPlate}
                isNeedScreenplate={product.is_need_screenplate}
                hasRequiredColor={computed.hasRequiredColor}
                isNeedColor={product.is_need_color}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            </div>

            {/* Detailed Technical Nodes Table */}
            <div className="stagger-item pt-12">
               <ProductInfoCard 
                 product={product} 
                 selectedVariant={computed.selectedVariant} 
               />
            </div>

          </div>
        </div>
      </div>

      {/* Cinematic Fullscreen Viewing Hub */}
      <FullscreenGalleryModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={[product.main_image, ...product.gallery]}
        initialIndex={galleryIndex}
        productName={product.name}
      />
    </div>

  );
};

// ─── Component Entry Hook (Lifecycle Logic) ──────────────────────────────────
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const [product, setProduct] = useState<IProduct | null>(null);
  const [plates, setPlates] = useState<IScreenPlate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    Promise.all([fetchProductById(id), fetchCompatiblePlates(id)])
      .then(([prod, pls]) => {
        if (!isMounted) return;
        if (!prod) { setNotFound(true); } 
        else { setProduct(prod); setPlates(pls); }
        setIsLoading(false);
      })
      .catch(() => { if (isMounted) setNotFound(true); setIsLoading(false); });

    return () => { isMounted = false; };
  }, [id]);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const plateName = searchParams.get('plate');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-32">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-24">
          <Skeleton className="aspect-[3/4]" />
          <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center italic space-y-6">
        <h1 className="text-7xl font-black text-slate-200 uppercase tracking-tighter">NULL DATA</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">The requested production node does not exist in the system architecture.</p>
        <button onClick={() => window.history.back()} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Return To Market</button>
      </div>
    );
  }

  return <ProductDetailInner key={product.id} product={product} compatiblePlates={plates} preselectedPlateName={plateName} />;
};

export default ProductDetailPage;
