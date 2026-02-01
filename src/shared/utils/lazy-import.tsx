/**
 * Lazy import components for code splitting
 * Provides consistent loading experience across lazy-loaded pages
 */

import { Suspense, ReactNode } from 'react';
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
