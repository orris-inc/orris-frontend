/**
 * Subscription Management Page (Admin)
 * High-density data management interface with responsive mobile support
 */

import { useState, useMemo } from 'react';
import {
  Receipt,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RotateCw,
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
import { SubscriptionDetailSheet } from '@/features/subscriptions/components/SubscriptionDetailSheet';
import { DuplicateSubscriptionDialog } from '@/features/subscriptions/components/DuplicateSubscriptionDialog';
import { DuplicateSubscriptionSheet } from '@/features/subscriptions/components/DuplicateSubscriptionSheet';
import { CancelSubscriptionDialog } from '@/features/subscriptions/components/CancelSubscriptionDialog';
import { CancelSubscriptionSheet } from '@/features/subscriptions/components/CancelSubscriptionSheet';
import { DeleteSubscriptionSheet } from '@/features/subscriptions/components/DeleteSubscriptionSheet';
import { MobileSubscriptionManagement } from '@/features/subscriptions/components/MobileSubscriptionManagement';
import { adminCreateSubscription, adminUpdateSubscriptionStatus, adminDeleteSubscription } from '@/api/subscription';
import type { Subscription } from '@/api/subscription/types';

export const SubscriptionManagementPage: React.FC = () => {
  usePageTitle('订阅管理');

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
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate subscription statistics
  const stats = useMemo(() => {
    const total = pagination.total;
    const active = subscriptions.filter((s) => s.status === 'active').length;
    const cancelled = subscriptions.filter((s) => s.status === 'cancelled').length;
    const expired = subscriptions.filter((s) => s.status === 'expired').length;
    const pending = subscriptions.filter((s) => s.status === 'pending').length;
    const renewed = subscriptions.filter((s) => s.status === 'renewed').length;
    return { total, active, cancelled, expired, pending, renewed };
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
      showSuccess('订阅创建成功');
      setDuplicateDialogOpen(false);
      setSelectedSubscription(null);
      refetch();
    } catch {
      showError('创建订阅失败');
    }
  };

  const handleActivate = async (subscription: Subscription) => {
    try {
      await adminUpdateSubscriptionStatus(subscription.id, { status: 'active' });
      showSuccess('订阅已激活');
      refetch();
    } catch {
      showError('激活订阅失败');
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
      showSuccess('订阅已取消');
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      refetch();
    } catch {
      showError('取消订阅失败');
    }
  };

  const handleRenew = async (subscription: Subscription) => {
    try {
      await adminUpdateSubscriptionStatus(subscription.id, { status: 'renewed' });
      showSuccess('订阅已续费');
      refetch();
    } catch {
      showError('续费订阅失败');
    }
  };

  const handleDeleteClick = (subscription: Subscription) => {
    setSubscriptionToDelete(subscription);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subscriptionToDelete) return;
    try {
      await adminDeleteSubscription(subscriptionToDelete.id);
      showSuccess('订阅已删除');
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
      refetch();
    } catch {
      showError('删除订阅失败');
    }
  };

  // Mobile view - uses MobileSubscriptionManagement with its own header/stats
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
            onDelete={handleDeleteClick}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Subscription Detail Sheet */}
        <SubscriptionDetailSheet
          open={detailDialogOpen}
          subscription={selectedSubscription}
          user={selectedSubscription ? usersMap[selectedSubscription.userId] : undefined}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedSubscription(null);
          }}
        />

        {/* Duplicate Subscription Sheet */}
        <DuplicateSubscriptionSheet
          open={duplicateDialogOpen}
          subscription={selectedSubscription}
          user={selectedSubscription ? usersMap[selectedSubscription.userId] : undefined}
          onClose={() => {
            setDuplicateDialogOpen(false);
            setSelectedSubscription(null);
          }}
          onSubmit={handleDuplicateSubmit}
        />

        {/* Cancel Subscription Sheet */}
        <CancelSubscriptionSheet
          open={cancelDialogOpen}
          subscription={selectedSubscription}
          onClose={() => {
            setCancelDialogOpen(false);
            setSelectedSubscription(null);
          }}
          onConfirm={handleCancelConfirm}
        />

        {/* Delete Subscription Sheet */}
        <DeleteSubscriptionSheet
          open={deleteDialogOpen}
          subscription={subscriptionToDelete}
          user={subscriptionToDelete ? usersMap[subscriptionToDelete.userId] : undefined}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSubscriptionToDelete(null);
          }}
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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Title + Primary Stats */}
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-semibold text-foreground">订阅管理</h1>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Receipt className="size-3" />
                  <span className="font-medium text-foreground">{stats.total}</span>
                  <span className="hidden sm:inline">订阅</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="font-medium text-success">{stats.active}</span>
                </span>
              </div>
            </div>

            {/* Center: Secondary Stats */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <XCircle className="size-3 text-destructive" />
                <span className="text-muted-foreground">取消</span>
                <span className="font-semibold tabular-nums text-foreground">{stats.cancelled}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <AlertCircle className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">过期</span>
                <span className="font-semibold tabular-nums text-foreground">{stats.expired}</span>
              </span>
              {stats.pending > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3 text-warning" />
                  <span className="text-muted-foreground">待处理</span>
                  <span className="font-semibold tabular-nums text-warning">{stats.pending}</span>
                </span>
              )}
              {stats.renewed > 0 && (
                <span className="flex items-center gap-1.5">
                  <RotateCw className="size-3 text-info" />
                  <span className="text-muted-foreground">续费</span>
                  <span className="font-semibold tabular-nums text-info">{stats.renewed}</span>
                </span>
              )}
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
                    <span className="sr-only">刷新</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>刷新列表</TooltipContent>
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

      {/* Delete Subscription Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="确认删除"
        description={
          subscriptionToDelete
            ? `确认删除订阅 "${subscriptionToDelete.id}" 吗？此操作不可恢复。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};
