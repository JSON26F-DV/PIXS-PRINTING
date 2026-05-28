import React, { useState } from 'react'
import { Plus, Edit, Trash2, ChevronRight, LayoutGrid } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ICategory, IProduct } from './types'
import { InputField, ImageUploader, ConfirmModal } from './UIComponents'
import toast from 'react-hot-toast'
import axiosInstance from '../../../lib/axiosInstance'
import BoxFallback from '../../../components/common/BoxFallback'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

const CategoryImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [error, setError] = useState(false)
  if (error || !src) {
    return <BoxFallback className={cn("bg-slate-100", className)} iconClassName="h-6 w-6 opacity-30" />
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setEditingCategory(null)}
            />
            <motion.div
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
                  <ImageUploader
                    value={editingCategory.image || ''}
                    onChange={(v: string) =>
                      setEditingCategory({ ...editingCategory, image: v })
                    }
                    className="aspect-video"
                    pathPrefix="/public/images/categories/"
                  />
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
            </motion.div>
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
