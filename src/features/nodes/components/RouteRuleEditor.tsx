/**
 * Route rule editor component
 * Edit a single routing rule with all matching conditions
 */

import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { Checkbox } from '@/components/common/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { Badge } from '@/components/common/Badge';
import type { RouteRule, OutboundType, CustomOutbound } from '@/api/node';
import {
  type OutboundNodeOption,
  PRESET_OUTBOUND_OPTIONS,
  getOutboundLabel,
} from '../utils/route-rule-utils';

interface RouteRuleEditorProps {
  rule: RouteRule;
  onChange: (rule: RouteRule) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Available nodes for outbound selection */
  nodes?: OutboundNodeOption[];
  /** Current node ID (to exclude from selection) */
  currentNodeId?: string;
  /** Custom outbounds defined in route config */
  customOutbounds?: CustomOutbound[];
}

// Parse comma/newline separated string to array
const parseArrayInput = (input: string): string[] => {
  return input
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

// Convert array to display string
const formatArrayDisplay = (arr?: string[]): string => {
  return (arr || []).join('\n');
};

// Parse comma separated port string to number array
const parsePortInput = (input: string): number[] => {
  return input
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 65535);
};

// Convert port array to display string
const formatPortDisplay = (arr?: number[]): string => {
  return (arr || []).join(', ');
};

/** Section identifier for accordion */
type SectionId = 'domain' | 'ip' | 'geo' | 'port-protocol' | 'rule-set';

/** Get default expanded sections based on existing content */
const getDefaultExpandedSections = (rule: RouteRule): SectionId[] => {
  const sections: SectionId[] = [];
  if (
    rule.domain?.length ||
    rule.domainSuffix?.length ||
    rule.domainKeyword?.length ||
    rule.domainRegex?.length
  ) {
    sections.push('domain');
  }
  if (rule.ipCidr?.length || rule.sourceIpCidr?.length || rule.ipIsPrivate) {
    sections.push('ip');
  }
  if (rule.geoip?.length || rule.geosite?.length) {
    sections.push('geo');
  }
  if (
    rule.port?.length ||
    rule.sourcePort?.length ||
    rule.protocol?.length ||
    rule.network?.length
  ) {
    sections.push('port-protocol');
  }
  if (rule.ruleSet?.length) {
    sections.push('rule-set');
  }
  return sections;
};

export const RouteRuleEditor: React.FC<RouteRuleEditorProps> = ({
  rule,
  onChange,
  disabled = false,
  idPrefix = 'rule',
  nodes = [],
  currentNodeId,
  customOutbounds,
}) => {
  const { t } = useTranslation();
  // Filter out current node from available options
  const availableNodes = nodes.filter((n) => n.id !== currentNodeId);

  // Check if section has content for badge display
  const hasDomainContent = Boolean(
    rule.domain?.length ||
      rule.domainSuffix?.length ||
      rule.domainKeyword?.length ||
      rule.domainRegex?.length
  );
  const hasIpContent = Boolean(
    rule.ipCidr?.length || rule.sourceIpCidr?.length || rule.ipIsPrivate
  );
  const hasGeoContent = Boolean(rule.geoip?.length || rule.geosite?.length);
  const hasPortProtocolContent = Boolean(
    rule.port?.length ||
      rule.sourcePort?.length ||
      rule.protocol?.length ||
      rule.network?.length
  );
  const hasRuleSetContent = Boolean(rule.ruleSet?.length);

  const handleArrayFieldChange = (
    field: keyof RouteRule,
    value: string
  ): void => {
    const arr = parseArrayInput(value);
    onChange({
      ...rule,
      [field]: arr.length > 0 ? arr : undefined,
    });
  };

  const handlePortFieldChange = (
    field: 'port' | 'sourcePort',
    value: string
  ): void => {
    const arr = parsePortInput(value);
    onChange({
      ...rule,
      [field]: arr.length > 0 ? arr : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Outbound action */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-outbound`}>{t('admin.nodes.route.outboundAction')}</Label>
        <Select
          value={rule.outbound}
          onValueChange={(value) =>
            onChange({ ...rule, outbound: value as OutboundType })
          }
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-outbound`}>
            <SelectValue>
              {getOutboundLabel(rule.outbound, nodes, t, customOutbounds)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRESET_OUTBOUND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
            {availableNodes.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {t('admin.nodes.route.routeToNode')}
                </div>
                {availableNodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.name}
                  </SelectItem>
                ))}
              </>
            )}
            {customOutbounds && customOutbounds.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {t('admin.nodes.route.customOutbound.routeToCustom')}
                </div>
                {customOutbounds.map((co) => (
                  <SelectItem key={co.tag} value={co.tag}>
                    {co.tag.replace(/^custom_/, '')} ({co.type})
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t('admin.nodes.route.outboundHint')}
        </p>
      </div>

      {/* Matching conditions accordion */}
      <Accordion
        type="multiple"
        defaultValue={getDefaultExpandedSections(rule)}
        className="w-full"
      >
        {/* Domain matching */}
        <AccordionItem value="domain" className="rounded-xl ring-1 ring-border px-3 mb-2">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('admin.nodes.route.section.domain')}</span>
              {hasDomainContent && (
                <Badge variant="secondary" className="text-xs">
                  {t('admin.nodes.route.configured')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-domain`}>{t('admin.nodes.route.domain.exact')}</Label>
                <Textarea
                  id={`${idPrefix}-domain`}
                  value={formatArrayDisplay(rule.domain)}
                  onChange={(e) =>
                    handleArrayFieldChange('domain', e.target.value)
                  }
                  placeholder="example.com&#10;www.example.com"
                  rows={2}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.domain.exactHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-domainSuffix`}>{t('admin.nodes.route.domain.suffix')}</Label>
                <Textarea
                  id={`${idPrefix}-domainSuffix`}
                  value={formatArrayDisplay(rule.domainSuffix)}
                  onChange={(e) =>
                    handleArrayFieldChange('domainSuffix', e.target.value)
                  }
                  placeholder=".cn&#10;.google.com"
                  rows={2}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.domain.suffixHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-domainKeyword`}>{t('admin.nodes.route.domain.keyword')}</Label>
                <Textarea
                  id={`${idPrefix}-domainKeyword`}
                  value={formatArrayDisplay(rule.domainKeyword)}
                  onChange={(e) =>
                    handleArrayFieldChange('domainKeyword', e.target.value)
                  }
                  placeholder="google&#10;facebook"
                  rows={2}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.domain.keywordHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-domainRegex`}>{t('admin.nodes.route.domain.regex')}</Label>
                <Textarea
                  id={`${idPrefix}-domainRegex`}
                  value={formatArrayDisplay(rule.domainRegex)}
                  onChange={(e) =>
                    handleArrayFieldChange('domainRegex', e.target.value)
                  }
                  placeholder="^ad\\..*$&#10;.*\\.ads\\..*"
                  rows={2}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.domain.regexHint')}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* IP matching */}
        <AccordionItem value="ip" className="rounded-xl ring-1 ring-border px-3 mb-2">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('admin.nodes.route.section.ip')}</span>
              {hasIpContent && (
                <Badge variant="secondary" className="text-xs">
                  {t('admin.nodes.route.configured')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-ipCidr`}>{t('admin.nodes.route.ip.targetCidr')}</Label>
                <Textarea
                  id={`${idPrefix}-ipCidr`}
                  value={formatArrayDisplay(rule.ipCidr)}
                  onChange={(e) =>
                    handleArrayFieldChange('ipCidr', e.target.value)
                  }
                  placeholder="192.168.0.0/16&#10;10.0.0.0/8"
                  rows={2}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.ip.targetCidrHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-sourceIpCidr`}>{t('admin.nodes.route.ip.sourceCidr')}</Label>
                <Textarea
                  id={`${idPrefix}-sourceIpCidr`}
                  value={formatArrayDisplay(rule.sourceIpCidr)}
                  onChange={(e) =>
                    handleArrayFieldChange('sourceIpCidr', e.target.value)
                  }
                  placeholder="192.168.1.0/24"
                  rows={2}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.ip.sourceCidrHint')}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${idPrefix}-ipIsPrivate`}
                  checked={rule.ipIsPrivate || false}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...rule,
                      ipIsPrivate: checked ? true : undefined,
                    })
                  }
                  disabled={disabled}
                />
                <Label htmlFor={`${idPrefix}-ipIsPrivate`}>
                  {t('admin.nodes.route.ip.privateIp')}
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* GeoIP/GeoSite */}
        <AccordionItem value="geo" className="rounded-xl ring-1 ring-border px-3 mb-2">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('admin.nodes.route.section.geo')}</span>
              {hasGeoContent && (
                <Badge variant="secondary" className="text-xs">
                  {t('admin.nodes.route.configured')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-geoip`}>GeoIP</Label>
                <Textarea
                  id={`${idPrefix}-geoip`}
                  value={formatArrayDisplay(rule.geoip)}
                  onChange={(e) =>
                    handleArrayFieldChange('geoip', e.target.value)
                  }
                  placeholder="cn&#10;us&#10;private"
                  rows={2}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.geo.geoipHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-geosite`}>GeoSite</Label>
                <Textarea
                  id={`${idPrefix}-geosite`}
                  value={formatArrayDisplay(rule.geosite)}
                  onChange={(e) =>
                    handleArrayFieldChange('geosite', e.target.value)
                  }
                  placeholder="cn&#10;google&#10;telegram"
                  rows={2}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.geo.geositeHint')}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Port/Protocol */}
        <AccordionItem
          value="port-protocol"
          className="rounded-xl ring-1 ring-border px-3 mb-2"
        >
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('admin.nodes.route.section.portProtocol')}</span>
              {hasPortProtocolContent && (
                <Badge variant="secondary" className="text-xs">
                  {t('admin.nodes.route.configured')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-port`}>{t('admin.nodes.route.port.target')}</Label>
                  <Textarea
                    id={`${idPrefix}-port`}
                    value={formatPortDisplay(rule.port)}
                    onChange={(e) =>
                      handlePortFieldChange('port', e.target.value)
                    }
                    placeholder="80, 443, 8080"
                    rows={1}
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-sourcePort`}>{t('admin.nodes.route.port.source')}</Label>
                  <Textarea
                    id={`${idPrefix}-sourcePort`}
                    value={formatPortDisplay(rule.sourcePort)}
                    onChange={(e) =>
                      handlePortFieldChange('sourcePort', e.target.value)
                    }
                    placeholder="1024, 2048"
                    rows={1}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-protocol`}>{t('common.protocol')}</Label>
                <Textarea
                  id={`${idPrefix}-protocol`}
                  value={formatArrayDisplay(rule.protocol)}
                  onChange={(e) =>
                    handleArrayFieldChange('protocol', e.target.value)
                  }
                  placeholder="http&#10;tls&#10;quic"
                  rows={2}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.protocol.hint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-network`}>{t('admin.nodes.route.network.label')}</Label>
                <Textarea
                  id={`${idPrefix}-network`}
                  value={formatArrayDisplay(rule.network)}
                  onChange={(e) =>
                    handleArrayFieldChange('network', e.target.value)
                  }
                  placeholder="tcp&#10;udp"
                  rows={1}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.nodes.route.network.hint')}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rule set */}
        <AccordionItem value="rule-set" className="rounded-xl ring-1 ring-border px-3">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('admin.nodes.route.section.ruleSet')}</span>
              {hasRuleSetContent && (
                <Badge variant="secondary" className="text-xs">
                  {t('admin.nodes.route.configured')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-ruleSet`}>{t('admin.nodes.route.ruleSet.label')}</Label>
              <Textarea
                id={`${idPrefix}-ruleSet`}
                value={formatArrayDisplay(rule.ruleSet)}
                onChange={(e) =>
                  handleArrayFieldChange('ruleSet', e.target.value)
                }
                placeholder="geoip-cn&#10;geosite-cn"
                rows={2}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.nodes.route.ruleSet.hint')}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
