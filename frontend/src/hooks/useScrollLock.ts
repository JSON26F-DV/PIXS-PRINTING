import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a component is mounted.
 * Useful for modals, drawers, and overlays.
 */
export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) return;

    // Get original styles
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Check if already locked by another instance
    const alreadyLocked = originalStyle === 'hidden';
    
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (!alreadyLocked) {
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    }

    return () => {
      // Small delay to check if another modal is about to open or still open
      // In a real multi-modal app, a global state or portal manager is better,
      // but for this scope, we just revert if we were the one who locked it.
      if (!isLocked) return;
      
      // If we are unmounting, we should only unlock if no other locked elements exist.
      // But since we don't have a registry, we'll just check if we should revert.
      // A quick fix for siblings:
      const modals = document.querySelectorAll('[data-modal-open="true"]');
      if (modals.length <= 1) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [isLocked]);
};
