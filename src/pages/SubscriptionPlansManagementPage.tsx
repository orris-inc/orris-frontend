/**
 * Subscription Plans Management Page (Admin)
 *
 * Redesigned: catalog-style layout with card grid (default) + table toggle.
 * Segmented type tabs + compact filter selects + view mode switch.
 * Mobile-first responsive design.
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import { PageHeader, type PageHeaderMeta, type PageHeaderBadge } from '@/components/admin';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { PlanListTable } from '@/features/subscription-plans/components/PlanListTable';
import { PlanCatalogGrid } from '@/features/subscription-plans/components/PlanCatalogGrid';
import { PlanFilters, type PlanViewMode } from '@/features/subscription-plans/components/PlanFilters';
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

// ============================================================================
// Types
// ============================================================================

type DialogType = 'create' | 'edit' | 'delete' | 'viewSubscriptions' | null;

// ============================================================================
// Main Component
// ============================================================================

export function SubscriptionPlansManagementPage() {
  const { t } = useTranslation();
  usePageTitle(t('admin.plans.pageTitle'));

  const { isMobile } = useBreakpoint();
  const { showSuccess, showError } = useNotificationStore();

  // Plan data and operations
  const {
    plans,
    pagination,
    isLoading,
    isFetching,
    filters,
    hasFilters,
    createPlan,
    updatePlan,
    togglePlanStatus,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    clearFilters,
    refetch,
  } = useSubscriptionPlansPage();

  // Dialog state management
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [duplicatePlan, setDuplicatePlan] = useState<SubscriptionPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // View mode state (grid default)
  const [viewMode, setViewMode] = useState<PlanViewMode>('grid');

  // Calculate statistics from current page data
  const stats = useMemo(() => {
    const active = plans.filter((p) => p.status === 'active').length;
    const inactive = plans.filter((p) => p.status === 'inactive').length;
    const publicPlans = plans.filter((p) => p.isPublic).length;
    const privatePlans = plans.filter((p) => !p.isPublic).length;
    return { total: pagination.total, active, inactive, publicPlans, privatePlans };
  }, [plans, pagination.total]);

  // Page header badge
  const headerBadge = useMemo(
    (): PageHeaderBadge => ({
      label: `${stats.total} ${t('admin.plans.plans')}`,
      variant: 'default',
    }),
    [stats.total, t]
  );

  // Page header metadata
  const headerMetadata = useMemo((): PageHeaderMeta[] => [
    { icon: CheckCircle2, text: `${stats.active} ${t('common.status.enabled')}` },
    { icon: XCircle, text: `${stats.inactive} ${t('common.status.disabled')}` },
    { icon: Globe, text: `${stats.publicPlans} ${t('admin.plans.public')}` },
    { icon: Lock, text: `${stats.privatePlans} ${t('admin.plans.private')}` },
  ], [stats, t]);

  // Dialog handlers
  const openDialog = useCallback((type: DialogType, plan?: SubscriptionPlan) => {
    setSelectedPlan(plan ?? null);
    setActiveDialog(type);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setSelectedPlan(null);
    setDuplicatePlan(null);
  }, []);

  // Action handlers
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const handleCreate = useCallback(() => {
    setDuplicatePlan(null);
    openDialog('create');
  }, [openDialog]);

  const handleEdit = useCallback(
    (plan: SubscriptionPlan) => openDialog('edit', plan),
    [openDialog]
  );

  const handleDuplicate = useCallback((plan: SubscriptionPlan) => {
    setDuplicatePlan(plan);
    openDialog('create');
  }, [openDialog]);

  const handleToggleStatus = useCallback(
    async (plan: SubscriptionPlan) => {
      await togglePlanStatus(plan);
    },
    [togglePlanStatus]
  );

  const handleViewSubscriptions = useCallback(
    (plan: SubscriptionPlan) => openDialog('viewSubscriptions', plan),
    [openDialog]
  );

  const handleDeleteClick = useCallback(
    (plan: SubscriptionPlan) => openDialog('delete', plan),
    [openDialog]
  );

  // Form submission handlers
  const handleCreateSubmit = useCallback(
    async (data: CreatePlanRequest) => {
      await createPlan(data);
      closeDialog();
    },
    [createPlan, closeDialog]
  );

  const handleUpdateSubmit = useCallback(
    async (id: string, data: UpdatePlanRequest) => {
      await updatePlan(id, data);
      closeDialog();
    },
    [updatePlan, closeDialog]
  );

  const handleDeleteConfirm = useCallback(
    async (plan?: SubscriptionPlan) => {
      const targetPlan = plan ?? selectedPlan;
      if (!targetPlan) return;

      try {
        await deletePlan(targetPlan.id);
        showSuccess(t('admin.plans.deleteSuccess'));
        closeDialog();
        refetch();
      } catch {
        showError(t('admin.plans.deleteError'));
      }
    },
    [selectedPlan, showSuccess, showError, closeDialog, refetch, t]
  );

  // Mobile layout
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3 pb-safe">
          <MobilePlanManagement
            plans={plans}
            loading={isLoading}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            filters={filters}
            hasFilters={hasFilters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={clearFilters}
            onRefresh={handleRefresh}
            onCreate={handleCreate}
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
          open={activeDialog === 'create'}
          onOpenChange={(open) => !open && closeDialog()}
          onSubmit={handleCreateSubmit}
          initialPlan={duplicatePlan}
        />

        <EditPlanSheet
          open={activeDialog === 'edit'}
          onOpenChange={(open) => !open && closeDialog()}
          entity={selectedPlan}
          onSubmit={handleUpdateSubmit}
        />

        <ViewPlanSubscriptionsSheet
          open={activeDialog === 'viewSubscriptions'}
          onOpenChange={(open) => !open && closeDialog()}
          plan={selectedPlan}
        />

        <DeletePlanSheet
          open={activeDialog === 'delete'}
          onOpenChange={(open) => !open && closeDialog()}
          entity={selectedPlan}
          onConfirm={handleDeleteConfirm}
        />
      </AdminLayout>
    );
  }

  // Desktop layout
  return (
    <AdminLayout>
      <div className="space-y-6 py-4 pb-safe lg:py-6">
        {/* Page Header */}
        <PageHeader
          title={t('admin.plans.pageTitle')}
          icon={CreditCard}
          badge={headerBadge}
          metadata={headerMetadata}
          action={
            <div className="flex items-center gap-2">
              <Button onClick={handleCreate}>
                <Plus className="mr-2 size-4" />
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

        {/* Filters + View Toggle */}
        <PlanFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Plan Content: Grid or Table */}
        {viewMode === 'grid' ? (
          <PlanCatalogGrid
            plans={plans}
            loading={isLoading || isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onToggleStatus={handleToggleStatus}
            onViewSubscriptions={handleViewSubscriptions}
            onDelete={handleDeleteClick}
          />
        ) : (
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
        )}
      </div>

      {/* Desktop Dialogs */}
      <CreatePlanDialog
        open={activeDialog === 'create'}
        initialPlan={duplicatePlan}
        onClose={closeDialog}
        onSubmit={handleCreateSubmit}
      />

      <EditPlanDialog
        open={activeDialog === 'edit'}
        plan={selectedPlan}
        onClose={closeDialog}
        onSubmit={handleUpdateSubmit}
      />

      <ViewPlanSubscriptionsDialog
        open={activeDialog === 'viewSubscriptions'}
        plan={selectedPlan}
        onClose={closeDialog}
      />

      <ConfirmDialog
        open={activeDialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        title={t('admin.plans.confirmDeleteTitle')}
        description={selectedPlan ? t('admin.plans.confirmDeleteDescription', { name: selectedPlan.name }) : ''}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
}
