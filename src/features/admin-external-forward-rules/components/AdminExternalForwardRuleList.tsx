/**
 * Admin External Forward Rule List Table Component
 * Desktop-friendly DataTable with responsive column support
 */

import { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  Globe,
  User,
  FileText,
  Layers,
  Server,
} from 'lucide-react';
import { DataTable, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { Badge } from '@/components/common/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { ContextMenuItem, ContextMenuSeparator } from '@/components/common/ContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CopyableAddress } from '@/components/common/CopyableAddress';
import type { AdminExternalForwardRule } from '@/api/admin/types';

interface AdminExternalForwardRuleListProps {
  rules: AdminExternalForwardRule[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (rule: AdminExternalForwardRule) => void;
  onDelete: (rule: AdminExternalForwardRule) => void;
  onToggleStatus: (rule: AdminExternalForwardRule) => void;
}

export const AdminExternalForwardRuleList: React.FC<AdminExternalForwardRuleListProps> = ({
  rules,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const { t } = useTranslation();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    rule: AdminExternalForwardRule | null;
  }>({ open: false, rule: null });

  const handleDeleteClick = useCallback((rule: AdminExternalForwardRule) => {
    setDeleteConfirm({ open: true, rule });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm.rule) {
      onDelete(deleteConfirm.rule);
      setDeleteConfirm({ open: false, rule: null });
    }
  }, [deleteConfirm.rule, onDelete]);

  // Context menu content
  const renderContextMenuActions = useCallback(
    (rule: AdminExternalForwardRule) => (
      <>
        <ContextMenuItem onClick={() => onEdit(rule)}>
          <Edit className="mr-2 size-4" />
          {t('common.actions.edit')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        {rule.status === 'enabled' ? (
          <ContextMenuItem onClick={() => onToggleStatus(rule)}>
            <PowerOff className="mr-2 size-4" />
            {t('admin.externalForwardRules.actions.disable')}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={() => onToggleStatus(rule)}>
            <Power className="mr-2 size-4" />
            {t('admin.externalForwardRules.actions.enable')}
          </ContextMenuItem>
        )}
        <ContextMenuItem
          onClick={() => handleDeleteClick(rule)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          {t('admin.externalForwardRules.actions.delete')}
        </ContextMenuItem>
      </>
    ),
    [onEdit, onToggleStatus, handleDeleteClick, t]
  );

  // Dropdown menu content
  const renderDropdownMenuActions = useCallback(
    (rule: AdminExternalForwardRule) => (
      <>
        {rule.status === 'enabled' ? (
          <DropdownMenuItem onClick={() => onToggleStatus(rule)}>
            <PowerOff className="mr-2 size-4" />
            {t('admin.externalForwardRules.actions.disable')}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onToggleStatus(rule)}>
            <Power className="mr-2 size-4" />
            {t('admin.externalForwardRules.actions.enable')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleDeleteClick(rule)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          {t('admin.externalForwardRules.actions.delete')}
        </DropdownMenuItem>
      </>
    ),
    [onToggleStatus, handleDeleteClick, t]
  );

  const columns = useMemo<ColumnDef<AdminExternalForwardRule, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('admin.externalForwardRules.columns.name'),
        size: 180,
        meta: { priority: 1 } as ResponsiveColumnMeta,
        cell: ({ row }) => (
          <div className="space-y-1 min-w-0">
            <div className="font-medium truncate">{row.original.name}</div>
            {row.original.remark && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {row.original.remark}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'serverAddress',
        header: t('admin.externalForwardRules.columns.serverAddress'),
        size: 200,
        meta: { priority: 1 } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const address = `${row.original.serverAddress}:${row.original.listenPort}`;
          return (
            <CopyableAddress
              address={address}
              className="text-primary font-mono text-sm"
            />
          );
        },
      },
      {
        id: 'owner',
        header: t('admin.externalForwardRules.columns.owner'),
        size: 120,
        meta: { priority: 2 } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const { subscriptionId, userId } = row.original;
          // Admin-created rules may not have subscriptionId/userId
          if (subscriptionId == null && userId == null) {
            return (
              <Badge variant="outline" className="text-xs">
                {t('admin.externalForwardRules.adminCreated')}
              </Badge>
            );
          }
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <FileText className="size-3" />
                <span>{t('admin.externalForwardRules.columns.subscriptionId')}: {subscriptionId ?? '-'}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="size-3" />
                <span>{t('admin.externalForwardRules.columns.userId')}: {userId ?? '-'}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: 'nodeSid',
        header: t('admin.externalForwardRules.columns.node'),
        size: 100,
        meta: { priority: 2 } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const nodeSid = row.original.nodeSid;
          if (!nodeSid) {
            return <span className="text-muted-foreground text-xs">-</span>;
          }
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <Server className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-mono truncate max-w-[80px]">{nodeSid}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{nodeSid}</TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: 'externalSource',
        header: t('admin.externalForwardRules.columns.externalSource'),
        size: 120,
        meta: { priority: 2 } as ResponsiveColumnMeta,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Globe className="size-3.5 text-muted-foreground" />
            <span className="truncate">{row.original.externalSource}</span>
          </div>
        ),
      },
      {
        id: 'groupIds',
        header: t('admin.externalForwardRules.columns.resourceGroups'),
        size: 100,
        meta: { priority: 3 } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const groupIds = row.original.groupIds;
          if (!groupIds || groupIds.length === 0) {
            return <span className="text-muted-foreground text-xs">-</span>;
          }
          return (
            <div className="flex items-center gap-1">
              <Layers className="size-3 text-muted-foreground" />
              <span className="text-xs">{groupIds.length}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('admin.externalForwardRules.columns.status'),
        size: 88,
        meta: { priority: 1 } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Badge
                    variant={rule.status === 'enabled' ? 'default' : 'secondary'}
                    className="text-xs cursor-pointer"
                    onClick={() => onToggleStatus(rule)}
                  >
                    {rule.status === 'enabled'
                      ? t('common.status.enabled')
                      : t('common.status.disabled')}
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {rule.status === 'enabled'
                  ? t('admin.externalForwardRules.tooltip.clickToDisable')
                  : t('admin.externalForwardRules.tooltip.clickToEnable')}
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: 'actions',
        header: t('admin.externalForwardRules.columns.actions'),
        size: 100,
        meta: { priority: 1 } as ResponsiveColumnMeta,
        enableSorting: false,
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onEdit(rule)}
                    className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  >
                    <Edit className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('common.actions.edit')}</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200">
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {renderDropdownMenuActions(rule)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onEdit, onToggleStatus, renderDropdownMenuActions, t]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={rules}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage={t('admin.externalForwardRules.empty')}
        getRowId={(row) => String(row.id)}
        enableContextMenu={true}
        contextMenuContent={renderContextMenuActions}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, rule: null })}
        title={t('admin.externalForwardRules.confirmDelete.title')}
        description={t('admin.externalForwardRules.confirmDelete.description', { name: deleteConfirm.rule?.name })}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
