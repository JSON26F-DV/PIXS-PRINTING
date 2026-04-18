import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Layers } from 'lucide-react'
import lottie, { type AnimationItem } from 'lottie-web'
import skeletonAnimation from '../../assets/skeleton-loading.json'

// ─── MODULE-LEVEL failed URL registry ──────────────────────────
const failedSrcs = new Set<string>()
// ───────────────────────────────────────────────────────────────

type ImageState = 'loading' | 'loaded' | 'error'

interface CategoryImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  skeletonClassName?: string
}

const CategoryImage: React.FC<CategoryImageProps> = ({
  src,
  alt,
  className = '',
  skeletonClassName = '',
}) => {
  const getInitialState = (): ImageState => {
    if (!src) return 'error'
    if (failedSrcs.has(src)) return 'error'
    return 'loading'
  }

  const [imageState, setImageState] = useState<ImageState>(getInitialState)
  const [prevSrc, setPrevSrc] = useState(src)

  // ── Adjust state during render when src changes ───────────────
  // This avoids cascading render warnings by letting React
  // retry the render immediately with the new state.
  if (src !== prevSrc) {
    setPrevSrc(src)
    if (!src || failedSrcs.has(src)) {
      setImageState('error')
    } else {
      setImageState('loading')
    }
  }

  const lottieContainerRef = useRef<HTMLDivElement>(null)
  const lottieInstance = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (imageState !== 'loading' || !lottieContainerRef.current) return

    if (lottieInstance.current) {
      lottieInstance.current.destroy()
      lottieInstance.current = null
    }

    lottieInstance.current = lottie.loadAnimation({
      container: lottieContainerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: skeletonAnimation,
    })

    return () => {
      if (lottieInstance.current) {
        lottieInstance.current.destroy()
        lottieInstance.current = null
      }
    }
  }, [imageState])

  const handleLoad = useCallback(() => {
    setImageState('loaded')
  }, [])

  const handleError = useCallback(() => {
    if (!src) return
    failedSrcs.add(src)
    setImageState('error')
  }, [src])

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* LOTTIE SKELETON */}
      {imageState === 'loading' && (
        <div
          ref={lottieContainerRef}
          className={`absolute inset-0 ${skeletonClassName}`}
          aria-hidden="true"
        />
      )}

      {/* REAL IMAGE */}
      {src && imageState !== 'error' && (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 group-hover:scale-110 ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'} ${className} `}
        />
      )}

      {/* FALLBACK */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
          <Layers className="h-12 w-12 text-slate-300" />
        </div>
      )}
    </div>
  )
}

export default React.memo(CategoryImage)
