/**
 * 计费周期标签组件
 */

import { Chip } from '@mui/material';
import type { BillingCycle } from '../types/subscription-plans.types';

interface BillingCycleBadgeProps {
  billingCycle: BillingCycle;
  size?: 'small' | 'medium';
}

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  annual: '年付',
  lifetime: '终身',
};

const BILLING_CYCLE_COLORS: Record<BillingCycle, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
  monthly: 'default',
  quarterly: 'info',
  semi_annual: 'primary',
  annual: 'success',
  lifetime: 'warning',
};

export const BillingCycleBadge: React.FC<BillingCycleBadgeProps> = ({
  billingCycle,
  size = 'small'
}) => {
  return (
    <Chip
      label={BILLING_CYCLE_LABELS[billingCycle]}
      color={BILLING_CYCLE_COLORS[billingCycle]}
      size={size}
    />
  );
};
