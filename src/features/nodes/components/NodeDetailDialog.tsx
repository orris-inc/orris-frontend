/**
 * Node detail view dialog
 * Based on Node API type definitions
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { Progress, ProgressIndicator } from '@/components/common/Progress';
import { TruncatedId, ExtendedMetricsPanel, hasExtendedMetrics } from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Cpu, MemoryStick, HardDrive, ShieldCheck, ShieldAlert, Globe, Activity, Network, Package, RefreshCw, ArrowUpCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import type { Node, NodeVersionInfo } from '@/api/node';
import { getNodeVersion, triggerNodeUpdate } from '@/api/node';
import { RouteConfigDisplay } from './RouteConfigDisplay';
import type { OutboundNodeOption } from '../utils/route-rule-utils';
import { formatBitRate, formatBytes, formatUptime } from '@/shared/utils/format-utils';
import { useNodeDetailEvents } from '../hooks/useNodeEvents';

interface NodeDetailDialogProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
  /** Available nodes for displaying node names in route config */
  nodes?: OutboundNodeOption[];
}

// Status variant mapping (labels are now translated)
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  maintenance: 'outline',
};

// Protocol type label mapping
const PROTOCOL_LABELS: Record<string, string> = {
  shadowsocks: 'Shadowsocks',
  trojan: 'Trojan',
};

// Transport protocol labels
const TRANSPORT_LABELS: Record<string, string> = {
  tcp: 'TCP',
  ws: 'WebSocket',
  grpc: 'gRPC',
};

import { formatDateTime, isNeverExpiresDate } from '@/shared/utils/date-utils';


// Get progress color based on value
const getProgressColor = (value: number): string => {
  if (value >= 90) return 'bg-red-500';
  if (value >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

export const NodeDetailDialog: React.FC<NodeDetailDialogProps> = ({
  open,
  node,
  onClose,
  nodes = [],
}) => {
  const { t } = useTranslation();
  const [versionInfo, setVersionInfo] = useState<NodeVersionInfo | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Subscribe to real-time status via SSE
  const { status: runtimeStatus, isOnline, isConnected } = useNodeDetailEvents({
    nodeId: open && node?.status === 'active' ? node.id : null,
    enabled: open && node?.status === 'active',
  });

  // Use SSE status if available, fallback to node's static systemStatus
  const systemStatus = runtimeStatus ?? node?.systemStatus;

  // Fetch version info when dialog opens and node is online
  useEffect(() => {
    if (open && (isOnline || node?.isOnline) && node?.id) {
      setVersionInfo(null);
      setUpdateMessage(null);
      setVersionLoading(true);
      getNodeVersion(node.id)
        .then(setVersionInfo)
        .catch(() => setVersionInfo(null))
        .finally(() => setVersionLoading(false));
    }
  }, [open, node?.id, node?.isOnline, isOnline]);

  // Handle trigger update
  const handleTriggerUpdate = async () => {
    if (!node?.id) return;
    setUpdateLoading(true);
    setUpdateMessage(null);
    try {
      const response = await triggerNodeUpdate(node.id);
      setUpdateMessage(response.message);
    } catch {
      setUpdateMessage(t('admin.nodes.detail.updateTriggerFailed'));
    } finally {
      setUpdateLoading(false);
    }
  };

  if (!node) return null;

  const statusVariant = STATUS_VARIANT[node.status] || 'outline';
  const statusLabel = t(`admin.nodes.statusLabel.${node.status}`, node.status);
  const isTrojan = node.protocol === 'trojan';
  const isShadowsocks = node.protocol === 'shadowsocks';

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="@container sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {node.name}
              <Badge variant="outline" className="font-normal">
                {PROTOCOL_LABELS[node.protocol] || node.protocol}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2 mr-6">
              {isOnline ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  {t('admin.nodes.detail.nodeOnline')}
                </span>
              ) : node.status === 'active' ? (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                  {isConnected ? t('admin.nodes.detail.waitingStatus') : t('admin.nodes.detail.connecting')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                  {t('admin.nodes.detail.nodeOffline')}
                </span>
              )}
              <Badge variant={statusVariant}>
                {statusLabel}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6">
          {/* Node Status */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('admin.nodes.detail.nodeStatus')}</h3>
            <Separator className="mb-4" />
            <div className="space-y-4">
              {/* Status Bar */}
              <div className="flex flex-wrap items-center gap-3 p-3 bg-muted rounded-lg">
                {/* SSE Connection Status */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isConnected ? (
                        <Wifi className="h-3 w-3 text-green-500" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-slate-400" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isConnected ? t('admin.nodes.detail.realtimeConnected') : t('admin.nodes.detail.connectingRealtime')}
                  </TooltipContent>
                </Tooltip>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                {/* Online Status */}
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium text-green-600">{t('common.status.online')}</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
                      <span className="text-sm font-medium text-slate-500">{t('common.status.offline')}</span>
                    </>
                  )}
                </div>
                {systemStatus?.uptimeSeconds !== undefined && systemStatus.uptimeSeconds > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" />
                      <span>{t('admin.nodes.detail.uptime')}: {formatUptime(systemStatus.uptimeSeconds)}</span>
                    </div>
                  </>
                )}
                {systemStatus?.agentVersion && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      v{systemStatus.agentVersion}
                      {systemStatus.platform && systemStatus.arch && (
                        <span className="text-xs ml-1">
                          ({systemStatus.platform}/{systemStatus.arch})
                        </span>
                      )}
                    </span>
                  </>
                )}
              </div>

              {/* Version Management */}
              {(isOnline || node.isOnline) && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{t('admin.nodes.detail.versionManagement')}</span>
                    </div>
                    {versionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : versionInfo ? (
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">{t('admin.nodes.detail.current')} </span>
                          <span className="font-mono">v{versionInfo.currentVersion}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">{t('admin.nodes.detail.latest')} </span>
                          <span className="font-mono">v{versionInfo.latestVersion}</span>
                        </div>
                        {versionInfo.hasUpdate && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleTriggerUpdate}
                                disabled={updateLoading}
                                className="h-7 gap-1.5"
                              >
                                {updateLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ArrowUpCircle className="h-3.5 w-3.5" />
                                )}
                                {t('admin.nodes.detail.update')}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('admin.nodes.detail.updateToVersion', { version: versionInfo.latestVersion })}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {!versionInfo.hasUpdate && (
                          <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-800">
                            {t('admin.nodes.detail.upToDate')}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setVersionLoading(true);
                              getNodeVersion(node.id)
                                .then(setVersionInfo)
                                .catch(() => setVersionInfo(null))
                                .finally(() => setVersionLoading(false));
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            <RefreshCw className="h-4 w-4 text-slate-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{t('admin.nodes.detail.refreshVersion')}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {updateMessage && (
                    <p className="text-xs text-muted-foreground mt-2">{updateMessage}</p>
                  )}
                </div>
              )}

              {!isConnected && node.status === 'active' ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">{t('admin.nodes.detail.establishingConnection')}</span>
                </div>
              ) : systemStatus && (
                <>
                  {/* Resource Usage */}
                  <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3">
                    {/* CPU */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium">CPU</span>
                        </div>
                        <span className="text-sm font-semibold">{(systemStatus.cpuPercent ?? 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={systemStatus.cpuPercent ?? 0} className="h-2">
                        <ProgressIndicator
                          className={getProgressColor(systemStatus.cpuPercent ?? 0)}
                          style={{ transform: `translateX(-${100 - (systemStatus.cpuPercent ?? 0)}%)` }}
                        />
                      </Progress>
                      {systemStatus.loadAvg1 !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t('admin.nodes.detail.load')}: {systemStatus.loadAvg1.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {/* Memory */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <MemoryStick className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium">{t('admin.nodes.detail.memory')}</span>
                        </div>
                        <span className="text-sm font-semibold">{(systemStatus.memoryPercent ?? 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={systemStatus.memoryPercent ?? 0} className="h-2">
                        <ProgressIndicator
                          className={getProgressColor(systemStatus.memoryPercent ?? 0)}
                          style={{ transform: `translateX(-${100 - (systemStatus.memoryPercent ?? 0)}%)` }}
                        />
                      </Progress>
                      {(systemStatus.memoryUsed !== undefined && systemStatus.memoryTotal !== undefined) && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formatBytes(systemStatus.memoryUsed)} / {formatBytes(systemStatus.memoryTotal)}
                        </p>
                      )}
                    </div>
                    {/* Disk */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="h-4 w-4 text-orange-500" />
                          <span className="text-xs font-medium">{t('admin.nodes.detail.disk')}</span>
                        </div>
                        <span className="text-sm font-semibold">{(systemStatus.diskPercent ?? 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={systemStatus.diskPercent ?? 0} className="h-2">
                        <ProgressIndicator
                          className={getProgressColor(systemStatus.diskPercent ?? 0)}
                          style={{ transform: `translateX(-${100 - (systemStatus.diskPercent ?? 0)}%)` }}
                        />
                      </Progress>
                      {(systemStatus.diskUsed !== undefined && systemStatus.diskTotal !== undefined) && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formatBytes(systemStatus.diskUsed)} / {formatBytes(systemStatus.diskTotal)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Network & IP Info */}
                  {(systemStatus.networkRxRate !== undefined || systemStatus.publicIpv4 || systemStatus.publicIpv6) && (
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                      {/* Network */}
                      {(systemStatus.networkRxRate !== undefined || systemStatus.tcpConnections !== undefined) && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Network className="h-4 w-4 text-indigo-500" />
                            <span className="text-xs font-medium">{t('admin.nodes.detail.networkTraffic')}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600">↓ {formatBitRate(systemStatus.networkRxRate ?? 0)}</span>
                            <span className="text-blue-600">↑ {formatBitRate(systemStatus.networkTxRate ?? 0)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            TCP {systemStatus.tcpConnections ?? 0} · UDP {systemStatus.udpConnections ?? 0}
                          </p>
                        </div>
                      )}
                      {/* Public IP */}
                      {(systemStatus.publicIpv4 || systemStatus.publicIpv6) && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Globe className="h-4 w-4 text-cyan-500" />
                            <span className="text-xs font-medium">{t('admin.nodes.detail.publicIp')}</span>
                          </div>
                          <div className="space-y-0.5 font-mono text-sm">
                            {systemStatus.publicIpv4 && <p>{systemStatus.publicIpv4}</p>}
                            {systemStatus.publicIpv6 && (
                              <p className="text-xs text-muted-foreground truncate" title={systemStatus.publicIpv6}>
                                {systemStatus.publicIpv6}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extended Metrics */}
                  {hasExtendedMetrics(systemStatus) && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t('admin.nodes.detail.extendedMetrics')}</p>
                      <ExtendedMetricsPanel data={systemStatus} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="@container">
            <h3 className="text-sm font-semibold mb-3">{t('common.sections.basicInfo')}</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.nodeId')}</p>
                <TruncatedId id={node.id} fullWidth />
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('common.fields.version')}</p>
                <p className="text-sm">{node.version}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('common.fields.sortOrder')}</p>
                <p className="text-sm">{node.sortOrder ?? 0}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.notificationStatus')}</p>
                <Badge variant={node.muteNotification ? "secondary" : "outline"}>
                  {node.muteNotification ? t('admin.nodes.detail.muted') : t('admin.nodes.detail.normalNotification')}
                </Badge>
              </div>

              {node.region && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.region')}</p>
                  <p className="text-sm">{node.region}</p>
                </div>
              )}

              {node.tags && node.tags.length > 0 && (
                <div className="space-y-1 @md:col-span-2">
                  <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.tags')}</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {node.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connection Info */}
          <div className="@container">
            <h3 className="text-sm font-semibold mb-3">{t('admin.nodes.detail.connectionInfo')}</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.serverAddress')}</p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                  {node.serverAddress}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.agentPort')}</p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                  {node.agentPort}
                </p>
              </div>
              {node.subscriptionPort && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.subscriptionPort')}</p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                    {node.subscriptionPort}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shadowsocks Config */}
          {isShadowsocks && (
            <div className="@container">
              <h3 className="text-sm font-semibold mb-3">{t('admin.nodes.detail.shadowsocksConfig')}</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.encryptionMethod')}</p>
                  <p className="text-sm font-mono">{node.encryptionMethod || '-'}</p>
                </div>

                {node.plugin && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.plugin')}</p>
                    <p className="text-sm font-mono">{node.plugin}</p>
                  </div>
                )}

                {node.pluginOpts && Object.keys(node.pluginOpts).length > 0 && (
                  <div className="space-y-1 @md:col-span-2">
                    <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.pluginOptions')}</p>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted p-3 rounded-md">
                      {JSON.stringify(node.pluginOpts, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trojan Config */}
          {isTrojan && (
            <div className="@container">
              <h3 className="text-sm font-semibold mb-3">{t('admin.nodes.detail.trojanConfig')}</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.transportProtocol')}</p>
                  <p className="text-sm font-mono">
                    {TRANSPORT_LABELS[node.transportProtocol || 'tcp'] || node.transportProtocol?.toUpperCase() || 'TCP'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.tlsSecurity')}</p>
                  <div className="flex items-center gap-1">
                    {node.allowInsecure ? (
                      <>
                        <ShieldAlert className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600">{t('admin.nodes.detail.allowInsecure')}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">{t('admin.nodes.detail.secureConnection')}</span>
                      </>
                    )}
                  </div>
                </div>

                {node.sni && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.sni')}</p>
                    <p className="text-sm font-mono">{node.sni}</p>
                  </div>
                )}

                {node.host && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {node.transportProtocol === 'grpc' ? t('admin.nodes.detail.grpcServiceName') : t('admin.nodes.detail.host')}
                    </p>
                    <p className="text-sm font-mono">{node.host}</p>
                  </div>
                )}

                {node.path && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.wsPath')}</p>
                    <p className="text-sm font-mono">{node.path}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Route Config */}
          {node.route && (
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('admin.nodes.detail.routeConfig')}</h3>
              <Separator className="mb-4" />
              <RouteConfigDisplay config={node.route} nodes={nodes} />
            </div>
          )}

          {/* Maintenance Info */}
          {node.status === 'maintenance' && node.maintenanceReason && (
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('admin.nodes.detail.maintenanceInfo')}</h3>
              <Separator className="mb-4" />
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {node.maintenanceReason}
                </p>
              </div>
            </div>
          )}

          {/* Expiration Info */}
          <div className="@container">
            <h3 className="text-sm font-semibold mb-3">{t('admin.nodes.detail.expirationInfo')}</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.expiresAt')}</p>
                <p className={`text-sm ${node.isExpired ? 'text-destructive font-medium' : ''}`}>
                  {node.expiresAt && !isNeverExpiresDate(node.expiresAt) ? formatDateTime(node.expiresAt) : t('admin.nodes.detail.neverExpires')}
                  {node.isExpired && ` (${t('common.status.expired')})`}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('common.fields.costLabel')}</p>
                <p className="text-sm">{node.costLabel || '-'}</p>
              </div>
            </div>
          </div>

          {/* Time Info */}
          <div className="@container">
            <h3 className="text-sm font-semibold mb-3">{t('admin.nodes.detail.timeInfo')}</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('common.fields.createdAt')}</p>
                <p className="text-xs">{formatDateTime(node.createdAt)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('common.fields.updatedAt')}</p>
                <p className="text-xs">{formatDateTime(node.updatedAt)}</p>
              </div>

              {node.lastSeenAt && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('admin.nodes.detail.lastOnline')}</p>
                  <p className="text-xs">{formatDateTime(node.lastSeenAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            {t('common.actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
