/**
 * User List Table (Admin)
 *
 * Identity-first design:
 * - Avatar initials + name/email hierarchy
 * - Inline colored status dots
 * - Role badge with shield icon for admins
 * - Relative time for createdAt
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, CreditCard, MoreHorizontal, KeyRound, Shield } from 'lucide-react';
import { DataTable, AdminBadge, TableHoverCardProvider, TableHoverCardList, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { UserMobileList } from './UserMobileList';
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
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatDateTime } from '@/shared/utils/date-utils';
import { ACTIVE_STATUS_CONFIG, ROLE_CONFIG } from '@/shared/constants/status-config';
import type { UserResponse } from '@/api/user';

// ============================================================================
// Constants
// ============================================================================

const STATUS_DOT_COLOR: Record<string, string> = {
  active: 'bg-status-online',
  pending: 'bg-warning',
  suspended: 'bg-destructive',
  inactive: 'bg-muted-foreground/50',
};

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Sub-components
// ============================================================================

function UserIdentityCell({ user }: { user: UserResponse }) {
  const { t } = useTranslation();

  const hoverItems = [
    { label: 'ID', value: user.id },
    { label: t('tableColumns.email'), value: user.email },
    ...(user.name ? [{ label: t('common.fields.name'), value: user.name }] : []),
  ];

  return (
    <TableHoverCardList columnKey="email" items={hoverItems} contentClassName="w-72">
      <div className="flex items-center gap-3 cursor-default">
        {/* Avatar with initials */}
        <div className="relative shrink-0">
          <div className={cn(
            'flex size-8 items-center justify-center rounded-full text-xs font-semibold',
            user.role === 'admin'
              ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
              : 'bg-muted text-muted-foreground',
          )}>
            {user.initials || user.email.charAt(0).toUpperCase()}
          </div>
          {user.role === 'admin' && (
            <div className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Shield className="size-2" strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Name + email */}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground truncate text-sm">
            {user.name || user.email.split('@')[0]}
          </div>
          <div className="text-xs text-muted-foreground font-mono truncate">
            {user.email}
          </div>
        </div>
      </div>
    </TableHoverCardList>
  );
}

// ============================================================================
// Main Component
// ============================================================================

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
  const { isMobile } = useBreakpoint();

  // Context menu actions
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
  ), [t, onAssignSubscription, onEdit, onResetPassword, onDelete]);

  // Dropdown menu actions
  const renderDropdownMenuActions = useCallback((user: UserResponse) => (
    <>
      <DropdownMenuItem onSelect={() => onAssignSubscription(user)}>
        <CreditCard className="mr-2 size-4" />
        {t('admin.users.assignSubscription')}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onEdit(user)}>
        <Edit className="mr-2 size-4" />
        {t('common.actions.edit')}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onResetPassword(user)}>
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
  ), [t, onAssignSubscription, onEdit, onResetPassword, onDelete]);

  const columns = useMemo<ColumnDef<UserResponse>[]>(() => [
    {
      accessorKey: 'email',
      header: t('common.role.user'),
      size: 260,
      meta: { priority: 1, sticky: 'left' } as ResponsiveColumnMeta,
      cell: ({ row }) => <UserIdentityCell user={row.original} />,
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
      header: t('common.status.label'),
      size: 100,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = ACTIVE_STATUS_CONFIG[status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
        const dotColor = STATUS_DOT_COLOR[status] || 'bg-muted-foreground/50';
        return (
          <div className="flex items-center gap-2">
            <span className={cn('size-2 rounded-full shrink-0', dotColor)} />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t(statusConfig.labelKey)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('common.fields.createdAt'),
      size: 110,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const value = row.original.createdAt;
        if (!value) return <span className="text-muted-foreground/50 text-sm">-</span>;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground whitespace-nowrap cursor-default">
                {formatRelativeTime(value)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{formatDateTime(value)}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'actions',
      header: t('common.table.actions'),
      size: 56,
      enableSorting: false,
      meta: { priority: 1, sticky: 'right' } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors">
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end" collisionPadding={16}>
              {renderDropdownMenuActions(row.original)}
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      ),
    },
  ], [t, renderDropdownMenuActions]);

  // Mobile card list
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
    <TableHoverCardProvider>
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
    </TableHoverCardProvider>
  );
};
