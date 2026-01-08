/**
 * useSwipeDrawer Hook
 *
 * Provides smooth, follow-finger swipe gesture for drawer navigation.
 * Features:
 * - Real-time position tracking during swipe
 * - Velocity-based open/close detection
 * - Backdrop opacity follows drag progress
 * - Respects reduced-motion preference
 * - Supports both open and close gestures
 */

import { useEffect, useCallback, useRef, useState } from 'react';

interface UseSwipeDrawerOptions {
  /** Whether the drawer is currently open */
  isOpen: boolean;
  /** Callback to set drawer open state */
  onOpenChange: (open: boolean) => void;
  /** Width of the drawer in pixels (default: 300) */
  drawerWidth?: number;
  /** Distance from left edge where swipe can start (default: 24px) */
  edgeWidth?: number;
  /** Minimum velocity to trigger open/close (default: 0.3 px/ms) */
  velocityThreshold?: number;
  /** Position threshold to trigger open/close when released (default: 0.4 = 40%) */
  positionThreshold?: number;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
}

interface SwipeState {
  /** Current drag progress (0-1), where 0 is closed and 1 is fully open */
  progress: number;
  /** Whether user is actively dragging */
  isDragging: boolean;
}

export function useSwipeDrawer({
  isOpen,
  onOpenChange,
  drawerWidth = 300,
  edgeWidth = 24,
  velocityThreshold = 0.3,
  positionThreshold = 0.4,
  enabled = true,
}: UseSwipeDrawerOptions): SwipeState {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    progress: isOpen ? 1 : 0,
    isDragging: false,
  });

  // Refs for tracking touch state
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const lastTouchX = useRef<number>(0);
  const lastTouchTime = useRef<number>(0);
  const isTracking = useRef(false);
  const isVerticalScroll = useRef(false);
  const startedFromEdge = useRef(false);
  const startedFromDrawer = useRef(false);

  // Sync progress with isOpen state when not dragging
  useEffect(() => {
    if (!swipeState.isDragging) {
      setSwipeState((prev) => ({
        ...prev,
        progress: isOpen ? 1 : 0,
      }));
    }
  }, [isOpen, swipeState.isDragging]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;

      // Determine if touch started from edge (for opening) or from drawer area (for closing)
      const isFromEdge = !isOpen && x <= edgeWidth;
      const isFromDrawer = isOpen && x <= drawerWidth;

      if (!isFromEdge && !isFromDrawer) return;

      touchStartX.current = x;
      touchStartY.current = y;
      touchStartTime.current = Date.now();
      lastTouchX.current = x;
      lastTouchTime.current = Date.now();
      isTracking.current = true;
      isVerticalScroll.current = false;
      startedFromEdge.current = isFromEdge;
      startedFromDrawer.current = isFromDrawer;
    },
    [enabled, isOpen, edgeWidth, drawerWidth]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isTracking.current) return;

      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      const deltaX = x - touchStartX.current;
      const deltaY = y - touchStartY.current;

      // Check if this is a vertical scroll (first 10px of movement)
      if (!swipeState.isDragging && Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
        isVerticalScroll.current = true;
        isTracking.current = false;
        return;
      }

      // Ignore vertical scrolling
      if (isVerticalScroll.current) return;

      // Start dragging after 10px horizontal movement
      if (!swipeState.isDragging && Math.abs(deltaX) > 10) {
        // Only allow right swipe from edge, or left swipe from drawer
        if (startedFromEdge.current && deltaX < 0) {
          isTracking.current = false;
          return;
        }
        if (startedFromDrawer.current && deltaX > 0) {
          isTracking.current = false;
          return;
        }

        setSwipeState((prev) => ({ ...prev, isDragging: true }));
      }

      if (swipeState.isDragging || Math.abs(deltaX) > 10) {
        // Calculate progress
        let progress: number;

        if (startedFromEdge.current) {
          // Opening: progress = deltaX / drawerWidth
          progress = Math.max(0, Math.min(1, deltaX / drawerWidth));
        } else {
          // Closing: progress = 1 - (-deltaX / drawerWidth)
          progress = Math.max(0, Math.min(1, 1 + deltaX / drawerWidth));
        }

        setSwipeState({ progress, isDragging: true });

        // Update velocity tracking
        lastTouchX.current = x;
        lastTouchTime.current = Date.now();
      }
    },
    [swipeState.isDragging, drawerWidth]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isTracking.current && !swipeState.isDragging) return;

    if (swipeState.isDragging) {
      // Calculate velocity (px/ms)
      const timeDelta = Date.now() - lastTouchTime.current;
      const velocity = timeDelta > 0
        ? (lastTouchX.current - touchStartX.current) / (Date.now() - touchStartTime.current)
        : 0;

      // Determine final state based on velocity and position
      let shouldOpen: boolean;

      if (Math.abs(velocity) >= velocityThreshold) {
        // High velocity: use direction
        shouldOpen = velocity > 0;
      } else {
        // Low velocity: use position threshold
        shouldOpen = swipeState.progress >= positionThreshold;
      }

      onOpenChange(shouldOpen);
    }

    // Reset tracking state
    isTracking.current = false;
    startedFromEdge.current = false;
    startedFromDrawer.current = false;
    setSwipeState((prev) => ({ ...prev, isDragging: false }));
  }, [swipeState.isDragging, swipeState.progress, velocityThreshold, positionThreshold, onOpenChange]);

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
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return swipeState;
}
