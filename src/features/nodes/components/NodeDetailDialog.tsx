/**
 * 节点详情查看对话框
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
import type { Node } from '@/api/node';

interface NodeDetailDialogProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
}

// 状态标签映射
const STATUS_LABELS: Record<string, string> = {
  active: '激活',
  inactive: '未激活',
  maintenance: '维护中',
  error: '错误',
};

// 协议类型标签映射
const PROTOCOL_LABELS: Record<string, string> = {
  shadowsocks: 'Shadowsocks',
  trojan: 'Trojan',
};

// 格式化时间
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

// 格式化流量
const formatBytes = (bytes?: number) => {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

export const NodeDetailDialog: React.FC<NodeDetailDialogProps> = ({
  open,
  node,
  onClose,
}) => {
  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>节点详情</DialogTitle>
            <Badge
              variant={
                node.status === 'active'
                  ? 'default'
                  : node.status === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {STATUS_LABELS[node.status] || node.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">节点ID</p>
                <p className="text-sm">{node.id}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">节点名称</p>
                <p className="text-sm">{node.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">协议类型</p>
                <p className="text-sm">{PROTOCOL_LABELS[node.protocol] || node.protocol}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">加密方法</p>
                <p className="text-sm font-mono">{node.encryptionMethod}</p>
              </div>
            </div>
          </div>

          {/* 连接信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">连接信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm text-muted-foreground">服务器地址</p>
                <p className="text-sm font-mono">{node.serverAddress}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">端口</p>
                <p className="text-sm font-mono">{node.serverPort}</p>
              </div>

              {node.region && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">地区</p>
                  <p className="text-sm">{node.region}</p>
                </div>
              )}
            </div>
          </div>

          {/* 插件信息 */}
          {(node.plugin || node.pluginOpts) && (
            <div>
              <h3 className="text-sm font-semibold mb-3">插件信息</h3>
              <Separator className="mb-4" />
              <div className="space-y-4">
                {node.plugin && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">插件</p>
                    <p className="text-sm font-mono">{node.plugin}</p>
                  </div>
                )}

                {node.pluginOpts && Object.keys(node.pluginOpts).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">插件选项</p>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted p-3 rounded-md">
                      {JSON.stringify(node.pluginOpts, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 流量信息 */}
          {(node.trafficLimit || node.trafficUsed) && (
            <div>
              <h3 className="text-sm font-semibold mb-3">流量信息</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {node.trafficLimit && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">流量限制</p>
                    <p className="text-sm">{formatBytes(node.trafficLimit)}</p>
                  </div>
                )}

                {node.trafficUsed !== undefined && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">已使用流量</p>
                    <p className="text-sm">{formatBytes(node.trafficUsed)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 其他信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">其他信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {node.description && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">描述</p>
                  <p className="text-sm">{node.description}</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">排序顺序</p>
                <p className="text-sm">{node.sortOrder ?? 0}</p>
              </div>

              {node.tags && node.tags.length > 0 && (
                <div className="space-y-1">
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

          {/* 时间信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">时间信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">创建时间</p>
                <p className="text-xs">{formatDate(node.createdAt)}</p>
              </div>

              {node.updatedAt && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">更新时间</p>
                  <p className="text-xs">{formatDate(node.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
