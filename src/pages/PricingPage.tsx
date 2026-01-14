/**
 * User Pricing Page
 * Following DashboardPage layout patterns
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlanCardList } from "@/features/subscription-plans/components/PlanCardList";
import { SubscriptionConfirmDialog } from "@/features/subscription-plans/components/SubscriptionConfirmDialog";
import { usePublicPlans } from "@/features/subscription-plans/hooks/usePublicPlans";
import type { SubscriptionPlan } from "@/api/subscription/types";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export const PricingPage = () => {
  const { t } = useTranslation();
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
      <div className="space-y-4 sm:space-y-6 pb-safe">
        {/* Header - matching DashboardPage pattern */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{t('pricing.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>

        {/* Plan cards */}
        <PlanCardList
          plans={publicPlans}
          loading={isLoading}
          onSelectPlan={handleSelectPlan}
        />

        {/* Footer note */}
        <p className="text-sm text-muted-foreground">
          {t('pricing.footerNote')}
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
