import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Edit, Trash2, X, Package2, AlertTriangle } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import debounce from 'lodash/debounce'
import toast from 'react-hot-toast'
import type { IProduct, ICategory } from './types'
import { TAG_OPTIONS, PRINT_METHOD_OPTIONS } from './constants'
import {
  InputField,
  TextArea,
  ImageUploader,
  GalleryUploader,
  SectionTitle,
} from './UIComponents'
import { CategoriesSection } from './CategoriesSection'
import BoxFallback from '../../../components/common/BoxFallback'
import axiosInstance from '../../../lib/axiosInstance'

const ProductImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [error, setError] = useState(false)
  if (error || !src) {
    return <BoxFallback className={cn("flex items-center justify-center bg-slate-100", className)} iconClassName="h-6 w-6 opacity-30" />
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />
}

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

const productSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  short_description: z.string().min(1, 'Short description is required'),
  long_description: z.string().min(1, 'Main description is required'),
  best_for: z.string().min(1, 'Usage recommendation is required'),
  base_price: z.number().min(0, 'Invalid price'),
  raw_material_cost: z.number().min(0, 'Invalid cost'),
  current_stock: z.number().min(0, 'Invalid stock volume'),
  min_threshold: z.number().min(0, 'Invalid safety threshold'),
  min_order: z.number().min(1, 'Invalid minimum order'),
  main_image: z.string().min(1, 'Main image is required'),
  gallery: z.array(z.string()),
  print_method: z.string().min(1, 'Print method is required'),
  tags: z.array(z.string()),
  is_need_screenplate: z.boolean(),
  is_need_color: z.boolean(),
  variants: z.array(
    z.object({
      variant_id: z.string(),
      size: z.string().min(1, 'Size label is required'),
      width: z.string(),
      height: z.string(),
      price: z.number().min(0),
      stock: z.number().min(0),
    }),
  ),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductsSectionProps {
  products: IProduct[]
  categories: ICategory[]
  setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>
  setCategories: React.Dispatch<React.SetStateAction<ICategory[]>>
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
  categories,
  setProducts,
  setCategories,
}) => {
  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [productToDelete, setProductToDelete] = useState<IProduct | null>(null)
  const [selectedMobileProduct, setSelectedMobileProduct] = useState<IProduct | null>(null)
  const navigate = useNavigate()

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const itemsPerPage = 10

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((val: string) => setSearch(val), 200),
    [],
  )

  const handleSearchChange = (val: string) => {
    setLocalSearch(val)
    debouncedSearch(val)
  }

  const filteredProducts = useMemo(() => {
    let result = products
    
    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => {
        const cat = p.category_label || p.category || ''
        return cat.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
      })
    }
    
    // Search filter
    if (search) {
      result = result.filter((p) => {
        const cat = p.category_label || p.category || ''
        return (
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toLowerCase().includes(search.toLowerCase()) ||
          cat.toLowerCase().includes(search.toLowerCase())
        )
      })
    }
    
    return result
  }, [products, search, selectedCategory])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, search])

  const handleSaveProduct = (data: ProductFormData) => {
    const formattedData = {
      ...data,
      category_label: data.category,
    } as IProduct

    if (isAddingProduct) {
      if (products.some((p) => p.id === data.id)) {
        toast.error('An asset with this ID already exists.')
        return
      }
      setProducts((prev) => [...prev, formattedData])
      toast.success('Product added to catalog.')
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === data.id ? formattedData : p)),
      )
      toast.success('Product details updated.')
    }
    setEditingProduct(null)
    setIsAddingProduct(false)
  }

  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [deleteCounts, setDeleteCounts] = useState<{
    gallery_count: number
    variants_count: number
    tags_count: number
    reviews_count: number
  } | null>(null)

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    setIsDeletingProduct(true)
    try {
      await axiosInstance.delete(`/api/admin/products/${productToDelete.id}`)
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      toast.success('Product and all related data deleted.')
      setProductToDelete(null)
      setDeleteCounts(null)
    } catch (e) {
      toast.error('Failed to delete product from server.')
      console.error(e)
    } finally {
      setIsDeletingProduct(false)
    }
  }

  const handleShowDeleteModal = async (product: IProduct) => {
    setProductToDelete(product)
    setDeleteCounts(null)
    try {
      const res = await axiosInstance.get(`/api/admin/products/${product.id}/delete-info`)
      setDeleteCounts(res.data.data)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <section id="products" className="space-y-8 border-t border-slate-100">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4"></div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="flex flex-col gap-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50 md:flex-row">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs font-bold text-slate-700 transition-all outline-none focus:ring-2 focus:ring-slate-100 focus:border-blue-300 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.label}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search
                className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-300"
                size={18}
              />
              <input
                type="text"
                placeholder="Search products by identity prefix or name..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pr-6 pl-12 text-xs font-bold tracking-tight text-slate-900 uppercase transition-all outline-none placeholder:text-slate-300 focus:border-blue-300"
              />
            </div>
          </div>

          <div className="flex h-[700px] flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
            <div className="custom-scrollbar flex-1 overflow-y-auto">
              <table className="w-full border-collapse text-left hidden md:table">
                <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-md">
                  <tr className="border-b border-slate-50 bg-slate-50/30">
                    <th className="px-8 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      General Reference
                    </th>
                    <th className="px-8 py-5 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Total Sold
                    </th>
                    <th className="px-8 py-5 pr-12 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => (
                    <tr
                      key={p.id}
                      className="group border-b border-slate-50 transition-all hover:bg-slate-50/50"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md">
                            <ProductImage
                              src={`/public/images/products/${p.main_image}`}
                              alt={p.name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <div>
                            <p className="font-bold tracking-tight text-slate-900 uppercase italic transition-colors group-hover:text-blue-600">
                              {p.name}
                            </p>
                            <p className="mt-0.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              {p.id} • {p.category_label || p.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="rounded-lg border px-3 py-1.5 text-[9px] font-black tracking-tighter tracking-widest uppercase shadow-sm border-blue-100 bg-blue-50 text-blue-600">
                          {p.total_sold || 0} sold
                        </span>
                      </td>
                      <td className="space-x-2 px-8 py-6 pr-12 text-right">
                        <button
                          onClick={() => navigate(`/admin/product/manage/${p.id}`)}
                          className="rounded-xl border border-slate-100 bg-white p-3 text-slate-400 shadow-sm transition-all hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleShowDeleteModal(p)}
                          className="rounded-xl border border-slate-100 bg-white p-3 text-slate-400 shadow-sm transition-all hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile View: Cards Layout */}
              <div className="grid grid-cols-1 gap-4 p-6 md:hidden">
                {paginatedProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedMobileProduct(p)}
                    className="group relative flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50/30 p-5 transition-all hover:bg-slate-50 cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md animate-in fade-in duration-300">
                        <ProductImage
                          src={`/public/images/products/${p.main_image}`}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-900 uppercase italic truncate text-sm">
                          {p.name}
                        </h4>
                        <p className="mt-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase truncate">
                          {p.id} • {p.category_label || p.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100/50 pt-3">
                      <span className="rounded-lg border px-2.5 py-1 text-[8px] font-black tracking-widest uppercase shadow-sm border-blue-100 bg-blue-50 text-blue-600">
                        {p.total_sold || 0} sold
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                        Tap to view details
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center p-24 text-center opacity-30">
                  <Package2 size={80} className="mb-4 text-slate-300" />
                  <p className="text-xl font-black tracking-tight uppercase">
                    Registry Placeholder Empty
                  </p>
                </div>
              )}
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-white">
              <span className="text-xs text-slate-400">
                Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-all"
                >
                  Prev
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      page === currentPage 
                        ? 'bg-slate-950 text-white shadow-sm' 
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col space-y-8 lg:col-span-4">
          <button
            onClick={() => navigate('/admin/product/manage')}
            className="flex items-center gap-3 rounded-[32px] bg-slate-900 px-10 py-8 text-xs font-black tracking-widest text-[#75EEA5] uppercase shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95"
          >
            <Plus size={18} /> Add New Product
          </button>
          {/* SIDEBAR CATEGORIES */}
          <CategoriesSection
            categories={categories}
            products={products}
            setCategories={setCategories}
          />
        </div>
      </div>

      <AnimatePresence>
        {editingProduct && (
          <ProductModal
            product={editingProduct}
            categories={categories}
            isNew={isAddingProduct}
            onClose={() => {
              setEditingProduct(null)
              setIsAddingProduct(false)
            }}
            onSave={handleSaveProduct}
          />
        )}
        {productToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setProductToDelete(null)}
            />
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md space-y-6 rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="flex items-start gap-4 text-rose-600">
                <div className="rounded-2xl bg-rose-50 p-3">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight">Delete Product?</h4>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Permanently delete <span className="text-slate-900">&quot;{productToDelete.name}&quot;</span> and ALL related data:
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-rose-50/50 p-4">
                <p className="text-[11px] font-black tracking-widest text-rose-700 uppercase">Tables affected</p>
                <div className="space-y-1.5 text-sm font-semibold text-slate-600">
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-[10px] font-black text-rose-700">P</span>
                    <span>products</span>
                    <span className="ml-auto text-[10px] font-black tracking-widest text-rose-500 uppercase">1 Record</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-[10px] font-black text-amber-700">G</span>
                    <span>product_gallery</span>
                    <span className="ml-auto text-[10px] font-black tracking-widest text-amber-500 uppercase">{deleteCounts?.gallery_count ?? '...'} Images</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-[10px] font-black text-blue-700">V</span>
                    <span>product_variants</span>
                    <span className="ml-auto text-[10px] font-black tracking-widest text-blue-500 uppercase">{deleteCounts?.variants_count ?? '...'} Variants</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-[10px] font-black text-purple-700">T</span>
                    <span>product_tags</span>
                    <span className="ml-auto text-[10px] font-black tracking-widest text-purple-500 uppercase">{deleteCounts?.tags_count ?? '...'} Tags</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-[10px] font-black text-emerald-700">R</span>
                    <span>product_reviews</span>
                    <span className="ml-auto text-[10px] font-black tracking-widest text-emerald-500 uppercase">{deleteCounts?.reviews_count ?? '...'} Reviews</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-bold leading-relaxed text-slate-400">
                This action cannot be undone. All related files (images) will also be permanently deleted.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 rounded-xl bg-slate-50 py-4 text-xs font-bold tracking-widest text-slate-900 uppercase transition-all hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isDeletingProduct}
                  className="flex-1 rounded-xl bg-rose-600 py-4 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-rose-200 transition-all hover:-translate-y-1 disabled:opacity-50"
                >
                  {isDeletingProduct ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </m.div>
          </div>
        )}

        {/* Mobile Detail Modal Overlay */}
        {selectedMobileProduct && (
          <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setSelectedMobileProduct(null)}
            />
            <m.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-xl max-h-[85vh] overflow-hidden rounded-t-[32px] sm:rounded-3xl bg-white shadow-2xl flex flex-col"
            >
              <div className="sticky top-0 z-20 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Product Details</h3>
                  <p className="text-[10px] font-bold text-slate-400">ID: {selectedMobileProduct.id}</p>
                </div>
                <button
                  onClick={() => setSelectedMobileProduct(null)}
                  className="rounded-full bg-slate-100 p-2 text-slate-400 transition-colors hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="flex flex-col gap-4">
                  <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                    <ProductImage
                      src={`/public/images/products/${selectedMobileProduct.main_image}`}
                      alt={selectedMobileProduct.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase italic leading-none">{selectedMobileProduct.name}</h4>
                    <p className="mt-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {selectedMobileProduct.category} • Print: {selectedMobileProduct.print_method || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  <div>
                    <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Base Price</p>
                    <p className="text-sm font-black text-slate-900">₱{selectedMobileProduct.base_price?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Raw Cost</p>
                    <p className="text-sm font-black text-emerald-600">₱{selectedMobileProduct.raw_material_cost?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                  <div>
                    <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Current Stock</p>
                    <p className="text-xs font-bold text-slate-900">{selectedMobileProduct.current_stock ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Min Threshold</p>
                    <p className="text-xs font-bold text-amber-600">{selectedMobileProduct.min_threshold ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Min Order</p>
                    <p className="text-xs font-bold text-blue-600">{selectedMobileProduct.min_order ?? 1} Units</p>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-4 space-y-2">
                  <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Quick Summary</p>
                  <p className="text-xs font-bold leading-relaxed text-slate-600">{selectedMobileProduct.short_description || 'No description available.'}</p>
                </div>

                <div className="border-t border-slate-50 pt-4 space-y-2">
                  <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Full Description</p>
                  <p className="text-xs leading-relaxed text-slate-600">{selectedMobileProduct.long_description || 'No long description provided.'}</p>
                </div>

                <div className="border-t border-slate-50 pt-4 space-y-2">
                  <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Best For</p>
                  <p className="text-xs font-bold text-slate-700 italic">"{selectedMobileProduct.best_for || 'N/A'}"</p>
                </div>

                {selectedMobileProduct.tags && selectedMobileProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-slate-50 pt-4">
                    {selectedMobileProduct.tags.map((t) => (
                      <span key={t} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[8px] font-black tracking-widest text-slate-500 uppercase">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-6 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-3.5 w-3.5 rounded-full border", selectedMobileProduct.is_need_screenplate ? "bg-emerald-500 border-emerald-600" : "bg-slate-200 border-slate-300")} />
                    <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Requires Plate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-3.5 w-3.5 rounded-full border", selectedMobileProduct.is_need_color ? "bg-emerald-500 border-emerald-600" : "bg-slate-200 border-slate-300")} />
                    <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Multi-Color</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50/50">
                <button
                  onClick={() => {
                    const p = selectedMobileProduct
                    setSelectedMobileProduct(null)
                    navigate(`/admin/product/manage/${p.id}`)
                  }}
                  className="flex-1 rounded-xl bg-slate-900 py-4 text-[10px] font-black tracking-widest text-[#75EEA5] uppercase italic shadow-xl transition-all hover:bg-slate-800"
                >
                  Edit Product
                </button>
                <button
                  onClick={() => {
                    const p = selectedMobileProduct
                    setSelectedMobileProduct(null)
                    handleShowDeleteModal(p)
                  }}
                  className="flex-1 rounded-xl bg-rose-600 py-4 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl transition-all hover:bg-rose-700"
                >
                  Delete Product
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

// PRODUCT MODAL COMPONENT
const ProductModal = ({
  product,
  categories,
  onClose,
  onSave,
  isNew,
}: {
  product: IProduct
  categories: ICategory[]
  onClose: () => void
  onSave: (p: ProductFormData) => void
  isNew: boolean
}) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product as ProductFormData,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  })

  const watchMainImage = useWatch({ name: 'main_image', control })
  const watchGallery = useWatch({ name: 'gallery', control })
  const watchTags = useWatch({ name: 'tags', control })

  return (
    <div className="product-modal fixed inset-0 z-[150] flex justify-end">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      <m.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 35, stiffness: 400 }}
        className="shadow-3xl relative flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white"
      >
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 p-8 backdrop-blur-md">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              {isNew ? 'Add New Product' : `Edit Product Details`}
            </h3>
            <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              {isNew ? 'Initialize Master Record' : `Reference: ${product.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-3 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSave)}
          className="custom-scrollbar flex-1 space-y-12 overflow-y-auto p-10 pb-32"
        >
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="space-y-4">
              <SectionTitle title="Primary Display Image" />
              <ImageUploader
                value={watchMainImage}
                onChange={(val) => setValue('main_image', val)}
                className="aspect-square"
                pathPrefix="/public/images/products/"
              />
              {errors.main_image && (
                <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase">
                  Required Image
                </p>
              )}
            </div>
            <div className="space-y-4">
              <GalleryUploader
                images={watchGallery}
                onChange={(val) => setValue('gallery', val)}
                pathPrefix="/public/images/products_gallery/"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 border-t border-slate-100 pt-10 md:grid-cols-2">
            <div className="space-y-6">
              <SectionTitle title="Product Identity" />
              <InputField
                label="Product Name"
                name="name"
                register={register}
                error={errors.name}
                placeholder="e.g., Premium Canvas Tote"
              />
              <InputField
                label="Reference ID"
                name="id"
                register={register}
                error={errors.id}
                placeholder="PRD-XXXX"
              />
              <div>
                <label className="mb-3 ml-1 block text-[11px] font-black text-slate-500 uppercase">
                  Assigned Category
                </label>
                <select
                  {...register('category')}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 transition-all outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5"
                >
                  {categories.map((c: ICategory) => (
                    <option key={c.id} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-6">
              <SectionTitle title="Descriptions & Recommendation" />
              <TextArea
                label="Quick Summary"
                name="short_description"
                register={register}
                error={errors.short_description}
                placeholder="A short catchy line..."
              />
              <TextArea
                label="Main Description"
                name="long_description"
                register={register}
                error={errors.long_description}
                placeholder="Detailed product info..."
              />
              <InputField
                label="Usage Hint"
                name="best_for"
                register={register}
                error={errors.best_for}
                placeholder="Recommended for..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 border-t border-slate-100 pt-10 md:grid-cols-2">
            <div className="space-y-6">
              <SectionTitle title="Financials & Constraints" />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Unit Price (₱)"
                  type="number"
                  name="base_price"
                  register={register}
                  error={errors.base_price}
                  rules={{ valueAsNumber: true }}
                />
                <InputField
                  label="Unit Cost (₱)"
                  type="number"
                  name="raw_material_cost"
                  register={register}
                  error={errors.raw_material_cost}
                  rules={{ valueAsNumber: true }}
                />
              </div>
              <InputField
                label="Minimum Order"
                type="number"
                name="min_order"
                register={register}
                error={errors.min_order}
                rules={{ valueAsNumber: true }}
              />
              <div>
                <label className="mb-3 ml-1 block text-[11px] font-black text-slate-500 uppercase">
                  Printing Requirements
                </label>
                <select
                  {...register('print_method')}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 transition-all outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5"
                >
                  {PRINT_METHOD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-6">
              <SectionTitle title="Supply & Tags" />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Current Stock"
                  type="number"
                  name="current_stock"
                  register={register}
                  error={errors.current_stock}
                  rules={{ valueAsNumber: true }}
                />
                <InputField
                  label="Warning Threshold"
                  type="number"
                  name="min_threshold"
                  register={register}
                  error={errors.min_threshold}
                  rules={{ valueAsNumber: true }}
                />
              </div>

              <div className="space-y-4">
                <label className="ml-1 block text-[11px] font-black text-slate-500 uppercase">
                  Catalog Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => {
                    const isSelected = watchTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected)
                            setValue(
                              'tags',
                              watchTags.filter((t) => t !== tag),
                            )
                          else setValue('tags', [...watchTags, tag])
                        }}
                        className={cn(
                          'rounded-xl border px-4 py-2 text-[9px] font-bold tracking-tight uppercase transition-all',
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-[#75EEA5] shadow-md'
                            : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300',
                        )}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    {...register('is_need_screenplate')}
                    className="h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase group-hover:text-slate-900">
                    Requires Plate
                  </span>
                </label>
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    {...register('is_need_color')}
                    className="h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase group-hover:text-slate-900">
                    Multi-Channel
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-8 border-t border-slate-100 pt-10">
            <SectionTitle title="Product Variants (Sizing & Individual Stock)" />
            <div className="flex flex-col gap-6">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="group relative grid grid-cols-2 items-end gap-4 rounded-[24px] border border-slate-100 bg-slate-50/50 p-6 shadow-sm transition-all hover:border-blue-200 hover:bg-white hover:shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="absolute top-4 right-4 rounded-lg border border-slate-200 bg-white p-2 text-rose-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-rose-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="col-span-1">
                    <label className="mb-1 block text-[9px] font-black text-slate-400 uppercase">
                      Variant Size
                    </label>
                    <input
                      {...register(`variants.${idx}.size`)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="mb-1 block text-[9px] font-black text-slate-400 uppercase">
                      Price Addon (₱)
                    </label>
                    <input
                      type="number"
                      {...register(`variants.${idx}.price`, {
                        valueAsNumber: true,
                      })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-emerald-600 outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="mb-1 block text-[9px] font-black text-slate-400 uppercase">
                      Variant Stock
                    </label>
                    <input
                      type="number"
                      {...register(`variants.${idx}.stock`, {
                        valueAsNumber: true,
                      })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-blue-600 outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-1 flex gap-2">
                    <div className="flex-1">
                      <input
                        placeholder="W"
                        {...register(`variants.${idx}.width`)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-[10px] font-bold text-slate-500 uppercase"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        placeholder="H"
                        {...register(`variants.${idx}.height`)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-[10px] font-bold text-slate-500 uppercase"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  append({
                    variant_id: `V-${Date.now()}`,
                    size: 'STANDARD',
                    width: '-',
                    height: '-',
                    price: 0,
                    stock: 0,
                  })
                }
                className="group flex aspect-video flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/20 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-all hover:border-blue-400 hover:text-blue-600"
              >
                <Plus
                  size={24}
                  className="mb-2 transition-transform group-hover:scale-110"
                />{' '}
                Add New Variant
              </button>
            </div>
          </div>
        </form>

        <div className="sticky bottom-0 z-40 flex gap-4 border-t border-slate-100 bg-white/95 p-8 backdrop-blur-md">
          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-50 px-8 py-5 text-xs font-bold tracking-widest text-slate-900 uppercase transition-all hover:bg-slate-100"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSubmit(onSave)}
            className="flex-1 rounded-2xl bg-slate-900 py-5 text-xs font-black tracking-widest text-[#75EEA5] uppercase shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-1"
          >
            Save Product Record
          </button>
        </div>
      </m.div>
    </div>
  )
}
