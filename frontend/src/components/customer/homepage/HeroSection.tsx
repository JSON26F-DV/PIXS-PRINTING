import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import hero1 from '../../../assets/hero/hero-1.jpg'
import hero2 from '../../../assets/hero/hero-2.jpg'
import hero3 from '../../../assets/hero/hero-3.jpg'

const heroSlides = [
  {
    src: hero1,
    text: 'BLAZING FAST TURNAROUND',
    sub: 'Orders shipped within 24–48 hours.',
  },
  {
    src: hero2,
    text: 'PRECISION PRINT TECHNOLOGY',
    sub: 'Industrial-grade equipment. Zero compromise.',
  },
  {
    src: hero3,
    text: 'QUALITY THAT SCALES',
    sub: 'From 500 to 50,000 units — same standard.',
  },
]

const HeroSection: React.FC = () => {
  const [current, setCurrent] = useState(0)

  const nextSlide = useCallback(() => {
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length)
    }, 300)
  }, [])

  const prevSlide = () => {
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
    }, 300)
  }

  useEffect(() => {
    const timer = setInterval(nextSlide, 3500)
    return () => clearInterval(timer)
  }, [nextSlide])

  const handleArrowClick = (direction: 'prev' | 'next') => {
    if (direction === 'prev') prevSlide()
    else nextSlide()
  }

  const handleBrowseClick = () => {
    const el = document.getElementById('marketplace')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="mb-[-28px] w-full pt-4 md:mb-[-44px] md:pt-6">
      <div className="mx-auto max-w-[1480px] px-4 md:px-10">
        <div className="group relative h-[420px] w-full overflow-hidden rounded-2xl bg-slate-900 md:h-[520px]">
          {heroSlides.map((slide, idx) => (
            <img
              key={idx}
              src={slide.src}
              alt={slide.text}
              loading={idx === 0 ? 'eager' : 'lazy'}
              className={[
                'absolute inset-0 h-full w-full object-cover',
                'transition-opacity duration-600 ease-in-out',
                idx === current ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

          <div className="absolute bottom-8 left-6 z-10 max-w-4xl md:bottom-12 md:left-10">
            <div className="font-[\'Barlow_Condensed\'] text-sm font-bold tracking-[4px] text-white/70 uppercase drop-shadow-lg md:text-xl">
              {heroSlides[current].sub}
            </div>
            <h1 className="mt-3 font-[\'Bebas_Neue\'] text-4xl leading-[0.9] font-black tracking-tighter text-white uppercase italic drop-shadow-2xl md:text-7xl">
              {heroSlides[current].text}
            </h1>

            <button
              type="button"
              onClick={handleBrowseClick}
              className={[
                'mt-8 inline-flex items-center justify-center',
                'bg-pixs-mint rounded-xl px-7 py-3 text-slate-900',
                'text-sm font-black tracking-[4px] uppercase italic',
                'md:px-10 md:py-4',
                'active:scale-95',
              ].join(' ')}
            >
              Browse Products
            </button>
          </div>

          <div className="absolute inset-y-0 left-2 z-20 flex items-center md:left-4">
            <button
              type="button"
              onClick={() => handleArrowClick('prev')}
              className="p-2.5 text-white/80 hover:text-white active:scale-90 md:p-3"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-2 z-20 flex items-center md:right-4">
            <button
              type="button"
              onClick={() => handleArrowClick('next')}
              className="p-2.5 text-white/80 hover:text-white active:scale-90 md:p-3"
              aria-label="Next slide"
            >
              <ChevronRight size={24} strokeWidth={3} />
            </button>
          </div>

          <div className="absolute right-6 bottom-6 z-20 flex gap-2 md:right-10 md:bottom-10">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={[
                  'h-2 w-7 rounded-full',
                  idx === current ? 'bg-white/70' : 'bg-white/20',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
