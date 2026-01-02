/**
 * Resource Group Management Page (Admin)
 * Uses unified refined business style components
 */

import { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Link2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/common/Separator';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  AdminButton,
  AdminCard,
  PageStatsCard,
  type PageStatsCardProps,
} from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
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
} from '@/features/resource-groups/components';
import { useResourceGroupsPage } from '@/features/resource-groups/hooks/useResourceGroups';
import type { ResourceGroup, CreateResourceGroupRequest, UpdateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

export const ResourceGroupManagementPage = () => {
  usePageTitle('资源组管理');

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
  const groupStats = useMemo(() => {
    const total = pagination.total;
    const active = resourceGroups.filter((g) => g.status === 'active').length;
    const inactive = resourceGroups.filter((g) => g.status === 'inactive').length;
    const withPlans = resourceGroups.filter((g) => g.planId).length;
    return { total, active, inactive, withPlans };
  }, [resourceGroups, pagination.total]);

  const statsCards: PageStatsCardProps[] = [
    {
      title: '资源组总数',
      value: groupStats.total,
      icon: <Boxes className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '已激活',
      value: groupStats.active,
      icon: <CheckCircle2 className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      showPulse: groupStats.active > 0,
    },
    {
      title: '已停用',
      value: groupStats.inactive,
      icon: <XCircle className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    {
      title: '已关联计划',
      value: groupStats.withPlans,
      icon: <Link2 className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      iconColor: 'text-info',
    },
  ];

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
    setCreateDialogOpen(false);
  };

  const handleUpdateSubmit = async (id: string, data: UpdateResourceGroupRequest) => {
    await updateResourceGroup(id, data);
    setEditDialogOpen(false);
    setSelectedResourceGroup(null);
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteResourceGroup(id);
    setDeleteDialogOpen(false);
    setSelectedResourceGroup(null);
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
                资源组管理
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                管理订阅计划关联的资源组
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
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
            onClick={() => setCreateDialogOpen(true)}
          >
            <span className="hidden sm:inline">创建资源组</span>
            <span className="sm:hidden">创建</span>
          </AdminButton>
        </div>

        {/* Resource Group List */}
        {isMobile ? (
          <ResourceGroupListTable
            resourceGroups={resourceGroups}
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
        ) : (
          <AdminCard noPadding>
            <ResourceGroupListTable
              resourceGroups={resourceGroups}
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
        )}
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
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};
