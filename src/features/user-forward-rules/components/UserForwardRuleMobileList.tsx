/**
 * User Forward Rule Mobile List Component
 * Mobile-friendly card list with iOS 26 Liquid Glass style
 * Features: expandable cards, touch-optimized interactions, glass effects, selection mode
 */

import { useCallback, useRef, useState } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { Badge } from '@/components/common/Badge';
import { Checkbox } from '@/components/common/Checkbox';
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
import { cn } from '@/lib/utils';
import { CopyableAddress } from '@/components/common/CopyableAddress';
import { formatBytesGB } from '@/shared/utils/format-utils';
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
  // Selection mode props
  isSelectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onEnterSelectMode?: () => void;
  onExitSelectMode?: () => void;
}

// Long press duration in milliseconds
const LONG_PRESS_DURATION = 500;

// Status configuration
const STATUS_CONFIG: Record<string, { labelKey: string; variant: 'default' | 'secondary' }> = {
  enabled: { labelKey: 'common.status.enabled', variant: 'default' },
  disabled: { labelKey: 'common.status.disabled', variant: 'secondary' },
};

// Rule type configuration
const RULE_TYPE_CONFIG: Record<string, { labelKey: string; shortLabelKey: string; color: string; bgColor: string }> = {
  direct: {
    labelKey: 'admin.forwardRules.ruleType.direct',
    shortLabelKey: 'admin.forwardRules.ruleType.directShort',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  entry: {
    labelKey: 'admin.forwardRules.ruleType.entry',
    shortLabelKey: 'admin.forwardRules.ruleType.entryShort',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  chain: {
    labelKey: 'admin.forwardRules.ruleType.chain',
    shortLabelKey: 'admin.forwardRules.ruleType.chainShort',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  direct_chain: {
    labelKey: 'admin.forwardRules.ruleType.directChain',
    shortLabelKey: 'admin.forwardRules.ruleType.directChainShort',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
};

// Mobile flow node configuration (without labels)
const FLOW_NODE_CONFIG = {
  entry: {
    icon: Bot,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    labelKey: 'admin.forwardRules.flowNode.entry',
  },
  relay: {
    icon: Bot,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    labelKey: 'admin.forwardRules.flowNode.relay',
  },
  exit: {
    icon: Bot,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    labelKey: 'admin.forwardRules.flowNode.exit',
  },
  target: {
    icon: Server,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    labelKey: 'admin.forwardRules.flowNode.target',
  },
} as const;

// Mobile flow node component
const MobileFlowNode: React.FC<{
  type: 'entry' | 'relay' | 'exit' | 'target';
  name: string;
  address?: string;
}> = ({ type, name, address }) => {
  const { t } = useTranslation();
  const config = FLOW_NODE_CONFIG[type];
  const label = t(config.labelKey);

  const IconComponent = config.icon;

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-lg ${config.bgColor} border ${config.borderColor} touch-manipulation`}
      title={address ? `${label}: ${name}\n${address}` : `${label}: ${name}`}
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
  const { t } = useTranslation();
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
            +{chainCount - 1} {t('admin.forwardRules.flowNode.relay')}
            <ChevronDown className="size-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
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
      <div key={i} className="glass rounded-2xl p-4 space-y-3 animate-pulse motion-reduce:animate-none">
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
  // Selection mode props
  isSelectMode = false,
  selectedIds,
  onToggleSelect,
  onEnterSelectMode,
  // onExitSelectMode is passed through for parent component to handle exit action
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onExitSelectMode: _onExitSelectMode,
}) => {
  const { t } = useTranslation();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    rule: ForwardRule | null;
  }>({ open: false, rule: null });

  // Long press timer ref
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Handle long press to enter selection mode
  const handleLongPress = useCallback((ruleId: string) => {
    if (!isSelectMode) {
      onEnterSelectMode?.();
      // Delay selection to ensure selection mode is activated
      setTimeout(() => onToggleSelect?.(ruleId), 0);
    }
  }, [isSelectMode, onEnterSelectMode, onToggleSelect]);

  // Touch/pointer event handlers for long press
  const handleTouchStart = useCallback((ruleId: string) => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      handleLongPress(ruleId);
    }, LONG_PRESS_DURATION);
  }, [handleLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle card click in selection mode
  const handleCardClick = useCallback((ruleId: string, e: React.MouseEvent) => {
    if (isSelectMode) {
      e.preventDefault();
      e.stopPropagation();
      // Don't toggle if long press was just triggered
      if (!longPressTriggeredRef.current) {
        onToggleSelect?.(ruleId);
      }
    }
  }, [isSelectMode, onToggleSelect]);

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
          {t('userForwardRules.menu.edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {rule.status === 'enabled' ? (
          <DropdownMenuItem onClick={() => onToggleStatus(rule)} className="min-h-[44px]">
            <PowerOff className="mr-2 size-4" />
            {t('userForwardRules.menu.disableRule')}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onToggleStatus(rule)} className="min-h-[44px]">
            <Power className="mr-2 size-4" />
            {t('userForwardRules.menu.enableRule')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => handleDeleteClick(rule)}
          className="text-destructive focus:text-destructive min-h-[44px]"
        >
          <Trash2 className="mr-2 size-4" />
          {t('userForwardRules.menu.deleteRule')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ), [onEdit, onToggleStatus, handleDeleteClick, t]);

  if (isLoading) {
    return <MobileCardSkeleton />;
  }

  if (rules.length === 0) {
    return (
      <div className="glass rounded-2xl py-16 px-4 text-center">
        <p className="text-muted-foreground">{t('userForwardRules.empty')}</p>
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
    const statusConfig = STATUS_CONFIG[rule.status] || { labelKey: rule.status, variant: 'secondary' as const };
    const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || RULE_TYPE_CONFIG.direct;
    const totalBytes = (rule.uploadBytes || 0) + (rule.downloadBytes || 0);
    const isSelected = selectedIds?.has(rule.id) ?? false;

    // Get target display
    const getTargetDisplay = () => {
      if (rule.targetAddress) {
        return {
          name: t('userForwardRules.tooltip.targetAddress'),
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
        className={cn(
          'glass rounded-2xl overflow-hidden border-0 mb-2 transition-all duration-200',
          isSelectMode && isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        {/* Card Header - Always visible */}
        <div
          className="p-3"
          onTouchStart={() => handleTouchStart(rule.id)}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onMouseDown={() => handleTouchStart(rule.id)}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onClick={(e) => handleCardClick(rule.id, e)}
        >
          <div className="flex items-start justify-between gap-2">
            {/* Selection Checkbox */}
            {isSelectMode && (
              <div className="flex items-center justify-center pr-2 min-w-[44px] min-h-[44px]">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect?.(rule.id)}
                  className="rounded-full size-5 border-2"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Rule name with type badge and status - single line */}
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded ${ruleTypeConfig.bgColor} ${ruleTypeConfig.color}`}>
                      {t(ruleTypeConfig.shortLabelKey)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t(ruleTypeConfig.labelKey)}{t('admin.forwardRules.mode')}</TooltipContent>
                </Tooltip>
                <span className="font-medium text-sm text-foreground truncate flex-1">
                  {rule.name}
                </span>
                {!isSelectMode && (
                  <Badge
                    variant={statusConfig.variant}
                    className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0 cursor-pointer"
                    onClick={() => onToggleStatus(rule)}
                  >
                    {t(statusConfig.labelKey)}
                  </Badge>
                )}
              </div>

              {/* Entry agent + address - compact inline */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="size-3.5 text-green-500 flex-shrink-0" />
                <span className="truncate max-w-[80px]">{agentName}</span>
                <span className="text-border">|</span>
                {!isSelectMode && (
                  <CopyableAddress address={entryAddress} className="text-primary" />
                )}
                {isSelectMode && (
                  <span className="font-mono text-xs truncate text-primary">{entryAddress}</span>
                )}
              </div>
            </div>

            {/* Quick Actions - compact (hidden in selection mode) */}
            {!isSelectMode && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => onEdit(rule)}
                  className="glass-interactive rounded-full p-2 min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation"
                  title={t('common.actions.edit')}
                >
                  <Edit className="size-4 text-muted-foreground" />
                </button>
                {renderDropdownMenu(rule)}
              </div>
            )}
          </div>
        </div>

        {/* Accordion Trigger - more compact (hidden in selection mode) */}
        {!isSelectMode && (
          <AccordionTrigger className="px-3 py-1.5 border-t border-border/50 hover:no-underline hover:bg-muted/30 transition-colors">
            <span className="text-xs text-muted-foreground">{t('common.actions.view')}</span>
          </AccordionTrigger>
        )}

        {/* Accordion Content - Expanded details (hidden in selection mode) */}
        {!isSelectMode && (
          <AccordionContent>
            <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 pt-2.5">
              {/* Exit/Target info */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{t('userForwardRules.exitChain')}</span>
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
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{t('userForwardRules.columns.usedTraffic')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold font-mono text-foreground">
                    {formatBytesGB(totalBytes)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-chart-upload" />
                        <span>{formatBytesGB(rule.uploadBytes)}</span>
                        <span>/</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-chart-download" />
                        <span>{formatBytesGB(rule.downloadBytes)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-0.5 text-xs">
                        <div>{t('userForwardRules.traffic.upload')} {formatBytesGB(rule.uploadBytes)}</div>
                        <div>{t('userForwardRules.traffic.download')} {formatBytesGB(rule.downloadBytes)}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Remark - compact */}
              {rule.remark && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{t('userForwardRules.remark')}</span> {rule.remark}
                </div>
              )}
            </div>
          </AccordionContent>
        )}
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
            {t('userForwardRules.loadMore')} ({page * pageSize} / {total})
          </button>
        </div>
      )}

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
