/**
 * 计划节点管理对话框
 * 用于绑定/解绑计划关联的节点
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  Server,
  Search,
  Plus,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/common/Dialog';
import { ScrollArea } from '@/components/common/ScrollArea';
import { Separator } from '@/components/common/Separator';
import { Checkbox } from '@/components/common/Checkbox';
import { AdminBadge, AdminButton } from '@/components/admin';
import { cn } from '@/lib/utils';
import { usePlanNodes } from '../hooks/usePlanNodes';
import { useNodes } from '@/features/nodes/hooks/useNodes';
import type { SubscriptionPlan, PlanNode } from '@/api/subscription/types';
import type { Node } from '@/api/node/types';

interface PlanNodesDialogProps {
  open: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
}

// 节点状态配置
const NODE_STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  active: { label: '在线', variant: 'success' },
  inactive: { label: '离线', variant: 'default' },
  maintenance: { label: '维护', variant: 'warning' },
};

export const PlanNodesDialog: React.FC<PlanNodesDialogProps> = ({
  open,
  onClose,
  plan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  // 获取计划绑定的节点
  const {
    nodes: boundNodes,
    isLoading: isBoundNodesLoading,
    bindNodes,
    unbindNodes,
    isBinding,
    isUnbinding,
  } = usePlanNodes({ planId: plan?.id ?? null, enabled: open && plan !== null });

  // 获取所有节点
  const { nodes: allNodes, isLoading: isAllNodesLoading } = useNodes({
    pageSize: 1000,
    enabled: open && showAddPanel,
  });

  // 重置状态
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setShowAddPanel(false);
      setSelectedNodeIds(new Set());
    }
  }, [open]);

  // 已绑定节点的 ID 集合（转换为 string 以匹配 Node.id 类型）
  const boundNodeIds = useMemo(() => {
    return new Set(boundNodes.map((n) => String(n.id)));
  }, [boundNodes]);

  // 可添加的节点（排除已绑定的）
  const availableNodes = useMemo(() => {
    return allNodes.filter((n) => !boundNodeIds.has(n.id));
  }, [allNodes, boundNodeIds]);

  // 过滤已绑定的节点
  const filteredBoundNodes = useMemo(() => {
    if (!searchQuery.trim()) return boundNodes;
    const query = searchQuery.toLowerCase();
    return boundNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(query) ||
        n.serverAddress.toLowerCase().includes(query)
    );
  }, [boundNodes, searchQuery]);

  // 过滤可添加的节点
  const filteredAvailableNodes = useMemo(() => {
    if (!searchQuery.trim()) return availableNodes;
    const query = searchQuery.toLowerCase();
    return availableNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(query) ||
        n.serverAddress.toLowerCase().includes(query)
    );
  }, [availableNodes, searchQuery]);

  // 切换节点选择
  const toggleNodeSelection = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedNodeIds.size === filteredAvailableNodes.length) {
      setSelectedNodeIds(new Set());
    } else {
      setSelectedNodeIds(new Set(filteredAvailableNodes.map((n) => n.id)));
    }
  };

  // 绑定选中的节点
  const handleBindNodes = async () => {
    if (selectedNodeIds.size === 0) return;
    try {
      await bindNodes(Array.from(selectedNodeIds));
      setSelectedNodeIds(new Set());
      setShowAddPanel(false);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  // 解绑单个节点
  const handleUnbindNode = async (nodeId: number | string) => {
    try {
      await unbindNodes([String(nodeId)]);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  const isLoading = isBoundNodesLoading || (showAddPanel && isAllNodesLoading);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* 头部 */}
        <div className="px-6 py-5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
              <Server className="size-5" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                节点管理
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                管理计划「
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {plan?.name}
                </span>
                」可访问的节点
              </DialogDescription>
            </div>
          </div>
        </div>

        <Separator />

        {/* 工具栏 */}
        <div className="px-6 py-4 flex items-center justify-between gap-4 bg-white dark:bg-slate-900">
          {/* 统计徽章 */}
          <div className="flex items-center gap-2">
            <AdminBadge variant="info" size="md">
              <Server className="mr-1.5 size-3.5" strokeWidth={2} />
              {boundNodes.length} 个节点
            </AdminBadge>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {/* 搜索框 */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                strokeWidth={2}
              />
              <input
                type="text"
                placeholder="搜索节点..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-48 h-9 pl-9 pr-3 rounded-lg text-sm',
                  'bg-slate-100 dark:bg-slate-800',
                  'border border-transparent',
                  'text-slate-900 dark:text-white placeholder:text-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500',
                  'transition-all duration-200'
                )}
              />
            </div>

            {!showAddPanel && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus className="size-4" strokeWidth={1.5} />}
                onClick={() => setShowAddPanel(true)}
              >
                添加节点
              </AdminButton>
            )}
          </div>
        </div>

        <Separator />

        {/* 内容区域 */}
        <ScrollArea className="h-[380px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="relative">
                <Loader2
                  className="size-10 animate-spin text-emerald-500"
                  strokeWidth={2}
                />
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                加载中...
              </p>
            </div>
          ) : showAddPanel ? (
            /* 添加节点面板 */
            <div className="p-4">
              {/* 提示信息 */}
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    选择要添加到此计划的节点，订阅该计划的用户将可以访问这些节点。
                  </p>
                </div>
              </div>

              {/* 全选操作 */}
              {filteredAvailableNodes.length > 0 && (
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Checkbox
                      checked={
                        selectedNodeIds.size === filteredAvailableNodes.length &&
                        filteredAvailableNodes.length > 0
                      }
                    />
                    <span>
                      {selectedNodeIds.size === filteredAvailableNodes.length
                        ? '取消全选'
                        : '全选'}
                    </span>
                  </button>
                  <span className="text-xs text-slate-400">
                    已选择 {selectedNodeIds.size} 个
                  </span>
                </div>
              )}

              {/* 可用节点列表 */}
              {filteredAvailableNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Server className="size-6 text-slate-400" strokeWidth={1.5} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {searchQuery ? '未找到匹配的节点' : '没有可添加的节点'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {searchQuery
                      ? '尝试使用不同的关键词搜索'
                      : '所有节点都已添加到此计划'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableNodes.map((node) => (
                    <NodeSelectItem
                      key={node.id}
                      node={node}
                      selected={selectedNodeIds.has(node.id)}
                      onToggle={() => toggleNodeSelection(node.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : filteredBoundNodes.length === 0 ? (
            /* 空状态 */
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="relative">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner">
                  {searchQuery ? (
                    <Search className="size-7 text-slate-400" strokeWidth={1.5} />
                  ) : (
                    <Server className="size-7 text-slate-400" strokeWidth={1.5} />
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-200/20 to-transparent dark:from-slate-700/20 blur-xl -z-10" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                {searchQuery ? '未找到匹配的节点' : '暂无关联节点'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {searchQuery
                  ? '尝试使用不同的关键词搜索'
                  : '点击"添加节点"按钮添加节点'}
              </p>
            </div>
          ) : (
            /* 已绑定节点列表 */
            <div className="p-4 space-y-2">
              {filteredBoundNodes.map((node) => (
                <BoundNodeItem
                  key={node.id}
                  node={node}
                  onUnbind={() => handleUnbindNode(node.id)}
                  isUnbinding={isUnbinding}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* 底部 */}
        <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/30">
          <div className="text-xs text-slate-400">
            {searchQuery &&
              !showAddPanel &&
              filteredBoundNodes.length !== boundNodes.length && (
                <span>
                  筛选结果：{filteredBoundNodes.length} / {boundNodes.length}
                </span>
              )}
          </div>
          <div className="flex items-center gap-2">
            {showAddPanel ? (
              <>
                <button
                  onClick={() => {
                    setShowAddPanel(false);
                    setSelectedNodeIds(new Set());
                    setSearchQuery('');
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium',
                    'bg-slate-100 dark:bg-slate-800',
                    'text-slate-700 dark:text-slate-300',
                    'hover:bg-slate-200 dark:hover:bg-slate-700',
                    'active:scale-[0.98]',
                    'transition-all duration-200'
                  )}
                >
                  取消
                </button>
                <AdminButton
                  variant="primary"
                  size="md"
                  icon={<Check className="size-4" strokeWidth={1.5} />}
                  onClick={handleBindNodes}
                  disabled={selectedNodeIds.size === 0}
                  loading={isBinding}
                >
                  确认添加 ({selectedNodeIds.size})
                </AdminButton>
              </>
            ) : (
              <button
                onClick={onClose}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  'bg-slate-100 dark:bg-slate-800',
                  'text-slate-700 dark:text-slate-300',
                  'hover:bg-slate-200 dark:hover:bg-slate-700',
                  'active:scale-[0.98]',
                  'transition-all duration-200'
                )}
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 可选择的节点项
interface NodeSelectItemProps {
  node: Node;
  selected: boolean;
  onToggle: () => void;
}

const NodeSelectItem: React.FC<NodeSelectItemProps> = ({
  node,
  selected,
  onToggle,
}) => {
  const statusConfig = NODE_STATUS_CONFIG[node.status] || {
    label: node.status,
    variant: 'default' as const,
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full group relative rounded-xl border p-4 text-left',
        'transition-all duration-200',
        selected
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
          : 'bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-200 dark:hover:border-emerald-800/60'
      )}
    >
      <div className="flex items-center gap-4">
        <Checkbox checked={selected} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {node.name}
            </span>
            <AdminBadge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </AdminBadge>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono">{node.serverAddress}</span>
            <span className="uppercase">{node.protocol}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

// 已绑定的节点项
interface BoundNodeItemProps {
  node: PlanNode;
  onUnbind: () => void;
  isUnbinding: boolean;
}

const BoundNodeItem: React.FC<BoundNodeItemProps> = ({
  node,
  onUnbind,
  isUnbinding,
}) => {
  const statusConfig = NODE_STATUS_CONFIG[node.status] || {
    label: node.status,
    variant: 'default' as const,
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border p-4',
        'bg-white dark:bg-slate-800/50',
        'border-slate-200/80 dark:border-slate-700/80',
        'hover:border-slate-300 dark:hover:border-slate-600',
        'transition-all duration-200'
      )}
    >
      <div className="flex items-center gap-4">
        {/* 图标 */}
        <div className="flex items-center justify-center size-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/30 shrink-0">
          <Server
            className="size-5 text-emerald-600 dark:text-emerald-400"
            strokeWidth={1.5}
          />
        </div>

        {/* 主要信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {node.name}
            </span>
            <AdminBadge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </AdminBadge>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono">{node.serverAddress}</span>
            <span className="uppercase">{node.protocol}</span>
          </div>
        </div>

        {/* 解绑按钮 */}
        <button
          onClick={onUnbind}
          disabled={isUnbinding}
          className={cn(
            'shrink-0 p-2 rounded-lg',
            'text-slate-400 hover:text-red-500 dark:hover:text-red-400',
            'hover:bg-red-50 dark:hover:bg-red-900/20',
            'opacity-0 group-hover:opacity-100',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
          title="解除绑定"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};
