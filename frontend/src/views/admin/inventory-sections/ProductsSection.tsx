import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, Package2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import debounce from 'lodash/debounce';
import toast from 'react-hot-toast';
import type { IProduct, ICategory } from './types';
import { TAG_OPTIONS, PRINT_METHOD_OPTIONS } from './constants';
import { 
  InputField, TextArea, ImageUploader, GalleryUploader, SectionTitle, ConfirmModal 
} from './UIComponents';
import { CategoriesSection } from './CategoriesSection';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const productSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  short_description: z.string().min(1, "Short description is required"),
  long_description: z.string().min(1, "Main description is required"),
  best_for: z.string().min(1, "Usage recommendation is required"),
  base_price: z.number().min(0, "Invalid price"),
  raw_material_cost: z.number().min(0, "Invalid cost"),
  current_stock: z.number().min(0, "Invalid stock volume"),
  min_threshold: z.number().min(0, "Invalid safety threshold"),
  min_order: z.number().min(1, "Invalid minimum order"),
  main_image: z.string().min(1, "Main image is required"),
  gallery: z.array(z.string()),
  print_method: z.string().min(1, "Print method is required"),
  tags: z.array(z.string()),
  is_need_screenplate: z.boolean(),
  is_need_color: z.boolean(),
  variants: z.array(z.object({
    variant_id: z.string(),
    size: z.string().min(1, "Size label is required"),
    width: z.string(),
    height: z.string(),
    price: z.number().min(0),
    stock: z.number().min(0)
  }))
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductsSectionProps {
  products: IProduct[];
  categories: ICategory[];
  setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>;
  setCategories: React.Dispatch<React.SetStateAction<ICategory[]>>;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({ 
  products, categories, setProducts, setCategories 
}) => {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productToDelete, setProductToDelete] = useState<IProduct | null>(null);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((val: string) => setSearch(val), 200),
    []
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveProduct = (data: ProductFormData) => {
    if (isAddingProduct) {
      if (products.some(p => p.id === data.id)) {
        toast.error("An asset with this ID already exists.");
        return;
      }
      setProducts(prev => [...prev, data as IProduct]);
      toast.success("Product added to catalog.");
    } else {
      setProducts(prev => prev.map(p => p.id === data.id ? (data as IProduct) : p));
      toast.success("Product details updated.");
    }
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
    toast.success("Product removed.");
    setProductToDelete(null);
  };

  return (
    <section id="products" className="space-y-8 border-t border-slate-100">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
           <div className="bg-white p-6 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search products by identity prefix or name..." 
                   onChange={(e) => debouncedSearch(e.target.value)}
                   className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-blue-300 transition-all uppercase tracking-tight placeholder:text-slate-300" 
                 />
              </div>
           </div>

           <div className="bg-white border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col h-[700px]">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10">
                       <tr className="border-b border-slate-50 bg-slate-50/30">
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">General Reference</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Stock Level</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-12">Action</th>
                       </tr>
                    </thead>
                    <tbody>
                       {filteredProducts.map((p) => (
                         <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-5">
                                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-white flex-shrink-0">
                                     <img src={p.main_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  </div>
                                  <div>
                                     <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight italic">{p.name}</p>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{p.id} • {p.category}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                               <span className={cn(
                                 "text-[9px] font-black px-3 py-1.5 rounded-lg border shadow-sm uppercase tracking-widest tracking-tighter",
                                 (p.current_stock || 0) < (p.min_threshold || 0) 
                                    ? "bg-rose-50 text-rose-600 border-rose-100" 
                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                               )}>
                                  {p.current_stock} pcs (Target: {p.min_threshold}+)
                               </span>
                            </td>
                            <td className="px-8 py-6 text-right space-x-2 pr-12">
                               <button onClick={() => setEditingProduct(p)} className="p-3 text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-100 shadow-sm rounded-xl transition-all border border-slate-100"><Edit size={16} /></button>
                               <button onClick={() => setProductToDelete(p)} className="p-3 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 hover:border-rose-100 shadow-sm rounded-xl transition-all border border-slate-100"><Trash2 size={16} /></button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
                 {filteredProducts.length === 0 && (
                   <div className="p-24 text-center flex flex-col items-center justify-center opacity-30">
                      <Package2 size={80} className="mb-4 text-slate-300" />
                      <p className="text-xl font-black uppercase tracking-tight">Registry Placeholder Empty</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8 flex flex-col h-full">
                 <button         
               onClick={() => {
                  setIsAddingProduct(true);
                  setEditingProduct({
                     id: `PRD-${Date.now().toString().slice(-4)}`,
                     name: '',
                     category: categories[0]?.label || 'Uncategorized',
                     short_description: '',
                     long_description: '',
                     best_for: '',
                     base_price: 0,
                     raw_material_cost: 0,
                     current_stock: 0,
                     min_threshold: 50,
                     min_order: 1,
                     main_image: 'https://placehold.co/600x600?text=Product+Image',
                     gallery: [],
                     print_method: PRINT_METHOD_OPTIONS[0],
                     tags: [],
                     is_need_screenplate: true,
                     is_need_color: true,
                     variants: []
                  });
               }}
               className="bg-slate-900 text-[#75EEA5] px-10 py-8 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3 active:scale-95"
            >
               <Plus size={18} /> Add New Product
            </button>
          {/* SIDEBAR CATEGORIES */}
          <CategoriesSection 
            categories={categories} 
            products={products} 
            setCategories={setCategories} 
          />
          
        </div>
      </div>

      <AnimatePresence>
        {editingProduct && (
          <ProductModal 
             product={editingProduct} 
             categories={categories} 
             isNew={isAddingProduct}
             onClose={() => { setEditingProduct(null); setIsAddingProduct(false); }}
             onSave={handleSaveProduct}
          />
        )}
        {productToDelete && (
          <ConfirmModal 
            isOpen={!!productToDelete}
            onClose={() => setProductToDelete(null)}
            onConfirm={handleDeleteProduct}
            title="Delete Product?"
            message={`Are you sure you want to permanently delete "${productToDelete.name}"? This action cannot be reversed.`}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

// PRODUCT MODAL COMPONENT
const ProductModal = ({ product, categories, onClose, onSave, isNew }: { product: IProduct, categories: ICategory[], onClose: () => void, onSave: (p: ProductFormData) => void, isNew: boolean }) => {
  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product as ProductFormData
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants"
  });

  const watchMainImage = useWatch({ name: "main_image", control });
  const watchGallery = useWatch({ name: "gallery", control });
  const watchTags = useWatch({ name: "tags", control });

  return (
    <div className="product-modal fixed inset-0 z-[150] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 35, stiffness: 400 }} className="relative w-full max-w-4xl h-full bg-white shadow-3xl flex flex-col overflow-hidden">
         <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-30">
            <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isNew ? 'Add New Product' : `Edit Product Details`}
               </h3>
               <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{isNew ? 'Initialize Master Record' : `Reference: ${product.id}`}</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all active:scale-95"><X size={24} /></button>
         </div>

         <form onSubmit={handleSubmit(onSave)} className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar pb-32">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <SectionTitle title="Primary Display Image" />
                  <ImageUploader 
                    value={watchMainImage} 
                    onChange={(val) => setValue("main_image", val)} 
                    className="aspect-square"
                  />
                  {errors.main_image && <p className="text-rose-500 text-[10px] font-bold uppercase mt-2">Required Image</p>}
               </div>
               <div className="space-y-4">
                  <GalleryUploader 
                    images={watchGallery} 
                    onChange={(val) => setValue("gallery", val)} 
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-100 pt-10">
               <div className="space-y-6">
                  <SectionTitle title="Product Identity" />
                  <InputField label="Product Name" name="name" register={register} error={errors.name} placeholder="e.g., Premium Canvas Tote" />
                  <InputField label="Reference ID" name="id" register={register} error={errors.id} placeholder="PRD-XXXX" />
                  <div>
                     <label className="text-[11px] font-black uppercase text-slate-500 ml-1 block mb-3">Assigned Category</label>
                     <select 
                        {...register("category")} 
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                     >
                        {categories.map((c: ICategory) => <option key={c.id} value={c.label}>{c.label}</option>)}
                     </select>
                  </div>
               </div>
               <div className="space-y-6">
                  <SectionTitle title="Descriptions & Recommendation" />
                  <TextArea label="Quick Summary" name="short_description" register={register} error={errors.short_description} placeholder="A short catchy line..." />
                  <TextArea label="Main Description" name="long_description" register={register} error={errors.long_description} placeholder="Detailed product info..." />
                  <InputField label="Usage Hint" name="best_for" register={register} error={errors.best_for} placeholder="Recommended for..." />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-100 pt-10">
               <div className="space-y-6">
                  <SectionTitle title="Financials & Constraints" />
                  <div className="grid grid-cols-2 gap-4">
                     <InputField label="Unit Price (₱)" type="number" name="base_price" register={register} error={errors.base_price} rules={{ valueAsNumber: true }} />
                     <InputField label="Unit Cost (₱)" type="number" name="raw_material_cost" register={register} error={errors.raw_material_cost} rules={{ valueAsNumber: true }} />
                  </div>
                  <InputField label="Minimum Order" type="number" name="min_order" register={register} error={errors.min_order} rules={{ valueAsNumber: true }} />
                  <div>
                     <label className="text-[11px] font-black uppercase text-slate-500 ml-1 block mb-3">Printing Requirements</label>
                     <select 
                        {...register("print_method")} 
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                     >
                        {PRINT_METHOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                  </div>
               </div>
               <div className="space-y-6">
                  <SectionTitle title="Supply & Tags" />
                  <div className="grid grid-cols-2 gap-4">
                     <InputField label="Current Stock" type="number" name="current_stock" register={register} error={errors.current_stock} rules={{ valueAsNumber: true }} />
                     <InputField label="Warning Threshold" type="number" name="min_threshold" register={register} error={errors.min_threshold} rules={{ valueAsNumber: true }} />
                  </div>
                  
                  <div className="space-y-4">
                     <label className="text-[11px] font-black uppercase text-slate-500 ml-1 block">Catalog Tags</label>
                     <div className="flex flex-wrap gap-2">
                        {TAG_OPTIONS.map(tag => {
                          const isSelected = watchTags.includes(tag);
                          return (
                            <button 
                              key={tag}
                              type="button"
                              onClick={() => {
                                if (isSelected) setValue("tags", watchTags.filter(t => t !== tag));
                                else setValue("tags", [...watchTags, tag]);
                              }}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-tight transition-all border",
                                isSelected 
                                  ? "bg-slate-900 text-[#75EEA5] border-slate-900 shadow-md" 
                                  : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                              )}
                            >
                               {tag}
                            </button>
                          );
                        })}
                     </div>
                  </div>

                  <div className="flex items-center gap-8 pt-4">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" {...register("is_need_screenplate")} className="w-5 h-5 rounded-lg text-blue-600 border-slate-300 focus:ring-blue-500" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900">Requires Plate</span>
                     </label>
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" {...register("is_need_color")} className="w-5 h-5 rounded-lg text-blue-600 border-slate-300 focus:ring-blue-500" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900">Multi-Channel</span>
                     </label>
                  </div>
               </div>
            </div>

            <div className="space-y-8 border-t border-slate-100 pt-10">
               <SectionTitle title="Product Variants (Sizing & Individual Stock)" />
               <div className="flex flex-col gap-6">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[24px] grid grid-cols-2 gap-4 items-end group shadow-sm relative transition-all hover:bg-white hover:border-blue-200 hover:shadow-xl">
                       <button 
                         type="button"
                         onClick={() => remove(idx)} 
                         className="absolute top-4 right-4 p-2 bg-white text-rose-500 rounded-lg shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                        >
                           <Trash2 size={14} />
                        </button>
                       
                       <div className="col-span-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Variant Size</label>
                          <input 
                            {...register(`variants.${idx}.size`)} 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold uppercase outline-none focus:border-blue-400" 
                          />
                       </div>
                       <div className="col-span-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Price Addon (₱)</label>
                          <input 
                            type="number" 
                            {...register(`variants.${idx}.price`, { valueAsNumber: true })} 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-emerald-600 outline-none focus:border-emerald-400" 
                          />
                       </div>
                       <div className="col-span-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Variant Stock</label>
                          <input 
                            type="number" 
                            {...register(`variants.${idx}.stock`, { valueAsNumber: true })} 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-blue-600 outline-none focus:border-blue-400" 
                          />
                       </div>
                       <div className="col-span-1 flex gap-2">
                          <div className="flex-1">
                             <input 
                                placeholder="W"
                                {...register(`variants.${idx}.width`)} 
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-500 text-center uppercase" 
                             />
                          </div>
                          <div className="flex-1">
                             <input 
                                placeholder="H"
                                {...register(`variants.${idx}.height`)} 
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-500 text-center uppercase" 
                             />
                          </div>
                       </div>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => append({ variant_id: `V-${Date.now()}`, size: 'STANDARD', width: '-', height: '-', price: 0, stock: 0 })} 
                    className="aspect-video border-2 border-dashed border-slate-200 bg-slate-50/20 rounded-[24px] flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all font-black uppercase tracking-widest text-[10px] group"
                  >
                     <Plus size={24} className="mb-2 group-hover:scale-110 transition-transform" /> Add New Variant
                  </button>
               </div>
            </div>
         </form>

         <div className="p-8 border-t border-slate-100 bg-white/95 backdrop-blur-md sticky bottom-0 z-40 flex gap-4">
            <button onClick={onClose} className="px-8 py-5 bg-slate-50 text-slate-900 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Discard Changes</button>
            <button 
               onClick={handleSubmit(onSave)} 
               className="flex-1 bg-slate-900 text-[#75EEA5] font-black py-5 rounded-2xl shadow-xl shadow-slate-900/10 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs"
            >
               Save Product Record
            </button>
         </div>
      </motion.div>
    </div>
  );
};
