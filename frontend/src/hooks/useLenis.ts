import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

let lenisInstance: Lenis | null = null;

/**
 * Initialises a singleton Lenis smooth-scroll instance and drives it
 * via requestAnimationFrame. Safe to call multiple times — subsequent
 * calls reuse the same instance.
 */
export function useLenis(): void {
  useEffect(() => {
    if (lenisInstance) return;

    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Prevent Lenis from hijacking mobile touch momentum
      touchMultiplier: 1.5,
    });

    let rafId: number;

    function raf(time: number) {
      lenisInstance?.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, []);
}
