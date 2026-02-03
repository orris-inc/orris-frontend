/**
 * Node Mobile List Component
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
  CheckCircle2,
  XCircle,
  Wrench,
  User,
  Shield,
  ArrowUpCircle,
  Globe,
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
import type { Node, NodeStatus } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';

interface NodeMobileListProps {
  nodes: Node[];
  loading?: boolean;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onActivate: (node: Node) => void;
  onDeactivate: (node: Node) => void;
  onGenerateToken: (node: Node) => void;
  onGetInstallScript: (node: Node) => void;
  onViewDetail: (node: Node) => void;
  onCopy: (node: Node) => void;
  onToggleMute?: (node: Node) => void;
  // Drag and drop sorting
  enableDragSort?: boolean;
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
}

// Status configuration with semantic colors
const STATUS_CONFIG: Record<NodeStatus, { labelKey: string; variant: 'success' | 'default' | 'warning'; icon: React.ElementType }> = {
  active: { labelKey: 'common.status.active', variant: 'success', icon: CheckCircle2 },
  inactive: { labelKey: 'common.status.inactive', variant: 'default', icon: XCircle },
  maintenance: { labelKey: 'common.status.maintenance', variant: 'warning', icon: Wrench },
};

// Protocol configuration with semantic styling
const PROTOCOL_CONFIG: Record<string, { label: string; color: string }> = {
  shadowsocks: { label: 'SS', color: 'bg-info-muted text-info' },
  trojan: { label: 'Trojan', color: 'bg-primary/10 text-primary' },
};

import { formatDateTime } from '@/shared/utils/date-utils';

// Format bytes rate to human readable (per second)
const formatBytesRate = (bytesPerSec: number): string => {
  if (!bytesPerSec || bytesPerSec <= 0) return '0';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(1024));
  const value = bytesPerSec / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}${units[i]}`;
};

// Format bytes to human readable (total)
const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} ${units[i]}`;
};

// Format relative time from unix timestamp - requires t function
const createFormatRelativeTime = (t: (key: string, options?: Record<string, unknown>) => string) => (unixSeconds: number): string => {
  if (!unixSeconds) return '-';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixSeconds;
  if (diff < 0) return t('common.time.now');
  if (diff < 60) return t('common.time.secondsAgo', { count: diff });
  if (diff < 3600) return t('common.time.minutesAgo', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('common.time.hoursAgo', { count: Math.floor(diff / 3600) });
  return t('common.time.daysAgo', { count: Math.floor(diff / 86400) });
};

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
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

// Online status indicator with semantic colors
const OnlineIndicator: React.FC<{ isOnline: boolean; lastSeenAt?: string; t: (key: string) => string }> = ({ isOnline, lastSeenAt, t }) => {
  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1 text-success">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
        </span>
        <span className="text-[10px] font-medium">{t('common.status.online')}</span>
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30"></span>
          <span className="text-[10px]">{t('common.status.offline')}</span>
        </span>
      </TooltipTrigger>
      {lastSeenAt && (
        <TooltipContent>
          {t('admin.nodes.table.tooltip.lastOnline')}: {formatDateTime(lastSeenAt)}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export const NodeMobileList: React.FC<NodeMobileListProps> = ({
  nodes,
  loading = false,
  resourceGroupsMap = {},
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onGenerateToken,
  onGetInstallScript,
  onViewDetail,
  onCopy,
  onToggleMute,
  enableDragSort = false,
  onDragEnd,
}) => {
  const { t } = useTranslation();
  const formatRelativeTime = createFormatRelativeTime(t);
  // Get node ID for drag-and-drop
  const getNodeId = useCallback((node: Node) => node.id, []);

  // Render dropdown menu
  const renderDropdownMenu = (node: Node) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-muted-foreground" strokeWidth={1.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" collisionPadding={16}>
            <DropdownMenuItem onSelect={() => onViewDetail(node)}>
              <Eye className="mr-2 size-4" />
              {t('common.actions.viewDetail')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(node)}>
              <Edit className="mr-2 size-4" />
              {t('common.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onGetInstallScript(node)}>
              <Terminal className="mr-2 size-4" />
              {t('admin.nodes.table.menu.installScript')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCopy(node)}>
              <Copy className="mr-2 size-4" />
              {t('admin.nodes.table.menu.copyNode')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onGenerateToken(node)}>
              <Key className="mr-2 size-4" />
              {t('admin.nodes.table.menu.generateToken')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {node.status === 'active' ? (
              <DropdownMenuItem onSelect={() => onDeactivate(node)}>
                <PowerOff className="mr-2 size-4" />
                {t('common.actions.deactivate')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onActivate(node)}>
                <Power className="mr-2 size-4" />
                {t('common.actions.activate')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => onDelete(node)} className="text-red-600 dark:text-red-400">
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

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        {t('admin.nodes.emptyState')}
      </div>
    );
  }

  // Render a single node card
  const renderNodeCard = (node: Node) => {
    const statusConfig = STATUS_CONFIG[node.status] || { labelKey: 'common.status.unknown', variant: 'default' as const, icon: XCircle };
    const StatusIcon = statusConfig.icon;
    const protocolConfig = PROTOCOL_CONFIG[node.protocol] || { label: node.protocol, color: 'bg-gray-100 text-gray-700' };

    return (
      <AccordionItem
        key={node.id}
        value={node.id}
        className="border border-border rounded-lg bg-card overflow-hidden"
      >
        {/* Card Header - Always visible */}
        <div className="px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Node name and status */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-medium text-sm text-foreground truncate">
                  {node.name}
                </span>
                <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                  <StatusIcon className="size-2.5 mr-0.5" />
                  {t(statusConfig.labelKey)}
                </AdminBadge>
                <OnlineIndicator isOnline={node.isOnline} lastSeenAt={node.lastSeenAt} t={t} />
                {node.isExpired && (
                  <AdminBadge variant="danger" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                    {t('common.status.expired')}
                  </AdminBadge>
                )}
              </div>

                  {/* Address and region info */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono truncate cursor-default">
                          {node.serverAddress}:{node.agentPort}
                          {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                            <span className="text-primary">/{node.subscriptionPort}</span>
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1 text-xs">
                          <div>{t('admin.nodes.detail.agentPort')}: {node.agentPort}</div>
                          {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                            <div>{t('admin.nodes.detail.subscriptionPort')}: {node.subscriptionPort}</div>
                          )}
                          {node.systemStatus?.publicIpv4 && (
                            <div className="flex items-center gap-1">
                              <Globe className="size-3" />
                              <span>IPv4: {node.systemStatus.publicIpv4}</span>
                            </div>
                          )}
                          {node.systemStatus?.publicIpv6 && (
                            <div className="flex items-center gap-1">
                              <Globe className="size-3" />
                              <span>IPv6: {node.systemStatus.publicIpv6}</span>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    {node.region && (
                      <>
                        <span className="text-border">·</span>
                        <span className="truncate">{node.region}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onToggleMute?.(node)}
                        className="p-1.5 rounded hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        {node.muteNotification ? (
                          <BellOff className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
                        ) : (
                          <Bell className="size-3.5 text-muted-foreground/30" strokeWidth={1.5} />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{node.muteNotification ? t('admin.nodes.tooltip.clickToUnmute') : t('admin.nodes.tooltip.clickToMute')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(node)}
                        className="p-1.5 rounded hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <Edit className="size-3.5 text-muted-foreground hover:text-foreground" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.actions.edit')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onGetInstallScript(node)}
                        className="p-1.5 rounded hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <Terminal className="size-3.5 text-muted-foreground hover:text-foreground" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t('admin.nodes.table.menu.installScript')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => node.status === 'active' ? onDeactivate(node) : onActivate(node)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          node.status === 'active'
                            ? 'hover:bg-destructive/10'
                            : 'hover:bg-success-muted'
                        }`}
                      >
                        {node.status === 'active' ? (
                          <PowerOff className="size-3.5 text-muted-foreground hover:text-destructive" strokeWidth={1.5} />
                        ) : (
                          <Power className="size-3.5 text-muted-foreground hover:text-success" strokeWidth={1.5} />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{node.status === 'active' ? t('common.actions.disable') : t('common.status.active')}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(node)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-border hover:no-underline hover:bg-accent/30 transition-colors cursor-pointer">
              <span className="text-xs text-muted-foreground">{t('common.actions.view')}</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-border pt-2">
                {/* Protocol config */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-8 flex-shrink-0">{t('common.protocol')}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${protocolConfig.color}`}>
                      {protocolConfig.label}
                    </span>
                    {node.protocol === 'shadowsocks' && node.encryptionMethod && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {node.encryptionMethod}
                      </span>
                    )}
                    {node.protocol === 'trojan' && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {node.transportProtocol?.toUpperCase() || 'TCP'} + TLS
                      </span>
                    )}
                  </div>
                </div>

                {/* Monitor (System + Network) */}
                {node.systemStatus && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">{t('nav.monitor')}</span>
                    <div className="flex flex-col gap-1.5 flex-1">
                      {/* System bars + Network rates in one row */}
                      <div className="flex items-center gap-3">
                        <SystemStatusDisplay
                          status={{
                            cpu: node.systemStatus.cpuPercent,
                            memory: node.systemStatus.memoryPercent,
                            disk: node.systemStatus.diskPercent,
                            uptime: node.systemStatus.uptimeSeconds,
                            memoryUsed: node.systemStatus.memoryUsed,
                            memoryTotal: node.systemStatus.memoryTotal,
                            memoryAvail: node.systemStatus.memoryAvail,
                            diskUsed: node.systemStatus.diskUsed,
                            diskTotal: node.systemStatus.diskTotal,
                            loadAvg1: node.systemStatus.loadAvg1,
                            loadAvg5: node.systemStatus.loadAvg5,
                            loadAvg15: node.systemStatus.loadAvg15,
                          }}
                        />
                        {/* Network rates - always show */}
                        <div className="w-px h-4 bg-border" />
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="text-success">↓{formatBytesRate(node.systemStatus.networkRxRate)}</span>
                          <span className="text-info">↑{formatBytesRate(node.systemStatus.networkTxRate)}</span>
                        </div>
                        {node.systemStatus.updatedAt && (
                          <span className="text-[10px] text-muted-foreground/60 ml-auto">{formatRelativeTime(node.systemStatus.updatedAt)}</span>
                        )}
                      </div>
                      {/* Extended info row - always show */}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-mono">
                          {t('admin.forwardAgents.detail.totalLabel')}: ↓{formatBytes(node.systemStatus.networkRxBytes)} ↑{formatBytes(node.systemStatus.networkTxBytes)}
                        </span>
                        <span>
                          {(node.systemStatus.tcpConnections || 0) + (node.systemStatus.udpConnections || 0)} {t('admin.forwardAgents.detail.connections')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Version */}
                {(node.agentVersion || node.systemStatus?.agentVersion) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-8 flex-shrink-0">{t('common.fields.version')}</span>
                    <div className="flex items-center gap-1.5">
                      {node.hasUpdate && (
                        <ArrowUpCircle className="size-3.5 text-warning" strokeWidth={1.5} />
                      )}
                      <span className={`text-xs font-mono ${node.hasUpdate ? 'text-warning' : 'text-foreground'}`}>
                        v{node.agentVersion || node.systemStatus?.agentVersion}
                        {(node.platform || node.systemStatus?.platform) && (node.arch || node.systemStatus?.arch) && (
                          <span className="text-muted-foreground ml-1">
                            ({node.platform || node.systemStatus?.platform}/{node.arch || node.systemStatus?.arch})
                          </span>
                        )}
                      </span>
                      {node.hasUpdate && (
                        <span className="text-[10px] text-warning font-medium">{t('admin.forwardAgents.detail.updatable')}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {node.tags && node.tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">{t('admin.nodes.table.tags')}</span>
                    <div className="flex flex-wrap gap-1">
                      {node.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resource groups */}
                {node.groupSids && node.groupSids.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">{t('admin.nodes.table.resourceGroup')}</span>
                    <div className="flex flex-wrap gap-1">
                      {node.groupSids.map((gid) => {
                        const group = resourceGroupsMap[gid];
                        return (
                          <Badge key={gid} variant="outline" className="text-[10px] px-1.5 py-0">
                            {group?.name || gid}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Owner */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-8 flex-shrink-0">{t('common.fields.createdAt')}</span>
                  {node.owner ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="size-3 text-muted-foreground/60" strokeWidth={1.5} />
                      <span className="truncate">{node.owner.name || node.owner.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs">
                      <Shield className="size-3 text-info" strokeWidth={1.5} />
                      <span className="text-info font-medium">{t('common.role.admin')}</span>
                    </div>
                  )}
                  <span className="text-border">·</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(node.createdAt)}</span>
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
        items={nodes}
        getItemId={getNodeId}
        renderItem={(node) => (
          <Accordion type="single" collapsible className="mb-1.5">
            {renderNodeCard(node)}
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
      {nodes.map((node) => renderNodeCard(node))}
    </Accordion>
  );
};
