/**
 * 转发规则详情查看对话框
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
import type { ForwardRule } from '@/api/forward';

interface ForwardRuleDetailDialogProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
}

// 状态标签映射
const STATUS_LABELS: Record<string, string> = {
  enabled: '已启用',
  disabled: '已禁用',
};

// 协议类型标签映射
const PROTOCOL_LABELS: Record<string, string> = {
  tcp: 'TCP',
  udp: 'UDP',
  both: 'TCP/UDP',
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
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

export const ForwardRuleDetailDialog: React.FC<ForwardRuleDetailDialogProps> = ({
  open,
  rule,
  onClose,
}) => {
  if (!rule) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>转发规则详情</DialogTitle>
            <Badge
              variant={rule.status === 'enabled' ? 'default' : 'secondary'}
            >
              {STATUS_LABELS[rule.status] || rule.status}
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
                <p className="text-sm text-muted-foreground">规则ID</p>
                <p className="text-sm">{rule.id}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">规则名称</p>
                <p className="text-sm">{rule.name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">协议类型</p>
                <p className="text-sm">{PROTOCOL_LABELS[rule.protocol] || rule.protocol}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">状态</p>
                <p className="text-sm">{STATUS_LABELS[rule.status] || rule.status}</p>
              </div>
            </div>
          </div>

          {/* 端口配置 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">端口配置</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">监听端口</p>
                <p className="text-sm font-mono">{rule.listenPort}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">目标端口</p>
                <p className="text-sm font-mono">{rule.targetPort}</p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <p className="text-sm text-muted-foreground">目标地址</p>
                <p className="text-sm font-mono">{rule.targetAddress}</p>
              </div>
            </div>
          </div>

          {/* 流量统计 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">流量统计</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">上传流量</p>
                <p className="text-sm">{formatBytes(rule.uploadBytes)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">下载流量</p>
                <p className="text-sm">{formatBytes(rule.downloadBytes)}</p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <p className="text-sm text-muted-foreground">总流量</p>
                <p className="text-sm">
                  {formatBytes((rule.uploadBytes || 0) + (rule.downloadBytes || 0))}
                </p>
              </div>
            </div>
          </div>

          {/* 其他信息 */}
          {rule.remark && (
            <div>
              <h3 className="text-sm font-semibold mb-3">其他信息</h3>
              <Separator className="mb-4" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">备注</p>
                <p className="text-sm">{rule.remark}</p>
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
                <p className="text-xs">{formatDate(rule.createdAt)}</p>
              </div>

              {rule.updatedAt && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">更新时间</p>
                  <p className="text-xs">{formatDate(rule.updatedAt)}</p>
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
