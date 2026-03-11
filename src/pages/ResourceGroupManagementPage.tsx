/**
 * Resource Group Management Page (Admin)
 * Tailwind UI Application UI style management interface
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { StatsPill, PageToolbar } from '@/components/admin';
import { cn } from '@/lib/utils';
import { adminContentStyles } from '@/lib/ui-styles';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { queryKeys } from '@/shared/lib/query-client';
import { listPlans } from '@/api/subscription';
import {
  ResourceGroupListTable,
  CreateResourceGroupDialog,
  EditResourceGroupDialog,
  ResourceGroupDetailDialog,
  DeleteResourceGroupDialog,
  CreateResourceGroupSheet,
  EditResourceGroupSheet,
  DeleteResourceGroupSheet,
  MobileResourceGroupManagement,
} from '@/features/resource-groups/components';
import { useResourceGroupsPage } from '@/features/resource-groups/hooks/useResourceGroups';
import type { ResourceGroup, CreateResourceGroupRequest, UpdateResourceGroupRequest, ResourceGroupStatus } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

type StatusFilter = 'all' | ResourceGroupStatus;

export const ResourceGroupManagementPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('admin.resourceGroups.title'));

  const { isMobile } = useBreakpoint();

  const {
    resourceGroups,
    pagination,
    isLoading,
    isFetching,
    refetch,
    createResourceGroup,
    updateResourceGroup,
    deleteResourceGroup,
    toggleResourceGroupStatus,
    handlePageChange,
    handlePageSizeChange,
  } = useResourceGroupsPage();

  // Fetch all plans for association display and create form
  const { data: plansData } = useQuery({
    queryKey: queryKeys.subscriptionPlans.list({ pageSize: 100 }),
    queryFn: () => listPlans({ pageSize: 100 }),
  });

  const plans = useMemo(() => plansData?.items ?? [], [plansData?.items]);

  // Build plan ID -> plan info mapping
  const plansMap = useMemo(() => {
    const map: Record<string, SubscriptionPlan> = {};
    for (const plan of plans) {
      map[plan.id] = plan;
    }
    return map;
  }, [plans]);

  // Calculate resource group statistics
  const stats = useMemo(() => {
    const total = pagination.total;
    const active = resourceGroups.filter((g) => g.status === 'active').length;
    const inactive = resourceGroups.filter((g) => g.status === 'inactive').length;
    return { total, active, inactive };
  }, [resourceGroups, pagination.total]);

  // Status filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter resource groups based on status
  const filteredResourceGroups = useMemo(() => {
    if (statusFilter === 'all') return resourceGroups;
    return resourceGroups.filter((g) => g.status === statusFilter);
  }, [resourceGroups, statusFilter]);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResourceGroup, setSelectedResourceGroup] = useState<ResourceGroup | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleViewDetail = (resourceGroup: ResourceGroup) => {
    setSelectedResourceGroup(resourceGroup);
    setDetailDialogOpen(true);
  };

  const handleEdit = (resourceGroup: ResourceGroup) => {
    setSelectedResourceGroup(resourceGroup);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (resourceGroup: ResourceGroup) => {
    setSelectedResourceGroup(resourceGroup);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (resourceGroup: ResourceGroup) => {
    await toggleResourceGroupStatus(resourceGroup);
  };

  const handleCreateSubmit = async (data: CreateResourceGroupRequest) => {
    await createResourceGroup(data);
    // Sheet internally calls onOpenChange(false) after successful submit
  };

  const handleUpdateSubmit = async (id: string, data: UpdateResourceGroupRequest) => {
    await updateResourceGroup(id, data);
    setEditDialogOpen(false);
    setSelectedResourceGroup(null);
  };

  // For mobile Sheet - receives entity directly
  const handleDeleteConfirm = async (resourceGroup: ResourceGroup) => {
    await deleteResourceGroup(resourceGroup.sid);
    setDeleteDialogOpen(false);
    setSelectedResourceGroup(null);
  };

  // For desktop Dialog - receives id string
  const handleDeleteConfirmById = async (id: string) => {
    await deleteResourceGroup(id);
    setDeleteDialogOpen(false);
    setSelectedResourceGroup(null);
  };

  // Mobile view - uses MobileResourceGroupManagement with its own header/stats
  if (isMobile) {
    return (
      <AdminLayout>
        <div className={adminContentStyles.mobile}>
          <MobileResourceGroupManagement
            resourceGroups={resourceGroups}
            plansMap={plansMap}
            loading={isLoading || isFetching}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onRefresh={handleRefresh}
            onCreate={() => setCreateDialogOpen(true)}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Create Resource Group Sheet */}
        <CreateResourceGroupSheet
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateSubmit}
          plans={plans}
        />

        {/* Edit Resource Group Sheet */}
        <EditResourceGroupSheet
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedResourceGroup(null);
          }}
          entity={selectedResourceGroup}
          plansMap={plansMap}
          onSubmit={handleUpdateSubmit}
        />

        {/* Delete Resource Group Sheet */}
        <DeleteResourceGroupSheet
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setSelectedResourceGroup(null);
          }}
          entity={selectedResourceGroup}
          onConfirm={handleDeleteConfirm}
        />
      </AdminLayout>
    );
  }

  // Desktop view - Tailwind UI Application UI style layout
  return (
    <AdminLayout>
      <div className={adminContentStyles.desktop}>
        {/* Stats pills + actions */}
        <PageToolbar
          actions={<>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="h-8 text-[13px]">
              <Plus className="mr-1 size-3.5" />
              {t('common.actions.create')}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground/60 hover:text-foreground" onClick={handleRefresh}>
                  <RefreshCw key={refreshKey} className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.common.refreshList')}</TooltipContent>
            </Tooltip>
          </>}
        >
          <StatsPill>{stats.total} {t('admin.resourceGroups.groupsUnit')}</StatsPill>
          <StatsPill variant="success" dot>{stats.active} {t('common.status.enabled')}</StatsPill>
          {stats.inactive > 0 && (
            <StatsPill variant="muted" dot>{stats.inactive} {t('common.status.disabled')}</StatsPill>
          )}
        </PageToolbar>

        {/* Status filter chips */}
        <div className="flex items-center gap-1">
          {(['all', 'active', 'inactive'] as const).map((value) => {
            const isActive = statusFilter === value;
            const label = value === 'all'
              ? t('filter.all')
              : value === 'active'
                ? `${t('common.status.enabled')} ${stats.active}`
                : `${t('common.status.disabled')} ${stats.inactive}`;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  'px-2 h-[26px] rounded-lg text-xs font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/15'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Resource Group List - table has its own border/rounded styling */}
        <ResourceGroupListTable
          resourceGroups={filteredResourceGroups}
          plansMap={plansMap}
          loading={isLoading || isFetching}
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Create Resource Group Dialog */}
      <CreateResourceGroupDialog
        open={createDialogOpen}
        plans={plans}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* Edit Resource Group Dialog */}
      <EditResourceGroupDialog
        open={editDialogOpen}
        resourceGroup={selectedResourceGroup}
        plansMap={plansMap}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedResourceGroup(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

      {/* Resource Group Detail Dialog */}
      <ResourceGroupDetailDialog
        open={detailDialogOpen}
        resourceGroup={selectedResourceGroup}
        plansMap={plansMap}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedResourceGroup(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteResourceGroupDialog
        open={deleteDialogOpen}
        resourceGroup={selectedResourceGroup}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedResourceGroup(null);
        }}
        onConfirm={handleDeleteConfirmById}
      />
    </AdminLayout>
  );
};
