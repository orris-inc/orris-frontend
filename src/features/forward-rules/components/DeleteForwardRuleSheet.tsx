/**
 * Delete Forward Rule Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming forward rule deletion
 */

import { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  Loader2,
  ArrowLeftRight,
  Server,
  Activity,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/Sheet';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type { ForwardRule, ForwardAgent } from '@/api/forward';

interface DeleteForwardRuleSheetProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  agentsMap?: Record<string, ForwardAgent>;
}

// Rule type labels
const RULE_TYPE_LABELS: Record<string, string> = {
  direct: '直连转发',
  entry: '入口节点',
  chain: '隧道链式',
  direct_chain: '直连链式',
};

export const DeleteForwardRuleSheet: React.FC<DeleteForwardRuleSheetProps> = ({
  open,
  rule,
  onClose,
  onConfirm,
  agentsMap = {},
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!rule) return null;

  const agent = agentsMap[rule.agentId];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="size-5 text-destructive" />
            </div>
            <span>删除规则</span>
          </SheetTitle>
          <SheetDescription>
            此操作不可恢复，请确认是否继续
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-6">
          {/* Warning Card */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">确认删除以下转发规则？</p>
                <p className="text-sm text-muted-foreground">
                  删除后，该规则的所有配置将被永久移除，正在使用此规则的连接将被中断。
                </p>
              </div>
            </div>

            {/* Rule Info */}
            <div className="rounded-lg bg-background p-4 space-y-3">
              {/* Rule Name */}
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                  <ArrowLeftRight className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{rule.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {rule.listenPort ? `:${rule.listenPort}` : '自动分配'} → {rule.targetAddress || rule.targetNodeId}:{rule.targetPort}
                  </p>
                </div>
              </div>

              {/* Rule Details */}
              <div className="flex flex-wrap gap-2">
                {/* Rule Type */}
                <Badge variant="outline" className="text-xs">
                  {RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}
                </Badge>

                {/* Protocol */}
                <Badge variant="secondary" className="text-xs">
                  {rule.protocol.toUpperCase()}
                </Badge>

                {/* Status */}
                <Badge
                  variant={rule.status === 'enabled' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {rule.status === 'enabled' ? '已启用' : '已禁用'}
                </Badge>

                {/* Run Status */}
                {rule.runStatus === 'running' && (
                  <Badge variant="default" className="text-xs">
                    <Activity className="size-3 mr-1" />
                    运行中
                  </Badge>
                )}
              </div>

              {/* Agent Info */}
              {agent && (
                <div className="flex items-center gap-2 pt-1">
                  <Server className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    转发节点: {agent.name}
                  </span>
                </div>
              )}

              {/* Traffic Stats */}
              {(rule.uploadBytes > 0 || rule.downloadBytes > 0) && (
                <div className="text-xs text-muted-foreground pt-1">
                  已使用流量: ↑{formatBytes(rule.uploadBytes)} ↓{formatBytes(rule.downloadBytes)}
                </div>
              )}
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full min-h-[52px] text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
