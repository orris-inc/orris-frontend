/**
 * 管理订阅计划-节点组绑定对话框
 * 使用 Radix UI 优化设计
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Network, Search, Link as LinkIcon, Unlink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/common/Dialog';
import { Checkbox } from '@/components/common/Checkbox';
import { ScrollArea } from '@/components/common/ScrollArea';
import { Separator } from '@/components/common/Separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { getButtonClass, getBadgeClass, inputStyles } from '@/lib/ui-styles';
import { getNodeGroups, getNodeGroupById, associatePlanToGroup, dissociatePlanFromGroup } from '@/features/node-groups/api/node-groups-api';
import type { NodeGroupListItem } from '@/features/node-groups/types/node-groups.types';
import type { SubscriptionPlan } from '../types/subscription-plans.types';

interface ManagePlanNodeGroupsDialogProps {
  open: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
}

interface NodeGroupWithBinding extends NodeGroupListItem {
  isBound: boolean;
  isLoading: boolean;
}

export const ManagePlanNodeGroupsDialog: React.FC<ManagePlanNodeGroupsDialogProps> = ({
  open,
  onClose,
  plan,
}) => {
  const [nodeGroups, setNodeGroups] = useState<NodeGroupWithBinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载节点组列表和绑定状态
  const loadNodeGroups = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      // 获取所有节点组
      const response = await getNodeGroups({ page: 1, page_size: 100 });
      const groups = response.items || [];

      // 初始化节点组列表
      const groupsWithBinding: NodeGroupWithBinding[] = groups.map(group => ({
        ...group,
        isBound: false,
        isLoading: true,
      }));
      setNodeGroups(groupsWithBinding);

      // 异步检查每个节点组的绑定状态
      await Promise.all(
        groups.map(async (group, index) => {
          try {
            const detail = await getNodeGroupById(group.id);
            const isBound = detail.subscription_plan_ids?.includes(plan.ID) || false;

            setNodeGroups(prev => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                isBound,
                isLoading: false,
              };
              return updated;
            });
          } catch (error) {
            console.error(`Failed to load details for group ${group.id}:`, error);
            setNodeGroups(prev => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                isLoading: false,
              };
              return updated;
            });
          }
        })
      );
    } catch (error: any) {
      console.error('Failed to load node groups:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理绑定/解绑操作
  const handleToggleBinding = async (groupId: number, currentlyBound: boolean) => {
    if (!plan) return;

    setSubmitting(true);
    try {
      if (currentlyBound) {
        await dissociatePlanFromGroup(groupId, plan.ID);
      } else {
        await associatePlanToGroup(groupId, plan.ID);
      }

      // 更新本地状态
      setNodeGroups(prev =>
        prev.map(g =>
          g.id === groupId ? { ...g, isBound: !currentlyBound } : g
        )
      );
    } catch (error: any) {
      console.error('Failed to toggle binding:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 全选/取消全选
  const handleToggleAll = async () => {
    if (!plan || submitting) return;

    const filteredGroups = filteredNodeGroups;
    const allBound = filteredGroups.every(g => g.isBound);

    setSubmitting(true);
    try {
      await Promise.all(
        filteredGroups.map(async (group) => {
          if (allBound && group.isBound) {
            // 全部解绑
            await dissociatePlanFromGroup(group.id, plan.ID);
          } else if (!allBound && !group.isBound) {
            // 全部绑定
            await associatePlanToGroup(group.id, plan.ID);
          }
        })
      );

      // 更新本地状态
      setNodeGroups(prev =>
        prev.map(g => {
          if (filteredGroups.some(fg => fg.id === g.id)) {
            return { ...g, isBound: !allBound };
          }
          return g;
        })
      );
    } catch (error: any) {
      console.error('Failed to toggle all bindings:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 当对话框打开时加载数据
  useEffect(() => {
    if (open && plan) {
      loadNodeGroups();
      setSearchQuery('');
    }
  }, [open, plan]);

  // 过滤节点组
  const filteredNodeGroups = useMemo(() => {
    if (!searchQuery.trim()) return nodeGroups;

    const query = searchQuery.toLowerCase();
    return nodeGroups.filter(
      group =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
    );
  }, [nodeGroups, searchQuery]);

  // 统计信息
  const boundCount = nodeGroups.filter(g => g.isBound).length;
  const filteredBoundCount = filteredNodeGroups.filter(g => g.isBound).length;
  const allFilteredBound = filteredNodeGroups.length > 0 && filteredNodeGroups.every(g => g.isBound);
  const someFilteredBound = filteredNodeGroups.some(g => g.isBound) && !allFilteredBound;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="flex items-center gap-2">
          <Network className="size-5" />
          <DialogTitle>管理节点组绑定</DialogTitle>
        </div>
        <DialogDescription>
          为订阅计划 <span className="font-semibold text-foreground">{plan?.Name}</span> 管理节点组关联
        </DialogDescription>

        <Separator />

        <div className="space-y-4">
          {/* 统计信息和搜索 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className={getBadgeClass('secondary', 'text-sm')}>
                <LinkIcon className="mr-1 size-3" />
                已绑定 {boundCount} / {nodeGroups.length}
              </span>
              {searchQuery && filteredNodeGroups.length !== nodeGroups.length && (
                <span className={getBadgeClass('outline', 'text-sm')}>
                  筛选结果 {filteredNodeGroups.length} 项
                </span>
              )}
            </div>

            {/* 搜索框 */}
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <input
                placeholder="搜索节点组..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputStyles} pl-8`}
              />
            </div>
          </div>

          {/* 快捷操作 */}
          {filteredNodeGroups.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allFilteredBound ? true : someFilteredBound ? "indeterminate" : false}
                  onCheckedChange={handleToggleAll}
                  disabled={loading || submitting}
                />
                <span className="text-sm font-medium">
                  {allFilteredBound ? '取消全选' : '全选当前列表'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {filteredBoundCount > 0 && (
                  <span>当前列表已选 {filteredBoundCount} 项</span>
                )}
              </div>
            </div>
          )}

          {/* 节点组列表 */}
          <ScrollArea className="h-[350px] rounded-md border">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-2 size-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">加载中...</p>
                </div>
              </div>
            ) : filteredNodeGroups.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  {searchQuery ? (
                    <>
                      <Search className="mx-auto mb-2 size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">未找到匹配的节点组</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        尝试使用不同的关键词搜索
                      </p>
                    </>
                  ) : (
                    <>
                      <Network className="mx-auto mb-2 size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">暂无节点组</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        请先创建节点组
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {filteredNodeGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`
                      group relative flex items-center gap-3 rounded-lg border p-3 transition-colors
                      ${group.isBound ? 'border-primary/50 bg-primary/5' : 'hover:bg-accent/50'}
                    `}
                  >
                    <Checkbox
                      checked={group.isBound}
                      disabled={group.isLoading || submitting}
                      onCheckedChange={() =>
                        handleToggleBinding(group.id, group.isBound)
                      }
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{group.name}</span>
                        {group.is_public && (
                          <span className={getBadgeClass('outline', 'text-xs shrink-0')}>
                            公开
                          </span>
                        )}
                        {group.isBound && (
                          <Tooltip>
                            <TooltipTrigger>
                              <LinkIcon className="size-3 text-primary shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>已绑定</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {group.description}
                        </p>
                      )}
                      {group.node_count !== undefined && group.node_count > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          包含 {group.node_count} 个节点
                        </p>
                      )}
                    </div>

                    {group.isLoading && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />
                    )}

                    {/* 快捷操作按钮 */}
                    {!group.isLoading && !submitting && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className={getButtonClass('ghost', 'sm', 'h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0')}
                            onClick={() => handleToggleBinding(group.id, group.isBound)}
                          >
                            {group.isBound ? (
                              <>
                                <Unlink className="mr-1 size-3" />
                                解绑
                              </>
                            ) : (
                              <>
                                <LinkIcon className="mr-1 size-3" />
                                绑定
                              </>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {group.isBound ? '取消绑定此节点组' : '绑定此节点组'}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* 底部操作栏 */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {submitting && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>处理中...</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button className={getButtonClass('outline')} onClick={onClose} disabled={submitting}>
                关闭
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
