/**
 * DateTimeCell Component
 * Reusable component for displaying date/time in table cells
 * Features:
 * - Prevents text wrapping with whitespace-nowrap
 * - Consistent styling across all tables
 * - Support for both date-only and date-time formats
 * - Optional tooltip for full timestamp
 */

import { memo } from 'react';
import { formatDate, formatDateTime } from '@/shared/utils/date-utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { cn } from '@/lib/utils';

interface DateTimeCellProps {
  /** The date value to display (timestamp, Date, or ISO string) */
  value: string | number | Date | undefined | null;
  /** Format type: 'date' for date only, 'datetime' for date and time */
  format?: 'date' | 'datetime';
  /** Additional CSS classes */
  className?: string;
  /** Show full timestamp in tooltip */
  showTooltip?: boolean;
  /** Placeholder when value is empty */
  placeholder?: string;
}

/**
 * DateTimeCell - Display formatted date/time in table cells
 * @example
 * <DateTimeCell value={row.original.createdAt} />
 * <DateTimeCell value={row.original.startDate} format="date" />
 */
export const DateTimeCell = memo(({
  value,
  format = 'datetime',
  className,
  showTooltip = false,
  placeholder = '-',
}: DateTimeCellProps) => {
  if (!value) {
    return <span className={cn('text-muted-foreground/50 text-sm', className)}>{placeholder}</span>;
  }

  const formattedValue = format === 'date' ? formatDate(value) : formatDateTime(value);
  const fullValue = formatDateTime(value);

  const content = (
    <span className={cn('text-muted-foreground text-sm whitespace-nowrap', className)}>
      {formattedValue}
    </span>
  );

  if (showTooltip && format === 'date') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">{content}</span>
        </TooltipTrigger>
        <TooltipContent>{fullValue}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
});

DateTimeCell.displayName = 'DateTimeCell';
