/**
 * 节点列表表格组件（管理端）
 * 使用统一的 AdminTable 组件
 */

import { Edit, Trash2, Key, Eye, Power, PowerOff } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import type { NodeListItem } from '../types/nodes.types';

interface NodeListTableProps {
  nodes: NodeListItem[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (node: NodeListItem) => void;
  onDelete: (node: NodeListItem) => void;
  onActivate: (node: NodeListItem) => void;
  onDeactivate: (node: NodeListItem) => void;
  onGenerateToken: (node: NodeListItem) => void;
  onViewDetail: (node: NodeListItem) => void;
}

// 状态配置
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'default' | 'warning' | 'danger' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
  maintenance: { label: '维护中', variant: 'warning' },
  error: { label: '错误', variant: 'danger' },
};

// 协议标签
const PROTOCOL_LABELS: Record<string, string> = {
  shadowsocks: 'Shadowsocks',
  trojan: 'Trojan',
};

// 格式化时间
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const COLUMNS = 9;

export const NodeListTable: React.FC<NodeListTableProps> = ({
  nodes,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onGenerateToken,
  onViewDetail,
}) => {
  return (
    <>
      <AdminTable>
        <AdminTableHeader>
          <AdminTableRow>
            <AdminTableHead width={60}>ID</AdminTableHead>
            <AdminTableHead>名称</AdminTableHead>
            <AdminTableHead width={100}>协议</AdminTableHead>
            <AdminTableHead>服务器地址</AdminTableHead>
            <AdminTableHead width={80}>地区</AdminTableHead>
            <AdminTableHead width={120}>加密方法</AdminTableHead>
            <AdminTableHead width={80}>状态</AdminTableHead>
            <AdminTableHead width={140}>创建时间</AdminTableHead>
            <AdminTableHead width={80} align="center">操作</AdminTableHead>
          </AdminTableRow>
        </AdminTableHeader>
        <AdminTableBody>
          {loading && nodes.length === 0 ? (
            <AdminTableLoading colSpan={COLUMNS} />
          ) : nodes.length === 0 ? (
            <AdminTableEmpty message="暂无节点数据" colSpan={COLUMNS} />
          ) : (
            nodes.map((node) => {
              const statusConfig = STATUS_CONFIG[node.status] || { label: node.status, variant: 'default' as const };

              return (
                <AdminTableRow key={node.id}>
                  <AdminTableCell className="font-medium text-slate-900 dark:text-white">
                    {node.id}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{node.name}</div>
                      {node.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {node.description}
                        </div>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="outline">
                      {PROTOCOL_LABELS[node.protocol] || node.protocol}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-sm">
                    {node.server_address}:{node.server_port}
                  </AdminTableCell>
                  <AdminTableCell>{node.region || '-'}</AdminTableCell>
                  <AdminTableCell className="font-mono text-xs">
                    {node.method}
                  </AdminTableCell>
                  <AdminTableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <AdminBadge
                            variant={statusConfig.variant}
                            onClick={() => node.status === 'active' ? onDeactivate(node) : onActivate(node)}
                          >
                            {statusConfig.label}
                          </AdminBadge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {node.status === 'active' ? '点击停用' : '点击激活'}
                      </TooltipContent>
                    </Tooltip>
                  </AdminTableCell>
                  <AdminTableCell className="text-slate-500 dark:text-slate-400 text-sm">
                    {formatDate(node.created_at)}
                  </AdminTableCell>
                  <AdminTableCell align="center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                          操作
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetail(node)}>
                          <Eye className="mr-2 size-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(node)}>
                          <Edit className="mr-2 size-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onGenerateToken(node)}>
                          <Key className="mr-2 size-4" />
                          生成Token
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {node.status === 'active' ? (
                          <DropdownMenuItem onClick={() => onDeactivate(node)}>
                            <PowerOff className="mr-2 size-4" />
                            停用
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onActivate(node)}>
                            <Power className="mr-2 size-4" />
                            激活
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(node)} className="text-red-600 dark:text-red-400">
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
