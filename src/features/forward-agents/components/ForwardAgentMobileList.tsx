/**
 * Forward Agent Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 * Supports drag-and-drop reordering with long-press activation
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  Key,
  Terminal,
  Copy,
  Eye,
  Download,
  Loader2,
  ArrowUpCircle,
  Radio,
  Bell,
  BellOff,
} from 'lucide-react';
import { DraggableMobileList } from '@/components/admin/DraggableMobileList';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { SystemStatusDisplay } from '@/components/common/SystemStatusDisplay';
import { CopyableAddress } from '@/components/common/CopyableAddress';
import type { ForwardAgent } from '@/api/forward';
import type { ResourceGroup } from '@/api/resource/types';
import { formatBitRate, formatBytes } from '@/shared/utils/format-utils';

interface ForwardAgentMobileListProps {
  forwardAgents: ForwardAgent[];
  loading?: boolean;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  onEdit: (agent: ForwardAgent) => void;
  onDelete: (agent: ForwardAgent) => void;
  onEnable: (agent: ForwardAgent) => void;
  onDisable: (agent: ForwardAgent) => void;
  onRegenerateToken: (agent: ForwardAgent) => void;
  onGetInstallScript: (agent: ForwardAgent) => void;
  onViewDetail: (agent: ForwardAgent) => void;
  onCopy: (agent: ForwardAgent) => void;
  onCheckUpdate: (agent: ForwardAgent) => void;
  onBroadcastURL?: (agent: ForwardAgent) => void;
  onToggleMute?: (agent: ForwardAgent) => void;
  checkingAgentId?: string | number | null;
  // Drag and drop sorting
  enableDragSort?: boolean;
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
}

import { formatDateTime } from '@/shared/utils/date-utils';

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="ring-1 ring-border rounded-xl p-4 space-y-3">
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

export const ForwardAgentMobileList: React.FC<ForwardAgentMobileListProps> = ({
  forwardAgents,
  loading = false,
  resourceGroupsMap = {},
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onRegenerateToken,
  onGetInstallScript,
  onViewDetail,
  onCopy,
  onCheckUpdate,
  onBroadcastURL,
  onToggleMute,
  checkingAgentId,
  enableDragSort = false,
  onDragEnd,
}) => {
  const { t } = useTranslation();
  // Get agent ID for drag-and-drop
  const getAgentId = useCallback((agent: ForwardAgent) => String(agent.id), []);
  // Render dropdown menu
  const renderDropdownMenu = (agent: ForwardAgent) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-slate-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" collisionPadding={16}>
            <DropdownMenuItem onSelect={() => onViewDetail(agent)}>
              <Eye className="mr-2 size-4" />
              {t('common.actions.viewDetail')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(agent)}>
              <Edit className="mr-2 size-4" />
              {t('common.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onGetInstallScript(agent)}>
              <Terminal className="mr-2 size-4" />
              {t('admin.forwardAgents.table.menu.installScript')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCopy(agent)}>
              <Copy className="mr-2 size-4" />
              {t('admin.forwardAgents.table.menu.copyNode')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onRegenerateToken(agent)}>
              <Key className="mr-2 size-4" />
              {t('admin.forwardAgents.table.menu.regenerateToken')}
            </DropdownMenuItem>
            {agent.status === 'enabled' && (
              <DropdownMenuItem
                onClick={() => onCheckUpdate(agent)}
                disabled={checkingAgentId === agent.id}
              >
                {checkingAgentId === agent.id ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                {checkingAgentId === agent.id ? t('admin.forwardAgents.table.menu.checking') : t('admin.forwardAgents.table.menu.checkUpdate')}
              </DropdownMenuItem>
            )}
            {onBroadcastURL && (
              <DropdownMenuItem onSelect={() => onBroadcastURL(agent)}>
                <Radio className="mr-2 size-4" />
                {t('admin.forwardAgents.table.menu.broadcastURL')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {agent.status === 'enabled' ? (
              <DropdownMenuItem onSelect={() => onDisable(agent)}>
                <PowerOff className="mr-2 size-4" />
                {t('common.actions.disable')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onEnable(agent)}>
                <Power className="mr-2 size-4" />
                {t('common.actions.enable')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => onDelete(agent)} className="text-red-600 dark:text-red-400">
              <Trash2 className="mr-2 size-4" />
              {t('common.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (forwardAgents.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        {t('admin.forwardAgents.emptyState')}
      </div>
    );
  }

  // Render a single agent card
  const renderAgentCard = (agent: ForwardAgent) => {
    const firstGroupSid = agent.groupSids?.[0];
    const group = firstGroupSid ? resourceGroupsMap[firstGroupSid] : null;

    return (
      <AccordionItem
        key={agent.id}
        value={String(agent.id)}
        className="ring-1 ring-border rounded-xl bg-white dark:bg-slate-800 overflow-hidden"
      >
        {/* Card Header - Always visible */}
        <div className="px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Agent name and status */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {agent.name}
                </span>
                <AdminBadge
                  variant={agent.status === 'enabled' ? 'success' : 'default'}
                  className="text-[10px] px-1.5 py-0 flex-shrink-0"
                >
                  {agent.status === 'enabled' ? t('common.status.enabled') : t('common.status.disabled')}
                </AdminBadge>
                {/* Online status */}
                {agent.isOnline ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-medium">{t('common.status.online')}</span>
                  </span>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="text-[10px]">{t('common.status.offline')}</span>
                      </span>
                    </TooltipTrigger>
                    {agent.lastSeenAt && (
                      <TooltipContent>
                        {t('admin.forwardAgents.table.tooltip.lastOnline')}: {formatDateTime(agent.lastSeenAt)}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
                {agent.isExpired && (
                  <AdminBadge variant="danger" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                    {t('common.status.expired')}
                  </AdminBadge>
                )}
              </div>

              {/* Address info */}
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <CopyableAddress
                  address={agent.publicAddress || '-'}
                  className="text-slate-600 dark:text-slate-300"
                  maxLength={24}
                  startChars={12}
                  endChars={8}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onToggleMute?.(agent)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
                  >
                    {agent.muteNotification ? (
                      <BellOff className="size-3.5 text-slate-400" />
                    ) : (
                      <Bell className="size-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{agent.muteNotification ? t('admin.forwardAgents.table.tooltip.clickToUnmute') : t('admin.forwardAgents.table.tooltip.clickToMute')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onEdit(agent)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
                  >
                    <Edit className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('common.actions.edit')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onGetInstallScript(agent)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
                  >
                    <Terminal className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('admin.forwardAgents.table.menu.installScript')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => agent.status === 'enabled' ? onDisable(agent) : onEnable(agent)}
                    className={`p-1.5 rounded transition-colors active:scale-[0.98] ${
                      agent.status === 'enabled'
                        ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                  >
                    {agent.status === 'enabled' ? (
                      <PowerOff className="size-3.5 text-slate-400 hover:text-red-500" />
                    ) : (
                      <Power className="size-3.5 text-slate-400 hover:text-green-500" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{agent.status === 'enabled' ? t('common.actions.disable') : t('common.actions.enable')}</TooltipContent>
              </Tooltip>
              {renderDropdownMenu(agent)}
            </div>
          </div>
        </div>

        {/* Accordion Trigger */}
        <AccordionTrigger className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50">
          <span className="text-xs text-slate-400 dark:text-slate-500">{t('common.detail')}</span>
        </AccordionTrigger>

        {/* Accordion Content - Expanded details */}
        <AccordionContent>
          <div className="px-3 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2">
            {/* Monitor (System + Network) */}
            {agent.systemStatus && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">{t('admin.forwardAgents.detail.monitor')}</span>
                <div className="flex flex-col gap-1.5 flex-1">
                  {/* System bars + Network rates in one row */}
                  <div className="flex items-center gap-3">
                    <SystemStatusDisplay
                      status={{
                        cpu: agent.systemStatus.cpuPercent,
                        memory: agent.systemStatus.memoryPercent,
                        disk: agent.systemStatus.diskPercent,
                        uptime: agent.systemStatus.uptimeSeconds,
                        memoryUsed: agent.systemStatus.memoryUsed,
                        memoryTotal: agent.systemStatus.memoryTotal,
                        memoryAvail: agent.systemStatus.memoryAvail,
                        diskUsed: agent.systemStatus.diskUsed,
                        diskTotal: agent.systemStatus.diskTotal,
                        loadAvg1: agent.systemStatus.loadAvg1,
                        loadAvg5: agent.systemStatus.loadAvg5,
                        loadAvg15: agent.systemStatus.loadAvg15,
                      }}
                    />
                    {/* Network rates */}
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-600" />
                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="text-green-600 dark:text-green-400">↓{formatBitRate(agent.systemStatus.networkRxRate, true)}</span>
                      <span className="text-blue-600 dark:text-blue-400">↑{formatBitRate(agent.systemStatus.networkTxRate, true)}</span>
                    </div>
                  </div>
                  {/* Extended info row */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono">
                      {t('admin.forwardAgents.detail.cumulative')}: ↓{formatBytes(agent.systemStatus.networkRxBytes)} ↑{formatBytes(agent.systemStatus.networkTxBytes)}
                    </span>
                    <span>
                      {(agent.systemStatus.tcpConnections || 0) + (agent.systemStatus.udpConnections || 0)} {t('admin.forwardAgents.detail.connections')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tunnel address */}
            {agent.tunnelAddress && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">{t('admin.forwardAgents.detail.tunnel')}</span>
                <CopyableAddress
                  address={agent.tunnelAddress}
                  className="text-slate-600 dark:text-slate-300"
                  maxLength={24}
                  startChars={12}
                  endChars={8}
                />
              </div>
            )}

            {/* Resource group */}
            {agent.groupSids && agent.groupSids.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">{t('admin.forwardAgents.detail.resource')}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {group?.name || firstGroupSid}
                  {agent.groupSids.length > 1 && ` +${agent.groupSids.length - 1}`}
                </Badge>
              </div>
            )}

            {/* Version */}
            {(agent.agentVersion || agent.systemStatus?.agentVersion) && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">{t('admin.forwardAgents.detail.version')}</span>
                <div className="flex items-center gap-1.5">
                  {agent.hasUpdate && (
                    <ArrowUpCircle className="size-3.5 text-amber-500" />
                  )}
                  <span className={`text-xs font-mono ${agent.hasUpdate ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    v{agent.agentVersion || agent.systemStatus?.agentVersion}
                    {agent.systemStatus?.platform && agent.systemStatus?.arch && (
                      <span className="text-slate-400 ml-1">
                        ({agent.systemStatus.platform}/{agent.systemStatus.arch})
                      </span>
                    )}
                  </span>
                  {agent.hasUpdate && (
                    <span className="text-[10px] text-amber-500">{t('admin.forwardAgents.detail.updateAvailable')}</span>
                  )}
                </div>
              </div>
            )}

            {/* Remark */}
            {agent.remark && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">{t('common.fields.remark')}</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{agent.remark}</span>
              </div>
            )}

            {/* Created at */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">{t('admin.forwardAgents.detail.created')}</span>
              <span className="text-xs text-slate-500">{formatDateTime(agent.createdAt)}</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  // Drag mode: use DraggableMobileList wrapper
  // Each card gets its own Accordion to avoid Radix structure constraints
  if (enableDragSort && onDragEnd) {
    return (
      <DraggableMobileList
        items={forwardAgents}
        getItemId={getAgentId}
        renderItem={(agent) => (
          <Accordion type="single" collapsible className="mb-1.5">
            {renderAgentCard(agent)}
          </Accordion>
        )}
        onDragEnd={onDragEnd}
        enabled={true}
        longPressDelay={250}
        className="space-y-0"
      />
    );
  }

  // Normal mode: standard Accordion
  return (
    <Accordion type="multiple" className="space-y-1.5">
      {forwardAgents.map((agent) => renderAgentCard(agent))}
    </Accordion>
  );
};
