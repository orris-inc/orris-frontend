/**
 * TruncatedId Component
 * Display Stripe-style IDs with truncation, tooltip and copy functionality
 */

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/common/Tooltip';
import { cn } from '@/lib/utils';

interface TruncatedIdProps {
  /** The full ID to display */
  id: string;
  /** Number of characters to show at the start (default: 8) */
  startChars?: number;
  /** Number of characters to show at the end (default: 4) */
  endChars?: number;
  /** Whether to show copy button (default: true) */
  showCopy?: boolean;
  /** Whether to disable truncation and show full ID (default: false) */
  fullWidth?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Truncates a Stripe-style ID for display
 * Shows prefix + first few chars + ... + last few chars
 * Hover to see full ID, click to copy
 */
export const TruncatedId: React.FC<TruncatedIdProps> = ({
  id,
  startChars = 8,
  endChars = 4,
  showCopy = true,
  fullWidth = false,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  // Truncate ID if it's longer than startChars + endChars + 3 (for ...)
  const minLength = startChars + endChars + 3;
  const shouldTruncate = !fullWidth && id.length > minLength;
  const displayId = shouldTruncate
    ? `${id.slice(0, startChars)}...${id.slice(-endChars)}`
    : id;

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail if clipboard access is denied
    }
  }, [id]);

  const content = (
    <span
      className={cn(
        'relative inline-block font-mono text-xs text-muted-foreground',
        'group/id cursor-pointer',
        className
      )}
      onClick={handleCopy}
    >
      <span className="group-hover/id:text-foreground transition-colors">
        {displayId}
      </span>
      {showCopy && (
        <span className={cn(
          'absolute -right-4 top-1/2 -translate-y-1/2 transition-opacity duration-150',
          copied ? 'opacity-100' : 'opacity-0 group-hover/id:opacity-100'
        )}>
          {copied ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3 text-muted-foreground/60" />
          )}
        </span>
      )}
    </span>
  );

  if (!shouldTruncate) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <span className="font-mono text-xs break-all">{id}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
