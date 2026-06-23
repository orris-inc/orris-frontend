/**
 * Forward Agent List Table Component (Admin)
 * Implemented using TanStack Table
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback, useState, useDeferredValue } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Key, Eye, Power, PowerOff, MoreHorizontal, Terminal, Copy, Download, Loader2, Package, ArrowUpCircle, Radio, Bell, BellOff, Circle, AlertTriangle } from 'lucide-react';
import { DataTable, DraggableDataTable, SystemStatusCell, TableHoverCardProvider, TableHoverCardList, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ForwardAgentMobileList } from './ForwardAgentMobileList';
import { Badge } from '@/components/common/Badge';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import type { ForwardAgent, ForwardStatus } from '@/api/forward';
import type { ResourceGroup } from '@/api/resource/types';

// Health status configuration - combines online state and admin status
type HealthStatus = 'running' | 'offline' | 'stopped';

const HEALTH_STATUS_CONFIG: Record<HealthStatus, {
  labelKey: string;
  colorClass: string;
  bgClass: string;
  icon: React.ElementType;
}> = {
  running: {
    labelKey: 'common.status.running',
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
    icon: Circle,
  },
  offline: {
    labelKey: 'common.status.offline',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
    icon: AlertTriangle,
  },
  stopped: {
    labelKey: 'common.status.stopped',
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    icon: Circle,
  },
};

// Determine health status from agent state
const getHealthStatus = (agent: { status: ForwardStatus; isOnline?: boolean }): HealthStatus => {
  if (agent.status === 'disabled') return 'stopped';
  // enabled status
  return agent.isOnline ? 'running' : 'offline';
};

interface ForwardAgentListTableProps {
  forwardAgents: ForwardAgent[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
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

import { formatDateTime, formatRelativeTime, isNeverExpiresDate } from '@/shared/utils/date-utils';

export const ForwardAgentListTable: React.FC<ForwardAgentListTableProps> = ({
  forwardAgents,
  loading = false,
  page,
  pageSize,
  total,
  resourceGroupsMap = {},
  onPageChange,
  onPageSizeChange,
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
  // Detect mobile screen
  const { isMobile } = useBreakpoint();
  // Track which dropdown is open to prevent SSE updates from closing it
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  // Defer agents updates to prevent SSE from interrupting user interactions (hover, dropdown)
  const deferredAgents = useDeferredValue(forwardAgents);

  // Forward agent context menu content
  const renderContextMenuActions = useCallback((agent: ForwardAgent) => (
    <>
      <ContextMenuItem onClick={() => onViewDetail(agent)}>
        <Eye className="mr-2 size-4" />
        {t('admin.forwardAgents.table.menu.viewDetail')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onEdit(agent)}>
        <Edit className="mr-2 size-4" />
        {t('common.actions.edit')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onGetInstallScript(agent)}>
        <Terminal className="mr-2 size-4" />
        {t('admin.forwardAgents.table.menu.getInstallScript')}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onCopy(agent)}>
        <Copy className="mr-2 size-4" />
        {t('admin.forwardAgents.table.menu.copyNode')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onRegenerateToken(agent)}>
        <Key className="mr-2 size-4" />
        {t('admin.forwardAgents.table.menu.regenerateToken')}
      </ContextMenuItem>
      {agent.status === 'enabled' && (
        <ContextMenuItem
          onClick={() => onCheckUpdate(agent)}
          disabled={checkingAgentId === agent.id}
        >
          {checkingAgentId === agent.id ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          {checkingAgentId === agent.id ? t('admin.forwardAgents.table.menu.checking') : t('admin.forwardAgents.table.menu.checkUpdate')}
        </ContextMenuItem>
      )}
      {onBroadcastURL && (
        <ContextMenuItem onClick={() => onBroadcastURL(agent)}>
          <Radio className="mr-2 size-4" />
          {t('admin.forwardAgents.table.menu.broadcastUrl')}
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      {agent.status === 'enabled' ? (
        <ContextMenuItem onClick={() => onDisable(agent)}>
          <PowerOff className="mr-2 size-4" />
          {t('common.actions.disable')}
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => onEnable(agent)}>
          <Power className="mr-2 size-4" />
          {t('common.actions.enable')}
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => onDelete(agent)} className="text-destructive">
        <Trash2 className="mr-2 size-4" />
        {t('common.actions.delete')}
      </ContextMenuItem>
    </>
  ), [t, onViewDetail, onEdit, onGetInstallScript, onCopy, onRegenerateToken, onCheckUpdate, onBroadcastURL, checkingAgentId, onEnable, onDisable, onDelete]);

  // Forward agent dropdown menu content
  const renderDropdownMenuActions = useCallback((agent: ForwardAgent) => (
    <>
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
          {t('admin.forwardAgents.table.menu.broadcastUrl')}
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
      <DropdownMenuItem onSelect={() => onDelete(agent)} className="text-destructive">
        <Trash2 className="mr-2 size-4" />
        {t('common.actions.delete')}
      </DropdownMenuItem>
    </>
  ), [t, onCopy, onRegenerateToken, onCheckUpdate, onBroadcastURL, checkingAgentId, onEnable, onDisable, onDelete]);

  const columns = useMemo<ColumnDef<ForwardAgent>[]>(() => [
    {
      accessorKey: 'name',
      header: t('common.fields.name'),
      size: 220,
      meta: { priority: 1, sticky: 'left' } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        // Build hover items including ID and address details
        const hoverItems = [
          { label: 'ID', value: agent.id },
          { label: t('admin.forwardAgents.table.columns.address'), value: agent.publicAddress || '-' },
          ...(agent.tunnelAddress ? [{ label: t('admin.forwardAgents.table.tooltip.tunnelAddress'), value: agent.tunnelAddress }] : []),
          ...(agent.remark ? [{ label: t('common.fields.remark'), value: agent.remark }] : []),
        ];
        return (
          <TableHoverCardList
            columnKey="name"
            items={hoverItems}
            contentClassName="w-80"
          >
            <div className="flex flex-col gap-0.5 cursor-default">
              <SmartTruncate text={agent.name} className="font-semibold text-foreground whitespace-nowrap" />
              <code className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded w-fit">
                {agent.publicAddress || '-'}
              </code>
            </div>
          </TableHoverCardList>
        );
      },
    },
    {
      id: 'health',
      header: t('common.status.label'),
      size: 100,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        const healthStatus = getHealthStatus(agent);
        const config = HEALTH_STATUS_CONFIG[healthStatus];
        const StatusIcon = config.icon;
        const muteButtonClass = 'p-0.5 rounded hover:bg-muted/60 transition-colors cursor-pointer';

        // Build tooltip content
        const getTooltipContent = () => {
          const lines: string[] = [t(config.labelKey)];
          if (healthStatus === 'offline' && agent.lastSeenAt) {
            lines.push(`${t('admin.forwardAgents.table.tooltip.lastOnline')}: ${formatDateTime(agent.lastSeenAt)}`);
          }
          // Expiration info
          if (agent.isExpired) {
            lines.push(t('common.status.expired'));
          } else if (agent.expiresAt && !isNeverExpiresDate(agent.expiresAt)) {
            lines.push(`${t('admin.forwardAgents.table.tooltip.expiresAt')}: ${formatDateTime(agent.expiresAt)}`);
          }
          if (agent.costLabel) {
            lines.push(`${t('common.fields.costLabel')}: ${agent.costLabel}`);
          }
          // Click action hint
          if (agent.status === 'enabled') {
            lines.push(t('admin.forwardAgents.table.tooltip.clickToDisable'));
          } else {
            lines.push(t('admin.forwardAgents.table.tooltip.clickToEnable'));
          }
          return lines;
        };

        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => agent.status === 'enabled' ? onDisable(agent) : onEnable(agent)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-pointer active:scale-95 transition-all ${config.bgClass} ${config.colorClass}`}
                >
                  <StatusIcon className={`size-3 ${healthStatus === 'stopped' ? 'fill-current opacity-40' : healthStatus === 'running' ? 'fill-current' : ''}`} strokeWidth={healthStatus === 'stopped' ? 1.5 : 2} />
                  {t(config.labelKey)}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                {getTooltipContent().map((line, i) => (
                  <div key={i} className={i > 0 ? 'text-xs opacity-80 mt-0.5' : ''}>{line}</div>
                ))}
              </TooltipContent>
            </Tooltip>
            {agent.isExpired && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {t('common.status.expired')}
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={muteButtonClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMute?.(agent);
                  }}
                >
                  {agent.muteNotification ? (
                    <BellOff className="size-3.5 text-muted-foreground" />
                  ) : (
                    <Bell className="size-3.5 text-muted-foreground/30" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {agent.muteNotification ? t('admin.forwardAgents.table.tooltip.clickToUnmute') : t('admin.forwardAgents.table.tooltip.clickToMute')}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
    {
      id: 'systemStatus',
      header: t('admin.forwardAgents.table.columns.monitor'),
      size: 175,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <SystemStatusCell itemId={row.original.id} status={row.original.systemStatus} />
      ),
    },
    {
      id: 'resourceGroup',
      header: t('admin.forwardAgents.table.columns.resourceGroup'),
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        if (!agent.groupSids || agent.groupSids.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        const firstGroupSid = agent.groupSids[0];
        const firstGroup = resourceGroupsMap[firstGroupSid];
        const hasMore = agent.groupSids.length > 1;
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs truncate max-w-[100px]">
                {firstGroup?.name || firstGroupSid}
                {hasMore && ` +${agent.groupSids.length - 1}`}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {agent.groupSids.map((sid) => {
                  const group = resourceGroupsMap[sid];
                  return (
                    <div key={sid}>
                      <span>{group?.name || t('admin.forwardAgents.table.tooltip.unknownResourceGroup')}</span>
                      <span className="text-xs text-muted-foreground font-mono ml-2">({sid})</span>
                    </div>
                  );
                })}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'version',
      header: t('common.fields.version'),
      size: 85,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        // Use agentVersion field directly (extracted from systemStatus by backend)
        const version = agent.agentVersion || agent.systemStatus?.agentVersion;
        const platform = agent.systemStatus?.platform;
        const arch = agent.systemStatus?.arch;

        if (!version) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                {agent.hasUpdate ? (
                  <ArrowUpCircle className="size-3.5 text-warning" />
                ) : (
                  <Package className="size-3.5 text-muted-foreground" />
                )}
                <span className={`text-xs font-mono ${agent.hasUpdate ? 'text-warning' : 'text-muted-foreground'}`}>
                  v{version}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="text-xs">{t('common.fields.version')}: v{version}</div>
                {platform && arch && (
                  <div className="text-xs text-muted-foreground">{platform}/{arch}</div>
                )}
                {agent.hasUpdate && (
                  <div className="text-xs text-warning">{t('admin.forwardAgents.table.tooltip.newVersionAvailable')}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('common.fields.createdAt'),
      size: 115,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const value = row.original.createdAt;
        if (!value) return <span className="text-muted-foreground/50 text-xs">-</span>;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground whitespace-nowrap cursor-default">
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
      size: 120,
      enableSorting: false,
      meta: { priority: 1, sticky: 'right' } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        const actionButtonClass = 'inline-flex items-center justify-center size-7 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all duration-150 cursor-pointer';
        return (
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onViewDetail(agent)} className={actionButtonClass}>
                  <Eye className="size-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.forwardAgents.table.menu.viewDetail')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onEdit(agent)} className={actionButtonClass}>
                  <Edit className="size-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('common.actions.edit')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onGetInstallScript(agent)} className={actionButtonClass}>
                  <Terminal className="size-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.forwardAgents.table.menu.getInstallScript')}</TooltipContent>
            </Tooltip>
            {agent.systemStatus && onBroadcastURL && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => onBroadcastURL(agent)} className={`${actionButtonClass} text-info/70 hover:text-info hover:bg-info/10`}>
                    <Radio className="size-4" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('admin.forwardAgents.table.menu.broadcastUrl')}</TooltipContent>
              </Tooltip>
            )}
            <DropdownMenu
              open={openDropdownId === agent.id}
              onOpenChange={(open) => setOpenDropdownId(open ? agent.id : null)}
            >
              <DropdownMenuTrigger asChild>
                <button className={actionButtonClass}>
                  <MoreHorizontal className="size-4" strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent align="end" collisionPadding={16}>
                  {renderDropdownMenuActions(agent)}
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [t, onEdit, onDisable, onEnable, onGetInstallScript, onViewDetail, onBroadcastURL, onToggleMute, renderDropdownMenuActions, resourceGroupsMap, openDropdownId]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <ForwardAgentMobileList
        forwardAgents={deferredAgents}
        loading={loading}
        resourceGroupsMap={resourceGroupsMap}
        onEdit={onEdit}
        onDelete={onDelete}
        onEnable={onEnable}
        onDisable={onDisable}
        onRegenerateToken={onRegenerateToken}
        onGetInstallScript={onGetInstallScript}
        onViewDetail={onViewDetail}
        onCopy={onCopy}
        onCheckUpdate={onCheckUpdate}
        onBroadcastURL={onBroadcastURL}
        onToggleMute={onToggleMute}
        checkingAgentId={checkingAgentId}
        enableDragSort={enableDragSort}
        onDragEnd={onDragEnd}
      />
    );
  }

  // Use DraggableDataTable when drag sort is enabled
  if (enableDragSort && onDragEnd) {
    return (
      <TableHoverCardProvider>
        <DraggableDataTable
          elevated
          columns={columns}
          data={deferredAgents}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          emptyMessage={t('admin.forwardAgents.table.empty')}
          getRowId={(row) => String(row.id)}
          enableDragSort={true}
          onDragEnd={onDragEnd}
          enableContextMenu={true}
          contextMenuContent={renderContextMenuActions}
        />
      </TableHoverCardProvider>
    );
  }

  return (
    <TableHoverCardProvider>
      <DataTable
        elevated
        columns={columns}
        data={deferredAgents}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage={t('admin.forwardAgents.table.empty')}
        getRowId={(row) => String(row.id)}
        enableContextMenu={true}
        contextMenuContent={renderContextMenuActions}
      />
    </TableHoverCardProvider>
  );
};
