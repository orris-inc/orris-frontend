/**
 * 响应式断点 Hook
 * 提供当前屏幕尺寸断点判断，与 Tailwind CSS 断点保持一致
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Tailwind CSS 默认断点（与 v4 一致）
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
  /** 当前断点名称 */
  current: BreakpointKey | 'xs';
  /** 是否大于等于 sm (640px) */
  isSm: boolean;
  /** 是否大于等于 md (768px) */
  isMd: boolean;
  /** 是否大于等于 lg (1024px) */
  isLg: boolean;
  /** 是否大于等于 xl (1280px) */
  isXl: boolean;
  /** 是否大于等于 2xl (1536px) */
  is2xl: boolean;
  /** 是否为移动端 (< 768px) */
  isMobile: boolean;
  /** 是否为平板端 (>= 768px && < 1024px) */
  isTablet: boolean;
  /** 是否为桌面端 (>= 1024px) */
  isDesktop: boolean;
  /** 当前视口宽度 */
  width: number;
}

/**
 * 获取当前断点
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
 * 响应式断点 Hook
 *
 * @example
 * ```tsx
 * const { isMobile, isDesktop, current } = useBreakpoint();
 *
 * return (
 *   <div>
 *     {isMobile ? <MobileView /> : <DesktopView />}
 *     <p>当前断点: {current}</p>
 *   </div>
 * );
 * ```
 */
export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    // SSR 兼容：默认使用桌面端尺寸
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
    // 初始化时更新一次
    updateState();

    // 使用 ResizeObserver 监听（更高效）
    const handleResize = () => {
      requestAnimationFrame(updateState);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [updateState]);

  return state;
}

/**
 * 媒体查询 Hook
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
