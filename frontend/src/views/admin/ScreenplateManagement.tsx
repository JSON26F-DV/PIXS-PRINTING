import { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Toaster } from 'react-hot-toast';

// Data
import productsDataRaw from '../../data/products.json';
import screenplateDataRaw from '../../data/screenplate.json';
import usersDataRaw from '../../data/users.json';

// Subcomponents
import { ScreenplateSection } from './inventory-sections/ScreenplateSection';
import type { IProduct, IScreenplate, IUser } from './inventory-sections/types';

export default function ScreenplateManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [products] = useState<IProduct[]>(productsDataRaw as IProduct[]);
  const [screenplates, setScreenplates] = useState<IScreenplate[]>(screenplateDataRaw as unknown as IScreenplate[]);
  const [customers] = useState<IUser[]>(usersDataRaw.customers as unknown as IUser[]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="ScreenplateManagementPage min-h-screen bg-slate-50/50 pb-20 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      <header className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Screenplate Registry</h1>
           <p className="text-sm font-medium text-slate-500 mt-1">Manage industrial meshes and product compatibility matrices.</p>
        </div>
        <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-purple-200/40 shadow-lg">
          <Layers size={28} />
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 lg:px-8 mt-4">
        {isLoading ? (
          <Skeleton height={800} borderRadius={32} />
        ) : (
          <ScreenplateSection 
             customers={customers} 
             screenplates={screenplates} 
             products={products}
             setScreenplates={setScreenplates} 
          />
        )}
      </main>
    </div>
  );
}
