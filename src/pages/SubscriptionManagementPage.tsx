/**
 * Subscription Management Page (Admin)
 * Tailwind Application UI style
 * Mobile-first responsive design
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/common/Button';
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
import { RenewSubscriptionDialog } from '@/features/subscriptions/components/RenewSubscriptionDialog';
import { RenewSubscriptionSheet } from '@/features/subscriptions/components/RenewSubscriptionSheet';
import { EditSubscriptionDialog } from '@/features/subscriptions/components/EditSubscriptionDialog';
import { EditSubscriptionSheet } from '@/features/subscriptions/components/EditSubscriptionSheet';
import { ChangePlanDialog } from '@/features/subscriptions/components/ChangePlanDialog';
import { ChangePlanSheet } from '@/features/subscriptions/components/ChangePlanSheet';
import { MobileSubscriptionManagement } from '@/features/subscriptions/components/MobileSubscriptionManagement';
import { SubscriptionFilters } from '@/features/subscriptions/components/SubscriptionFilters';
import { useDashboardStats } from '@/features/admin-traffic/hooks/useDashboardStats';
import {
  adminCreateSubscription,
  adminUpdateSubscriptionStatus,
  adminDeleteSubscription,
} from '@/api/subscription';
import {
  suspendSubscription,
  unsuspendSubscription,
  resetSubscriptionUsage,
  renewSubscription,
  changeSubscriptionPlan,
  updateAdminSubscription,
} from '@/api/admin';
import type { AdminUpdateSubscriptionRequest, ChangePlanRequest, RenewSubscriptionRequest } from '@/api/admin/types';
import type { Subscription } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

type DialogType =
  | 'detail'
  | 'duplicate'
  | 'cancel'
  | 'delete'
  | 'suspend'
  | 'renew'
  | 'edit'
  | 'changePlan'
  | null;

// ============================================================================
// Main Component
// ============================================================================

export function SubscriptionManagementPage() {
  const { t } = useTranslation();
  usePageTitle(t('admin.subscriptions.pageTitle'));

  const { isMobile } = useBreakpoint();
  const { showSuccess, showError } = useNotificationStore();

  // Subscription data and operations
  const {
    subscriptions,
    pagination,
    isLoading,
    isFetching,
    refetch,
    usersMap,
    isUsersLoading,
    filters,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
  } = useSubscriptionsPage();

  // Dialog state management
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Global subscription stats from dashboard API
  const { dashboard } = useDashboardStats();
  const subs = dashboard?.subscriptions;

  // Dialog handlers
  const openDialog = useCallback((type: DialogType, subscription?: Subscription) => {
    setSelectedSubscription(subscription ?? null);
    setActiveDialog(type);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setSelectedSubscription(null);
  }, []);

  // Action handlers
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const handleViewDetail = useCallback(
    (subscription: Subscription) => openDialog('detail', subscription),
    [openDialog]
  );

  const handleDuplicate = useCallback(
    (subscription: Subscription) => openDialog('duplicate', subscription),
    [openDialog]
  );

  const handleCancelClick = useCallback(
    (subscription: Subscription) => openDialog('cancel', subscription),
    [openDialog]
  );

  const handleSuspendClick = useCallback(
    (subscription: Subscription) => openDialog('suspend', subscription),
    [openDialog]
  );

  const handleDeleteClick = useCallback(
    (subscription: Subscription) => openDialog('delete', subscription),
    [openDialog]
  );

  const handleRenewClick = useCallback(
    (subscription: Subscription) => openDialog('renew', subscription),
    [openDialog]
  );

  const handleChangePlanClick = useCallback(
    (subscription: Subscription) => openDialog('changePlan', subscription),
    [openDialog]
  );

  const handleEditClick = useCallback(
    (subscription: Subscription) => openDialog('edit', subscription),
    [openDialog]
  );

  // Direct action handlers (no dialog needed)
  const handleActivate = useCallback(
    async (subscription: Subscription) => {
      try {
        await adminUpdateSubscriptionStatus(subscription.id, { status: 'active' });
        showSuccess(t('messages.subscriptionActivated'));
        refetch();
      } catch {
        showError(t('messages.subscriptionActivateFailed'));
      }
    },
    [showSuccess, showError, refetch, t]
  );

  const handleUnsuspend = useCallback(
    async (subscription: Subscription) => {
      try {
        await unsuspendSubscription(subscription.id);
        showSuccess(t('messages.subscriptionUnsuspended'));
        refetch();
      } catch {
        showError(t('messages.subscriptionUnsuspendFailed'));
      }
    },
    [showSuccess, showError, refetch, t]
  );

  const handleResetUsage = useCallback(
    async (subscription: Subscription) => {
      try {
        await resetSubscriptionUsage(subscription.id);
        showSuccess(t('messages.subscriptionUsageReset'));
        refetch();
      } catch {
        showError(t('messages.subscriptionUsageResetFailed'));
      }
    },
    [showSuccess, showError, refetch, t]
  );

  // Form submission handlers
  const handleDuplicateSubmit = useCallback(
    async (data: Parameters<typeof adminCreateSubscription>[0]) => {
      try {
        await adminCreateSubscription(data);
        showSuccess(t('messages.subscriptionCreateSuccess'));
        closeDialog();
        refetch();
      } catch {
        showError(t('messages.subscriptionCreateFailed'));
      }
    },
    [showSuccess, showError, closeDialog, refetch, t]
  );

  const handleCancelConfirm = useCallback(
    async (reason: string, immediate: boolean) => {
      if (!selectedSubscription) return;
      try {
        await adminUpdateSubscriptionStatus(selectedSubscription.id, {
          status: 'cancelled',
          reason,
          immediate,
        });
        showSuccess(t('messages.subscriptionCancelled'));
        closeDialog();
        refetch();
      } catch {
        showError(t('messages.subscriptionCancelFailed'));
      }
    },
    [selectedSubscription, showSuccess, showError, closeDialog, refetch, t]
  );

  const handleSuspendConfirm = useCallback(
    async (reason: string) => {
      if (!selectedSubscription) return;
      try {
        await suspendSubscription(selectedSubscription.id, { reason });
        showSuccess(t('messages.subscriptionSuspended'));
        closeDialog();
        refetch();
      } catch {
        showError(t('messages.subscriptionSuspendFailed'));
      }
    },
    [selectedSubscription, showSuccess, showError, closeDialog, refetch, t]
  );

  const handleDeleteConfirm = useCallback(
    async (subscription?: Subscription) => {
      const target = subscription ?? selectedSubscription;
      if (!target) return;
      try {
        await adminDeleteSubscription(target.id);
        showSuccess(t('messages.subscriptionDeleted'));
        closeDialog();
        refetch();
      } catch {
        showError(t('messages.subscriptionDeleteFailed'));
      }
    },
    [selectedSubscription, showSuccess, showError, closeDialog, refetch, t]
  );

  const handleRenewConfirm = useCallback(
    async (billingCycle?: RenewSubscriptionRequest['billingCycle']) => {
      if (!selectedSubscription) return;
      try {
        await renewSubscription(selectedSubscription.id, billingCycle ? { billingCycle } : undefined);
        showSuccess(t('messages.subscriptionRenewed'));
        closeDialog();
        refetch();
      } catch {
        showError(t('messages.subscriptionRenewFailed'));
      }
    },
    [selectedSubscription, showSuccess, showError, closeDialog, refetch, t]
  );

  const handleChangePlanConfirm = useCallback(
    async (data: ChangePlanRequest) => {
      if (!selectedSubscription) return;
      try {
        await changeSubscriptionPlan(selectedSubscription.id, data);
        showSuccess(t('messages.subscriptionPlanChanged'));
        closeDialog();
        refetch();
      } catch {
        showError(t('messages.subscriptionPlanChangeFailed'));
      }
    },
    [selectedSubscription, showSuccess, showError, closeDialog, refetch, t]
  );

  const handleEditConfirm = useCallback(
    async (data: AdminUpdateSubscriptionRequest) => {
      if (!selectedSubscription) return;
      try {
        await updateAdminSubscription(selectedSubscription.id, data);
        showSuccess(t('messages.subscriptionUpdated'));
        closeDialog();
        refetch();
      } catch {
        showError(t('messages.subscriptionUpdateFailed'));
      }
    },
    [selectedSubscription, showSuccess, showError, closeDialog, refetch, t]
  );

  // Get user for selected subscription
  const selectedUser = selectedSubscription ? usersMap[selectedSubscription.userId] : undefined;

  // Mobile layout
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3 pb-safe">
          <MobileSubscriptionManagement
            subscriptions={subscriptions}
            usersMap={usersMap}
            loading={isLoading || isFetching}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
            onViewDetail={handleViewDetail}
            onActivate={handleActivate}
            onCancel={handleCancelClick}
            onRenew={handleRenewClick}
            onSuspend={handleSuspendClick}
            onUnsuspend={handleUnsuspend}
            onResetUsage={handleResetUsage}
            onDelete={handleDeleteClick}
            onChangePlan={handleChangePlanClick}
            onEdit={handleEditClick}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Mobile Sheets */}
        <DuplicateSubscriptionSheet
          open={activeDialog === 'duplicate'}
          onOpenChange={(open) => !open && closeDialog()}
          subscription={selectedSubscription}
          user={selectedUser}
          onSubmit={handleDuplicateSubmit}
        />

        <CancelSubscriptionSheet
          open={activeDialog === 'cancel'}
          onOpenChange={(open) => !open && closeDialog()}
          subscription={selectedSubscription}
          onConfirm={handleCancelConfirm}
        />

        <SuspendSubscriptionSheet
          open={activeDialog === 'suspend'}
          onOpenChange={(open) => !open && closeDialog()}
          subscription={selectedSubscription}
          onConfirm={handleSuspendConfirm}
        />

        <DeleteSubscriptionSheet
          open={activeDialog === 'delete'}
          onOpenChange={(open) => !open && closeDialog()}
          entity={selectedSubscription}
          user={selectedUser}
          onConfirm={handleDeleteConfirm}
        />

        <RenewSubscriptionSheet
          open={activeDialog === 'renew'}
          onOpenChange={(open) => !open && closeDialog()}
          subscription={selectedSubscription}
          onConfirm={handleRenewConfirm}
        />

        <EditSubscriptionSheet
          open={activeDialog === 'edit'}
          onOpenChange={(open) => !open && closeDialog()}
          subscription={selectedSubscription}
          onConfirm={handleEditConfirm}
        />

        <ChangePlanSheet
          open={activeDialog === 'changePlan'}
          onOpenChange={(open) => !open && closeDialog()}
          subscription={selectedSubscription}
          onConfirm={handleChangePlanConfirm}
        />
      </AdminLayout>
    );
  }

  // Desktop layout
  return (
    <AdminLayout>
      <div className="space-y-4 py-4 pb-safe lg:py-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground">{t('admin.subscriptions.pageTitle')}</h1>
              <span className="text-xs font-medium text-muted-foreground/70 tabular-nums">
                {pagination.total} {t('admin.subscriptions.label')}
              </span>
            </div>
            {subs && (
              <div className="flex items-center gap-3 mt-1.5 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-success" />
                  {subs.active} {t('common.status.enabled')}
                </span>
                {subs.suspended > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-warning" />
                    {subs.suspended} {t('common.status.suspended')}
                  </span>
                )}
                {subs.expired > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-muted-foreground" />
                    {subs.expired} {t('common.status.expired')}
                  </span>
                )}
                {subs.expiringIn7Days > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-destructive" />
                    {subs.expiringIn7Days} {t('admin.subscriptions.expiringSoon')}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground/60 hover:text-foreground" onClick={handleRefresh}>
                  <RefreshCw key={refreshKey} className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.subscriptions.refreshList')}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Filters */}
        <SubscriptionFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Subscription Table */}
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
          onRenew={handleRenewClick}
          onSuspend={handleSuspendClick}
          onUnsuspend={handleUnsuspend}
          onResetUsage={handleResetUsage}
          onDelete={handleDeleteClick}
          onChangePlan={handleChangePlanClick}
          onEdit={handleEditClick}
        />
      </div>

      {/* Desktop Dialogs */}
      <SubscriptionDetailDialog
        open={activeDialog === 'detail'}
        subscription={selectedSubscription}
        user={selectedUser}
        onClose={closeDialog}
      />

      <DuplicateSubscriptionDialog
        open={activeDialog === 'duplicate'}
        subscription={selectedSubscription}
        user={selectedUser}
        onClose={closeDialog}
        onSubmit={handleDuplicateSubmit}
      />

      <CancelSubscriptionDialog
        open={activeDialog === 'cancel'}
        subscription={selectedSubscription}
        onClose={closeDialog}
        onConfirm={handleCancelConfirm}
      />

      <SuspendSubscriptionSheet
        open={activeDialog === 'suspend'}
        onOpenChange={(open) => !open && closeDialog()}
        subscription={selectedSubscription}
        onConfirm={handleSuspendConfirm}
      />

      <EditSubscriptionDialog
        open={activeDialog === 'edit'}
        subscription={selectedSubscription}
        onClose={closeDialog}
        onConfirm={handleEditConfirm}
      />

      <RenewSubscriptionDialog
        open={activeDialog === 'renew'}
        subscription={selectedSubscription}
        onClose={closeDialog}
        onConfirm={handleRenewConfirm}
      />

      <ChangePlanDialog
        open={activeDialog === 'changePlan'}
        subscription={selectedSubscription}
        onClose={closeDialog}
        onConfirm={handleChangePlanConfirm}
      />

      <ConfirmDialog
        open={activeDialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        title={t('admin.subscriptions.confirmDeleteTitle')}
        description={t('common.messages.confirmDelete')}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={() => handleDeleteConfirm()}
      />
    </AdminLayout>
  );
}
