/**
 * 订阅管理页面（管理端）
 * 精致商务风格 - 统一设计系统
 */

import { useState } from 'react';
import { RefreshCw, Receipt } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useSubscriptionsPage } from '../features/subscriptions/hooks/useSubscriptions';
import { SubscriptionListTable } from '../features/subscriptions/components/SubscriptionListTable';
import { SubscriptionDetailDialog } from '../features/subscriptions/components/SubscriptionDetailDialog';
import { DuplicateSubscriptionDialog } from '../features/subscriptions/components/DuplicateSubscriptionDialog';
import { CancelSubscriptionDialog } from '../features/subscriptions/components/CancelSubscriptionDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { adminCreateSubscription, adminUpdateSubscriptionStatus, adminDeleteSubscription } from '@/api/subscription';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
import { useNotificationStore } from '@/shared/stores/notification-store';
import type { Subscription } from '@/api/subscription/types';


export const SubscriptionManagementPage: React.FC = () => {
  usePageTitle('订阅管理');

  const {
    subscriptions,
    pagination,
    isLoading,
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

  // View subscription details
  const handleViewDetail = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailDialogOpen(true);
  };

  // Duplicate subscription
  const handleDuplicate = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDuplicateDialogOpen(true);
  };

  // Confirm duplicate subscription
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

  // Refresh list
  const handleRefresh = () => {
    refetch();
  };

  // Activate subscription
  const handleActivate = async (subscription: Subscription) => {
    try {
      await adminUpdateSubscriptionStatus(subscription.id, { status: 'active' });
      showSuccess('订阅已激活');
      refetch();
    } catch {
      showError('激活订阅失败');
    }
  };

  // Open cancel dialog
  const handleCancelClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setCancelDialogOpen(true);
  };

  // Confirm cancel subscription
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

  // Renew subscription
  const handleRenew = async (subscription: Subscription) => {
    try {
      await adminUpdateSubscriptionStatus(subscription.id, { status: 'renewed' });
      showSuccess('订阅已续费');
      refetch();
    } catch {
      showError('续费订阅失败');
    }
  };

  // Open delete dialog
  const handleDeleteClick = (subscription: Subscription) => {
    setSubscriptionToDelete(subscription);
    setDeleteDialogOpen(true);
  };

  // Confirm delete subscription
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

  const { page, pageSize, total } = pagination;

  return (
    <AdminLayout>
      <AdminPageLayout
        title="订阅管理"
        description="查看和管理所有用户的订阅"
        icon={Receipt}
        action={
          <Tooltip>
            <TooltipTrigger asChild>
              <AdminButton
                variant="outline"
                size="md"
                onClick={handleRefresh}
                disabled={isLoading}
                icon={<RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />}
              >
                刷新
              </AdminButton>
            </TooltipTrigger>
            <TooltipContent>刷新订阅列表</TooltipContent>
          </Tooltip>
        }
      >
        {/* 表格卡片 */}
        <AdminCard noPadding>
          <SubscriptionListTable
            subscriptions={subscriptions}
            usersMap={usersMap}
            usersLoading={isUsersLoading}
            loading={isLoading}
            page={page}
            pageSize={pageSize}
            total={total}
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
      </AdminPageLayout>

      {/* 订阅详情对话框 */}
      <SubscriptionDetailDialog
        open={detailDialogOpen}
        subscription={selectedSubscription}
        user={selectedSubscription ? usersMap[selectedSubscription.userId] : undefined}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedSubscription(null);
        }}
      />

      {/* 复制订阅对话框 */}
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

      {/* 取消订阅对话框 */}
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        subscription={selectedSubscription}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedSubscription(null);
        }}
        onConfirm={handleCancelConfirm}
      />

      {/* 删除订阅确认对话框 */}
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
