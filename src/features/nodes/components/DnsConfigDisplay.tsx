/**
 * DNS configuration display component
 * Read-only display for NodeDetailDialog
 */

import { useTranslation } from 'react-i18next';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import type { DnsConfig, DnsRule } from '@/api/node';

interface DnsConfigDisplayProps {
  config: DnsConfig | undefined;
}

const getRuleConditions = (rule: DnsRule, t: (key: string, options?: Record<string, unknown>) => string): string[] => {
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
  if (rule.geosite?.length) {
    conditions.push(`GeoSite: ${rule.geosite.join(', ')}`);
  }
  if (rule.geoip?.length) {
    conditions.push(`GeoIP: ${rule.geoip.join(', ')}`);
  }
  if (rule.ruleSet?.length) {
    conditions.push(`${t('admin.nodes.route.display.ruleSet')}: ${rule.ruleSet.join(', ')}`);
  }
  if (rule.outbound?.length) {
    conditions.push(`Outbound: ${rule.outbound.join(', ')}`);
  }
  return conditions;
};

export const DnsConfigDisplay: React.FC<DnsConfigDisplayProps> = ({ config }) => {
  const { t } = useTranslation();

  if (!config) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('admin.nodes.dns.display.noConfig')}
      </div>
    );
  }

  const servers = config.servers || [];
  const rules = config.rules || [];

  return (
    <div className="space-y-4">
      {/* Default DNS Server + Strategy */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('admin.nodes.dns.display.defaultServer')}:</span>
        <Badge variant="outline">{config.final}</Badge>
        {config.strategy && (
          <>
            <span className="text-sm text-muted-foreground">{t('admin.nodes.dns.display.strategy')}:</span>
            <Badge variant="secondary">{config.strategy}</Badge>
          </>
        )}
      </div>

      {/* Cache status */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={config.disableCache ? 'destructive' : 'secondary'}>
          {config.disableCache ? t('admin.nodes.dns.display.cacheDisabled') : t('admin.nodes.dns.display.cacheEnabled')}
        </Badge>
        {config.independentCache && (
          <Badge variant="secondary">{t('admin.nodes.dns.cache.independentCache')}</Badge>
        )}
        {config.reverseMapping && (
          <Badge variant="secondary">{t('admin.nodes.dns.cache.reverseMapping')}</Badge>
        )}
      </div>

      {/* Servers list */}
      {servers.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {t('admin.nodes.dns.display.serversCount', { count: servers.length })}:
          </div>
          <div className="space-y-1.5">
            {servers.map((server) => (
              <div key={server.tag} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-[11px]">{server.tag}</Badge>
                <span className="font-mono text-muted-foreground">{server.address}</span>
                {server.detour && (
                  <Badge variant="secondary" className="text-[11px]">→ {server.detour}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          {t('admin.nodes.dns.display.noServers')}
        </div>
      )}

      {/* Rules list */}
      {rules.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {t('admin.nodes.dns.display.rulesCount', { count: rules.length })}:
          </div>
          <div className="space-y-2">
            {rules.map((rule, index) => {
              const conditions = getRuleConditions(rule, t);
              return (
                <Card key={index} className="p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">
                      #{index + 1}
                    </span>
                    <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                      → {rule.server}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      {conditions.length > 0 ? (
                        <div className="text-sm text-foreground space-y-0.5">
                          {conditions.map((condition, i) => (
                            <SmartTruncate key={i} text={condition} className="text-sm" />
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t('admin.nodes.route.display.noConditions')}
                        </span>
                      )}
                    </div>
                    {rule.disableCache && (
                      <Badge variant="destructive" className="shrink-0 text-[10px]">
                        No Cache
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          {t('admin.nodes.dns.display.noRules')}
        </div>
      )}
    </div>
  );
};
