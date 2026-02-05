/**
 * Date Range Filter
 * Unified time filter for admin pages — works on both desktop and mobile.
 *
 * Desktop: Popover with preset chips + custom date inputs (triggered by a Select-like button)
 * Mobile (in Sheet): Inline preset chips + expandable custom date inputs
 *
 * Features:
 * - Quick preset chips (all, today, yesterday, 7/30/90 days, this month, custom)
 * - Custom date range (start + end date inputs)
 * - Consistent behavior across breakpoints
 * - 44px touch targets on mobile
 * - Uses project CSS variables and shared styles
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/common/Label';
import { inputStyles } from '@/lib/ui-styles';

// ============================================================================
// Types
// ============================================================================

/** Date range value — ISO date strings (YYYY-MM-DD) */
export interface DateRangeValue {
  startDate?: string;
  endDate?: string;
}

/** Preset key for quick selection */
export type DatePresetKey =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'thisMonth'
  | 'custom';

/** Single preset configuration */
interface DatePreset {
  key: DatePresetKey;
  label: string;
  getRange: () => DateRangeValue;
}

/**
 * Layout variant:
 * - 'popover': Desktop — renders a trigger button with a dropdown popover
 * - 'inline': Mobile — renders chips + custom inputs inline (for use inside Sheet)
 */
type LayoutVariant = 'popover' | 'inline';

export interface DateRangeFilterProps {
  /** Current date range value */
  value: DateRangeValue;
  /** Change handler */
  onChange: (value: DateRangeValue) => void;
  /** Layout variant (default: 'popover') */
  variant?: LayoutVariant;
  /** Optional label (i18n key, shown in inline variant) */
  label?: string;
  /** Show label in inline variant (default: true) */
  showLabel?: boolean;
  /** Trigger width class for popover variant */
  triggerWidth?: string;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/** Format Date to YYYY-MM-DD for input value */
function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ============================================================================
// Presets
// ============================================================================

function buildPresets(): DatePreset[] {
  return [
    {
      key: 'today',
      label: 'common.time.today',
      getRange: () => {
        const now = new Date();
        const date = toInputDate(startOfDay(now));
        return { startDate: date, endDate: date };
      },
    },
    {
      key: 'yesterday',
      label: 'common.time.yesterday',
      getRange: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const date = toInputDate(startOfDay(d));
        return { startDate: date, endDate: date };
      },
    },
    {
      key: 'last7days',
      label: 'admin.dateRange.last7days',
      getRange: () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        return {
          startDate: toInputDate(startOfDay(start)),
          endDate: toInputDate(endOfDay(now)),
        };
      },
    },
    {
      key: 'last30days',
      label: 'admin.dateRange.last30days',
      getRange: () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 29);
        return {
          startDate: toInputDate(startOfDay(start)),
          endDate: toInputDate(endOfDay(now)),
        };
      },
    },
    {
      key: 'last90days',
      label: 'filter.dateRange.last90days',
      getRange: () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 89);
        return {
          startDate: toInputDate(startOfDay(start)),
          endDate: toInputDate(endOfDay(now)),
        };
      },
    },
    {
      key: 'thisMonth',
      label: 'admin.dateRange.thisMonth',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: toInputDate(start),
          endDate: toInputDate(endOfDay(now)),
        };
      },
    },
    {
      key: 'custom',
      label: 'filter.dateRange.custom',
      getRange: () => ({ startDate: undefined, endDate: undefined }),
    },
  ];
}

/** Detect which preset matches the current value */
function detectPreset(value: DateRangeValue): DatePresetKey {
  const presets = buildPresets();
  for (const preset of presets) {
    if (preset.key === 'custom') continue;
    const range = preset.getRange();
    if (range.startDate === value.startDate && range.endDate === value.endDate) {
      return preset.key;
    }
  }
  return 'custom';
}

/** Get display label for the current value */
function getDisplayLabel(value: DateRangeValue, t: (key: string) => string): string {
  const preset = detectPreset(value);
  if (preset === 'custom') {
    if (value.startDate && value.endDate) {
      return `${value.startDate} ~ ${value.endDate}`;
    }
    if (value.startDate) return `${value.startDate} ~`;
    if (value.endDate) return `~ ${value.endDate}`;
    return t('filter.dateRange.custom');
  }
  const presets = buildPresets();
  const found = presets.find((p) => p.key === preset);
  return found ? t(found.label) : t('filter.dateRange.label');
}

// ============================================================================
// Chip styles (shared between variants)
// ============================================================================

const chipBase = cn(
  'shrink-0 rounded-lg px-3 text-sm font-medium',
  'min-h-[36px]',
  'transition-all duration-150',
  'whitespace-nowrap',
  'select-none'
);

const chipActive = 'bg-primary text-primary-foreground ring-1 ring-primary/20';

const chipInactive = cn(
  'bg-muted/60 text-muted-foreground',
  'ring-1 ring-border/50',
  'hover:bg-muted active:bg-muted/80',
  'active:scale-[0.97]'
);

// ============================================================================
// Shared Preset + Custom Panel
// ============================================================================

interface DateRangeContentProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  onClose?: () => void;
}

const DateRangeContent = ({ value, onChange, onClose }: DateRangeContentProps) => {
  const { t } = useTranslation();
  const presets = useMemo(() => buildPresets(), []);
  const activePreset = useMemo(() => detectPreset(value), [value]);
  const [showCustom, setShowCustom] = useState(activePreset === 'custom');

  useEffect(() => {
    if (activePreset === 'custom') {
      setShowCustom(true);
    }
  }, [activePreset]);

  const handlePresetClick = useCallback(
    (preset: DatePreset) => {
      if (preset.key === 'custom') {
        setShowCustom(true);
        return;
      }
      setShowCustom(false);
      onChange(preset.getRange());
      // Close popover on non-custom preset
      if (onClose) onClose();
    },
    [onChange, onClose]
  );

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, startDate: e.target.value || undefined });
    },
    [onChange, value]
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, endDate: e.target.value || undefined });
    },
    [onChange, value]
  );

  const handleClearCustom = useCallback(() => {
    setShowCustom(false);
    onChange({ startDate: undefined, endDate: undefined });
    if (onClose) onClose();
  }, [onChange, onClose]);

  return (
    <div className="space-y-3">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const isActive =
            preset.key === activePreset ||
            (preset.key === 'custom' && showCustom && activePreset === 'custom');

          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={cn(chipBase, isActive ? chipActive : chipInactive)}
            >
              {t(preset.label)}
            </button>
          );
        })}
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="space-y-2.5 pt-1 animate-[fade-in_0.15s_ease-out]">
          <div className="grid grid-cols-2 gap-2">
            {/* Start date */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t('subscription.startDate')}
              </Label>
              <input
                type="date"
                value={value.startDate ?? ''}
                onChange={handleStartChange}
                max={value.endDate ?? undefined}
                className={cn(
                  inputStyles,
                  'h-9 text-sm [&::-webkit-calendar-picker-indicator]:opacity-60'
                )}
              />
            </div>

            {/* End date */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {t('subscription.endDate')}
              </Label>
              <input
                type="date"
                value={value.endDate ?? ''}
                onChange={handleEndChange}
                min={value.startDate ?? undefined}
                className={cn(
                  inputStyles,
                  'h-9 text-sm [&::-webkit-calendar-picker-indicator]:opacity-60'
                )}
              />
            </div>
          </div>

          {/* Clear */}
          {(value.startDate || value.endDate) && (
            <button
              type="button"
              onClick={handleClearCustom}
              className={cn(
                'flex items-center gap-1 text-xs text-muted-foreground',
                'hover:text-foreground transition-colors',
                'py-0.5'
              )}
            >
              <X className="size-3" />
              {t('filter.clearAdvanced')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Desktop Popover Variant
// ============================================================================

const PopoverDateRangeFilter = ({
  value,
  onChange,
  triggerWidth = 'w-[180px]',
  className,
}: Omit<DateRangeFilterProps, 'variant'>) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const hasValue = !!(value.startDate || value.endDate);
  const displayLabel = getDisplayLabel(value, t);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger — styled to match SelectTrigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between gap-2',
          'h-9 rounded-xl ring-1 ring-border bg-background px-3',
          'text-sm',
          'hover:bg-accent/40 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          triggerWidth,
          hasValue && 'text-foreground',
          !hasValue && 'text-muted-foreground'
        )}
      >
        <span className="flex items-center gap-1.5 truncate">
          <Calendar className="size-3.5 shrink-0 opacity-60" />
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 opacity-50 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Popover panel */}
      {open && (
        <div
          className={cn(
            'absolute top-full left-0 z-50 mt-1',
            'min-w-[320px] p-3 rounded-xl',
            'bg-popover text-popover-foreground',
            'ring-1 ring-border shadow-lg',
            'animate-[scale-in_0.15s_ease-out]',
            'origin-top-left'
          )}
        >
          <DateRangeContent
            value={value}
            onChange={onChange}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Inline Variant (for mobile Sheet)
// ============================================================================

const InlineDateRangeFilter = ({
  value,
  onChange,
  label = 'filter.dateRange.label',
  showLabel = true,
  className,
}: Omit<DateRangeFilterProps, 'variant'>) => {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <Label className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground" />
          {t(label)}
        </Label>
      )}
      <DateRangeContent value={value} onChange={onChange} />
    </div>
  );
};

// ============================================================================
// Public Component
// ============================================================================

export const DateRangeFilter = ({
  variant = 'popover',
  ...props
}: DateRangeFilterProps) => {
  if (variant === 'inline') {
    return <InlineDateRangeFilter {...props} />;
  }
  return <PopoverDateRangeFilter {...props} />;
};

DateRangeFilter.displayName = 'DateRangeFilter';

// ============================================================================
// Conversion helpers
// ============================================================================

/**
 * Convert DateRangeValue to { from, to } format used by traffic hooks.
 * Falls back to last7days when no dates are set.
 */
export function toDateRange(value: DateRangeValue): { from: string; to: string } {
  if (value.startDate && value.endDate) {
    return { from: value.startDate, to: value.endDate };
  }
  // Fallback: last 7 days
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return {
    from: toInputDate(startOfDay(start)),
    to: toInputDate(endOfDay(now)),
  };
}

/**
 * Get initial DateRangeValue for a given preset key (convenience for default state).
 */
export function getInitialDateRange(preset: DatePresetKey = 'last7days'): DateRangeValue {
  const presets = buildPresets();
  const found = presets.find((p) => p.key === preset);
  return found ? found.getRange() : { startDate: undefined, endDate: undefined };
}

// ============================================================================
// Re-exports
// ============================================================================

export { detectPreset, buildPresets, getDisplayLabel };
