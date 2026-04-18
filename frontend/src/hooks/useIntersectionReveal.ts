import { useEffect, useRef, useState } from 'react'

export const useIntersectionReveal = (options?: IntersectionObserverInit) => {
  const elementRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (isVisible) return // Already visible due to reduced motion preference

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.unobserve(entry.target)
      }
    }, options)

    const currentElement = elementRef.current
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [options, isVisible])

  return { elementRef, isVisible }
}
