/**
 * useSwipeDrawer Hook
 *
 * Provides smooth, follow-finger swipe gesture for drawer navigation.
 * Features:
 * - Real-time position tracking during swipe
 * - Velocity-based open/close detection
 * - Backdrop opacity follows drag progress
 * - Respects reduced-motion preference (animation only, gesture preserved)
 * - Supports both open and close gestures
 * - Direct DOM manipulation via CSS variables for 120Hz performance
 * - GPU-accelerated transforms with will-change hints
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';

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
  /** Computed overlay styles for the backdrop */
  overlayStyle: React.CSSProperties | undefined;
  /** Computed drawer styles for the panel */
  drawerStyle: React.CSSProperties | undefined;
}

/**
 * High-refresh-rate optimized DOM refs for direct manipulation.
 * Using CSS variables bypasses React reconciliation for smoother 120Hz animation.
 */
interface SwipeRefs {
  overlayRef: React.RefObject<HTMLElement | null>;
  drawerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Calculate drawer styles based on drag state
 * Supports floating drawer design with margin offset
 * Uses will-change hints for GPU acceleration on high-refresh displays
 */
export function calculateDrawerStyles(
  progress: number | undefined,
  isDragging: boolean
): { overlayStyle?: React.CSSProperties; drawerStyle?: React.CSSProperties } {
  if (!isDragging || progress === undefined) return {};

  // For floating drawer: translate from -100% (hidden) to 0% (visible)
  // The drawer component will handle the margin offset
  const translatePercent = (progress - 1) * 100;

  return {
    overlayStyle: {
      opacity: progress * 0.3,
      transition: 'none',
      willChange: 'opacity',
    },
    drawerStyle: {
      transform: `translateX(${translatePercent}%)`,
      transition: 'none',
      willChange: 'transform',
    },
  };
}

/**
 * Apply swipe progress directly to DOM elements via CSS custom properties.
 * This bypasses React's reconciliation for maximum performance on 120Hz displays.
 */
function applySwipeProgressToDOM(
  overlayEl: HTMLElement | null,
  drawerEl: HTMLElement | null,
  progress: number,
  isDragging: boolean
): void {
  if (!isDragging) {
    // Clear will-change when not dragging to free GPU memory
    if (overlayEl) {
      overlayEl.style.opacity = '';
      overlayEl.style.transition = '';
      overlayEl.style.willChange = '';
    }
    if (drawerEl) {
      drawerEl.style.transform = '';
      drawerEl.style.transition = '';
      drawerEl.style.willChange = '';
    }
    return;
  }

  const translatePercent = (progress - 1) * 100;

  if (overlayEl) {
    overlayEl.style.opacity = String(progress * 0.3);
    overlayEl.style.transition = 'none';
    overlayEl.style.willChange = 'opacity';
  }

  if (drawerEl) {
    drawerEl.style.transform = `translateX(${translatePercent}%)`;
    drawerEl.style.transition = 'none';
    drawerEl.style.willChange = 'transform';
  }
}

export function useSwipeDrawer({
  isOpen,
  onOpenChange,
  drawerWidth = 300,
  edgeWidth = 24,
  velocityThreshold = 0.3,
  positionThreshold = 0.4,
  enabled = true,
}: UseSwipeDrawerOptions): SwipeState & SwipeRefs {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    progress: isOpen ? 1 : 0,
    isDragging: false,
    overlayStyle: undefined,
    drawerStyle: undefined,
  });

  // Direct DOM refs for 120Hz-optimized updates (bypasses React reconciliation)
  const overlayRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);

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
  const lastProgress = useRef<number>(0);
  const rafId = useRef<number | null>(null);

  // Sync progress with isOpen state when not dragging
  useEffect(() => {
    if (!swipeState.isDragging) {
      setSwipeState((prev) => ({
        ...prev,
        progress: isOpen ? 1 : 0,
        overlayStyle: undefined,
        drawerStyle: undefined,
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

      // When drawer is open, don't track touches on interactive elements
      // This allows normal click/tap behavior on links, buttons, etc.
      if (isFromDrawer && e.target instanceof Element) {
        const interactiveSelector = 'a, button, input, select, textarea, [role="button"], [tabindex]';
        if (e.target.closest(interactiveSelector)) {
          return;
        }
      }

      const now = performance.now();
      touchStartX.current = x;
      touchStartY.current = y;
      touchStartTime.current = now;
      lastTouchX.current = x;
      lastTouchTime.current = now;
      lastProgress.current = isOpen ? 1 : 0;
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

        // Cancel any pending rAF to prevent frame buildup
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
        }

        // Schedule update on next animation frame for 120Hz sync
        rafId.current = requestAnimationFrame(() => {
          // Direct DOM manipulation for maximum performance on high-refresh displays
          // This bypasses React reconciliation entirely for smoother 120Hz animation
          if (overlayRef.current || drawerRef.current) {
            applySwipeProgressToDOM(
              overlayRef.current,
              drawerRef.current,
              progress,
              true
            );
            // Only update React state for progress tracking, skip style updates
            // This minimizes re-renders during gesture
            setSwipeState((prev) => ({
              ...prev,
              progress,
              isDragging: true,
            }));
          } else {
            // Fallback: update React state with styles if refs not available
            const styles = calculateDrawerStyles(progress, true);
            setSwipeState({
              progress,
              isDragging: true,
              overlayStyle: styles.overlayStyle,
              drawerStyle: styles.drawerStyle,
            });
          }

          lastProgress.current = progress;
          rafId.current = null;
        });

        // Update velocity tracking
        lastTouchX.current = x;
        lastTouchTime.current = performance.now();
      }
    },
    [swipeState.isDragging, drawerWidth]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isTracking.current && !swipeState.isDragging) return;

    // Cancel any pending rAF
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    if (swipeState.isDragging) {
      // Calculate velocity (px/ms)
      const now = performance.now();
      const timeDelta = now - lastTouchTime.current;
      const totalTime = now - touchStartTime.current;
      const velocity = timeDelta > 0 && totalTime > 0
        ? (lastTouchX.current - touchStartX.current) / totalTime
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

      // Clear direct DOM styles before transition (let CSS animations take over)
      applySwipeProgressToDOM(
        overlayRef.current,
        drawerRef.current,
        0,
        false
      );

      onOpenChange(shouldOpen);
    }

    // Reset tracking state
    isTracking.current = false;
    startedFromEdge.current = false;
    startedFromDrawer.current = false;
    setSwipeState((prev) => ({
      ...prev,
      isDragging: false,
      overlayStyle: undefined,
      drawerStyle: undefined,
    }));
  }, [swipeState.isDragging, swipeState.progress, velocityThreshold, positionThreshold, onOpenChange]);

  useEffect(() => {
    if (!enabled) return;

    // Only add listeners on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    // Note: We don't disable gestures for reduced motion preference
    // Consumers can check window.matchMedia('(prefers-reduced-motion: reduce)')
    // to skip visual transitions while keeping gesture functionality

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);

      // Cancel any pending rAF on cleanup
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ...swipeState,
    overlayRef,
    drawerRef,
  };
}
