/**
 * Resource Group Management Page (Admin)
 * Tailwind UI Application UI style management interface
 */

import { useState, useMemo } from 'react';
import { formatDate } from '@/shared/utils/date-utils';
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
import { PageHeader } from '@/components/admin';
import { Button } from '@/components/common/Button';
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
    return formatDate(date);
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

  // Desktop view - Tailwind UI Application UI style layout
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header with badge and metadata */}
        <PageHeader
          title={t('admin.resourceGroups.title')}
          icon={Boxes}
          badge={{ label: `${stats.total} ${t('admin.resourceGroups.groupsUnit')}`, variant: 'default' }}
          metadata={[
            { icon: CheckCircle2, text: `${stats.active} ${t('common.status.active')}` },
            { icon: Link2, text: `${stats.withPlans} ${t('admin.resourceGroups.withPlans')}` },
            ...(stats.lastUpdated ? [{ icon: Clock, text: formatRelativeTime(stats.lastUpdated) }] : []),
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="size-4 mr-2" />
                {t('common.actions.create')}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleRefresh}>
                    <RefreshCw key={refreshKey} className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('admin.common.refreshList')}</TooltipContent>
              </Tooltip>
            </div>
          }
        />

        {/* Status filter tabs */}
        <div className="flex items-center gap-4">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="all">{t('filter.all')}</TabsTrigger>
              <TabsTrigger value="active" className="gap-1.5">
                <CheckCircle2 className="size-3.5" />
                {stats.active}
              </TabsTrigger>
              <TabsTrigger value="inactive" className="gap-1.5">
                <XCircle className="size-3.5" />
                {stats.inactive}
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
