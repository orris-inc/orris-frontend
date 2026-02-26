/**
 * Subscription detail dialog component
 */

import { useTranslation } from 'react-i18next';
import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Link as LinkIcon,
  Monitor,
  User,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Separator } from '@/components/common/Separator';
import { AdminBadge, TruncatedId } from '@/components/admin';
import { SubscriptionLinkSelector } from '@/components/subscription';
import { formatDate, isNeverExpiresDate } from '@/shared/utils/date-utils';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { SUBSCRIPTION_STATUS_CONFIG, PLAN_TYPE_CONFIG } from '@/shared/constants/status-config';
import type { Subscription } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionDetailDialogProps {
  open: boolean;
  subscription: Subscription | null;
  user?: UserResponse;
  onClose: () => void;
}


// Detail item component
const DetailItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  copyable?: string;
  successMessage?: string;
}> = ({ icon, label, value, copyable, successMessage }) => {
  const { showSuccess } = useNotificationStore();

  const handleCopy = async () => {
    if (copyable) {
      await navigator.clipboard.writeText(copyable);
      showSuccess(successMessage || 'Copied');
    }
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="text-sm text-foreground break-all">{value}</div>
      </div>
      {copyable && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={handleCopy}
        >
          <Copy className="size-3.5" />
        </Button>
      )}
    </div>
  );
};

export const SubscriptionDetailDialog: React.FC<SubscriptionDetailDialogProps> = ({
  open,
  subscription,
  user,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!subscription) return null;

  const statusConfig = SUBSCRIPTION_STATUS_CONFIG[subscription.status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
  const planTypeConfig = subscription.plan?.planType
    ? PLAN_TYPE_CONFIG[subscription.plan.planType]
    : { labelKey: 'common.planType.node', variant: 'info' as const };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {t('subscription.details')}
            <AdminBadge variant={statusConfig.variant}>{t(statusConfig.labelKey)}</AdminBadge>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            {t('subscription.idLabel')} <TruncatedId id={subscription.id} fullWidth />
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 py-2">
          {/* Subscription link */}
          {subscription.subscribeUrl && (
            <div className="rounded-lg border border-border p-3 bg-muted/50">
              <div className="mb-2">
                <span className="text-xs font-medium text-muted-foreground">{t('subscription.link')}</span>
              </div>
              <SubscriptionLinkSelector subscribeUrl={subscription.subscribeUrl} compact />
            </div>
          )}

          <Separator />

          {/* User info */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">{t('subscription.userInfo')}</h4>
            <DetailItem
              icon={<User className="size-4" />}
              label={t('common.role.user')}
              value={user ? (
                <div>
                  <div>{user.name || t('userInfo.noNameSet')}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              ) : `${t('common.role.user')} ID: ${subscription.userId}`}
              successMessage={t('common.messages.copySuccess')}
            />
          </div>

          <Separator />

          {/* Plan info */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">{t('subscription.planInfo')}</h4>
            {subscription.plan ? (
              <>
                <DetailItem
                  icon={<CreditCard className="size-4" />}
                  label={t('subscription.planName')}
                  value={
                    <div className="flex items-center gap-2">
                      <span>{subscription.plan.name}</span>
                      <AdminBadge variant={planTypeConfig.variant} className="text-[10px]">
                        {t(planTypeConfig.labelKey)}
                      </AdminBadge>
                    </div>
                  }
                  successMessage={t('common.messages.copySuccess')}
                />
                <DetailItem
                  icon={<Clock className="size-4" />}
                  label={t('subscription.pricingOptions')}
                  value={
                    subscription.plan.pricings && subscription.plan.pricings.length > 0 ? (
                      <div className="space-y-1">
                        {subscription.plan.pricings.map((pricing) => (
                          <div key={pricing.billingCycle} className="text-sm">
                            {pricing.billingCycle}: {pricing.price} {pricing.currency}
                            {!pricing.isActive && <span className="text-xs text-muted-foreground ml-1">({t('common.status.disabled')})</span>}
                          </div>
                        ))}
                      </div>
                    ) : '-'
                  }
                  successMessage={t('common.messages.copySuccess')}
                />
              </>
            ) : (
              <div className="text-sm text-muted-foreground">{t('subscription.noPlan')}</div>
            )}
          </div>

          <Separator />

          {/* Date info */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">{t('subscription.dateInfo')}</h4>
            <DetailItem
              icon={<Calendar className="size-4" />}
              label={t('subscription.startDate')}
              value={formatDate(subscription.startDate)}
              successMessage={t('common.messages.copySuccess')}
            />
            <DetailItem
              icon={<Calendar className="size-4" />}
              label={t('subscription.endDate')}
              value={subscription.endDate && !isNeverExpiresDate(subscription.endDate) ? formatDate(subscription.endDate) : t('common.fields.neverExpires')}
              successMessage={t('common.messages.copySuccess')}
            />
            <DetailItem
              icon={<Clock className="size-4" />}
              label={t('subscription.currentPeriod')}
              value={`${formatDate(subscription.currentPeriodStart)} ~ ${formatDate(subscription.currentPeriodEnd)}`}
              successMessage={t('common.messages.copySuccess')}
            />
            <DetailItem
              icon={<Clock className="size-4" />}
              label={t('common.fields.createdAt')}
              value={formatDate(subscription.createdAt)}
              successMessage={t('common.messages.copySuccess')}
            />
          </div>

          <Separator />

          {/* Status info */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">{t('subscription.statusInfo')}</h4>
            {/* Auto-renew item hidden - feature not complete */}
            <DetailItem
              icon={subscription.isActive ? <CheckCircle className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />}
              label={t('subscription.isActive')}
              value={subscription.isActive ? t('common.yes') : t('common.no')}
              successMessage={t('common.messages.copySuccess')}
            />
            <DetailItem
              icon={subscription.isExpired ? <XCircle className="size-4 text-destructive" /> : <CheckCircle className="size-4 text-success" />}
              label={t('subscription.isExpired')}
              value={subscription.isExpired ? t('common.status.expired') : t('subscriptionStatus.notExpired')}
              successMessage={t('common.messages.copySuccess')}
            />
            <DetailItem
              icon={<Monitor className="size-4" />}
              label={t('subscription.deviceUsage')}
              value={`${subscription.onlineDeviceCount} / ${subscription.deviceLimit === 0 ? t('subscription.unlimited') : subscription.deviceLimit}`}
              successMessage={t('common.messages.copySuccess')}
            />
            {subscription.cancelledAt && (
              <DetailItem
                icon={<XCircle className="size-4 text-destructive" />}
                label={t('subscription.cancelledAt')}
                value={formatDate(subscription.cancelledAt)}
                successMessage={t('common.messages.copySuccess')}
              />
            )}
            {subscription.cancelReason && (
              <DetailItem
                icon={<XCircle className="size-4 text-destructive" />}
                label={t('subscription.cancelReason')}
                value={subscription.cancelReason}
                successMessage={t('common.messages.copySuccess')}
              />
            )}
          </div>

          <Separator />

          {/* UUID info */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">{t('subscription.identifyInfo')}</h4>
            <DetailItem
              icon={<LinkIcon className="size-4" />}
              label={t('subscription.uuid')}
              value={<TruncatedId id={subscription.uuid} fullWidth />}
              successMessage={t('common.messages.copySuccess')}
            />
          </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            {t('common.actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
