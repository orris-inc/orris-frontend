/**
 * useSwipeToOpen Hook
 *
 * Detects swipe gestures from the left edge of the screen to open a drawer/sidebar.
 * Only active on touch devices (mobile).
 *
 * Features:
 * - Detects swipes starting from the left edge (configurable)
 * - Configurable swipe threshold distance
 * - Ignores vertical scrolling
 * - Respects reduced-motion preference
 */

import { useEffect, useCallback, useRef } from 'react';

interface UseSwipeToOpenOptions {
  /** Callback when swipe to open is triggered */
  onOpen: () => void;
  /** Whether the drawer is currently open */
  isOpen: boolean;
  /** Distance from left edge where swipe can start (default: 20px) */
  edgeWidth?: number;
  /** Minimum swipe distance to trigger open (default: 50px) */
  threshold?: number;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
}

export function useSwipeToOpen({
  onOpen,
  isOpen,
  edgeWidth = 20,
  threshold = 50,
  enabled = true,
}: UseSwipeToOpenOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isEdgeSwipe = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isOpen) return;

      const touch = e.touches[0];
      // Only track if touch starts near the left edge
      if (touch.clientX <= edgeWidth) {
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        isEdgeSwipe.current = true;
      }
    },
    [enabled, isOpen, edgeWidth]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isEdgeSwipe.current || touchStartX.current === null || touchStartY.current === null) {
        return;
      }

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // If vertical movement is greater than horizontal, cancel the swipe
      // This prevents interfering with scrolling
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        isEdgeSwipe.current = false;
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      // If we've swiped right past the threshold, trigger open
      if (deltaX >= threshold) {
        onOpen();
        isEdgeSwipe.current = false;
        touchStartX.current = null;
        touchStartY.current = null;
      }
    },
    [threshold, onOpen]
  );

  const handleTouchEnd = useCallback(() => {
    // Reset state on touch end
    isEdgeSwipe.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Only add listeners on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
