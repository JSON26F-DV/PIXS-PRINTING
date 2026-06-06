import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'
import BoxFallback from './BoxFallback'

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
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  
  // Zoom & Pan State
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }))
  }

  const touchStartRef = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale === 1 && e.touches.length === 1) {
      touchStartRef.current = e.touches[0].clientX
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale === 1 && touchStartRef.current !== null && e.changedTouches.length === 1) {
      const diffX = e.changedTouches[0].clientX - touchStartRef.current
      if (diffX > 50) {
        handlePrev()
      } else if (diffX < -50) {
        handleNext()
      }
    }
    touchStartRef.current = null
  }

  // Reset during render logic
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true)
    setCurrentIndex(initialIndex)
    setScale(1)
    setPosition({ x: 0, y: 0 })
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

  const resetZoom = React.useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    resetZoom()
  }, [images.length, resetZoom])

  const handlePrev = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    resetZoom()
  }, [images.length, resetZoom])

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (scale === 1) {
        if (e.key === 'ArrowRight') handleNext()
        if (e.key === 'ArrowLeft') handlePrev()
      }
      if (e.key === 'Escape') onClose()
    }

    const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            setScale(prev => Math.min(Math.max(prev + delta, 1), 4))
        }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('wheel', handleWheel)
    }
  }, [onClose, images.length, scale, handleNext, handlePrev])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/95 backdrop-blur-xl pointer-events-auto">
        {/* Superior Control Header */}
        <div className="flex items-center justify-between p-6 md:p-10 z-20">
          <div className="space-y-1">
            <h2 className="text-xs font-black tracking-[4px] text-white uppercase italic">
              {productName}
            </h2>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Production Image {currentIndex + 1} of {images.length}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center bg-white/5 rounded-2xl p-1 gap-1 border border-white/10 mr-4">
                <button 
                  onClick={handleZoomOut}
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                    <ZoomOut size={18} />
                </button>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  onClick={resetZoom}
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                    <RotateCcw size={18} />
                </button>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  onClick={handleZoomIn}
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                    <ZoomIn size={18} />
                </button>
            </div>

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
        <div 
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={clsx(
                "relative flex flex-1 items-center justify-center overflow-hidden px-6 md:px-20",
                scale > 1 ? "cursor-grab" : "cursor-default"
            )}
        >
            <div
              key={currentIndex}
              className="relative flex h-full w-full items-center justify-center transition-transform"
              style={{ transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)` }}
            >
              {images[currentIndex] && !imageErrors[currentIndex] ? (
                <img
                  src={images[currentIndex]}
                  alt={`${productName} view ${currentIndex + 1}`}
                  className="max-h-[85vh] max-w-full rounded-2xl border border-white/5 object-contain shadow-[0_0_80px_rgba(0,0,0,0.5)] select-none pointer-events-none"
                  onError={() => handleImageError(currentIndex)}
                />
              ) : (
                <BoxFallback className="flex h-[50vh] w-[50vh] items-center justify-center rounded-2xl bg-white/5" />
              )}
            </div>

          {/* Navigation Controls */}
          {images.length > 1 && scale === 1 && (
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

          {/* Zoom Reminder Overlay */}
          {scale === 1 && (
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/5 text-[8px] font-black tracking-widest text-white/40 uppercase">
                Hold CTRL + Scroll to zoom
             </div>
          )}
        </div>

        {/* Thumbnail Filmstrip Protocol */}
        <div className="no-scrollbar flex justify-center gap-4 overflow-x-auto border-t border-white/5 p-10 md:p-12 z-20">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i)
                resetZoom()
              }}
              className={clsx(
                'relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 p-1 transition-all',
                currentIndex === i
                  ? 'border-pixs-mint bg-pixs-mint/20 scale-110'
                  : 'border-white/5 bg-white/5 hover:border-white/20',
              )}
            >
              {img && !imageErrors[i] ? (
                <img
                  src={img}
                  alt={`${productName} thumbnail ${i + 1}`}
                  className="h-full w-full rounded-lg object-cover"
                  onError={() => handleImageError(i)}
                />
              ) : (
                <BoxFallback className="flex h-full w-full items-center justify-center rounded-lg bg-white/5" iconClassName="h-8 w-8 opacity-20" />
              )}
              {currentIndex === i && (
                <div className="bg-pixs-mint/10 absolute inset-0 flex items-center justify-center">
                  <Maximize2 size={16} className="text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}
        </div>
    </div>
  )
}

export default FullscreenGalleryModal
