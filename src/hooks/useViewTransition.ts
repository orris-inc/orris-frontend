/**
 * View Transitions API Hook for React Router
 *
 * Provides native browser page transition animations following 2025-2026 best practices.
 * Uses the View Transitions API (Chrome 111+, Safari 18+) with graceful fallback.
 *
 * Features:
 * - Native browser-powered animations (no JS animation library needed)
 * - Automatic fallback for unsupported browsers
 * - iOS-style cross-fade transitions
 * - Respects prefers-reduced-motion
 * - SSR-safe
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 * @see https://developer.chrome.com/docs/web-platform/view-transitions
 */

import { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Check if View Transitions API is supported
 */
export const supportsViewTransitions = (): boolean => {
  if (typeof document === 'undefined') return false;
  return 'startViewTransition' in document;
};

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Transition direction based on navigation
 */
export type TransitionDirection = 'forward' | 'backward' | 'none';

/**
 * Determine transition direction based on paths
 */
const getTransitionDirection = (
  fromPath: string,
  toPath: string
): TransitionDirection => {
  // Same path - no transition
  if (fromPath === toPath) return 'none';

  // Navigation depth comparison
  const fromDepth = fromPath.split('/').filter(Boolean).length;
  const toDepth = toPath.split('/').filter(Boolean).length;

  // Deeper navigation = forward, shallower = backward
  if (toDepth > fromDepth) return 'forward';
  if (toDepth < fromDepth) return 'backward';

  // Same depth - use lexical comparison for consistency
  return toPath > fromPath ? 'forward' : 'backward';
};

interface ViewTransitionOptions {
  /**
   * Custom CSS class to apply during transition
   */
  transitionClass?: string;
  /**
   * Skip transition for this navigation
   */
  skipTransition?: boolean;
}

interface UseViewTransitionReturn {
  /**
   * Navigate with View Transition animation
   */
  navigateWithTransition: (
    to: string,
    options?: ViewTransitionOptions
  ) => Promise<void>;
  /**
   * Whether View Transitions API is supported
   */
  isSupported: boolean;
  /**
   * Current path for comparison
   */
  currentPath: string;
}

/**
 * Hook for View Transitions API with React Router
 *
 * @example
 * ```tsx
 * const { navigateWithTransition } = useViewTransition();
 *
 * const handleClick = () => {
 *   navigateWithTransition('/dashboard');
 * };
 * ```
 */
export const useViewTransition = (): UseViewTransitionReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSupported = useMemo(() => supportsViewTransitions(), []);

  const navigateWithTransition = useCallback(
    async (to: string, options?: ViewTransitionOptions): Promise<void> => {
      const { skipTransition = false, transitionClass } = options || {};

      // Skip transition if:
      // - Explicitly requested
      // - User prefers reduced motion
      // - API not supported
      // - Same path
      if (
        skipTransition ||
        prefersReducedMotion() ||
        !isSupported ||
        location.pathname === to
      ) {
        navigate(to);
        return;
      }

      const direction = getTransitionDirection(location.pathname, to);

      // Apply direction class to root for CSS targeting
      const root = document.documentElement;
      const directionClass = `vt-${direction}`;
      root.classList.add(directionClass);

      if (transitionClass) {
        root.classList.add(transitionClass);
      }

      try {
        const transition = document.startViewTransition(() => {
          navigate(to);
        });

        // Wait for transition to complete
        await transition.finished;
      } catch {
        // Fallback: just navigate if transition fails
        navigate(to);
      } finally {
        // Cleanup classes
        root.classList.remove(directionClass);
        if (transitionClass) {
          root.classList.remove(transitionClass);
        }
      }
    },
    [navigate, location.pathname, isSupported]
  );

  return {
    navigateWithTransition,
    isSupported,
    currentPath: location.pathname,
  };
};
