/**
 * Lazy import utilities for code splitting
 * Provides consistent loading experience across lazy-loaded pages
 */

import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Page loading fallback component
 * Displays a centered spinner while lazy components load
 */
export function PageLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Lazy import wrapper with retry logic
 * Automatically retries failed imports with exponential backoff
 */
export function lazyImport<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
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
 * Suspense wrapper component
 * Wraps children with Suspense and loading fallback
 */
export function SuspenseWrapper({
  children,
  fallback = <PageLoadingFallback />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * HOC to wrap lazy component with Suspense
 * Creates a component that includes its own Suspense boundary
 */
export function withSuspense<P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  fallback: ReactNode = <PageLoadingFallback />
) {
  return function SuspenseHOC(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
