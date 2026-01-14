/**
 * Resource Group Management Page (Admin)
 * High-density data management interface
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Boxes,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Link2,
  Clock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminButton, AdminCard } from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/common/Tabs';
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
    const withPlans = resourceGroups.filter((g) => g.planId).length;

    // Find the most recently updated resource group
    const lastUpdated = resourceGroups.length > 0
      ? resourceGroups.reduce((latest, group) => {
          const groupDate = new Date(group.updatedAt);
          return groupDate > latest ? groupDate : latest;
        }, new Date(resourceGroups[0].updatedAt))
      : null;

    return { total, active, inactive, withPlans, lastUpdated };
  }, [resourceGroups, pagination.total]);

  // Format relative time
  const formatRelativeTime = (date: Date | null): string => {
    if (!date) return '-';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.time.now');
    if (diffMins < 60) return t('common.time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('common.time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('common.time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

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
        <div className="py-3">
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

  // Desktop view - original layout with header and table
  return (
    <AdminLayout>
      <div className="py-3 space-y-3">
        {/* High-Density Status Bar with Integrated Filters */}
        <header className="bg-card rounded-lg border border-border px-3 py-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Title + Stats */}
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-foreground">{t('admin.resourceGroups.title')}</h1>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Boxes className="size-3" />
                  <span className="font-medium text-foreground">{stats.total}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="font-medium text-success">{stats.active}</span>
                </span>
                {stats.inactive > 0 && (
                  <span className="flex items-center gap-1">
                    <XCircle className="size-3 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">{stats.inactive}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Link2 className="size-3 text-info" />
                  <span className="font-medium text-info">{stats.withPlans}</span>
                </span>
              </div>
            </div>

            {/* Center: Filter Tabs + Last Updated */}
            <div className="hidden md:flex items-center gap-3 flex-1 justify-center">
              {/* Status filter tabs */}
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <TabsList className="h-7">
                  <TabsTrigger value="all" className="text-[10px] px-2 h-6">
                    {t('filter.all')}
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-[10px] px-2 h-6 gap-1">
                    <CheckCircle2 className="size-2.5" />
                    {stats.active}
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="text-[10px] px-2 h-6 gap-1">
                    <XCircle className="size-2.5" />
                    {stats.inactive}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Last updated */}
              {stats.lastUpdated && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
                        <Clock className="size-3" />
                        <span className="tabular-nums">{formatRelativeTime(stats.lastUpdated)}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('admin.resourceGroups.lastUpdated')}: {stats.lastUpdated.toLocaleString()}
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
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
                    <span className="sr-only">{t('common.actions.refresh')}</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>{t('admin.common.refreshList')}</TooltipContent>
              </Tooltip>

              <AdminButton
                variant="primary"
                size="sm"
                className="h-7 px-2.5 text-xs"
                icon={<Plus className="size-3.5" strokeWidth={2} />}
                onClick={() => setCreateDialogOpen(true)}
              >
                <span className="hidden sm:inline">{t('common.actions.create')}</span>
                <span className="sm:hidden">{t('common.actions.create')}</span>
              </AdminButton>
            </div>
          </div>
        </header>

        {/* Resource Group List */}
        <AdminCard noPadding>
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
        </AdminCard>
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
