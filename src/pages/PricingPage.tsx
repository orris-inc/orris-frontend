/**
 * User Pricing Page
 * Modern Bento Grid layout for subscription plans
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  CreditCard,
  Zap,
  Shield,
  Headphones,
} from 'lucide-react';

import type { SubscriptionPlan } from '@/api/subscription/types';
import { PlanCardList } from '@/features/subscription-plans/components/PlanCardList';
import { SubscriptionConfirmDialog } from '@/features/subscription-plans/components/SubscriptionConfirmDialog';
import { usePublicPlans } from '@/features/subscription-plans/hooks/usePublicPlans';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import {
  SectionHeader,
  QuickActionLink,
} from '@/components/common/bento';

export const PricingPage = () => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { publicPlans, isLoading } = usePublicPlans();

  const planStats = useMemo(() => {
    return {
      totalPlans: publicPlans.length,
      hasTrialPlans: publicPlans.some((p) => p.trialDays > 0),
    };
  }, [publicPlans]);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setConfirmDialogOpen(true);
  };

  const heroStatusMessage = useMemo(() => {
    if (isLoading) return undefined;
    return planStats.totalPlans > 0
      ? t('pricing.hero.available', { count: planStats.totalPlans })
      : t('pricing.hero.noPlans');
  }, [isLoading, planStats.totalPlans, t]);

  return (
    <DashboardLayout
      pageTitle={t('pricing.title')}
      pageDescription={
        <div className="space-y-1">
          <div>{t('pricing.subtitle')}</div>
          {heroStatusMessage && <div>{heroStatusMessage}</div>}
        </div>
      }
    >
      <div className="space-y-6 pb-safe">

        {/* Features Highlight */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="p-2 rounded-lg bg-success/10 ring-1 ring-success/20 shrink-0">
              <Zap className="size-4 text-success" />
            </div>
            <div>
              <div className="font-medium text-foreground text-sm">
                {t('pricing.features.instant.title')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('pricing.features.instant.desc')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20 shrink-0">
              <Shield className="size-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-foreground text-sm">
                {t('pricing.features.flexible.title')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('pricing.features.flexible.desc')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="p-2 rounded-lg bg-warning/10 ring-1 ring-warning/20 shrink-0">
              <Headphones className="size-4 text-warning" />
            </div>
            <div>
              <div className="font-medium text-foreground text-sm">
                {t('pricing.features.support.title')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('pricing.features.support.desc')}
              </div>
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section>
          <SectionHeader
            icon={CreditCard}
            title={t('pricing.plans.title')}
            count={!isLoading && planStats.totalPlans > 0 ? planStats.totalPlans : undefined}
          />

          <PlanCardList
            plans={publicPlans}
            loading={isLoading}
            onSelectPlan={handleSelectPlan}
          />
        </section>

        {/* Footer Note */}
        {!isLoading && planStats.totalPlans > 0 && (
          <section className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              {t('pricing.footerNote')}
            </p>
          </section>
        )}

        {/* Quick Actions */}
        {!isLoading && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickActionLink
              to="/dashboard"
              icon={CreditCard}
              title={t('pricing.quickActions.viewSubscriptions')}
              description={t('pricing.quickActions.viewSubscriptionsDesc')}
              variant="primary"
            />
            <QuickActionLink
              to="/dashboard/notifications"
              icon={Sparkles}
              title={t('pricing.quickActions.setupNotifications')}
              description={t('pricing.quickActions.setupNotificationsDesc')}
              variant="success"
            />
          </section>
        )}

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
