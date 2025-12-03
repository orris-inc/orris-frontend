/**
 * 管理节点组中的节点对话框组件
 */

import { useState } from 'react';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { Combobox, type ComboboxOption } from '@/components/common/Combobox';
import type { NodeGroup, Node } from '@/api/node';
import { useNodeGroups, useNodeGroupNodes } from '../hooks/useNodeGroups';
import { useNodes } from '@/features/nodes/hooks/useNodes';

interface ManageGroupNodesDialogProps {
  open: boolean;
  group: NodeGroup | null;
  onClose: () => void;
}

export const ManageGroupNodesDialog = ({
  open,
  group,
  onClose,
}: ManageGroupNodesDialogProps) => {
  const { addNodesToGroup, removeNodesFromGroup } = useNodeGroups();
  const { nodes: groupNodes, isLoading: groupNodesLoading } = useNodeGroupNodes(open && group ? group.id : null);
  const { nodes, isLoading: nodesLoading } = useNodes({ enabled: open });

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const loading = groupNodesLoading || nodesLoading || processing;

  // 获取可添加的节点（排除已在组中的节点）
  const availableNodes = nodes.filter(
    (node) => !groupNodes.some((gn) => gn.id === node.id)
  );

  // 将节点转换为 Combobox 选项格式
  const comboboxOptions: ComboboxOption[] = availableNodes.map((node) => ({
    value: String(node.id),
    label: `${node.name} (${node.serverAddress}:${node.serverPort})`,
  }));

  const handleRemoveNode = async (nodeId: number | string) => {
    if (!group) return;

    if (window.confirm('确认要从该节点组中移除此节点吗？')) {
      setProcessing(true);
      try {
        await removeNodesFromGroup(group.id, [Number(nodeId)]);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleAddNodes = async () => {
    if (!group || selectedNodeIds.length === 0) return;

    setProcessing(true);
    try {
      const nodeIds = selectedNodeIds.map((id) => Number(id));
      await addNodesToGroup(group.id, nodeIds);
      setSelectedNodeIds([]);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedNodeIds([]);
    onClose();
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>管理节点组节点 - {group.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* 添加节点区域 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">添加节点</h3>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Combobox
                  options={comboboxOptions}
                  value={selectedNodeIds}
                  onChange={(value) => setSelectedNodeIds(value as string[])}
                  placeholder="选择要添加的节点"
                  searchPlaceholder="搜索节点..."
                  emptyText="未找到可用节点"
                  multiple
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleAddNodes}
                disabled={selectedNodeIds.length === 0 || loading}
                className="min-w-[100px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加
              </Button>
            </div>
            {availableNodes.length === 0 && !nodesLoading && (
              <Alert variant="info" className="mt-2">
                所有节点都已添加到此节点组
              </Alert>
            )}
          </div>

          <Separator />

          {/* 当前节点列表 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              当前节点 ({groupNodes.length})
            </h3>
            {groupNodesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : groupNodes.length > 0 ? (
              <ul className="max-h-[400px] overflow-auto space-y-2">
                {groupNodes.map((node: Node) => (
                  <li
                    key={node.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{node.name}</span>
                        <Badge
                          variant={node.status === 'active' ? 'default' : 'secondary'}
                        >
                          {node.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {node.serverAddress}:{node.serverPort} - {node.protocol}
                        {node.region && ` - ${node.region}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveNode(node.id)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  该节点组暂无节点
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
