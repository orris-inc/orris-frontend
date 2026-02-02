/**
 * Generic Exit Agent List Component for Load Balancing
 * Supports multiple exit agents with weight configuration
 * Use with adminAgentRenderer or userAgentRenderer for specific scenarios
 */

import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown, GripVertical, X, MoreVertical } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { ScrollArea } from "@/components/common/ScrollArea";
import { Badge } from "@/components/common/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/common/DropdownMenu";
import type { BaseAgent, ExitAgentListProps } from "./types";

/**
 * Generic ExitAgentList component with load balancing support
 */
export function ExitAgentList<T extends BaseAgent>({
  agents,
  exitAgents,
  onChange,
  renderAgentDetails,
  hasError = false,
  idPrefix = "exit-agent",
  disabled = false,
}: ExitAgentListProps<T>) {
  const { t } = useTranslation();

  // Get available agents (not already selected)
  const availableAgents = agents.filter(
    (agent) => !exitAgents.some((ea) => ea.agentId === agent.id)
  );

  // Add new exit agent
  const handleAdd = (agentId: string) => {
    if (!agentId || exitAgents.some((ea) => ea.agentId === agentId)) return;
    onChange([...exitAgents, { agentId, weight: 100 }]);
  };

  // Remove exit agent
  const handleRemove = (agentId: string) => {
    onChange(exitAgents.filter((ea) => ea.agentId !== agentId));
  };

  // Update weight
  const handleWeightChange = (agentId: string, weight: number) => {
    onChange(
      exitAgents.map((ea) =>
        ea.agentId === agentId ? { ...ea, weight: Math.max(1, Math.min(100, weight)) } : ea
      )
    );
  };

  // Move agent up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newList = [...exitAgents];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    onChange(newList);
  };

  // Move agent down
  const handleMoveDown = (index: number) => {
    if (index >= exitAgents.length - 1) return;
    const newList = [...exitAgents];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    onChange(newList);
  };

  // Get agent by ID
  const getAgent = (id: string) => agents.find((a) => a.id === id);

  // Calculate total weight
  const totalWeight = exitAgents.reduce((sum, ea) => sum + ea.weight, 0);

  return (
    <div className="@container space-y-3">
      {/* Selected Exit Agents List */}
      {exitAgents.length > 0 && (
        <div
          className={`border rounded-md ${hasError ? "border-destructive" : "border-input"}`}
        >
          <div className="px-3 py-2 bg-muted/50 border-b border-input flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {t('admin.forwardRules.exitAgents.loadBalancing')}
            </p>
            <Badge variant="outline" className="text-xs">
              {t('admin.forwardRules.exitAgents.totalWeight', { weight: totalWeight })}
            </Badge>
          </div>
          <ScrollArea className={exitAgents.length > 4 ? "h-[200px]" : ""}>
            <div className="p-2 space-y-1">
              {exitAgents.map((ea, index) => {
                const agent = getAgent(ea.agentId);
                const percentage = totalWeight > 0 ? ((ea.weight / totalWeight) * 100).toFixed(1) : '0';
                const details = agent && renderAgentDetails ? renderAgentDetails(agent) : undefined;

                return (
                  <div
                    key={ea.agentId}
                    className="flex flex-col gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors @[360px]:flex-row @[360px]:items-center"
                  >
                    {/* Left section: drag handle, index, name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <GripVertical className="size-4 text-muted-foreground flex-shrink-0 cursor-grab" />
                      <Badge
                        variant="secondary"
                        className="text-xs w-6 justify-center flex-shrink-0"
                      >
                        {index + 1}
                      </Badge>
                      <span className="text-sm flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{agent?.name || ea.agentId}</span>
                        {details?.badge}
                        {details?.secondaryText && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({details.secondaryText})
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Right section: weight input, percentage, action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                      <Input
                        id={`${idPrefix}-weight-${ea.agentId}`}
                        type="number"
                        min={1}
                        max={100}
                        className="w-16 h-9 text-sm text-center"
                        value={ea.weight}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value)) {
                            handleWeightChange(ea.agentId, value);
                          }
                        }}
                        disabled={disabled}
                      />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {percentage}%
                      </span>
                      {/* Desktop: inline buttons */}
                      <div className="hidden @[480px]:flex gap-0.5 flex-shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-9 p-0"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || disabled}
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-9 p-0"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === exitAgents.length - 1 || disabled}
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-9 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemove(ea.agentId)}
                          disabled={disabled}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      {/* Mobile: dropdown menu for better touch targets */}
                      <div className="@[480px]:hidden">
                        <DropdownMenu modal>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="size-9 p-0"
                              disabled={disabled}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuContent align="end" sideOffset={4}>
                              <DropdownMenuItem
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                              >
                                <ChevronUp className="size-4 mr-2" />
                                {t('admin.forwardRules.exitAgents.moveUp')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMoveDown(index)}
                                disabled={index === exitAgents.length - 1}
                              >
                                <ChevronDown className="size-4 mr-2" />
                                {t('admin.forwardRules.exitAgents.moveDown')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemove(ea.agentId)}
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="size-4 mr-2" />
                                {t('admin.forwardRules.exitAgents.remove')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenuPortal>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Add New Exit Agent */}
      {availableAgents.length > 0 && (
        <Select onValueChange={handleAdd} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={t('admin.forwardRules.exitAgents.addAgent')} />
          </SelectTrigger>
          <SelectContent>
            {availableAgents.map((agent) => {
              const details = renderAgentDetails ? renderAgentDetails(agent) : undefined;
              return (
                <SelectItem key={agent.id} value={agent.id}>
                  <span className="flex items-center gap-2">
                    {agent.name}
                    {details?.secondaryText && (
                      <span className="text-xs text-muted-foreground">
                        ({details.secondaryText})
                      </span>
                    )}
                    {details?.badge}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}

      {/* Empty State */}
      {exitAgents.length === 0 && availableAgents.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('admin.forwardRules.exitAgents.noAgents')}
        </p>
      )}

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        {exitAgents.length > 0
          ? t('admin.forwardRules.exitAgents.hint', { count: exitAgents.length })
          : t('admin.forwardRules.exitAgents.emptyHint')}
      </p>
    </div>
  );
}
