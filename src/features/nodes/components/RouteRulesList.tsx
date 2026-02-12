/**
 * Route rules list component
 * Manage a list of routing rules with add/delete/reorder functionality
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { RouteRuleEditor } from './RouteRuleEditor';
import {
  isNodeOutbound,
  isCustomOutbound,
  type OutboundNodeOption,
} from '../utils/route-rule-utils';
import type { RouteRule, OutboundType, CustomOutbound } from '@/api/node';

interface RouteRulesListProps {
  rules: RouteRule[];
  onChange: (rules: RouteRule[]) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Available nodes for outbound selection */
  nodes?: OutboundNodeOption[];
  /** Current node ID (to exclude from selection) */
  currentNodeId?: string;
  /** Custom outbounds defined in route config */
  customOutbounds?: CustomOutbound[];
}

const PRESET_OUTBOUND_BADGE: Record<
  string,
  { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  proxy: { labelKey: 'admin.nodes.route.outbound.proxy', variant: 'default' },
  direct: { labelKey: 'admin.nodes.route.outbound.direct', variant: 'secondary' },
  block: { labelKey: 'admin.nodes.route.outbound.block', variant: 'destructive' },
};

// Outbound type to left-border color for visual scanning
const OUTBOUND_BORDER_COLOR: Record<string, string> = {
  proxy: 'border-l-primary',
  direct: 'border-l-success',
  block: 'border-l-destructive',
};

const getOutboundBorderColor = (outbound: OutboundType): string => {
  if (isCustomOutbound(outbound)) return 'border-l-warning';
  if (isNodeOutbound(outbound)) return 'border-l-info';
  return OUTBOUND_BORDER_COLOR[outbound] || 'border-l-border';
};

/** Get badge info for outbound value */
const getOutboundBadge = (
  outbound: OutboundType,
  nodes: OutboundNodeOption[] | undefined,
  t: (key: string) => string,
  customOutbounds?: CustomOutbound[]
): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  if (isCustomOutbound(outbound)) {
    const entry = customOutbounds?.find((c) => c.tag === outbound);
    const displayTag = outbound.replace(/^custom_/, '');
    return {
      label: entry ? `${displayTag} (${entry.type})` : displayTag,
      variant: 'outline',
    };
  }
  if (!isNodeOutbound(outbound)) {
    const preset = PRESET_OUTBOUND_BADGE[outbound];
    if (preset) {
      return { label: t(preset.labelKey), variant: preset.variant };
    }
    return { label: outbound, variant: 'outline' };
  }
  const node = nodes?.find((n) => n.id === outbound);
  return {
    label: node ? node.name : outbound,
    variant: 'outline',
  };
};

// Generate rule summary for collapsed view
const getRuleSummary = (rule: RouteRule, t: (key: string) => string): string => {
  const parts: string[] = [];

  if (rule.domain?.length)
    parts.push(`${t('admin.nodes.route.display.domain')}: ${rule.domain.length}`);
  if (rule.domainSuffix?.length)
    parts.push(`${t('admin.nodes.route.display.suffix')}: ${rule.domainSuffix.length}`);
  if (rule.domainKeyword?.length)
    parts.push(`${t('admin.nodes.route.display.keyword')}: ${rule.domainKeyword.length}`);
  if (rule.geoip?.length) parts.push(`GeoIP: ${rule.geoip.join(', ')}`);
  if (rule.geosite?.length) parts.push(`GeoSite: ${rule.geosite.join(', ')}`);
  if (rule.ipCidr?.length) parts.push(`IP: ${rule.ipCidr.length}`);
  if (rule.port?.length) parts.push(`${t('admin.nodes.route.display.port')}: ${rule.port.join(', ')}`);
  if (rule.ipIsPrivate) parts.push(t('admin.nodes.route.display.privateIp'));
  if (rule.ruleSet?.length) parts.push(`${t('admin.nodes.route.display.ruleSet')}: ${rule.ruleSet.length}`);

  return parts.length > 0 ? parts.join(' | ') : t('admin.nodes.route.display.noConditions');
};

export const RouteRulesList: React.FC<RouteRulesListProps> = ({
  rules,
  onChange,
  disabled = false,
  idPrefix = 'rules',
  nodes = [],
  currentNodeId,
  customOutbounds,
}) => {
  const { t } = useTranslation();
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
        <h4 className="text-sm font-medium">{t('admin.nodes.route.rulesTitle')}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRule}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('admin.nodes.route.addRule')}
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4 rounded-xl ring-1 ring-dashed ring-border">
          {t('admin.nodes.detail.noRouteRules')}
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => {
            const isExpanded = expandedIndices.has(index);
            const outboundInfo = getOutboundBadge(rule.outbound, nodes, t, customOutbounds);

            return (
              <Card key={index} className={cn('overflow-hidden border-l-[3px]', getOutboundBorderColor(rule.outbound))}>
                {/* Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleExpand(index)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ChevronRight
                      className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-90')}
                    />
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <Badge variant={outboundInfo.variant} className="shrink-0">
                      {outboundInfo.label}
                    </Badge>
                    {!isExpanded && (
                      <span className="text-xs text-muted-foreground truncate">
                        {getRuleSummary(rule, t)}
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
                      title={t('admin.nodes.route.moveUp')}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveDown(index)}
                      disabled={disabled || index === rules.length - 1}
                      title={t('admin.nodes.route.moveDown')}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveRule(index)}
                      disabled={disabled}
                      title={t('common.actions.delete')}
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
                      customOutbounds={customOutbounds}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {t('admin.nodes.route.rulesOrderHint')}
      </p>
    </div>
  );
};
