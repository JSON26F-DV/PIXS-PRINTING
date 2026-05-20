import { useEffect, useCallback, useRef } from 'react';

interface UseModalBehaviorProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnEsc?: boolean;
}

/**
 * Hook to handle common modal behaviors:
 * 1. Escape key to close
 * 2. Click outside logic (optional, usually handled by backdrop)
 * 3. Double-click prevention (by providing a debounced open state or similar)
 */
export const useModalBehavior = ({
  isOpen,
  onClose,
  closeOnEsc = true,
}: UseModalBehaviorProps) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose, closeOnEsc]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Ref to track if modal is currently transitioning to prevent spam
  const isTransitioning = useRef(false);

  const safeClose = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    onClose();
    // Reset after some time if needed, but usually onUnmount handles it
    setTimeout(() => {
      isTransitioning.current = false;
    }, 300);
  }, [onClose]);

  return {
    safeClose,
  };
};
