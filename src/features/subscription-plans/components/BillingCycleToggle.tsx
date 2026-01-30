/**
 * Billing Cycle Toggle Component
 * Responsive toggle for selecting billing cycles
 * Desktop: ToggleGroup, Mobile: Select dropdown
 */

import { useTranslation } from 'react-i18next';
import { ToggleGroup, ToggleGroupItem } from '@/components/common/ToggleGroup';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/common/Select';
import type { BillingCycle } from '@/api/subscription/types';

// Billing cycle display order
const BILLING_CYCLE_ORDER: BillingCycle[] = [
  'monthly',
  'quarterly',
  'semi_annual',
  'yearly',
  'lifetime',
  'weekly',
];

interface BillingCycleToggleProps {
  /** Available billing cycles to display */
  availableCycles: BillingCycle[];
  /** Currently selected billing cycle */
  selectedCycle: BillingCycle;
  /** Callback when cycle changes */
  onCycleChange: (cycle: BillingCycle) => void;
  /** Optional className for container */
  className?: string;
}

export const BillingCycleToggle: React.FC<BillingCycleToggleProps> = ({
  availableCycles,
  selectedCycle,
  onCycleChange,
  className,
}) => {
  const { t } = useTranslation();

  // Sort cycles by display order
  const sortedCycles = [...availableCycles].sort(
    (a, b) => BILLING_CYCLE_ORDER.indexOf(a) - BILLING_CYCLE_ORDER.indexOf(b)
  );

  // If only one cycle available, don't show toggle
  if (sortedCycles.length <= 1) {
    return null;
  }

  const handleValueChange = (value: string) => {
    if (value) {
      onCycleChange(value as BillingCycle);
    }
  };

  return (
    <div className={className}>
      {/* Desktop: ToggleGroup */}
      <div className="hidden sm:block">
        <ToggleGroup
          type="single"
          value={selectedCycle}
          onValueChange={handleValueChange}
          className="inline-flex"
        >
          {sortedCycles.map((cycle) => (
            <ToggleGroupItem
              key={cycle}
              value={cycle}
              className="text-sm px-4 py-2"
            >
              {t(`billingCycle.${cycle}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Mobile: Select dropdown */}
      <div className="block sm:hidden">
        <Select value={selectedCycle} onValueChange={handleValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {t(`billingCycle.${selectedCycle}`)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sortedCycles.map((cycle) => (
              <SelectItem key={cycle} value={cycle}>
                {t(`billingCycle.${cycle}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

BillingCycleToggle.displayName = 'BillingCycleToggle';
