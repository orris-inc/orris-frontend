/**
 * Forward Agent detail dialog component
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/common/Dialog";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Separator } from "@/components/common/Separator";
import {
  TruncatedId,
  ExtendedMetricsPanel,
  hasExtendedMetrics,
} from "@/components/admin";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/Tooltip";
import { Progress, ProgressIndicator } from "@/components/common/Progress";
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  ArrowUpDown,
  Loader2,
  Radio,
  Package,
  RefreshCw,
  ArrowUpCircle,
  Activity,
  Globe,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useForwardAgentDetailEvents } from "../hooks/useForwardAgentEvents";
import { getAgentVersion, triggerAgentUpdate } from "@/api/forward";
import type { AgentVersionInfo } from "@/api/forward";
import { useState, useEffect } from "react";
import type { ForwardAgent, BlockedProtocol } from "@/api/forward";
import {
  formatBitRate,
  formatBytes,
  formatUptime,
} from "@/shared/utils/format-utils";
import { useTranslation } from "react-i18next";

interface ForwardAgentDetailDialogProps {
  open: boolean;
  agent: ForwardAgent | null;
  onClose: () => void;
}

import { formatDateTime } from '@/shared/utils/date-utils';

// Get progress color based on value
const getProgressColor = (value: number): string => {
  if (value >= 90) return "bg-red-500";
  if (value >= 70) return "bg-yellow-500";
  return "bg-green-500";
};

// Protocol groups for display
const getProtocolGroups = (t: (key: string) => string): {
  label: string;
  protocols: { value: BlockedProtocol; label: string }[];
}[] => [
  {
    label: t("admin.forwardAgents.detail.proxyProtocols"),
    protocols: [
      { value: "http_connect", label: "HTTP CONNECT" },
      { value: "socks4", label: "SOCKS4" },
      { value: "socks5", label: "SOCKS5" },
    ],
  },
  {
    label: t("admin.forwardAgents.detail.appProtocols"),
    protocols: [
      { value: "http", label: "HTTP" },
      { value: "tls", label: "TLS" },
      { value: "ssh", label: "SSH" },
      { value: "ftp", label: "FTP" },
    ],
  },
];


export const ForwardAgentDetailDialog: React.FC<
  ForwardAgentDetailDialogProps
> = ({ open, agent, onClose }) => {
  const { t } = useTranslation();
  const [versionInfo, setVersionInfo] = useState<AgentVersionInfo | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Subscribe to real-time status via SSE
  const {
    status: runtimeStatus,
    isOnline,
    isConnected,
  } = useForwardAgentDetailEvents({
    agentId: open && agent?.status === "enabled" ? agent.id : null,
    enabled: open && agent?.status === "enabled",
  });

  // Fetch version info when dialog opens and agent is enabled
  useEffect(() => {
    if (open && agent?.status === "enabled" && agent?.id) {
      setVersionInfo(null);
      setUpdateMessage(null);
      setVersionLoading(true);
      getAgentVersion(agent.id)
        .then(setVersionInfo)
        .catch(() => setVersionInfo(null))
        .finally(() => setVersionLoading(false));
    }
  }, [open, agent?.id, agent?.status]);

  // Handle trigger update
  const handleTriggerUpdate = async () => {
    if (!agent?.id) return;
    setUpdateLoading(true);
    setUpdateMessage(null);
    try {
      const response = await triggerAgentUpdate(agent.id);
      setUpdateMessage(response.message);
    } catch {
      setUpdateMessage(t("admin.forwardAgents.detail.updateTriggerFailed"));
    } finally {
      setUpdateLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {agent.name}
              <Badge variant="outline" className="font-normal">
                {t("admin.forwardAgents.detail.badge")}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2 mr-6">
              {isOnline ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  {t("admin.forwardAgents.detail.nodeOnline")}
                </span>
              ) : agent.status === "enabled" ? (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                  {isConnected ? t("admin.forwardAgents.detail.waitingStatus") : t("admin.forwardAgents.detail.connecting")}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                  {t("admin.forwardAgents.detail.nodeOffline")}
                </span>
              )}
              <Badge
                variant={agent.status === "enabled" ? "default" : "secondary"}
              >
                {agent.status === "enabled" ? t("common.status.enabled") : t("common.status.disabled")}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="@container flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6">
            {/* Node Status */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t("admin.forwardAgents.detail.nodeStatus")}</h3>
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
                      {isConnected ? t("admin.forwardAgents.detail.realtimeConnected") : t("admin.forwardAgents.detail.connectingRealtime")}
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
                        <span className="text-sm font-medium text-green-600">
                          {t("common.status.online")}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
                        <span className="text-sm font-medium text-slate-500">
                          {t("common.status.offline")}
                        </span>
                      </>
                    )}
                  </div>
                  {runtimeStatus?.uptimeSeconds !== undefined &&
                    runtimeStatus.uptimeSeconds > 0 && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">
                          |
                        </span>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Activity className="h-3.5 w-3.5" />
                          <span>
                            {t("admin.forwardAgents.detail.uptime")}: {formatUptime(runtimeStatus.uptimeSeconds)}
                          </span>
                        </div>
                      </>
                    )}
                  {runtimeStatus?.agentVersion && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">
                        |
                      </span>
                      <span className="text-sm text-muted-foreground font-mono">
                        v{runtimeStatus.agentVersion}
                        {runtimeStatus.platform && runtimeStatus.arch && (
                          <span className="text-xs ml-1">
                            ({runtimeStatus.platform}/{runtimeStatus.arch})
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>

                {/* Version Management */}
                {agent.status === "enabled" && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{t("admin.forwardAgents.detail.versionManagement")}</span>
                      </div>
                      {versionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : versionInfo ? (
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              {t("admin.forwardAgents.detail.current")}{" "}
                            </span>
                            <span className="font-mono">
                              v{versionInfo.currentVersion}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              {t("admin.forwardAgents.detail.latest")}{" "}
                            </span>
                            <span className="font-mono">
                              v{versionInfo.latestVersion}
                            </span>
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
                                  {t("admin.forwardAgents.detail.update")}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("admin.forwardAgents.detail.updateToVersion", { version: versionInfo.latestVersion })}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {!versionInfo.hasUpdate && (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-200 dark:border-green-800"
                            >
                              {t("admin.forwardAgents.detail.upToDate")}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                setVersionLoading(true);
                                getAgentVersion(agent.id)
                                  .then(setVersionInfo)
                                  .catch(() => setVersionInfo(null))
                                  .finally(() => setVersionLoading(false));
                              }}
                              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              <RefreshCw className="h-4 w-4 text-slate-400" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{t("admin.forwardAgents.detail.refreshVersion")}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {updateMessage && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {updateMessage}
                      </p>
                    )}
                  </div>
                )}

                {!isConnected && agent.status === "enabled" ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      {t("admin.forwardAgents.detail.establishingConnection")}
                    </span>
                  </div>
                ) : (
                  runtimeStatus && (
                    <>
                      {/* Resource Usage */}
                      <div className="grid grid-cols-1 @sm:grid-cols-3 gap-3">
                        {/* CPU */}
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <Cpu className="h-4 w-4 text-blue-500" />
                              <span className="text-xs font-medium">{t("admin.forwardAgents.detail.cpu")}</span>
                            </div>
                            <span className="text-sm font-semibold">
                              {(runtimeStatus.cpuPercent ?? 0).toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={runtimeStatus.cpuPercent ?? 0}
                            className="h-2"
                          >
                            <ProgressIndicator
                              className={getProgressColor(
                                runtimeStatus.cpuPercent ?? 0,
                              )}
                              style={{
                                transform: `translateX(-${100 - (runtimeStatus.cpuPercent ?? 0)}%)`,
                              }}
                            />
                          </Progress>
                          {runtimeStatus.loadAvg1 !== undefined && (
                            <p className="text-xs text-muted-foreground mt-1.5">
                              {t("admin.forwardAgents.detail.load")}: {runtimeStatus.loadAvg1.toFixed(2)}
                            </p>
                          )}
                        </div>
                        {/* Memory */}
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <MemoryStick className="h-4 w-4 text-green-500" />
                              <span className="text-xs font-medium">{t("admin.forwardAgents.detail.memory")}</span>
                            </div>
                            <span className="text-sm font-semibold">
                              {(runtimeStatus.memoryPercent ?? 0).toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={runtimeStatus.memoryPercent ?? 0}
                            className="h-2"
                          >
                            <ProgressIndicator
                              className={getProgressColor(
                                runtimeStatus.memoryPercent ?? 0,
                              )}
                              style={{
                                transform: `translateX(-${100 - (runtimeStatus.memoryPercent ?? 0)}%)`,
                              }}
                            />
                          </Progress>
                          {runtimeStatus.memoryUsed !== undefined &&
                            runtimeStatus.memoryTotal !== undefined && (
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {formatBytes(runtimeStatus.memoryUsed)} /{" "}
                                {formatBytes(runtimeStatus.memoryTotal)}
                              </p>
                            )}
                        </div>
                        {/* Disk */}
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <HardDrive className="h-4 w-4 text-orange-500" />
                              <span className="text-xs font-medium">{t("admin.forwardAgents.detail.disk")}</span>
                            </div>
                            <span className="text-sm font-semibold">
                              {(runtimeStatus.diskPercent ?? 0).toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={runtimeStatus.diskPercent ?? 0}
                            className="h-2"
                          >
                            <ProgressIndicator
                              className={getProgressColor(
                                runtimeStatus.diskPercent ?? 0,
                              )}
                              style={{
                                transform: `translateX(-${100 - (runtimeStatus.diskPercent ?? 0)}%)`,
                              }}
                            />
                          </Progress>
                          {runtimeStatus.diskUsed !== undefined &&
                            runtimeStatus.diskTotal !== undefined && (
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {formatBytes(runtimeStatus.diskUsed)} /{" "}
                                {formatBytes(runtimeStatus.diskTotal)}
                              </p>
                            )}
                        </div>
                      </div>

                      {/* Network & Forward Info */}
                      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                        {/* Network */}
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Network className="h-4 w-4 text-indigo-500" />
                            <span className="text-xs font-medium">
                              {t("admin.forwardAgents.detail.networkTraffic")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600">
                              ↓{" "}
                              {formatBitRate(runtimeStatus.networkRxRate ?? 0)}
                            </span>
                            <span className="text-blue-600">
                              ↑{" "}
                              {formatBitRate(runtimeStatus.networkTxRate ?? 0)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            TCP {runtimeStatus.tcpConnections ?? 0} · UDP{" "}
                            {runtimeStatus.udpConnections ?? 0}
                          </p>
                        </div>
                        {/* Forward Status */}
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-1.5 mb-2">
                            <ArrowUpDown className="h-4 w-4 text-pink-500" />
                            <span className="text-xs font-medium">
                              {t("admin.forwardAgents.detail.forwardStatus")}
                            </span>
                          </div>
                          <div className="space-y-0.5 text-sm">
                            <p>{t("admin.forwardAgents.detail.activeRules")}: {runtimeStatus.activeRules ?? 0}</p>
                            <p>
                              {t("admin.forwardAgents.detail.activeConnections")}: {runtimeStatus.activeConnections ?? 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tunnel & Public IP */}
                      {(runtimeStatus.wsListenPort ||
                        runtimeStatus.tlsListenPort ||
                        runtimeStatus.publicIpv4 ||
                        runtimeStatus.publicIpv6) && (
                        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                          {/* Tunnel Ports */}
                          {(runtimeStatus.wsListenPort ||
                            runtimeStatus.tlsListenPort) && (
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Radio className="h-4 w-4 text-purple-500" />
                                <span className="text-xs font-medium">
                                  {t("admin.forwardAgents.detail.tunnelPorts")}
                                </span>
                              </div>
                              <div className="space-y-0.5 font-mono text-sm">
                                {runtimeStatus.wsListenPort && (
                                  <p>WS: {runtimeStatus.wsListenPort}</p>
                                )}
                                {runtimeStatus.tlsListenPort && (
                                  <p>TLS: {runtimeStatus.tlsListenPort}</p>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Public IP */}
                          {(runtimeStatus.publicIpv4 ||
                            runtimeStatus.publicIpv6) && (
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Globe className="h-4 w-4 text-cyan-500" />
                                <span className="text-xs font-medium">
                                  {t("admin.forwardAgents.detail.publicIp")}
                                </span>
                              </div>
                              <div className="space-y-0.5 font-mono text-sm">
                                {runtimeStatus.publicIpv4 && (
                                  <p>{runtimeStatus.publicIpv4}</p>
                                )}
                                {runtimeStatus.publicIpv6 && (
                                  <p
                                    className="text-xs text-muted-foreground truncate"
                                    title={runtimeStatus.publicIpv6}
                                  >
                                    {runtimeStatus.publicIpv6}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Extended Metrics */}
                      {hasExtendedMetrics(runtimeStatus) && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            {t("admin.forwardAgents.detail.extendedMetrics")}
                          </p>
                          <ExtendedMetricsPanel data={runtimeStatus} />
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t("admin.forwardAgents.detail.basicInfo")}</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.agentId")}</p>
                  <TruncatedId id={agent.id} fullWidth />
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.agentName")}</p>
                  <p className="text-sm">{agent.name}</p>
                </div>

                {agent.publicAddress && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.publicAddress")}</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                      {agent.publicAddress}
                    </p>
                  </div>
                )}

                {agent.tunnelAddress && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.tunnelAddress")}</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                      {agent.tunnelAddress}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.portLimit")}</p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                    {agent.allowedPortRange || t("admin.forwardAgents.detail.noLimit")}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.notificationStatus")}</p>
                  <Badge variant={agent.muteNotification ? "secondary" : "outline"}>
                    {agent.muteNotification ? t("admin.forwardAgents.detail.muted") : t("admin.forwardAgents.detail.normalNotification")}
                  </Badge>
                </div>

                <div className="space-y-2 @md:col-span-2">
                  <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.blockedProtocols")}</p>
                  {agent.blockedProtocols && agent.blockedProtocols.length > 0 ? (
                    <div className="space-y-2">
                      {getProtocolGroups(t).map((group) => {
                        const blockedInGroup = group.protocols.filter((p) =>
                          agent.blockedProtocols?.includes(p.value)
                        );
                        if (blockedInGroup.length === 0) return null;
                        return (
                          <div key={group.label} className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-muted-foreground mr-1">
                              {group.label}:
                            </span>
                            {blockedInGroup.map((protocol) => (
                              <Badge
                                key={protocol.value}
                                variant="destructive"
                                className="text-xs font-normal"
                              >
                                {protocol.label}
                              </Badge>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.none")}</p>
                  )}
                </div>

                {agent.remark && (
                  <div className="space-y-1 @md:col-span-2">
                    <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.remark")}</p>
                    <p className="text-sm">{agent.remark}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Time Info */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t("admin.forwardAgents.detail.timeInfo")}</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.createdAt")}</p>
                  <p className="text-xs">{formatDateTime(agent.createdAt)}</p>
                </div>

                {agent.updatedAt && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.updatedAt")}</p>
                    <p className="text-xs">{formatDateTime(agent.updatedAt)}</p>
                  </div>
                )}

                {agent.lastSeenAt && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("admin.forwardAgents.detail.lastOnline")}</p>
                    <p className="text-xs">{formatDateTime(agent.lastSeenAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Token Notice */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t("admin.forwardAgents.detail.tokenNotice")}</h3>
              <Separator className="mb-4" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• {t("admin.forwardAgents.detail.tokenNotice1")}</p>
                <p>• {t("admin.forwardAgents.detail.tokenNotice2")}</p>
                <p>• {t("admin.forwardAgents.detail.tokenNotice3")}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            {t("common.actions.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
