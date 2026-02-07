/**
 * Assign Subscription Dialog Component (Admin)
 * Supports multiple pricing selection
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Info, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import { SimpleSelect } from '@/lib/SimpleSelect';
import { getButtonClass, labelStyles, alertStyles, alertDescriptionStyles } from '@/lib/ui-styles';
import { useAssignSubscriptionForm, BILLING_CYCLE_KEYS, formatPrice } from '../hooks/useAssignSubscriptionForm';
import type { BillingCycle, AdminCreateSubscriptionRequest } from '@/api/subscription/types';
import type { UserListItem } from '@/features/users/types/users.types';

interface AssignSubscriptionDialogProps {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onSubmit: (data: AdminCreateSubscriptionRequest) => Promise<void>;
}

export const AssignSubscriptionDialog: React.FC<AssignSubscriptionDialogProps> = ({
  open,
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
    isFormValid,
  } = useAssignSubscriptionForm({ user, open });

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

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="@container fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                {t('subscription.assignToUser')}
              </Dialog.Title>
              {user && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('common.role.user')}: {user.name} ({user.email})
                </p>
              )}
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
                    <p>{t('fields.name')}: {selectedPlan.name}</p>
                    {selectedPricing && (
                      <p>
                        {t('fields.price')}: {formatPrice(selectedPricing.price, selectedPricing.currency)} / {t(BILLING_CYCLE_KEYS[selectedPricing.billingCycle])}
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
                  {t('subscription.assignInfo')}
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
                  {t('subscription.assigning')}
                </>
              ) : (
                t('subscription.confirmAssign')
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
