/**
 * Route configuration display component
 * Read-only display for NodeDetailDialog
 */

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import {
  isNodeOutbound,
  type OutboundNodeOption,
} from './RouteRuleEditor';
import type { RouteConfig, RouteRule, OutboundType } from '@/api/node';

interface RouteConfigDisplayProps {
  config: RouteConfig | undefined;
  /** Available nodes for displaying node names */
  nodes?: OutboundNodeOption[];
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
const getOutboundBadgeInfo = (
  outbound: OutboundType,
  nodes?: OutboundNodeOption[]
): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  if (!isNodeOutbound(outbound)) {
    return PRESET_OUTBOUND_BADGE[outbound] || { label: outbound, variant: 'outline' };
  }
  const node = nodes?.find((n) => n.id === outbound);
  return {
    label: node ? `节点: ${node.name}` : outbound,
    variant: 'outline',
  };
};

// Generate rule summary
const getRuleConditions = (rule: RouteRule): string[] => {
  const conditions: string[] = [];

  if (rule.domain?.length) {
    conditions.push(`域名: ${rule.domain.slice(0, 3).join(', ')}${rule.domain.length > 3 ? ` (+${rule.domain.length - 3})` : ''}`);
  }
  if (rule.domainSuffix?.length) {
    conditions.push(`后缀: ${rule.domainSuffix.slice(0, 3).join(', ')}${rule.domainSuffix.length > 3 ? ` (+${rule.domainSuffix.length - 3})` : ''}`);
  }
  if (rule.domainKeyword?.length) {
    conditions.push(`关键字: ${rule.domainKeyword.slice(0, 3).join(', ')}${rule.domainKeyword.length > 3 ? ` (+${rule.domainKeyword.length - 3})` : ''}`);
  }
  if (rule.domainRegex?.length) {
    conditions.push(`正则: ${rule.domainRegex.length}个`);
  }
  if (rule.geoip?.length) {
    conditions.push(`GeoIP: ${rule.geoip.join(', ')}`);
  }
  if (rule.geosite?.length) {
    conditions.push(`GeoSite: ${rule.geosite.join(', ')}`);
  }
  if (rule.ipCidr?.length) {
    conditions.push(`IP: ${rule.ipCidr.slice(0, 2).join(', ')}${rule.ipCidr.length > 2 ? ` (+${rule.ipCidr.length - 2})` : ''}`);
  }
  if (rule.sourceIpCidr?.length) {
    conditions.push(`源IP: ${rule.sourceIpCidr.length}个`);
  }
  if (rule.ipIsPrivate) {
    conditions.push('私有IP');
  }
  if (rule.port?.length) {
    conditions.push(`端口: ${rule.port.slice(0, 5).join(', ')}${rule.port.length > 5 ? ` (+${rule.port.length - 5})` : ''}`);
  }
  if (rule.sourcePort?.length) {
    conditions.push(`源端口: ${rule.sourcePort.length}个`);
  }
  if (rule.protocol?.length) {
    conditions.push(`协议: ${rule.protocol.join(', ')}`);
  }
  if (rule.network?.length) {
    conditions.push(`网络: ${rule.network.join(', ')}`);
  }
  if (rule.ruleSet?.length) {
    conditions.push(`规则集: ${rule.ruleSet.join(', ')}`);
  }

  return conditions;
};

export const RouteConfigDisplay: React.FC<RouteConfigDisplayProps> = ({
  config,
  nodes = [],
}) => {
  if (!config) {
    return (
      <div className="text-sm text-muted-foreground">
        未配置路由规则
      </div>
    );
  }

  const finalInfo = getOutboundBadgeInfo(config.final, nodes);
  const rules = config.rules || [];

  return (
    <div className="space-y-4">
      {/* Default outbound */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">默认出站:</span>
        <Badge variant={finalInfo.variant}>{finalInfo.label}</Badge>
      </div>

      {/* Rules list */}
      {rules.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            路由规则 ({rules.length}条):
          </div>
          <div className="space-y-2">
            {rules.map((rule, index) => {
              const outboundInfo = getOutboundBadgeInfo(rule.outbound, nodes);
              const conditions = getRuleConditions(rule);

              return (
                <Card key={index} className="p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">
                      #{index + 1}
                    </span>
                    <Badge
                      variant={outboundInfo.variant}
                      className="shrink-0"
                    >
                      {outboundInfo.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      {conditions.length > 0 ? (
                        <div className="text-sm text-foreground space-y-0.5">
                          {conditions.map((condition, i) => (
                            <div key={i} className="truncate">
                              {condition}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          无匹配条件（匹配所有）
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          无路由规则，所有流量使用默认出站
        </div>
      )}
    </div>
  );
};
