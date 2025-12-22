/**
 * 转发节点详情查看对话框
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
import { Cpu, HardDrive, MemoryStick, Clock, Network, ArrowUpDown, Loader2 } from 'lucide-react';
import { useForwardAgentRuntimeStatus } from '../hooks/useForwardAgents';
import type { ForwardAgent } from '@/api/forward';

interface ForwardAgentDetailDialogProps {
  open: boolean;
  agent: ForwardAgent | null;
  onClose: () => void;
}

// Format date
const formatDate = (dateString?: string) => {
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

// Format bytes
const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

// Format uptime
const formatUptime = (seconds?: number) => {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${minutes}分钟`;
};

export const ForwardAgentDetailDialog: React.FC<ForwardAgentDetailDialogProps> = ({
  open,
  agent,
  onClose,
}) => {
  // Get runtime status
  const { runtimeStatus, isLoading: isLoadingStatus } = useForwardAgentRuntimeStatus(
    open && agent?.status === 'enabled' ? agent.id : null
  );

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>转发节点详情</DialogTitle>
            <Badge
              variant={agent.status === 'enabled' ? 'default' : 'secondary'}
            >
              {agent.status === 'enabled' ? '启用' : '禁用'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">节点ID</p>
                <TruncatedId id={agent.id} fullWidth />
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">节点名称</p>
                <p className="text-sm">{agent.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">状态</p>
                <p className="text-sm">
                  {agent.status === 'enabled' ? '启用' : '禁用'}
                </p>
              </div>

              {agent.publicAddress && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">公网地址</p>
                  <p className="text-sm font-mono">{agent.publicAddress}</p>
                </div>
              )}

              {agent.tunnelAddress && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">隧道地址</p>
                  <p className="text-sm font-mono">{agent.tunnelAddress}</p>
                </div>
              )}
            </div>
          </div>

          {/* 运行时状态 */}
          {agent.status === 'enabled' && (
            <div>
              <h3 className="text-sm font-semibold mb-3">运行状态</h3>
              <Separator className="mb-4" />
              {isLoadingStatus ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : runtimeStatus ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* CPU */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <Cpu className="size-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">CPU</p>
                      <p className="text-sm font-medium">{runtimeStatus.cpuPercent.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* 内存 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <MemoryStick className="size-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">内存</p>
                      <p className="text-sm font-medium">
                        {runtimeStatus.memoryPercent.toFixed(1)}%
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatBytes(runtimeStatus.memoryUsed)})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 磁盘 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <HardDrive className="size-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">磁盘</p>
                      <p className="text-sm font-medium">
                        {runtimeStatus.diskPercent.toFixed(1)}%
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatBytes(runtimeStatus.diskUsed)})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 运行时间 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <Clock className="size-5 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">运行时间</p>
                      <p className="text-sm font-medium">{formatUptime(runtimeStatus.uptimeSeconds)}</p>
                    </div>
                  </div>

                  {/* 网络连接 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <Network className="size-5 text-cyan-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">网络连接</p>
                      <p className="text-sm font-medium">
                        TCP: {runtimeStatus.tcpConnections} / UDP: {runtimeStatus.udpConnections}
                      </p>
                    </div>
                  </div>

                  {/* 转发状态 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <ArrowUpDown className="size-5 text-pink-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">转发</p>
                      <p className="text-sm font-medium">
                        规则: {runtimeStatus.activeRules} / 连接: {runtimeStatus.activeConnections}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无运行状态数据
                </p>
              )}
            </div>
          )}

          {/* 备注信息 */}
          {agent.remark && (
            <div>
              <h3 className="text-sm font-semibold mb-3">备注</h3>
              <Separator className="mb-4" />
              <div className="space-y-1">
                <p className="text-sm">{agent.remark}</p>
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
                <p className="text-xs">{formatDate(agent.createdAt)}</p>
              </div>

              {agent.updatedAt && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">更新时间</p>
                  <p className="text-xs">{formatDate(agent.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Token说明 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Token说明</h3>
            <Separator className="mb-4" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Token仅在创建节点或重新生成时完整显示一次</p>
              <p>• 请妥善保存Token，丢失后需要重新生成</p>
              <p>• 重新生成Token后，旧Token将立即失效</p>
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
