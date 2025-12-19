/**
 * 用户转发规则列表组件
 */

import { useState } from 'react';
import { Edit, Trash2, Power, PowerOff, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/common/Tooltip';
import { Skeleton } from '@/components/common/Skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { ForwardRule } from '@/api/forward';

interface UserForwardRuleListProps {
  rules: ForwardRule[];
  isLoading: boolean;
  onEdit: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  onToggleStatus: (rule: ForwardRule) => void;
  onEnabling?: boolean;
  onDisabling?: boolean;
  onDeleting?: boolean;
}

/**
 * 协议标签颜色映射
 */
const PROTOCOL_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  tcp: 'default',
  udp: 'secondary',
  both: 'outline',
};

/**
 * 规则类型映射表
 */
const RULE_TYPE_LABELS: Record<string, string> = {
  direct: '直连',
  entry: '入口',
  exit: '出口',
  chain: '链式',
  direct_chain: '直连链',
};

export const UserForwardRuleList: React.FC<UserForwardRuleListProps> = ({
  rules,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    rule: ForwardRule | null;
  }>({ open: false, rule: null });

  const handleDeleteClick = (rule: ForwardRule) => {
    setDeleteConfirm({ open: true, rule });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.rule) {
      onDelete(deleteConfirm.rule);
      setDeleteConfirm({ open: false, rule: null });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg bg-card border">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="p-12 text-center rounded-lg bg-card border">
        <p className="text-muted-foreground">暂无转发规则</p>
        <p className="text-sm text-muted-foreground mt-1">点击上方「新增规则」按钮创建您的第一条规则</p>
      </div>
    );
  }

  return (
    <>
      {/* 移动端和小屏幕：卡片布局 */}
      <div className="space-y-3 md:hidden">
        {rules.map((rule) => (
          <div key={rule.id} className="p-4 rounded-lg bg-card border">
            <div className="space-y-3">
              {/* 标题和状态 */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{rule.name}</div>
                  {rule.remark && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {rule.remark}
                    </div>
                  )}
                </div>
                <Badge variant={rule.status === 'enabled' ? 'default' : 'secondary'} className="text-xs shrink-0">
                  {rule.status === 'enabled' ? '已启用' : '已禁用'}
                </Badge>
              </div>

              {/* 规则信息 */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">监听端口：</span>
                  <span className="font-mono">{rule.listenPort || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">协议：</span>
                  <Badge variant={PROTOCOL_COLORS[rule.protocol]} className="text-xs ml-1">
                    {rule.protocol.toUpperCase()}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">目标：</span>
                  <span className="font-mono text-xs ml-1">
                    {rule.targetAddress}:{rule.targetPort}
                  </span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(rule)}
                  className="flex-1"
                >
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(rule)}
                  className="flex-1"
                >
                  {rule.status === 'enabled' ? '禁用' : '启用'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(rule)}
                  className="shrink-0"
                >
                  删除
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 桌面端：表格布局 */}
      <div className="hidden md:block rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  规则名称
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  类型
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  监听端口
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  目标地址
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  协议
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  状态
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-sm">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="font-medium">{rule.name}</div>
                      {rule.remark && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {rule.remark}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">{rule.listenPort || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">
                      {rule.targetAddress}:{rule.targetPort}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={PROTOCOL_COLORS[rule.protocol]} className="text-xs">
                      {rule.protocol.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={rule.status === 'enabled' ? 'default' : 'secondary'} className="text-xs">
                      {rule.status === 'enabled' ? '已启用' : '已禁用'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑</TooltipContent>
                      </Tooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onToggleStatus(rule)}>
                            {rule.status === 'enabled' ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                禁用规则
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                启用规则
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(rule)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除规则
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, rule: null })}
        title="确认删除"
        description={`确认删除转发规则「${deleteConfirm.rule?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
