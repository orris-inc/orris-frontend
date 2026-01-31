/**
 * Default Error Fallback UI
 * Extracted for Fast Refresh compatibility
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';

export function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
      <div className="p-3 rounded-full bg-destructive/10 mb-4">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="size-4" />
        Try again
      </button>
    </div>
  );
}
