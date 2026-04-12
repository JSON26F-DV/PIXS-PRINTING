import { useState, useEffect } from 'react'
import { Layers } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Toaster } from 'react-hot-toast'

// Data
import productsDataRaw from '../../data/products.json'
import screenplateDataRaw from '../../data/screenplate.json'
import usersDataRaw from '../../data/users.json'

// Subcomponents
import { ScreenplateSection } from './inventory-sections/ScreenplateSection'
import type { IProduct, IScreenplate, IUser } from './inventory-sections/types'

export default function ScreenplateManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [products] = useState<IProduct[]>(productsDataRaw as IProduct[])
  const [screenplates, setScreenplates] = useState<IScreenplate[]>(
    screenplateDataRaw as unknown as IScreenplate[],
  )
  const [customers] = useState<IUser[]>(
    usersDataRaw.customers as unknown as IUser[],
  )

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

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
        <div className="rounded-2xl bg-purple-100 p-3 text-purple-600 shadow-lg shadow-purple-200/40">
          <Layers size={28} />
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
            setScreenplates={setScreenplates}
          />
        )}
      </main>
    </div>
  )
}
