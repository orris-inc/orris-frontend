/**
 * User Pricing Page
 * Following DashboardPage layout patterns
 */

import { useState } from "react";
import { PlanCardList } from "@/features/subscription-plans/components/PlanCardList";
import { SubscriptionConfirmDialog } from "@/features/subscription-plans/components/SubscriptionConfirmDialog";
import { usePublicPlans } from "@/features/subscription-plans/hooks/usePublicPlans";
import type { SubscriptionPlan } from "@/api/subscription/types";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { publicPlans, isLoading } = usePublicPlans();

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setConfirmDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - matching DashboardPage pattern */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">选择套餐</h1>
          <p className="text-muted-foreground">灵活的定价方案，满足不同需求</p>
        </div>

        {/* Plan cards */}
        <PlanCardList
          plans={publicPlans}
          loading={isLoading}
          onSelectPlan={handleSelectPlan}
        />

        {/* Footer note */}
        <p className="text-sm text-muted-foreground">
          所有计划均支持随时升级或降级，如有疑问请联系客服。
        </p>

        {/* Subscription confirm dialog */}
        <SubscriptionConfirmDialog
          open={confirmDialogOpen}
          plan={selectedPlan}
          onClose={() => {
            setConfirmDialogOpen(false);
            setSelectedPlan(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
