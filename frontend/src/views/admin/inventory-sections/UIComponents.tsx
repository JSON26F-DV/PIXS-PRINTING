import React from 'react';
import { 
  Plus, Upload, Trash2, Camera, AlertCircle 
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import type { FieldError } from 'react-hook-form';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// StatCard matching Dashboard style
export const StatCard: React.FC<{ label: string, value: string | number, color?: string, isAlert?: boolean, icon: LucideIcon }> = ({ label, value, icon: Icon, isAlert = false, color = 'emerald' }) => {
  const bgClass = color === 'rose' ? 'bg-rose-50 border-rose-100 shadow-rose-200/40 text-rose-900 font-bold' :
                  color === 'emerald' ? 'bg-emerald-50 border-emerald-100 shadow-emerald-200/40 text-emerald-900 font-bold' :
                  'bg-white border-slate-100 shadow-slate-200/40 text-slate-900 font-bold';
                  
  const textMuted = 'text-slate-500';

  return (
    <div className={cn("p-6 relative group overflow-hidden rounded-[24px] border transition-all hover:-translate-y-1 w-full md:w-[220px]", bgClass)}>
      <div className="absolute -top-4 -right-4 p-4 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
        <Icon className="w-24 h-24" />
      </div>
      <p className={cn("text-[10px] font-black uppercase tracking-widest mb-2 relative z-10", textMuted)}>{label}</p>
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-2xl font-black tracking-tighter">{value}</span>
      </div>
      {isAlert && (
        <div className="flex items-center gap-1 mt-3 text-[10px] font-black px-2 py-1 rounded-full w-fit relative z-10 bg-rose-500 text-white animate-pulse">
           <span>CRITICAL ACTION REQUIRED</span>
        </div>
      )}
    </div>
  );
};

// PROFESSIONAL SECTION TITLE
export const SectionTitle: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    {subtitle && <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

// INPUT FIELD - PROFESSIONAL STYLE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const InputField = ({ label, name, type = 'text', register, error, placeholder, rules, value, onChange }: { label: string, name?: string, type?: string, register?: any, error?: FieldError, placeholder?: string, rules?: any, value?: string | number, onChange?: (val: string) => void }) => {
  const props = name && register ? register(name, rules) : (value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange!(e.target.value) } : {});
  
  return (
    <div className="w-full space-y-2">
      <label className="text-[11px] font-black uppercase tracking-[1px] text-slate-500 ml-1">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder} 
        {...props}
        className={cn(
          "w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300",
          error ? "border-rose-400 focus:ring-4 focus:ring-rose-500/10 bg-rose-50/20" : "focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 focus:bg-white"
        )}
      />
      {error && <p className="text-[10px] font-bold text-rose-500 italic mt-1 ml-1">{error.message}</p>}
    </div>
  );
};

// TEXT AREA - PROFESSIONAL STYLE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TextArea = ({ label, name, register, error, placeholder, rules, value, onChange }: { label: string, name?: string, register?: any, error?: FieldError, placeholder?: string, rules?: any, value?: string, onChange?: (val: string) => void }) => {
  const props = name && register ? register(name, rules) : (value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange!(e.target.value) } : {});

  return (
    <div className="w-full space-y-2">
      <label className="text-[11px] font-black uppercase tracking-[1px] text-slate-500 ml-1">{label}</label>
      <textarea 
        rows={4}
        placeholder={placeholder} 
        {...props}
        className={cn(
          "w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 resize-none",
          error ? "border-rose-400 focus:ring-4 focus:ring-rose-500/10 bg-rose-50/20" : "focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 focus:bg-white"
        )}
      />
      {error && <p className="text-[10px] font-bold text-rose-500 italic mt-1 ml-1">{error.message}</p>}
    </div>
  );
};

// IMAGE UPLOADER - CLEAN STYLE
export const ImageUploader: React.FC<{ value: string, onChange: (val: string) => void, className?: string }> = ({ value, onChange, className }) => {
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  return (
    <div {...getRootProps()} className={cn("relative group cursor-pointer overflow-hidden rounded-[24px] border-2 border-dashed transition-all aspect-square flex items-center justify-center bg-slate-50/50", isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-400", className)}>
      <input {...getInputProps()} />
      {value ? (
        <>
          <img src={value} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Preview" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
             <div className="bg-white p-3 rounded-full text-slate-900 shadow-xl"><Camera size={20} /></div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-400">
           <Upload size={32} />
           <p className="text-[10px] font-black uppercase tracking-widest">Upload Key View Image</p>
        </div>
      )}
    </div>
  );
};

// GALLERY UPLOADER - CLEAN STYLE
export const GalleryUploader: React.FC<{ images: string[], onChange: (val: string[]) => void }> = ({ images = [], onChange }) => {
  const onDrop = (acceptedFiles: File[]) => {
    const readers = acceptedFiles.map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results: string[]) => {
      onChange([...images, ...results]);
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="GalleryUploader space-y-4">
      <SectionTitle title="Product Gallery" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 h-fit">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square group rounded-[20px] overflow-hidden border border-slate-200 shadow-sm">
            <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={`Gallery ${idx}`} />
            <button 
              type="button"
              onClick={() => removeImage(idx)} 
              className="absolute top-2 right-2 p-1.5 bg-white text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-500 hover:text-white"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        
        <div {...getRootProps()} className="cursor-pointer aspect-square border-2 border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all bg-slate-50/50">
           <input {...getInputProps()} />
           <Plus size={24} />
        </div>
      </div>
    </div>
  );
};

// MODAL - PROFESSIONAL STYLE
export const ConfirmModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }> = ({ isOpen, onClose, onConfirm, title, message }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 space-y-6">
          <div className="flex items-center gap-4 text-rose-600">
             <div className="p-3 bg-rose-50 rounded-2xl"><AlertCircle size={28} /></div>
             <h4 className="text-xl font-black tracking-tight">{title}</h4>
          </div>
          <p className="text-sm font-semibold text-slate-500 leading-relaxed">{message}</p>
          <div className="flex gap-3 pt-2">
             <button onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
             <button onClick={onConfirm} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:-translate-y-1 transition-all">Delete Forever</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
