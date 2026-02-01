/**
 * Lazy import utilities for code splitting
 * Extracted for Fast Refresh compatibility
 */

import { lazy, Suspense, ComponentType, ReactNode, createElement } from 'react';
import type { LazyExoticComponent } from 'react';

/**
 * Lazy import wrapper with retry logic
 * Automatically retries failed imports with exponential backoff
 */
export function lazyImport<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | undefined;
    for (let i = 0; i < retries; i++) {
      try {
        return await factory();
      } catch (error) {
        lastError = error as Error;
        // Wait before retry with exponential backoff
        if (i < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, i))
          );
        }
      }
    }
    throw lastError;
  });
}

/**
 * HOC to wrap lazy component with Suspense
 * Creates a component that includes its own Suspense boundary
 */
export function withSuspense<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  fallback: ReactNode
) {
  return function SuspenseHOC(props: P) {
    return createElement(
      Suspense,
      { fallback },
      createElement(LazyComponent, props)
    );
  };
}
