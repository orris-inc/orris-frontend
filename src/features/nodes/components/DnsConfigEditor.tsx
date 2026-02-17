/**
 * DNS configuration editor component
 * Main editor with visual form mode and JSON advanced mode
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Code, FormInput, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Alert } from '@/components/common/Alert';
import { Separator } from '@/components/common/Separator';
import { Switch } from '@/components/common/Switch';
import { DnsServersList } from './DnsServersList';
import { DnsRulesList } from './DnsRulesList';
import type { DnsConfig, DnsStrategy } from '@/api/node';
import type { OutboundNodeOption } from '../utils/route-rule-utils';

interface DnsConfigEditorProps {
  value: DnsConfig | undefined;
  onChange: (config: DnsConfig | undefined) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Available nodes for outbound/detour selection */
  nodes?: OutboundNodeOption[];
  /** Current node ID (to exclude from selection) */
  currentNodeId?: string;
}

const DNS_STRATEGY_OPTIONS: { value: DnsStrategy; labelKey: string }[] = [
  { value: 'prefer_ipv4', labelKey: 'admin.nodes.dns.strategyOptions.prefer_ipv4' },
  { value: 'prefer_ipv6', labelKey: 'admin.nodes.dns.strategyOptions.prefer_ipv6' },
  { value: 'ipv4_only', labelKey: 'admin.nodes.dns.strategyOptions.ipv4_only' },
  { value: 'ipv6_only', labelKey: 'admin.nodes.dns.strategyOptions.ipv6_only' },
];

const getDefaultConfig = (): DnsConfig => ({
  final: 'local',
  servers: [{ tag: 'local', address: '223.5.5.5' }],
  rules: [],
  disableCache: false,
  disableExpire: false,
  independentCache: false,
  reverseMapping: false,
});

export const DnsConfigEditor: React.FC<DnsConfigEditorProps> = ({
  value,
  onChange,
  disabled = false,
  idPrefix = 'dns',
  nodes = [],
  currentNodeId,
}) => {
  const { t } = useTranslation();
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const availableNodes = nodes.filter((n) => n.id !== currentNodeId);
  const serverTags = (value?.servers || []).map((s) => s.tag);

  useEffect(() => {
    if (editorMode === 'json' && value) {
      setJsonText(JSON.stringify(value, null, 2));
    }
  }, [editorMode, value]);

  const handleSwitchToJson = () => {
    if (value) {
      setJsonText(JSON.stringify(value, null, 2));
    } else {
      setJsonText(JSON.stringify(getDefaultConfig(), null, 2));
    }
    setJsonError(null);
    setEditorMode('json');
  };

  const handleSwitchToVisual = () => {
    if (!jsonText.trim()) {
      onChange(undefined);
      setEditorMode('visual');
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== 'object' || parsed === null) {
        setJsonError(t('admin.nodes.dns.json.mustBeObject'));
        return;
      }
      if (!parsed.final || typeof parsed.final !== 'string') {
        setJsonError(t('admin.nodes.dns.json.invalidFinal'));
        return;
      }
      onChange(parsed as DnsConfig);
      setJsonError(null);
      setEditorMode('visual');
    } catch {
      setJsonError(t('admin.nodes.dns.json.parseErrorSwitch'));
    }
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setJsonError(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null && parsed.final) {
        onChange(parsed as DnsConfig);
        setJsonError(null);
      }
    } catch {
      setJsonError(t('admin.nodes.dns.json.parseError'));
    }
  };

  const handleEnableConfig = () => {
    onChange(getDefaultConfig());
  };

  const handleDisableConfig = () => {
    onChange(undefined);
  };

  const updateConfig = (partial: Partial<DnsConfig>) => {
    onChange({ ...(value || getDefaultConfig()), ...partial });
  };

  // No config - show enable button
  if (!value && editorMode === 'visual') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">{t('admin.nodes.dns.title')}</Label>
        </div>
        <div className="rounded-xl ring-1 ring-dashed ring-border p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{t('admin.nodes.dns.noConfigHint')}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableConfig}
            disabled={disabled}
          >
            {t('admin.nodes.dns.enableConfig')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{t('admin.nodes.dns.title')}</Label>
        <div className="flex rounded-xl bg-muted/50 ring-1 ring-border p-0.5">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-all',
              editorMode === 'visual'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => editorMode === 'json' && handleSwitchToVisual()}
            disabled={disabled}
          >
            <FormInput className="h-3.5 w-3.5" />
            {t('admin.nodes.dns.modeVisual')}
          </button>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-all',
              editorMode === 'json'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => editorMode === 'visual' && handleSwitchToJson()}
            disabled={disabled}
          >
            <Code className="h-3.5 w-3.5" />
            JSON
          </button>
        </div>
      </div>

      {editorMode === 'visual' ? (
        <div className="space-y-4">
          {/* Default DNS Server */}
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-final`}>{t('admin.nodes.dns.defaultServer')}</Label>
            <Select
              value={value?.final || 'local'}
              onValueChange={(v) => updateConfig({ final: v })}
              disabled={disabled}
            >
              <SelectTrigger id={`${idPrefix}-final`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serverTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('admin.nodes.dns.defaultServerHint')}
            </p>
          </div>

          {/* DNS Strategy */}
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-strategy`}>{t('admin.nodes.dns.strategy')}</Label>
            <Select
              value={value?.strategy || '__none__'}
              onValueChange={(v) => updateConfig({ strategy: v === '__none__' ? undefined : v as DnsStrategy })}
              disabled={disabled}
            >
              <SelectTrigger id={`${idPrefix}-strategy`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {DNS_STRATEGY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('admin.nodes.dns.strategyHint')}
            </p>
          </div>

          <Separator />

          {/* Cache Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('admin.nodes.dns.cache.title')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg ring-1 ring-border p-3">
                <div>
                  <p className="text-sm font-medium">{t('admin.nodes.dns.cache.disableCache')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.nodes.dns.cache.disableCacheHint')}</p>
                </div>
                <Switch
                  checked={value?.disableCache ?? false}
                  onCheckedChange={(checked) => updateConfig({ disableCache: checked })}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg ring-1 ring-border p-3">
                <div>
                  <p className="text-sm font-medium">{t('admin.nodes.dns.cache.disableExpire')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.nodes.dns.cache.disableExpireHint')}</p>
                </div>
                <Switch
                  checked={value?.disableExpire ?? false}
                  onCheckedChange={(checked) => updateConfig({ disableExpire: checked })}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg ring-1 ring-border p-3">
                <div>
                  <p className="text-sm font-medium">{t('admin.nodes.dns.cache.independentCache')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.nodes.dns.cache.independentCacheHint')}</p>
                </div>
                <Switch
                  checked={value?.independentCache ?? false}
                  onCheckedChange={(checked) => updateConfig({ independentCache: checked })}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg ring-1 ring-border p-3">
                <div>
                  <p className="text-sm font-medium">{t('admin.nodes.dns.cache.reverseMapping')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.nodes.dns.cache.reverseMappingHint')}</p>
                </div>
                <Switch
                  checked={value?.reverseMapping ?? false}
                  onCheckedChange={(checked) => updateConfig({ reverseMapping: checked })}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* DNS Servers */}
          <DnsServersList
            servers={value?.servers || []}
            onChange={(servers) => updateConfig({ servers })}
            disabled={disabled}
            idPrefix={idPrefix}
            nodes={availableNodes}
          />

          <Separator />

          {/* DNS Rules */}
          <DnsRulesList
            rules={value?.rules || []}
            onChange={(rules) => updateConfig({ rules })}
            disabled={disabled}
            idPrefix={idPrefix}
            serverTags={serverTags}
          />

          <Separator />

          {/* Disable button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisableConfig}
              disabled={disabled}
              className="text-muted-foreground"
            >
              {t('admin.nodes.dns.disableConfig')}
            </Button>
          </div>
        </div>
      ) : (
        // JSON mode
        <div className="space-y-3">
          <Textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={`{
  "final": "local",
  "servers": [{ "tag": "local", "address": "223.5.5.5" }],
  "rules": []
}`}
            rows={15}
            className="font-mono text-sm"
            disabled={disabled}
          />

          {jsonError && (
            <Alert variant="destructive" className="py-2">
              {jsonError}
            </Alert>
          )}

          <p className="text-xs text-muted-foreground">
            {t('admin.nodes.dns.json.hint')}
          </p>

          {/* Disable button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleDisableConfig();
                setEditorMode('visual');
              }}
              disabled={disabled}
              className="text-muted-foreground"
            >
              {t('admin.nodes.dns.disableConfig')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
