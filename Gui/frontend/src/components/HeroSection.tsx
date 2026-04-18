import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const heroSlides = [
  {
    src: "../assets/heroes/fast.jpg", // placeholder for fast.jpg
    text: "BLAZING FAST TURNAROUND",
    sub: "Orders shipped within 24–48 hours.",
  },
  {
    src: "https://images.unsplash.com/photo-1598331668826-20cecc596b86?q=80&w=2070&auto=format&fit=crop", // placeholder for printing.jpg
    text: "PRECISION PRINT TECHNOLOGY",
    sub: "Industrial-grade equipment. Zero compromise.",
  },
  {
    src: "https://images.unsplash.com/photo-1530124560676-5f7bd4887ad5?q=80&w=2070&auto=format&fit=crop", // placeholder for quality.png
    text: "QUALITY THAT SCALES",
    sub: "From 500 to 50,000 units — same standard.",
  },
];

const HeroSection: React.FC = () => {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 300); // Start transition slightly before switch
  }, []);

  const prevSlide = () => {
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    }, 300);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 3500);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleArrowClick = (direction: "prev" | "next") => {
    if (direction === "prev") prevSlide();
    else nextSlide();
  };

  const handleBrowseClick = () => {
    const el = document.getElementById("marketplace");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="w-full pt-4 md:pt-6 mb-[-28px] md:mb-[-44px]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-10">
        <div className="group relative w-full h-[420px] md:h-[520px] overflow-hidden rounded-2xl bg-slate-900">
          {/* Real Image Tags with Crossfade */}
          {heroSlides.map((slide, idx) => (
            <img
              key={idx}
              src={slide.src}
              alt={slide.text}
              loading={idx === 0 ? "eager" : "lazy"}
              className={[
                "absolute inset-0 w-full h-full object-cover",
                "transition-opacity duration-600 ease-in-out",
                idx === current ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
          ))}

          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

          {/* Text Overlay (Bottom Left) */}
          <div className="absolute bottom-8 md:bottom-12 left-6 md:left-10 z-10 max-w-4xl">
            <div className="text-white/70 text-sm md:text-xl font-bold uppercase tracking-[4px] drop-shadow-lg font-['Barlow_Condensed']">
              {heroSlides[current].sub}
            </div>
            <h1 className="mt-3 text-white text-4xl md:text-7xl font-['Bebas_Neue'] font-black italic uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
              {heroSlides[current].text}
            </h1>

            <button
              type="button"
              onClick={handleBrowseClick}
              className={[
                "mt-8 inline-flex items-center justify-center",
                "px-7 py-3 md:px-10 md:py-4",
                "rounded-xl bg-pixs-mint text-slate-900",
                "uppercase italic text-sm font-black tracking-[4px]",
                "active:scale-95",
              ].join(" ")}
            >
              Browse Products
            </button>
          </div>

          {/* Manual Navigation Arrows */}
          <div className="absolute inset-y-0 left-2 md:left-4 flex items-center z-20">
            <button
              type="button"
              onClick={() => handleArrowClick("prev")}
              className={[
                "p-2.5 md:p-3",
                "text-white/80 hover:text-white",
                "active:scale-90",
              ].join(" ")}
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-2 md:right-4 flex items-center z-20">
            <button
              type="button"
              onClick={() => handleArrowClick("next")}
              className={[
                "p-2.5 md:p-3",
                "text-white/80 hover:text-white",
                "active:scale-90",
              ].join(" ")}
              aria-label="Next slide"
            >
              <ChevronRight size={24} strokeWidth={3} />
            </button>
          </div>

          {/* Progress Dots */}
          <div className="absolute bottom-6 md:bottom-10 right-6 md:right-10 flex gap-2 z-20">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={[
                  "h-2 w-7 rounded-full",
                  idx === current ? "bg-white/70" : "bg-white/20",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
