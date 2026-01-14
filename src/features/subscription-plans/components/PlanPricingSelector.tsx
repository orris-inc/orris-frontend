/**
 * 计划定价选择器组件
 * 用于显示和选择一个计划的多种定价选项
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleGroup, ToggleGroupItem } from '@/components/common/ToggleGroup';
import type { PricingOption, BillingCycle } from '@/api/subscription/types';

interface PlanPricingSelectorProps {
  pricings: PricingOption[];
  defaultBillingCycle?: BillingCycle;
  onPricingChange?: (pricing: PricingOption) => void;
}

// Billing cycle key mapping for i18n
const billingCycleKeyMap: Record<BillingCycle, string> = {
  weekly: 'billingCycle.weekly',
  monthly: 'billingCycle.monthly',
  quarterly: 'billingCycle.quarterly',
  semi_annual: 'billingCycle.semiAnnual',
  yearly: 'billingCycle.yearly',
  lifetime: 'billingCycle.lifetime',
};

export const PlanPricingSelector: React.FC<PlanPricingSelectorProps> = ({
  pricings,
  defaultBillingCycle,
  onPricingChange,
}) => {
  const { t } = useTranslation();

  // Get billing cycle label from i18n
  const getBillingCycleLabel = (cycle: BillingCycle) => {
    return t(billingCycleKeyMap[cycle]);
  };

  // Filter active pricing options
  const activePricings = pricings.filter((p) => p.isActive);

  // Default to first active pricing or specified billing cycle
  const defaultPricing =
    activePricings.find((p) => p.billingCycle === defaultBillingCycle) ||
    activePricings[0];

  const [selectedPricing, setSelectedPricing] = useState<PricingOption | null>(defaultPricing || null);

  // Return null if no active pricing
  if (activePricings.length === 0 || !selectedPricing) {
    return null;
  }

  const handlePricingChange = (newBillingCycle: string) => {
    if (!newBillingCycle) return;

    const newPricing = activePricings.find((p) => p.billingCycle === newBillingCycle);
    if (newPricing) {
      setSelectedPricing(newPricing);
      onPricingChange?.(newPricing);
    }
  };

  // Format price
  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'CNY' ? '¥' : '$';
    const amount = (price / 100).toFixed(2);
    return `${symbol}${amount}`;
  };

  // If only one pricing option, display price directly
  if (activePricings.length === 1) {
    const pricing = activePricings[0];
    return (
      <div>
        <div className="text-3xl font-bold">
          {formatPrice(pricing.price, pricing.currency)}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {getBillingCycleLabel(pricing.billingCycle)}
        </p>
      </div>
    );
  }

  // Multiple pricing options, show selector
  return (
    <div>
      {/* Billing cycle selector */}
      <ToggleGroup
        type="single"
        value={selectedPricing.billingCycle}
        onValueChange={handlePricingChange}
        className="flex-wrap justify-start mb-3"
      >
        {activePricings.map((pricing) => (
          <ToggleGroupItem
            key={pricing.billingCycle}
            value={pricing.billingCycle}
            className="text-xs"
          >
            {getBillingCycleLabel(pricing.billingCycle)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Selected price */}
      <div className="text-3xl font-bold">
        {formatPrice(selectedPricing.price, selectedPricing.currency)}
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {getBillingCycleLabel(selectedPricing.billingCycle)}
      </p>
    </div>
  );
};
