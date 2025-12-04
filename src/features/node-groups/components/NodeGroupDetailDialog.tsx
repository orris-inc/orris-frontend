/**
 * 节点组详情对话框组件
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
import type { NodeGroup, GroupNode } from '@/api/node';
import { formatDateTime } from '@/shared/utils/date-utils';
import { useNodeGroupNodes } from '../hooks/useNodeGroups';
import { Loader2 } from 'lucide-react';

interface NodeGroupDetailDialogProps {
  open: boolean;
  group: NodeGroup | null;
  onClose: () => void;
}

export const NodeGroupDetailDialog = ({
  open,
  group,
  onClose,
}: NodeGroupDetailDialogProps) => {
  const { nodes: groupNodes, isLoading } = useNodeGroupNodes(open && group ? group.id : null);

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>节点组详情</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">基本信息</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ID:</span>
                <span className="text-sm">{group.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">名称:</span>
                <span className="text-sm font-medium">{group.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">描述:</span>
                <span className="text-sm">{group.description || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">公开性:</span>
                <Badge variant={group.isPublic ? 'default' : 'secondary'}>
                  {group.isPublic ? '公开' : '私有'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">排序顺序:</span>
                <span className="text-sm">{group.sortOrder ?? '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">创建时间:</span>
                <span className="text-sm">{formatDateTime(group.createdAt)}</span>
              </div>
              {group.updatedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">更新时间:</span>
                  <span className="text-sm">{formatDateTime(group.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 关联节点 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              关联节点 ({groupNodes.length})
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : groupNodes.length > 0 ? (
              <ul className="max-h-[300px] overflow-auto space-y-2">
                {groupNodes.map((node: GroupNode) => (
                  <li
                    key={node.id}
                    className="flex items-center justify-between py-2 px-3 border-b last:border-b-0"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{node.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {node.serverAddress}:{node.agentPort}
                        {node.region && ` - ${node.region}`}
                      </span>
                    </div>
                    <Badge variant={node.status === 'active' ? 'default' : 'secondary'}>
                      {node.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无关联节点
              </p>
            )}
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
