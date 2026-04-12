import React, { useState } from 'react'
import { clsx } from 'clsx'
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

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

  const next = () => setActiveIndex((prev) => (prev + 1) % images.length)
  const prev = () =>
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div className="space-y-6">
      {/* Primary Display Logic */}
      <div
        className="group hover:shadow-pixs-mint/5 relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[48px] border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-200/50 transition-all duration-700 md:aspect-[3/4]"
        onClick={() => onImageClick?.(activeIndex)}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[40px] bg-slate-50">
          <img
            src={images[activeIndex]}
            alt={`${productName} View ${activeIndex + 1}`}
            className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-110"
          />

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
            onClick={prev}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="mx-2 text-[10px] font-black tracking-widest text-slate-900 uppercase">
            {activeIndex + 1} / {images.length}
          </span>
          <button
            onClick={next}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Identification Sequence */}
      <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-4">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={clsx(
              'relative aspect-square min-w-[80px] overflow-hidden rounded-3xl border-2 p-1.5 transition-all md:min-w-[100px]',
              activeIndex === idx
                ? 'border-pixs-mint shadow-pixs-mint/10 scale-105 bg-white shadow-xl'
                : 'border-slate-50 bg-slate-50 hover:border-slate-200 hover:bg-white',
            )}
          >
            <img
              src={img}
              alt={`${productName} thumbnail ${idx + 1}`}
              className="h-full w-full rounded-2xl object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default ImageGallery
