import { useState, useEffect } from 'react';
import { PackageOpen, AlertCircle, RefreshCcw } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Toaster } from 'react-hot-toast';

// Data
import productsDataRaw from '../../data/products.json';
import categoriesDataRaw from '../../data/categories.json';

// Subcomponents
import { ProductsSection } from './inventory-sections/ProductsSection';
import type { IProduct, ICategory } from './inventory-sections/types';
import { SafeTerminal } from '../../utils/safeTerminal';
import ErrorBoundary from '../../components/common/ErrorBoundary';

function ProductManagementContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);

  const initializeData = () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      
      const safeProducts = SafeTerminal.array<IProduct>(productsDataRaw);
      const safeCategories = SafeTerminal.array<ICategory>(categoriesDataRaw);
      
      if (safeProducts.length === 0 && Array.isArray(productsDataRaw) && productsDataRaw.length > 0) {
          throw new Error("Product Data Corrupted");
      }

      setProducts(safeProducts);
      setCategories(safeCategories);
    } catch (e) {
      console.error("Product Load Failed:", e);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  if (loadError) {
    return (
      <div className="admin-message-error h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white rounded-[32px] p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
          <AlertCircle className="text-rose-500" size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase tracking-widest">Catalog Sync Failed</h2>
        <p className="text-slate-400 font-bold max-w-[320px] mb-8 leading-relaxed">
          The product registry projection is corrupted or inaccessible. Please reinitialize the terminal.
        </p>
        <button 
          onClick={initializeData}
          className="admin-message-retry flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
        >
          <RefreshCcw size={18} />
          Retry Sync
        </button>
      </div>
    );
  }

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
        ) : products.length === 0 ? (
          <div className="admin-message-empty bg-white p-20 rounded-[48px] text-center border-2 border-dashed border-slate-100 shadow-2xl">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <PackageOpen className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Empty Inventory Terminal</h3>
            <p className="text-slate-400 font-bold max-w-[300px] mx-auto text-sm leading-relaxed">
              No product projections found. Initialize your first product to begin the audit trail.
            </p>
          </div>
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

export default function ProductManagement() {
  return (
    <ErrorBoundary>
      <ProductManagementContent />
    </ErrorBoundary>
  );
}
