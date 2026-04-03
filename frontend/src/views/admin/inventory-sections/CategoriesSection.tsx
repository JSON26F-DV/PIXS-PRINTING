import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, ChevronRight, LayoutGrid 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ICategory, IProduct } from './types';
import { 
  InputField, ImageUploader, ConfirmModal 
} from './UIComponents';
import toast from 'react-hot-toast';

interface CategoriesSectionProps {
  categories: ICategory[];
  products: IProduct[];
  setCategories: React.Dispatch<React.SetStateAction<ICategory[]>>;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({ 
  categories, products, setCategories 
}) => {
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(null);

  const handleSave = (cat: ICategory) => {
    if (!cat.label) {
      toast.error("Category name is required.");
      return;
    }

    if (isAdding) {
      if (categories.some(c => c.label.toLowerCase() === cat.label.toLowerCase())) {
        toast.error("Category already exists.");
        return;
      }
      setCategories(prev => [...prev, { ...cat, id: Date.now().toString() }]);
      toast.success("Category added.");
    } else {
      setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
      toast.success("Category updated.");
    }
    setEditingCategory(null);
    setIsAdding(false);
  };

  const handleDelete = () => {
    if (!categoryToDelete) return;
    
    // Safety check: is any product using this category?
    const isUsed = products.some(p => p.category === categoryToDelete.label);
    if (isUsed) {
      toast.error(`Cannot delete "${categoryToDelete.label}". Products are still linked to this category.`);
      setCategoryToDelete(null);
      return;
    }

    setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
    toast.success("Category deleted.");
    setCategoryToDelete(null);
  };

  return (
    <div className="bg-white p-8 border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/40 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
           <LayoutGrid size={22} className="text-blue-600" /> Categories
        </h3>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingCategory({ id: '', label: '', image: 'https://placehold.co/400x400?text=Category+Visual' });
          }}
          className="flex items-center gap-1 text-[11px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 py-2 px-3 rounded-xl transition-all"
        >
          <Plus size={14} /> Add New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-6">
        {categories.map((cat) => (
          <div key={cat.id} className="group p-4 bg-slate-50/50 border border-slate-100 rounded-[20px] flex items-center gap-4 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-300">
             <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-slate-200 flex-shrink-0">
                <img src={cat.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={cat.label} />
             </div>
             <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 leading-tight truncate uppercase tracking-tight">{cat.label}</p>
                <p className="text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">
                   {products.filter(p => p.category === cat.label).length} Products
                </p>
             </div>
             <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingCategory(cat)} className="p-2.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-100 rounded-xl shadow-sm transition-all hover:border-blue-200"><Edit size={14} /></button>
                <button onClick={() => setCategoryToDelete(cat)} className="p-2.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-100 rounded-xl shadow-sm transition-all hover:border-rose-200"><Trash2 size={14} /></button>
             </div>
             <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-300 transition-colors" />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingCategory(null)} />
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 space-y-6">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                   {isAdding ? 'Add Category' : 'Modify Category'}
                </h4>
                
                <div className="space-y-6">
                   <InputField label="Category Label" value={editingCategory.label} onChange={(v: string) => setEditingCategory({ ...editingCategory, label: v })} placeholder="e.g., T-Shirts" />
                   <div>
                      <p className="text-[11px] font-black uppercase text-slate-500 mb-3 ml-1">Visual Preview</p>
                      <ImageUploader 
                        value={editingCategory.image || ''} 
                        onChange={(v: string) => setEditingCategory({ ...editingCategory, image: v })} 
                        className="aspect-video"
                      />
                   </div>
                </div>

                <div className="flex gap-3 pt-2">
                   <button onClick={() => setEditingCategory(null)} className="flex-1 py-4 bg-slate-50 text-slate-900 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                   <button onClick={() => handleSave(editingCategory)} className="flex-1 py-4 bg-slate-900 text-[#75EEA5] rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl hover:-translate-y-1 transition-all">Save Changes</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {categoryToDelete && (
        <ConfirmModal 
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Category?"
          message={`Are you sure you want to permanently delete "${categoryToDelete.label}" from the product matrix?`}
        />
      )}
    </div>
  );
};
