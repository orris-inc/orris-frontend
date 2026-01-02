/**
 * DateRangeSelector Component
 * Provides preset date range selection using ToggleGroup
 */

import { ToggleGroup, ToggleGroupItem } from '@/components/common/ToggleGroup';
import { DATE_PRESETS, DateRangePreset } from '@/features/admin-traffic';

interface DateRangeSelectorProps {
  value: DateRangePreset;
  onChange: (value: DateRangePreset) => void;
}

/**
 * Date range selector with preset options
 * Displays 5 preset options: Today, Yesterday, Last 7 days, Last 30 days, This month
 * Horizontally scrollable on mobile for better touch experience
 */
export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(newValue) => {
          // ToggleGroup can return undefined if the same value is clicked
          // Prevent deselection by keeping the current value
          if (newValue) {
            onChange(newValue as DateRangePreset);
          }
        }}
        className="inline-flex"
      >
        {DATE_PRESETS.map((preset) => (
          <ToggleGroupItem
            key={preset.value}
            value={preset.value}
            className="whitespace-nowrap text-[11px] sm:text-sm min-h-[36px] sm:min-h-[32px] px-2.5 sm:px-3"
          >
            {preset.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
