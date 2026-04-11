import React from 'react';
import { motion } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface ILogo {
  name: string;
  type: string;
  logo: string;
}

interface IFeaturedBusiness {
  id: number;
  name: string;
  category: string;
  testimonial: string;
  image: string;
}

const communityLogos: ILogo[] = [
  { name: 'Brew & Co.', type: 'Café', logo: 'https://images.unsplash.com/photo-1542181961-9590d0c79ca9?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Aesthetic Studios', type: 'Creative Agency', logo: 'https://images.unsplash.com/photo-1560159906-8d14d23253b7?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Urban Threads', type: 'Clothing Brand', logo: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Lokal Market', type: 'Retail', logo: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'NextGen Tech', type: 'Startup', logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Daily Grind', type: 'Roastery', logo: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=200&h=200' },
];

const featuredBusinesses: IFeaturedBusiness[] = [
  {
    id: 1,
    name: 'Macha Milk Tea House',
    category: 'Milk Tea Franchise',
    testimonial: '"PIXS has been consistently delivering premium cup prints that perfectly match our brand\'s aesthetic."',
    image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 2,
    name: 'Loom & Thread',
    category: 'Local Fashion Brand',
    testimonial: '"We needed industrial-grade packaging that feels luxurious. PIXS executed our vision flawlessly with zero delays."',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 3,
    name: 'Roast Coffee Co.',
    category: 'Independent Café',
    testimonial: '"From coffee pouches to carrier bags, the print durability is unmatched. A true partner for growing cafés."',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800',
  }
];

const PixsCommunitySection: React.FC<{ isLoggedIn: boolean }> = ({ isLoggedIn }) => {
  return (
    <section id="pixs-community-section" className="pixs-community-wrapper px-6 md:px-16 py-24 md:py-32 bg-slate-50 relative overflow-hidden rounded-[40px] md:rounded-[80px] mx-4 md:mx-0 my-20">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-200/50 via-slate-50 to-slate-50 pointer-events-none" />
      <div className="absolute -left-40 bottom-20 w-96 h-96 bg-pixs-mint/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-20 md:space-y-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="pixs-community-header flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-16"
        >
          <div className="space-y-6 max-w-2xl">
            <h2 className="pixs-community-title text-5xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase italic leading-[0.85]">
              Meet the <br/>
              <span className="text-pixs-mint underline decoration-pixs-mint/30 decoration-4 underline-offset-[12px]">PIXS Community</span>
            </h2>
            <p className="pixs-community-subtitle text-sm md:text-lg font-bold tracking-widest text-slate-500 uppercase">
              Brands, cafés, startups, and local businesses that trust PIXS Printing
            </p>
          </div>
          <button className="pixs-community-cta group flex items-center justify-center gap-3 bg-white border-2 border-slate-200 px-8 py-5 rounded-full text-xs font-black tracking-widest text-slate-900 uppercase hover:border-pixs-mint hover:bg-pixs-mint transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200/50 w-full md:w-max shrink-0">
            Explore Partner Stories
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {communityLogos.map((brand, idx) => (
            <div key={idx} className="pixs-partner-card group flex flex-col items-center justify-center p-6 md:p-8 bg-white border border-slate-100 rounded-[28px] hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 cursor-pointer relative overflow-hidden">
               <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden mb-4 border border-slate-50 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                 <LazyLoadImage
                   src={brand.logo}
                   alt={brand.name}
                   effect="blur"
                   wrapperClassName="w-full h-full"
                   className="pixs-partner-logo w-full h-full object-cover"
                 />
               </div>
               <span className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-tight text-center">{brand.name}</span>
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">{brand.type}</span>
            </div>
          ))}
        </motion.div>

        <div className="pixs-featured-grid grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {featuredBusinesses.map((biz, idx) => (
            <motion.div 
              key={biz.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: idx * 0.15 }}
              className={clsx(
                "pixs-feature-card group relative bg-white rounded-[40px] md:rounded-[48px] overflow-hidden border border-slate-100/50 shadow-xl shadow-slate-200/40 transition-transform duration-500",
                idx === 1 ? 'md:translate-y-8 hover:-translate-y-2 md:hover:translate-y-5' : 'hover:-translate-y-3'
              )}
            >
               <div className="pixs-feature-image relative h-48 md:h-64 overflow-hidden bg-slate-100">
                  <LazyLoadImage
                    src={biz.image}
                    alt={biz.name}
                    effect="blur"
                    wrapperClassName="w-full h-full"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="pixs-feature-category inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] md:text-[9px] font-black text-white tracking-widest uppercase mb-2 border border-white/30">
                      {biz.category}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight">{biz.name}</h3>
                  </div>
               </div>
               <div className="pixs-feature-content p-8 md:p-10 space-y-6">
                 <p className="pixs-feature-testimonial text-sm text-slate-500 font-bold italic tracking-wide leading-relaxed relative before:content-['\\201C'] before:absolute before:-top-4 before:-left-2 before:text-4xl before:text-slate-200 before:font-serif">
                   {biz.testimonial.replace(/^"|"$/g, '')}
                 </p>
                 <button className="pixs-feature-link flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest hover:text-pixs-mint transition-colors group/btn">
                   View Case Study <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                 </button>
               </div>
            </motion.div>
          ))}
        </div>

        {!isLoggedIn && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="pixs-growth-wrapper bg-slate-900 rounded-[40px] md:rounded-[64px] p-12 md:p-20 text-center relative overflow-hidden flex flex-col items-center justify-center border border-slate-800"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pixs-mint/10 via-transparent to-transparent opacity-80" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h3 className="pixs-growth-title text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-[0.9]">
                Let's grow your brand <br className="hidden md:block"/>
                <span className="text-pixs-mint">through print.</span>
              </h3>
              <p className="pixs-growth-description text-sm md:text-base font-bold text-slate-400 uppercase tracking-widest max-w-xl mx-auto">
                Join hundreds of businesses that scale their physical presence with our industrial-grade output nodes. 
              </p>
              <div className="pixs-growth-buttons flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-6">
                <button className="w-full sm:w-auto bg-pixs-mint px-10 py-5 rounded-[24px] text-xs font-black text-slate-900 uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pixs-mint/20">
                  Start Printing With PIXS
                </button>
                <button className="w-full sm:w-auto bg-transparent border-2 border-slate-700 hover:border-white px-10 py-5 rounded-[24px] text-xs font-black text-white uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">
                  Request Quotation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PixsCommunitySection;
