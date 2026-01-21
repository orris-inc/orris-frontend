/**
 * Node list table component (admin)
 * Designed based on Node API type definitions
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Key,
  Eye,
  Power,
  PowerOff,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  Terminal,
  Copy,
  User,
  Shield,
  Package,
  ArrowUpCircle,
  Radio,
  Bell,
  BellOff,
} from 'lucide-react';
import { DataTable, DraggableDataTable, TruncatedId, SystemStatusCell, TableHoverCardProvider, TableHoverCardList, type ColumnDef, type ResponsiveColumnMeta } from '@/components/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { NodeMobileList } from './NodeMobileList';
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
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import type { Node, NodeStatus } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';

interface NodeListTableProps {
  nodes: Node[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onActivate: (node: Node) => void;
  onDeactivate: (node: Node) => void;
  onGenerateToken: (node: Node) => void;
  onGetInstallScript: (node: Node) => void;
  onViewDetail: (node: Node) => void;
  onCopy: (node: Node) => void;
  onNotifyURL?: (node: Node) => void;
  onToggleMute?: (node: Node) => void;
  // Drag and drop sorting
  enableDragSort?: boolean;
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
}

// Status configuration with semantic colors (labels are translation keys)
const STATUS_CONFIG: Record<NodeStatus, { labelKey: string; colorClass: string; icon: React.ElementType }> = {
  active: { labelKey: 'common.status.active', colorClass: 'text-success hover:text-success', icon: CheckCircle2 },
  inactive: { labelKey: 'common.status.inactive', colorClass: 'text-muted-foreground/50 hover:text-muted-foreground', icon: XCircle },
  maintenance: { labelKey: 'common.status.maintenance', colorClass: 'text-warning hover:text-warning', icon: Wrench },
};

// Protocol configuration with semantic styling
const PROTOCOL_CONFIG: Record<string, { label: string; color: string }> = {
  shadowsocks: { label: 'SS', color: 'bg-info-muted text-info border border-info/20' },
  trojan: { label: 'Trojan', color: 'bg-primary/10 text-primary border border-primary/20' },
};


import { formatDateTime } from '@/shared/utils/date-utils';

export const NodeListTable: React.FC<NodeListTableProps> = ({
  nodes,
  loading = false,
  page,
  pageSize,
  total,
  resourceGroupsMap = {},
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onGenerateToken,
  onGetInstallScript,
  onViewDetail,
  onCopy,
  onNotifyURL,
  onToggleMute,
  enableDragSort = false,
  onDragEnd,
}) => {
  const { t } = useTranslation();
  // Detect mobile screen
  const { isMobile } = useBreakpoint();

  // Node context menu content
  const renderContextMenuActions = useCallback((node: Node) => (
    <>
      <ContextMenuItem onClick={() => onViewDetail(node)}>
        <Eye className="mr-2 size-4" />
        {t('admin.nodes.actions.viewDetail')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onEdit(node)}>
        <Edit className="mr-2 size-4" />
        {t('admin.nodes.actions.edit')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onGetInstallScript(node)}>
        <Terminal className="mr-2 size-4" />
        {t('admin.nodes.actions.installScript')}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onCopy(node)}>
        <Copy className="mr-2 size-4" />
        {t('admin.nodes.actions.copyNode')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onGenerateToken(node)}>
        <Key className="mr-2 size-4" />
        {t('admin.nodes.actions.generateToken')}
      </ContextMenuItem>
      {node.isOnline && onNotifyURL && (
        <ContextMenuItem onClick={() => onNotifyURL(node)}>
          <Radio className="mr-2 size-4" />
          {t('admin.nodes.actions.broadcastUrl')}
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      {node.status === 'active' ? (
        <ContextMenuItem onClick={() => onDeactivate(node)}>
          <PowerOff className="mr-2 size-4" />
          {t('admin.nodes.actions.deactivate')}
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => onActivate(node)}>
          <Power className="mr-2 size-4" />
          {t('admin.nodes.actions.activate')}
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => onDelete(node)} className="text-destructive">
        <Trash2 className="mr-2 size-4" />
        {t('admin.nodes.actions.delete')}
      </ContextMenuItem>
    </>
  ), [t, onViewDetail, onEdit, onGetInstallScript, onCopy, onGenerateToken, onActivate, onDeactivate, onDelete, onNotifyURL]);

  // Node dropdown menu content
  const renderDropdownMenuActions = useCallback((node: Node) => (
    <>
      <DropdownMenuItem onClick={() => onCopy(node)}>
        <Copy className="mr-2 size-4" />
        {t('admin.nodes.actions.copyNode')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onGenerateToken(node)}>
        <Key className="mr-2 size-4" />
        {t('admin.nodes.actions.generateToken')}
      </DropdownMenuItem>
      {node.isOnline && onNotifyURL && (
        <DropdownMenuItem onClick={() => onNotifyURL(node)}>
          <Radio className="mr-2 size-4" />
          {t('admin.nodes.actions.broadcastUrl')}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      {node.status === 'active' ? (
        <DropdownMenuItem onClick={() => onDeactivate(node)}>
          <PowerOff className="mr-2 size-4" />
          {t('admin.nodes.actions.deactivate')}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={() => onActivate(node)}>
          <Power className="mr-2 size-4" />
          {t('admin.nodes.actions.activate')}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => onDelete(node)} className="text-destructive">
        <Trash2 className="mr-2 size-4" />
        {t('admin.nodes.actions.delete')}
      </DropdownMenuItem>
    </>
  ), [t, onCopy, onGenerateToken, onActivate, onDeactivate, onDelete, onNotifyURL]);

  const columns = useMemo<ColumnDef<Node>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 100,
      meta: { priority: 4 } as ResponsiveColumnMeta, // Optional column >= 1280px
      cell: ({ row }) => (
        <div className="pr-4">
          <TruncatedId id={row.original.id} startChars={6} endChars={4} />
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: t('admin.nodes.table.node'),
      size: 200,
      meta: { priority: 1, sticky: 'left' } as ResponsiveColumnMeta, // Core column, always visible, sticky left
      cell: ({ row }) => {
        const node = row.original;
        const hasSubscriptionPort = node.subscriptionPort && node.subscriptionPort !== node.agentPort;
        const hoverItems = [
          { label: t('admin.nodes.tooltip.agentPort'), value: node.agentPort },
          ...(hasSubscriptionPort ? [{ label: t('admin.nodes.tooltip.subscriptionPort'), value: node.subscriptionPort }] : []),
          ...(node.systemStatus?.publicIpv4 ? [{ label: 'IPv4', value: node.systemStatus.publicIpv4 }] : []),
          ...(node.systemStatus?.publicIpv6 ? [{ label: 'IPv6', value: node.systemStatus.publicIpv6 }] : []),
        ];
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground whitespace-nowrap">
              {node.name}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <TableHoverCardList
                columnKey="name"
                items={hoverItems}
                contentClassName="w-64"
              >
                <code className="font-mono text-[11px] bg-muted/50 px-1 py-0.5 rounded cursor-default">
                  {node.serverAddress}:{node.agentPort}
                  {hasSubscriptionPort && <span className="text-primary">/{node.subscriptionPort}</span>}
                </code>
              </TableHoverCardList>
              {node.region && (
                <span className="text-muted-foreground/60">• {node.region}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'config',
      header: t('admin.nodes.table.config'),
      size: 140,
      meta: {
        priority: 3,
        headerTooltip: t('admin.nodes.tooltip.configDescription'),
      } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const node = row.original;
        const protocolConfig = PROTOCOL_CONFIG[node.protocol] || { label: node.protocol, color: 'bg-muted text-muted-foreground' };

        if (node.protocol === 'shadowsocks') {
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${protocolConfig.color}`}>
                  {protocolConfig.label}
                </span>
                <code className="text-[11px] font-mono text-muted-foreground bg-muted/30 px-1 py-0.5 rounded">
                  {node.encryptionMethod || '-'}
                </code>
              </div>
              {node.plugin && (
                <span className="text-[11px] text-muted-foreground/70">
                  + {node.plugin}
                </span>
              )}
            </div>
          );
        }
        // Trojan displays transport protocol and TLS configuration
        const transport = node.transportProtocol?.toUpperCase() || 'TCP';
        const configItems = [
          { label: t('admin.nodes.tooltip.transportProtocol'), value: transport },
          ...(node.sni ? [{ label: 'SNI', value: node.sni }] : []),
          ...(node.host ? [{ label: 'Host', value: node.host }] : []),
          ...(node.path ? [{ label: 'Path', value: node.path }] : []),
        ];
        return (
          <TableHoverCardList
            columnKey="config"
            items={configItems}
            footer={node.allowInsecure && (
              <span className="text-amber-500 text-xs">{t('admin.nodes.tooltip.allowInsecure')}</span>
            )}
          >
            <div className="flex flex-col gap-1 cursor-default">
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${protocolConfig.color}`}>
                  {protocolConfig.label}
                </span>
                <code className="text-[11px] font-mono text-muted-foreground bg-muted/30 px-1 py-0.5 rounded">
                  {transport} + TLS
                </code>
              </div>
              {node.sni && (
                <span className="text-[11px] text-muted-foreground/70 truncate max-w-[120px]">
                  SNI: {node.sni}
                </span>
              )}
            </div>
          </TableHoverCardList>
        );
      },
    },
    {
      id: 'availability',
      header: t('admin.nodes.table.online'),
      size: 70,
      meta: { priority: 2 } as ResponsiveColumnMeta, // Important column >= 640px
      cell: ({ row }) => {
        const node = row.original;
        const muteButtonClass = 'p-0.5 rounded hover:bg-accent/50 transition-colors cursor-pointer';
        return (
          <div className="flex items-center gap-1.5">
            {node.isOnline ? (
              <Tooltip>
                <TooltipTrigger>
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex size-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2.5 bg-success"></span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('admin.nodes.tooltip.onlineStatus')}</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <span className="size-2.5 rounded-full bg-muted-foreground/30 block"></span>
                </TooltipTrigger>
                <TooltipContent>
                  {t('admin.nodes.tooltip.offlineStatus')}{node.lastSeenAt && ` · ${t('admin.nodes.tooltip.lastOnline')}: ${formatDateTime(node.lastSeenAt)}`}
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={muteButtonClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMute?.(node);
                  }}
                >
                  {node.muteNotification ? (
                    <BellOff className="size-3.5 text-muted-foreground" />
                  ) : (
                    <Bell className="size-3.5 text-muted-foreground/30" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {node.muteNotification ? t('admin.nodes.tooltip.clickToUnmute') : t('admin.nodes.tooltip.clickToMute')}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
    {
      id: 'monitor',
      header: t('admin.nodes.table.monitor'),
      size: 160,
      meta: {
        priority: 3,
        headerTooltip: t('admin.nodes.tooltip.monitorDescription'),
      } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const node = row.original;
        return <SystemStatusCell itemId={node.id} status={node.systemStatus} />;
      },
    },
    {
      accessorKey: 'status',
      header: t('admin.nodes.table.status'),
      size: 50,
      meta: { priority: 1 } as ResponsiveColumnMeta, // Core column, always visible
      cell: ({ row }) => {
        const node = row.original;
        const statusConfig = STATUS_CONFIG[node.status] || { labelKey: 'common.status.unknown', colorClass: 'text-muted-foreground', icon: AlertTriangle };
        const StatusIcon = statusConfig.icon;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => node.status === 'active' ? onDeactivate(node) : onActivate(node)}
                className={`cursor-pointer active:scale-90 transition-all duration-150 ${statusConfig.colorClass}`}
              >
                <StatusIcon className="size-4" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {t(statusConfig.labelKey)} · {node.status === 'active' ? t('admin.nodes.actions.clickToDeactivate') : t('admin.nodes.actions.clickToActivate')}
              {node.status === 'maintenance' && node.maintenanceReason && (
                <div className="mt-1 text-xs opacity-80">{t('admin.nodes.tooltip.maintenanceReason')}: {node.maintenanceReason}</div>
              )}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'tags',
      header: t('admin.nodes.table.tags'),
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta, // Secondary column >= 1024px
      cell: ({ row }) => {
        const node = row.original;
        if (!node.tags || node.tags.length === 0) {
          return <span className="text-xs text-muted-foreground/50">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {node.tags.slice(0, 2).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                {tag}
              </Badge>
            ))}
            {node.tags.length > 2 && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{node.tags.length - 2}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {node.tags.slice(2).join(', ')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      id: 'version',
      header: t('admin.nodes.table.version'),
      size: 90,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const node = row.original;
        // Use fields directly (extracted from systemStatus by backend)
        const version = node.agentVersion || node.systemStatus?.agentVersion;
        const platform = node.platform || node.systemStatus?.platform;
        const arch = node.arch || node.systemStatus?.arch;

        if (!version) {
          return <span className="text-xs text-muted-foreground/50">-</span>;
        }

        const versionItems = [
          { label: t('admin.nodes.tooltip.versionInfo'), value: `v${version}` },
          ...(platform && arch ? [{ label: t('admin.nodes.table.platform'), value: `${platform}/${arch}` }] : []),
        ];

        return (
          <TableHoverCardList
            columnKey="version"
            items={versionItems}
            footer={node.hasUpdate && (
              <span className="text-warning text-xs font-medium">{t('admin.nodes.tooltip.newVersionAvailable')}</span>
            )}
            contentClassName="w-56"
          >
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md cursor-default transition-colors ${node.hasUpdate ? 'bg-warning-muted border border-warning/20' : 'bg-muted/30 border border-transparent'}`}>
              {node.hasUpdate ? (
                <ArrowUpCircle className="size-3.5 text-warning" strokeWidth={1.5} />
              ) : (
                <Package className="size-3.5 text-muted-foreground/60" strokeWidth={1.5} />
              )}
              <code className={`text-[11px] font-mono ${node.hasUpdate ? 'text-warning' : 'text-muted-foreground'}`}>
                v{version}
              </code>
            </div>
          </TableHoverCardList>
        );
      },
    },
    {
      id: 'resourceGroup',
      header: t('admin.nodes.table.resourceGroup'),
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const node = row.original;
        const groupIds = node.groupIds || [];
        if (groupIds.length === 0) {
          return <span className="text-xs text-muted-foreground/50">-</span>;
        }
        const firstGroup = resourceGroupsMap[groupIds[0]];
        const remainingCount = groupIds.length - 1;
        const allGroupItems = groupIds.map((gid) => {
          const g = resourceGroupsMap[gid];
          return { label: g?.name || t('admin.nodes.tooltip.unknownResourceGroup'), value: gid };
        });
        return (
          <TableHoverCardList
            columnKey="resourceGroup"
            title={t('admin.nodes.table.resourceGroup')}
            items={allGroupItems}
            contentClassName="w-64"
          >
            <div className="flex items-center gap-1 cursor-default">
              <Badge variant="outline" className="text-[10px] truncate max-w-[80px]">
                {firstGroup?.name || groupIds[0]}
              </Badge>
              {remainingCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  +{remainingCount}
                </Badge>
              )}
            </div>
          </TableHoverCardList>
        );
      },
    },
    {
      id: 'owner',
      header: t('admin.nodes.table.owner'),
      size: 100,
      meta: { priority: 3 } as ResponsiveColumnMeta,
      cell: ({ row }) => {
        const node = row.original;
        if (node.owner) {
          const ownerItems = [
            ...(node.owner.name ? [{ label: t('admin.users.table.name'), value: node.owner.name }] : []),
            { label: t('admin.users.table.email'), value: node.owner.email },
          ];
          return (
            <TableHoverCardList columnKey="owner" items={ownerItems} contentClassName="w-64">
              <div className="flex items-center gap-1.5 cursor-default">
                <User className="size-3.5 text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {node.owner.name || node.owner.email}
                </span>
              </div>
            </TableHoverCardList>
          );
        }
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-info-muted border border-info/20">
            <Shield className="size-3 text-info" strokeWidth={1.5} />
            <span className="text-[10px] font-medium text-info">{t('common.role.admin')}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('admin.nodes.table.createdAt'),
      size: 90,
      meta: { priority: 4 } as ResponsiveColumnMeta, // Optional column >= 1280px
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('admin.nodes.table.actions'),
      size: 160,
      meta: { priority: 1, sticky: 'right' } as ResponsiveColumnMeta, // Core column, always visible, sticky right
      enableSorting: false,
      cell: ({ row }) => {
        const node = row.original;
        const actionButtonClass = 'inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95 transition-all duration-150 cursor-pointer';
        return (
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onViewDetail(node)} className={actionButtonClass}>
                  <Eye className="size-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.nodes.actions.viewDetail')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onEdit(node)} className={actionButtonClass}>
                  <Edit className="size-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.nodes.actions.edit')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onGetInstallScript(node)} className={actionButtonClass}>
                  <Terminal className="size-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.nodes.actions.installScript')}</TooltipContent>
            </Tooltip>
            {node.isOnline && onNotifyURL && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => onNotifyURL(node)} className={`${actionButtonClass} text-blue-500 hover:text-blue-600 hover:bg-blue-500/10`}>
                    <Radio className="size-4" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('admin.nodes.actions.broadcastUrl')}</TooltipContent>
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
                  {renderDropdownMenuActions(node)}
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [t, onEdit, onActivate, onDeactivate, onGetInstallScript, onViewDetail, onNotifyURL, onToggleMute, renderDropdownMenuActions, resourceGroupsMap]);

  // Render mobile card list on small screens
  if (isMobile) {
    return (
      <NodeMobileList
        nodes={nodes}
        loading={loading}
        resourceGroupsMap={resourceGroupsMap}
        onEdit={onEdit}
        onDelete={onDelete}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
        onGenerateToken={onGenerateToken}
        onGetInstallScript={onGetInstallScript}
        onViewDetail={onViewDetail}
        onCopy={onCopy}
        onToggleMute={onToggleMute}
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
          data={nodes}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          emptyMessage={t('admin.nodes.noData')}
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
        data={nodes}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage={t('admin.nodes.noData')}
        getRowId={(row) => String(row.id)}
        enableContextMenu={true}
        contextMenuContent={renderContextMenuActions}
      />
    </TableHoverCardProvider>
  );
};
