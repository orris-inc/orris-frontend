/**
 * 订阅计划管理页面（管理端）
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlanListTable } from '@/features/subscription-plans/components/PlanListTable';
import { PlanFilters } from '@/features/subscription-plans/components/PlanFilters';
import { CreatePlanDialog } from '@/features/subscription-plans/components/CreatePlanDialog';
import { EditPlanDialog } from '@/features/subscription-plans/components/EditPlanDialog';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { SubscriptionPlan } from '@/features/subscription-plans/types/subscription-plans.types';

export const SubscriptionPlansManagementPage = () => {
  const {
    plans,
    pagination,
    filters,
    loading,
    fetchPlans,
    createPlan,
    updatePlan,
    togglePlanStatus,
    setFilters,
  } = useSubscriptionPlans();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const handlePageChange = (page: number) => {
    fetchPlans(page, pagination.page_size);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchPlans(1, pageSize);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    await togglePlanStatus(plan.ID, plan.Status);
  };

  const handleCreateSubmit = async (data: any) => {
    const result = await createPlan(data);
    if (result) {
      setCreateDialogOpen(false);
    }
  };

  const handleUpdateSubmit = async (id: number, data: any) => {
    const result = await updatePlan(id, data);
    if (result) {
      setEditDialogOpen(false);
      setSelectedPlan(null);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-7xl py-6">
        {/* 页面标题 */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">订阅计划管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              管理所有订阅计划和定价方案
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="mr-2 size-4" />
            创建计划
          </Button>
        </div>

        {/* 筛选器 */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <PlanFilters filters={filters} onChange={setFilters} />
          </CardContent>
        </Card>

        {/* 计划列表表格 */}
        <PlanListTable
          plans={plans}
          loading={loading}
          page={pagination.page}
          pageSize={pagination.page_size}
          total={pagination.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />

        {/* 创建计划对话框 */}
        <CreatePlanDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
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
      </div>
    </AdminLayout>
  );
};
