/**
 * Route configuration editor component
 * Main editor with visual form mode and JSON advanced mode
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { Code, FormInput, Plus, Trash2, Pencil, ChevronDown, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
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
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Separator } from '@/components/common/Separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/Collapsible';
import { RouteRulesList } from './RouteRulesList';
import {
  getOutboundLabel,
  type OutboundNodeOption,
} from '../utils/route-rule-utils';
import type { RouteConfig, OutboundType, CustomOutbound, RuleSetEntry } from '@/api/node';

interface RouteConfigEditorProps {
  value: RouteConfig | undefined;
  onChange: (config: RouteConfig | undefined) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Available nodes for outbound selection */
  nodes?: OutboundNodeOption[];
  /** Current node ID (to exclude from selection) */
  currentNodeId?: string;
}

const PRESET_OUTBOUND_OPTIONS: { value: OutboundType; labelKey: string }[] = [
  { value: 'proxy', labelKey: 'admin.nodes.route.outbound.proxy' },
  { value: 'direct', labelKey: 'admin.nodes.route.outbound.direct' },
  { value: 'block', labelKey: 'admin.nodes.route.outbound.block' },
];

// Protocol type to left-border color (catalog card pattern)
const PROTOCOL_BORDER_COLOR: Record<string, string> = {
  shadowsocks: 'border-l-info',
  trojan: 'border-l-warning',
  vless: 'border-l-primary',
  vmess: 'border-l-primary',
  hysteria2: 'border-l-relay',
  tuic: 'border-l-relay',
  anytls: 'border-l-success',
  socks: 'border-l-muted-foreground',
  http: 'border-l-muted-foreground',
};

// Default configuration when enabling route config
const getDefaultConfig = (): RouteConfig => ({
  final: 'proxy',
  rules: [],
});

const generateCustomTag = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'custom_';
  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

export const RouteConfigEditor: React.FC<RouteConfigEditorProps> = ({
  value,
  onChange,
  disabled = false,
  idPrefix = 'route',
  nodes = [],
  currentNodeId,
}) => {
  const { t } = useTranslation();
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customOutboundsOpen, setCustomOutboundsOpen] = useState(false);
  const [ruleSetEntriesOpen, setRuleSetEntriesOpen] = useState(false);
  const [editingRuleSetIndex, setEditingRuleSetIndex] = useState<number | null>(null);

  // Filter out current node from available options
  const availableNodes = nodes.filter((n) => n.id !== currentNodeId);
  const customOutbounds = value?.customOutbounds || [];
  const ruleSetEntries = value?.ruleSetEntries || [];

  // Sync JSON text when switching to JSON mode or when value changes
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
      // Validate basic structure
      if (typeof parsed !== 'object' || parsed === null) {
        setJsonError(t('admin.nodes.route.json.mustBeObject'));
        return;
      }
      // Validate final field - can be preset type, node reference, or custom outbound reference
      const isValidFinal =
        parsed.final &&
        (['direct', 'block', 'proxy'].includes(parsed.final) ||
          parsed.final.startsWith('node_') ||
          parsed.final.startsWith('custom_'));
      if (!isValidFinal) {
        setJsonError(t('admin.nodes.route.json.invalidFinal'));
        return;
      }
      onChange(parsed as RouteConfig);
      setJsonError(null);
      setEditorMode('visual');
    } catch {
      setJsonError(t('admin.nodes.route.json.parseErrorSwitch'));
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
        onChange(parsed as RouteConfig);
        setJsonError(null);
      }
    } catch {
      setJsonError(t('admin.nodes.route.json.parseError'));
    }
  };

  const handleEnableConfig = () => {
    onChange(getDefaultConfig());
  };

  const handleDisableConfig = () => {
    onChange(undefined);
  };

  const handleFinalChange = (final: OutboundType) => {
    onChange({
      ...(value || getDefaultConfig()),
      final,
    });
  };

  const handleRulesChange = (rules: RouteConfig['rules']) => {
    onChange({
      ...(value || getDefaultConfig()),
      rules,
    });
  };

  const handleCustomOutboundsChange = (newCustomOutbounds: CustomOutbound[]) => {
    onChange({
      ...(value || getDefaultConfig()),
      customOutbounds: newCustomOutbounds.length > 0 ? newCustomOutbounds : undefined,
    });
  };

  const handleAddCustomOutbound = () => {
    const newEntry: CustomOutbound = {
      tag: generateCustomTag(),
      type: 'shadowsocks',
      server: '',
      serverPort: 443,
    };
    const updated = [...customOutbounds, newEntry];
    handleCustomOutboundsChange(updated);
    setEditingIndex(updated.length - 1);
    setCustomOutboundsOpen(true);
  };

  const handleUpdateCustomOutbound = (index: number, entry: CustomOutbound) => {
    const updated = customOutbounds.map((c, i) => (i === index ? entry : c));
    handleCustomOutboundsChange(updated);
  };

  const handleDeleteCustomOutbound = (index: number) => {
    const updated = customOutbounds.filter((_, i) => i !== index);
    handleCustomOutboundsChange(updated);
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  const handleRuleSetEntriesChange = (newEntries: RuleSetEntry[]) => {
    onChange({
      ...(value || getDefaultConfig()),
      ruleSetEntries: newEntries.length > 0 ? newEntries : undefined,
    });
  };

  const handleAddRuleSetEntry = () => {
    const newEntry: RuleSetEntry = {
      tag: '',
      url: '',
    };
    const updated = [...ruleSetEntries, newEntry];
    handleRuleSetEntriesChange(updated);
    setEditingRuleSetIndex(updated.length - 1);
    setRuleSetEntriesOpen(true);
  };

  const handleUpdateRuleSetEntry = (index: number, entry: RuleSetEntry) => {
    const updated = ruleSetEntries.map((e, i) => (i === index ? entry : e));
    handleRuleSetEntriesChange(updated);
  };

  const handleDeleteRuleSetEntry = (index: number) => {
    const updated = ruleSetEntries.filter((_, i) => i !== index);
    handleRuleSetEntriesChange(updated);
    if (editingRuleSetIndex === index) setEditingRuleSetIndex(null);
    else if (editingRuleSetIndex !== null && editingRuleSetIndex > index) setEditingRuleSetIndex(editingRuleSetIndex - 1);
  };

  // No config - show enable button
  if (!value && editorMode === 'visual') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">{t('admin.nodes.route.title')}</Label>
        </div>
        <div className="rounded-xl ring-1 ring-dashed ring-border p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
            <Route className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">{t('admin.nodes.route.noConfigHint')}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableConfig}
            disabled={disabled}
          >
            {t('admin.nodes.route.enableConfig')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{t('admin.nodes.route.title')}</Label>
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
            {t('admin.nodes.route.modeVisual')}
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
        // Visual mode
        <div className="space-y-4">
          {/* Default outbound */}
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-final`}>{t('admin.nodes.route.defaultOutbound')}</Label>
            <Select
              value={value?.final || 'proxy'}
              onValueChange={(v) => handleFinalChange(v as OutboundType)}
              disabled={disabled}
            >
              <SelectTrigger id={`${idPrefix}-final`}>
                <SelectValue>
                  {getOutboundLabel(value?.final || 'proxy', nodes, t, customOutbounds)}
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
                {customOutbounds.length > 0 && (
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
              {t('admin.nodes.route.defaultOutboundHint')}
            </p>
          </div>

          <Separator />

          {/* Custom Outbounds management */}
          <Collapsible open={customOutboundsOpen} onOpenChange={setCustomOutboundsOpen}>
            <div className="flex justify-between items-center">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 transition-colors"
                >
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', !customOutboundsOpen && '-rotate-90')}
                  />
                  {t('admin.nodes.route.customOutbound.title')}
                  {customOutbounds.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {customOutbounds.length}
                    </Badge>
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCustomOutbound}
                disabled={disabled}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('admin.nodes.route.customOutbound.add')}
              </Button>
            </div>
            <CollapsibleContent className="mt-3">
              {customOutbounds.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-3 rounded-xl ring-1 ring-dashed ring-border">
                  {t('admin.nodes.route.customOutbound.title')}
                </div>
              ) : (
                <div className="space-y-2">
                  {customOutbounds.map((co, index) => (
                    <CustomOutboundEntry
                      key={co.tag}
                      entry={co}
                      isEditing={editingIndex === index}
                      onEdit={() => setEditingIndex(editingIndex === index ? null : index)}
                      onChange={(updated) => handleUpdateCustomOutbound(index, updated)}
                      onDelete={() => handleDeleteCustomOutbound(index)}
                      disabled={disabled}
                      idPrefix={`${idPrefix}-co-${index}`}
                    />
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Rule Set Entries management */}
          <Collapsible open={ruleSetEntriesOpen} onOpenChange={setRuleSetEntriesOpen}>
            <div className="flex justify-between items-center">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 transition-colors"
                >
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', !ruleSetEntriesOpen && '-rotate-90')}
                  />
                  {t('admin.nodes.route.ruleSetEntry.title')}
                  {ruleSetEntries.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {ruleSetEntries.length}
                    </Badge>
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRuleSetEntry}
                disabled={disabled}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('admin.nodes.route.ruleSetEntry.add')}
              </Button>
            </div>
            <CollapsibleContent className="mt-3">
              {ruleSetEntries.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-3 rounded-xl ring-1 ring-dashed ring-border">
                  {t('admin.nodes.route.ruleSetEntry.title')}
                </div>
              ) : (
                <div className="space-y-2">
                  {ruleSetEntries.map((entry, index) => (
                    <RuleSetEntryItem
                      key={index}
                      entry={entry}
                      isEditing={editingRuleSetIndex === index}
                      onEdit={() => setEditingRuleSetIndex(editingRuleSetIndex === index ? null : index)}
                      onChange={(updated) => handleUpdateRuleSetEntry(index, updated)}
                      onDelete={() => handleDeleteRuleSetEntry(index)}
                      disabled={disabled}
                      idPrefix={`${idPrefix}-rs-${index}`}
                    />
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Rules list */}
          <RouteRulesList
            rules={value?.rules || []}
            onChange={handleRulesChange}
            disabled={disabled}
            idPrefix={idPrefix}
            nodes={nodes}
            currentNodeId={currentNodeId}
            customOutbounds={customOutbounds}
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
              {t('admin.nodes.route.disableConfig')}
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
  "final": "proxy",
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
            {t('admin.nodes.route.json.hint')}
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
              {t('admin.nodes.route.disableConfig')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/** Single custom outbound entry with inline editing */
const CustomOutboundEntry: React.FC<{
  entry: CustomOutbound;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (entry: CustomOutbound) => void;
  onDelete: () => void;
  disabled: boolean;
  idPrefix: string;
}> = ({ entry, isEditing, onEdit, onChange, onDelete, disabled, idPrefix }) => {
  const { t } = useTranslation();

  // Local state for text inputs — only flush to parent on blur
  const [local, setLocal] = useState({
    tag: entry.tag,
    server: entry.server,
    serverPort: String(entry.serverPort),
    settingsText: entry.settings ? JSON.stringify(entry.settings, null, 2) : '',
  });

  // Sync from parent when entry changes externally (e.g. switching editing index)
  useEffect(() => {
    setLocal({
      tag: entry.tag,
      server: entry.server,
      serverPort: String(entry.serverPort),
      settingsText: entry.settings ? JSON.stringify(entry.settings, null, 2) : '',
    });
  }, [entry.tag, entry.server, entry.serverPort, entry.settings]);

  const flushTag = useCallback(() => {
    if (local.tag !== entry.tag) onChange({ ...entry, tag: local.tag });
  }, [local.tag, entry, onChange]);

  const flushServer = useCallback(() => {
    if (local.server !== entry.server) onChange({ ...entry, server: local.server });
  }, [local.server, entry, onChange]);

  const flushPort = useCallback(() => {
    const port = parseInt(local.serverPort, 10) || 0;
    if (port !== entry.serverPort) onChange({ ...entry, serverPort: port });
  }, [local.serverPort, entry, onChange]);

  const flushSettings = useCallback(() => {
    const text = local.settingsText;
    if (!text.trim()) {
      if (entry.settings) onChange({ ...entry, settings: undefined });
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        onChange({ ...entry, settings: parsed });
      }
    } catch {
      // Invalid JSON — keep local text, don't flush
    }
  }, [local.settingsText, entry, onChange]);

  if (!isEditing) {
    return (
      <Card className={cn('p-3 border-l-[3px] overflow-hidden', PROTOCOL_BORDER_COLOR[entry.type] || 'border-l-border')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
              {entry.tag.replace(/^custom_/, '')}
            </Badge>
            <Badge variant="secondary" className="shrink-0 text-[11px]">
              {entry.type}
            </Badge>
            <SmartTruncate text={`${entry.server}:${entry.serverPort}`} mono className="text-sm text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onEdit}
              disabled={disabled}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={disabled}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4 space-y-3 border-l-[3px] overflow-hidden', PROTOCOL_BORDER_COLOR[entry.type] || 'border-l-border')}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-tag`} className="text-xs">
            {t('admin.nodes.route.customOutbound.tag')}
          </Label>
          <Input
            id={`${idPrefix}-tag`}
            value={local.tag}
            onChange={(e) => setLocal((prev) => ({ ...prev, tag: e.target.value }))}
            onBlur={flushTag}
            disabled={disabled}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {t('admin.nodes.route.customOutbound.tagHint')}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-type`} className="text-xs">
            {t('admin.nodes.route.customOutbound.type')}
          </Label>
          <Select
            value={entry.type}
            onValueChange={(v) => onChange({ ...entry, type: v })}
            disabled={disabled}
          >
            <SelectTrigger id={`${idPrefix}-type`} className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['shadowsocks', 'trojan', 'vless', 'vmess', 'hysteria2', 'tuic', 'anytls', 'socks', 'http'].map(
                (proto) => (
                  <SelectItem key={proto} value={proto}>
                    {proto}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-server`} className="text-xs">
            {t('admin.nodes.route.customOutbound.server')}
          </Label>
          <Input
            id={`${idPrefix}-server`}
            value={local.server}
            onChange={(e) => setLocal((prev) => ({ ...prev, server: e.target.value }))}
            onBlur={flushServer}
            placeholder="example.com"
            disabled={disabled}
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-port`} className="text-xs">
            {t('admin.nodes.route.customOutbound.serverPort')}
          </Label>
          <Input
            id={`${idPrefix}-port`}
            type="number"
            value={local.serverPort}
            onChange={(e) => setLocal((prev) => ({ ...prev, serverPort: e.target.value }))}
            onBlur={flushPort}
            disabled={disabled}
            className="text-sm"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-settings`} className="text-xs">
          {t('admin.nodes.route.customOutbound.settings')}
        </Label>
        <Textarea
          id={`${idPrefix}-settings`}
          value={local.settingsText}
          onChange={(e) => setLocal((prev) => ({ ...prev, settingsText: e.target.value }))}
          onBlur={flushSettings}
          placeholder='{ "password": "...", "method": "aes-256-gcm" }'
          rows={3}
          className="font-mono text-xs"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          {t('admin.nodes.route.customOutbound.settingsHint')}
        </p>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onEdit}>
          {t('common.actions.close')}
        </Button>
      </div>
    </Card>
  );
};

/** Single rule-set entry with inline editing */
const RuleSetEntryItem: React.FC<{
  entry: RuleSetEntry;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (entry: RuleSetEntry) => void;
  onDelete: () => void;
  disabled: boolean;
  idPrefix: string;
}> = ({ entry, isEditing, onEdit, onChange, onDelete, disabled, idPrefix }) => {
  const { t } = useTranslation();

  // Local state for text inputs — flush to parent on blur
  const [local, setLocal] = useState({
    tag: entry.tag,
    url: entry.url,
    downloadDetour: entry.downloadDetour || '',
    updateInterval: entry.updateInterval || '',
  });

  useEffect(() => {
    setLocal({
      tag: entry.tag,
      url: entry.url,
      downloadDetour: entry.downloadDetour || '',
      updateInterval: entry.updateInterval || '',
    });
  }, [entry.tag, entry.url, entry.downloadDetour, entry.updateInterval]);

  const flush = useCallback((field: 'tag' | 'url' | 'downloadDetour' | 'updateInterval') => {
    const value = local[field];
    if (field === 'downloadDetour' || field === 'updateInterval') {
      onChange({ ...entry, [field]: value || undefined });
    } else {
      onChange({ ...entry, [field]: value });
    }
  }, [local, entry, onChange]);

  if (!isEditing) {
    return (
      <Card className="p-3 border-l-[3px] border-l-info overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
              {entry.tag || '—'}
            </Badge>
            {entry.format && entry.format !== 'binary' && (
              <Badge variant="secondary" className="shrink-0 text-[11px]">
                {entry.format}
              </Badge>
            )}
            <SmartTruncate text={entry.url || '—'} className="text-sm text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onEdit}
              disabled={disabled}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={disabled}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3 border-l-[3px] border-l-info overflow-hidden">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-tag`} className="text-xs">
            {t('admin.nodes.route.ruleSetEntry.tag')}
          </Label>
          <Input
            id={`${idPrefix}-tag`}
            value={local.tag}
            onChange={(e) => setLocal((prev) => ({ ...prev, tag: e.target.value }))}
            onBlur={() => flush('tag')}
            placeholder="geoip-cn"
            disabled={disabled}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {t('admin.nodes.route.ruleSetEntry.tagHint')}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-format`} className="text-xs">
            {t('admin.nodes.route.ruleSetEntry.format')}
          </Label>
          <Select
            value={entry.format || 'binary'}
            onValueChange={(v) => onChange({ ...entry, format: v as 'binary' | 'source' })}
            disabled={disabled}
          >
            <SelectTrigger id={`${idPrefix}-format`} className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="binary">binary</SelectItem>
              <SelectItem value="source">source</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('admin.nodes.route.ruleSetEntry.formatHint')}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-url`} className="text-xs">
          {t('admin.nodes.route.ruleSetEntry.url')}
        </Label>
        <Input
          id={`${idPrefix}-url`}
          value={local.url}
          onChange={(e) => setLocal((prev) => ({ ...prev, url: e.target.value }))}
          onBlur={() => flush('url')}
          placeholder="https://example.com/rule-set.srs"
          disabled={disabled}
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {t('admin.nodes.route.ruleSetEntry.urlHint')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-detour`} className="text-xs">
            {t('admin.nodes.route.ruleSetEntry.downloadDetour')}
          </Label>
          <Input
            id={`${idPrefix}-detour`}
            value={local.downloadDetour}
            onChange={(e) => setLocal((prev) => ({ ...prev, downloadDetour: e.target.value }))}
            onBlur={() => flush('downloadDetour')}
            placeholder="proxy"
            disabled={disabled}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {t('admin.nodes.route.ruleSetEntry.downloadDetourHint')}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-interval`} className="text-xs">
            {t('admin.nodes.route.ruleSetEntry.updateInterval')}
          </Label>
          <Input
            id={`${idPrefix}-interval`}
            value={local.updateInterval}
            onChange={(e) => setLocal((prev) => ({ ...prev, updateInterval: e.target.value }))}
            onBlur={() => flush('updateInterval')}
            placeholder="1d"
            disabled={disabled}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {t('admin.nodes.route.ruleSetEntry.updateIntervalHint')}
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onEdit}>
          {t('common.actions.close')}
        </Button>
      </div>
    </Card>
  );
};
