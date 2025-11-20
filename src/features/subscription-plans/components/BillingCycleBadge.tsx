/**
 * 计费周期标签组件
 */

import { Badge } from '@/components/ui/badge';
import type { BillingCycle } from '../types/subscription-plans.types';

interface BillingCycleBadgeProps {
  billingCycle: BillingCycle;
}

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  annual: '年付',
  lifetime: '终身',
};

const BILLING_CYCLE_VARIANTS: Record<BillingCycle, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  monthly: 'secondary',
  quarterly: 'outline',
  semi_annual: 'default',
  annual: 'default',
  lifetime: 'destructive',
};

export const BillingCycleBadge: React.FC<BillingCycleBadgeProps> = ({
  billingCycle,
}) => {
  return (
    <Badge variant={BILLING_CYCLE_VARIANTS[billingCycle]}>
      {BILLING_CYCLE_LABELS[billingCycle]}
    </Badge>
  );
};
