/**
 * 计费周期标签组件
 */

import { getBadgeClass } from '@/lib/ui-styles';
import type { BillingCycle } from '@/api/subscription/types';

interface BillingCycleBadgeProps {
  billingCycle: BillingCycle;
}

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  yearly: '年付',
  lifetime: '终身',
};

export const BillingCycleBadge: React.FC<BillingCycleBadgeProps> = ({
  billingCycle,
}) => {
  const variantMap: Record<BillingCycle, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    weekly: 'outline',
    monthly: 'secondary',
    quarterly: 'outline',
    semi_annual: 'default',
    yearly: 'default',
    lifetime: 'destructive',
  };

  return (
    <span className={getBadgeClass(variantMap[billingCycle])}>
      {BILLING_CYCLE_LABELS[billingCycle]}
    </span>
  );
};
