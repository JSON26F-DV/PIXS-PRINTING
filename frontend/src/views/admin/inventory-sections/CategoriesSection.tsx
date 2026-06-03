import React, { useState } from 'react'
import { Plus, Edit, Trash2, ChevronRight, LayoutGrid, Upload, Camera, X, CheckCircle } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import Cropper, { type Area } from 'react-easy-crop'
import type { ICategory, IProduct } from './types'
import { InputField, ConfirmModal } from './UIComponents'
import toast from 'react-hot-toast'
import axiosInstance from '../../../lib/axiosInstance'
import BoxFallback from '../../../components/common/BoxFallback'
import getCroppedImg from '../../../pages/Settings/AccountInfo/utils/cropImage'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

const CategoryImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [error, setError] = useState(false)
  if (error || !src) {
    return <BoxFallback className={cn("flex items-center justify-center bg-slate-100", className)} iconClassName="h-6 w-6 opacity-30" />
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />
}

interface CategoriesSectionProps {
  categories: ICategory[]
  products: IProduct[]
  setCategories: React.Dispatch<React.SetStateAction<ICategory[]>>
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  products,
  setCategories,
}) => {
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(
    null,
  )

  // Cropping states
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setTempImage(reader.result as string)
      setIsCropping(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleApplyCrop = async () => {
    if (!tempImage || !croppedAreaPixels) return

    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(croppedBlob)
      })
      setEditingCategory((prev) => (prev ? { ...prev, image: base64 } : prev))
    } catch (e) {
      console.error(e)
      toast.error('Error cropping image')
    } finally {
      setIsCropping(false)
      setTempImage(null)
    }
  }

  const handleSave = async (cat: ICategory) => {
    if (!cat.label) {
      toast.error('Category name is required.')
      return
    }

    try {
      if (isAdding) {
        if (
          categories.some(
            (c) => c.label.toLowerCase() === cat.label.toLowerCase(),
          )
        ) {
          toast.error('Category already exists.')
          return
        }
        const res = await axiosInstance.post('/api/admin/categories', cat)
        setCategories((prev) => [...prev, res.data.data])
        toast.success('Category added.')
      } else {
        const res = await axiosInstance.patch(`/api/admin/categories/${cat.id}`, cat)
        setCategories((prev) => prev.map((c) => (c.id === cat.id ? res.data.data : c)))
        toast.success('Category updated.')
      }
      setEditingCategory(null)
      setIsAdding(false)
    } catch (e) {
      toast.error('Failed to save category.')
      console.error(e)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return

    // Safety check: is any product using this category?
    const isUsed = products.some((p) => p.category === categoryToDelete.label)
    if (isUsed) {
      toast.error(
        `Cannot delete "${categoryToDelete.label}". Products are still linked to this category.`,
      )
      setCategoryToDelete(null)
      return
    }

    try {
      await axiosInstance.delete(`/api/admin/categories/${categoryToDelete.id}`)
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
      toast.success('Category deleted.')
      setCategoryToDelete(null)
    } catch (e) {
      toast.error('Failed to delete category.')
      console.error(e)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/40">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900">
          <LayoutGrid size={22} className="text-blue-600" /> Categories
        </h3>
        <button
          onClick={() => {
            setIsAdding(true)
            setEditingCategory({
              id: '',
              label: '',
              image: 'https://placehold.co/400x400?text=Category+Visual',
            })
          }}
          className="flex items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-black tracking-widest text-blue-600 uppercase transition-all hover:bg-blue-50"
        >
          <Plus size={14} /> Add New
        </button>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2 pb-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="group flex items-center gap-4 rounded-[20px] border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-xl"
          >
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <CategoryImage
                src={`/public/images/categories/${cat.image}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                alt={cat.label}
              />
            </div>
            <div className="flex-1">
              <p className="truncate text-sm leading-tight font-bold tracking-tight text-slate-900 uppercase">
                {cat.label}
              </p>
              <p className="mt-0.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {cat.count || 0} Products
              </p>
            </div>
            <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => setEditingCategory(cat)}
                className="rounded-xl border border-slate-100 bg-white p-2.5 text-slate-400 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => setCategoryToDelete(cat)}
                className="rounded-xl border border-slate-100 bg-white p-2.5 text-slate-400 shadow-sm transition-all hover:border-rose-200 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <ChevronRight
              size={16}
              className="text-slate-200 transition-colors group-hover:text-blue-300"
            />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setEditingCategory(null)}
            />
            <m.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm space-y-6 rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <h4 className="text-2xl font-black tracking-tight text-slate-900">
                {isAdding ? 'Add Category' : 'Modify Category'}
              </h4>

              <div className="space-y-6">
                <InputField
                  label="Category Label"
                  value={editingCategory.label}
                  onChange={(v: string) =>
                    setEditingCategory({ ...editingCategory, label: v })
                  }
                  placeholder="e.g., T-Shirts"
                />
                <div>
                  <p className="mb-3 ml-1 text-[11px] font-black text-slate-500 uppercase">
                    Visual Preview
                  </p>
                  <label className="group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-slate-400">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {editingCategory.image ? (
                      <>
                        <img
                          src={
                            editingCategory.image.startsWith('data:')
                              ? editingCategory.image
                              : `/public/images/categories/${editingCategory.image}`
                          }
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          alt="Preview"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                          <div className="rounded-full bg-white p-3 text-slate-900 shadow-xl">
                            <Camera size={20} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Upload size={32} />
                        <p className="text-[10px] font-black tracking-widest uppercase">
                          Upload Category Image
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 rounded-xl bg-slate-50 py-4 text-[10px] font-bold tracking-widest text-slate-900 uppercase transition-all hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(editingCategory)}
                  className="flex-1 rounded-xl bg-slate-900 py-4 text-[10px] font-bold tracking-widest text-[#75EEA5] uppercase shadow-xl transition-all hover:-translate-y-1"
                >
                  Save Changes
                </button>
              </div>
            </m.div>
          </div>
        )}

        {/* Cropping Modal */}
        {isCropping && tempImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[48px] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    Crop Category Image
                  </h3>
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Adjust and crop your image
                  </p>
                </div>
                <button onClick={() => setIsCropping(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={22} />
                </button>
              </div>

              <div className="relative h-[300px] w-full overflow-hidden rounded-[24px] bg-slate-100">
                <Cropper
                  image={tempImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="rect"
                  showGrid={false}
                />
              </div>

              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Zoom</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-slate-900"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCropping(false)}
                    className="flex-1 rounded-2xl border border-slate-100 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCrop}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <CheckCircle size={16} />
                    Apply Crop
                  </button>
                </div>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {categoryToDelete && (
        <ConfirmModal
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Category?"
          message={`Are you sure you want to permanently delete "${categoryToDelete.label}" from the product matrix?`}
        />
      )}
    </div>
  )
}
