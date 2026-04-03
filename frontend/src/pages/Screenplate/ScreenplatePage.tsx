import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FiUploadCloud, FiSearch, FiX, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import productsDataRaw from '../../data/products.json';

interface ProductVariant {
  variant_id: string;
  size: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  print_method?: string;
  variants?: ProductVariant[];
  main_image?: string;
  short_description?: string;
  tags?: string[];
}

const productsData = productsDataRaw as Product[];

const ScreenplatePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [colorCount, setColorCount] = useState<number>(0);
  const [alignment, setAlignment] = useState<string>('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');
  const [searchParams] = useSearchParams();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle URL Parameters for auto-selection
  useEffect(() => {
    const productId = searchParams.get('product_id');
    const variantSize = searchParams.get('variant');

    if (productId && variantSize) {
      const product = productsData.find(p => p.id === productId);
      if (product) {
        const variant = product.variants?.find(v => v.size === variantSize);
        if (variant) {
          setSelectedProduct(product);
          setSelectedVariant(variant);
          setSearchQuery(`${product.name} - ${variant.size}`);
        }
      }
    }
  }, [searchParams]);

  const isIncompatibleMode = searchParams.get('mode') === 'incompatible';

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return productsData.filter((p) => {
      // Filter for Screen Print or Flat Screen compatibility
      const method = p.print_method || '';
      const isCompatible = method.includes('Screen Print') || method.includes('Flat Screen');
      if (!isCompatible) return false;

      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchVariant = p.variants?.some((v: ProductVariant) => v.size.toLowerCase().includes(q));

      return matchName || matchVariant;
    });
  }, [searchQuery]);

  const BASE_SETUP_FEE = 700;
  const calculatedTotal = colorCount ? (BASE_SETUP_FEE * colorCount) : 0;
  const isValid = selectedProduct && selectedVariant && colorCount > 0 && alignment && referenceImage;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectVariant = (product: Product, variant: ProductVariant) => {
    setSelectedProduct(product);
    setSelectedVariant(variant);
    setSearchQuery(`${product.name} - ${variant.size}`);
    setDropdownOpen(false);
  };

  const handleSubmit = () => {
    if (!isValid) {
      toast.error('Please complete all required fields.');
      return;
    }

    const transactionId = `TXN-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // 1. Order Payload (Direct Pay)
    const orderPayload = {
      order_id: transactionId,
      product_id: selectedProduct.id,
      variant: selectedVariant.size,
      total_amount: calculatedTotal,
      order_type: "Screenplate Checkout",
      payment_status: "Paid",
      status: "Processing"
    };

    // 2. Screenplate Request Payload 
    const screenplatePayload = {
      request_id: transactionId,
      product_id: selectedProduct.id,
      variant: selectedVariant.size,
      color_count: colorCount,
      alignment: alignment,
      reference_image: referenceImage, // Base64 or path
      comment: comment,
      status: "Pending Admin Action"
    };

    // 3. System Chat Confirmation Mock
    const chatMessagePayload = {
      message_id: `MSG-${Date.now()}`,
      sender: "System",
      receiver: "Customer",
      type: "Screenplate Confirmation",
      content: `Your screenplate request for ${selectedProduct.name} (${selectedVariant.size}) has been paid and received! Admin will process this shortly.`,
      reference_order: transactionId
    };

    const combinedTransactionData = {
      order: orderPayload,
      request_screenplate: screenplatePayload,
      chat_message: chatMessagePayload
    };

    // Simulate saving the ecosystem architecture
    const blob = new Blob([JSON.stringify(combinedTransactionData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "screenplate_transaction.json";
    link.click();
    
    toast.success("Checkout Successful! View Notification Modal & Chat for details.", { duration: 5000 });
  };

  return (
    <div className="ScreenplatePage min-h-[calc(100vh-6rem)] bg-slate-50 relative overflow-hidden flex flex-col items-center">
      
      {/* 
        Canvas Background
        The center remains empty for future Three.js injection.
        Absolute positioning allows the 3D context to take over the background.
      */}
      <div className="ScreenplateCanvas absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        {/* Intentionally left blank for Three.js */}
        <div className="text-slate-200 font-black text-6xl italic tracking-tighter opacity-50 uppercase">
          3D Canvas Reseruation
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1600px] h-full min-h-[calc(100vh-6rem)] px-6 py-6 z-10 flex flex-col lg:flex-row justify-between gap-6 relative pointer-events-none">
        
        {/* Left Panel */}
        <div className="ScreenplateLeftPanel pointer-events-auto w-full lg:w-[460px] bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-9rem)] overflow-hidden">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 shrink-0 bg-white">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
              Screenplate Setup
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[4px] text-slate-400 mt-1">
              {isIncompatibleMode ? 'Incompatibility Resolution Node' : 'Custom Branding Request'}
            </p>
          </div>

          {isIncompatibleMode && (
            <div className="mx-8 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-pulse">
              <FiAlertTriangle className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase text-rose-700">Protocol Mismatch Detected</p>
                <p className="text-[9px] text-rose-600 mt-1 leading-relaxed">
                  Your current screenplate does not support this variant configuration. Initializing new industrial node setup.
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-12">
            
            {/* 1. Search Bar */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                1. Target Container *
              </label>
              
              <div className="relative z-20">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search cup or size..."
                  className="ScreenplateSearchInput w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                />
                {(selectedProduct || selectedVariant) && (
                  <button 
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedVariant(null);
                      setSearchQuery('');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              {/* 2. Search Dropdown */}
              {dropdownOpen && searchResults.length > 0 && (
                <div className="ScreenplateSearchDropdown absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[20px] shadow-2xl z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div key={product.id} className="ScreenplateSearchItem p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0 pointer-events-auto">
                      <div className="font-bold text-sm text-slate-900">{product.name}</div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3">{product.category}</div>
                      <div className="flex flex-wrap gap-2">
                        {product.variants?.map((v: ProductVariant) => (
                          <button
                            key={v.variant_id}
                            onClick={() => handleSelectVariant(product, v)}
                            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
                          >
                            {v.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 1.a Selected Product Card Data */}
              {selectedProduct && (
                <div className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex gap-4 p-4 border border-slate-100 bg-white rounded-2xl shadow-sm">
                    {selectedProduct.main_image && (
                      <img src={selectedProduct.main_image} alt={selectedProduct.name} className="w-20 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100" />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-black text-slate-900 italic">{selectedProduct.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 md:leading-relaxed">{selectedProduct.short_description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                         {selectedProduct.tags?.slice(0, 3).map((tag: string) => (
                           <span key={tag} className="text-[8px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-black uppercase tracking-widest">{tag}</span>
                         ))}
                      </div>
                    </div>
                  </div>

                  {/* Intelligent Compatibility Note */}
                  <div className="p-4 rounded-[16px] bg-blue-50 border border-blue-100 flex items-start gap-3">
                     <FiInfo className="text-blue-500 shrink-0 mt-0.5" />
                     {alignment === 'Front' || alignment === '' ? (
                       <p className="text-[10px] text-blue-800 leading-snug">
                          <span className="font-bold">COMPATIBILITY NOTE:</span> Screenplates for 'Front-only' logos may be compatible with other products of similar sizes. Our system admin will verify and adjust this for you.
                       </p>
                     ) : (
                       <p className="text-[10px] text-blue-800 leading-snug">
                          <span className="font-bold">UNIQUE CIRCUMFERENCE WARNING:</span> Because this is an all-around Flat Screen plate (Back to Back / Triple Logo), different cups have different rotational circumferences. A unique plate is required exclusively for this specific product.
                       </p>
                     )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Color Selection */}
            <div className="ScreenplateColorSection">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                2. Color Separation *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((num) => (
                  <label 
                    key={num} 
                    className={`
                      relative flex cursor-pointer rounded-[16px] border px-4 py-4 focus:outline-none 
                      ${colorCount === num ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}
                      transition-all
                    `}
                  >
                    <input 
                      type="radio" 
                      name="colors" 
                      className="ScreenplateColorRadio sr-only" 
                      checked={colorCount === num}
                      onChange={() => setColorCount(num)}
                    />
                    <div className="flex w-full items-center justify-center">
                      <span className="text-xs font-black uppercase tracking-widest">{num} Color{num > 1 ? 's' : ''}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Logo Alignment */}
            <div className="ScreenplateAlignmentSection">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                3. Print Alignment *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {['Front', 'Back to Back', 'Triple Logo'].map((align) => (
                  <label 
                    key={align} 
                    className={`
                      relative flex cursor-pointer rounded-[16px] border px-4 py-4 focus:outline-none 
                      ${alignment === align ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}
                      transition-all
                    `}
                  >
                    <input 
                      type="radio" 
                      name="alignment" 
                      className="ScreenplateAlignmentRadio sr-only" 
                      checked={alignment === align}
                      onChange={() => setAlignment(align)}
                    />
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest">{align}</span>
                      {alignment === align && <FiCheckCircle className="text-white" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Logo / Reference Upload */}
            <div className="ScreenplateReferenceSection">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                4. Brand Reference *
              </label>
              
              {!referenceImage ? (
                <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-200 border-dashed rounded-2xl appearance-none cursor-pointer hover:border-slate-400 hover:bg-slate-50 focus:outline-none">
                  <span className="flex flex-col items-center justify-center space-y-2">
                     <FiUploadCloud className="text-slate-400 w-6 h-6" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Drop logo or click
                     </span>
                  </span>
                  <input type="file" name="file_upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="relative w-full h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={referenceImage} alt="Preview" className="ScreenplateImagePreview w-full h-full object-contain" />
                  <div className="absolute inset-x-0 bottom-0 py-2 bg-white/80 backdrop-blur text-center translate-y-full group-hover:translate-y-0 transition-all">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer">
                        Replace File
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                     </label>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Textarea for Notes */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                5. Additional Instructions
              </label>
              <textarea 
                className="ScreenplateCommentTextarea w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 h-28 resize-none transition-all placeholder:text-slate-400"
                placeholder="Write any structural notes or special instructions..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* Right Panel */}
        <div className="ScreenplateRightPanel pointer-events-auto w-full lg:w-[320px] bg-white rounded-[24px] shadow-sm border border-slate-100 h-fit p-8 sticky top-8 flex flex-col gap-6">
          
          <div className="ScreenplatePricingCard flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-6">Investment Summary</h3>
            
            <div className="space-y-4 border-b border-slate-100 pb-6 mb-6">
              <div className="ScreenplatePriceRow flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Base Setup Fee</span>
                <span className="font-mono text-xs font-black italic">₱{BASE_SETUP_FEE.toLocaleString()}</span>
              </div>
              <div className="ScreenplatePriceRow flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Color Multiplier</span>
                <span className="font-mono text-xs font-black italic">{colorCount ? `x${colorCount}` : '-'}</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-sm font-black uppercase tracking-widest text-slate-900">Total Setup</span>
              <span className="ScreenplateTotalValue text-3xl font-black italic text-slate-900 tracking-tighter">
                ₱{calculatedTotal.toLocaleString()}
              </span>
            </div>

            <button 
              className={`
                ScreenplateSubmitButton w-full py-4 rounded-[16px] text-[10px] font-black uppercase tracking-[4px] italic border-2 transition-all
                ${isValid 
                  ? 'bg-slate-900 text-white border-slate-900 hover:scale-105 active:scale-95 shadow-xl' 
                  : 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'}
              `}
              onClick={handleSubmit}
              disabled={!isValid}
            >
              {isValid ? 'Pay & Lock Setup' : 'Missing Fields'}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
              Estimated setup 5-7 days
            </p>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default ScreenplatePage;
