/**
 * Subscription List Table Component (Admin)
 * Implemented using TanStack Table
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, X, MoreHorizontal, Play, XCircle, RefreshCw, Eye, Copy, Trash2, Pause, PlayCircle, RefreshCcw } from 'lucide-react';
import { DataTable, AdminBadge, TableHoverCardProvider, TableHoverCardList, DateTimeCell, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { SubscriptionMobileList } from './SubscriptionMobileList';
import { Skeleton } from '@/components/common/Skeleton';
import { Button } from '@/components/common/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import { SUBSCRIPTION_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { Subscription } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface SubscriptionListTableProps {
  subscriptions: Subscription[];
  usersMap?: Record<string, UserResponse>;
  usersLoading?: boolean;
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail?: (subscription: Subscription) => void;
  onDuplicate?: (subscription: Subscription) => void;
  onActivate?: (subscription: Subscription) => void;
  onCancel?: (subscription: Subscription) => void;
  onRenew?: (subscription: Subscription) => void;
  onSuspend?: (subscription: Subscription) => void;
  onUnsuspend?: (subscription: Subscription) => void;
  onResetUsage?: (subscription: Subscription) => void;
  onDelete?: (subscription: Subscription) => void;
}


export const SubscriptionListTable: React.FC<SubscriptionListTableProps> = ({
  subscriptions,
  usersMap = {},
  usersLoading = false,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onDuplicate,
  onActivate,
  onCancel,
  onRenew,
  onSuspend,
  onUnsuspend,
  onResetUsage,
  onDelete,
}) => {
  const { t } = useTranslation();
  // Detect mobile screen
  const { isMobile } = useBreakpoint();

  const columns = useMemo<ColumnDef<Subscription>[]>(() => [
    {
      id: 'user',
      header: t('common.role.user'),
      size: 200,
      meta: { priority: 1, sticky: 'left' } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const subscription = row.original;
        // userId is number, but usersMap key is string (user.id)
        // Convert userId to string for lookup
        const user = usersMap[String(subscription.userId)];
        const isUserLoading = usersLoading || (!user && Object.keys(usersMap).length === 0);

        if (isUserLoading) {
          return (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          );
        }

        const hoverItems = [
          { label: t('tableColumns.subscriptionId'), value: subscription.id },
          { label: t('tableColumns.userId'), value: String(subscription.userId) },
          ...(user?.email ? [{ label: t('tableColumns.email'), value: user.email }] : []),
        ];

        return (
          <TableHoverCardList
            columnKey="user"
            items={hoverItems}
            contentClassName="w-72"
          >
            <div className="flex flex-col gap-0.5 cursor-default">
              <span className="font-semibold text-foreground whitespace-nowrap truncate">
                {user?.name || user?.email || `User #${subscription.userId}`}
              </span>
              <code className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded w-fit">
                {subscription.id}
              </code>
            </div>
          </TableHoverCardList>
        );
      },
    },
    {
      id: 'plan',
      header: t('tableColumns.plan'),
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const plan = row.original.plan;
        const activePricings = plan?.pricings?.filter(p => p.isActive) || [];
        const cycleText = activePricings.length > 0
          ? activePricings.map(p => p.billingCycle).join(', ')
          : plan?.pricings && plan.pricings.length > 0
            ? plan.pricings.map(p => p.billingCycle).join(', ')
            : '-';

        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-white">
              {plan?.name || t('subscription.unknownPlan')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {cycleText}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('common.status.label'),
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const statusConfig = SUBSCRIPTION_STATUS_CONFIG[row.original.status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
        return (
          <AdminBadge variant={statusConfig.variant}>
            {t(statusConfig.labelKey)}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: t('tableColumns.startDate'),
      size: 100,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => <DateTimeCell value={row.original.startDate} format="date" />,
    },
    {
      accessorKey: 'endDate',
      header: t('tableColumns.endDate'),
      size: 100,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => <DateTimeCell value={row.original.endDate} format="date" />,
    },
    {
      accessorKey: 'autoRenew',
      header: t('tableColumns.autoRenew'),
      size: 80,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        row.original.autoRenew ? (
          <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        ) : (
          <X className="size-4 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
        )
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('common.fields.createdAt'),
      size: 100,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => <DateTimeCell value={row.original.createdAt} format="date" />,
    },
    {
      id: 'actions',
      header: t('common.table.actions'),
      size: 120,
      meta: { priority: 1, sticky: 'right' } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const subscription = row.original;
        const status = subscription.status;

        // Activate: can activate if in inactive or pending_payment status
        const canActivate = status === 'inactive' || status === 'pending_payment';
        // Unsuspend: can unsuspend if in suspended status
        const canUnsuspend = status === 'suspended';
        // Cancel: can cancel if in active, trialing, or past_due status
        const canCancel = status === 'active' || status === 'trialing' || status === 'past_due';
        // Suspend: can suspend if in active status
        const canSuspend = status === 'active';
        // Reset usage: can reset if in active or suspended status
        const canResetUsage = status === 'active' || status === 'suspended';
        // Renew: can renew if in expired status
        const canRenew = status === 'expired';
        // Delete: can delete if cancelled or expired
        const canDelete = status === 'cancelled' || status === 'expired';

        return (
          <div className="flex items-center gap-1">
            {canActivate && onActivate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950"
                onClick={() => onActivate(subscription)}
              >
                <Play className="size-4" />
                <span className="ml-1">{t('common.actions.activate')}</span>
              </Button>
            )}
            {canUnsuspend && onUnsuspend && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950"
                onClick={() => onUnsuspend(subscription)}
              >
                <PlayCircle className="size-4" />
                <span className="ml-1">{t('subscription.unsuspend')}</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">{t('aria.openMenu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent align="end" collisionPadding={16}>
                  {onViewDetail && (
                    <DropdownMenuItem onClick={() => onViewDetail(subscription)}>
                      <Eye className="mr-2 size-4" />
                      {t('subscription.viewDetails')}
                    </DropdownMenuItem>
                  )}
                  {onDuplicate && (
                    <DropdownMenuItem onClick={() => onDuplicate(subscription)}>
                      <Copy className="mr-2 size-4" />
                      {t('subscription.duplicate')}
                    </DropdownMenuItem>
                  )}
                  {(onViewDetail || onDuplicate) && (canRenew || canCancel || canSuspend) && <DropdownMenuSeparator />}
                  {canRenew && onRenew && (
                    <DropdownMenuItem onClick={() => onRenew(subscription)}>
                      <RefreshCw className="mr-2 size-4" />
                      {t('subscription.renewSubscription')}
                    </DropdownMenuItem>
                  )}
                  {canSuspend && onSuspend && (
                    <DropdownMenuItem
                      onClick={() => onSuspend(subscription)}
                      className="text-warning focus:text-warning"
                    >
                      <Pause className="mr-2 size-4" />
                      {t('subscription.suspend')}
                    </DropdownMenuItem>
                  )}
                  {canResetUsage && onResetUsage && (
                    <DropdownMenuItem onClick={() => onResetUsage(subscription)}>
                      <RefreshCcw className="mr-2 size-4" />
                      {t('subscription.resetUsage')}
                    </DropdownMenuItem>
                  )}
                  {(canRenew || canSuspend || canResetUsage) && canCancel && onCancel && <DropdownMenuSeparator />}
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
          </div>
        );
      },
    },
  ], [t, usersMap, usersLoading, onViewDetail, onDuplicate, onActivate, onCancel, onRenew, onSuspend, onUnsuspend, onResetUsage, onDelete]);

  // Context menu content renderer
  const renderContextMenuContent = useCallback((subscription: Subscription) => {
    const status = subscription.status;
    const canActivate = status === 'inactive' || status === 'pending_payment';
    const canUnsuspend = status === 'suspended';
    const canCancel = status === 'active' || status === 'trialing' || status === 'past_due';
    const canSuspend = status === 'active';
    const canResetUsage = status === 'active' || status === 'suspended';
    const canRenew = status === 'expired';
    const canDelete = status === 'cancelled' || status === 'expired';

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
        {(onViewDetail || onDuplicate) && (canActivate || canUnsuspend || canRenew || canCancel || canSuspend) && <ContextMenuSeparator />}
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
  }, [t, onViewDetail, onDuplicate, onActivate, onUnsuspend, onCancel, onSuspend, onResetUsage, onRenew, onDelete]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <SubscriptionMobileList
        subscriptions={subscriptions}
        usersMap={usersMap}
        usersLoading={usersLoading}
        loading={loading}
        onViewDetail={onViewDetail}
        onDuplicate={onDuplicate}
        onActivate={onActivate}
        onCancel={onCancel}
        onRenew={onRenew}
        onSuspend={onSuspend}
        onUnsuspend={onUnsuspend}
        onResetUsage={onResetUsage}
        onDelete={onDelete}
      />
    );
  }

  return (
    <TableHoverCardProvider>
      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage={t('subscription.noData')}
        getRowId={(row) => String(row.id)}
        enableContextMenu
        contextMenuContent={renderContextMenuContent}
      />
    </TableHoverCardProvider>
  );
};
