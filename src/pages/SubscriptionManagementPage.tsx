/**
 * 订阅管理页面（管理端）
 * 精致商务风格 - 统一设计系统
 */

import { RefreshCw, Receipt } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useSubscriptionsPage } from '../features/subscriptions/hooks/useSubscriptions';
import { SubscriptionListTable } from '../features/subscriptions/components/SubscriptionListTable';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';


export const SubscriptionManagementPage: React.FC = () => {
  const {
    subscriptions,
    pagination,
    isLoading,
    refetch,
    usersMap,
    handlePageChange,
    handlePageSizeChange,
  } = useSubscriptionsPage();

  // 刷新列表
  const handleRefresh = () => {
    refetch();
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
            loading={isLoading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </AdminCard>
      </AdminPageLayout>
    </AdminLayout>
  );
};
