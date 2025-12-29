/**
 * Route rules list component
 * Manage a list of routing rules with add/delete/reorder functionality
 */

import { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import {
  RouteRuleEditor,
  isNodeOutbound,
  type OutboundNodeOption,
} from './RouteRuleEditor';
import type { RouteRule, OutboundType } from '@/api/node';

interface RouteRulesListProps {
  rules: RouteRule[];
  onChange: (rules: RouteRule[]) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Available nodes for outbound selection */
  nodes?: OutboundNodeOption[];
  /** Current node ID (to exclude from selection) */
  currentNodeId?: string;
}

const PRESET_OUTBOUND_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  proxy: { label: '代理', variant: 'default' },
  direct: { label: '直连', variant: 'secondary' },
  block: { label: '阻断', variant: 'destructive' },
};

/** Get badge info for outbound value */
const getOutboundBadge = (
  outbound: OutboundType,
  nodes?: OutboundNodeOption[]
): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  if (!isNodeOutbound(outbound)) {
    return PRESET_OUTBOUND_BADGE[outbound] || { label: outbound, variant: 'outline' };
  }
  const node = nodes?.find((n) => n.id === outbound);
  return {
    label: node ? node.name : outbound,
    variant: 'outline',
  };
};

// Generate rule summary for collapsed view
const getRuleSummary = (rule: RouteRule): string => {
  const parts: string[] = [];

  if (rule.domain?.length)
    parts.push(`域名: ${rule.domain.length}个`);
  if (rule.domainSuffix?.length)
    parts.push(`后缀: ${rule.domainSuffix.length}个`);
  if (rule.domainKeyword?.length)
    parts.push(`关键字: ${rule.domainKeyword.length}个`);
  if (rule.geoip?.length) parts.push(`GeoIP: ${rule.geoip.join(', ')}`);
  if (rule.geosite?.length) parts.push(`GeoSite: ${rule.geosite.join(', ')}`);
  if (rule.ipCidr?.length) parts.push(`IP: ${rule.ipCidr.length}个`);
  if (rule.port?.length) parts.push(`端口: ${rule.port.join(', ')}`);
  if (rule.ipIsPrivate) parts.push('私有IP');
  if (rule.ruleSet?.length) parts.push(`规则集: ${rule.ruleSet.length}个`);

  return parts.length > 0 ? parts.join(' | ') : '未配置匹配条件';
};

export const RouteRulesList: React.FC<RouteRulesListProps> = ({
  rules,
  onChange,
  disabled = false,
  idPrefix = 'rules',
  nodes = [],
  currentNodeId,
}) => {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    new Set()
  );

  const handleAddRule = () => {
    const newRule: RouteRule = {
      outbound: 'proxy',
    };
    onChange([...rules, newRule]);
    // Auto expand newly added rule
    setExpandedIndices((prev) => new Set([...prev, rules.length]));
  };

  const handleRemoveRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
    // Update expanded indices after removal
    setExpandedIndices((prev) => {
      const newSet = new Set<number>();
      prev.forEach((i) => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
  };

  const handleUpdateRule = (index: number, rule: RouteRule) => {
    const newRules = rules.map((r, i) => (i === index ? rule : r));
    onChange(newRules);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newRules = [...rules];
    [newRules[index - 1], newRules[index]] = [
      newRules[index],
      newRules[index - 1],
    ];
    onChange(newRules);
    // Update expanded indices
    setExpandedIndices((prev) => {
      const newSet = new Set<number>();
      prev.forEach((i) => {
        if (i === index) newSet.add(index - 1);
        else if (i === index - 1) newSet.add(index);
        else newSet.add(i);
      });
      return newSet;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= rules.length - 1) return;
    const newRules = [...rules];
    [newRules[index], newRules[index + 1]] = [
      newRules[index + 1],
      newRules[index],
    ];
    onChange(newRules);
    // Update expanded indices
    setExpandedIndices((prev) => {
      const newSet = new Set<number>();
      prev.forEach((i) => {
        if (i === index) newSet.add(index + 1);
        else if (i === index + 1) newSet.add(index);
        else newSet.add(i);
      });
      return newSet;
    });
  };

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">路由规则</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRule}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          添加规则
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
          暂无路由规则，点击"添加规则"开始配置
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => {
            const isExpanded = expandedIndices.has(index);
            const outboundInfo = getOutboundBadge(rule.outbound, nodes);

            return (
              <Card key={index} className="overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleExpand(index)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <Badge variant={outboundInfo.variant} className="shrink-0">
                      {outboundInfo.label}
                    </Badge>
                    {!isExpanded && (
                      <span className="text-xs text-muted-foreground truncate">
                        {getRuleSummary(rule)}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveUp(index)}
                      disabled={disabled || index === 0}
                      title="上移"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveDown(index)}
                      disabled={disabled || index === rules.length - 1}
                      title="下移"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveRule(index)}
                      disabled={disabled}
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                {isExpanded && (
                  <div className="border-t p-4">
                    <RouteRuleEditor
                      rule={rule}
                      onChange={(r) => handleUpdateRule(index, r)}
                      disabled={disabled}
                      idPrefix={`${idPrefix}-${index}`}
                      nodes={nodes}
                      currentNodeId={currentNodeId}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        规则按顺序匹配，第一个匹配的规则生效。可使用上下箭头调整规则顺序。
      </p>
    </div>
  );
};
