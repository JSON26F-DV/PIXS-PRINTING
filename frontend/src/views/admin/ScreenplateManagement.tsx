import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, Plus, Inbox, Eye } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Toaster } from 'react-hot-toast'

import { getAdminCustomers } from '../../api/customers.api'
import { getAdminProducts } from '../../api/products.api'
import {
  getAdminScreenplates,
  deleteAdminScreenplate,
  getAdminScreenplateRequests,
} from '../../api/admin-screenplates.api'
import { ScreenplateSection } from './inventory-sections/ScreenplateSection'
import { ScreenplateRequestSection } from './inventory-sections/ScreenplateRequestSection'
import { ScreenplateVisibilitySection } from './inventory-sections/ScreenplateVisibilitySection'
import type { IScreenplate, IProduct, IUser, IScreenplateRequest, IVariant } from './inventory-sections/types'

type Tab = 'registry' | 'requests' | 'visibility'

export default function ScreenplateManagement() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('registry')
  
  const [isLoading, setIsLoading] = useState(true)
  const [screenplates, setScreenplates] = useState<IScreenplate[]>([])
  const [requests, setRequests] = useState<IScreenplateRequest[]>([])
  const [customers, setCustomers] = useState<IUser[]>([])
  const [products, setProducts] = useState<IProduct[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [custs, plates, reqs, prods] = await Promise.all([
        getAdminCustomers(),
        getAdminScreenplates(),
        getAdminScreenplateRequests(),
        getAdminProducts()
      ])
      setCustomers(custs)
      setScreenplates(plates)
      setRequests(reqs)
      setProducts(Array.isArray(prods) ? prods : (prods && (prods.data || prods.items)) || [])
    } catch (err) {
      console.error('Failed to load screenplate data', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (id: string) => {
    await deleteAdminScreenplate(id)
    setScreenplates((prev) => prev.filter((p) => p.id !== id))
  }

  const handleUpdateStatus = (id: string, status: string) => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req))
  }

  const handleUpdateProductVisibility = (productId: string, isVisible: boolean) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_need_screenplate: isVisible } : p))
  }

  const handleUpdateVariantVisibility = (productId: string, variantId: string, isVisible: boolean) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const variants = p.variants.map((v: IVariant) => v.variant_id === variantId ? { ...v, is_need_screenplate: isVisible } : v)
      return { ...p, variants }
    }))
  }

  return (
    <div className="ScreenplateManagementPage animate-in fade-in min-h-screen bg-slate-50/50 pb-20 duration-500">
      <Toaster position="top-right" />

      <header className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-4 pt-10 pb-6 md:flex-row md:items-center lg:px-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">
            Screenplate Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage meshes, requests, and product visibility.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/screenplate/manage')}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-[10px] font-black tracking-widest text-[#75EEA5] uppercase shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95"
          >
            <Plus size={16} /> Add New
          </button>
          <div className="rounded-2xl bg-purple-100 p-3 text-purple-600 shadow-lg shadow-purple-200/40">
            <Layers size={28} />
          </div>
        </div>
      </header>

      <main className="mx-auto mt-4 max-w-[1440px] px-4 lg:px-8">
        <div className="mb-8 flex gap-4 overflow-x-auto border-b border-slate-200 pb-px">
          {[
            { id: 'registry', label: 'Registry', icon: <Layers size={16} /> },
            { id: 'requests', label: 'Requests', icon: <Inbox size={16} /> },
            { id: 'visibility', label: 'Visibility', icon: <Eye size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black tracking-widest uppercase transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.label}
              {tab.id === 'requests' && requests.filter(r => r.status === 'Pending').length > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] text-white">
                  {requests.filter(r => r.status === 'Pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Skeleton height={800} borderRadius={32} />
        ) : (
          <div className="mt-8">
            {activeTab === 'registry' && (
              <ScreenplateSection
                customers={customers}
                screenplates={screenplates}
                products={products}
                onDelete={handleDelete}
              />
            )}
            {activeTab === 'requests' && (
              <ScreenplateRequestSection
                requests={requests}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
            {activeTab === 'visibility' && (
              <ScreenplateVisibilitySection
                products={products}
                onProductUpdate={handleUpdateProductVisibility}
                onVariantUpdate={handleUpdateVariantVisibility}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
