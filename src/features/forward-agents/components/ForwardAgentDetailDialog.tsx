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
import type { ForwardAgent } from '@/api/forward';

interface ForwardAgentDetailDialogProps {
  open: boolean;
  agent: ForwardAgent | null;
  onClose: () => void;
}

// 格式化时间
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

export const ForwardAgentDetailDialog: React.FC<ForwardAgentDetailDialogProps> = ({
  open,
  agent,
  onClose,
}) => {
  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>转发节点详情</DialogTitle>
            <Badge
              variant={agent.status === 'enabled' ? 'default' : 'secondary'}
            >
              {agent.status === 'enabled' ? '启用' : '禁用'}
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
                <p className="text-sm font-mono">{agent.id}</p>
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
            </div>
          </div>

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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
