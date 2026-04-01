import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';

interface FullscreenGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productName: string;
}

const FullscreenGalleryModal: React.FC<FullscreenGalleryModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  productName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // High-Fidelity Sync: Reset index during render when the modal opens
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setCurrentIndex(initialIndex);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);



  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, images.length]);


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-xl flex flex-col"
      >
        {/* Superior Control Header */}
        <div className="flex items-center justify-between p-6 md:p-10">
          <div className="space-y-1">
            <h2 className="text-white text-xs font-black uppercase tracking-[4px] italic">{productName}</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Production Image {currentIndex + 1} of {images.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href={images[currentIndex]} 
              download={`${productName}-img-${currentIndex + 1}`}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/10"
              title="Download High-Res"
            >
              <Download size={20} />
            </a>
            <button 
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 shadow-2xl"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Cinematic Viewing Area */}
        <div className="flex-1 relative flex items-center justify-center px-6 md:px-20 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -40 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img 
                src={images[currentIndex]} 
                alt={`${productName} view ${currentIndex + 1}`} 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/5"
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          {images.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-6 md:left-12 w-16 h-16 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-pixs-mint hover:text-slate-900 transition-all border border-white/5 backdrop-blur-md active:scale-95 group shadow-2xl"
              >
                <ChevronLeft size={32} className="transition-transform group-hover:-translate-x-1" />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-6 md:right-12 w-16 h-16 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-pixs-mint hover:text-slate-900 transition-all border border-white/5 backdrop-blur-md active:scale-95 group shadow-2xl"
              >
                <ChevronRight size={32} className="transition-transform group-hover:translate-x-1" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Filmstrip Protocol */}
        <div className="p-10 md:p-12 border-t border-white/5 overflow-x-auto no-scrollbar flex justify-center gap-4">
           {images.map((img, i) => (
             <button
               key={i}
               onClick={() => setCurrentIndex(i)}
               className={clsx(
                 "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all p-1",
                 currentIndex === i ? "border-pixs-mint bg-pixs-mint/20" : "border-white/5 bg-white/5 hover:border-white/20"
               )}
             >
                <img src={img} className="w-full h-full object-cover rounded-lg" />
                {currentIndex === i && (
                  <div className="absolute inset-0 bg-pixs-mint/10 flex items-center justify-center">
                     <Maximize2 size={16} className="text-white drop-shadow-lg" />
                  </div>
                )}
             </button>
           ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullscreenGalleryModal;
