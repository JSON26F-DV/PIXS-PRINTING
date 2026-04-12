import { useState, useEffect } from 'react'
import { PackageOpen, AlertCircle, RefreshCcw } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Toaster } from 'react-hot-toast'

// Data
import productsDataRaw from '../../data/products.json'
import categoriesDataRaw from '../../data/categories.json'

// Subcomponents
import { ProductsSection } from './inventory-sections/ProductsSection'
import { TechnicianAssignmentSection } from './inventory-sections/TechnicianAssignmentSection'
import type { IProduct, ICategory } from './inventory-sections/types'
import { SafeTerminal } from '../../utils/safeTerminal'
import ErrorBoundary from '../../components/common/ErrorBoundary'

function ProductManagementContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [products, setProducts] = useState<IProduct[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])

  const initializeData = () => {
    try {
      setIsLoading(true)
      setLoadError(false)

      const safeProducts = SafeTerminal.array<IProduct>(productsDataRaw)
      const safeCategories = SafeTerminal.array<ICategory>(categoriesDataRaw)

      if (
        safeProducts.length === 0 &&
        Array.isArray(productsDataRaw) &&
        productsDataRaw.length > 0
      ) {
        throw new Error('Product Data Corrupted')
      }

      setProducts(safeProducts)
      setCategories(safeCategories)
    } catch (e) {
      console.error('Product Load Failed:', e)
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initializeData()
  }, [])

  if (loadError) {
    return (
      <div className="admin-message-error flex h-[calc(100vh-140px)] flex-col items-center justify-center rounded-[32px] bg-white p-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
          <AlertCircle className="text-rose-500" size={40} />
        </div>
        <h2 className="mb-2 text-2xl font-black tracking-tight tracking-widest text-slate-900 uppercase">
          Catalog Sync Failed
        </h2>
        <p className="mb-8 max-w-[320px] leading-relaxed font-bold text-slate-400">
          The product registry projection is corrupted or inaccessible. Please
          reinitialize the terminal.
        </p>
        <button
          onClick={initializeData}
          className="admin-message-retry flex items-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
        >
          <RefreshCcw size={18} />
          Retry Sync
        </button>
      </div>
    )
  }

  return (
    <div className="ProductManagementPage animate-in fade-in min-h-screen bg-slate-50/50 pb-20 duration-500">
      <Toaster position="top-right" />

      <header className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-4 pt-10 pb-6 md:flex-row md:items-center lg:px-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">
            Product Catalog
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage global product registry, descriptions and variants.
          </p>
        </div>
        <div className="rounded-2xl bg-blue-100 p-3 text-blue-600 shadow-lg shadow-blue-200/40">
          <PackageOpen size={28} />
        </div>
      </header>

      <main className="mx-auto mt-4 max-w-[1440px] px-4 lg:px-8">
        {isLoading ? (
          <Skeleton height={800} borderRadius={32} />
        ) : products.length === 0 ? (
          <div className="admin-message-empty rounded-[48px] border-2 border-dashed border-slate-100 bg-white p-20 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
              <PackageOpen className="text-slate-300" size={40} />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tight text-slate-900 uppercase">
              Empty Inventory Terminal
            </h3>
            <p className="mx-auto max-w-[300px] text-sm leading-relaxed font-bold text-slate-400">
              No product projections found. Initialize your first product to
              begin the audit trail.
            </p>
          </div>
        ) : (
          <>
            <ProductsSection
              products={products}
              categories={categories}
              setProducts={setProducts}
              setCategories={setCategories}
            />
            <TechnicianAssignmentSection categories={categories} />
          </>
        )}
      </main>
    </div>
  )
}

export default function ProductManagement() {
  return (
    <ErrorBoundary>
      <ProductManagementContent />
    </ErrorBoundary>
  )
}
