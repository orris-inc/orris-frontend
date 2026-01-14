/**
 * 用户列表表格组件（管理端）
 * 使用 TanStack Table 实现
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, CreditCard, MoreHorizontal, KeyRound } from 'lucide-react';
import { DataTable, AdminBadge, TruncatedId, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { UserMobileList } from './UserMobileList';
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
import { formatDate } from '@/shared/utils/date-utils';
import { ACTIVE_STATUS_CONFIG, ROLE_CONFIG } from '@/shared/constants/status-config';
import type { UserResponse } from '@/api/user';

interface UserListTableProps {
  users: UserResponse[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  onAssignSubscription: (user: UserResponse) => void;
  onResetPassword: (user: UserResponse) => void;
}


export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onAssignSubscription,
  onResetPassword,
}) => {
  const { t } = useTranslation();
  // Detect mobile screen
  const { isMobile } = useBreakpoint();

  // User context menu content
  const renderContextMenuActions = useCallback((user: UserResponse) => (
    <>
      <ContextMenuItem onClick={() => onAssignSubscription(user)}>
        <CreditCard className="mr-2 size-4" />
        {t('admin.users.assignSubscription')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onEdit(user)}>
        <Edit className="mr-2 size-4" />
        {t('common.actions.edit')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onResetPassword(user)}>
        <KeyRound className="mr-2 size-4" />
        {t('user.detail.resetPassword')}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={() => onDelete(user)}
        className="text-destructive"
      >
        <Trash2 className="mr-2 size-4" />
        {t('common.actions.delete')}
      </ContextMenuItem>
    </>
  ), [onAssignSubscription, onEdit, onResetPassword, onDelete]);

  // User dropdown menu content
  const renderDropdownMenuActions = useCallback((user: UserResponse) => (
    <>
      <DropdownMenuItem onClick={() => onAssignSubscription(user)}>
        <CreditCard className="mr-2 size-4" />
        {t('admin.users.assignSubscription')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(user)}>
        <Edit className="mr-2 size-4" />
        {t('common.actions.edit')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onResetPassword(user)}>
        <KeyRound className="mr-2 size-4" />
        {t('user.detail.resetPassword')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => onDelete(user)}
        className="text-destructive"
      >
        <Trash2 className="mr-2 size-4" />
        {t('common.actions.delete')}
      </DropdownMenuItem>
    </>
  ), [onAssignSubscription, onEdit, onResetPassword, onDelete]);

  const columns = useMemo<ColumnDef<UserResponse>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 120,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => <TruncatedId id={row.original.id} />,
    },
    {
      accessorKey: 'email',
      header: t('tableColumns.email'),
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-foreground">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: t('tableColumns.name'),
      size: 140,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.name || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: t('tableColumns.role'),
      size: 72,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const roleConfig = ROLE_CONFIG[row.original.role || 'user'] || { labelKey: 'common.role.user', variant: 'default' as const };
        return (
          <AdminBadge variant={roleConfig.variant}>
            {t(roleConfig.labelKey)}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('tableColumns.status'),
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const statusConfig = ACTIVE_STATUS_CONFIG[row.original.status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
        return (
          <AdminBadge variant={statusConfig.variant}>
            {t(statusConfig.labelKey)}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('tableColumns.createdAt'),
      size: 140,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('tableColumns.actions'),
      size: 56,
      enableSorting: false,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {renderDropdownMenuActions(row.original)}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [t, renderDropdownMenuActions]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <UserMobileList
        users={users}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
        onAssignSubscription={onAssignSubscription}
        onResetPassword={onResetPassword}
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={users}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage={t('admin.users.noData')}
      getRowId={(row) => String(row.id)}
      enableContextMenu={true}
      contextMenuContent={renderContextMenuActions}
    />
  );
};
