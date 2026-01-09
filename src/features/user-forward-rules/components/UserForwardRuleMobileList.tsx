/**
 * User Forward Rule Mobile List Component
 * Mobile-friendly card list with iOS 26 Liquid Glass style
 * Features: expandable cards, touch-optimized interactions, glass effects
 */

import { useState, useCallback } from 'react';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  Copy,
  Check,
  Bot,
  Server,
  Settings,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { Badge } from '@/components/common/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/Popover';
import { Skeleton } from '@/components/common/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { ForwardRule, UserForwardAgent } from '@/api/forward';

interface UserForwardRuleMobileListProps {
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

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' }> = {
  enabled: { label: '已启用', variant: 'default' },
  disabled: { label: '已禁用', variant: 'secondary' },
};

// Rule type configuration
const RULE_TYPE_CONFIG: Record<string, { label: string; shortLabel: string; color: string; bgColor: string }> = {
  direct: {
    label: '直连',
    shortLabel: '直',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  entry: {
    label: '入口',
    shortLabel: '入',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  chain: {
    label: '链式',
    shortLabel: '链',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  direct_chain: {
    label: '直连链',
    shortLabel: '直链',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
};

// Format bytes (default display in GB)
const formatBytes = (bytes?: number): string => {
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
        className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors touch-manipulation min-h-[28px] min-w-[28px] flex items-center justify-center"
        title={copied ? '已复制' : '复制'}
      >
        {copied ? (
          <Check className="size-3.5 text-success" />
        ) : (
          <Copy className="size-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
};

// Mobile flow node component
const MobileFlowNode: React.FC<{
  type: 'entry' | 'relay' | 'exit' | 'target';
  name: string;
  address?: string;
}> = ({ type, name, address }) => {
  const config = {
    entry: {
      icon: Bot,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-800',
      label: '入口',
    },
    relay: {
      icon: Bot,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      borderColor: 'border-purple-200 dark:border-purple-800',
      label: '中转',
    },
    exit: {
      icon: Bot,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      borderColor: 'border-orange-200 dark:border-orange-800',
      label: '出口',
    },
    target: {
      icon: Server,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      label: '目标',
    },
  }[type];

  const IconComponent = config.icon;

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-lg ${config.bgColor} border ${config.borderColor} touch-manipulation`}
      title={address ? `${config.label}: ${name}\n${address}` : `${config.label}: ${name}`}
    >
      <IconComponent className={`size-3 flex-shrink-0 ${config.color}`} />
      <span className="text-xs font-medium text-foreground truncate max-w-[60px]">{name}</span>
    </div>
  );
};

// Chain nodes display component for mobile
const ChainNodesDisplayMobile: React.FC<{
  chainAgentIds: string[];
  agentsMap: Record<string, UserForwardAgent>;
  targetDisplay: { name: string; address: string } | null;
}> = ({ chainAgentIds, agentsMap, targetDisplay }) => {
  const chainCount = chainAgentIds.length;

  const getAgentName = (id: string) => {
    const agent = agentsMap[id];
    return agent?.name || `ID: ${id.slice(0, 8)}...`;
  };

  if (chainCount <= 2) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {chainAgentIds.map((id, index) => (
          <div key={id} className="flex items-center gap-1.5">
            <MobileFlowNode type="relay" name={getAgentName(id)} />
            {index < chainAgentIds.length - 1 && (
              <ArrowRight className="size-3 text-purple-400 flex-shrink-0" />
            )}
          </div>
        ))}
        {targetDisplay && (
          <>
            <ArrowRight className="size-3 text-blue-400 flex-shrink-0" />
            <MobileFlowNode type="target" name={targetDisplay.name} address={targetDisplay.address} />
          </>
        )}
      </div>
    );
  }

  // More than 2 nodes - show popover
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <MobileFlowNode type="relay" name={getAgentName(chainAgentIds[0])} />
      <ArrowRight className="size-3 text-purple-400 flex-shrink-0" />
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 touch-manipulation min-h-[28px]">
            +{chainCount - 1} 节点
            <ChevronDown className="size-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
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
      {targetDisplay && (
        <>
          <ArrowRight className="size-3 text-blue-400 flex-shrink-0" />
          <MobileFlowNode type="target" name={targetDisplay.name} address={targetDisplay.address} />
        </>
      )}
    </div>
  );
};

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="glass rounded-2xl p-4 space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
    ))}
  </div>
);

export const UserForwardRuleMobileList: React.FC<UserForwardRuleMobileListProps> = ({
  rules,
  agentsMap = {},
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  // onPageSizeChange is not used in mobile view (uses infinite scroll pattern)
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

  // Get entry address for a rule
  const getEntryAddress = useCallback((rule: ForwardRule) => {
    const agent = agentsMap[rule.agentId];
    return agent?.publicAddress ? `${agent.publicAddress}:${rule.listenPort}` : '-';
  }, [agentsMap]);

  // Render dropdown menu
  const renderDropdownMenu = useCallback((rule: ForwardRule) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="glass-interactive rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(rule)} className="min-h-[44px]">
          <Edit className="mr-2 size-4" />
          编辑规则
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {rule.status === 'enabled' ? (
          <DropdownMenuItem onClick={() => onToggleStatus(rule)} className="min-h-[44px]">
            <PowerOff className="mr-2 size-4" />
            禁用规则
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onToggleStatus(rule)} className="min-h-[44px]">
            <Power className="mr-2 size-4" />
            启用规则
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => handleDeleteClick(rule)}
          className="text-destructive focus:text-destructive min-h-[44px]"
        >
          <Trash2 className="mr-2 size-4" />
          删除规则
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ), [onEdit, onToggleStatus, handleDeleteClick]);

  if (isLoading) {
    return <MobileCardSkeleton />;
  }

  if (rules.length === 0) {
    return (
      <div className="glass rounded-2xl py-16 px-4 text-center">
        <p className="text-muted-foreground">暂无转发规则</p>
      </div>
    );
  }

  // Calculate pagination info
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = page < totalPages;

  // Render a single rule card
  const renderRuleCard = (rule: ForwardRule) => {
    const agent = agentsMap[rule.agentId];
    const agentName = agent?.name || `ID: ${rule.agentId.slice(0, 8)}...`;
    const entryAddress = getEntryAddress(rule);
    const statusConfig = STATUS_CONFIG[rule.status] || { label: rule.status, variant: 'secondary' as const };
    const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || RULE_TYPE_CONFIG.direct;
    const totalBytes = (rule.uploadBytes || 0) + (rule.downloadBytes || 0);

    // Get target display
    const getTargetDisplay = () => {
      if (rule.targetAddress) {
        return {
          name: '目标地址',
          address: `${rule.targetAddress}:${rule.targetPort}`,
        };
      }
      return null;
    };

    const target = getTargetDisplay();

    return (
      <AccordionItem
        key={rule.id}
        value={rule.id}
        className="glass rounded-2xl overflow-hidden border-0 mb-2"
      >
        {/* Card Header - Always visible */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Rule name with type badge and status - single line */}
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded ${ruleTypeConfig.bgColor} ${ruleTypeConfig.color}`}>
                      {ruleTypeConfig.shortLabel}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{ruleTypeConfig.label}模式</TooltipContent>
                </Tooltip>
                <span className="font-medium text-sm text-foreground truncate flex-1">
                  {rule.name}
                </span>
                <Badge
                  variant={statusConfig.variant}
                  className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0 cursor-pointer"
                  onClick={() => onToggleStatus(rule)}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Entry agent + address - compact inline */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="size-3.5 text-green-500 flex-shrink-0" />
                <span className="truncate max-w-[80px]">{agentName}</span>
                <span className="text-border">|</span>
                <CopyableAddress address={entryAddress} className="text-primary" />
              </div>
            </div>

            {/* Quick Actions - compact */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => onEdit(rule)}
                className="glass-interactive rounded-full p-2 min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation"
                title="编辑"
              >
                <Edit className="size-4 text-muted-foreground" />
              </button>
              {renderDropdownMenu(rule)}
            </div>
          </div>
        </div>

        {/* Accordion Trigger - more compact */}
        <AccordionTrigger className="px-3 py-1.5 border-t border-border/50 hover:no-underline hover:bg-muted/30 transition-colors">
          <span className="text-xs text-muted-foreground">详情</span>
        </AccordionTrigger>

        {/* Accordion Content - Expanded details */}
        <AccordionContent>
          <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 pt-2.5">
            {/* Exit/Target info */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">出口链路</span>
              <div className="flex-1 min-w-0">
                {/* entry type: show exit agent -> target */}
                {rule.ruleType === 'entry' && rule.exitAgentId && (() => {
                  const exitAgent = agentsMap[rule.exitAgentId];
                  const exitName = exitAgent?.name || `ID: ${rule.exitAgentId.slice(0, 8)}...`;
                  return (
                    <div className="flex items-center gap-1 flex-wrap">
                      <MobileFlowNode type="exit" name={exitName} address={exitAgent?.publicAddress} />
                      {target && (
                        <>
                          <ArrowRight className="size-3 text-blue-400 flex-shrink-0" />
                          <MobileFlowNode type="target" name={target.name} address={target.address} />
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* chain types: show chain nodes */}
                {(rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds && rule.chainAgentIds.length > 0 && (
                  <ChainNodesDisplayMobile
                    chainAgentIds={rule.chainAgentIds}
                    agentsMap={agentsMap}
                    targetDisplay={target}
                  />
                )}

                {/* direct type: show target only */}
                {rule.ruleType === 'direct' && target && (
                  <div className="flex items-center gap-1">
                    <Settings className="size-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{target.name}:</span>
                    <CopyableAddress address={target.address} />
                  </div>
                )}

                {/* No exit info */}
                {!rule.exitAgentId && !rule.chainAgentIds?.length && !target && (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            </div>

            {/* Traffic usage - compact inline */}
            <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">已用流量</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold font-mono text-foreground">
                  {formatBytes(totalBytes)}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-chart-upload" />
                      <span>{formatBytes(rule.uploadBytes)}</span>
                      <span>/</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-chart-download" />
                      <span>{formatBytes(rule.downloadBytes)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-0.5 text-xs">
                      <div>上传: {formatBytes(rule.uploadBytes)}</div>
                      <div>下载: {formatBytes(rule.downloadBytes)}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Remark - compact */}
            {rule.remark && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">备注:</span> {rule.remark}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <>
      <Accordion type="multiple" className="space-y-0">
        {rules.map((rule) => renderRuleCard(rule))}
      </Accordion>

      {/* Load more button */}
      {hasMore && (
        <div className="pt-4 pb-safe">
          <button
            onClick={() => onPageChange(page + 1)}
            className="glass-interactive w-full rounded-2xl py-4 text-sm font-medium text-foreground min-h-[44px] touch-manipulation"
          >
            加载更多 ({page * pageSize} / {total})
          </button>
        </div>
      )}

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
