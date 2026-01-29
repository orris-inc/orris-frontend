/**
 * ErrorState Component
 *
 * Display error fallback UI with retry capability.
 * Features:
 * - Error icon with message
 * - Retry button
 * - Expandable error details
 * - Responsive design
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getButtonClass } from '@/lib/ui-styles';

export interface ErrorStateProps {
  /** Error object or message */
  error: Error | string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Title override */
  title?: string;
  /** Description override */
  description?: string;
  /** Show error details expand/collapse */
  showDetails?: boolean;
  /** Additional class names */
  className?: string;
}

export const ErrorState = ({
  error,
  onRetry,
  title,
  description,
  showDetails = true,
  className,
}: ErrorStateProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract error message
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-12 text-center',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error icon */}
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <AlertTriangle
          className="size-6 text-destructive"
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-foreground mb-1">
        {title || t('errorState.title')}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description || errorMessage || t('errorState.description')}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Retry button */}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              getButtonClass('default', 'default'),
              'min-h-[44px]' // Touch target
            )}
          >
            <RefreshCw className="size-4 mr-2" />
            {t('errorState.retry')}
          </button>
        )}

        {/* Show details toggle */}
        {showDetails && errorStack && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              getButtonClass('ghost', 'sm'),
              'text-muted-foreground hover:text-foreground',
              'min-h-[36px]'
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-4 mr-1" />
                {t('errorState.hideDetails')}
              </>
            ) : (
              <>
                <ChevronDown className="size-4 mr-1" />
                {t('errorState.showDetails')}
              </>
            )}
          </button>
        )}
      </div>

      {/* Error details */}
      {showDetails && isExpanded && errorStack && (
        <div className="mt-6 w-full max-w-2xl">
          <pre
            className={cn(
              'p-4 rounded-lg',
              'bg-muted/50 border border-border',
              'text-left text-xs text-muted-foreground',
              'overflow-x-auto',
              'font-mono whitespace-pre-wrap break-words'
            )}
          >
            {errorStack}
          </pre>
        </div>
      )}
    </div>
  );
};

export type { ErrorStateProps as ErrorFallbackProps };
