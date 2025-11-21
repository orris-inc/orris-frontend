/**
 * 节点组列表表格组件（管理端）
 * 使用统一的 AdminTable 组件
 */

import { Edit, Trash2, Eye, Network } from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import type { NodeGroupListItem } from '../types/node-groups.types';
import { formatDateTime } from '@/shared/utils/date-utils';

interface NodeGroupListTableProps {
  nodeGroups: NodeGroupListItem[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (group: NodeGroupListItem) => void;
  onDelete: (group: NodeGroupListItem) => void;
  onManageNodes: (group: NodeGroupListItem) => void;
  onViewDetail: (group: NodeGroupListItem) => void;
}

const COLUMNS = 8;

export const NodeGroupListTable = ({
  nodeGroups,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onManageNodes,
  onViewDetail,
}: NodeGroupListTableProps) => {
  return (
    <>
      <AdminTable>
        <AdminTableHeader>
          <AdminTableRow>
            <AdminTableHead width={60}>ID</AdminTableHead>
            <AdminTableHead>名称</AdminTableHead>
            <AdminTableHead>描述</AdminTableHead>
            <AdminTableHead width={80}>公开性</AdminTableHead>
            <AdminTableHead width={80}>节点数</AdminTableHead>
            <AdminTableHead width={60}>排序</AdminTableHead>
            <AdminTableHead width={140}>创建时间</AdminTableHead>
            <AdminTableHead width={80} align="center">操作</AdminTableHead>
          </AdminTableRow>
        </AdminTableHeader>
        <AdminTableBody>
          {loading && nodeGroups.length === 0 ? (
            <AdminTableLoading colSpan={COLUMNS} />
          ) : nodeGroups.length === 0 ? (
            <AdminTableEmpty message="暂无节点组数据" colSpan={COLUMNS} />
          ) : (
            nodeGroups.map((group) => (
              <AdminTableRow key={group.id}>
                <AdminTableCell className="font-medium text-slate-900 dark:text-white">
                  {group.id}
                </AdminTableCell>
                <AdminTableCell>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {group.name}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[300px]">
                    {group.description || '-'}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge variant={group.is_public ? 'success' : 'default'}>
                    {group.is_public ? '公开' : '私有'}
                  </AdminBadge>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge variant="outline">
                    {group.node_count || 0}
                  </AdminBadge>
                </AdminTableCell>
                <AdminTableCell>{group.sort_order ?? '-'}</AdminTableCell>
                <AdminTableCell className="text-slate-500 dark:text-slate-400 text-sm">
                  {formatDateTime(group.created_at)}
                </AdminTableCell>
                <AdminTableCell align="center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                        操作
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetail(group)}>
                        <Eye className="mr-2 size-4" />
                        查看详情
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onManageNodes(group)}>
                        <Network className="mr-2 size-4" />
                        管理节点
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(group)}>
                        <Edit className="mr-2 size-4" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(group)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 size-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AdminTableCell>
              </AdminTableRow>
            ))
          )}
        </AdminTableBody>
      </AdminTable>
      <AdminTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 50, 100]}
        loading={loading}
      />
    </>
  );
};
