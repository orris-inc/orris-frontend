/**
 * Mobile Keyboard Awareness Hook
 *
 * Detects mobile virtual keyboard presence using the Visual Viewport API.
 * Designed to work reliably on iOS Safari where dvh units don't update
 * when the keyboard appears.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface KeyboardState {
  /** Whether the keyboard is currently visible */
  isKeyboardVisible: boolean;
  /** Height of the keyboard in pixels (0 when hidden) */
  keyboardHeight: number;
  /** Current visual viewport height in pixels */
  viewportHeight: number;
  /** Initial viewport height (before keyboard) */
  initialHeight: number;
}

/**
 * Detects mobile keyboard visibility and height
 *
 * Uses Visual Viewport API to detect keyboard. On iOS Safari,
 * we compare current viewport height to initial height captured
 * on mount (when keyboard is presumably closed).
 *
 * @param threshold Minimum height difference to consider as keyboard (default: 100px)
 * @returns KeyboardState with visibility, height, and viewport info
 */
export function useKeyboardAwareness(threshold = 100): KeyboardState {
  // Capture initial height on first render (keyboard should be closed)
  const initialHeightRef = useRef<number>(
    typeof window !== 'undefined'
      ? window.visualViewport?.height ?? window.innerHeight
      : 0
  );

  const [state, setState] = useState<KeyboardState>(() => {
    const height = initialHeightRef.current;
    return {
      isKeyboardVisible: false,
      keyboardHeight: 0,
      viewportHeight: height,
      initialHeight: height,
    };
  });

  const updateKeyboardState = useCallback(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const currentHeight = visualViewport.height;
    const initialHeight = initialHeightRef.current;

    // On iOS, keyboard appears when viewport height decreases significantly
    // from the initial height. We use initial height instead of window.innerHeight
    // because on iOS Safari, window.innerHeight also changes.
    const heightDiff = initialHeight - currentHeight;

    // Only consider it keyboard if difference exceeds threshold
    const isKeyboardVisible = heightDiff > threshold;
    const keyboardHeight = isKeyboardVisible ? heightDiff : 0;

    setState((prev) => {
      // Avoid unnecessary re-renders
      if (
        prev.isKeyboardVisible === isKeyboardVisible &&
        Math.abs(prev.keyboardHeight - keyboardHeight) < 5 &&
        Math.abs(prev.viewportHeight - currentHeight) < 5
      ) {
        return prev;
      }
      return {
        isKeyboardVisible,
        keyboardHeight,
        viewportHeight: currentHeight,
        initialHeight,
      };
    });
  }, [threshold]);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    // Update initial height when component mounts (keyboard should be closed)
    // Use a small delay to ensure we capture the correct initial height
    const captureInitialHeight = () => {
      if (!document.activeElement || document.activeElement === document.body) {
        initialHeightRef.current = visualViewport.height;
        setState((prev) => ({
          ...prev,
          initialHeight: visualViewport.height,
          viewportHeight: visualViewport.height,
        }));
      }
    };
    captureInitialHeight();

    // Handle viewport resize (keyboard show/hide)
    const handleResize = () => {
      requestAnimationFrame(updateKeyboardState);
    };

    visualViewport.addEventListener('resize', handleResize);
    visualViewport.addEventListener('scroll', handleResize);

    // Also listen for focus/blur to catch edge cases
    const handleFocusIn = () => {
      // Small delay to let keyboard animation start
      setTimeout(updateKeyboardState, 100);
      setTimeout(updateKeyboardState, 300);
    };

    const handleFocusOut = () => {
      // Delay to let keyboard close
      setTimeout(() => {
        updateKeyboardState();
        // Re-capture initial height when keyboard closes
        setTimeout(captureInitialHeight, 300);
      }, 100);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      visualViewport.removeEventListener('scroll', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [updateKeyboardState]);

  return state;
}

/**
 * Scrolls the currently focused element into view
 *
 * @param behavior Scroll behavior ('smooth' or 'instant')
 * @param block Vertical alignment ('center', 'start', 'end', 'nearest')
 */
export function scrollFocusedIntoView(
  behavior: ScrollBehavior = 'smooth',
  block: ScrollLogicalPosition = 'center'
): void {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    // Use scrollIntoView with block: 'center' to position input in middle of visible area
    activeElement.scrollIntoView({
      behavior,
      block,
      inline: 'nearest',
    });
  }
}
