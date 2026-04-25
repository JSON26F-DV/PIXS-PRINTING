import React from 'react'
import { Plus, Upload, Trash2, Camera, AlertCircle } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import type {
  FieldError,
  UseFormRegister,
  RegisterOptions,
} from 'react-hook-form'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

// StatCard matching Dashboard style
export const StatCard: React.FC<{
  label: string
  value: string | number
  color?: string
  isAlert?: boolean
  icon: LucideIcon
}> = ({ label, value, icon: Icon, isAlert = false, color = 'emerald' }) => {
  const bgClass =
    color === 'rose'
      ? 'bg-rose-50 border-rose-100 shadow-rose-200/40 text-rose-900 font-bold'
      : color === 'emerald'
        ? 'bg-emerald-50 border-emerald-100 shadow-emerald-200/40 text-emerald-900 font-bold'
        : 'bg-white border-slate-100 shadow-slate-200/40 text-slate-900 font-bold'

  const textMuted = 'text-slate-500'

  return (
    <div
      className={cn(
        'group relative w-full overflow-hidden rounded-[24px] border p-6 transition-all hover:-translate-y-1 md:w-[220px]',
        bgClass,
      )}
    >
      <div className="absolute -top-4 -right-4 p-4 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
        <Icon className="h-24 w-24" />
      </div>
      <p
        className={cn(
          'relative z-10 mb-2 text-[10px] font-black tracking-widest uppercase',
          textMuted,
        )}
      >
        {label}
      </p>
      <div className="relative z-10 flex items-baseline gap-1">
        <span className="text-2xl font-black tracking-tighter">{value}</span>
      </div>
      {isAlert && (
        <div className="relative z-10 mt-3 flex w-fit animate-pulse items-center gap-1 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black text-white">
          <span>CRITICAL ACTION REQUIRED</span>
        </div>
      )}
    </div>
  )
}

// PROFESSIONAL SECTION TITLE
export const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <div className="mb-6">
    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    {subtitle && (
      <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
    )}
  </div>
)

// INPUT FIELD - PROFESSIONAL STYLE

export const InputField = ({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder,
  rules,
  value,
  onChange,
}: {
  label: string
  name?: string
  type?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  error?: FieldError
  placeholder?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules?: RegisterOptions<any>
  value?: string | number
  onChange?: (val: string) => void
}) => {
  const props =
    name && register
      ? register(name, rules)
      : value !== undefined
        ? {
            value,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              onChange!(e.target.value),
          }
        : {}

  return (
    <div className="w-full space-y-2">
      <label className="ml-1 text-[11px] font-black tracking-[1px] text-slate-500 uppercase">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        {...props}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 transition-all outline-none placeholder:text-slate-300',
          error
            ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
            : 'focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5',
        )}
      />
      {error && (
        <p className="mt-1 ml-1 text-[10px] font-bold text-rose-500 italic">
          {error.message}
        </p>
      )}
    </div>
  )
}

// TEXT AREA - PROFESSIONAL STYLE

export const TextArea = ({
  label,
  name,
  register,
  error,
  placeholder,
  rules,
  value,
  onChange,
}: {
  label: string
  name?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  error?: FieldError
  placeholder?: string
  rules?: RegisterOptions
  value?: string
  onChange?: (val: string) => void
}) => {
  const props =
    name && register
      ? register(name, rules)
      : value !== undefined
        ? {
            value,
            onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange!(e.target.value),
          }
        : {}

  return (
    <div className="w-full space-y-2">
      <label className="ml-1 text-[11px] font-black tracking-[1px] text-slate-500 uppercase">
        {label}
      </label>
      <textarea
        rows={4}
        placeholder={placeholder}
        {...props}
        className={cn(
          'w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 transition-all outline-none placeholder:text-slate-300',
          error
            ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
            : 'focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5',
        )}
      />
      {error && (
        <p className="mt-1 ml-1 text-[10px] font-bold text-rose-500 italic">
          {error.message}
        </p>
      )}
    </div>
  )
}

// IMAGE UPLOADER - CLEAN STYLE
export const ImageUploader: React.FC<{
  value: string
  onChange: (val: string) => void
  className?: string
}> = ({ value, onChange, className }) => {
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed bg-slate-50/50 transition-all',
        isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-200 hover:border-slate-400',
        className,
      )}
    >
      <input {...getInputProps()} />
      {value ? (
        <>
          <img
            src={value}
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
            Upload Key View Image
          </p>
        </div>
      )}
    </div>
  )
}

// GALLERY UPLOADER - CLEAN STYLE
export const GalleryUploader: React.FC<{
  images: string[]
  onChange: (val: string[]) => void
}> = ({ images = [], onChange }) => {
  const onDrop = (acceptedFiles: File[]) => {
    const readers = acceptedFiles.map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    })

    Promise.all(readers).then((results: string[]) => {
      onChange([...images, ...results])
    })
  }

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="GalleryUploader space-y-4">
      <SectionTitle title="Product Gallery" />
      <div className="grid h-fit grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="group relative aspect-square overflow-hidden rounded-[20px] border border-slate-200 shadow-sm"
          >
            <img
              src={img}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
              alt={`Gallery ${idx}`}
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-2 right-2 rounded-lg bg-white p-1.5 text-rose-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-rose-500 hover:text-white"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        <div
          {...getRootProps()}
          className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-400 transition-all hover:border-blue-400 hover:text-blue-500"
        >
          <input {...getInputProps()} />
          <Plus size={24} />
        </div>
      </div>
    </div>
  )
}

// MODAL - PROFESSIONAL STYLE
export const ConfirmModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}> = ({ isOpen, onClose, onConfirm, title, message }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md space-y-6 rounded-[32px] bg-white p-8 shadow-2xl"
        >
          <div className="flex items-center gap-4 text-rose-600">
            <div className="rounded-2xl bg-rose-50 p-3">
              <AlertCircle size={28} />
            </div>
            <h4 className="text-xl font-black tracking-tight">{title}</h4>
          </div>
          <p className="text-sm leading-relaxed font-semibold text-slate-500">
            {message}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-50 py-4 text-xs font-bold tracking-widest text-slate-900 uppercase transition-all hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-rose-600 py-4 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-rose-200 transition-all hover:-translate-y-1"
            >
              Delete Forever
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
)
