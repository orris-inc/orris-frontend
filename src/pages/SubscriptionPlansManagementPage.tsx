/**
 * Subscription Plans Management Page (Admin)
 * Uses unified refined business style components
 */

import { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
  Lock,
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
import { PlanListTable } from '@/features/subscription-plans/components/PlanListTable';
import { CreatePlanDialog } from '@/features/subscription-plans/components/CreatePlanDialog';
import { EditPlanDialog } from '@/features/subscription-plans/components/EditPlanDialog';
import { ViewPlanSubscriptionsDialog } from '@/features/subscription-plans/components/ViewPlanSubscriptionsDialog';
import { useSubscriptionPlansPage } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { deletePlan } from '@/api/subscription';
import type { SubscriptionPlan, CreatePlanRequest, UpdatePlanRequest } from '@/api/subscription/types';

export const SubscriptionPlansManagementPage = () => {
  usePageTitle('订阅计划管理');

  const { isMobile } = useBreakpoint();

  const {
    plans,
    pagination,
    isLoading,
    isFetching,
    createPlan,
    updatePlan,
    togglePlanStatus,
    handlePageChange,
    handlePageSizeChange,
    refetch,
  } = useSubscriptionPlansPage();

  const { showSuccess, showError } = useNotificationStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subscriptionsDialogOpen, setSubscriptionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [duplicatePlan, setDuplicatePlan] = useState<SubscriptionPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate plan statistics
  const planStats = useMemo(() => {
    const total = pagination.total;
    const active = plans.filter((p) => p.status === 'active').length;
    const inactive = plans.filter((p) => p.status === 'inactive').length;
    const publicPlans = plans.filter((p) => p.isPublic).length;
    const privatePlans = plans.filter((p) => !p.isPublic).length;
    return { total, active, inactive, publicPlans, privatePlans };
  }, [plans, pagination.total]);

  const statsCards: PageStatsCardProps[] = [
    {
      title: '计划总数',
      value: planStats.total,
      icon: <CreditCard className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '已激活',
      value: planStats.active,
      icon: <CheckCircle2 className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      showPulse: planStats.active > 0,
    },
    {
      title: '已停用',
      value: planStats.inactive,
      icon: <XCircle className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    {
      title: '公开计划',
      value: planStats.publicPlans,
      icon: <Globe className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      iconColor: 'text-info',
    },
    {
      title: '私有计划',
      value: planStats.privatePlans,
      icon: <Lock className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-warning-muted',
      iconColor: 'text-warning',
    },
  ];

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

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

  const handleCreateSubmit = async (data: CreatePlanRequest) => {
    try {
      await createPlan(data);
      setCreateDialogOpen(false);
      setDuplicatePlan(null);
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

  const handleDeleteClick = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;
    try {
      await deletePlan(planToDelete.id);
      showSuccess('计划已删除');
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      refetch();
    } catch {
      showError('删除计划失败，可能存在活跃订阅');
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
                订阅计划管理
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                管理所有订阅计划和定价方案
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
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

          <AdminButton
            variant="primary"
            size="sm"
            icon={<Plus className="size-4" strokeWidth={2} />}
            onClick={() => {
              setDuplicatePlan(null);
              setCreateDialogOpen(true);
            }}
          >
            <span className="hidden sm:inline">创建计划</span>
            <span className="sm:hidden">创建</span>
          </AdminButton>
        </div>

        {/* Plan List */}
        {isMobile ? (
          <PlanListTable
            plans={plans}
            loading={isLoading || isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onToggleStatus={handleToggleStatus}
            onViewSubscriptions={handleViewSubscriptions}
            onDelete={handleDeleteClick}
          />
        ) : (
          <AdminCard noPadding>
            <PlanListTable
              plans={plans}
              loading={isLoading || isFetching}
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
              onViewSubscriptions={handleViewSubscriptions}
              onDelete={handleDeleteClick}
            />
          </AdminCard>
        )}
      </div>

      {/* Create Plan Dialog */}
      <CreatePlanDialog
        open={createDialogOpen}
        initialPlan={duplicatePlan}
        onClose={() => {
          setCreateDialogOpen(false);
          setDuplicatePlan(null);
        }}
        onSubmit={handleCreateSubmit}
      />

      {/* Edit Plan Dialog */}
      <EditPlanDialog
        open={editDialogOpen}
        plan={selectedPlan}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedPlan(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

      {/* View Plan Subscriptions Dialog */}
      <ViewPlanSubscriptionsDialog
        open={subscriptionsDialogOpen}
        plan={selectedPlan}
        onClose={() => {
          setSubscriptionsDialogOpen(false);
          setSelectedPlan(null);
        }}
      />

      {/* Delete Plan Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="确认删除"
        description={planToDelete ? `确认删除计划 "${planToDelete.name}" 吗？此操作不可恢复。注意：只有无活跃订阅的计划才能删除。` : ''}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};
