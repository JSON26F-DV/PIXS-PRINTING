import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface ImageGalleryProps {
  mainImage: string;
  gallery: string[];
  productName: string;
}

/**
 * Enterprise Image Gallery for the Product Information Page.
 * Responsive mosaic layout with focus zoom and high-end transitons.
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({ mainImage, gallery, productName }) => {
  const images = [mainImage, ...gallery];
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="space-y-6">
      {/* Primary Display Logic */}
      <div className="relative aspect-[4/5] md:aspect-[3/4] bg-white rounded-[48px] overflow-hidden group shadow-2xl shadow-slate-200/50 border border-slate-100 p-4 transition-all duration-700 hover:shadow-pixs-mint/5">
        <div className="w-full h-full rounded-[40px] overflow-hidden bg-slate-50 relative">
          <img
            src={images[activeIndex]}
            alt={`${productName} View ${activeIndex + 1}`}
            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
          />
          
          <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <div className="bg-white/80 backdrop-blur-md p-4 rounded-full shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500">
               <Eye className="text-slate-900" size={24} />
             </div>
          </div>
        </div>

        {/* Dynamic Overlay Controls */}
        <div className="absolute top-8 left-8 p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-50 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
          <Search size={18} className="text-slate-400" />
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-3 rounded-[24px] shadow-2xl border border-slate-50 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
          <button onClick={prev} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"><ChevronLeft size={20} /></button>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 mx-2">{activeIndex + 1} / {images.length}</span>
          <button onClick={next} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* Grid Identification Sequence */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={clsx(
              'relative min-w-[80px] md:min-w-[100px] aspect-square rounded-3xl overflow-hidden border-2 transition-all p-1.5',
              activeIndex === idx 
                ? 'border-pixs-mint bg-white shadow-xl shadow-pixs-mint/10 scale-105' 
                : 'border-slate-50 hover:border-slate-200 bg-slate-50 hover:bg-white'
            )}
          >
            <img
              src={img}
              alt={`${productName} thumbnail ${idx + 1}`}
              className="w-full h-full object-cover rounded-2xl"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
