import React, { useState } from 'react'
import { clsx } from 'clsx'
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import BoxFallback from '../../../components/common/BoxFallback'

interface ImageGalleryProps {
  mainImage: string
  gallery: string[]
  productName: string
  onImageClick?: (index: number) => void
}

/**
 * Enterprise Image Gallery for the Product Information Page.
 * Responsive mosaic layout with focus zoom and high-end transitons.
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({
  mainImage,
  gallery,
  productName,
  onImageClick,
}) => {
  const images = [mainImage, ...gallery]
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const next = () => setActiveIndex((prev) => (prev + 1) % images.length)
  const prev = () =>
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length)

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }))
  }

  const touchStartRef = React.useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = e.touches[0].clientX
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current !== null && e.changedTouches.length === 1) {
      const diffX = e.changedTouches[0].clientX - touchStartRef.current
      if (diffX > 50) {
        prev()
      } else if (diffX < -50) {
        next()
      }
    }
    touchStartRef.current = null
  }

  return (
    <div className="space-y-6">
      {/* Primary Display Logic */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="group hover:shadow-pixs-mint/5 relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl md:rounded-[48px] border border-slate-100 bg-white p-2 md:p-4 shadow-2xl shadow-slate-200/50 transition-all duration-700 md:aspect-[3/4]"
        onClick={() => onImageClick?.(activeIndex)}
      >
        <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-[40px] bg-slate-50">
          {images[activeIndex] && !imageErrors[activeIndex] ? (
            <img
              src={images[activeIndex]}
              alt={`${productName} View ${activeIndex + 1}`}
              className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-110"
              onError={() => handleImageError(activeIndex)}
            />
          ) : (
            <BoxFallback />
          )}

          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="scale-50 rounded-full bg-white/80 p-4 shadow-2xl backdrop-blur-md transition-transform duration-500 group-hover:scale-100">
              <Eye className="text-slate-900" size={24} />
            </div>
          </div>
        </div>

        {/* Dynamic Overlay Controls */}
        <div className="absolute top-8 left-8 -translate-x-4 rounded-2xl border border-slate-50 bg-white/90 p-3 opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover:translate-x-0 group-hover:opacity-100">
          <Search size={18} className="text-slate-400" />
        </div>

        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 translate-y-4 items-center gap-3 rounded-[24px] border border-slate-50 bg-white/90 px-6 py-3 opacity-0 shadow-2xl backdrop-blur-md transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="mx-2 text-[10px] font-black tracking-widest text-slate-900 uppercase">
            {activeIndex + 1} / {images.length}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Identification Sequence */}
      <div className="grid grid-cols-4 gap-2.5 md:flex md:gap-4 md:overflow-x-auto md:pb-4">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={clsx(
              'relative aspect-square w-full overflow-hidden rounded-2xl border transition-all md:min-w-[100px] md:rounded-3xl md:p-1.5 md:border-2',
              activeIndex === idx
                ? 'border-pixs-mint shadow-pixs-mint/10 scale-105 bg-white shadow-xl'
                : 'border-slate-50 bg-slate-50 hover:border-slate-200 hover:bg-white',
            )}
          >
            {img && !imageErrors[idx] ? (
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="h-full w-full rounded-xl md:rounded-2xl object-cover"
                onError={() => handleImageError(idx)}
              />
            ) : (
              <BoxFallback className="flex h-full w-full items-center justify-center rounded-xl md:rounded-2xl bg-slate-100" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ImageGallery
