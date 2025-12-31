/**
 * 节点详情查看对话框
 * 基于 Node API 类型定义
 */

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
import { TruncatedId } from '@/components/admin';
import { Cpu, MemoryStick, HardDrive, Clock, ShieldCheck, ShieldAlert, Globe, Activity, Network } from 'lucide-react';
import type { Node } from '@/api/node';
import { RouteConfigDisplay } from './RouteConfigDisplay';
import type { OutboundNodeOption } from './RouteRuleEditor';

interface NodeDetailDialogProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
  /** Available nodes for displaying node names in route config */
  nodes?: OutboundNodeOption[];
}

// Status label mapping
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: '已激活', variant: 'default' },
  inactive: { label: '未激活', variant: 'secondary' },
  maintenance: { label: '维护中', variant: 'outline' },
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

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Format uptime
const formatUptime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}分钟`);

  return parts.join(' ') || '刚刚启动';
};

// Format bytes to human readable
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Format network rate
const formatRate = (bytesPerSec: number): string => {
  if (bytesPerSec === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return `${parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

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
  if (!node) return null;

  const statusConfig = STATUS_CONFIG[node.status] || { label: node.status, variant: 'outline' as const };
  const isTrojan = node.protocol === 'trojan';
  const isShadowsocks = node.protocol === 'shadowsocks';

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {node.name}
              <Badge variant="outline" className="font-normal">
                {PROTOCOL_LABELS[node.protocol] || node.protocol}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2 mr-6">
              {node.isOnline ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  节点在线
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                  节点离线
                </span>
              )}
              <Badge variant={statusConfig.variant}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6">
          {/* 节点状态 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">节点状态</h3>
            <Separator className="mb-4" />
            <div className="space-y-4">
              {/* Status Bar */}
              <div className="flex flex-wrap items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {node.isOnline ? (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium text-green-600">在线</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
                      <span className="text-sm font-medium text-slate-500">离线</span>
                    </>
                  )}
                </div>
                {node.lastSeenAt && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>最后上线: {formatDate(node.lastSeenAt)}</span>
                    </div>
                  </>
                )}
                {node.systemStatus?.uptimeSeconds !== undefined && node.systemStatus.uptimeSeconds > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" />
                      <span>运行: {formatUptime(node.systemStatus.uptimeSeconds)}</span>
                    </div>
                  </>
                )}
                {node.systemStatus?.agentVersion && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      v{node.systemStatus.agentVersion}
                      {node.systemStatus.platform && node.systemStatus.arch && (
                        <span className="text-xs ml-1">
                          ({node.systemStatus.platform}/{node.systemStatus.arch})
                        </span>
                      )}
                    </span>
                  </>
                )}
              </div>

              {node.systemStatus && (
                <>
                  {/* Resource Usage */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* CPU */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium">CPU</span>
                        </div>
                        <span className="text-sm font-semibold">{(node.systemStatus.cpuPercent ?? 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={node.systemStatus.cpuPercent ?? 0} className="h-2">
                        <ProgressIndicator
                          className={getProgressColor(node.systemStatus.cpuPercent ?? 0)}
                          style={{ transform: `translateX(-${100 - (node.systemStatus.cpuPercent ?? 0)}%)` }}
                        />
                      </Progress>
                      {node.systemStatus.loadAvg1 !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          负载: {node.systemStatus.loadAvg1.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {/* Memory */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <MemoryStick className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium">内存</span>
                        </div>
                        <span className="text-sm font-semibold">{(node.systemStatus.memoryPercent ?? 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={node.systemStatus.memoryPercent ?? 0} className="h-2">
                        <ProgressIndicator
                          className={getProgressColor(node.systemStatus.memoryPercent ?? 0)}
                          style={{ transform: `translateX(-${100 - (node.systemStatus.memoryPercent ?? 0)}%)` }}
                        />
                      </Progress>
                      {(node.systemStatus.memoryUsed !== undefined && node.systemStatus.memoryTotal !== undefined) && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formatBytes(node.systemStatus.memoryUsed)} / {formatBytes(node.systemStatus.memoryTotal)}
                        </p>
                      )}
                    </div>
                    {/* Disk */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="h-4 w-4 text-orange-500" />
                          <span className="text-xs font-medium">磁盘</span>
                        </div>
                        <span className="text-sm font-semibold">{(node.systemStatus.diskPercent ?? 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={node.systemStatus.diskPercent ?? 0} className="h-2">
                        <ProgressIndicator
                          className={getProgressColor(node.systemStatus.diskPercent ?? 0)}
                          style={{ transform: `translateX(-${100 - (node.systemStatus.diskPercent ?? 0)}%)` }}
                        />
                      </Progress>
                      {(node.systemStatus.diskUsed !== undefined && node.systemStatus.diskTotal !== undefined) && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formatBytes(node.systemStatus.diskUsed)} / {formatBytes(node.systemStatus.diskTotal)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Network & IP Info */}
                  {(node.systemStatus.networkRxRate !== undefined || node.systemStatus.publicIpv4 || node.systemStatus.publicIpv6) && (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Network */}
                      {(node.systemStatus.networkRxRate !== undefined || node.systemStatus.tcpConnections !== undefined) && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Network className="h-4 w-4 text-indigo-500" />
                            <span className="text-xs font-medium">网络流量</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600">↓ {formatRate(node.systemStatus.networkRxRate ?? 0)}</span>
                            <span className="text-blue-600">↑ {formatRate(node.systemStatus.networkTxRate ?? 0)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            TCP {node.systemStatus.tcpConnections ?? 0} · UDP {node.systemStatus.udpConnections ?? 0}
                          </p>
                        </div>
                      )}
                      {/* Public IP */}
                      {(node.systemStatus.publicIpv4 || node.systemStatus.publicIpv6) && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Globe className="h-4 w-4 text-cyan-500" />
                            <span className="text-xs font-medium">公网 IP</span>
                          </div>
                          <div className="space-y-0.5 font-mono text-sm">
                            {node.systemStatus.publicIpv4 && <p>{node.systemStatus.publicIpv4}</p>}
                            {node.systemStatus.publicIpv6 && (
                              <p className="text-xs text-muted-foreground truncate" title={node.systemStatus.publicIpv6}>
                                {node.systemStatus.publicIpv6}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">节点ID</p>
                <TruncatedId id={node.id} fullWidth />
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">版本</p>
                <p className="text-sm">{node.version}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">排序顺序</p>
                <p className="text-sm">{node.sortOrder ?? 0}</p>
              </div>

              {node.region && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">地区</p>
                  <p className="text-sm">{node.region}</p>
                </div>
              )}

              {node.tags && node.tags.length > 0 && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">标签</p>
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

          {/* 连接信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">连接信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">服务器地址</p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                  {node.serverAddress}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">代理端口</p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                  {node.agentPort}
                </p>
              </div>
              {node.subscriptionPort && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">订阅端口</p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                    {node.subscriptionPort}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shadowsocks 配置 */}
          {isShadowsocks && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Shadowsocks 配置</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">加密方法</p>
                  <p className="text-sm font-mono">{node.encryptionMethod || '-'}</p>
                </div>

                {node.plugin && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">插件</p>
                    <p className="text-sm font-mono">{node.plugin}</p>
                  </div>
                )}

                {node.pluginOpts && Object.keys(node.pluginOpts).length > 0 && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">插件选项</p>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted p-3 rounded-md">
                      {JSON.stringify(node.pluginOpts, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trojan 配置 */}
          {isTrojan && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Trojan 配置</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">传输协议</p>
                  <p className="text-sm font-mono">
                    {TRANSPORT_LABELS[node.transportProtocol || 'tcp'] || node.transportProtocol?.toUpperCase() || 'TCP'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">TLS 安全</p>
                  <div className="flex items-center gap-1">
                    {node.allowInsecure ? (
                      <>
                        <ShieldAlert className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600">允许不安全连接</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">安全连接</span>
                      </>
                    )}
                  </div>
                </div>

                {node.sni && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">SNI</p>
                    <p className="text-sm font-mono">{node.sni}</p>
                  </div>
                )}

                {node.host && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {node.transportProtocol === 'grpc' ? 'gRPC 服务名' : 'Host'}
                    </p>
                    <p className="text-sm font-mono">{node.host}</p>
                  </div>
                )}

                {node.path && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">WebSocket 路径</p>
                    <p className="text-sm font-mono">{node.path}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 路由配置 */}
          {node.route && (
            <div>
              <h3 className="text-sm font-semibold mb-3">路由配置</h3>
              <Separator className="mb-4" />
              <RouteConfigDisplay config={node.route} nodes={nodes} />
            </div>
          )}

          {/* 维护信息 */}
          {node.status === 'maintenance' && node.maintenanceReason && (
            <div>
              <h3 className="text-sm font-semibold mb-3">维护信息</h3>
              <Separator className="mb-4" />
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {node.maintenanceReason}
                </p>
              </div>
            </div>
          )}

          {/* 时间信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">时间信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">创建时间</p>
                <p className="text-xs">{formatDate(node.createdAt)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">更新时间</p>
                <p className="text-xs">{formatDate(node.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
