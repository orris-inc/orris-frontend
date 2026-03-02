/**
 * Delete Subscription Plan Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming plan deletion
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, Loader2, CreditCard, Globe, Lock, CheckCircle2, XCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  DeleteSheetProps,
  ConfirmActionSheet,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/api/subscription/types';

type DeletePlanSheetProps = DeleteSheetProps<SubscriptionPlan>;

const PLAN_TYPE_LABEL_KEYS: Record<string, string> = {
  node: 'common.planType.node',
  forward: 'common.planType.forward',
  hybrid: 'common.planType.hybrid',
};

const STATUS_CONFIG: Record<string, { labelKey: string; color: string; icon: React.ReactNode }> = {
  active: {
    labelKey: 'common.status.enabled',
    color: 'text-success bg-success/10',
    icon: <CheckCircle2 className="size-3.5" />,
  },
  inactive: {
    labelKey: 'common.status.disabled',
    color: 'text-muted-foreground bg-muted',
    icon: <XCircle className="size-3.5" />,
  },
};

export const DeletePlanSheet: React.FC<DeletePlanSheetProps> = ({
  open,
  onOpenChange,
  entity: plan,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      await onConfirm(plan);
      setConfirmOpen(false);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  const statusConfig = STATUS_CONFIG[plan.status] || STATUS_CONFIG.inactive;

  // Format price range for display
  const formatPriceRange = () => {
    if (!plan.pricings || plan.pricings.length === 0) return t('subscription.noPricing');
    const prices = plan.pricings.filter((p) => p.isActive).map((p) => p.price / 100);
    if (prices.length === 0) return t('subscription.noPricing');
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `¥${min}`;
    return `¥${min} - ¥${max}`;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <span>{t('subscriptionPlans.deletePlan')}</span>
            </SheetTitle>
            <SheetDescription>{t('subscriptionPlans.deleteConfirmHint')}</SheetDescription>
          </SheetHeader>

          <SheetBody className="py-6">
            {/* Warning Card */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">{t('subscriptionPlans.confirmDeletePlan')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.plans.confirmDeleteDescription', { name: plan.name })}
                  </p>
                </div>
              </div>

              {/* Plan Info */}
              <div className="rounded-xl bg-background p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('admin.plans.form.planName')}</span>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('admin.plans.form.slug')}</span>
                  <span className="font-mono text-sm">{plan.slug}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('admin.plans.form.planType')}</span>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="size-4 text-muted-foreground" />
                    <span className="text-sm">{t(PLAN_TYPE_LABEL_KEYS[plan.planType]) || plan.planType}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('subscriptionPlans.visibility')}</span>
                  <div className="flex items-center gap-1.5">
                    {plan.isPublic ? (
                      <>
                        <Globe className="size-4 text-info" />
                        <span className="text-sm">{t('admin.plans.public')}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-4 text-warning" />
                        <span className="text-sm">{t('admin.plans.private')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('common.status.label')}</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      statusConfig.color
                    )}
                  >
                    {statusConfig.icon}
                    {t(statusConfig.labelKey)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('subscriptionPlans.priceRange')}</span>
                  <span className="font-medium">{formatPriceRange()}</span>
                </div>
              </div>
            </div>
          </SheetBody>

          <SheetFooter>
            {/* Destructive action first on mobile */}
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              className="w-full min-h-[48px] text-base active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  {t('common.loading.deleting')}
                </>
              ) : (
                t('subscriptionPlans.confirmDelete')
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full min-h-[44px] active:scale-[0.98]"
            >
              {t('common.actions.cancel')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmActionSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="destructive"
        title={t('subscriptionPlans.confirmDeleteTitle')}
        description={t('admin.plans.confirmDeleteDescription', { name: plan.name })}
        confirmText={t('subscriptionPlans.confirmDelete')}
        onConfirm={handleConfirm}
      />
    </>
  );
};
