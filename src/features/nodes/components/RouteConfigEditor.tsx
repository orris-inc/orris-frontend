/**
 * Route configuration editor component
 * Main editor with visual form mode and JSON advanced mode
 */

import { useState, useEffect } from 'react';
import { Code, FormInput } from 'lucide-react';
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
import { RouteRulesList } from './RouteRulesList';
import {
  getOutboundLabel,
  type OutboundNodeOption,
} from './RouteRuleEditor';
import type { RouteConfig, OutboundType } from '@/api/node';

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

const PRESET_OUTBOUND_OPTIONS: { value: OutboundType; label: string }[] = [
  { value: 'proxy', label: '代理' },
  { value: 'direct', label: '直连' },
  { value: 'block', label: '阻断' },
];

// Default configuration when enabling route config
const getDefaultConfig = (): RouteConfig => ({
  final: 'proxy',
  rules: [],
});

export const RouteConfigEditor: React.FC<RouteConfigEditorProps> = ({
  value,
  onChange,
  disabled = false,
  idPrefix = 'route',
  nodes = [],
  currentNodeId,
}) => {
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Filter out current node from available options
  const availableNodes = nodes.filter((n) => n.id !== currentNodeId);

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
        setJsonError('JSON 必须是一个对象');
        return;
      }
      // Validate final field - can be preset type or node reference
      const isValidFinal =
        parsed.final &&
        (['direct', 'block', 'proxy'].includes(parsed.final) ||
          parsed.final.startsWith('node_'));
      if (!isValidFinal) {
        setJsonError('缺少有效的 final 字段（direct/block/proxy 或 node_xxx）');
        return;
      }
      onChange(parsed as RouteConfig);
      setJsonError(null);
      setEditorMode('visual');
    } catch {
      setJsonError('JSON 格式错误，请修正后再切换');
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
      setJsonError('JSON 格式错误');
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

  // No config - show enable button
  if (!value && editorMode === 'visual') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">路由配置</Label>
        </div>
        <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
          <p className="mb-3">未配置路由规则，使用默认代理行为</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableConfig}
            disabled={disabled}
          >
            启用路由配置
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">路由配置</Label>
        <div className="flex items-center gap-2">
          <Button
            variant={editorMode === 'visual' ? 'default' : 'ghost'}
            size="sm"
            onClick={editorMode === 'json' ? handleSwitchToVisual : undefined}
            disabled={disabled || editorMode === 'visual'}
          >
            <FormInput className="h-4 w-4 mr-1" />
            可视化
          </Button>
          <Button
            variant={editorMode === 'json' ? 'default' : 'ghost'}
            size="sm"
            onClick={editorMode === 'visual' ? handleSwitchToJson : undefined}
            disabled={disabled || editorMode === 'json'}
          >
            <Code className="h-4 w-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      {editorMode === 'visual' ? (
        // Visual mode
        <div className="space-y-4">
          {/* Default outbound */}
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-final`}>默认出站</Label>
            <Select
              value={value?.final || 'proxy'}
              onValueChange={(v) => handleFinalChange(v as OutboundType)}
              disabled={disabled}
            >
              <SelectTrigger id={`${idPrefix}-final`}>
                <SelectValue>
                  {getOutboundLabel(value?.final || 'proxy', nodes)}
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
              当没有规则匹配时的默认行为
            </p>
          </div>

          <Separator />

          {/* Rules list */}
          <RouteRulesList
            rules={value?.rules || []}
            onChange={handleRulesChange}
            disabled={disabled}
            idPrefix={idPrefix}
            nodes={nodes}
            currentNodeId={currentNodeId}
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
              禁用路由配置
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
            直接编辑 JSON 配置，格式兼容 sing-box 路由规则。
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
              禁用路由配置
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
