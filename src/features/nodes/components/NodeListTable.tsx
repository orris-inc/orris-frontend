/**
 * Node list table component (admin)
 * Designed based on Node API type definitions
 * Switches to mobile card list on small screens
 */

import { useMemo, useCallback, useDeferredValue } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Key,
  Eye,
  Power,
  PowerOff,
  MoreHorizontal,
  Circle,
  AlertTriangle,
  Wrench,
  Terminal,
  Copy,
  User,
  Shield,
  ArrowUpCircle,
  Radio,
  Bell,
  BellOff,
  Users,
} from 'lucide-react';
import { DataTable, DraggableDataTable, SystemStatusCell, TableHoverCardProvider, TableHoverCardList, type ColumnDef, type ResponsiveColumnMeta, type RowSelectionState, type OnChangeFn } from '@/components/admin';
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
  // Row selection for batch operations
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

// Health status configuration - combines online state and admin status
// Running: active + online, Offline: active + offline, Stopped: inactive, Maintenance: maintenance
type HealthStatus = 'running' | 'offline' | 'stopped' | 'maintenance';

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
  maintenance: {
    labelKey: 'common.status.maintenance',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
    icon: Wrench,
  },
};

// Determine health status from node state
const getHealthStatus = (node: { status: NodeStatus; isOnline?: boolean }): HealthStatus => {
  if (node.status === 'maintenance') return 'maintenance';
  if (node.status === 'inactive') return 'stopped';
  // active status
  return node.isOnline ? 'running' : 'offline';
};

// Protocol identity colors — text only, no badge treatment
const PROTOCOL_CONFIG: Record<string, { label: string; color: string }> = {
  shadowsocks: { label: 'SS', color: 'text-info' },
  trojan: { label: 'Trojan', color: 'text-destructive' },
  vless: { label: 'VLESS', color: 'text-relay' },
  vmess: { label: 'VMess', color: 'text-primary' },
  hysteria2: { label: 'Hy2', color: 'text-warning' },
  tuic: { label: 'TUIC', color: 'text-chart-3' },
  anytls: { label: 'AnyTLS', color: 'text-success' },
};


import { formatDateTime, formatRelativeTime, isNeverExpiresDate } from '@/shared/utils/date-utils';

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
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
}) => {
  const { t } = useTranslation();
  // Detect mobile screen
  const { isMobile } = useBreakpoint();
  // Defer nodes updates to prevent SSE from interrupting user interactions (hover, dropdown)
  const deferredNodes = useDeferredValue(nodes);

  // Node context menu content
  const renderContextMenuActions = useCallback((node: Node) => (
    <>
      <ContextMenuItem onClick={() => onViewDetail(node)}>
        <Eye className="mr-2 size-4" />
        {t('admin.nodes.actions.viewDetail')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onEdit(node)}>
        <Edit className="mr-2 size-4" />
        {t('common.actions.edit')}
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
      {onToggleMute && (
        <ContextMenuItem onClick={() => onToggleMute(node)}>
          {node.muteNotification ? <Bell className="mr-2 size-4" /> : <BellOff className="mr-2 size-4" />}
          {node.muteNotification ? t('admin.nodes.tooltip.clickToUnmute') : t('admin.nodes.tooltip.clickToMute')}
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      {node.status === 'active' ? (
        <ContextMenuItem onClick={() => onDeactivate(node)}>
          <PowerOff className="mr-2 size-4" />
          {t('common.actions.disable')}
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => onActivate(node)}>
          <Power className="mr-2 size-4" />
          {t('common.actions.enable')}
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={() => onDelete(node)} className="text-destructive">
        <Trash2 className="mr-2 size-4" />
        {t('admin.nodes.actions.delete')}
      </ContextMenuItem>
    </>
  ), [t, onViewDetail, onEdit, onGetInstallScript, onCopy, onGenerateToken, onActivate, onDeactivate, onDelete, onNotifyURL, onToggleMute]);

  // Node dropdown menu content
  const renderDropdownMenuActions = useCallback((node: Node) => (
    <>
      <DropdownMenuItem onSelect={() => onCopy(node)}>
        <Copy className="mr-2 size-4" />
        {t('admin.nodes.actions.copyNode')}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onGenerateToken(node)}>
        <Key className="mr-2 size-4" />
        {t('admin.nodes.actions.generateToken')}
      </DropdownMenuItem>
      {node.isOnline && onNotifyURL && (
        <DropdownMenuItem onSelect={() => onNotifyURL(node)}>
          <Radio className="mr-2 size-4" />
          {t('admin.nodes.actions.broadcastUrl')}
        </DropdownMenuItem>
      )}
      {onToggleMute && (
        <DropdownMenuItem onSelect={() => onToggleMute(node)}>
          {node.muteNotification ? <Bell className="mr-2 size-4" /> : <BellOff className="mr-2 size-4" />}
          {node.muteNotification ? t('admin.nodes.tooltip.clickToUnmute') : t('admin.nodes.tooltip.clickToMute')}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      {node.status === 'active' ? (
        <DropdownMenuItem onSelect={() => onDeactivate(node)}>
          <PowerOff className="mr-2 size-4" />
          {t('common.actions.disable')}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onSelect={() => onActivate(node)}>
          <Power className="mr-2 size-4" />
          {t('common.actions.enable')}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onSelect={() => onDelete(node)} className="text-destructive">
        <Trash2 className="mr-2 size-4" />
        {t('admin.nodes.actions.delete')}
      </DropdownMenuItem>
    </>
  ), [t, onCopy, onGenerateToken, onActivate, onDeactivate, onDelete, onNotifyURL, onToggleMute]);

  const columns = useMemo<ColumnDef<Node>[]>(() => [
    {
      accessorKey: 'name',
      header: t('admin.nodes.table.node'),
      size: 220,
      meta: { priority: 1, sticky: 'left' } as ResponsiveColumnMeta, // Core column, always visible, sticky left
      cell: ({ row }) => {
        const node = row.original;
        const protocolConfig = PROTOCOL_CONFIG[node.protocol] || { label: node.protocol, color: 'text-muted-foreground' };
        const hasSubscriptionPort = node.subscriptionPort && node.subscriptionPort !== node.agentPort;

        // Build hover items including ID and config details
        const configLabel = node.protocol === 'shadowsocks'
          ? node.encryptionMethod || '-'
          : `${node.transportProtocol?.toUpperCase() || 'TCP'}+TLS`;
        const hoverItems = [
          { label: 'ID', value: node.id },
          { label: t('admin.nodes.tooltip.protocol'), value: `${protocolConfig.label} / ${configLabel}` },
          ...(node.protocol === 'shadowsocks' && node.plugin ? [{ label: 'Plugin', value: node.plugin }] : []),
          ...(node.protocol !== 'shadowsocks' && node.sni ? [{ label: 'SNI', value: node.sni }] : []),
          ...(node.protocol !== 'shadowsocks' && node.host ? [{ label: 'Host', value: node.host }] : []),
          ...(node.protocol !== 'shadowsocks' && node.path ? [{ label: 'Path', value: node.path }] : []),
          { label: t('admin.nodes.tooltip.agentPort'), value: node.agentPort },
          ...(hasSubscriptionPort ? [{ label: t('admin.nodes.tooltip.subscriptionPort'), value: node.subscriptionPort }] : []),
          ...(node.systemStatus?.publicIpv4 ? [{ label: 'IPv4', value: node.systemStatus.publicIpv4 }] : []),
          ...(node.systemStatus?.publicIpv6 ? [{ label: 'IPv6', value: node.systemStatus.publicIpv6 }] : []),
        ];
        return (
          <TableHoverCardList
            columnKey="name"
            items={hoverItems}
            contentClassName="w-72"
            footer={node.allowInsecure && (
              <span className="text-warning text-xs">{t('admin.nodes.tooltip.allowInsecure')}</span>
            )}
          >
            <div className="flex flex-col gap-0.5 cursor-default">
              <span className="font-semibold text-foreground truncate whitespace-nowrap">
                {node.name}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                <span className={`font-semibold ${protocolConfig.color}`}>{protocolConfig.label}</span>
                <span className="text-border">·</span>
                <span className="font-mono">
                  {node.serverAddress}:{node.agentPort}
                  {hasSubscriptionPort && <span className="text-primary">/{node.subscriptionPort}</span>}
                </span>
                {node.region && (
                  <>
                    <span className="text-border">·</span>
                    <span>{node.region}</span>
                  </>
                )}
              </div>
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
        const node = row.original;
        const healthStatus = getHealthStatus(node);
        const config = HEALTH_STATUS_CONFIG[healthStatus];
        const StatusIcon = config.icon;

        // Build tooltip content
        const getTooltipContent = () => {
          const lines: string[] = [t(config.labelKey)];
          if (healthStatus === 'offline' && node.lastSeenAt) {
            lines.push(`${t('admin.nodes.tooltip.lastOnline')}: ${formatDateTime(node.lastSeenAt)}`);
          }
          if (node.status === 'maintenance' && node.maintenanceReason) {
            lines.push(`${t('admin.nodes.tooltip.maintenanceReason')}: ${node.maintenanceReason}`);
          }
          // Expiration info
          if (node.isExpired) {
            lines.push(t('common.status.expired'));
          } else if (node.expiresAt && !isNeverExpiresDate(node.expiresAt)) {
            lines.push(`${t('admin.nodes.tooltip.expiresAt')}: ${formatDateTime(node.expiresAt)}`);
          }
          if (node.onlineSubscriptionCount > 0) {
            lines.push(`${t('admin.nodes.detail.onlineSubscriptions')}: ${node.onlineSubscriptionCount}`);
          }
          if (node.costLabel) {
            lines.push(`${t('common.fields.costLabel')}: ${node.costLabel}`);
          }
          // Click action hint
          if (node.status === 'active') {
            lines.push(t('admin.nodes.actions.clickToDeactivate'));
          } else if (node.status !== 'maintenance') {
            lines.push(t('admin.nodes.actions.clickToActivate'));
          }
          return lines;
        };

        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => node.status === 'active' ? onDeactivate(node) : onActivate(node)}
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
            {node.isExpired && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {t('common.status.expired')}
              </Badge>
            )}
            {node.onlineSubscriptionCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-success font-medium">
                <Users className="size-3" strokeWidth={2} />
                {node.onlineSubscriptionCount}
              </span>
            )}
            {node.muteNotification && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <BellOff className="size-3 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>{t('admin.nodes.tooltip.clickToUnmute')}</TooltipContent>
              </Tooltip>
            )}
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
      id: 'tags',
      header: t('admin.nodes.table.tags'),
      size: 80,
      meta: { priority: 3 } as ResponsiveColumnMeta, // Secondary column >= 1024px
      cell: ({ row }) => {
        const node = row.original;
        if (!node.tags || node.tags.length === 0) {
          return <span className="text-xs text-muted-foreground/50">-</span>;
        }
        // Show first tag + count if more
        const firstTag = node.tags[0];
        const moreCount = node.tags.length - 1;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 whitespace-nowrap cursor-default">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium truncate max-w-[60px]">
                  {firstTag}
                </Badge>
                {moreCount > 0 && (
                  <span className="text-[10px] text-muted-foreground">+{moreCount}</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {node.tags.join(', ')}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'version',
      header: t('common.fields.version'),
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
          { label: t('common.fields.version'), value: `v${version}` },
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
            {node.hasUpdate ? (
              <div className="inline-flex items-center gap-1 cursor-default">
                <ArrowUpCircle className="size-3 text-warning" strokeWidth={1.5} />
                <code className="text-[11px] font-mono font-medium text-warning">v{version}</code>
              </div>
            ) : (
              <code className="text-[11px] font-mono text-muted-foreground cursor-default">v{version}</code>
            )}
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
        const groupSids = node.groupSids || [];
        if (groupSids.length === 0) {
          return <span className="text-xs text-muted-foreground/50">-</span>;
        }
        const firstGroup = resourceGroupsMap[groupSids[0]];
        const remainingCount = groupSids.length - 1;
        const allGroupItems = groupSids.map((gid) => {
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
                {firstGroup?.name || groupSids[0]}
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
            ...(node.owner.name ? [{ label: t('common.fields.name'), value: node.owner.name }] : []),
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
      header: t('common.fields.createdAt'),
      size: 115,
      meta: { priority: 4 } as ResponsiveColumnMeta, // Optional column >= 1280px
      cell: ({ row }) => {
        const value = row.original.createdAt;
        if (!value) return <span className="text-muted-foreground/50 text-sm">-</span>;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground whitespace-nowrap cursor-default">
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
              <TooltipContent>{t('common.actions.edit')}</TooltipContent>
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
                  <button onClick={() => onNotifyURL(node)} className={`${actionButtonClass} text-info hover:text-info hover:bg-info/10`}>
                    <Radio className="size-4" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('admin.nodes.actions.broadcastUrl')}</TooltipContent>
              </Tooltip>
            )}
            {/* Uncontrolled DropdownMenu - Radix manages open/close state internally,
                avoids re-creating column definitions on every dropdown toggle */}
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
        nodes={deferredNodes}
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
          data={deferredNodes}
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
        data={deferredNodes}
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
        enableRowSelection={enableRowSelection}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
      />
    </TableHoverCardProvider>
  );
};
