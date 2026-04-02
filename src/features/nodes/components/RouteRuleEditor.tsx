/**
 * Route rule editor component
 * Edit a single routing rule with all matching conditions
 */

import { useState, useEffect, useCallback } from 'react';
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

/** Text field names that use local state for performance */
type TextFieldKey =
  | 'domain' | 'domainSuffix' | 'domainKeyword' | 'domainRegex'
  | 'ipCidr' | 'sourceIpCidr'
  | 'geoip' | 'geosite'
  | 'port' | 'sourcePort'
  | 'protocol' | 'network' | 'ruleSet';

const PORT_FIELDS: readonly TextFieldKey[] = ['port', 'sourcePort'];

/** Build local text state from rule */
const buildLocalText = (rule: RouteRule): Record<TextFieldKey, string> => ({
  domain: formatArrayDisplay(rule.domain),
  domainSuffix: formatArrayDisplay(rule.domainSuffix),
  domainKeyword: formatArrayDisplay(rule.domainKeyword),
  domainRegex: formatArrayDisplay(rule.domainRegex),
  ipCidr: formatArrayDisplay(rule.ipCidr),
  sourceIpCidr: formatArrayDisplay(rule.sourceIpCidr),
  geoip: formatArrayDisplay(rule.geoip),
  geosite: formatArrayDisplay(rule.geosite),
  port: formatPortDisplay(rule.port),
  sourcePort: formatPortDisplay(rule.sourcePort),
  protocol: formatArrayDisplay(rule.protocol),
  network: formatArrayDisplay(rule.network),
  ruleSet: formatArrayDisplay(rule.ruleSet),
});

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
  const availableNodes = nodes.filter((n) => n.id !== currentNodeId);

  // Local text state — edits happen here, flushed to parent on blur
  const [localText, setLocalText] = useState(() => buildLocalText(rule));

  // Sync from parent when rule reference changes (e.g. reorder)
  useEffect(() => {
    setLocalText(buildLocalText(rule));
  }, [rule]);

  const handleLocalChange = useCallback((field: TextFieldKey, value: string) => {
    setLocalText((prev) => ({ ...prev, [field]: value }));
  }, []);

  const flushField = useCallback((field: TextFieldKey) => {
    const value = localText[field];
    if (PORT_FIELDS.includes(field)) {
      const arr = parsePortInput(value);
      onChange({ ...rule, [field]: arr.length > 0 ? arr : undefined });
    } else {
      const arr = parseArrayInput(value);
      onChange({ ...rule, [field]: arr.length > 0 ? arr : undefined });
    }
  }, [localText, rule, onChange]);

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
                  value={localText.domain}
                  onChange={(e) => handleLocalChange('domain', e.target.value)}
                  onBlur={() => flushField('domain')}
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
                  value={localText.domainSuffix}
                  onChange={(e) => handleLocalChange('domainSuffix', e.target.value)}
                  onBlur={() => flushField('domainSuffix')}
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
                  value={localText.domainKeyword}
                  onChange={(e) => handleLocalChange('domainKeyword', e.target.value)}
                  onBlur={() => flushField('domainKeyword')}
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
                  value={localText.domainRegex}
                  onChange={(e) => handleLocalChange('domainRegex', e.target.value)}
                  onBlur={() => flushField('domainRegex')}
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
                  value={localText.ipCidr}
                  onChange={(e) => handleLocalChange('ipCidr', e.target.value)}
                  onBlur={() => flushField('ipCidr')}
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
                  value={localText.sourceIpCidr}
                  onChange={(e) => handleLocalChange('sourceIpCidr', e.target.value)}
                  onBlur={() => flushField('sourceIpCidr')}
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
                  value={localText.geoip}
                  onChange={(e) => handleLocalChange('geoip', e.target.value)}
                  onBlur={() => flushField('geoip')}
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
                  value={localText.geosite}
                  onChange={(e) => handleLocalChange('geosite', e.target.value)}
                  onBlur={() => flushField('geosite')}
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
                    value={localText.port}
                    onChange={(e) => handleLocalChange('port', e.target.value)}
                    onBlur={() => flushField('port')}
                    placeholder="80, 443, 8080"
                    rows={1}
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-sourcePort`}>{t('admin.nodes.route.port.source')}</Label>
                  <Textarea
                    id={`${idPrefix}-sourcePort`}
                    value={localText.sourcePort}
                    onChange={(e) => handleLocalChange('sourcePort', e.target.value)}
                    onBlur={() => flushField('sourcePort')}
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
                  value={localText.protocol}
                  onChange={(e) => handleLocalChange('protocol', e.target.value)}
                  onBlur={() => flushField('protocol')}
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
                  value={localText.network}
                  onChange={(e) => handleLocalChange('network', e.target.value)}
                  onBlur={() => flushField('network')}
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
                value={localText.ruleSet}
                onChange={(e) => handleLocalChange('ruleSet', e.target.value)}
                onBlur={() => flushField('ruleSet')}
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
