/**
 * 资源组列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo, useCallback } from 'react';
import { Edit, Power, MoreHorizontal, Trash2, Eye } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import type { ResourceGroup, ResourceGroupStatus } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface ResourceGroupListTableProps {
  resourceGroups: ResourceGroup[];
  plansMap: Record<string, SubscriptionPlan>;
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail?: (resourceGroup: ResourceGroup) => void;
  onEdit: (resourceGroup: ResourceGroup) => void;
  onDelete: (resourceGroup: ResourceGroup) => void;
  onToggleStatus: (resourceGroup: ResourceGroup) => void;
}

const STATUS_CONFIG: Record<ResourceGroupStatus, { label: string; variant: 'success' | 'default' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
};

export const ResourceGroupListTable: React.FC<ResourceGroupListTableProps> = ({
  resourceGroups,
  plansMap,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  // 资源组右键菜单内容
  const renderContextMenuActions = useCallback((resourceGroup: ResourceGroup) => (
    <>
      {onViewDetail && (
        <ContextMenuItem onClick={() => onViewDetail(resourceGroup)}>
          <Eye className="mr-2 size-4" />
          查看详情
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => onEdit(resourceGroup)}>
        <Edit className="mr-2 size-4" />
        编辑
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onToggleStatus(resourceGroup)}>
        <Power className="mr-2 size-4" />
        {resourceGroup.status === 'active' ? '停用' : '激活'}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={() => onDelete(resourceGroup)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 size-4" />
        删除
      </ContextMenuItem>
    </>
  ), [onViewDetail, onEdit, onDelete, onToggleStatus]);

  // 资源组下拉菜单内容
  const renderDropdownMenuActions = useCallback((resourceGroup: ResourceGroup) => (
    <>
      {onViewDetail && (
        <DropdownMenuItem onClick={() => onViewDetail(resourceGroup)}>
          <Eye className="mr-2 size-4" />
          查看详情
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => onEdit(resourceGroup)}>
        <Edit className="mr-2 size-4" />
        编辑
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onToggleStatus(resourceGroup)}>
        <Power className="mr-2 size-4" />
        {resourceGroup.status === 'active' ? '停用' : '激活'}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => onDelete(resourceGroup)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 size-4" />
        删除
      </DropdownMenuItem>
    </>
  ), [onViewDetail, onEdit, onDelete, onToggleStatus]);

  const columns = useMemo<ColumnDef<ResourceGroup>[]>(() => [
    {
      accessorKey: 'sid',
      header: 'SID',
      size: 120,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-500">
          {row.original.sid}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: '名称',
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-[15px] text-slate-900 dark:text-white leading-tight">
            {row.original.name}
          </div>
          {row.original.description && (
            <div className="text-xs text-slate-400 dark:text-slate-500 leading-tight line-clamp-1">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'planId',
      header: '关联计划',
      size: 140,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const plan = plansMap[row.original.planId];
        return plan ? (
          <div className="space-y-0.5">
            <div className="text-sm text-slate-900 dark:text-white">
              {plan.name}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {plan.slug}
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-400">
            计划 #{row.original.planId}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = STATUS_CONFIG[status] || { label: '未知', variant: 'default' as const };
        return (
          <AdminBadge variant={statusConfig.variant}>
            {statusConfig.label}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {new Date(row.original.createdAt).toLocaleDateString('zh-CN')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      size: 56,
      enableSorting: false,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const resourceGroup = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group">
                <MoreHorizontal className="size-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {renderDropdownMenuActions(resourceGroup)}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [plansMap, renderDropdownMenuActions]);

  return (
    <DataTable
      columns={columns}
      data={resourceGroups}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="暂无资源组"
      getRowId={(row) => row.sid}
      enableContextMenu={true}
      contextMenuContent={renderContextMenuActions}
    />
  );
};
