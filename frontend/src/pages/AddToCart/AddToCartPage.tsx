import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, Circle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import colorData from '../../data/color.json';
import productsData from '../../data/products.json';
import screenplateData from '../../data/screenplate.json';
import { useCart } from './hooks/useCart';
import type { CartColorInfo } from '../../types/cart';
import type { IProduct, IScreenPlate } from '../../types/product.types';

const AddToCartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, updateColors, updateVariant, updatePlatePrice, removeItem, getItemTotal } = useCart();
  const colors = colorData as CartColorInfo[];
  const products = productsData as IProduct[];
  
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => items.map(i => i.id));

  const toggleSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedItems = items.filter(i => selectedItemIds.includes(i.id));
  const selectedTotal = selectedItems.reduce((acc, item) => {
    const total = getItemTotal(item.id)?.total ?? 0;
    return acc + total;
  }, 0);

  const handleSelectAll = () => {
    if (selectedItemIds.length === items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map(i => i.id));
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one product.');
      return;
    }
    // Store selected items for checkout node
    localStorage.setItem('pixs_checkout_node', JSON.stringify(selectedItems));
    navigate('/transactions');
  };

  const handleQuantityChange = (itemId: string, nextQtyRaw: number) => {
    const target = items.find((item) => item.id === itemId);
    if (!target) return;

    const nextQty = Number.isFinite(nextQtyRaw) ? Math.floor(nextQtyRaw) : 1;
    updateQuantity(target, nextQty);
  };

  const handleColorChange = (item: typeof items[0], colorId: string) => {
    const selectedColor = colors.find((c) => c.id === colorId);
    if (!selectedColor) return;

    const maxChannels = item.plate?.channels || 1;
    const currentColors = item.colors || [];
    
    let nextColors: CartColorInfo[];
    if (currentColors.some(c => c.id === colorId)) {
      nextColors = currentColors.filter(c => c.id !== colorId);
    } else if (currentColors.length < maxChannels) {
      nextColors = [...currentColors, selectedColor];
    } else {
      if (maxChannels === 1) {
        nextColors = [selectedColor];
      } else {
        return; // Block if at max
      }
    }
    
    updateColors(item.id, nextColors);
    toast.success('Configuration updated.');
  };

  const handleVariantChange = (itemId: string, variantId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    const variant = product?.variants.find(v => v.variant_id === variantId);
    if (!variant) return;

    const targetItem = items.find(i => i.id === itemId);
    if (targetItem?.plate) {
      const plate = (screenplateData as IScreenPlate[]).find(p => p.id === targetItem.plate?.id);
      const compatibility = plate?.compatibility.find(cp => cp.product_id === productId);
      const newPrice = compatibility?.print_price_per_unit?.[variant.size] ?? 0;
      updatePlatePrice(itemId, newPrice);
    }

    updateVariant(itemId, {
      id: variant.variant_id,
      size: variant.size,
      width: variant.width,
      height: variant.height,
      unitPrice: variant.price,
      stock: variant.stock,
    });
    toast.success('Product variant updated.');
  };

  return (
    <div className="AddToCartPage min-h-screen bg-slate-50 pb-32">
      <div className="sticky top-32 lg:top-20 z-30 border-b border-slate-100 bg-white/60 px-6 py-5 backdrop-blur-3xl md:px-16">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="CartBackButton flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to Homepage
          </button>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cart Review Node</p>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-6 pt-12 md:px-16">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 md:text-5xl">Add To Cart</h1>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Review products, adjust color and quantity, then proceed to checkout.
            </p>
          </div>
          
          {items.length > 0 && (
            <button 
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 shadow-sm group"
            >
              {selectedItemIds.length === items.length ? (
                <>
                  <Circle size={16} className="text-slate-300 group-hover:text-slate-400" />
                  Deselect All Terminal Nodes
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-pixs-mint" />
                  Select All Terminal Nodes
                </>
              )}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-black uppercase italic tracking-tight text-slate-900">Your cart is empty</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Add products from product details.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <section className="CartProductList space-y-4">
              {items.map((item) => {
                const itemTotal = getItemTotal(item.id);
                if (!itemTotal) return null;
                const productMeta = products.find((product) => product.id === item.productId);
                const isNeedColor = productMeta?.is_need_color ?? item.colors.length > 0;
                const shortDescription = productMeta?.short_description ?? 'No short description available.';
                const isSelected = selectedItemIds.includes(item.id);

                return (
                  <article key={item.id} className={`CartProductCard relative rounded-[24px] border p-5 shadow-sm md:p-6 transition-all ${
                    isSelected ? 'border-pixs-mint bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}>
                    
                    {/* Selection Hub */}
                    <button 
                      onClick={() => toggleSelection(item.id)}
                      className="absolute top-4 left-4 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-95"
                    >
                      {isSelected 
                        ? <CheckCircle2 className="text-pixs-mint" size={24} /> 
                        : <Circle className="text-slate-300" size={24} />
                      }
                    </button>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start pl-8">
                      <img src={item.productImage} alt={item.productName} className="CartProductImage h-24 w-24 rounded-[24px] object-cover md:h-28 md:w-28" />

                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="CartProductTitle text-lg font-black uppercase italic tracking-tight text-slate-900">
                              {item.productName}
                            </h3>
                            <p className="CartProductVariant text-xs font-black uppercase tracking-widest text-slate-500">
                              {item.variant.size} | {item.variant.width} x {item.variant.height}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">{shortDescription}</p>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="CartProductRemoveButton inline-flex items-center gap-1 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-rose-600 transition hover:bg-rose-100"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>

                        {/* Variant Configuration Hub */}
                        <div className="CartProductVariantPicker space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Variant Node</label>
                            {item.plate && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-pixs-mint flex items-center gap-1">
                                <CheckCircle2 size={10} /> Compatibility Locked
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {productMeta?.variants.map((v) => {
                              const isSelected = item.variant.id === v.variant_id;
                              let isCompatible = true;
                              
                              if (item.plate) {
                                const plate = (screenplateData as IScreenPlate[]).find(p => p.id === item.plate?.id);
                                const compatibility = plate?.compatibility.find(cp => cp.product_id === item.productId);
                                isCompatible = compatibility?.allowed_variants.includes(v.size) ?? false;
                              }

                              return (
                                <button
                                  key={`${item.id}-${v.variant_id}`}
                                  disabled={!isCompatible}
                                  onClick={() => handleVariantChange(item.id, v.variant_id, item.productId)}
                                  className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition relative ${
                                    isSelected
                                      ? 'border-slate-900 bg-slate-900 text-white'
                                      : isCompatible
                                        ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                        : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed grayscale'
                                  }`}
                                >
                                  {v.size}
                                  {!isCompatible && isSelected && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {item.plate && (
                            <p className="text-[9px] font-bold text-slate-400 italic">
                              * Note: Locked to your screenplate. Contact Admin if you need other variants or <button onClick={() => navigate(`/screenplate?product_id=${item.productId}&variant=${item.variant.size}&mode=incompatible`)} className="underline hover:text-slate-900">request new plate</button>.
                            </p>
                          )}
                          {!item.plate && productMeta?.is_need_screenplate && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                              <p className="text-[9px] font-black uppercase text-amber-700">Missing Screenplate Requirement</p>
                              <button 
                                onClick={() => navigate(`/screenplate?product_id=${item.productId}&variant=${item.variant.size}`)}
                                className="px-3 py-1 bg-amber-600 text-white text-[8px] font-black uppercase rounded-lg hover:bg-amber-700 transition-colors"
                              >
                                Initialize Setup
                              </button>
                            </div>
                          )}
                        </div>

                        {isNeedColor && (
                          <div className="CartProductColorPicker space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Master Color Sequence {item.plate && `(${item.colors.length}/${item.plate.channels} Channels)`}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {colors.map((color) => {
                                const index = item.colors.findIndex((c) => c.id === color.id);
                                const selected = index !== -1;
                                const label = selected ? (index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Accent') : null;
                                
                                return (
                                  <button
                                    key={`${item.id}-${color.id}`}
                                    onClick={() => handleColorChange(item, color.id)}
                                    className={`relative rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                                      selected
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: color.hex }} />
                                      {color.name}
                                      {label && <span className="ml-1 text-[8px] text-pixs-mint italic">{label}</span>}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="CartProductQuantity flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => handleQuantityChange(item.id, Number(event.target.value))}
                            className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-black text-slate-900 outline-none"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-50 p-4 md:grid-cols-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price / Unit</p>
                            <p className="font-mono text-sm font-black italic text-slate-900">PHP {item.variant.unitPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</p>
                            <p className="font-mono text-sm font-black italic text-slate-900">PHP {itemTotal.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="CartTotalSection sticky top-36 lg:top-40 h-fit rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900">Cart Total</h2>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {selectedItems.length} Selected Item{selectedItems.length > 1 ? 's' : ''}
              </p>
              <div className="my-5 h-px bg-slate-100" />
              <p className="font-mono text-3xl font-black italic text-slate-900">PHP {selectedTotal.toFixed(2)}</p>
              <button 
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className={`CartCheckoutButton mt-6 w-full rounded-3xl border px-8 py-4 text-[10px] font-black uppercase italic tracking-[4px] shadow-2xl transition-all active:scale-95 ${
                  selectedItems.length > 0 
                  ? 'border-white/10 bg-slate-900 text-white hover:scale-105' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border-slate-200'
                }`}
              >
                Checkout Selected Node
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default AddToCartPage;
