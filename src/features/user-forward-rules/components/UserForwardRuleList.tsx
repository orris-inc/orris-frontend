/**
 * User Forward Rule List Table Component
 * Implemented using TanStack Table with responsive column hiding support
 */

import { useMemo, useCallback, useState } from 'react';
import { Edit, Trash2, Power, PowerOff, MoreHorizontal, Copy, Check, Bot, Server, Settings, ArrowRight } from 'lucide-react';
import { DataTable, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { Badge } from '@/components/common/Badge';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { ForwardRule, UserForwardAgent } from '@/api/forward';

interface UserForwardRuleListProps {
  rules: ForwardRule[];
  agentsMap?: Record<string, UserForwardAgent>;
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  onToggleStatus: (rule: ForwardRule) => void;
  onEnabling?: boolean;
  onDisabling?: boolean;
  onDeleting?: boolean;
}

// Format bytes (default display in GB)
const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
};

// Copyable address component
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
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className={`flex items-center gap-1 min-w-0 ${className}`}>
      <span className="font-mono text-xs truncate">{address}</span>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
        title={copied ? '已复制' : '复制'}
      >
        {copied ? (
          <Check className="size-3 text-green-500" />
        ) : (
          <Copy className="size-3 text-muted-foreground hover:text-foreground" />
        )}
      </button>
    </div>
  );
};

// Chain nodes display component
const ChainNodesDisplay: React.FC<{
  chainAgentIds: string[];
  agentsMap: Record<string, UserForwardAgent>;
  targetDisplay: { name: string; address: string } | null;
}> = ({ chainAgentIds, agentsMap, targetDisplay }) => {
  const chainCount = chainAgentIds.length;

  // Get agent name
  const getAgentName = (id: string) => {
    const agent = agentsMap[id];
    return agent?.name || `ID: ${id.slice(0, 8)}...`;
  };

  // First two node names
  const firstTwoNames = chainAgentIds
    .slice(0, 2)
    .map(getAgentName)
    .join(' → ');

  // If node count <= 2, display directly without Popover
  if (chainCount <= 2) {
    return (
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Bot className="size-3.5 text-purple-500 flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>经由转发 Agent</TooltipContent>
          </Tooltip>
          <span className="truncate">{firstTwoNames}</span>
        </div>
        <CopyableAddress address={targetDisplay?.address || '-'} className="text-muted-foreground pl-5" />
      </div>
    );
  }

  // Node count > 2, show Popover
  return (
    <div className="space-y-0.5 min-w-0">
      <div className="flex items-center gap-1.5 text-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Bot className="size-3.5 text-purple-500 flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent>经由转发 Agent</TooltipContent>
        </Tooltip>
        <span className="truncate">{firstTwoNames} ...</span>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
              +{chainCount - 2}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">链路节点详情</h4>
                <Badge variant="outline" className="text-xs">
                  {chainCount} 个节点
                </Badge>
              </div>
              <div className="space-y-2">
                {chainAgentIds.map((id, index) => {
                  const agent = agentsMap[id];
                  const agentName = agent?.name || `ID: ${id.slice(0, 8)}...`;
                  const isLast = index === chainAgentIds.length - 1;
                  return (
                    <div key={id} className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-medium text-purple-700 dark:text-purple-300">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{agentName}</div>
                        {agent?.publicAddress && (
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {agent.publicAddress}
                          </div>
                        )}
                      </div>
                      {!isLast && (
                        <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
                {targetDisplay && (
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Server className="size-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{targetDisplay.name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {targetDisplay.address}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <CopyableAddress address={targetDisplay?.address || '-'} className="text-muted-foreground pl-5" />
    </div>
  );
};

export const UserForwardRuleList: React.FC<UserForwardRuleListProps> = ({
  rules,
  agentsMap = {},
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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    rule: ForwardRule | null;
  }>({ open: false, rule: null });

  const handleDeleteClick = useCallback((rule: ForwardRule) => {
    setDeleteConfirm({ open: true, rule });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm.rule) {
      onDelete(deleteConfirm.rule);
      setDeleteConfirm({ open: false, rule: null });
    }
  }, [deleteConfirm.rule, onDelete]);

  // Context menu content
  const renderContextMenuActions = useCallback((rule: ForwardRule) => (
    <>
      <ContextMenuItem onClick={() => onEdit(rule)}>
        <Edit className="mr-2 size-4" />
        编辑
      </ContextMenuItem>
      <ContextMenuSeparator />
      {rule.status === 'enabled' ? (
        <ContextMenuItem onClick={() => onToggleStatus(rule)}>
          <PowerOff className="mr-2 size-4" />
          禁用规则
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => onToggleStatus(rule)}>
          <Power className="mr-2 size-4" />
          启用规则
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => handleDeleteClick(rule)} className="text-destructive focus:text-destructive">
        <Trash2 className="mr-2 size-4" />
        删除规则
      </ContextMenuItem>
    </>
  ), [onEdit, onToggleStatus, handleDeleteClick]);

  // Dropdown menu content
  const renderDropdownMenuActions = useCallback((rule: ForwardRule) => (
    <>
      {rule.status === 'enabled' ? (
        <DropdownMenuItem onClick={() => onToggleStatus(rule)}>
          <PowerOff className="mr-2 size-4" />
          禁用规则
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={() => onToggleStatus(rule)}>
          <Power className="mr-2 size-4" />
          启用规则
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => handleDeleteClick(rule)} className="text-destructive focus:text-destructive">
        <Trash2 className="mr-2 size-4" />
        删除规则
      </DropdownMenuItem>
    </>
  ), [onToggleStatus, handleDeleteClick]);

  const columns = useMemo<ColumnDef<ForwardRule, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: '规则名',
      size: 150,
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
      id: 'entry',
      header: '入口',
      size: 220,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const rule = row.original;
        const agent = agentsMap[rule.agentId];
        const agentName = agent?.name || `ID: ${rule.agentId.slice(0, 8)}...`;
        const entryAddress = agent?.publicAddress ? `${agent.publicAddress}:${rule.listenPort}` : '-';
        return (
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Bot className="size-3.5 text-green-500 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>入口 Agent</TooltipContent>
              </Tooltip>
              <span className="truncate">{agentName}</span>
            </div>
            <CopyableAddress address={entryAddress} className="text-blue-600 dark:text-blue-400 pl-5" />
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

        // Helper function to get target address
        const getTargetDisplay = () => {
          if (rule.targetAddress) {
            return {
              name: '目标地址',
              address: `${rule.targetAddress}:${rule.targetPort}`,
              type: 'manual' as const,
            };
          }
          return null;
        };

        // Exit type icon component
        const ExitTypeIcon: React.FC<{ type: 'agent' | 'manual'; className?: string }> = ({ type, className = '' }) => {
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
            case 'manual':
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Settings {...iconProps} />
                  </TooltipTrigger>
                  <TooltipContent>目标地址</TooltipContent>
                </Tooltip>
              );
          }
        };

        // entry type: show exit agent -> target
        if (rule.ruleType === 'entry' && rule.exitAgentId) {
          const exitAgent = agentsMap[rule.exitAgentId];
          const exitName = exitAgent?.name || `ID: ${rule.exitAgentId.slice(0, 8)}...`;
          const target = getTargetDisplay();
          const targetAddress = target?.address || '-';
          return (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-sm">
                <ExitTypeIcon type="agent" className="text-purple-500 flex-shrink-0" />
                <span className="truncate">{exitName}</span>
              </div>
              <CopyableAddress address={targetAddress} className="text-muted-foreground pl-5" />
            </div>
          );
        }

        // chain and direct_chain types: show chain nodes info -> target
        if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds && rule.chainAgentIds.length > 0) {
          const target = getTargetDisplay();
          return (
            <ChainNodesDisplay
              chainAgentIds={rule.chainAgentIds}
              agentsMap={agentsMap}
              targetDisplay={target}
            />
          );
        }

        // direct type: show target
        const target = getTargetDisplay();
        if (target) {
          return (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ExitTypeIcon type="manual" className="text-muted-foreground flex-shrink-0" />
                <span className="truncate">{target.name}</span>
              </div>
              <CopyableAddress address={target.address} className="text-muted-foreground pl-5" />
            </div>
          );
        }

        return <span className="text-muted-foreground">-</span>;
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
              <span className="text-sm text-muted-foreground">
                {formatBytes(totalBytes)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div>上传: {formatBytes(row.original.uploadBytes)}</div>
                <div>下载: {formatBytes(row.original.downloadBytes)}</div>
              </div>
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
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Badge
                  variant={rule.status === 'enabled' ? 'default' : 'secondary'}
                  className="text-xs cursor-pointer"
                  onClick={() => onToggleStatus(rule)}
                >
                  {rule.status === 'enabled' ? '已启用' : '已禁用'}
                </Badge>
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
              <TooltipContent>编辑</TooltipContent>
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
  ], [agentsMap, onEdit, onToggleStatus, renderDropdownMenuActions]);

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
        emptyMessage="暂无转发规则"
        getRowId={(row) => String(row.id)}
        enableContextMenu={true}
        contextMenuContent={renderContextMenuActions}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, rule: null })}
        title="确认删除"
        description={`确认删除转发规则「${deleteConfirm.rule?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
