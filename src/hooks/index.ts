/**
 * Common Hooks
 */

export { useBreakpoint, useMediaQuery, BREAKPOINTS } from './useBreakpoint';
export type { BreakpointKey } from './useBreakpoint';

export {
  useViewTransition,
  useViewTransitionHandler,
  supportsViewTransitions,
} from './useViewTransition';
export type { TransitionDirection } from './useViewTransition';

export {
  useKeyboardAwareness,
  scrollFocusedIntoView,
} from './useKeyboardAwareness';

export { useCurrentPageTitle } from './useCurrentPageTitle';

export {
  useServerVersion,
  useVersionInfo,
  CLIENT_VERSION,
  BUILD_TIME,
  COMMIT_HASH,
} from './useServerVersion';

export {
  useNetworkStatus,
  useShouldReduceData,
  useAdaptiveQuality,
} from './useNetworkStatus';
export type { NetworkStatus, ConnectionEffectiveType } from './useNetworkStatus';

export { useMobileListFilter } from './useMobileListFilter';
export type {
  UseMobileListFilterOptions,
  UseMobileListFilterResult,
} from './useMobileListFilter';

export { useMobileDetailSheet } from './useMobileDetailSheet';
export type { UseMobileDetailSheetResult } from './useMobileDetailSheet';
