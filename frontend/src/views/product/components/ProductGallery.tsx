import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface ProductGalleryProps {
  mainImage: string
  gallery: string[]
  productName: string
}

const ProductGallery: React.FC<ProductGalleryProps> = ({
  mainImage,
  gallery,
  productName,
}) => {
  const allImages = [mainImage, ...gallery.filter((img) => img !== mainImage)]
  const [activeIndex, setActiveIndex] = useState(0)

  const prev = () =>
    setActiveIndex((i) => (i === 0 ? allImages.length - 1 : i - 1))
  const next = () =>
    setActiveIndex((i) => (i === allImages.length - 1 ? 0 : i + 1))

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="group relative aspect-square overflow-hidden rounded-[40px] border border-slate-100 bg-slate-50 shadow-inner">
        <img
          src={allImages[activeIndex]}
          alt={productName}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {allImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="hover:bg-pixs-mint absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/80 shadow-lg backdrop-blur-md transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="hover:bg-pixs-mint absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/80 shadow-lg backdrop-blur-md transition-all active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="custom-scrollbar flex gap-3 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={clsx(
                'h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all',
                activeIndex === i
                  ? 'border-pixs-mint shadow-pixs-mint/20 shadow-lg'
                  : 'border-transparent opacity-50 hover:opacity-100',
              )}
            >
              <img
                src={img}
                alt={`${productName} angle ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductGallery
