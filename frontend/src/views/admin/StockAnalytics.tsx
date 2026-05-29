import { useMemo } from 'react'
import { Package, TrendingUp, Briefcase, AlertCircle } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Toaster } from 'react-hot-toast'

// Subcomponents
import { InventoryAnalyticsSection } from './inventory-sections/InventoryAnalyticsSection'
import { StatCard } from './inventory-sections/UIComponents'
import { useStockAnalytics } from '../../hooks/useStockAnalytics'

export default function StockAnalytics() {
  const {
    products,
    setProducts,
    expenditures,
    isLoading,
    addExpenditure,
    updateExpenditure,
    deleteExpenditure,
  } = useStockAnalytics()

  const catalogValue = useMemo(
    () => expenditures.reduce((acc: number, exp) => acc + Number(exp.amount), 0),
    [expenditures],
  )

  const weeklySpend = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return expenditures
      .filter((exp) => new Date(exp.created_at) >= weekAgo)
      .reduce((acc: number, exp) => acc + Number(exp.amount), 0)
  }, [expenditures])

  const monthlySpend = useMemo(() => {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return expenditures
      .filter((exp) => new Date(exp.created_at) >= monthAgo)
      .reduce((acc: number, exp) => acc + Number(exp.amount), 0)
  }, [expenditures])

  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      if (!p.variants || p.variants.length === 0) {
        // @ts-expect-error fallback if missing properties
        return (p.current_stock || 0) < (p.min_threshold || 0)
      }
      return p.variants.some((v) => v.stock < (p.min_threshold || 0))
    }).length
  }, [products])

  return (
    <div className="StockAnalyticsPage animate-in fade-in min-h-screen bg-slate-50/50 pb-20 duration-500">
      <Toaster position="top-right" />

      <header className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-4 pt-10 pb-6 md:flex-row md:items-center lg:px-8">
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">
            Stock Analytics
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Real-time inventory telemetry and stock valuation matrix.
          </p>
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
                value={`₱${catalogValue.toLocaleString()}`}
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

      <main className="mx-auto mt-4 max-w-[1440px] px-4 lg:px-8">
        {isLoading ? (
          <Skeleton height={600} borderRadius={32} />
        ) : (
          <InventoryAnalyticsSection
            products={products}
            expenditures={expenditures}
            setProducts={setProducts}
            addExpenditure={addExpenditure}
            updateExpenditure={updateExpenditure}
            deleteExpenditure={deleteExpenditure}
          />
        )}
      </main>
    </div>
  )
}
