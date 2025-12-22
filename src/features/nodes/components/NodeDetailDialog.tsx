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
import { TruncatedId } from '@/components/admin';
import { Cpu, MemoryStick, HardDrive, Clock, ShieldCheck, ShieldAlert, Wifi, WifiOff, Globe } from 'lucide-react';
import type { Node } from '@/api/node';

interface NodeDetailDialogProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
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

export const NodeDetailDialog: React.FC<NodeDetailDialogProps> = ({
  open,
  node,
  onClose,
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                {node.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-slate-400" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">连接状态</p>
                  <p className={`text-sm font-medium ${node.isOnline ? 'text-green-600' : 'text-slate-500'}`}>
                    {node.isOnline ? '节点在线' : '节点离线'}
                  </p>
                </div>
              </div>
              {node.lastSeenAt && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">最后上线</p>
                    <p className="text-sm font-medium">{formatDate(node.lastSeenAt)}</p>
                  </div>
                </div>
              )}
              {node.systemStatus && (
                <>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">CPU</p>
                      <p className="text-sm font-medium">{node.systemStatus.cpu}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <MemoryStick className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">内存</p>
                      <p className="text-sm font-medium">{node.systemStatus.memory}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <HardDrive className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">磁盘</p>
                      <p className="text-sm font-medium">{node.systemStatus.disk}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">运行时间</p>
                      <p className="text-sm font-medium">{formatUptime(node.systemStatus.uptime)}</p>
                    </div>
                  </div>
                  {(node.systemStatus.publicIpv4 || node.systemStatus.publicIpv6) && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Globe className="h-4 w-4 text-cyan-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">公网 IP</p>
                        <div className="text-sm font-medium font-mono">
                          {node.systemStatus.publicIpv4 && <p>{node.systemStatus.publicIpv4}</p>}
                          {node.systemStatus.publicIpv6 && <p className="text-xs">{node.systemStatus.publicIpv6}</p>}
                        </div>
                      </div>
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
