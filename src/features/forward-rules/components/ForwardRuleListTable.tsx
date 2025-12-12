/**
 * 转发规则列表表格组件（管理端）
 * 使用 TanStack Table 实现，支持响应式列隐藏
 */

import { useMemo, useState } from 'react';
import { Edit, Trash2, Eye, Power, PowerOff, MoreHorizontal, RotateCcw, Activity, Loader2, Copy, Check, Server, Bot, Settings } from 'lucide-react';
import { DataTable, AdminBadge, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import type { ForwardRule, ForwardAgent } from '@/api/forward';
import type { Node } from '@/api/node';

interface ForwardRuleListTableProps {
  rules: ForwardRule[];
  agentsMap?: Record<string, ForwardAgent>;
  nodes?: Node[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  onEnable: (rule: ForwardRule) => void;
  onDisable: (rule: ForwardRule) => void;
  onResetTraffic: (rule: ForwardRule) => void;
  onViewDetail: (rule: ForwardRule) => void;
  onProbe: (rule: ForwardRule) => void;
  probingRuleId?: string | null;
}

// 状态配置
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'default' }> = {
  enabled: { label: '已启用', variant: 'success' },
  disabled: { label: '已禁用', variant: 'default' },
};

// 可复制地址组件
const CopyableAddress: React.FC<{ address: string; className?: string }> = ({ address, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address && address !== '-') {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!address || address === '-') {
    return <span className="text-slate-400 dark:text-slate-500">-</span>;
  }

  return (
    <div className={`flex items-center gap-1 min-w-0 ${className}`}>
      <span className="font-mono text-xs truncate">{address}</span>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        title={copied ? '已复制' : '复制'}
      >
        {copied ? (
          <Check className="size-3 text-green-500" />
        ) : (
          <Copy className="size-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
        )}
      </button>
    </div>
  );
};

// 格式化流量（默认显示 GB）
const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
};

export const ForwardRuleListTable: React.FC<ForwardRuleListTableProps> = ({
  rules,
  agentsMap = {},
  nodes = [],
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onResetTraffic,
  onViewDetail,
  onProbe,
  probingRuleId,
}) => {
  const columns = useMemo<ColumnDef<ForwardRule, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: '规则名',
      size: 150,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <div className="space-y-1 min-w-0">
          <div className="font-medium text-slate-900 dark:text-white truncate">{row.original.name}</div>
          {row.original.remark && (
            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {row.original.remark}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'entry',
      header: '入口',
      size: 220,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const agent = agentsMap[rule.agentId];
        const agentName = agent?.name || `ID: ${rule.agentId}`;
        const entryAddress = agent?.publicAddress ? `${agent.publicAddress}:${rule.listenPort}` : '-';
        return (
          <div className="space-y-0.5 min-w-0">
            <div className="text-sm text-slate-900 dark:text-white truncate">{agentName}</div>
            <CopyableAddress address={entryAddress} className="text-blue-600 dark:text-blue-400" />
          </div>
        );
      },
    },
    {
      id: 'exit',
      header: '出口',
      size: 240,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;

        // 获取目标地址的辅助函数
        const getTargetDisplay = () => {
          if (rule.targetNodeId) {
            const targetNode = nodes.find((n) => n.id === rule.targetNodeId);
            const nodeName = targetNode?.name || `ID: ${rule.targetNodeId}`;
            const nodePort = targetNode?.subscriptionPort || targetNode?.agentPort;
            // 使用 API 返回的目标节点地址（根据 ipVersion 选择）
            let address: string | undefined;
            if (rule.ipVersion === 'ipv4' && rule.targetNodePublicIpv4) {
              address = rule.targetNodePublicIpv4;
            } else if (rule.ipVersion === 'ipv6' && rule.targetNodePublicIpv6) {
              address = rule.targetNodePublicIpv6;
            } else {
              // auto 或 fallback: 优先使用 serverAddress，其次 IPv4，最后 IPv6
              address = rule.targetNodeServerAddress || rule.targetNodePublicIpv4 || rule.targetNodePublicIpv6;
            }
            const nodeAddress = address ? (nodePort ? `${address}:${nodePort}` : address) : '-';
            return { name: nodeName, address: nodeAddress, type: 'node' as const };
          }
          if (rule.targetAddress) {
            return {
              name: '手动配置',
              address: `${rule.targetAddress}:${rule.targetPort}`,
              type: 'manual' as const,
            };
          }
          return null;
        };

        // 出口类型图标组件
        const ExitTypeIcon: React.FC<{ type: 'agent' | 'node' | 'manual'; className?: string }> = ({ type, className = '' }) => {
          const iconProps = { className: `size-3.5 ${className}` };
          switch (type) {
            case 'agent':
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Bot {...iconProps} />
                  </TooltipTrigger>
                  <TooltipContent>经由转发 Agent</TooltipContent>
                </Tooltip>
              );
            case 'node':
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Server {...iconProps} />
                  </TooltipTrigger>
                  <TooltipContent>目标节点</TooltipContent>
                </Tooltip>
              );
            case 'manual':
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Settings {...iconProps} />
                  </TooltipTrigger>
                  <TooltipContent>手动配置地址</TooltipContent>
                </Tooltip>
              );
          }
        };

        // entry 类型：显示出口节点 -> 目标
        if (rule.ruleType === 'entry' && rule.exitAgentId) {
          const exitAgent = agentsMap[rule.exitAgentId];
          const exitName = exitAgent?.name || `ID: ${rule.exitAgentId}`;
          const target = getTargetDisplay();
          // 显示出口节点名称和目标地址
          const targetAddress = target?.address || '-';
          return (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-white">
                <ExitTypeIcon type="agent" className="text-purple-500 flex-shrink-0" />
                <span className="truncate">{exitName}</span>
              </div>
              <CopyableAddress address={targetAddress} className="text-slate-500 dark:text-slate-400 pl-5" />
            </div>
          );
        }

        // chain 和 direct_chain 类型：显示链节点信息 -> 目标
        if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds && rule.chainAgentIds.length > 0) {
          const chainCount = rule.chainAgentIds.length;
          const chainNames = rule.chainAgentIds
            .slice(0, 2)
            .map((id) => {
              const agent = agentsMap[id];
              return agent?.name || `ID: ${id}`;
            })
            .join(' → ');
          const chainLabel = chainCount > 2 ? `${chainNames} ... (+${chainCount - 2})` : chainNames;
          const target = getTargetDisplay();
          const targetAddress = target?.address || '-';
          return (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-white">
                <ExitTypeIcon type="agent" className="text-purple-500 flex-shrink-0" />
                <span className="truncate" title={chainLabel}>{chainLabel}</span>
              </div>
              <CopyableAddress address={targetAddress} className="text-slate-500 dark:text-slate-400 pl-5" />
            </div>
          );
        }

        // direct 类型：显示目标
        const target = getTargetDisplay();
        if (target) {
          const iconType = target.type === 'node' ? 'node' : 'manual';
          const iconColor = target.type === 'node' ? 'text-blue-500' : 'text-slate-400';
          return (
            <div className="space-y-0.5 min-w-0">
              <div className={`flex items-center gap-1.5 text-sm ${target.type === 'manual' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                <ExitTypeIcon type={iconType} className={`${iconColor} flex-shrink-0`} />
                <span className="truncate">{target.name}</span>
              </div>
              <CopyableAddress address={target.address} className="text-slate-500 dark:text-slate-400 pl-5" />
            </div>
          );
        }

        return <span className="text-slate-400 dark:text-slate-500">-</span>;
      },
    },
    {
      id: 'traffic',
      header: '已用流量',
      size: 100,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const totalBytes = (row.original.uploadBytes || 0) + (row.original.downloadBytes || 0);
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {formatBytes(totalBytes)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              上传: {formatBytes(row.original.uploadBytes)} / 下载: {formatBytes(row.original.downloadBytes)}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 88,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const statusConfig = STATUS_CONFIG[rule.status] || { label: rule.status, variant: 'default' as const };
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <AdminBadge
                  variant={statusConfig.variant}
                  className="whitespace-nowrap cursor-pointer"
                  onClick={() => rule.status === 'enabled' ? onDisable(rule) : onEnable(rule)}
                >
                  {statusConfig.label}
                </AdminBadge>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {rule.status === 'enabled' ? '点击禁用' : '点击启用'}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'actions',
      header: '操作',
      size: 140,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      enableSorting: false,
      cell: ({ row }) => {
        const rule = row.original;
        const isProbing = probingRuleId === rule.id;
        const canProbe = rule.status === 'enabled' && !isProbing;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewDetail(rule)}
                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <Eye className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>查看详情</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onEdit(rule)}
                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <Edit className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>编辑</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => canProbe && onProbe(rule)}
                  disabled={!canProbe}
                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProbing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Activity className="size-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isProbing ? '拨测中...' : rule.status !== 'enabled' ? '仅启用状态可拨测' : '拨测'}
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onResetTraffic(rule)}>
                  <RotateCcw className="mr-2 size-4" />
                  重置流量
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {rule.status === 'enabled' ? (
                  <DropdownMenuItem onClick={() => onDisable(rule)}>
                    <PowerOff className="mr-2 size-4" />
                    禁用
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onEnable(rule)}>
                    <Power className="mr-2 size-4" />
                    启用
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(rule)} className="text-red-600 dark:text-red-400">
                  <Trash2 className="mr-2 size-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [agentsMap, nodes, onDisable, onEnable, onResetTraffic, onViewDetail, onEdit, onDelete, onProbe, probingRuleId]);

  return (
    <DataTable
      columns={columns}
      data={rules}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage="暂无转发规则数据"
      getRowId={(row) => String(row.id)}
    />
  );
};
