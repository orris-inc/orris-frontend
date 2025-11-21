/**
 * 用户列表表格组件（管理端）
 * 使用统一的 AdminTable 组件
 */

import { Edit, Trash2, CreditCard } from 'lucide-react';
import {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  AdminTableEmpty,
  AdminTableLoading,
  AdminTablePagination,
  AdminBadge,
} from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { formatDate } from '@/shared/utils/date-utils';
import type { UserListItem } from '../types/users.types';

interface UserListTableProps {
  users: UserListItem[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  onAssignSubscription: (user: UserListItem) => void;
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

const COLUMNS = 7;

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
}) => {
  return (
    <>
      <AdminTable>
        <AdminTableHeader>
          <AdminTableRow>
            <AdminTableHead width={60}>ID</AdminTableHead>
            <AdminTableHead>邮箱</AdminTableHead>
            <AdminTableHead>姓名</AdminTableHead>
            <AdminTableHead width={80}>角色</AdminTableHead>
            <AdminTableHead width={80}>状态</AdminTableHead>
            <AdminTableHead width={140}>创建时间</AdminTableHead>
            <AdminTableHead width={80} align="center">操作</AdminTableHead>
          </AdminTableRow>
        </AdminTableHeader>
        <AdminTableBody>
          {loading && users.length === 0 ? (
            <AdminTableLoading colSpan={COLUMNS} />
          ) : users.length === 0 ? (
            <AdminTableEmpty message="暂无用户数据" colSpan={COLUMNS} />
          ) : (
            users.map((user) => {
              const statusConfig = STATUS_CONFIG[user.status] || { label: user.status, variant: 'default' as const };
              const roleConfig = ROLE_CONFIG[user.role || 'user'] || { label: '用户', variant: 'default' as const };

              return (
                <AdminTableRow key={user.id}>
                  <AdminTableCell className="font-medium text-slate-900 dark:text-white">
                    {user.id}
                  </AdminTableCell>
                  <AdminTableCell>{user.email}</AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {user.name || '-'}
                      </div>
                      {user.display_name && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {user.display_name}
                        </div>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant={roleConfig.variant}>
                      {roleConfig.label}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell className="text-slate-500 dark:text-slate-400 text-sm">
                    {formatDate(user.created_at)}
                  </AdminTableCell>
                  <AdminTableCell align="center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                          操作
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAssignSubscription(user)}>
                          <CreditCard className="mr-2 size-4" />
                          分配订阅
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Edit className="mr-2 size-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(user)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="mr-2 size-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </AdminTableCell>
                </AdminTableRow>
              );
            })
          )}
        </AdminTableBody>
      </AdminTable>
      <AdminTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        loading={loading}
      />
    </>
  );
};
