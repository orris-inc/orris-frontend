/**
 * Higher-order component to wrap a component with error boundary
 * Extracted for Fast Refresh compatibility
 */

import type { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
