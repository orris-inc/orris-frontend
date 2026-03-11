/**
 * OnlineIndicator - Shared online/offline status indicator
 *
 * Displays a colored dot with optional text label.
 * Online: green dot + success text
 * Offline: gray dot + muted text
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

export interface OnlineIndicatorProps {
  isOnline: boolean;
  onlineText: string;
  offlineText: string;
  showLabel?: boolean;
  className?: string;
}

export const OnlineIndicator = memo(({
  isOnline,
  onlineText,
  offlineText,
  showLabel = true,
  className,
}: OnlineIndicatorProps) => (
  <span className={cn('inline-flex items-center gap-1', className)}>
    <span
      className={cn(
        'size-2 rounded-full',
        isOnline ? 'bg-success' : 'bg-muted-foreground/40'
      )}
    />
    {showLabel && (
      <span
        className={cn(
          'text-xs font-medium',
          isOnline ? 'text-success' : 'text-muted-foreground'
        )}
      >
        {isOnline ? onlineText : offlineText}
      </span>
    )}
  </span>
));

OnlineIndicator.displayName = 'OnlineIndicator';
