import { useState, useEffect, useRef, useCallback } from 'react'

interface UseIntersectionRevealOptions extends IntersectionObserverInit {
  triggerOnce?: boolean
}

export function useIntersectionReveal<T extends Element>(
  options: UseIntersectionRevealOptions = {}
) {
  const { triggerOnce = false, ...observerOptions } = options
  const ref = useRef<T>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const hasTriggered = useRef(false)

  const updateIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (triggerOnce && hasTriggered.current) return
    
    if (entry.isIntersecting) {
      if (triggerOnce) {
        hasTriggered.current = true
      }
      setIsIntersecting(true)
    } else if (!triggerOnce) {
      setIsIntersecting(false)
    }
  }, [triggerOnce])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(updateIntersection, {
      root: observerOptions.root,
      rootMargin: observerOptions.rootMargin,
      threshold: observerOptions.threshold,
    })
    observer.observe(element)

    // CLEANUP: This is the key fix!
    return () => {
      observer.disconnect()
    }
  }, [updateIntersection, observerOptions.root, observerOptions.rootMargin, observerOptions.threshold])

  return [ref, isIntersecting] as const
}
