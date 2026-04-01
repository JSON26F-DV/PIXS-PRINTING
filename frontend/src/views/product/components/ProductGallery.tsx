import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface ProductGalleryProps {
  mainImage: string;
  gallery: string[];
  productName: string;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ mainImage, gallery, productName }) => {
  const allImages = [mainImage, ...gallery.filter(img => img !== mainImage)];
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () => setActiveIndex(i => (i === 0 ? allImages.length - 1 : i - 1));
  const next = () => setActiveIndex(i => (i === allImages.length - 1 ? 0 : i + 1));

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-[40px] overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group">
        <img
          src={allImages[activeIndex]}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {allImages.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-pixs-mint transition-all active:scale-90">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-pixs-mint transition-all active:scale-90">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={clsx(
                'flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all',
                activeIndex === i ? 'border-pixs-mint shadow-lg shadow-pixs-mint/20' : 'border-transparent opacity-50 hover:opacity-100'
              )}
            >
              <img src={img} alt={`${productName} angle ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
