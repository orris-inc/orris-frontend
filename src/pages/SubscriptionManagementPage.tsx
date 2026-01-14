/**
 * Subscription Management Page (Admin)
 * High-density data management interface with responsive mobile support
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Receipt,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Pause,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminButton, AdminCard } from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useSubscriptionsPage } from '@/features/subscriptions/hooks/useSubscriptions';
import { SubscriptionListTable } from '@/features/subscriptions/components/SubscriptionListTable';
import { SubscriptionDetailDialog } from '@/features/subscriptions/components/SubscriptionDetailDialog';
import { DuplicateSubscriptionDialog } from '@/features/subscriptions/components/DuplicateSubscriptionDialog';
import { DuplicateSubscriptionSheet } from '@/features/subscriptions/components/DuplicateSubscriptionSheet';
import { CancelSubscriptionDialog } from '@/features/subscriptions/components/CancelSubscriptionDialog';
import { CancelSubscriptionSheet } from '@/features/subscriptions/components/CancelSubscriptionSheet';
import { SuspendSubscriptionSheet } from '@/features/subscriptions/components/SuspendSubscriptionSheet';
import { DeleteSubscriptionSheet } from '@/features/subscriptions/components/DeleteSubscriptionSheet';
import { MobileSubscriptionManagement } from '@/features/subscriptions/components/MobileSubscriptionManagement';
import { adminCreateSubscription, adminUpdateSubscriptionStatus, adminDeleteSubscription } from '@/api/subscription';
import { suspendSubscription, unsuspendSubscription, resetSubscriptionUsage } from '@/api/admin';
import type { Subscription } from '@/api/subscription/types';

export const SubscriptionManagementPage: React.FC = () => {
  const { t } = useTranslation();
  usePageTitle(t('admin.subscriptions.pageTitle'));

  const { isMobile } = useBreakpoint();

  const {
    subscriptions,
    pagination,
    isLoading,
    isFetching,
    refetch,
    usersMap,
    isUsersLoading,
    handlePageChange,
    handlePageSizeChange,
  } = useSubscriptionsPage();

  const { showSuccess, showError } = useNotificationStore();

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);
  const [subscriptionToSuspend, setSubscriptionToSuspend] = useState<Subscription | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate subscription statistics (synced with SDK 2025-01-14)
  const stats = useMemo(() => {
    const total = pagination.total;
    const active = subscriptions.filter((s) => s.status === 'active').length;
    const trialing = subscriptions.filter((s) => s.status === 'trialing').length;
    const inactive = subscriptions.filter((s) => s.status === 'inactive').length;
    const pendingPayment = subscriptions.filter((s) => s.status === 'pending_payment').length;
    const pastDue = subscriptions.filter((s) => s.status === 'past_due').length;
    const suspended = subscriptions.filter((s) => s.status === 'suspended').length;
    const cancelled = subscriptions.filter((s) => s.status === 'cancelled').length;
    const expired = subscriptions.filter((s) => s.status === 'expired').length;
    return { total, active, trialing, inactive, pendingPayment, pastDue, suspended, cancelled, expired };
  }, [subscriptions, pagination.total]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleViewDetail = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailDialogOpen(true);
  };

  const handleDuplicate = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateSubmit = async (data: Parameters<typeof adminCreateSubscription>[0]) => {
    try {
      await adminCreateSubscription(data);
      showSuccess(t('messages.subscriptionCreateSuccess'));
      setDuplicateDialogOpen(false);
      setSelectedSubscription(null);
      refetch();
    } catch {
      showError(t('messages.subscriptionCreateFailed'));
    }
  };

  const handleActivate = async (subscription: Subscription) => {
    try {
      await adminUpdateSubscriptionStatus(subscription.id, { status: 'active' });
      showSuccess(t('messages.subscriptionActivated'));
      refetch();
    } catch {
      showError(t('messages.subscriptionActivateFailed'));
    }
  };

  const handleCancelClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async (reason: string, immediate: boolean) => {
    if (!selectedSubscription) return;
    try {
      await adminUpdateSubscriptionStatus(selectedSubscription.id, {
        status: 'cancelled',
        reason,
        immediate,
      });
      showSuccess(t('messages.subscriptionCancelled'));
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      refetch();
    } catch {
      showError(t('messages.subscriptionCancelFailed'));
    }
  };

  const handleRenew = async (subscription: Subscription) => {
    try {
      await adminUpdateSubscriptionStatus(subscription.id, { status: 'renewed' });
      showSuccess(t('messages.subscriptionRenewed'));
      refetch();
    } catch {
      showError(t('messages.subscriptionRenewFailed'));
    }
  };

  const handleSuspendClick = (subscription: Subscription) => {
    setSubscriptionToSuspend(subscription);
    setSuspendDialogOpen(true);
  };

  const handleSuspendConfirm = async (reason: string) => {
    if (!subscriptionToSuspend) return;
    try {
      await suspendSubscription(subscriptionToSuspend.id, { reason });
      showSuccess(t('messages.subscriptionSuspended'));
      setSuspendDialogOpen(false);
      setSubscriptionToSuspend(null);
      refetch();
    } catch {
      showError(t('messages.subscriptionSuspendFailed'));
    }
  };

  const handleUnsuspend = async (subscription: Subscription) => {
    try {
      await unsuspendSubscription(subscription.id);
      showSuccess(t('messages.subscriptionUnsuspended'));
      refetch();
    } catch {
      showError(t('messages.subscriptionUnsuspendFailed'));
    }
  };

  const handleResetUsage = async (subscription: Subscription) => {
    try {
      const result = await resetSubscriptionUsage(subscription.id);
      const message = result.wasSuspended
        ? t('messages.subscriptionUsageResetAndUnsuspended')
        : t('messages.subscriptionUsageReset');
      showSuccess(message);
      refetch();
    } catch {
      showError(t('messages.subscriptionUsageResetFailed'));
    }
  };

  const handleDeleteClick = (subscription: Subscription) => {
    setSubscriptionToDelete(subscription);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (subscription: Subscription) => {
    try {
      await adminDeleteSubscription(subscription.id);
      showSuccess(t('messages.subscriptionDeleted'));
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
      refetch();
    } catch {
      showError(t('messages.subscriptionDeleteFailed'));
    }
  };

  // Wrapper for desktop ConfirmDialog which doesn't pass entity
  const handleDesktopDeleteConfirm = async () => {
    if (!subscriptionToDelete) return;
    await handleDeleteConfirm(subscriptionToDelete);
  };

  // Mobile view - uses MobileSubscriptionManagement with built-in detail sheet
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3">
          <MobileSubscriptionManagement
            subscriptions={subscriptions}
            usersMap={usersMap}
            loading={isLoading || isFetching}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onRefresh={handleRefresh}
            onViewDetail={handleViewDetail}
            onActivate={handleActivate}
            onCancel={handleCancelClick}
            onRenew={handleRenew}
            onSuspend={handleSuspendClick}
            onUnsuspend={handleUnsuspend}
            onResetUsage={handleResetUsage}
            onDelete={handleDeleteClick}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Duplicate Subscription Sheet */}
        <DuplicateSubscriptionSheet
          open={duplicateDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDuplicateDialogOpen(false);
              setSelectedSubscription(null);
            }
          }}
          subscription={selectedSubscription}
          user={selectedSubscription ? usersMap[selectedSubscription.userId] : undefined}
          onSubmit={handleDuplicateSubmit}
        />

        {/* Cancel Subscription Sheet */}
        <CancelSubscriptionSheet
          open={cancelDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCancelDialogOpen(false);
              setSelectedSubscription(null);
            }
          }}
          subscription={selectedSubscription}
          onConfirm={handleCancelConfirm}
        />

        {/* Suspend Subscription Sheet */}
        <SuspendSubscriptionSheet
          open={suspendDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setSuspendDialogOpen(false);
              setSubscriptionToSuspend(null);
            }
          }}
          subscription={subscriptionToSuspend}
          onConfirm={handleSuspendConfirm}
        />

        {/* Delete Subscription Sheet */}
        <DeleteSubscriptionSheet
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteDialogOpen(false);
              setSubscriptionToDelete(null);
            }
          }}
          entity={subscriptionToDelete}
          user={subscriptionToDelete ? usersMap[subscriptionToDelete.userId] : undefined}
          onConfirm={handleDeleteConfirm}
        />
      </AdminLayout>
    );
  }

  // Desktop view - original layout with header and table
  return (
    <AdminLayout>
      <div className="py-3 space-y-3">
        {/* High-Density Status Bar - All metrics inline */}
        <header className="bg-card rounded-lg border border-border px-3 py-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Title + Primary Stats */}
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-foreground">{t('admin.subscriptions.pageTitle')}</h1>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Receipt className="size-3" />
                  <span className="font-medium text-foreground">{stats.total}</span>
                  <span className="hidden sm:inline">{t('admin.subscriptions.label')}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="font-medium text-success">{stats.active}</span>
                </span>
              </div>
            </div>

            {/* Center: Secondary Stats */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              {stats.trialing > 0 && (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3 text-info" />
                  <span className="text-muted-foreground">{t('subscriptionStatus.trialing')}</span>
                  <span className="font-semibold tabular-nums text-info">{stats.trialing}</span>
                </span>
              )}
              {stats.pendingPayment > 0 && (
                <span className="flex items-center gap-1.5">
                  <CreditCard className="size-3 text-warning" />
                  <span className="text-muted-foreground">{t('subscriptionStatus.pendingPayment')}</span>
                  <span className="font-semibold tabular-nums text-warning">{stats.pendingPayment}</span>
                </span>
              )}
              {stats.pastDue > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3 text-warning" />
                  <span className="text-muted-foreground">{t('subscriptionStatus.pastDue')}</span>
                  <span className="font-semibold tabular-nums text-warning">{stats.pastDue}</span>
                </span>
              )}
              {stats.suspended > 0 && (
                <span className="flex items-center gap-1.5">
                  <Pause className="size-3 text-destructive" />
                  <span className="text-muted-foreground">{t('subscriptionStatus.suspended')}</span>
                  <span className="font-semibold tabular-nums text-destructive">{stats.suspended}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <XCircle className="size-3 text-destructive" />
                <span className="text-muted-foreground">{t('subscriptionStatus.cancelled')}</span>
                <span className="font-semibold tabular-nums text-foreground">{stats.cancelled}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <AlertCircle className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">{t('subscriptionStatus.expired')}</span>
                <span className="font-semibold tabular-nums text-foreground">{stats.expired}</span>
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-7 w-7 p-0"
                    icon={
                      <RefreshCw
                        key={refreshKey}
                        className="size-3.5 animate-spin-once"
                        strokeWidth={1.5}
                      />
                    }
                  >
                    <span className="sr-only">{t('common.actions.refresh')}</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>{t('admin.subscriptions.refreshList')}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Subscription List Table */}
        <AdminCard noPadding>
          <SubscriptionListTable
            subscriptions={subscriptions}
            usersMap={usersMap}
            usersLoading={isUsersLoading}
            loading={isLoading || isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onViewDetail={handleViewDetail}
            onDuplicate={handleDuplicate}
            onActivate={handleActivate}
            onCancel={handleCancelClick}
            onRenew={handleRenew}
            onSuspend={handleSuspendClick}
            onUnsuspend={handleUnsuspend}
            onResetUsage={handleResetUsage}
            onDelete={handleDeleteClick}
          />
        </AdminCard>
      </div>

      {/* Subscription Detail Dialog */}
      <SubscriptionDetailDialog
        open={detailDialogOpen}
        subscription={selectedSubscription}
        user={selectedSubscription ? usersMap[selectedSubscription.userId] : undefined}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedSubscription(null);
        }}
      />

      {/* Duplicate Subscription Dialog */}
      <DuplicateSubscriptionDialog
        open={duplicateDialogOpen}
        subscription={selectedSubscription}
        user={selectedSubscription ? usersMap[selectedSubscription.userId] : undefined}
        onClose={() => {
          setDuplicateDialogOpen(false);
          setSelectedSubscription(null);
        }}
        onSubmit={handleDuplicateSubmit}
      />

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        subscription={selectedSubscription}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedSubscription(null);
        }}
        onConfirm={handleCancelConfirm}
      />

      {/* Suspend Subscription Sheet (Desktop) */}
      <SuspendSubscriptionSheet
        open={suspendDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSuspendDialogOpen(false);
            setSubscriptionToSuspend(null);
          }
        }}
        subscription={subscriptionToSuspend}
        onConfirm={handleSuspendConfirm}
      />

      {/* Delete Subscription Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('admin.subscriptions.confirmDeleteTitle')}
        description={t('common.messages.confirmDelete')}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={handleDesktopDeleteConfirm}
      />
    </AdminLayout>
  );
};
