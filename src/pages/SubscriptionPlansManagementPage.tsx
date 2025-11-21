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
  AdminFilterCard,
  FilterRow,
} from '@/components/admin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Label } from '@/components/common/Label';
import { Checkbox } from '@/components/common/Checkbox';
import { inputStyles } from '@/lib/ui-styles';
import { PlanListTable } from '@/features/subscription-plans/components/PlanListTable';
import { CreatePlanDialog } from '@/features/subscription-plans/components/CreatePlanDialog';
import { EditPlanDialog } from '@/features/subscription-plans/components/EditPlanDialog';
import { ManagePlanNodeGroupsDialog } from '@/features/subscription-plans/components/ManagePlanNodeGroupsDialog';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { SubscriptionPlan, BillingCycle, PlanStatus } from '@/features/subscription-plans/types/subscription-plans.types';

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
  const [nodeGroupsDialogOpen, setNodeGroupsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // 计费周期选项
  const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
    { value: 'monthly', label: '月付' },
    { value: 'quarterly', label: '季付' },
    { value: 'semi_annual', label: '半年付' },
    { value: 'annual', label: '年付' },
    { value: 'lifetime', label: '终身' },
  ];

  // 状态选项
  const STATUSES: { value: PlanStatus; label: string }[] = [
    { value: 'active', label: '激活' },
    { value: 'inactive', label: '未激活' },
    { value: 'archived', label: '已归档' },
  ];

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

  const handleManageNodeGroups = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setNodeGroupsDialogOpen(true);
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

  const handleStatusChange = (value: string) => {
    setFilters({ status: value !== 'all' ? (value as PlanStatus) : undefined });
  };

  const handleBillingCycleChange = (value: string) => {
    setFilters({ billing_cycle: value !== 'all' ? (value as BillingCycle) : undefined });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handlePublicChange = (checked: boolean) => {
    setFilters({ is_public: checked ? true : undefined });
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="订阅计划管理"
        description="管理所有订阅计划和定价方案"
        icon={CreditCard}
        info="在这里创建和管理订阅计划。您可以设置不同的计费周期、价格和功能，以及为计划分配节点组。"
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
        {/* 筛选器 */}
        <AdminFilterCard>
          <FilterRow columns={4}>
            {/* 状态筛选 */}
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 计费周期筛选 */}
            <div className="space-y-2">
              <Label>计费周期</Label>
              <Select
                value={filters.billing_cycle || 'all'}
                onValueChange={handleBillingCycleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {BILLING_CYCLES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 搜索名称 */}
            <div className="space-y-2">
              <Label>搜索名称</Label>
              <input
                type="text"
                placeholder="输入计划名称..."
                value={filters.search || ''}
                onChange={handleSearchChange}
                className={inputStyles}
              />
            </div>

            {/* 仅公开计划 */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex items-center gap-2 h-10">
                <Checkbox
                  id="is-public"
                  checked={filters.is_public ?? false}
                  onCheckedChange={handlePublicChange}
                />
                <Label htmlFor="is-public" className="cursor-pointer">
                  仅公开计划
                </Label>
              </div>
            </div>
          </FilterRow>
        </AdminFilterCard>

        {/* 计划列表表格 */}
        <AdminCard noPadding>
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
            onManageNodeGroups={handleManageNodeGroups}
          />
        </AdminCard>
      </AdminPageLayout>

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

      {/* 管理节点组对话框 */}
      <ManagePlanNodeGroupsDialog
        open={nodeGroupsDialogOpen}
        plan={selectedPlan}
        onClose={() => {
          setNodeGroupsDialogOpen(false);
          setSelectedPlan(null);
        }}
      />
    </AdminLayout>
  );
};
