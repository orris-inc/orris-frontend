/**
 * Subscription Plan Card List Component (User-facing)
 * Grid layout following DashboardPage patterns
 */

import { Loader2 } from "lucide-react";
import { PlanCard } from "./PlanCard";
import type { SubscriptionPlan } from "@/api/subscription/types";

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
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无可用的订阅计划</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
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
