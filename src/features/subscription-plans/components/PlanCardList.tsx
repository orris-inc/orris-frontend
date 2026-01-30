/**
 * Subscription Plan Card List Component (User-facing)
 * Grid layout following DashboardPage patterns
 */

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PlanCard } from "./PlanCard";
import type { SubscriptionPlan, BillingCycle } from "@/api/subscription/types";

interface PlanCardListProps {
  plans: SubscriptionPlan[];
  loading?: boolean;
  recommendedPlanId?: string;
  /** Selected billing cycle for filtering */
  selectedCycle?: BillingCycle;
  onSelectPlan?: (plan: SubscriptionPlan) => void;
}

export function PlanCardList({
  plans,
  loading = false,
  recommendedPlanId,
  selectedCycle,
  onSelectPlan,
}: PlanCardListProps) {
  const { t } = useTranslation();

  // Filter plans that have pricing for the selected cycle
  const filteredPlans = selectedCycle
    ? plans.filter((plan) =>
        plan.pricings?.some((p) => p.billingCycle === selectedCycle && p.isActive)
      )
    : plans;

  if (loading) {
    return (
      <div className="@container">
        <div className="flex justify-center items-center min-h-[200px] @sm:min-h-[300px]">
          <Loader2 className="size-6 @sm:size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!filteredPlans || filteredPlans.length === 0) {
    return (
      <div className="@container">
        <div className="flex flex-col items-center justify-center py-12 @sm:py-16 px-4 glass-elevated rounded-xl">
          <p className="text-muted-foreground text-center">{t("pricing.noPlans")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-3 @sm:gap-4 @lg:gap-5">
        {filteredPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            recommended={plan.id === recommendedPlanId}
            selectedCycle={selectedCycle}
            onSelect={onSelectPlan}
          />
        ))}
      </div>
    </div>
  );
}
