/**
 * View Transition Link Component
 *
 * A drop-in replacement for React Router's Link that uses the View Transitions API
 * for smooth page transitions. Follows 2025-2026 best practices.
 *
 * Features:
 * - Native View Transitions API support
 * - Graceful fallback for unsupported browsers
 * - Haptic feedback on mobile
 * - Respects prefers-reduced-motion
 * - TypeScript strict typing
 *
 * @see https://developer.chrome.com/docs/web-platform/view-transitions
 */

import React, { useCallback, forwardRef } from 'react';
import { useLocation, useNavigate, type To } from 'react-router';
import { supportsViewTransitions } from '@/hooks/useViewTransition';

interface ViewTransitionLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /**
   * Navigation target path
   */
  to: To;
  /**
   * Children to render
   */
  children: React.ReactNode;
  /**
   * Skip View Transition for this link
   */
  skipTransition?: boolean;
  /**
   * Custom transition class to apply during transition
   */
  transitionClass?: string;
  /**
   * Callback before navigation
   */
  onBeforeNavigate?: () => void;
  /**
   * Replace current history entry
   */
  replace?: boolean;
}

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Link component with View Transitions API support
 *
 * @example
 * ```tsx
 * <ViewTransitionLink to="/dashboard">
 *   Go to Dashboard
 * </ViewTransitionLink>
 *
 * // With custom transition
 * <ViewTransitionLink
 *   to="/settings"
 *   transitionClass="vt-slide-up"
 * >
 *   Settings
 * </ViewTransitionLink>
 * ```
 */
export const ViewTransitionLink = forwardRef<
  HTMLAnchorElement,
  ViewTransitionLinkProps
>(
  (
    {
      to,
      children,
      skipTransition = false,
      transitionClass,
      onBeforeNavigate,
      replace = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = useCallback(
      async (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Allow default behavior for special clicks
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }

        e.preventDefault();

        // Call custom onClick if provided
        onClick?.(e);

        // Call before navigate callback
        onBeforeNavigate?.();

        const toPath = typeof to === 'string' ? to : to.pathname || '';

        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }

        // Check if we should skip transition
        const shouldSkip =
          skipTransition ||
          prefersReducedMotion() ||
          !supportsViewTransitions() ||
          location.pathname === toPath;

        if (shouldSkip) {
          navigate(to, { replace });
          return;
        }

        // Determine direction for CSS
        const fromDepth = location.pathname.split('/').filter(Boolean).length;
        const toDepth = toPath.split('/').filter(Boolean).length;
        const direction =
          toDepth > fromDepth
            ? 'forward'
            : toDepth < fromDepth
              ? 'backward'
              : 'forward';

        const root = document.documentElement;
        const directionClass = `vt-${direction}`;
        root.classList.add(directionClass);

        if (transitionClass) {
          root.classList.add(transitionClass);
        }

        try {
          const transition = document.startViewTransition(() => {
            navigate(to, { replace });
          });

          await transition.finished;
        } catch {
          // Fallback navigation
          navigate(to, { replace });
        } finally {
          root.classList.remove(directionClass);
          if (transitionClass) {
            root.classList.remove(transitionClass);
          }
        }
      },
      [
        to,
        navigate,
        location.pathname,
        skipTransition,
        transitionClass,
        onBeforeNavigate,
        replace,
        onClick,
      ]
    );

    const href = typeof to === 'string' ? to : to.pathname || '';

    return (
      <a ref={ref} href={href} onClick={handleClick} {...props}>
        {children}
      </a>
    );
  }
);

ViewTransitionLink.displayName = 'ViewTransitionLink';
