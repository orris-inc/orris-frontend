/**
 * Route rule editor component
 * Edit a single routing rule with all matching conditions
 */

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
import type { RouteRule, OutboundType } from '@/api/node';

/** Simple node info for outbound selection */
export interface OutboundNodeOption {
  id: string;
  name: string;
}

interface RouteRuleEditorProps {
  rule: RouteRule;
  onChange: (rule: RouteRule) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Available nodes for outbound selection */
  nodes?: OutboundNodeOption[];
  /** Current node ID (to exclude from selection) */
  currentNodeId?: string;
}

const PRESET_OUTBOUND_OPTIONS: { value: OutboundType; label: string }[] = [
  { value: 'proxy', label: '代理' },
  { value: 'direct', label: '直连' },
  { value: 'block', label: '阻断' },
];

/** Check if outbound value is a node reference */
export const isNodeOutbound = (outbound: OutboundType): boolean => {
  return outbound.startsWith('node_');
};

/** Get display label for outbound value */
export const getOutboundLabel = (
  outbound: OutboundType,
  nodes?: OutboundNodeOption[]
): string => {
  if (!isNodeOutbound(outbound)) {
    const preset = PRESET_OUTBOUND_OPTIONS.find((o) => o.value === outbound);
    return preset?.label || outbound;
  }
  const node = nodes?.find((n) => n.id === outbound);
  return node ? `节点: ${node.name}` : outbound;
};

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
}) => {
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
        <Label htmlFor={`${idPrefix}-outbound`}>出站动作</Label>
        <Select
          value={rule.outbound}
          onValueChange={(value) =>
            onChange({ ...rule, outbound: value as OutboundType })
          }
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-outbound`}>
            <SelectValue>
              {getOutboundLabel(rule.outbound, nodes)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRESET_OUTBOUND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
            {availableNodes.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  路由到节点
                </div>
                {availableNodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.name}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          选择流量处理方式或路由到指定节点
        </p>
      </div>

      {/* Matching conditions accordion */}
      <Accordion
        type="multiple"
        defaultValue={getDefaultExpandedSections(rule)}
        className="w-full"
      >
        {/* Domain matching */}
        <AccordionItem value="domain" className="border rounded-md px-3 mb-2">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">域名匹配</span>
              {hasDomainContent && (
                <Badge variant="secondary" className="text-xs">
                  已配置
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-domain`}>精确域名</Label>
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
                  每行一个或逗号分隔，精确匹配整个域名
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-domainSuffix`}>域名后缀</Label>
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
                  匹配以指定后缀结尾的域名
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-domainKeyword`}>域名关键字</Label>
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
                  匹配包含指定关键字的域名
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-domainRegex`}>域名正则</Label>
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
                  使用正则表达式匹配域名
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* IP matching */}
        <AccordionItem value="ip" className="border rounded-md px-3 mb-2">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">IP 匹配</span>
              {hasIpContent && (
                <Badge variant="secondary" className="text-xs">
                  已配置
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-ipCidr`}>目标 IP CIDR</Label>
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
                  匹配目标 IP 地址范围（CIDR 格式）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-sourceIpCidr`}>源 IP CIDR</Label>
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
                  匹配源 IP 地址范围（CIDR 格式）
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
                  匹配私有/内网 IP
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* GeoIP/GeoSite */}
        <AccordionItem value="geo" className="border rounded-md px-3 mb-2">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">GeoIP / GeoSite</span>
              {hasGeoContent && (
                <Badge variant="secondary" className="text-xs">
                  已配置
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
                  匹配 IP 所属国家/地区代码（如 cn, us）
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
                  匹配预定义的域名分类（如 cn, google, telegram）
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Port/Protocol */}
        <AccordionItem
          value="port-protocol"
          className="border rounded-md px-3 mb-2"
        >
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">端口 / 协议</span>
              {hasPortProtocolContent && (
                <Badge variant="secondary" className="text-xs">
                  已配置
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${idPrefix}-port`}>目标端口</Label>
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
                  <Label htmlFor={`${idPrefix}-sourcePort`}>源端口</Label>
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
                <Label htmlFor={`${idPrefix}-protocol`}>协议</Label>
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
                  匹配嗅探到的协议（如 http, tls, quic）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-network`}>网络类型</Label>
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
                  匹配网络类型（tcp, udp）
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rule set */}
        <AccordionItem value="rule-set" className="border rounded-md px-3">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">规则集</span>
              {hasRuleSetContent && (
                <Badge variant="secondary" className="text-xs">
                  已配置
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-ruleSet`}>规则集引用</Label>
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
                引用预定义的规则集名称
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
