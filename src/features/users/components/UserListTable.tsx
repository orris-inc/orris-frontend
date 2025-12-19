/**
 * 用户列表表格组件（管理端）
 * 使用 TanStack Table 实现
 */

import { useMemo, useCallback } from 'react';
import { Edit, Trash2, CreditCard, MoreHorizontal, KeyRound } from 'lucide-react';
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
import { formatDate } from '@/shared/utils/date-utils';
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

// 状态配置
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'default' | 'warning' | 'danger' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
  pending: { label: '待处理', variant: 'warning' },
  suspended: { label: '暂停', variant: 'danger' },
  deleted: { label: '已删除', variant: 'danger' },
};

// 角色配置
const ROLE_CONFIG: Record<string, { label: string; variant: 'info' | 'default' }> = {
  user: { label: '用户', variant: 'default' },
  admin: { label: '管理员', variant: 'info' },
};

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
  // 用户右键菜单内容
  const renderContextMenuActions = useCallback((user: UserResponse) => (
    <>
      <ContextMenuItem onClick={() => onAssignSubscription(user)}>
        <CreditCard className="mr-2 size-4" />
        分配订阅
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onEdit(user)}>
        <Edit className="mr-2 size-4" />
        编辑
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onResetPassword(user)}>
        <KeyRound className="mr-2 size-4" />
        重置密码
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={() => onDelete(user)}
        className="text-red-600 dark:text-red-400"
      >
        <Trash2 className="mr-2 size-4" />
        删除
      </ContextMenuItem>
    </>
  ), [onAssignSubscription, onEdit, onResetPassword, onDelete]);

  // 用户下拉菜单内容
  const renderDropdownMenuActions = useCallback((user: UserResponse) => (
    <>
      <DropdownMenuItem onClick={() => onAssignSubscription(user)}>
        <CreditCard className="mr-2 size-4" />
        分配订阅
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(user)}>
        <Edit className="mr-2 size-4" />
        编辑
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onResetPassword(user)}>
        <KeyRound className="mr-2 size-4" />
        重置密码
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => onDelete(user)}
        className="text-red-600 dark:text-red-400"
      >
        <Trash2 className="mr-2 size-4" />
        删除
      </DropdownMenuItem>
    </>
  ), [onAssignSubscription, onEdit, onResetPassword, onDelete]);

  const columns = useMemo<ColumnDef<UserResponse>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 56,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="font-mono text-slate-600 dark:text-slate-400">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: '邮箱',
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-slate-900 dark:text-white">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: '姓名',
      size: 140,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900 dark:text-white">
            {row.original.name || '-'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: '角色',
      size: 72,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const roleConfig = ROLE_CONFIG[row.original.role || 'user'] || { label: '用户', variant: 'default' as const };
        return (
          <AdminBadge variant={roleConfig.variant}>
            {roleConfig.label}
          </AdminBadge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const statusConfig = STATUS_CONFIG[row.original.status] || { label: row.original.status, variant: 'default' as const };
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
      size: 140,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      size: 56,
      enableSorting: false,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group">
              <MoreHorizontal className="size-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {renderDropdownMenuActions(row.original)}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [renderDropdownMenuActions]);

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
      emptyMessage="暂无用户数据"
      getRowId={(row) => String(row.id)}
      enableContextMenu={true}
      contextMenuContent={renderContextMenuActions}
    />
  );
};
