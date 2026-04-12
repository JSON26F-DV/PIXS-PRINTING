import React from 'react'
import { motion } from 'framer-motion'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import 'react-lazy-load-image-component/src/effects/blur.css'

interface ILogo {
  name: string
  type: string
  logo: string
}

interface IFeaturedBusiness {
  id: number
  name: string
  category: string
  testimonial: string
  image: string
}

const communityLogos: ILogo[] = [
  {
    name: 'Brew & Co.',
    type: 'Café',
    logo: 'https://images.unsplash.com/photo-1542181961-9590d0c79ca9?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Aesthetic Studios',
    type: 'Creative Agency',
    logo: 'https://images.unsplash.com/photo-1560159906-8d14d23253b7?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Urban Threads',
    type: 'Clothing Brand',
    logo: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Lokal Market',
    type: 'Retail',
    logo: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'NextGen Tech',
    type: 'Startup',
    logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Daily Grind',
    type: 'Roastery',
    logo: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=200&h=200',
  },
]

const featuredBusinesses: IFeaturedBusiness[] = [
  {
    id: 1,
    name: 'Macha Milk Tea House',
    category: 'Milk Tea Franchise',
    testimonial:
      '"PIXS has been consistently delivering premium cup prints that perfectly match our brand\'s aesthetic."',
    image:
      'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 2,
    name: 'Loom & Thread',
    category: 'Local Fashion Brand',
    testimonial:
      '"We needed industrial-grade packaging that feels luxurious. PIXS executed our vision flawlessly with zero delays."',
    image:
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 3,
    name: 'Roast Coffee Co.',
    category: 'Independent Café',
    testimonial:
      '"From coffee pouches to carrier bags, the print durability is unmatched. A true partner for growing cafés."',
    image:
      'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800',
  },
]

const PixsCommunitySection: React.FC<{ isLoggedIn: boolean }> = ({
  isLoggedIn,
}) => {
  return (
    <section
      id="pixs-community-section"
      className="pixs-community-wrapper relative mx-4 my-20 overflow-hidden rounded-[40px] bg-slate-50 px-6 py-24 md:mx-0 md:rounded-[80px] md:px-16 md:py-32"
    >
      <div className="pointer-events-none absolute top-0 right-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-200/50 via-slate-50 to-slate-50" />
      <div className="bg-pixs-mint/5 pointer-events-none absolute bottom-20 -left-40 h-96 w-96 rounded-full blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-20 md:space-y-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="pixs-community-header flex flex-col justify-between gap-8 md:flex-row md:items-end md:gap-16"
        >
          <div className="max-w-2xl space-y-6">
            <h2 className="pixs-community-title text-5xl leading-[0.85] font-black tracking-tighter text-slate-900 uppercase italic md:text-7xl">
              Meet the <br />
              <span className="text-pixs-mint decoration-pixs-mint/30 underline decoration-4 underline-offset-[12px]">
                PIXS Community
              </span>
            </h2>
            <p className="pixs-community-subtitle text-sm font-bold tracking-widest text-slate-500 uppercase md:text-lg">
              Brands, cafés, startups, and local businesses that trust PIXS
              Printing
            </p>
          </div>
          <button className="pixs-community-cta group hover:border-pixs-mint hover:bg-pixs-mint flex w-full shrink-0 items-center justify-center gap-3 rounded-full border-2 border-slate-200 bg-white px-8 py-5 text-xs font-black tracking-widest text-slate-900 uppercase shadow-xl shadow-slate-200/50 transition-all hover:scale-105 active:scale-95 md:w-max">
            Explore Partner Stories
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6"
        >
          {communityLogos.map((brand, idx) => (
            <div
              key={idx}
              className="pixs-partner-card group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/50 md:p-8"
            >
              <div className="mb-4 h-12 w-12 overflow-hidden rounded-full border border-slate-50 opacity-70 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0 md:h-16 md:w-16">
                <LazyLoadImage
                  src={brand.logo}
                  alt={brand.name}
                  effect="blur"
                  wrapperClassName="w-full h-full"
                  className="pixs-partner-logo h-full w-full object-cover"
                />
              </div>
              <span className="text-center text-[10px] font-black tracking-tight text-slate-900 uppercase md:text-xs">
                {brand.name}
              </span>
              <span className="mt-1 text-center text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                {brand.type}
              </span>
            </div>
          ))}
        </motion.div>

        <div className="pixs-featured-grid grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
          {featuredBusinesses.map((biz, idx) => (
            <motion.div
              key={biz.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: idx * 0.15 }}
              className={clsx(
                'pixs-feature-card group relative overflow-hidden rounded-[40px] border border-slate-100/50 bg-white shadow-xl shadow-slate-200/40 transition-transform duration-500 md:rounded-[48px]',
                idx === 1
                  ? 'hover:-translate-y-2 md:translate-y-8 md:hover:translate-y-5'
                  : 'hover:-translate-y-3',
              )}
            >
              <div className="pixs-feature-image relative h-48 overflow-hidden bg-slate-100 md:h-64">
                <LazyLoadImage
                  src={biz.image}
                  alt={biz.name}
                  effect="blur"
                  wrapperClassName="w-full h-full"
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                <div className="absolute right-6 bottom-6 left-6">
                  <span className="pixs-feature-category mb-2 inline-block rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[8px] font-black tracking-widest text-white uppercase backdrop-blur-md md:text-[9px]">
                    {biz.category}
                  </span>
                  <h3 className="text-xl font-black tracking-tight text-white uppercase italic md:text-2xl">
                    {biz.name}
                  </h3>
                </div>
              </div>
              <div className="pixs-feature-content space-y-6 p-8 md:p-10">
                <p className="pixs-feature-testimonial relative text-sm leading-relaxed font-bold tracking-wide text-slate-500 italic before:absolute before:-top-4 before:-left-2 before:font-serif before:text-4xl before:text-slate-200 before:content-['\\201C']">
                  {biz.testimonial.replace(/^"|"$/g, '')}
                </p>
                <button className="pixs-feature-link hover:text-pixs-mint group/btn flex items-center gap-2 text-xs font-black tracking-widest text-slate-900 uppercase transition-colors">
                  View Case Study{' '}
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover/btn:translate-x-1"
                  />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="pixs-growth-wrapper relative flex flex-col items-center justify-center overflow-hidden rounded-[40px] border border-slate-800 bg-slate-900 p-12 text-center md:rounded-[64px] md:p-20"
          >
            <div className="from-pixs-mint/10 absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] via-transparent to-transparent opacity-80" />

            <div className="relative z-10 mx-auto max-w-3xl space-y-8">
              <h3 className="pixs-growth-title text-4xl leading-[0.9] font-black tracking-tighter text-white uppercase italic md:text-6xl">
                Let's grow your brand <br className="hidden md:block" />
                <span className="text-pixs-mint">through print.</span>
              </h3>
              <p className="pixs-growth-description mx-auto max-w-xl text-sm font-bold tracking-widest text-slate-400 uppercase md:text-base">
                Join hundreds of businesses that scale their physical presence
                with our industrial-grade output nodes.
              </p>
              <div className="pixs-growth-buttons flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row md:gap-6">
                <button className="bg-pixs-mint shadow-pixs-mint/20 w-full rounded-[24px] px-10 py-5 text-xs font-black tracking-widest text-slate-900 uppercase shadow-xl transition-all hover:scale-105 active:scale-95 sm:w-auto">
                  Start Printing With PIXS
                </button>
                <button className="w-full rounded-[24px] border-2 border-slate-700 bg-transparent px-10 py-5 text-xs font-black tracking-widest text-white uppercase transition-all hover:border-white hover:bg-white hover:text-slate-900 sm:w-auto">
                  Request Quotation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default PixsCommunitySection
