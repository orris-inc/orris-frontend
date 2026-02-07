/**
 * Duplicate Subscription Dialog Component (Admin)
 * Create new subscription based on existing subscription
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Info, X, Copy } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import { SimpleSelect } from '@/lib/SimpleSelect';
import { getButtonClass, labelStyles, alertStyles, alertDescriptionStyles } from '@/lib/ui-styles';
import { TruncatedId } from '@/components/admin';
import { useDuplicateSubscriptionForm, formatPrice } from '../hooks/useDuplicateSubscriptionForm';
import type { BillingCycle, Subscription, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface DuplicateSubscriptionDialogProps {
  open: boolean;
  subscription: Subscription | null;
  user?: UserResponse;
  onClose: () => void;
  onSubmit: (data: AdminCreateSubscriptionRequest) => Promise<void>;
}

export const DuplicateSubscriptionDialog: React.FC<DuplicateSubscriptionDialogProps> = ({
  open,
  subscription,
  user,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const {
    formData,
    setFormData,
    plansLoading,
    selectedPlan,
    availablePricings,
    selectedPricing,
    planOptions,
    billingCycleOptions,
    BILLING_CYCLE_LABELS,
    isFormValid,
  } = useDuplicateSubscriptionForm({ subscription, open });

  const handleSubmit = async () => {
    if (!isFormValid) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (openState: boolean) => {
    if (!openState && !submitting) {
      onClose();
    }
  };

  if (!subscription) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="@container fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
                <Copy className="size-5" />
                {t('subscription.duplicate')}
              </Dialog.Title>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                {t('subscription.baseOn')} <TruncatedId id={subscription.id} /> {t('subscription.createNew')}
              </p>
            </div>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">{t('common.actions.close')}</span>
            </Dialog.Close>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 py-4">
              {/* Target user display */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>{t('subscription.targetUser')}</LabelPrimitive.Root>
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  {user ? (
                    <span>{user.name || user.email} ({user.email})</span>
                  ) : (
                    <span className="text-muted-foreground">{t('labels.userId')}: {subscription.userId}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('subscription.sameUserAssignment')}
                </p>
              </div>

              {/* Subscription plan selection */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>{t('subscription.plan')}</LabelPrimitive.Root>
                <SimpleSelect
                  value={formData.planId}
                  onValueChange={(value) => setFormData({ ...formData, planId: value })}
                  options={planOptions}
                  placeholder={t('placeholders.selectPlan')}
                />
              </div>

              {/* Billing cycle selection */}
              <div className="grid gap-2">
                <LabelPrimitive.Root className={labelStyles}>
                  {t('subscription.billingCycle')}
                  {availablePricings.length > 1 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({availablePricings.length} {t('subscription.optionsAvailable')})
                    </span>
                  )}
                </LabelPrimitive.Root>
                <SimpleSelect
                  value={formData.billingCycle}
                  onValueChange={(value) => setFormData({ ...formData, billingCycle: value as BillingCycle })}
                  options={billingCycleOptions}
                  disabled={!selectedPlan}
                />
              </div>

              {/* Auto-renewal checkbox hidden - feature not complete */}

              {/* Plan details */}
              {selectedPlan && (
                <div className="rounded-md bg-muted p-4 text-sm">
                  <h4 className="font-medium mb-2">{t('subscription.planDetails')}</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>{t('subscription.planName')}: {selectedPlan.name}</p>
                    {selectedPricing && (
                      <p>
                        {t('subscription.pricing')}: {formatPrice(selectedPricing.price, selectedPricing.currency)} / {BILLING_CYCLE_LABELS[selectedPricing.billingCycle]}
                      </p>
                    )}
                    {selectedPlan.description && (
                      <p className="mt-1">{selectedPlan.description}</p>
                    )}
                  </div>
                </div>
              )}

              <div className={alertStyles}>
                <Info className="h-4 w-4" />
                <div className={alertDescriptionStyles}>
                  {t('subscription.duplicateInfo')}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className={getButtonClass('outline', 'default')}
            >
              {t('common.actions.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              className={getButtonClass('default', 'default')}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('subscription.creating')}
                </>
              ) : (
                t('subscription.create')
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
