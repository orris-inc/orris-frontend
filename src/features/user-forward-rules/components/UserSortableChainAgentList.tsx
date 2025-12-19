/**
 * 用户端可排序的链式节点选择组件
 * 支持选择节点、调整顺序，以及可选的端口配置（direct_chain 类型）
 */

import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ScrollArea } from '@/components/common/ScrollArea';
import { Badge } from '@/components/common/Badge';
import type { UserForwardAgent } from '@/api/forward';

interface UserSortableChainAgentListProps {
  /** 可选的代理列表 */
  agents: UserForwardAgent[];
  /** 已选中的代理 ID 列表（有序） */
  selectedIds: string[];
  /** 选中状态变更回调 */
  onSelectionChange: (ids: string[]) => void;
  /** 是否显示端口配置（direct_chain 类型） */
  showPortConfig?: boolean;
  /** 端口配置（agentId -> port） */
  portConfig?: Record<string, number>;
  /** 端口配置变更回调 */
  onPortConfigChange?: (agentId: string, port: number) => void;
  /** 是否有错误 */
  hasError?: boolean;
  /** 组件 ID 前缀 */
  idPrefix?: string;
}

export const UserSortableChainAgentList: React.FC<UserSortableChainAgentListProps> = ({
  agents,
  selectedIds,
  onSelectionChange,
  showPortConfig = false,
  portConfig = {},
  onPortConfigChange,
  hasError = false,
  idPrefix = 'chain-agent',
}) => {
  // 切换选中状态
  const handleToggle = (agentId: string) => {
    const isRemoving = selectedIds.includes(agentId);
    if (isRemoving) {
      onSelectionChange(selectedIds.filter((id) => id !== agentId));
    } else {
      onSelectionChange([...selectedIds, agentId]);
    }
  };

  // 上移节点
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newIds = [...selectedIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    onSelectionChange(newIds);
  };

  // 下移节点
  const handleMoveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    const newIds = [...selectedIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    onSelectionChange(newIds);
  };

  // 获取代理信息
  const getAgent = (id: string) => agents.find((a) => a.id === id);

  // 获取已选中的代理列表（按顺序）
  const selectedAgents = selectedIds.map((id) => getAgent(id)).filter(Boolean) as UserForwardAgent[];

  return (
    <div className="space-y-3">
      {/* 可选节点列表 */}
      <div className={`border rounded-md ${hasError ? 'border-destructive' : 'border-input'}`}>
        <ScrollArea className="h-[120px] p-3">
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无可用节点</p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => {
                const isSelected = selectedIds.includes(agent.id);
                const orderIndex = selectedIds.indexOf(agent.id);
                return (
                  <div key={agent.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${idPrefix}-${agent.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(agent.id)}
                    />
                    <Label
                      htmlFor={`${idPrefix}-${agent.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {agent.name}
                      {agent.groupName && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({agent.groupName})
                        </span>
                      )}
                    </Label>
                    {isSelected && (
                      <Badge variant="outline" className="text-xs">
                        #{orderIndex + 1}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 已选节点排序区域 */}
      {selectedAgents.length > 0 && (
        <div className="border rounded-md border-input">
          <div className="px-3 py-2 bg-muted/50 border-b border-input">
            <p className="text-xs font-medium text-muted-foreground">
              转发顺序（可调整）
            </p>
          </div>
          <div className="p-2 space-y-1">
            {selectedAgents.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-center gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <GripVertical className="size-4 text-muted-foreground flex-shrink-0" />
                <Badge variant="secondary" className="text-xs w-6 justify-center flex-shrink-0">
                  {index + 1}
                </Badge>
                <span className="text-sm flex-1 min-w-0 truncate">{agent.name}</span>
                {showPortConfig && onPortConfigChange && (
                  <Input
                    type="number"
                    min={1}
                    max={65535}
                    placeholder="端口"
                    className="w-24 h-8 text-sm"
                    value={portConfig[agent.id] || ''}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      const port = value ? parseInt(value, 10) : 0;
                      // 只有当端口有效时才更新（允许暂时为0以便用户清空后重新输入）
                      onPortConfigChange(agent.id, isNaN(port) ? 0 : port);
                    }}
                  />
                )}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === selectedAgents.length - 1}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        已选择 {selectedIds.length} 个节点
        {selectedIds.length > 0 && '，使用上下箭头调整转发顺序'}
      </p>
    </div>
  );
};
