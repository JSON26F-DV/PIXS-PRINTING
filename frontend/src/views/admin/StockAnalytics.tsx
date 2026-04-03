import { useState, useEffect, useMemo } from 'react';
import { Package, TrendingUp, Briefcase, AlertCircle } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Toaster } from 'react-hot-toast';

// Data
import productsDataRaw from '../../data/products.json';
import categoriesDataRaw from '../../data/categories.json';

// Subcomponents
import { InventoryAnalyticsSection } from './inventory-sections/InventoryAnalyticsSection';
import { StatCard } from './inventory-sections/UIComponents';
import restockLogsRaw from '../../data/restock_logs.json';
import type { IProduct, ICategory, IRestockLog } from './inventory-sections/types';

export default function StockAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<IProduct[]>(productsDataRaw as IProduct[]);
  const [categories] = useState<ICategory[]>(categoriesDataRaw as ICategory[]);
  const [restockLogs, setRestockLogs] = useState<IRestockLog[]>(restockLogsRaw as IRestockLog[]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const totalStockValue = useMemo(() => 
    products.reduce((acc, p) => acc + (p.current_stock * (p.base_price || 0)), 0), 
  [products]);

  const lowStockCount = useMemo(() => 
    products.filter(p => p.current_stock < (p.min_threshold || 0)).length, 
  [products]);

  const weeklySpend = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return restockLogs
      .filter(l => new Date(l.date) >= weekAgo)
      .reduce((acc, l) => acc + (l.cost || 0), 0);
  }, [restockLogs]);

  const monthlySpend = useMemo(() => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return restockLogs
      .filter(l => new Date(l.date) >= monthAgo)
      .reduce((acc, l) => acc + (l.cost || 0), 0);
  }, [restockLogs]);

  return (
    <div className="StockAnalyticsPage min-h-screen bg-slate-50/50 pb-20 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      <header className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Stock Analytics</h1>
           <p className="text-sm font-medium text-slate-500 mt-1">Real-time inventory telemetry and stock valuation matrix.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {isLoading ? (
             <div className="flex gap-4">
                <Skeleton width={140} height={80} borderRadius={24} />
                <Skeleton width={140} height={80} borderRadius={24} />
                <Skeleton width={140} height={80} borderRadius={24} />
                <Skeleton width={140} height={80} borderRadius={24} />
             </div>
           ) : (
             <>
                <StatCard 
                  label="Catalog Value" 
                  value={`₱${totalStockValue.toLocaleString()}`} 
                  color="emerald" 
                  icon={Package}
                />
                <StatCard 
                  label="Weekly Spend" 
                  value={`₱${weeklySpend.toLocaleString()}`} 
                  color="blue" 
                  icon={TrendingUp}
                />
                <StatCard 
                  label="Monthly Spend" 
                  value={`₱${monthlySpend.toLocaleString()}`} 
                  color="violet" 
                  icon={Briefcase}
                />
                <StatCard 
                  label="Critical Stock" 
                  value={lowStockCount} 
                  color="rose" 
                  isAlert={lowStockCount > 0} 
                  icon={AlertCircle}
                />
             </>
           )}
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 lg:px-8 mt-4">
        {isLoading ? (
          <Skeleton height={600} borderRadius={32} />
        ) : (
          <InventoryAnalyticsSection 
             products={products}
             categories={categories}
             restockLogs={restockLogs}
             setProducts={setProducts}
             setRestockLogs={setRestockLogs}
          />
        )}
      </main>
    </div>
  );
}
