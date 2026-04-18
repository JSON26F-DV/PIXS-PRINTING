import React, { useCallback, useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HeroSlide {
  src: string
  title: string
  sub: string
}

interface HeroCarouselProps {
  slides: readonly HeroSlide[]
  onCTA: () => void
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides, onCTA }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 30, // Smooth transition
  })

  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    autoPlayRef.current = setInterval(() => {
      emblaApi?.scrollNext()
    }, 5000)
  }, [emblaApi])

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current)
  }, [])

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (!prefersReduced && emblaApi) {
      startAutoPlay()
    }
    return () => stopAutoPlay()
  }, [emblaApi, startAutoPlay, stopAutoPlay])

  const onPrev = useCallback(() => {
    emblaApi?.scrollPrev()
    stopAutoPlay()
  }, [emblaApi, stopAutoPlay])

  const onNext = useCallback(() => {
    emblaApi?.scrollNext()
    stopAutoPlay()
  }, [emblaApi, stopAutoPlay])

  const onDotClick = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
      stopAutoPlay()
    },
    [emblaApi, stopAutoPlay],
  )

  return (
    <div className="group relative overflow-hidden rounded-[40px] bg-slate-900 shadow-2xl md:rounded-[64px]">
      <div
        className="h-[400px] overflow-hidden md:h-[500px]"
        ref={emblaRef}
        onMouseEnter={stopAutoPlay}
        onMouseLeave={startAutoPlay}
      >
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div
              key={i}
              className="relative h-full min-w-full flex-shrink-0 overflow-hidden"
            >
              <img
                src={slide.src}
                alt={slide.title}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[10000ms] ease-linear group-hover:scale-110"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

              {/* Content Panel */}
              <div className="absolute inset-x-0 bottom-0 flex max-w-4xl flex-col items-start justify-end p-6 sm:p-8 md:p-12 lg:p-20">
                <h2 className="font-display mb-4 text-3xl leading-[0.9] font-black tracking-tighter text-white uppercase italic drop-shadow-2xl sm:text-4xl md:text-5xl lg:text-7xl">
                  {slide.title}
                </h2>
                <p className="font-body mb-6 max-w-[90%] text-xs font-bold tracking-[2px] text-white/70 uppercase drop-shadow-lg sm:text-sm sm:tracking-[4px] md:mb-8 md:max-w-none md:text-lg lg:text-xl">
                  {slide.sub}
                </p>
                <button
                  onClick={onCTA}
                  className="group/btn bg-pixs-mint relative overflow-hidden rounded-[12px] px-6 py-3 text-xs font-black tracking-[4px] text-slate-900 uppercase italic transition-all hover:scale-105 active:scale-95 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-sm md:px-12 md:py-6 md:text-base"
                >
                  <span className="relative z-10">Browse Products</span>
                  <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform group-hover/btn:translate-y-0" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={onPrev}
        className="absolute top-1/2 left-8 z-20 flex -translate-y-1/2 items-center justify-center text-white/40 transition-colors hover:text-white"
        aria-label="Previous slide"
      >
        <ChevronLeft size={48} strokeWidth={2} />
      </button>
      <button
        onClick={onNext}
        className="absolute top-1/2 right-8 z-20 flex -translate-y-1/2 items-center justify-center text-white/40 transition-colors hover:text-white"
        aria-label="Next slide"
      >
        <ChevronRight size={48} strokeWidth={2} />
      </button>

      {/* Dots */}
      <div className="absolute right-8 bottom-8 z-20 flex gap-2 md:right-20 md:bottom-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            className="group h-3 w-8 overflow-hidden rounded-full bg-white/20 transition-all hover:bg-white/40"
            aria-label={`Go to slide ${i + 1}`}
          >
            {/* Active Progress simulation would go here if needed */}
          </button>
        ))}
      </div>
    </div>
  )
}

export default React.memo(HeroCarousel)
