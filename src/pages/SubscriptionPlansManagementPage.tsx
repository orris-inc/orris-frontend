/**
 * 订阅计划管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
import { PlanListTable } from '@/features/subscription-plans/components/PlanListTable';
import { CreatePlanDialog } from '@/features/subscription-plans/components/CreatePlanDialog';
import { EditPlanDialog } from '@/features/subscription-plans/components/EditPlanDialog';
import { ViewPlanSubscriptionsDialog } from '@/features/subscription-plans/components/ViewPlanSubscriptionsDialog';
import { PlanNodesDialog } from '@/features/subscription-plans/components/PlanNodesDialog';
import { useSubscriptionPlansPage } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { SubscriptionPlan, CreatePlanRequest, UpdatePlanRequest } from '@/api/subscription/types';

export const SubscriptionPlansManagementPage = () => {
  usePageTitle('订阅计划管理');

  const {
    plans,
    pagination,
    isLoading,
    createPlan,
    updatePlan,
    togglePlanStatus,
    handlePageChange,
    handlePageSizeChange,
  } = useSubscriptionPlansPage();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subscriptionsDialogOpen, setSubscriptionsDialogOpen] = useState(false);
  const [nodesDialogOpen, setNodesDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [duplicatePlan, setDuplicatePlan] = useState<SubscriptionPlan | null>(null);

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  };

  const handleDuplicate = (plan: SubscriptionPlan) => {
    setDuplicatePlan(plan);
    setCreateDialogOpen(true);
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    await togglePlanStatus(plan);
  };

  const handleViewSubscriptions = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setSubscriptionsDialogOpen(true);
  };

  const handleManageNodes = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setNodesDialogOpen(true);
  };

  const handleCreateSubmit = async (data: CreatePlanRequest) => {
    try {
      await createPlan(data);
      setCreateDialogOpen(false);
    } catch {
      // Error already handled in hook
    }
  };

  const handleUpdateSubmit = async (id: string, data: UpdatePlanRequest) => {
    try {
      await updatePlan(id, data);
      setEditDialogOpen(false);
      setSelectedPlan(null);
    } catch {
      // Error already handled in hook
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="订阅计划管理"
        description="管理所有订阅计划和定价方案"
        icon={CreditCard}
        action={
          <AdminButton
            variant="primary"
            icon={<Plus className="size-4" strokeWidth={1.5} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            创建计划
          </AdminButton>
        }
      >
        {/* 计划列表表格 */}
        <AdminCard noPadding>
          <PlanListTable
            plans={plans}
            loading={isLoading}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onToggleStatus={handleToggleStatus}
            onViewSubscriptions={handleViewSubscriptions}
            onManageNodes={handleManageNodes}
          />
        </AdminCard>
      </AdminPageLayout>

      {/* 创建计划对话框 */}
      <CreatePlanDialog
        open={createDialogOpen}
        initialPlan={duplicatePlan}
        onClose={() => {
          setCreateDialogOpen(false);
          setDuplicatePlan(null);
        }}
        onSubmit={handleCreateSubmit}
      />

      {/* 编辑计划对话框 */}
      <EditPlanDialog
        open={editDialogOpen}
        plan={selectedPlan}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedPlan(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

      {/* 查看订阅用户对话框 */}
      <ViewPlanSubscriptionsDialog
        open={subscriptionsDialogOpen}
        plan={selectedPlan}
        onClose={() => {
          setSubscriptionsDialogOpen(false);
          setSelectedPlan(null);
        }}
      />

      {/* 节点管理对话框 */}
      <PlanNodesDialog
        open={nodesDialogOpen}
        plan={selectedPlan}
        onClose={() => {
          setNodesDialogOpen(false);
          setSelectedPlan(null);
        }}
      />
    </AdminLayout>
  );
};
