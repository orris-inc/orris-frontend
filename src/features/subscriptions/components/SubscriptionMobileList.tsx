/**
 * Subscription Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import { useTranslation } from 'react-i18next';
import {
  MoreHorizontal,
  Play,
  PlayCircle,
  Pause,
  XCircle,
  RefreshCw,
  RefreshCcw,
  Eye,
  Copy,
  Trash2,
  CheckCircle,
  X,
  User,
  Calendar,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/common/ContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Skeleton } from '@/components/common/Skeleton';
import { formatDate } from '@/shared/utils/date-utils';
import { SUBSCRIPTION_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { Subscription } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionMobileListProps {
  subscriptions: Subscription[];
  usersMap?: Record<string, UserResponse>;
  usersLoading?: boolean;
  loading?: boolean;
  onViewDetail?: (subscription: Subscription) => void;
  onDuplicate?: (subscription: Subscription) => void;
  onActivate?: (subscription: Subscription) => void;
  onCancel?: (subscription: Subscription) => void;
  onRenew?: (subscription: Subscription) => void;
  onSuspend?: (subscription: Subscription) => void;
  onUnsuspend?: (subscription: Subscription) => void;
  onResetUsage?: (subscription: Subscription) => void;
  onDelete?: (subscription: Subscription) => void;
  onChangePlan?: (subscription: Subscription) => void;
}


// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-xl ring-1 ring-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

export const SubscriptionMobileList: React.FC<SubscriptionMobileListProps> = ({
  subscriptions,
  usersMap = {},
  usersLoading = false,
  loading = false,
  onViewDetail,
  onDuplicate,
  onActivate,
  onCancel,
  onRenew,
  onSuspend,
  onUnsuspend,
  onResetUsage,
  onDelete,
  onChangePlan,
}) => {
  const { t } = useTranslation();

  // Render context menu content
  const renderContextMenuContent = (subscription: Subscription) => {
    const status = subscription.status;
    const canActivate = status === 'inactive' || status === 'pending_payment';
    const canUnsuspend = status === 'suspended';
    const canCancel = status === 'active' || status === 'trialing' || status === 'past_due';
    const canSuspend = status === 'active';
    const canResetUsage = status === 'active' || status === 'suspended';
    const canRenew = status === 'active' || status === 'past_due' || status === 'expired';
    const canDelete = status === 'cancelled' || status === 'expired';
    const canChangePlan = status === 'active';

    return (
      <>
        {onViewDetail && (
          <ContextMenuItem onClick={() => onViewDetail(subscription)}>
            <Eye className="mr-2 size-4" />
            {t('subscription.viewDetails')}
          </ContextMenuItem>
        )}
        {onDuplicate && (
          <ContextMenuItem onClick={() => onDuplicate(subscription)}>
            <Copy className="mr-2 size-4" />
            {t('subscription.duplicate')}
          </ContextMenuItem>
        )}
        {(onViewDetail || onDuplicate) && (canActivate || canUnsuspend || canRenew || canCancel || canSuspend || canChangePlan) && <ContextMenuSeparator />}
        {canChangePlan && onChangePlan && (
          <ContextMenuItem onClick={() => onChangePlan(subscription)}>
            <ArrowRightLeft className="mr-2 size-4" />
            {t('subscription.changePlan')}
          </ContextMenuItem>
        )}
        {canActivate && onActivate && (
          <ContextMenuItem onClick={() => onActivate(subscription)}>
            <Play className="mr-2 size-4" />
            {t('common.actions.activate')}
          </ContextMenuItem>
        )}
        {canUnsuspend && onUnsuspend && (
          <ContextMenuItem onClick={() => onUnsuspend(subscription)}>
            <PlayCircle className="mr-2 size-4" />
            {t('subscription.unsuspend')}
          </ContextMenuItem>
        )}
        {canRenew && onRenew && (
          <ContextMenuItem onClick={() => onRenew(subscription)}>
            <RefreshCw className="mr-2 size-4" />
            {t('subscription.renewSubscription')}
          </ContextMenuItem>
        )}
        {canSuspend && onSuspend && (
          <ContextMenuItem
            onClick={() => onSuspend(subscription)}
            className="text-warning focus:text-warning"
          >
            <Pause className="mr-2 size-4" />
            {t('subscription.suspend')}
          </ContextMenuItem>
        )}
        {canResetUsage && onResetUsage && (
          <ContextMenuItem onClick={() => onResetUsage(subscription)}>
            <RefreshCcw className="mr-2 size-4" />
            {t('subscription.resetUsage')}
          </ContextMenuItem>
        )}
        {canCancel && onCancel && (
          <ContextMenuItem
            onClick={() => onCancel(subscription)}
            className="text-destructive focus:text-destructive"
          >
            <XCircle className="mr-2 size-4" />
            {t('subscription.cancel')}
          </ContextMenuItem>
        )}
        {canDelete && onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete(subscription)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t('subscription.delete')}
            </ContextMenuItem>
          </>
        )}
      </>
    );
  };

  // Render dropdown menu
  const renderDropdownMenu = (subscription: Subscription) => {
    const status = subscription.status;
    const canActivate = status === 'inactive' || status === 'pending_payment' || status === 'suspended';
    const canCancel = status === 'active' || status === 'trialing' || status === 'past_due';
    const canResetUsage = status === 'active' || status === 'suspended';
    const canRenew = status === 'active' || status === 'past_due' || status === 'expired';
    const canDelete = status === 'cancelled' || status === 'expired';
    const canChangePlan = status === 'active';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-slate-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" collisionPadding={16}>
            {onViewDetail && (
              <DropdownMenuItem onSelect={() => onViewDetail(subscription)}>
                <Eye className="mr-2 size-4" />
                {t('subscription.viewDetails')}
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onSelect={() => onDuplicate(subscription)}>
                <Copy className="mr-2 size-4" />
                {t('subscription.duplicate')}
              </DropdownMenuItem>
            )}
            {(onViewDetail || onDuplicate) && (canActivate || canRenew || canResetUsage || canCancel || canChangePlan) && <DropdownMenuSeparator />}
            {canChangePlan && onChangePlan && (
              <DropdownMenuItem onSelect={() => onChangePlan(subscription)}>
                <ArrowRightLeft className="mr-2 size-4" />
                {t('subscription.changePlan')}
              </DropdownMenuItem>
            )}
            {canActivate && onActivate && (
              <DropdownMenuItem onSelect={() => onActivate(subscription)}>
                <Play className="mr-2 size-4" />
                {t('common.actions.activate')}
              </DropdownMenuItem>
            )}
            {canRenew && onRenew && (
              <DropdownMenuItem onSelect={() => onRenew(subscription)}>
                <RefreshCw className="mr-2 size-4" />
                {t('subscription.renewSubscription')}
              </DropdownMenuItem>
            )}
            {canResetUsage && onResetUsage && (
              <DropdownMenuItem onSelect={() => onResetUsage(subscription)}>
                <RefreshCcw className="mr-2 size-4" />
                {t('subscription.resetUsage')}
              </DropdownMenuItem>
            )}
            {canCancel && onCancel && (
              <DropdownMenuItem
                onClick={() => onCancel(subscription)}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 size-4" />
                {t('subscription.cancel')}
              </DropdownMenuItem>
            )}
            {canDelete && onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(subscription)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  {t('subscription.delete')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        {t('subscription.noData')}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {subscriptions.map((subscription) => {
        const statusConfig = SUBSCRIPTION_STATUS_CONFIG[subscription.status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
        const user = usersMap[String(subscription.userId)];
        const isUserLoading = usersLoading || (!user && Object.keys(usersMap).length === 0);
        const plan = subscription.plan;
        const status = subscription.status;
        const canActivate = status === 'inactive' || status === 'pending_payment' || status === 'suspended';

        return (
          <ContextMenu key={subscription.id}>
            <ContextMenuTrigger asChild>
              <AccordionItem
                value={subscription.id}
                className="rounded-xl ring-1 ring-border bg-white dark:bg-slate-800 overflow-hidden"
              >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* User and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {isUserLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {user?.name || user?.email || `User #${subscription.userId}`}
                      </span>
                    )}
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {t(statusConfig.labelKey)}
                    </AdminBadge>
                  </div>

                  {/* Plan name */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">{plan?.name || t('subscription.unknownPlan')}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="flex items-center gap-0.5">
                      <Calendar className="size-3" />
                      {formatDate(subscription.startDate)}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {canActivate && onActivate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onActivate(subscription)}
                          className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-[0.98] transition-all"
                        >
                          <Play className="size-3.5 text-green-500 hover:text-green-600" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t('common.actions.activate')}</TooltipContent>
                    </Tooltip>
                  )}
                  {onViewDetail && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onViewDetail(subscription)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
                        >
                          <Eye className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t('subscription.viewDetails')}</TooltipContent>
                    </Tooltip>
                  )}
                  {renderDropdownMenu(subscription)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-xs text-slate-400 dark:text-slate-500">{t('subscription.viewDetails')}</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                {/* Subscription ID */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">ID</span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{subscription.id}</span>
                </div>

                {/* User info */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">{t('common.role.user')}</span>
                  {isUserLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 min-w-0">
                      <User className="size-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{user?.email || `ID: ${subscription.userId}`}</span>
                    </div>
                  )}
                </div>

                {/* Plan */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">{t('tableColumns.plan')}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{plan?.name || t('subscription.unknownPlan')}</span>
                </div>

                {/* Date range */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">{t('subscription.dateInfo')}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {formatDate(subscription.startDate)} ~ {subscription.endDate ? formatDate(subscription.endDate) : t('common.unlimited')}
                  </span>
                </div>

                {/* Auto renew */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">{t('subscription.renew')}</span>
                  {subscription.autoRenew ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="size-3" />
                      {t('subscription.autoRenewal')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <X className="size-3" />
                      {t('subscription.manualRenewal')}
                    </span>
                  )}
                </div>

                {/* Created at */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-12 flex-shrink-0">{t('common.fields.createdAt')}</span>
                  <span className="text-xs text-slate-500">{formatDate(subscription.createdAt)}</span>
                </div>
              </div>
            </AccordionContent>
              </AccordionItem>
            </ContextMenuTrigger>
            <ContextMenuContent>
              {renderContextMenuContent(subscription)}
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </Accordion>
  );
};
