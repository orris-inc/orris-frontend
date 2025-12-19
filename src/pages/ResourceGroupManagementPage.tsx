/**
 * Resource Group Management Page (Admin)
 * Using unified elegant business style components
 */

import { useState, useMemo } from 'react';
import { Boxes, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
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

  const {
    resourceGroups,
    pagination,
    isLoading,
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

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResourceGroup, setSelectedResourceGroup] = useState<ResourceGroup | null>(null);

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
      <AdminPageLayout
        title="资源组管理"
        description="管理订阅计划关联的资源组"
        icon={Boxes}
        action={
          <AdminButton
            variant="primary"
            icon={<Plus className="size-4" strokeWidth={1.5} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            创建资源组
          </AdminButton>
        }
      >
        {/* Resource group list table */}
        <AdminCard noPadding>
          <ResourceGroupListTable
            resourceGroups={resourceGroups}
            plansMap={plansMap}
            loading={isLoading}
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
      </AdminPageLayout>

      {/* Create resource group dialog */}
      <CreateResourceGroupDialog
        open={createDialogOpen}
        plans={plans}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* Edit resource group dialog */}
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

      {/* Resource group detail dialog */}
      <ResourceGroupDetailDialog
        open={detailDialogOpen}
        resourceGroup={selectedResourceGroup}
        plansMap={plansMap}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedResourceGroup(null);
        }}
      />

      {/* Delete confirmation dialog */}
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
