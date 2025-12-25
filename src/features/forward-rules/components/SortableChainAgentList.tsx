/**
 * Sortable Chain Agent Selection Component
 * Supports node selection, order adjustment, and optional port configuration (direct_chain type)
 */

import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ScrollArea } from '@/components/common/ScrollArea';
import { Badge } from '@/components/common/Badge';
import type { ForwardAgent } from '@/api/forward';

interface SortableChainAgentListProps {
  /** Available agent list */
  agents: ForwardAgent[];
  /** Selected agent ID list (ordered) */
  selectedIds: string[];
  /** Selection change callback */
  onSelectionChange: (ids: string[]) => void;
  /** Whether to show port configuration (direct_chain type) */
  showPortConfig?: boolean;
  /** Index from which to show port configuration (0-based, for hybrid chain) */
  portConfigStartIndex?: number;
  /** Port configuration (agentId -> port) */
  portConfig?: Record<string, number>;
  /** Port configuration change callback */
  onPortConfigChange?: (agentId: string, port: number) => void;
  /** Whether there is an error */
  hasError?: boolean;
  /** Component ID prefix */
  idPrefix?: string;
}

export const SortableChainAgentList: React.FC<SortableChainAgentListProps> = ({
  agents,
  selectedIds,
  onSelectionChange,
  showPortConfig = false,
  portConfigStartIndex = 0,
  portConfig = {},
  onPortConfigChange,
  hasError = false,
  idPrefix = 'chain-agent',
}) => {
  // Toggle selection state
  const handleToggle = (agentId: string) => {
    const isRemoving = selectedIds.includes(agentId);
    if (isRemoving) {
      onSelectionChange(selectedIds.filter((id) => id !== agentId));
    } else {
      onSelectionChange([...selectedIds, agentId]);
    }
  };

  // Move node up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newIds = [...selectedIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    onSelectionChange(newIds);
  };

  // Move node down
  const handleMoveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    const newIds = [...selectedIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    onSelectionChange(newIds);
  };

  // Get agent information
  const getAgent = (id: string) => agents.find((a) => a.id === id);

  // Get selected agent list (in order)
  const selectedAgents = selectedIds.map((id) => getAgent(id)).filter(Boolean) as ForwardAgent[];

  return (
    <div className="space-y-3">
      {/* Available Nodes List */}
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
                      {agent.publicAddress && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({agent.publicAddress})
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

      {/* Selected Nodes Sorting Area */}
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
                {showPortConfig && onPortConfigChange && index >= portConfigStartIndex && (
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
                      // Only update when port is valid (allow 0 temporarily for user to clear and re-enter)
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
