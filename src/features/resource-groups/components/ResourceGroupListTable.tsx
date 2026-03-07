/**
 * 资源组列表表格组件（管理端）
 * 使用 TanStack Table 实现
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Power, MoreHorizontal, Trash2, Eye } from 'lucide-react';
import { DataTable, AdminBadge, TableHoverCardProvider, TableHoverCardList, DateTimeCell, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ResourceGroupMobileList } from './ResourceGroupMobileList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import { ACTIVE_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { ResourceGroup } from '@/api/resource/types';
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
  const { t } = useTranslation();
  // Detect mobile screen
  const { isMobile } = useBreakpoint();

  // Resource group context menu content
  const renderContextMenuActions = useCallback((resourceGroup: ResourceGroup) => (
    <>
      {onViewDetail && (
        <ContextMenuItem onClick={() => onViewDetail(resourceGroup)}>
          <Eye className="mr-2 size-4" />
          {t('subscription.viewDetails')}
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => onEdit(resourceGroup)}>
        <Edit className="mr-2 size-4" />
        {t('common.actions.edit')}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onToggleStatus(resourceGroup)}>
        <Power className="mr-2 size-4" />
        {resourceGroup.status === 'active' ? t('common.actions.disable') : t('common.actions.enable')}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={() => onDelete(resourceGroup)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 size-4" />
        {t('common.actions.delete')}
      </ContextMenuItem>
    </>
  ), [t, onViewDetail, onEdit, onDelete, onToggleStatus]);

  // Resource group dropdown menu content
  const renderDropdownMenuActions = useCallback((resourceGroup: ResourceGroup) => (
    <>
      {onViewDetail && (
        <DropdownMenuItem onSelect={() => onViewDetail(resourceGroup)}>
          <Eye className="mr-2 size-4" />
          {t('subscription.viewDetails')}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onSelect={() => onEdit(resourceGroup)}>
        <Edit className="mr-2 size-4" />
        {t('common.actions.edit')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => onToggleStatus(resourceGroup)}>
        <Power className="mr-2 size-4" />
        {resourceGroup.status === 'active' ? t('common.actions.disable') : t('common.actions.enable')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => onDelete(resourceGroup)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 size-4" />
        {t('common.actions.delete')}
      </DropdownMenuItem>
    </>
  ), [t, onViewDetail, onEdit, onDelete, onToggleStatus]);

  const columns = useMemo<ColumnDef<ResourceGroup>[]>(() => [
    {
      accessorKey: 'name',
      header: t('common.fields.name'),
      size: 200,
      meta: { priority: 1, sticky: 'left' } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const group = row.original;
        const hoverItems = [
          { label: 'SID', value: group.sid },
          ...(group.description ? [{ label: t('common.fields.description'), value: group.description }] : []),
        ];
        return (
          <TableHoverCardList
            columnKey="name"
            items={hoverItems}
            contentClassName="w-72"
          >
            <div className="flex flex-col gap-0.5 cursor-default">
              <span className="font-semibold text-foreground whitespace-nowrap truncate">
                {group.name}
              </span>
              <code className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded w-fit">
                {group.sid}
              </code>
            </div>
          </TableHoverCardList>
        );
      },
    },
    {
      accessorKey: 'planId',
      header: t('resourceGroups.associatedPlan'),
      size: 140,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const plan = plansMap[row.original.planId];
        return plan ? (
          <div className="space-y-0.5">
            <div className="text-sm text-foreground">
              {plan.name}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground font-mono">
              {plan.slug}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t('resourceGroups.planPlaceholder', { id: row.original.planId })}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('common.status.label'),
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = ACTIVE_STATUS_CONFIG[status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
        return (
          <AdminBadge variant={statusConfig.variant}>
            {t(statusConfig.labelKey)}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('common.fields.createdAt'),
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => <DateTimeCell value={row.original.createdAt} format="date" />,
    },
    {
      id: 'actions',
      header: t('common.table.actions'),
      size: 56,
      enableSorting: false,
      meta: { priority: 1, sticky: 'right' } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const resourceGroup = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-all duration-150 cursor-pointer">
                <MoreHorizontal className="size-4" strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent align="end" collisionPadding={16}>
                {renderDropdownMenuActions(resourceGroup)}
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        );
      },
    },
  ], [t, plansMap, renderDropdownMenuActions]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <ResourceGroupMobileList
        resourceGroups={resourceGroups}
        plansMap={plansMap}
        loading={loading}
        onViewDetail={onViewDetail}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      />
    );
  }

  return (
    <TableHoverCardProvider>
      <DataTable
        columns={columns}
        data={resourceGroups}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage={t('resourceGroups.noData')}
        getRowId={(row) => row.sid}
        enableContextMenu={true}
        contextMenuContent={renderContextMenuActions}
      />
    </TableHoverCardProvider>
  );
};
