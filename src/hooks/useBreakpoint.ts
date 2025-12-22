/**
 * Responsive Breakpoint Hook
 * Provides current screen size breakpoint detection, consistent with Tailwind CSS breakpoints
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Tailwind CSS default breakpoints (consistent with v4)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

interface BreakpointState {
  /** Current breakpoint name */
  current: BreakpointKey | 'xs';
  /** Is greater than or equal to sm (640px) */
  isSm: boolean;
  /** Is greater than or equal to md (768px) */
  isMd: boolean;
  /** Is greater than or equal to lg (1024px) */
  isLg: boolean;
  /** Is greater than or equal to xl (1280px) */
  isXl: boolean;
  /** Is greater than or equal to 2xl (1536px) */
  is2xl: boolean;
  /** Is mobile (< 768px) */
  isMobile: boolean;
  /** Is tablet (>= 768px && < 1024px) */
  isTablet: boolean;
  /** Is desktop (>= 1024px) */
  isDesktop: boolean;
  /** Current viewport width */
  width: number;
}

/**
 * Get current breakpoint
 */
const getCurrentBreakpoint = (width: number): BreakpointKey | 'xs' => {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

/**
 * Responsive Breakpoint Hook
 *
 * @example
 * ```tsx
 * const { isMobile, isDesktop, current } = useBreakpoint();
 *
 * return (
 *   <div>
 *     {isMobile ? <MobileView /> : <DesktopView />}
 *     <p>Current breakpoint: {current}</p>
 *   </div>
 * );
 * ```
 */
export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    // SSR compatible: default to desktop size
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return {
      current: getCurrentBreakpoint(width),
      isSm: width >= BREAKPOINTS.sm,
      isMd: width >= BREAKPOINTS.md,
      isLg: width >= BREAKPOINTS.lg,
      isXl: width >= BREAKPOINTS.xl,
      is2xl: width >= BREAKPOINTS['2xl'],
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      width,
    };
  });

  const updateState = useCallback(() => {
    const width = window.innerWidth;
    setState({
      current: getCurrentBreakpoint(width),
      isSm: width >= BREAKPOINTS.sm,
      isMd: width >= BREAKPOINTS.md,
      isLg: width >= BREAKPOINTS.lg,
      isXl: width >= BREAKPOINTS.xl,
      is2xl: width >= BREAKPOINTS['2xl'],
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      width,
    });
  }, []);

  useEffect(() => {
    // Update once on initialization
    updateState();

    // Use ResizeObserver for listening (more efficient)
    const handleResize = () => {
      requestAnimationFrame(updateState);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [updateState]);

  return state;
}

/**
 * Media Query Hook
 *
 * @example
 * ```tsx
 * const isLargeScreen = useMediaQuery('(min-width: 1024px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
