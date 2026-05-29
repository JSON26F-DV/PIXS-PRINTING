import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, Plus } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Toaster } from 'react-hot-toast'

import { getAdminCustomers } from '../../api/customers.api'
import {
  getAdminScreenplates,
  deleteAdminScreenplate,
} from '../../api/admin-screenplates.api'
import { ScreenplateSection } from './inventory-sections/ScreenplateSection'
import type { IScreenplate, IProduct, IUser } from './inventory-sections/types'
import productsDataRaw from '../../data/products.json'

export default function ScreenplateManagement() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [screenplates, setScreenplates] = useState<IScreenplate[]>([])
  const [customers, setCustomers] = useState<IUser[]>([])
  const [products] = useState<IProduct[]>(productsDataRaw as IProduct[])

  const fetchData = useCallback(async () => {
    try {
      const [custs, plates] = await Promise.all([
        getAdminCustomers(),
        getAdminScreenplates(),
      ])
      setCustomers(custs)
      setScreenplates(plates)
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

  return (
    <div className="ScreenplateManagementPage animate-in fade-in min-h-screen bg-slate-50/50 pb-20 duration-500">
      <Toaster position="top-right" />

      <header className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-4 pt-10 pb-6 md:flex-row md:items-center lg:px-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">
            Screenplate Registry
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage industrial meshes and product compatibility matrices.
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
        {isLoading ? (
          <Skeleton height={800} borderRadius={32} />
        ) : (
          <ScreenplateSection
            customers={customers}
            screenplates={screenplates}
            products={products}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  )
}
