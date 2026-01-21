/**
 * Forward Agent List Table Component (Admin)
 * Implemented using TanStack Table
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Key, Eye, Power, PowerOff, MoreHorizontal, Terminal, Copy, Download, Loader2, Package, ArrowUpCircle, Radio, Bell, BellOff } from 'lucide-react';
import { DataTable, DraggableDataTable, AdminBadge, TruncatedId, SystemStatusCell, TableHoverCardProvider, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
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
import { CopyableAddress } from '@/components/common/CopyableAddress';
import type { ForwardAgent } from '@/api/forward';
import type { ResourceGroup } from '@/api/resource/types';

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

import { formatDateTime } from '@/shared/utils/date-utils';

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
  const { t, i18n } = useTranslation();
  // Detect mobile screen
  const { isMobile } = useBreakpoint();

  // Forward agent context menu content
  const renderContextMenuActions = useCallback((agent: ForwardAgent) => (
    <>
      <ContextMenuItem onClick={() => onViewDetail(agent)}>
        <Eye className="mr-2 size-4" />
        {t('admin.forwardAgents.table.menu.viewDetail')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onEdit(agent)}>
        <Edit className="mr-2 size-4" />
        {t('admin.forwardAgents.table.menu.edit')}
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
          {t('admin.forwardAgents.table.menu.disable')}
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => onEnable(agent)}>
          <Power className="mr-2 size-4" />
          {t('admin.forwardAgents.table.menu.enable')}
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => onDelete(agent)} className="text-red-600 dark:text-red-400">
        <Trash2 className="mr-2 size-4" />
        {t('admin.forwardAgents.table.menu.delete')}
      </ContextMenuItem>
    </>
  ), [t, onViewDetail, onEdit, onGetInstallScript, onCopy, onRegenerateToken, onCheckUpdate, onBroadcastURL, checkingAgentId, onEnable, onDisable, onDelete]);

  // Forward agent dropdown menu content
  const renderDropdownMenuActions = useCallback((agent: ForwardAgent) => (
    <>
      <DropdownMenuItem onClick={() => onCopy(agent)}>
        <Copy className="mr-2 size-4" />
        {t('admin.forwardAgents.table.menu.copyNode')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onRegenerateToken(agent)}>
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
        <DropdownMenuItem onClick={() => onBroadcastURL(agent)}>
          <Radio className="mr-2 size-4" />
          {t('admin.forwardAgents.table.menu.broadcastUrl')}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      {agent.status === 'enabled' ? (
        <DropdownMenuItem onClick={() => onDisable(agent)}>
          <PowerOff className="mr-2 size-4" />
          {t('admin.forwardAgents.table.menu.disable')}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={() => onEnable(agent)}>
          <Power className="mr-2 size-4" />
          {t('admin.forwardAgents.table.menu.enable')}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => onDelete(agent)} className="text-red-600 dark:text-red-400">
        <Trash2 className="mr-2 size-4" />
        {t('admin.forwardAgents.table.menu.delete')}
      </DropdownMenuItem>
    </>
  ), [t, onCopy, onRegenerateToken, onCheckUpdate, onBroadcastURL, checkingAgentId, onEnable, onDisable, onDelete]);

  const columns = useMemo<ColumnDef<ForwardAgent>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 120,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => <TruncatedId id={row.original.id} />,
    },
    {
      accessorKey: 'name',
      header: t('admin.forwardAgents.table.columns.name'),
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900 dark:text-white">{row.original.name}</div>
          {row.original.remark && (
            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {row.original.remark}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'publicAddress',
      header: t('admin.forwardAgents.table.columns.address'),
      size: 180,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        const addressContent = (
          <CopyableAddress
            address={agent.publicAddress || '-'}
            className="font-mono text-sm text-slate-700 dark:text-slate-300"
          />
        );

        if (agent.tunnelAddress) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-0 cursor-help">{addressContent}</div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">{t('admin.forwardAgents.table.tooltip.tunnelAddress')}</div>
                  <CopyableAddress
                    address={agent.tunnelAddress}
                    className="font-mono text-xs"
                    maxLength={50}
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div className="min-w-0">{addressContent}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: t('admin.forwardAgents.table.columns.status'),
      size: 72,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <AdminBadge
                  variant={agent.status === 'enabled' ? 'success' : 'default'}
                  onClick={() => agent.status === 'enabled' ? onDisable(agent) : onEnable(agent)}
                >
                  {agent.status === 'enabled' ? t('admin.forwardAgents.table.menu.enable') : t('admin.forwardAgents.table.menu.disable')}
                </AdminBadge>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {agent.status === 'enabled' ? t('admin.forwardAgents.table.tooltip.clickToDisable') : t('admin.forwardAgents.table.tooltip.clickToEnable')}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'availability',
      header: t('admin.forwardAgents.table.columns.online'),
      size: 70,
      meta: { priority: 2 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        const muteButtonClass = 'p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer';
        return (
          <div className="flex items-center gap-1.5">
            {agent.isOnline ? (
              <Tooltip>
                <TooltipTrigger>
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex size-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2.5 bg-green-500"></span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('admin.forwardAgents.table.tooltip.online')}</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-600 block"></span>
                </TooltipTrigger>
                <TooltipContent>
                  {t('admin.forwardAgents.table.tooltip.offline')}{agent.lastSeenAt && ` · ${t('admin.forwardAgents.table.tooltip.lastOnline')}: ${formatDateTime(agent.lastSeenAt, i18n.language)}`}
                </TooltipContent>
              </Tooltip>
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
                    <BellOff className="size-3.5 text-slate-400" />
                  ) : (
                    <Bell className="size-3.5 text-slate-300 dark:text-slate-600" />
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
      size: 160,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <SystemStatusCell itemId={row.original.id} status={row.original.systemStatus} />
      ),
    },
    {
      id: 'resourceGroup',
      header: t('admin.forwardAgents.table.columns.resourceGroup'),
      size: 120,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        if (!agent.groupId) {
          return <span className="text-xs text-slate-400">-</span>;
        }
        const group = resourceGroupsMap[agent.groupId];
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs truncate max-w-[100px]">
                {group?.name || agent.groupId}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div>{group?.name || t('admin.forwardAgents.table.tooltip.unknownResourceGroup')}</div>
                <div className="text-xs text-slate-400 font-mono">{agent.groupId}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'version',
      header: t('admin.forwardAgents.table.columns.version'),
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        // Use agentVersion field directly (extracted from systemStatus by backend)
        const version = agent.agentVersion || agent.systemStatus?.agentVersion;
        const platform = agent.systemStatus?.platform;
        const arch = agent.systemStatus?.arch;

        if (!version) {
          return <span className="text-xs text-slate-400">-</span>;
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                {agent.hasUpdate ? (
                  <ArrowUpCircle className="size-3.5 text-amber-500" />
                ) : (
                  <Package className="size-3.5 text-slate-400" />
                )}
                <span className={`text-xs font-mono ${agent.hasUpdate ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                  v{version}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="text-xs">{t('admin.forwardAgents.table.tooltip.version')}: v{version}</div>
                {platform && arch && (
                  <div className="text-xs text-slate-400">{platform}/{arch}</div>
                )}
                {agent.hasUpdate && (
                  <div className="text-xs text-amber-500">{t('admin.forwardAgents.table.tooltip.newVersionAvailable')}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('admin.forwardAgents.table.columns.createdAt'),
      size: 140,
      meta: { priority: 4 } as ResponsiveColumnMeta,
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {formatDateTime(row.original.createdAt, i18n.language)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('admin.forwardAgents.table.columns.actions'),
      size: 140,
      enableSorting: false,
      meta: { priority: 1 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const agent = row.original;
        const actionButtonClass = 'inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95 transition-all duration-150 cursor-pointer';
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
              <TooltipContent>{t('admin.forwardAgents.table.menu.edit')}</TooltipContent>
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
                  <button onClick={() => onBroadcastURL(agent)} className={`${actionButtonClass} text-blue-500 hover:text-blue-600 hover:bg-blue-500/10`}>
                    <Radio className="size-4" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('admin.forwardAgents.table.menu.broadcastUrl')}</TooltipContent>
              </Tooltip>
            )}
            <DropdownMenu>
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
  ], [t, i18n.language, onEdit, onDisable, onEnable, onGetInstallScript, onViewDetail, onBroadcastURL, onToggleMute, renderDropdownMenuActions, resourceGroupsMap]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <ForwardAgentMobileList
        forwardAgents={forwardAgents}
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
          columns={columns}
          data={forwardAgents}
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
        columns={columns}
        data={forwardAgents}
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
