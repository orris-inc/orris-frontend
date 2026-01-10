/**
 * Batch create dialog for forward rules
 * Allows creating multiple rules from JSON input
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import { Loader2, CheckCircle2, XCircle, Plus, FileJson, Copy } from 'lucide-react';
import type { BatchCreateResponse, CreateForwardRuleRequest } from '@/api/forward';

interface BatchCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (rules: CreateForwardRuleRequest[]) => Promise<BatchCreateResponse>;
  isCreating: boolean;
}

// JSON template example
const JSON_TEMPLATE = `{
  "rules": [
    {
      "agentId": "fa_xxx",
      "ruleType": "direct",
      "name": "MySQL Forward",
      "targetAddress": "192.168.1.100",
      "targetPort": 3306,
      "protocol": "tcp"
    },
    {
      "agentId": "fa_xxx",
      "ruleType": "direct",
      "name": "Redis Forward",
      "targetAddress": "192.168.1.101",
      "targetPort": 6379,
      "protocol": "tcp"
    }
  ]
}`;

// Required fields for validation
const REQUIRED_FIELDS = ['agentId', 'ruleType', 'name', 'protocol'];
const VALID_RULE_TYPES = ['direct', 'entry', 'chain', 'direct_chain'];
const VALID_PROTOCOLS = ['tcp', 'udp', 'both'];

interface ValidationResult {
  valid: boolean;
  rules: CreateForwardRuleRequest[];
  errors: string[];
}

function validateJsonInput(jsonStr: string): ValidationResult {
  const errors: string[] = [];
  let rules: CreateForwardRuleRequest[] = [];

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { valid: false, rules: [], errors: ['JSON 格式无效'] };
  }

  // Check structure
  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, rules: [], errors: ['JSON 必须是对象格式'] };
  }

  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.rules)) {
    return { valid: false, rules: [], errors: ['缺少 rules 数组'] };
  }

  if (obj.rules.length === 0) {
    return { valid: false, rules: [], errors: ['rules 数组不能为空'] };
  }

  if (obj.rules.length > 100) {
    return { valid: false, rules: [], errors: ['最多支持 100 条规则'] };
  }

  // Validate each rule
  for (let i = 0; i < obj.rules.length; i++) {
    const rule = obj.rules[i] as Record<string, unknown>;
    const ruleIndex = i + 1;

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!rule[field]) {
        errors.push(`规则 ${ruleIndex}: 缺少必填字段 ${field}`);
      }
    }

    // Validate ruleType
    if (rule.ruleType && !VALID_RULE_TYPES.includes(rule.ruleType as string)) {
      errors.push(`规则 ${ruleIndex}: ruleType 必须是 ${VALID_RULE_TYPES.join(', ')} 之一`);
    }

    // Validate protocol
    if (rule.protocol && !VALID_PROTOCOLS.includes(rule.protocol as string)) {
      errors.push(`规则 ${ruleIndex}: protocol 必须是 ${VALID_PROTOCOLS.join(', ')} 之一`);
    }

    // Validate target (must have targetAddress+targetPort or targetNodeId)
    const hasManualTarget = rule.targetAddress && rule.targetPort;
    const hasNodeTarget = rule.targetNodeId;
    if (!hasManualTarget && !hasNodeTarget) {
      errors.push(`规则 ${ruleIndex}: 必须指定目标 (targetAddress+targetPort 或 targetNodeId)`);
    }

    // Validate entry type specific fields
    if (rule.ruleType === 'entry' && !rule.exitAgentId) {
      errors.push(`规则 ${ruleIndex}: entry 类型必须指定 exitAgentId`);
    }

    // Validate chain type specific fields
    if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && !rule.chainAgentIds) {
      errors.push(`规则 ${ruleIndex}: ${rule.ruleType} 类型必须指定 chainAgentIds`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, rules: [], errors };
  }

  rules = obj.rules as CreateForwardRuleRequest[];
  return { valid: true, rules, errors: [] };
}

export const BatchCreateDialog: React.FC<BatchCreateDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isCreating,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [result, setResult] = useState<BatchCreateResponse | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Validate JSON input
  const validation = useMemo(() => {
    if (!jsonInput.trim()) {
      return { valid: false, rules: [], errors: [] };
    }
    return validateJsonInput(jsonInput);
  }, [jsonInput]);

  const handleLoadTemplate = () => {
    setJsonInput(JSON_TEMPLATE);
  };

  const handleCopyTemplate = async () => {
    await navigator.clipboard.writeText(JSON_TEMPLATE);
  };

  const handleConfirm = async () => {
    if (!validation.valid) return;

    setHasTriggered(true);
    const res = await onConfirm(validation.rules);
    setResult(res);
  };

  const handleClose = () => {
    setHasTriggered(false);
    setResult(null);
    setJsonInput('');
    onOpenChange(false);
  };

  const showResult = hasTriggered && result && !isCreating;
  const failedCount = result?.failed?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="size-5 text-blue-500" />
            批量创建规则
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? '创建操作已完成'
              : '粘贴 JSON 格式的规则配置，一次最多创建 100 条规则'}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-4">
            {/* Template buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadTemplate}
                className="text-xs"
              >
                <FileJson className="size-3.5 mr-1.5" />
                加载示例
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTemplate}
                className="text-xs"
              >
                <Copy className="size-3.5 mr-1.5" />
                复制模板
              </Button>
            </div>

            {/* JSON input */}
            <div className="space-y-2">
              <Label htmlFor="json-input">JSON 配置</Label>
              <textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={JSON_TEMPLATE}
                className="w-full h-[280px] p-3 text-sm font-mono rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                spellCheck={false}
              />
            </div>

            {/* Validation errors */}
            {validation.errors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                  验证错误
                </p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-[100px] overflow-y-auto">
                  {validation.errors.slice(0, 10).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                  {validation.errors.length > 10 && (
                    <li>• ...还有 {validation.errors.length - 10} 个错误</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview info */}
            {validation.valid && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <CheckCircle2 className="size-4 inline-block mr-1.5 -mt-0.5" />
                  JSON 格式有效，将创建 <span className="font-semibold">{validation.rules.length}</span> 条规则
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Result stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <CheckCircle2 className="size-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                  {result.succeeded.length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">成功</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <XCircle className="size-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  {failedCount}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">失败</p>
              </div>
            </div>

            {/* Failed items */}
            {failedCount > 0 && result.failed && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">创建失败</p>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {result.failed.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs truncate max-w-[150px]">
                        规则 {item.id}
                      </span>
                      <span className="text-xs text-red-600 dark:text-red-400 truncate max-w-[280px]">
                        {item.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success items */}
            {result.succeeded.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">创建成功</p>
                <div className="max-h-[100px] overflow-y-auto space-y-1">
                  {result.succeeded.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/10 rounded text-sm"
                    >
                      <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
                      <span className="font-mono text-xs">{item.id}</span>
                    </div>
                  ))}
                  {result.succeeded.length > 10 && (
                    <p className="text-xs text-muted-foreground px-2">
                      ...还有 {result.succeeded.length - 10} 条规则
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!showResult ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                取消
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isCreating || !validation.valid}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-2" />
                    创建 {validation.rules.length || 0} 条规则
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>关闭</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
