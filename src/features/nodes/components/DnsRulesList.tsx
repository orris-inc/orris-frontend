/**
 * DNS rules list component
 * Manage a list of DNS routing rules with add/delete/reorder and inline editing
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
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Switch } from '@/components/common/Switch';
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
import type { DnsRule } from '@/api/node';

interface DnsRulesListProps {
  rules: DnsRule[];
  onChange: (rules: DnsRule[]) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Available DNS server tags for target server selection */
  serverTags: string[];
}

// Parse newline/comma separated string to array
const parseArrayInput = (input: string): string[] =>
  input.split(/[,\n]/).map((s) => s.trim()).filter((s) => s.length > 0);

// Convert array to display string
const formatArrayDisplay = (arr?: string[]): string =>
  (arr || []).join('\n');

// Generate rule summary for collapsed view
const getRuleSummary = (rule: DnsRule, t: (key: string) => string): string => {
  const parts: string[] = [];
  if (rule.domain?.length) parts.push(`${t('admin.nodes.route.display.domain')}: ${rule.domain.length}`);
  if (rule.domainSuffix?.length) parts.push(`${t('admin.nodes.route.display.suffix')}: ${rule.domainSuffix.length}`);
  if (rule.domainKeyword?.length) parts.push(`${t('admin.nodes.route.display.keyword')}: ${rule.domainKeyword.length}`);
  if (rule.geosite?.length) parts.push(`GeoSite: ${rule.geosite.join(', ')}`);
  if (rule.geoip?.length) parts.push(`GeoIP: ${rule.geoip.join(', ')}`);
  if (rule.ruleSet?.length) parts.push(`${t('admin.nodes.route.display.ruleSet')}: ${rule.ruleSet.length}`);
  if (rule.outbound?.length) parts.push(`${t('admin.nodes.dns.rules.outbound')}: ${rule.outbound.length}`);
  return parts.length > 0 ? parts.join(' | ') : t('admin.nodes.route.display.noConditions');
};

type SectionId = 'domain' | 'geo' | 'rule-set' | 'outbound';

const getDefaultExpandedSections = (rule: DnsRule): SectionId[] => {
  const sections: SectionId[] = [];
  if (rule.domain?.length || rule.domainSuffix?.length || rule.domainKeyword?.length || rule.domainRegex?.length) sections.push('domain');
  if (rule.geosite?.length || rule.geoip?.length) sections.push('geo');
  if (rule.ruleSet?.length) sections.push('rule-set');
  if (rule.outbound?.length) sections.push('outbound');
  return sections;
};

export const DnsRulesList: React.FC<DnsRulesListProps> = ({
  rules,
  onChange,
  disabled = false,
  idPrefix = 'dns-rules',
  serverTags,
}) => {
  const { t } = useTranslation();
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const handleAdd = () => {
    const newRule: DnsRule = {
      server: serverTags[0] || '',
      disableCache: false,
    };
    onChange([...rules, newRule]);
    setExpandedIndices((prev) => new Set([...prev, rules.length]));
  };

  const handleRemove = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
    setExpandedIndices((prev) => {
      const newSet = new Set<number>();
      prev.forEach((i) => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
  };

  const handleUpdate = (index: number, rule: DnsRule) => {
    onChange(rules.map((r, i) => (i === index ? rule : r)));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newRules = [...rules];
    [newRules[index - 1], newRules[index]] = [newRules[index], newRules[index - 1]];
    onChange(newRules);
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
    [newRules[index], newRules[index + 1]] = [newRules[index + 1], newRules[index]];
    onChange(newRules);
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
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">{t('admin.nodes.dns.rules.title')}</h4>
        <Button variant="outline" size="sm" onClick={handleAdd} disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          {t('admin.nodes.dns.rules.add')}
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4 rounded-xl ring-1 ring-dashed ring-border">
          {t('admin.nodes.dns.display.noRules')}
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => {
            const isExpanded = expandedIndices.has(index);
            return (
              <Card key={index} className="overflow-hidden border-l-[3px] border-l-primary">
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
                    <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                      → {rule.server}
                    </Badge>
                    {!isExpanded && (
                      <span className="text-xs text-muted-foreground truncate">
                        {getRuleSummary(rule, t)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveUp(index)} disabled={disabled || index === 0}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveDown(index)} disabled={disabled || index === rules.length - 1}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemove(index)} disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                {isExpanded && (
                  <div className="border-t p-4 space-y-4">
                    {/* Target server + disable cache */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-${index}-server`} className="text-xs">
                          {t('admin.nodes.dns.rules.server')}
                        </Label>
                        <Select
                          value={rule.server}
                          onValueChange={(v) => handleUpdate(index, { ...rule, server: v })}
                          disabled={disabled}
                        >
                          <SelectTrigger id={`${idPrefix}-${index}-server`} className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {serverTags.map((tag) => (
                              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{t('admin.nodes.dns.rules.serverHint')}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('admin.nodes.dns.rules.disableCache')}</Label>
                        <div className="flex items-center h-9 px-3 rounded-md ring-1 ring-border">
                          <Switch
                            checked={rule.disableCache}
                            onCheckedChange={(checked) => handleUpdate(index, { ...rule, disableCache: checked })}
                            disabled={disabled}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Accordion sections for matching conditions */}
                    <Accordion type="multiple" defaultValue={getDefaultExpandedSections(rule)} className="w-full">
                      {/* Domain Matching */}
                      <AccordionItem value="domain" className="border-b-0">
                        <AccordionTrigger className="py-2 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{t('admin.nodes.route.section.domain')}</span>
                            {(rule.domain?.length || rule.domainSuffix?.length || rule.domainKeyword?.length || rule.domainRegex?.length) ? (
                              <Badge variant="secondary" className="text-[10px]">
                                {(rule.domain?.length || 0) + (rule.domainSuffix?.length || 0) + (rule.domainKeyword?.length || 0) + (rule.domainRegex?.length || 0)}
                              </Badge>
                            ) : null}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-xs">{t('admin.nodes.route.domain.exact')}</Label>
                              <Textarea
                                value={formatArrayDisplay(rule.domain)}
                                onChange={(e) => {
                                  const arr = parseArrayInput(e.target.value);
                                  handleUpdate(index, { ...rule, domain: arr.length > 0 ? arr : undefined });
                                }}
                                placeholder={t('admin.nodes.route.domain.exactHint')}
                                rows={2}
                                className="text-xs font-mono"
                                disabled={disabled}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">{t('admin.nodes.route.domain.suffix')}</Label>
                              <Textarea
                                value={formatArrayDisplay(rule.domainSuffix)}
                                onChange={(e) => {
                                  const arr = parseArrayInput(e.target.value);
                                  handleUpdate(index, { ...rule, domainSuffix: arr.length > 0 ? arr : undefined });
                                }}
                                placeholder={t('admin.nodes.route.domain.suffixHint')}
                                rows={2}
                                className="text-xs font-mono"
                                disabled={disabled}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">{t('admin.nodes.route.domain.keyword')}</Label>
                              <Textarea
                                value={formatArrayDisplay(rule.domainKeyword)}
                                onChange={(e) => {
                                  const arr = parseArrayInput(e.target.value);
                                  handleUpdate(index, { ...rule, domainKeyword: arr.length > 0 ? arr : undefined });
                                }}
                                placeholder={t('admin.nodes.route.domain.keywordHint')}
                                rows={2}
                                className="text-xs font-mono"
                                disabled={disabled}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">{t('admin.nodes.route.domain.regex')}</Label>
                              <Textarea
                                value={formatArrayDisplay(rule.domainRegex)}
                                onChange={(e) => {
                                  const arr = parseArrayInput(e.target.value);
                                  handleUpdate(index, { ...rule, domainRegex: arr.length > 0 ? arr : undefined });
                                }}
                                placeholder={t('admin.nodes.route.domain.regexHint')}
                                rows={2}
                                className="text-xs font-mono"
                                disabled={disabled}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Geo Matching */}
                      <AccordionItem value="geo" className="border-b-0">
                        <AccordionTrigger className="py-2 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{t('admin.nodes.route.section.geo')}</span>
                            {(rule.geosite?.length || rule.geoip?.length) ? (
                              <Badge variant="secondary" className="text-[10px]">
                                {(rule.geosite?.length || 0) + (rule.geoip?.length || 0)}
                              </Badge>
                            ) : null}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-xs">GeoSite</Label>
                              <Textarea
                                value={formatArrayDisplay(rule.geosite)}
                                onChange={(e) => {
                                  const arr = parseArrayInput(e.target.value);
                                  handleUpdate(index, { ...rule, geosite: arr.length > 0 ? arr : undefined });
                                }}
                                placeholder={t('admin.nodes.route.geo.geositeHint')}
                                rows={2}
                                className="text-xs font-mono"
                                disabled={disabled}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">GeoIP</Label>
                              <Textarea
                                value={formatArrayDisplay(rule.geoip)}
                                onChange={(e) => {
                                  const arr = parseArrayInput(e.target.value);
                                  handleUpdate(index, { ...rule, geoip: arr.length > 0 ? arr : undefined });
                                }}
                                placeholder={t('admin.nodes.route.geo.geoipHint')}
                                rows={2}
                                className="text-xs font-mono"
                                disabled={disabled}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Rule Set */}
                      <AccordionItem value="rule-set" className="border-b-0">
                        <AccordionTrigger className="py-2 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{t('admin.nodes.route.section.ruleSet')}</span>
                            {rule.ruleSet?.length ? (
                              <Badge variant="secondary" className="text-[10px]">{rule.ruleSet.length}</Badge>
                            ) : null}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-1">
                            <Label className="text-xs">{t('admin.nodes.route.ruleSet.label')}</Label>
                            <Textarea
                              value={formatArrayDisplay(rule.ruleSet)}
                              onChange={(e) => {
                                const arr = parseArrayInput(e.target.value);
                                handleUpdate(index, { ...rule, ruleSet: arr.length > 0 ? arr : undefined });
                              }}
                              placeholder={t('admin.nodes.route.ruleSet.hint')}
                              rows={2}
                              className="text-xs font-mono"
                              disabled={disabled}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Outbound Matching */}
                      <AccordionItem value="outbound" className="border-b-0">
                        <AccordionTrigger className="py-2 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{t('admin.nodes.dns.rules.outbound')}</span>
                            {rule.outbound?.length ? (
                              <Badge variant="secondary" className="text-[10px]">{rule.outbound.length}</Badge>
                            ) : null}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-1">
                            <Label className="text-xs">{t('admin.nodes.dns.rules.outbound')}</Label>
                            <Textarea
                              value={formatArrayDisplay(rule.outbound)}
                              onChange={(e) => {
                                const arr = parseArrayInput(e.target.value);
                                handleUpdate(index, { ...rule, outbound: arr.length > 0 ? arr : undefined });
                              }}
                              placeholder={t('admin.nodes.dns.rules.outboundHint')}
                              rows={2}
                              className="text-xs font-mono"
                              disabled={disabled}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
