/**
 * Subscription Forward Rule List Table Component
 * Implemented using TanStack Table with responsive column hiding support
 */

import { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  Bot,
  Server,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { DataTable, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { Badge } from '@/components/common/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { ContextMenuItem, ContextMenuSeparator } from '@/components/common/ContextMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CopyableAddress } from '@/components/common/CopyableAddress';
import { formatBytesGB } from '@/shared/utils/format-utils';
import type { ForwardRule, UserForwardAgent } from '@/api/forward';

interface SubscriptionForwardRuleListProps {
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

// Chain nodes display component
const ChainNodesDisplay: React.FC<{
  chainAgentIds: string[];
  agentsMap: Record<string, UserForwardAgent>;
  targetDisplay: { name: string; address: string } | null;
  t: (key: string, options?: Record<string, unknown>) => string;
}> = ({ chainAgentIds, agentsMap, targetDisplay, t }) => {
  const chainCount = chainAgentIds.length;

  // Get agent name
  const getAgentName = (id: string) => {
    const agent = agentsMap[id];
    return agent?.name || `ID: ${id.slice(0, 8)}...`;
  };

  // First two node names
  const firstTwoNames = chainAgentIds.slice(0, 2).map(getAgentName).join(' → ');

  // If node count <= 2, display directly without Popover
  if (chainCount <= 2) {
    return (
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Bot className="size-3.5 text-purple-500 flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>{t('userForwardRules.tooltip.viaForwardAgent')}</TooltipContent>
          </Tooltip>
          <span className="truncate">{firstTwoNames}</span>
        </div>
        <CopyableAddress
          address={targetDisplay?.address || '-'}
          className="text-muted-foreground pl-5"
        />
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
          <TooltipContent>{t('userForwardRules.tooltip.viaForwardAgent')}</TooltipContent>
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
                <h4 className="text-sm font-semibold">{t('userForwardRules.popover.chainNodeDetails')}</h4>
                <Badge variant="outline" className="text-xs">
                  {t('userForwardRules.popover.nodesCount', { count: chainCount })}
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
                      {!isLast && <ArrowRight className="size-4 text-muted-foreground flex-shrink-0" />}
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
      <CopyableAddress
        address={targetDisplay?.address || '-'}
        className="text-muted-foreground pl-5"
      />
    </div>
  );
};

export const SubscriptionForwardRuleList: React.FC<SubscriptionForwardRuleListProps> = ({
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
  const { t } = useTranslation();
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
  const renderContextMenuActions = useCallback(
    (rule: ForwardRule) => (
      <>
        <ContextMenuItem onClick={() => onEdit(rule)}>
          <Edit className="mr-2 size-4" />
          {t('common.actions.edit')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        {rule.status === 'enabled' ? (
          <ContextMenuItem onClick={() => onToggleStatus(rule)}>
            <PowerOff className="mr-2 size-4" />
            {t('userForwardRules.menu.disableRule')}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={() => onToggleStatus(rule)}>
            <Power className="mr-2 size-4" />
            {t('userForwardRules.menu.enableRule')}
          </ContextMenuItem>
        )}
        <ContextMenuItem
          onClick={() => handleDeleteClick(rule)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          {t('userForwardRules.menu.deleteRule')}
        </ContextMenuItem>
      </>
    ),
    [onEdit, onToggleStatus, handleDeleteClick, t]
  );

  // Dropdown menu content
  const renderDropdownMenuActions = useCallback(
    (rule: ForwardRule) => (
      <>
        {rule.status === 'enabled' ? (
          <DropdownMenuItem onSelect={() => onToggleStatus(rule)}>
            <PowerOff className="mr-2 size-4" />
            {t('userForwardRules.menu.disableRule')}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onToggleStatus(rule)}>
            <Power className="mr-2 size-4" />
            {t('userForwardRules.menu.enableRule')}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleDeleteClick(rule)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          {t('userForwardRules.menu.deleteRule')}
        </DropdownMenuItem>
      </>
    ),
    [onToggleStatus, handleDeleteClick, t]
  );

  const columns = useMemo<ColumnDef<ForwardRule, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('userForwardRules.columns.ruleName'),
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
        header: t('userForwardRules.columns.entry'),
        size: 220,
        meta: { priority: 1 } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const rule = row.original;
          const agent = agentsMap[rule.agentId];
          const agentName = agent?.name || `ID: ${rule.agentId.slice(0, 8)}...`;
          const entryAddress = agent?.publicAddress
            ? `${agent.publicAddress}:${rule.listenPort}`
            : '-';
          return (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Bot className="size-3.5 text-green-500 flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{t('userForwardRules.tooltip.entryAgent')}</TooltipContent>
                </Tooltip>
                <span className="truncate">{agentName}</span>
              </div>
              <CopyableAddress
                address={entryAddress}
                className="text-blue-600 dark:text-blue-400 pl-5"
              />
            </div>
          );
        },
      },
      {
        id: 'exit',
        header: t('userForwardRules.columns.exit'),
        size: 240,
        meta: { priority: 1 } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const rule = row.original;

          // Helper function to get target address
          const getTargetDisplay = () => {
            if (rule.targetAddress) {
              return {
                name: t('userForwardRules.tooltip.targetAddress'),
                address: `${rule.targetAddress}:${rule.targetPort}`,
                type: 'manual' as const,
              };
            }
            return null;
          };

          // Exit type icon component
          const ExitTypeIcon: React.FC<{ type: 'agent' | 'manual'; className?: string }> = ({
            type,
            className = '',
          }) => {
            const iconProps = { className: `size-3.5 ${className}` };
            switch (type) {
              case 'agent':
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Bot {...iconProps} />
                    </TooltipTrigger>
                    <TooltipContent>{t('userForwardRules.tooltip.viaForwardAgent')}</TooltipContent>
                  </Tooltip>
                );
              case 'manual':
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Settings {...iconProps} />
                    </TooltipTrigger>
                    <TooltipContent>{t('userForwardRules.tooltip.targetAddress')}</TooltipContent>
                  </Tooltip>
                );
            }
          };

          // entry type: show exit agent(s) -> target
          if (rule.ruleType === 'entry') {
            // Multi-exit mode (load balancing)
            if (rule.exitAgents && rule.exitAgents.length > 0) {
              const target = getTargetDisplay();
              const targetAddress = target?.address || '-';
              // Display first exit agent name + count badge
              const firstExitAgent = agentsMap[rule.exitAgents[0].agentId];
              const firstExitName = firstExitAgent?.name || `ID: ${rule.exitAgents[0].agentId.slice(0, 8)}...`;
              const exitCount = rule.exitAgents.length;
              return (
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm">
                    <ExitTypeIcon type="agent" className="text-purple-500 flex-shrink-0" />
                    <span className="truncate">{firstExitName}</span>
                    {exitCount > 1 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                            +{exitCount - 1}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="start">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">{t('admin.forwardRules.exitAgents.loadBalancing')}</h4>
                            <div className="space-y-1">
                              {rule.exitAgents.map((ea, index) => {
                                const agent = agentsMap[ea.agentId];
                                const agentName = agent?.name || `ID: ${ea.agentId.slice(0, 8)}...`;
                                return (
                                  <div key={ea.agentId} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-muted-foreground">{index + 1}.</span>
                                      <span className="truncate">{agentName}</span>
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {ea.weight}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <CopyableAddress address={targetAddress} className="text-muted-foreground pl-5" />
                </div>
              );
            }
            // Single exit mode
            if (rule.exitAgentId) {
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
          }

          // chain and direct_chain types: show chain nodes info -> target
          if (
            (rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') &&
            rule.chainAgentIds &&
            rule.chainAgentIds.length > 0
          ) {
            const target = getTargetDisplay();
            return (
              <ChainNodesDisplay
                chainAgentIds={rule.chainAgentIds}
                agentsMap={agentsMap}
                targetDisplay={target}
                t={t}
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
        header: t('userForwardRules.columns.usedTraffic'),
        size: 100,
        meta: { priority: 1 } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const totalBytes = (row.original.uploadBytes || 0) + (row.original.downloadBytes || 0);
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground">{formatBytesGB(totalBytes)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <div>{t('userForwardRules.traffic.upload')} {formatBytesGB(row.original.uploadBytes)}</div>
                  <div>{t('userForwardRules.traffic.download')} {formatBytesGB(row.original.downloadBytes)}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('common.status.label'),
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
                    {rule.status === 'enabled' ? t('common.status.enabled') : t('common.status.disabled')}
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent>{rule.status === 'enabled' ? t('userForwardRules.status.clickToDisable') : t('userForwardRules.status.clickToEnable')}</TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: 'actions',
        header: t('common.table.actions'),
        size: 100,
        meta: { priority: 1, sticky: 'right' } as ResponsiveColumnMeta,
        enableSorting: false,
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onEdit(rule)}
                    className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 active:scale-[0.98]"
                  >
                    <Edit className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('common.actions.edit')}</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 active:scale-[0.98]">
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent align="end" collisionPadding={16}>
                    {renderDropdownMenuActions(rule)}
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [agentsMap, onEdit, onToggleStatus, renderDropdownMenuActions, t]
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
        emptyMessage={t('userForwardRules.empty')}
        getRowId={(row) => String(row.id)}
        enableContextMenu={true}
        contextMenuContent={renderContextMenuActions}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, rule: null })}
        title={t('userForwardRules.confirmDelete.title')}
        description={t('userForwardRules.confirmDelete.description', { name: deleteConfirm.rule?.name })}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
