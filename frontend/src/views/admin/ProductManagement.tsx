import { useState, useEffect } from 'react';
import { PackageOpen } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Toaster } from 'react-hot-toast';

// Data
import productsDataRaw from '../../data/products.json';
import categoriesDataRaw from '../../data/categories.json';

// Subcomponents
import { ProductsSection } from './inventory-sections/ProductsSection';
import type { IProduct, ICategory } from './inventory-sections/types';

export default function ProductManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<IProduct[]>(productsDataRaw as IProduct[]);
  const [categories, setCategories] = useState<ICategory[]>(categoriesDataRaw as ICategory[]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="ProductManagementPage min-h-screen bg-slate-50/50 pb-20 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      <header className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Product Catalog</h1>
           <p className="text-sm font-medium text-slate-500 mt-1">Manage global product registry, descriptions and variants.</p>
        </div>
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-blue-200/40 shadow-lg">
          <PackageOpen size={28} />
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 lg:px-8 mt-4">
        {isLoading ? (
          <Skeleton height={800} borderRadius={32} />
        ) : (
          <ProductsSection 
             products={products} 
             categories={categories} 
             setProducts={setProducts} 
             setCategories={setCategories}
          />
        )}
      </main>
    </div>
  );
}
