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
