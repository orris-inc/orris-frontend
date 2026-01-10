/**
 * Subscription Plans Management Page (Admin)
 * High-density data management interface
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
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminButton, AdminCard } from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { PlanListTable } from '@/features/subscription-plans/components/PlanListTable';
import { MobilePlanManagement } from '@/features/subscription-plans/components/MobilePlanManagement';
import { CreatePlanDialog } from '@/features/subscription-plans/components/CreatePlanDialog';
import { EditPlanDialog } from '@/features/subscription-plans/components/EditPlanDialog';
import { ViewPlanSubscriptionsDialog } from '@/features/subscription-plans/components/ViewPlanSubscriptionsDialog';
import { ViewPlanSubscriptionsSheet } from '@/features/subscription-plans/components/ViewPlanSubscriptionsSheet';
import { CreatePlanSheet } from '@/features/subscription-plans/components/CreatePlanSheet';
import { EditPlanSheet } from '@/features/subscription-plans/components/EditPlanSheet';
import { DeletePlanSheet } from '@/features/subscription-plans/components/DeletePlanSheet';
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

  const handleDeleteConfirm = async (plan?: SubscriptionPlan) => {
    const targetPlan = plan || planToDelete;
    if (!targetPlan) return;
    try {
      await deletePlan(targetPlan.id);
      showSuccess('计划已删除');
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      refetch();
    } catch {
      showError('删除计划失败，可能存在活跃订阅');
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3 px-3">
          <MobilePlanManagement
            plans={plans}
            loading={isLoading}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onRefresh={handleRefresh}
            onCreate={() => {
              setDuplicatePlan(null);
              setCreateDialogOpen(true);
            }}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onToggleStatus={handleToggleStatus}
            onViewSubscriptions={handleViewSubscriptions}
            onDelete={handleDeleteClick}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Mobile Sheets */}
        <CreatePlanSheet
          open={createDialogOpen}
          initialPlan={duplicatePlan}
          onClose={() => {
            setCreateDialogOpen(false);
            setDuplicatePlan(null);
          }}
          onSubmit={handleCreateSubmit}
        />

        <EditPlanSheet
          open={editDialogOpen}
          plan={selectedPlan}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedPlan(null);
          }}
          onSubmit={handleUpdateSubmit}
        />

        <ViewPlanSubscriptionsSheet
          open={subscriptionsDialogOpen}
          plan={selectedPlan}
          onClose={() => {
            setSubscriptionsDialogOpen(false);
            setSelectedPlan(null);
          }}
        />

        <DeletePlanSheet
          open={deleteDialogOpen}
          plan={planToDelete}
          onClose={() => {
            setDeleteDialogOpen(false);
            setPlanToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      </AdminLayout>
    );
  }

  // Desktop layout
  return (
    <AdminLayout>
      <div className="py-3 space-y-3">
        {/* High-Density Status Bar - All metrics inline */}
        <header className="bg-card rounded-lg border border-border px-3 py-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Title + Stats */}
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-semibold text-foreground">订阅计划管理</h1>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CreditCard className="size-3" />
                  <span className="font-medium text-foreground">{planStats.total}</span>
                  <span className="hidden sm:inline">计划</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="font-medium text-success">{planStats.active}</span>
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="size-3 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">{planStats.inactive}</span>
                </span>
              </div>
            </div>

            {/* Center: Visibility stats */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <Globe className="size-3 text-info" />
                <span className="text-muted-foreground">公开</span>
                <span className="font-semibold tabular-nums text-foreground">{planStats.publicPlans}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="size-3 text-warning" />
                <span className="text-muted-foreground">私有</span>
                <span className="font-semibold tabular-nums text-foreground">{planStats.privatePlans}</span>
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
                    <span className="sr-only">刷新</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>刷新列表</TooltipContent>
              </Tooltip>

              <AdminButton
                variant="primary"
                size="sm"
                className="h-7 px-2.5 text-xs"
                icon={<Plus className="size-3.5" strokeWidth={2} />}
                onClick={() => {
                  setDuplicatePlan(null);
                  setCreateDialogOpen(true);
                }}
              >
                创建计划
              </AdminButton>
            </div>
          </div>
        </header>

        {/* Plan List */}
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
      </div>

      {/* Desktop Dialogs */}
      <CreatePlanDialog
        open={createDialogOpen}
        initialPlan={duplicatePlan}
        onClose={() => {
          setCreateDialogOpen(false);
          setDuplicatePlan(null);
        }}
        onSubmit={handleCreateSubmit}
      />

      <EditPlanDialog
        open={editDialogOpen}
        plan={selectedPlan}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedPlan(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

      <ViewPlanSubscriptionsDialog
        open={subscriptionsDialogOpen}
        plan={selectedPlan}
        onClose={() => {
          setSubscriptionsDialogOpen(false);
          setSelectedPlan(null);
        }}
      />

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
