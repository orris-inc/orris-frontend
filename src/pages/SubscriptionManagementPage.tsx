/**
 * Subscription Management Page (Admin)
 * Uses unified refined business style components
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
import { Separator } from '@/components/common/Separator';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  AdminButton,
  AdminCard,
  PageStatsCard,
  type PageStatsCardProps,
} from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useSubscriptionsPage } from '@/features/subscriptions/hooks/useSubscriptions';
import { SubscriptionListTable } from '@/features/subscriptions/components/SubscriptionListTable';
import { SubscriptionDetailDialog } from '@/features/subscriptions/components/SubscriptionDetailDialog';
import { DuplicateSubscriptionDialog } from '@/features/subscriptions/components/DuplicateSubscriptionDialog';
import { CancelSubscriptionDialog } from '@/features/subscriptions/components/CancelSubscriptionDialog';
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
  const subscriptionStats = useMemo(() => {
    const total = pagination.total;
    const active = subscriptions.filter((s) => s.status === 'active').length;
    const cancelled = subscriptions.filter((s) => s.status === 'cancelled').length;
    const expired = subscriptions.filter((s) => s.status === 'expired').length;
    const pending = subscriptions.filter((s) => s.status === 'pending').length;
    const renewed = subscriptions.filter((s) => s.status === 'renewed').length;
    return { total, active, cancelled, expired, pending, renewed };
  }, [subscriptions, pagination.total]);

  const statsCards: PageStatsCardProps[] = [
    {
      title: '订阅总数',
      value: subscriptionStats.total,
      icon: <Receipt className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '活跃订阅',
      value: subscriptionStats.active,
      icon: <CheckCircle2 className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      showPulse: subscriptionStats.active > 0,
    },
    {
      title: '已取消',
      value: subscriptionStats.cancelled,
      icon: <XCircle className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
    },
    {
      title: '已过期',
      value: subscriptionStats.expired,
      icon: <AlertCircle className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    ...(subscriptionStats.pending > 0
      ? [
          {
            title: '待处理',
            value: subscriptionStats.pending,
            icon: <Clock className="size-4" strokeWidth={1.5} />,
            iconBg: 'bg-warning-muted',
            iconColor: 'text-warning',
          },
        ]
      : []),
    ...(subscriptionStats.renewed > 0
      ? [
          {
            title: '已续费',
            value: subscriptionStats.renewed,
            icon: <RotateCw className="size-4" strokeWidth={1.5} />,
            iconBg: 'bg-info-muted',
            iconColor: 'text-info',
          },
        ]
      : []),
  ];

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

  return (
    <AdminLayout>
      <div className="py-6 sm:py-8">
        {/* Page Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  实时数据
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                订阅管理
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                查看和管理所有用户的订阅
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {statsCards.map((stat, index) => (
              <PageStatsCard key={index} {...stat} loading={isFetching} />
            ))}
          </div>
        </header>

        <Separator className="mb-5 sm:mb-6" />

        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2 mb-4 sm:mb-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                icon={
                  <RefreshCw
                    key={refreshKey}
                    className="size-4 animate-spin-once"
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

        {/* Subscription List */}
        {isMobile ? (
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
        ) : (
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
        )}
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
        description={subscriptionToDelete ? `确认删除订阅 "${subscriptionToDelete.id}" 吗？此操作不可恢复。` : ''}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};
