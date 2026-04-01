/**
 * SmartTruncate component
 * Uses Pretext to measure text and only shows tooltip when text is actually overflowing
 * Replaces manual CSS truncate + guesswork tooltip patterns
 */

import { memo, useRef, useState, useEffect, type ReactNode } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/common/Tooltip';
import { cn } from '@/lib/utils';

interface SmartTruncateProps {
  /** Text content to display and measure */
  text: string;
  /** CSS font string for measurement, e.g. '13px Inter' */
  font?: string;
  /** Line height in pixels for measurement */
  lineHeight?: number;
  /** Max lines before truncation (default: 1) */
  maxLines?: number;
  /** Additional className for the text container */
  className?: string;
  /** Custom tooltip content (defaults to full text) */
  tooltipContent?: ReactNode;
  /** Whether to use monospace font */
  mono?: boolean;
}

export const SmartTruncate = memo(({
  text,
  font = '13px Inter, system-ui, sans-serif',
  lineHeight = 20,
  maxLines = 1,
  className,
  tooltipContent,
  mono = false,
}: SmartTruncateProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const effectiveFont = mono ? font.replace(/Inter/, '"SF Mono", ui-monospace, monospace') : font;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !text) {
      setIsOverflowing(false);
      return;
    }

    const checkOverflow = () => {
      const width = el.offsetWidth;
      if (width <= 0) return;

      const prepared = prepare(text, effectiveFont);
      const result = layout(prepared, width, lineHeight);
      setIsOverflowing(result.lineCount > maxLines);
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, effectiveFont, lineHeight, maxLines]);

  const textElement = (
    <span
      ref={containerRef}
      className={cn(
        'block min-w-0',
        maxLines === 1 ? 'truncate' : `line-clamp-${maxLines}`,
        mono && 'font-mono',
        className
      )}
    >
      {text}
    </span>
  );

  if (!isOverflowing) return textElement;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {textElement}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-words">
        {tooltipContent ?? text}
      </TooltipContent>
    </Tooltip>
  );
});
SmartTruncate.displayName = 'SmartTruncate';
