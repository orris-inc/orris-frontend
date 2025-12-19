/**
 * 资源组管理页面（管理端）
 * 使用统一的精致商务风格组件
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

  // 获取所有计划用于关联显示和创建表单
  const { data: plansData } = useQuery({
    queryKey: queryKeys.subscriptionPlans.list({ pageSize: 100 }),
    queryFn: () => listPlans({ pageSize: 100 }),
  });

  const plans = useMemo(() => plansData?.items ?? [], [plansData?.items]);

  // 构建计划 ID -> 计划信息的映射
  const plansMap = useMemo(() => {
    const map: Record<string, SubscriptionPlan> = {};
    for (const plan of plans) {
      map[plan.id] = plan;
    }
    return map;
  }, [plans]);

  // 对话框状态
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

  const handleUpdateSubmit = async (id: number, data: UpdateResourceGroupRequest) => {
    await updateResourceGroup(id, data);
    setEditDialogOpen(false);
    setSelectedResourceGroup(null);
  };

  const handleDeleteConfirm = async (id: number) => {
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
        {/* 资源组列表表格 */}
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

      {/* 创建资源组对话框 */}
      <CreateResourceGroupDialog
        open={createDialogOpen}
        plans={plans}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* 编辑资源组对话框 */}
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

      {/* 资源组详情对话框 */}
      <ResourceGroupDetailDialog
        open={detailDialogOpen}
        resourceGroup={selectedResourceGroup}
        plansMap={plansMap}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedResourceGroup(null);
        }}
      />

      {/* 删除确认对话框 */}
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
