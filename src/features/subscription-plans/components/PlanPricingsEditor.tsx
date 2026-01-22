/**
 * Plan multi-pricing editor component
 * Used to manage multiple pricing options when creating/editing plans
 */

import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { Card } from '@/components/common/Card';
import { Separator } from '@/components/common/Separator';
import { Alert } from '@/components/common/Alert';
import type { BillingCycle, PricingOption } from '@/api/subscription/types';

interface PlanPricingsEditorProps {
  pricings: PricingOption[];
  onChange: (pricings: PricingOption[]) => void;
  disabled?: boolean;
}

const BILLING_CYCLE_OPTIONS: { value: BillingCycle; labelKey: string }[] = [
  { value: 'weekly', labelKey: 'billingCycle.weekly' },
  { value: 'monthly', labelKey: 'billingCycle.monthly' },
  { value: 'quarterly', labelKey: 'billingCycle.quarterly' },
  { value: 'semi_annual', labelKey: 'billingCycle.semiAnnual' },
  { value: 'yearly', labelKey: 'billingCycle.yearly' },
  { value: 'lifetime', labelKey: 'billingCycle.lifetime' },
];

const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'CNY', label: 'CNY' },
  { value: 'USD', label: 'USD' },
];

export const PlanPricingsEditor: React.FC<PlanPricingsEditorProps> = ({
  pricings,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const handleAddPricing = () => {
    const newPricing: PricingOption = {
      billingCycle: 'monthly',
      price: 0,
      currency: 'CNY',
      isActive: true,
    };
    onChange([...pricings, newPricing]);
  };

  const handleRemovePricing = (index: number) => {
    onChange(pricings.filter((_, i) => i !== index));
  };

  const handleUpdatePricing = (index: number, updates: Partial<PricingOption>) => {
    const updated = pricings.map((pricing, i) =>
      i === index ? { ...pricing, ...updates } : pricing
    );
    onChange(updated);
  };

  // Check for duplicate billing cycles
  const getDuplicateCycles = (): string[] => {
    const cycles = pricings.map((p) => p.billingCycle);
    return cycles.filter((cycle, index) => cycles.indexOf(cycle) !== index);
  };

  const duplicateCycles = getDuplicateCycles();
  const hasDuplicates = duplicateCycles.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">{t('subscriptionPlans.pricingOptionsOptional')}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddPricing}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.plans.form.addPricing')}
        </Button>
      </div>

      {hasDuplicates && (
        <Alert variant="warning" className="mb-4">
          {t('subscriptionPlans.duplicateBillingCycles', { cycles: duplicateCycles.join(', ') })}
        </Alert>
      )}

      {pricings.length === 0 ? (
        <Alert variant="info">
          {t('subscriptionPlans.noPricingConfigured')}
        </Alert>
      ) : (
        <div className="space-y-4">
          {pricings.map((pricing, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-primary">
                  {t('admin.plans.form.pricingNumber', { number: index + 1 })}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePricing(index)}
                  disabled={disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`billingCycle-${index}`}>{t('subscription.billingCycle')}</Label>
                    <Select
                      value={pricing.billingCycle}
                      onValueChange={(value) =>
                        handleUpdatePricing(index, {
                          billingCycle: value as BillingCycle,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={`billingCycle-${index}`}
                        className={duplicateCycles.includes(pricing.billingCycle as string) ? 'border-destructive' : ''}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BILLING_CYCLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {duplicateCycles.includes(pricing.billingCycle as string) && (
                      <p className="text-xs text-destructive">{t('subscriptionPlans.billingCycleExists')}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`currency-${index}`}>{t('subscriptionPlans.currency')}</Label>
                    <Select
                      value={pricing.currency}
                      onValueChange={(value) =>
                        handleUpdatePricing(index, { currency: value })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger id={`currency-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`price-${index}`}>{t('admin.plans.form.pricePlaceholder')}</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    value={pricing.price / 100}
                    onChange={(e) => {
                      const yuan = Number(e.target.value);
                      handleUpdatePricing(index, {
                        price: Math.round(yuan * 100),
                      });
                    }}
                    step="0.01"
                    min="0"
                    disabled={disabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('subscriptionPlans.priceConversion', { yuan: pricing.price / 100, fen: pricing.price })}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`isActive-${index}`}
                    checked={pricing.isActive}
                    onCheckedChange={(checked) =>
                      handleUpdatePricing(index, { isActive: checked as boolean })
                    }
                    disabled={disabled}
                  />
                  <Label htmlFor={`isActive-${index}`}>{t('admin.plans.form.activatePricing')}</Label>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Separator className="my-4" />

      <p className="text-xs text-muted-foreground">
        {t('subscriptionPlans.pricingHint')}
      </p>
    </div>
  );
};
