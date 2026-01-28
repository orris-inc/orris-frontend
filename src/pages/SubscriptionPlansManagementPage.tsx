/**
 * Subscription Plans Management Page (Admin)
 * Tailwind UI Application UI style layout
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Plus,
  RefreshCw,
  CheckCircle2,
  Globe,
  Lock,
} from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin';
import { Button } from '@/components/common/Button';
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
  const { t } = useTranslation();
  usePageTitle(t('admin.plans.pageTitle'));

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
      showSuccess(t('admin.plans.deleteSuccess'));
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      refetch();
    } catch {
      showError(t('admin.plans.deleteError'));
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3">
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
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setDuplicatePlan(null);
          }}
          onSubmit={handleCreateSubmit}
          initialPlan={duplicatePlan}
        />

        <EditPlanSheet
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedPlan(null);
          }}
          entity={selectedPlan}
          onSubmit={handleUpdateSubmit}
        />

        <ViewPlanSubscriptionsSheet
          open={subscriptionsDialogOpen}
          onOpenChange={(open) => {
            setSubscriptionsDialogOpen(open);
            if (!open) setSelectedPlan(null);
          }}
          plan={selectedPlan}
        />

        <DeletePlanSheet
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setPlanToDelete(null);
          }}
          entity={planToDelete}
          onConfirm={handleDeleteConfirm}
        />
      </AdminLayout>
    );
  }

  // Desktop layout
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header with badge and stats */}
        <PageHeader
          title={t('admin.plans.pageTitle')}
          icon={CreditCard}
          badge={{ label: `${planStats.total} ${t('admin.plans.plans')}`, variant: 'default' }}
          metadata={[
            { icon: CheckCircle2, text: `${planStats.active} ${t('common.status.active')}` },
            { icon: Globe, text: `${planStats.publicPlans} ${t('admin.plans.public')}` },
            { icon: Lock, text: `${planStats.privatePlans} ${t('admin.plans.private')}` },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setDuplicatePlan(null);
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="size-4 mr-2" />
                {t('admin.plans.createPlan')}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleRefresh}>
                    <RefreshCw key={refreshKey} className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('admin.plans.refreshList')}</TooltipContent>
              </Tooltip>
            </div>
          }
        />

        {/* Plan List */}
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
        title={t('admin.plans.confirmDeleteTitle')}
        description={planToDelete ? t('admin.plans.confirmDeleteDescription', { name: planToDelete.name }) : ''}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};
