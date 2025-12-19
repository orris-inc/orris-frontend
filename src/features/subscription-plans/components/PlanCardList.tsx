/**
 * 订阅计划卡片列表组件（用户端）
 */

import { Loader2 } from 'lucide-react';
import { PlanCard } from './PlanCard';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface PlanCardListProps {
  plans: SubscriptionPlan[];
  loading?: boolean;
  recommendedPlanId?: string;
  onSelectPlan?: (plan: SubscriptionPlan) => void;
}

export const PlanCardList: React.FC<PlanCardListProps> = ({
  plans,
  loading = false,
  recommendedPlanId,
  onSelectPlan,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">
          暂无可用的订阅计划
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          recommended={plan.id === recommendedPlanId}
          onSelect={onSelectPlan}
        />
      ))}
    </div>
  );
};
