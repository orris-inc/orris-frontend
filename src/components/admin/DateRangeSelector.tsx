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
 */
export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
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
      className="w-full justify-start overflow-x-auto"
    >
      {DATE_PRESETS.map((preset) => (
        <ToggleGroupItem key={preset.value} value={preset.value} className="flex-shrink-0">
          {preset.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
