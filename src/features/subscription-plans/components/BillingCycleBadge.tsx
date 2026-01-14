/**
 * Billing cycle badge component
 */

import { useTranslation } from 'react-i18next';
import { getBadgeClass } from '@/lib/ui-styles';
import type { BillingCycle } from '@/api/subscription/types';

interface BillingCycleBadgeProps {
  billingCycle: BillingCycle;
}

export const BillingCycleBadge: React.FC<BillingCycleBadgeProps> = ({
  billingCycle,
}) => {
  const { t } = useTranslation();

  const variantMap: Record<
    BillingCycle,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    weekly: 'outline',
    monthly: 'secondary',
    quarterly: 'outline',
    semi_annual: 'default',
    yearly: 'default',
    lifetime: 'destructive',
  };

  return (
    <span className={getBadgeClass(variantMap[billingCycle])}>
      {t(`billingCycle.${billingCycle}`)}
    </span>
  );
};
