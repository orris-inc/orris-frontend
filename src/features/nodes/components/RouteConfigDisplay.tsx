/**
 * Route configuration display component
 * Read-only display for NodeDetailDialog
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import {
  isNodeOutbound,
  isCustomOutbound,
  type OutboundNodeOption,
} from '../utils/route-rule-utils';
import type { RouteConfig, RouteRule, OutboundType, CustomOutbound } from '@/api/node';

interface RouteConfigDisplayProps {
  config: RouteConfig | undefined;
  /** Available nodes for displaying node names */
  nodes?: OutboundNodeOption[];
}

const PRESET_OUTBOUND_BADGE: Record<
  string,
  { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  proxy: { labelKey: 'admin.nodes.route.outbound.proxy', variant: 'default' },
  direct: { labelKey: 'admin.nodes.route.outbound.direct', variant: 'secondary' },
  block: { labelKey: 'admin.nodes.route.outbound.block', variant: 'destructive' },
};

/** Get badge info for outbound value */
const getOutboundBadgeInfo = (
  outbound: OutboundType,
  nodes: OutboundNodeOption[] | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
  customOutbounds?: CustomOutbound[]
): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  if (isCustomOutbound(outbound)) {
    const entry = customOutbounds?.find((c) => c.tag === outbound);
    const displayTag = outbound.replace(/^custom_/, '');
    return {
      label: entry
        ? t('admin.nodes.route.outbound.custom', { tag: displayTag })
        : t('admin.nodes.route.outbound.custom', { tag: displayTag }),
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
    label: node ? t('admin.nodes.route.outbound.node', { name: node.name }) : outbound,
    variant: 'outline',
  };
};

// Generate rule summary
const getRuleConditions = (rule: RouteRule, t: (key: string, options?: Record<string, unknown>) => string): string[] => {
  const conditions: string[] = [];

  if (rule.domain?.length) {
    conditions.push(`${t('admin.nodes.route.display.domain')}: ${rule.domain.slice(0, 3).join(', ')}${rule.domain.length > 3 ? ` (+${rule.domain.length - 3})` : ''}`);
  }
  if (rule.domainSuffix?.length) {
    conditions.push(`${t('admin.nodes.route.display.suffix')}: ${rule.domainSuffix.slice(0, 3).join(', ')}${rule.domainSuffix.length > 3 ? ` (+${rule.domainSuffix.length - 3})` : ''}`);
  }
  if (rule.domainKeyword?.length) {
    conditions.push(`${t('admin.nodes.route.display.keyword')}: ${rule.domainKeyword.slice(0, 3).join(', ')}${rule.domainKeyword.length > 3 ? ` (+${rule.domainKeyword.length - 3})` : ''}`);
  }
  if (rule.domainRegex?.length) {
    conditions.push(`${t('admin.nodes.route.display.regex')}: ${rule.domainRegex.length}`);
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
    conditions.push(`${t('admin.nodes.route.display.sourceIp')}: ${rule.sourceIpCidr.length}`);
  }
  if (rule.ipIsPrivate) {
    conditions.push(t('admin.nodes.route.display.privateIp'));
  }
  if (rule.port?.length) {
    conditions.push(`${t('admin.nodes.route.display.port')}: ${rule.port.slice(0, 5).join(', ')}${rule.port.length > 5 ? ` (+${rule.port.length - 5})` : ''}`);
  }
  if (rule.sourcePort?.length) {
    conditions.push(`${t('admin.nodes.route.display.sourcePort')}: ${rule.sourcePort.length}`);
  }
  if (rule.protocol?.length) {
    conditions.push(`${t('common.protocol')}: ${rule.protocol.join(', ')}`);
  }
  if (rule.network?.length) {
    conditions.push(`${t('admin.nodes.route.display.network')}: ${rule.network.join(', ')}`);
  }
  if (rule.ruleSet?.length) {
    conditions.push(`${t('admin.nodes.route.display.ruleSet')}: ${rule.ruleSet.join(', ')}`);
  }

  return conditions;
};

export const RouteConfigDisplay: React.FC<RouteConfigDisplayProps> = ({
  config,
  nodes = [],
}) => {
  const { t } = useTranslation();

  if (!config) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('admin.nodes.route.display.noConfig')}
      </div>
    );
  }

  const finalInfo = getOutboundBadgeInfo(config.final, nodes, t, config.customOutbounds);
  const rules = config.rules || [];
  const customOutbounds = config.customOutbounds || [];
  const ruleSetEntries = config.ruleSetEntries || [];

  return (
    <div className="space-y-4">
      {/* Default outbound */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('admin.nodes.route.display.defaultOutbound')}:</span>
        <Badge variant={finalInfo.variant}>{finalInfo.label}</Badge>
      </div>

      {/* Rules list */}
      {rules.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {t('admin.nodes.route.display.rulesCount', { count: rules.length })}:
          </div>
          <div className="space-y-2">
            {rules.map((rule, index) => {
              const outboundInfo = getOutboundBadgeInfo(rule.outbound, nodes, t, config.customOutbounds);
              const conditions = getRuleConditions(rule, t);

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
                            <p key={i} className="truncate" title={condition}>{condition}</p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('admin.nodes.route.display.noConditions')}
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
          {t('admin.nodes.route.display.noRules')}
        </div>
      )}

      {/* Custom outbounds summary */}
      {customOutbounds.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {t('admin.nodes.route.customOutbound.title')} ({customOutbounds.length}):
          </div>
          <div className="space-y-1.5">
            {customOutbounds.map((co) => (
              <div key={co.tag} className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{co.tag.replace(/^custom_/, '')}</Badge>
                <span className="text-muted-foreground">{co.type}</span>
                <span>{co.server}:{co.serverPort}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rule set entries summary */}
      {ruleSetEntries.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {t('admin.nodes.route.ruleSetEntry.title')} ({ruleSetEntries.length}):
          </div>
          <div className="space-y-1.5">
            {ruleSetEntries.map((rs) => (
              <div key={rs.tag} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">{rs.tag}</Badge>
                {rs.format && rs.format !== 'binary' && (
                  <Badge variant="secondary" className="text-[11px]">{rs.format}</Badge>
                )}
                <span className="text-muted-foreground truncate" title={rs.url}>{rs.url}</span>
                {rs.updateInterval && (
                  <span className="text-muted-foreground text-xs">({rs.updateInterval})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
