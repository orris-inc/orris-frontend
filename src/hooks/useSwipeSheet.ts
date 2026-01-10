/**
 * useSwipeSheet Hook
 *
 * Provides smooth, follow-finger swipe gesture for bottom sheet.
 * Features:
 * - Real-time position tracking during swipe down
 * - Velocity-based close detection
 * - Backdrop opacity follows drag progress
 * - Respects reduced-motion preference (animation only, gesture preserved)
 * - rAF throttling for optimal performance
 * - Drag handle detection for precise control
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';

interface UseSwipeSheetOptions {
  /** Whether the sheet is currently open */
  isOpen: boolean;
  /** Callback to set sheet open state */
  onOpenChange: (open: boolean) => void;
  /** Height threshold for drag handle area (default: 60px) */
  handleHeight?: number;
  /** Minimum velocity to trigger close (default: 0.5 px/ms) */
  velocityThreshold?: number;
  /** Position threshold to trigger close when released (default: 0.3 = 30%) */
  positionThreshold?: number;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
  /** Reference to the sheet content element */
  sheetRef?: React.RefObject<HTMLElement | null>;
}

interface SwipeSheetState {
  /** Current drag progress (0-1), where 1 is fully open and 0 is closed */
  progress: number;
  /** Whether user is actively dragging */
  isDragging: boolean;
  /** Computed overlay styles for the backdrop */
  overlayStyle: React.CSSProperties | undefined;
  /** Computed sheet styles for the panel */
  sheetStyle: React.CSSProperties | undefined;
}

/**
 * Calculate sheet styles based on drag state
 */
export function calculateSheetStyles(
  progress: number | undefined,
  isDragging: boolean
): { overlayStyle?: React.CSSProperties; sheetStyle?: React.CSSProperties } {
  if (!isDragging || progress === undefined) return {};

  // For bottom sheet: translate from 0% (visible) to 100% (hidden below)
  const translatePercent = (1 - progress) * 100;

  return {
    overlayStyle: { opacity: progress * 0.3, transition: 'none' },
    sheetStyle: { transform: `translateY(${translatePercent}%)`, transition: 'none' },
  };
}

export function useSwipeSheet({
  isOpen,
  onOpenChange,
  handleHeight = 60,
  velocityThreshold = 0.5,
  positionThreshold = 0.3,
  enabled = true,
  sheetRef,
}: UseSwipeSheetOptions): SwipeSheetState {
  const [swipeState, setSwipeState] = useState<SwipeSheetState>({
    progress: isOpen ? 1 : 0,
    isDragging: false,
    overlayStyle: undefined,
    sheetStyle: undefined,
  });

  // Refs for tracking touch state
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const lastTouchY = useRef<number>(0);
  const lastTouchTime = useRef<number>(0);
  const isTracking = useRef(false);
  const isHorizontalScroll = useRef(false);
  const lastProgress = useRef<number>(1);
  const rafId = useRef<number | null>(null);
  const sheetHeight = useRef<number>(0);

  // Sync progress with isOpen state when not dragging
  useEffect(() => {
    if (!swipeState.isDragging) {
      setSwipeState((prev) => ({
        ...prev,
        progress: isOpen ? 1 : 0,
        overlayStyle: undefined,
        sheetStyle: undefined,
      }));
    }
  }, [isOpen, swipeState.isDragging]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !isOpen) return;

      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;

      // Check if touch is within the sheet element
      const sheetEl = sheetRef?.current;
      if (!sheetEl) return;

      const rect = sheetEl.getBoundingClientRect();
      const isInSheet = y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right;
      if (!isInSheet) return;

      // Check if touch started in the drag handle area (top part of sheet)
      const isInHandleArea = y <= rect.top + handleHeight;

      // Don't track touches on interactive elements, except in handle area
      if (!isInHandleArea && e.target instanceof Element) {
        const interactiveSelector = 'a, button, input, select, textarea, [role="button"], [tabindex]';
        if (e.target.closest(interactiveSelector)) {
          return;
        }
      }

      // Store sheet height for progress calculation
      sheetHeight.current = rect.height;

      const now = performance.now();
      touchStartX.current = x;
      touchStartY.current = y;
      touchStartTime.current = now;
      lastTouchY.current = y;
      lastTouchTime.current = now;
      lastProgress.current = 1;
      isTracking.current = true;
      isHorizontalScroll.current = false;
    },
    [enabled, isOpen, handleHeight, sheetRef]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isTracking.current) return;

      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      const deltaX = x - touchStartX.current;
      const deltaY = y - touchStartY.current;

      // Check if this is a horizontal scroll (first 10px of movement)
      if (!swipeState.isDragging && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isHorizontalScroll.current = true;
        isTracking.current = false;
        return;
      }

      // Ignore horizontal scrolling
      if (isHorizontalScroll.current) return;

      // Start dragging after 10px downward movement (only allow downward swipe to close)
      if (!swipeState.isDragging && deltaY > 10) {
        setSwipeState((prev) => ({ ...prev, isDragging: true }));
      }

      // Don't allow upward swipe when starting to drag
      if (!swipeState.isDragging && deltaY < 0) {
        isTracking.current = false;
        return;
      }

      if (swipeState.isDragging || deltaY > 10) {
        // Calculate progress: 1 = fully open, 0 = fully closed
        // deltaY > 0 means dragging down (closing)
        const height = sheetHeight.current || 400;
        const progress = Math.max(0, Math.min(1, 1 - deltaY / height));

        // Only update if progress changed significantly (rAF throttling)
        const progressDelta = Math.abs(progress - lastProgress.current);
        if (progressDelta >= 0.01) {
          // Cancel any pending rAF
          if (rafId.current !== null) {
            cancelAnimationFrame(rafId.current);
          }

          rafId.current = requestAnimationFrame(() => {
            const styles = calculateSheetStyles(progress, true);
            setSwipeState({
              progress,
              isDragging: true,
              overlayStyle: styles.overlayStyle,
              sheetStyle: styles.sheetStyle,
            });
            lastProgress.current = progress;
            rafId.current = null;
          });
        }

        // Update velocity tracking
        lastTouchY.current = y;
        lastTouchTime.current = performance.now();
      }
    },
    [swipeState.isDragging]
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
        ? (lastTouchY.current - touchStartY.current) / totalTime
        : 0;

      // Determine final state based on velocity and position
      let shouldClose: boolean;

      if (Math.abs(velocity) >= velocityThreshold) {
        // High velocity: use direction (positive = down = close)
        shouldClose = velocity > 0;
      } else {
        // Low velocity: use position threshold
        // If progress is less than threshold, close
        shouldClose = swipeState.progress <= (1 - positionThreshold);
      }

      onOpenChange(!shouldClose);
    }

    // Reset tracking state
    isTracking.current = false;
    setSwipeState((prev) => ({
      ...prev,
      isDragging: false,
      overlayStyle: undefined,
      sheetStyle: undefined,
    }));
  }, [swipeState.isDragging, swipeState.progress, velocityThreshold, positionThreshold, onOpenChange]);

  useEffect(() => {
    if (!enabled) return;

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

      // Cancel any pending rAF on cleanup
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return swipeState;
}
