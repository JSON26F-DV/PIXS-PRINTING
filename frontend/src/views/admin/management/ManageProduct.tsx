import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../../../lib/axiosInstance'
import type { ICategory } from '../../../types/product.types'
import BoxFallback from '../../../components/common/BoxFallback'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Schema ──────────────────────────────────────────────────────────────────

const productSchema = z.object({
  id: z.string().max(10).optional().or(z.literal('')),
  name: z.string().min(1, 'Product name is required'),
  category_id: z.string().min(1, 'Category is required'),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  best_for: z.string().optional(),
  base_price: z.number().min(0, 'Base price must be positive'),
  raw_material_cost: z.number().min(0, 'Cost must be positive'),
  min_threshold: z.number().min(0, 'Threshold must be positive'),
  min_order: z.number().min(1, 'Min order must be at least 1'),
  print_method: z.string().optional(),
  is_need_screenplate: z.boolean(),
  is_need_color: z.boolean(),
  is_in_stock: z.boolean(),
  ratings: z.number().min(0).max(5),
  total_sold: z.number().min(0),
})

type FormData = z.infer<typeof productSchema>

// ─── Gallery Image Type ──────────────────────────────────────────────────────

interface IGalleryImage {
  id?: number
  image_url: string
  preview?: string
  sort_order: number
  isNew?: boolean
  file?: File // Store File object for new images
}

// ─── Product Tag Type ────────────────────────────────────────────────────────

interface IProductTag {
  id?: number
  tag: string
  isNew?: boolean
}

// ─── Product Variant Type ──────────────────────────────────────────────────

interface IProductVariant {
  id?: number
  variant_id: string
  size: string
  width: string
  height: string
  price: number
  stock: number
  isNew?: boolean
}

const Field: React.FC<{
  label: string
  error?: string
  children: React.ReactNode
  hint?: string
}> = ({ label, error, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
      {label}
    </label>
    {children}
    {hint && !error && (
      <p className="text-[10px] text-slate-400">{hint}</p>
    )}
    {error && (
      <p className="text-[10px] font-bold text-rose-500">{error}</p>
    )}
  </div>
)

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/8'

const selectCls =
  'w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/8'

// ─── Main Component ──────────────────────────────────────────────────────────

const ManageProduct: React.FC = () => {
  const { product_id } = useParams<{ product_id?: string }>()
  const navigate = useNavigate()
  const isNew = !product_id

  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])

  const [mainImagePreview, setMainImagePreview] = useState<string>('')
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [mainImageError, setMainImageError] = useState(false)

  // Gallery State
  const [galleryImages, setGalleryImages] = useState<IGalleryImage[]>([])
  const [draggedImage, setDraggedImage] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  // Tags State
  const [tags, setTags] = useState<IProductTag[]>([])
  const [newTagInput, setNewTagInput] = useState('')

  // Variants State
  const [variants, setVariants] = useState<IProductVariant[]>([])
  const [newVariant, setNewVariant] = useState<IProductVariant>({
    variant_id: '',
    size: '',
    width: '',
    height: '',
    price: 0,
    stock: 0,
    isNew: true
  })

  const getApiErrorMessage = (error: unknown) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as Record<string, unknown>).response === 'object' &&
      (error as Record<string, unknown>).response !== null
    ) {
      const response = (error as Record<string, unknown>).response as Record<string, unknown>
      if (
        'data' in response &&
        typeof response.data === 'object' &&
        response.data !== null &&
        'message' in response.data &&
        typeof (response.data as Record<string, unknown>).message === 'string'
      ) {
        return (response.data as { message: string }).message
      }
    }

    if (error instanceof Error) {
      return error.message
    }

    return 'An unexpected error occurred.'
  }
  
  // Status Modal State
  const [statusModal, setStatusModal] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' })

  const mainRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: '',
      name: '',
      category_id: '',
      short_description: '',
      long_description: '',
      best_for: '',
      base_price: 0,
      raw_material_cost: 0,
      min_threshold: 0,
      min_order: 1,
      print_method: '',
      is_need_screenplate: false,
      is_need_color: false,
      is_in_stock: true,
      ratings: 5,
      total_sold: 0,
    },
  })

  // Calculation for margin
  const basePrice = watch('base_price') ?? 0
  const rawCost = watch('raw_material_cost') ?? 0
  const margin = basePrice > 0 ? (((basePrice - rawCost) / basePrice) * 100).toFixed(1) : '—'

  // Load Categories
  useEffect(() => {
    axiosInstance
      .get('/api/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error('Failed to load categories'))
  }, [])

  // Load product if editing
  useEffect(() => {
    if (isNew) return
    setIsLoading(true)
    axiosInstance
      .get(`/api/admin/products/${product_id}`)
      .then((res) => {
        const p = res.data.data
        reset({
          id: p.id,
          name: p.name,
          category_id: p.category_id,
          short_description: p.short_description || '',
          long_description: p.long_description || '',
          best_for: p.best_for || '',
          base_price: parseFloat(p.base_price) || 0,
          raw_material_cost: parseFloat(p.raw_material_cost) || 0,
          min_threshold: p.min_threshold ?? 0,
          min_order: p.min_order ?? 1,
          print_method: p.print_method || '',
          is_need_screenplate: Boolean(p.is_need_screenplate),
          is_need_color: Boolean(p.is_need_color),
          is_in_stock: Boolean(p.is_in_stock),
          ratings: p.ratings ?? 5,
          total_sold: p.total_sold ?? 0,
        })
        if (p.main_image) {
          setMainImagePreview(`/images/products/${p.main_image}`)
          setMainImageError(false)
        }
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setIsLoading(false))
  }, [product_id, isNew, reset])

  // Load gallery images
  useEffect(() => {
    if (isNew) return
    axiosInstance
      .get(`/api/admin/products/${product_id}/gallery`)
      .then((res) => {
        const images = (res.data.data || []).map(
          (img: { id?: number; image_url: string; sort_order?: number }, idx: number): IGalleryImage => ({
            id: img.id,
            image_url: img.image_url,
            preview: `/images/products_gallery/${img.image_url}`,
            sort_order: img.sort_order ?? idx,
            isNew: false,
          })
        )
        setGalleryImages(images)
      })
      .catch(() => {
        setGalleryImages([])
      })
  }, [product_id, isNew])

  // Load tags
  useEffect(() => {
    if (isNew) return
    axiosInstance
      .get(`/api/admin/products/${product_id}/tags`)
      .then((res) => {
        const loadedTags = (res.data.data || []).map(
          (tag: { id?: number; tag: string }): IProductTag => ({
            id: tag.id,
            tag: tag.tag,
            isNew: false,
          })
        )
        setTags(loadedTags)
      })
      .catch(() => {
        setTags([])
      })
  }, [product_id, isNew])

  // Load variants
  useEffect(() => {
    if (isNew) return
    axiosInstance
      .get(`/api/admin/products/${product_id}/variants`)
      .then((res) => {
        const loadedVariants = (res.data.data || []).map(
          (v: { id?: number; variant_id: string; size?: string; width?: string; height?: string; price: string | number; stock?: number }): IProductVariant => ({
            id: v.id,
            variant_id: v.variant_id,
            size: v.size || '',
            width: v.width || '',
            height: v.height || '',
            price: typeof v.price === 'string' ? parseFloat(v.price) || 0 : v.price || 0,
            stock: v.stock || 0,
            isNew: false,
          })
        )
        setVariants(loadedVariants)
      })
      .catch(() => {
        setVariants([])
      })
  }, [product_id, isNew])

  const onSubmit = async (values: FormData) => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      
      Object.entries(values).forEach(([key, val]) => {
        if (typeof val === 'boolean') {
          formData.append(key, val ? '1' : '0')
        } else {
          formData.append(key, String(val ?? ''))
        }
      })

      if (mainImageFile) {
        formData.append('main_image_file', mainImageFile)
      }

      // Handle gallery images
      galleryImages.forEach((img, idx) => {
        formData.append(`gallery[${idx}][sort_order]`, String(img.sort_order))
        if (img.isNew && img.file) {
          formData.append(`gallery_files[${idx}]`, img.file)
        } else if (img.id) {
          formData.append(`gallery[${idx}][id]`, String(img.id))
          formData.append(`gallery[${idx}][image_url]`, img.image_url)
        }
      })

      // Handle tags
      tags.forEach((tag, idx) => {
        if (tag.id && !tag.isNew) {
          formData.append(`tags[${idx}][id]`, String(tag.id))
        }
        formData.append(`tags[${idx}][tag]`, tag.tag)
      })

      // Handle variants
      variants.forEach((v, idx) => {
        formData.append(`variants[${idx}][variant_id]`, v.variant_id)
        formData.append(`variants[${idx}][size]`, v.size)
        formData.append(`variants[${idx}][width]`, v.width)
        formData.append(`variants[${idx}][height]`, v.height)
        formData.append(`variants[${idx}][price]`, String(v.price))
        formData.append(`variants[${idx}][stock]`, String(v.stock))
      })

      if (isNew) {
        await axiosInstance.post('/api/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setStatusModal({ show: true, type: 'success', message: 'Product created successfully!' })
      } else {
        formData.append('_method', 'PATCH')
        await axiosInstance.post(`/api/admin/products/${product_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setStatusModal({ show: true, type: 'success', message: 'Product updated successfully!' })
      }
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error)
      setStatusModal({ show: true, type: 'error', message: msg })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Top Nav ── */}
      <div className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <button
            onClick={() => navigate('/admin/product')}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black tracking-tight text-slate-900">
              {isNew ? 'Add New Product' : 'Edit Product'}
            </h1>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              {isNew ? 'Synchronized with Products Table' : `Reference: ${product_id}`}
            </p>
          </div>
          {isDirty && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold tracking-widest text-amber-700 uppercase">
              Unsaved
            </span>
          )}
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-black tracking-widest text-[#75EEA5] uppercase shadow-lg transition-all hover:bg-slate-700 disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {/* ── Form Content ── */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Controls (Left Column) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-8">
              <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase">General Information</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="Product ID (Table Key)" error={errors.id?.message}>
                  {isNew ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-400">
                      Auto-generated on save
                    </div>
                  ) : (
                    <input
                      {...register('id')}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-500 outline-none cursor-not-allowed"
                    />
                  )}
                </Field>
                <Field label="Product Name" error={errors.name?.message}>
                  <input {...register('name')} placeholder="Product name..." className={inputCls} />
                </Field>
              </div>

              <Field label="Category" error={errors.category_id?.message}>
                <select {...register('category_id')} className={selectCls}>
                  <option value="">— Select Category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Short Description" error={errors.short_description?.message}>
                <textarea {...register('short_description')} rows={2} className={`${inputCls} resize-none`} />
              </Field>

              <Field label="Long Description" error={errors.long_description?.message}>
                <textarea {...register('long_description')} rows={4} className={`${inputCls} resize-none`} />
              </Field>

              <Field label="Best For" error={errors.best_for?.message}>
                <input {...register('best_for')} className={inputCls} />
              </Field>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-8">
              <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase">Production & Stats</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="Min Threshold" error={errors.min_threshold?.message}>
                  <input type="number" {...register('min_threshold', { valueAsNumber: true })} className={inputCls} />
                </Field>
                <Field label="Min Order Qty" error={errors.min_order?.message}>
                  <input type="number" {...register('min_order', { valueAsNumber: true })} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="Ratings (0-5)" error={errors.ratings?.message}>
                  <input type="number" step="0.1" {...register('ratings', { valueAsNumber: true })} className={inputCls} />
                </Field>
                <Field label="Total Sold" error={errors.total_sold?.message}>
                  <input type="number" {...register('total_sold', { valueAsNumber: true })} className={inputCls} />
                </Field>
              </div>

              <Field label="Print Method">
                <input {...register('print_method')} placeholder="e.g. Screen Print" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Side Controls (Right Column) */}
          <div className="space-y-8">
            {/* Image Upload */}
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-4">
              <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase">Main Image</h3>
              <div 
                className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-blue-400"
                onClick={() => mainRef.current?.click()}
              >
                {mainImagePreview ? (
                  <>
                    {!mainImageError ? (
                      <img
                        src={mainImagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={() => setMainImageError(true)}
                      />
                    ) : (
                      <BoxFallback className="h-full w-full rounded-2xl bg-slate-100" iconClassName="h-12 w-12 opacity-30" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImagePlus size={24} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
                    <ImagePlus size={32} />
                    <span className="text-[10px] font-bold uppercase">Upload Image</span>
                  </div>
                )}
              </div>
              {mainImagePreview && (
                <button
                  type="button"
                  onClick={() => { setMainImageFile(null); setMainImagePreview(''); setMainImageError(false); }}
                  className="w-full rounded-xl border border-rose-100 bg-rose-50 py-2.5 text-[10px] font-black tracking-widest text-rose-600 uppercase transition-all hover:bg-rose-100"
                >
                  Remove Image
                </button>
              )}
              <input 
                ref={mainRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setMainImageFile(file)
                    setMainImagePreview(URL.createObjectURL(file))
                    setMainImageError(false)
                  }
                }}
              />
            </div>

            {/* Pricing Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-6">
              <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase">Pricing</h3>
              <Field label="Base Price (₱)" error={errors.base_price?.message}>
                <input type="number" step="0.01" {...register('base_price', { valueAsNumber: true })} className={inputCls} />
              </Field>
              <Field label="Material Cost (₱)" error={errors.raw_material_cost?.message}>
                <input type="number" step="0.01" {...register('raw_material_cost', { valueAsNumber: true })} className={inputCls} />
              </Field>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">Margin</p>
                <p className={`text-2xl font-black ${parseFloat(margin) > 30 ? 'text-emerald-500' : 'text-amber-500'}`}>{margin}%</p>
              </div>
            </div>

            {/* Status Toggles */}
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-6">
              <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase">Flags</h3>
              
              <div className="space-y-4">
                {[
                  { name: 'is_in_stock' as const, label: 'Available / In Stock' },
                  { name: 'is_need_screenplate' as const, label: 'Needs Screenplate' },
                  { name: 'is_need_color' as const, label: 'Multi-Color' },
                ].map(({ name, label }) => {
                  const val = watch(name)
                  return (
                    <label key={name} className="flex cursor-pointer items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                      <div
                        onClick={() => setValue(name, !val)}
                        className={`h-5 w-9 rounded-full border-2 transition-all ${val ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'}`}
                      >
                        <div className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${val ? 'translate-x-[18px]' : 'translate-x-[1px]'} mt-[1px]`} />
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Gallery Section ── */}
      {!isNew && (
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-8">
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Product Gallery</h2>
            
            {/* Upload Area */}
            <div>
              <label className="block text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase mb-3">
                Add Gallery Images
              </label>
              <div
                className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 transition-all hover:border-blue-400"
                onClick={() => galleryRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
                  <ImagePlus size={32} />
                  <span className="text-[10px] font-bold uppercase">Click to add gallery images</span>
                  <span className="text-[9px] text-slate-400">Multiple images supported</span>
                </div>
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    const newImages = files.map((file, idx) => ({
                      image_url: file.name,
                      preview: URL.createObjectURL(file),
                      sort_order: Math.max(...galleryImages.map(g => g.sort_order), -1) + idx + 1,
                      isNew: true,
                      file: file,
                    }))
                    setGalleryImages([...galleryImages, ...newImages])
                    if (galleryRef.current) galleryRef.current.value = ''
                  }}
                />
              </div>
            </div>

            {/* Gallery Grid */}
            {galleryImages.length > 0 && (
              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase mb-4">
                  Gallery ({galleryImages.length} images)
                </label>
                <div className="space-y-3">
                  {galleryImages
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((img, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => setDraggedImage(idx)}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setDragOverIndex(idx)
                        }}
                        onDragLeave={() => setDragOverIndex(null)}
                        onDrop={() => {
                          if (draggedImage !== null && draggedImage !== idx) {
                            const newImages = [...galleryImages]
                            const temp = newImages[draggedImage]
                            newImages[draggedImage] = newImages[idx]
                            newImages[idx] = temp
                            newImages.forEach((img, i) => {
                              img.sort_order = i
                            })
                            setGalleryImages(newImages)
                          }
                          setDraggedImage(null)
                          setDragOverIndex(null)
                        }}
                        className={`group flex items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                          dragOverIndex === idx
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <GripVertical size={20} className="text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing" />
                        
                        <img
                          src={img.preview}
                          alt={`Gallery ${idx + 1}`}
                          className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'
                          }}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{img.image_url}</p>
                          <p className="text-[10px] text-slate-500">
                            {img.isNew ? 'New image' : 'Uploaded'}
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const updatedImages = galleryImages.filter((_, i) => i !== idx)
                            updatedImages.forEach((img, i) => {
                              img.sort_order = i
                            })
                            setGalleryImages(updatedImages)
                          }}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-100 hover:text-rose-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {galleryImages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">No gallery images yet. Upload images above to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Product Tags Section ── */}
      {!isNew && (
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-8">
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Product Tags</h2>
            
            {/* Add Tag Input */}
            <div>
              <label className="block text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase mb-3">
                Add New Tag
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTagInput.trim()) {
                      e.preventDefault()
                      setTags([...tags, { tag: newTagInput.trim(), isNew: true }])
                      setNewTagInput('')
                    }
                  }}
                  placeholder="e.g. Food Grade, Premium Look..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/8"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTagInput.trim()) {
                      setTags([...tags, { tag: newTagInput.trim(), isNew: true }])
                      setNewTagInput('')
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black tracking-widest text-[#75EEA5] uppercase shadow-lg transition-all hover:bg-slate-700"
                >
                  <Plus size={16} />
                  Add Tag
                </button>
              </div>
            </div>

            {/* Tags List */}
            {tags.length > 0 && (
              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase mb-4">
                  Tags ({tags.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 border border-slate-200"
                    >
                      <span className="text-sm font-bold text-slate-900">{tag.tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTags(tags.filter((_, i) => i !== idx))
                        }}
                        className="rounded-full p-1 text-slate-400 transition-all hover:bg-rose-100 hover:text-rose-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tags.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">No tags yet. Add tags above to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Product Variants Section ── */}
      {!isNew && (
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-8">
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Product Variants</h2>

            {/* Add Variant Form */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
                Add New Variant
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 items-end">
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">ID</label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm font-medium text-slate-400">
                    Auto-generated on save
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Size</label>
                  <input
                    type="text"
                    value={newVariant.size}
                    onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                    placeholder="Large"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">W x H</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newVariant.width}
                      onChange={(e) => setNewVariant({ ...newVariant, width: e.target.value })}
                      placeholder="W"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-sm font-medium outline-none focus:border-blue-400"
                    />
                    <span className="text-slate-300">×</span>
                    <input
                      type="text"
                      value={newVariant.height}
                      onChange={(e) => setNewVariant({ ...newVariant, height: e.target.value })}
                      placeholder="H"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-sm font-medium outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Price</label>
                  <input
                    type="number"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Stock</label>
                  <input
                    type="number"
                    value={newVariant.stock}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVariants([...variants, newVariant])
                      setNewVariant({
                        variant_id: '',
                        size: '',
                        width: '',
                        height: '',
                        price: 0,
                        stock: 0,
                        isNew: true
                      })
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-black tracking-widest text-[#75EEA5] uppercase shadow-lg transition-all hover:bg-slate-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Variants Table */}
            {variants.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">ID</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Size</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Width</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Height</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Price</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Stock</th>
                      <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={idx} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 text-sm font-bold text-slate-900">{v.variant_id}</td>
                        <td className="py-4 text-sm text-slate-600">{v.size || '—'}</td>
                        <td className="py-4 text-sm text-slate-600">{v.width || '—'}</td>
                        <td className="py-4 text-sm text-slate-600">{v.height || '—'}</td>
                        <td className="py-4 text-sm font-black text-slate-900">₱{v.price.toFixed(2)}</td>
                        <td className="py-4 text-sm font-medium text-slate-600">
                          <span className={`rounded-full px-2 py-1 text-[10px] ${v.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {v.stock} in stock
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {variants.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">No variants yet. Add variants above to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Status Modal ── */}
      <AnimatePresence>
        {statusModal.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl overflow-hidden relative"
            >
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${statusModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {statusModal.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase">
                {statusModal.type === 'success' ? 'Success!' : 'Oops! Something went wrong'}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{statusModal.message}</p>
              
              <button
                onClick={() => {
                  setStatusModal({ ...statusModal, show: false })
                  if (statusModal.type === 'success') navigate('/admin/product')
                }}
                className={`mt-8 w-full rounded-2xl py-4 text-xs font-black text-white uppercase transition-all ${statusModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                {statusModal.type === 'success' ? 'Done' : 'Dismiss'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ManageProduct
