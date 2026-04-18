import React, { useState, useCallback } from 'react'
import { Package } from 'lucide-react'

// ─── MODULE-LEVEL failed URL registry ──────────────────────────
// Lives OUTSIDE the component — survives ALL re-renders,
// scroll events, and layout animation cycles.
// Once a URL is added here, it is NEVER retried. Ever.
const failedSrcs = new Set<string>()
// ───────────────────────────────────────────────────────────────

type ImageState = 'loading' | 'loaded' | 'error'

interface ProductImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  skeletonClassName?: string
}

const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  skeletonClassName = '',
}) => {
  // Determine initial state synchronously — no useEffect needed
  // If src is already in the failed registry → error immediately
  // If src is null/undefined → error immediately
  // Otherwise → loading
  const getInitialState = (): ImageState => {
    if (!src) return 'error'
    if (failedSrcs.has(src)) return 'error'
    return 'loading'
  }

  const [imageState, setImageState] = useState<ImageState>(getInitialState)
  const [prevSrc, setPrevSrc] = useState(src)

  if (src !== prevSrc) {
    setPrevSrc(src)
    if (!src || failedSrcs.has(src)) {
      setImageState('error')
    } else {
      setImageState('loading')
    }
  }

  // ── Image event handlers ─────────────────────────────────────
  const handleLoad = useCallback(() => {
    setImageState('loaded')
  }, [])

  const handleError = useCallback(() => {
    if (!src) return
    // Register in the module-level Set — permanent, survives re-renders
    failedSrcs.add(src)
    setImageState('error')
    // NO src assignment. NO retry. DONE.
  }, [src])

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* CSS PULSE SKELETON — shown only while loading */}
      {imageState === 'loading' && (
        <div
          className={`absolute inset-0 animate-pulse bg-slate-100 ${skeletonClassName}`}
          aria-hidden="true"
        />
      )}

      {/* REAL IMAGE — only in DOM when src exists AND not failed */}
      {src && imageState !== 'error' && (
        <img
          key={src} // key forces new img element on src change
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'} ${className} `}
        />
      )}

      {/* FALLBACK — shown when error (null src OR failed src) */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <Package className="group-hover:text-pixs-mint/20 h-12 w-12 text-slate-200 transition-colors" />
        </div>
      )}
    </div>
  )
}

export default React.memo(ProductImage)
