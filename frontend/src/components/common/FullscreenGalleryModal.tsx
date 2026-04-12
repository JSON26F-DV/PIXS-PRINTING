import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react'
import { clsx } from 'clsx'

interface FullscreenGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  initialIndex?: number
  productName: string
}

const FullscreenGalleryModal: React.FC<FullscreenGalleryModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  productName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  // High-Fidelity Sync: Reset index during render when the modal opens
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true)
    setCurrentIndex(initialIndex)
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false)
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight')
        setCurrentIndex((prev) => (prev + 1) % images.length)
      if (e.key === 'ArrowLeft')
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, images.length])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/95 backdrop-blur-xl"
      >
        {/* Superior Control Header */}
        <div className="flex items-center justify-between p-6 md:p-10">
          <div className="space-y-1">
            <h2 className="text-xs font-black tracking-[4px] text-white uppercase italic">
              {productName}
            </h2>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Production Image {currentIndex + 1} of {images.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={images[currentIndex]}
              download={`${productName}-img-${currentIndex + 1}`}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
              title="Download High-Res"
            >
              <Download size={20} />
            </a>
            <button
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-2xl transition-all hover:bg-white/20"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Cinematic Viewing Area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 md:px-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -40 }}
              transition={{ duration: 0.5, ease: 'circOut' }}
              className="relative flex h-full w-full items-center justify-center"
            >
              <img
                src={images[currentIndex]}
                alt={`${productName} view ${currentIndex + 1}`}
                className="max-h-[85vh] max-w-full rounded-2xl border border-white/5 object-contain shadow-[0_0_80px_rgba(0,0,0,0.5)]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="hover:bg-pixs-mint group absolute left-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-black/40 text-white shadow-2xl backdrop-blur-md transition-all hover:text-slate-900 active:scale-95 md:left-12"
              >
                <ChevronLeft
                  size={32}
                  className="transition-transform group-hover:-translate-x-1"
                />
              </button>
              <button
                onClick={handleNext}
                className="hover:bg-pixs-mint group absolute right-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-black/40 text-white shadow-2xl backdrop-blur-md transition-all hover:text-slate-900 active:scale-95 md:right-12"
              >
                <ChevronRight
                  size={32}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Filmstrip Protocol */}
        <div className="no-scrollbar flex justify-center gap-4 overflow-x-auto border-t border-white/5 p-10 md:p-12">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={clsx(
                'relative h-20 w-20 overflow-hidden rounded-xl border-2 p-1 transition-all',
                currentIndex === i
                  ? 'border-pixs-mint bg-pixs-mint/20'
                  : 'border-white/5 bg-white/5 hover:border-white/20',
              )}
            >
              <img
                src={img}
                className="h-full w-full rounded-lg object-cover"
              />
              {currentIndex === i && (
                <div className="bg-pixs-mint/10 absolute inset-0 flex items-center justify-center">
                  <Maximize2 size={16} className="text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FullscreenGalleryModal
