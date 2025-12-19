/**
 * 添加成员对话框
 * 支持批量选择节点或转发代理添加到资源组
 */

import { useState, useMemo } from 'react';
import { Search, Server, Cpu, Loader2, Check, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Checkbox } from '@/components/common/Checkbox';
import { Separator } from '@/components/common/Separator';
import { ScrollArea } from '@/components/common/ScrollArea';
import { useNodes } from '@/features/nodes/hooks/useNodes';
import { useForwardAgents } from '@/features/forward-agents/hooks/useForwardAgents';

type MemberType = 'nodes' | 'agents';

interface AddMembersDialogProps {
  open: boolean;
  type: MemberType;
  groupName: string;
  existingMemberIds: string[];
  onClose: () => void;
  onSubmit: (ids: string[]) => Promise<void>;
  isSubmitting?: boolean;
}

export const AddMembersDialog: React.FC<AddMembersDialogProps> = ({
  open,
  type,
  groupName,
  existingMemberIds,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 获取节点列表
  const { nodes, isLoading: isLoadingNodes } = useNodes({
    page: 1,
    pageSize: 200,
    enabled: open && type === 'nodes',
  });

  // 获取转发代理列表
  const { forwardAgents, isLoading: isLoadingAgents } = useForwardAgents({
    page: 1,
    pageSize: 200,
    enabled: open && type === 'agents',
  });

  const isLoading = type === 'nodes' ? isLoadingNodes : isLoadingAgents;

  // 过滤出未加入当前资源组的成员
  const availableItems = useMemo(() => {
    const items = type === 'nodes' ? nodes : forwardAgents;
    const existingSet = new Set(existingMemberIds);

    return items
      .filter((item) => !existingSet.has(item.id))
      .filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [type, nodes, forwardAgents, existingMemberIds, searchQuery]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === availableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableItems.map((item) => item.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    await onSubmit(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery('');
    onClose();
  };

  const Icon = type === 'nodes' ? Server : Cpu;
  const title = type === 'nodes' ? '添加节点' : '添加转发代理';
  const memberLabel = type === 'nodes' ? '节点' : '转发代理';
  const emptyText = type === 'nodes' ? '暂无可添加的节点' : '暂无可添加的转发代理';

  // 统计信息
  const totalItems = type === 'nodes' ? nodes.length : forwardAgents.length;
  const existingCount = existingMemberIds.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            选择要添加到「{groupName}」的{memberLabel}
          </DialogDescription>
        </DialogHeader>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
            <Users className="size-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">全部{memberLabel}</p>
              <p className="text-sm font-medium">{totalItems} 个</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
            <Check className="size-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">已关联</p>
              <p className="text-sm font-medium">{existingCount} 个</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
            <Icon className="size-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">可添加</p>
              <p className="text-sm font-medium">{availableItems.length} 个</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={`搜索${memberLabel}名称或ID...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 全选和已选统计 */}
          {availableItems.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === availableItems.length && availableItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size === availableItems.length ? '取消全选' : '全选'}
                </span>
              </div>
              {selectedIds.size > 0 && (
                <Badge variant="secondary">
                  已选择 {selectedIds.size} 项
                </Badge>
              )}
            </div>
          )}

          {/* 列表 */}
          <div className="flex-1 min-h-[200px] max-h-[350px] border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Icon className="size-8 mb-2" />
                <p className="text-sm">{emptyText}</p>
                {searchQuery && (
                  <p className="text-xs mt-1">尝试使用其他关键词搜索</p>
                )}
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {availableItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const status = 'status' in item ? item.status : '';
                    const isActive = status === 'active' || status === 'enabled';

                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(item.id)}
                        />
                        <Icon className="size-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {item.id}
                          </p>
                        </div>
                        <Badge variant={isActive ? 'default' : 'secondary'} className="flex-shrink-0">
                          {isActive ? (type === 'nodes' ? '激活' : '启用') : (type === 'nodes' ? '未激活' : '禁用')}
                        </Badge>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                添加中...
              </>
            ) : (
              <>
                <Check className="size-4 mr-2" />
                确认添加 ({selectedIds.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
