/**
 * Batch create dialog for forward rules
 * Allows creating multiple rules from JSON input
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import type { TFunction } from 'i18next';

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

// Required fields for validation (common fields)
const REQUIRED_FIELDS_COMMON = ['ruleType', 'name'];
// Required fields for non-external rules
const REQUIRED_FIELDS_STANDARD = ['agentId', 'protocol'];
const VALID_RULE_TYPES = ['direct', 'entry', 'chain', 'direct_chain', 'external'];
const VALID_PROTOCOLS = ['tcp', 'udp', 'both'];

interface ValidationResult {
  valid: boolean;
  rules: CreateForwardRuleRequest[];
  errors: string[];
}

function validateJsonInput(jsonStr: string, t: TFunction): ValidationResult {
  const errors: string[] = [];
  let rules: CreateForwardRuleRequest[] = [];

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { valid: false, rules: [], errors: [t('admin.forwardRules.batch.validation.invalidJson')] };
  }

  // Check structure
  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, rules: [], errors: [t('admin.forwardRules.batch.validation.mustBeObject')] };
  }

  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.rules)) {
    return { valid: false, rules: [], errors: [t('admin.forwardRules.batch.validation.missingRulesArray')] };
  }

  if (obj.rules.length === 0) {
    return { valid: false, rules: [], errors: [t('admin.forwardRules.batch.validation.rulesEmpty')] };
  }

  if (obj.rules.length > 100) {
    return { valid: false, rules: [], errors: [t('admin.forwardRules.batch.validation.maxRulesExceeded')] };
  }

  // Validate each rule
  for (let i = 0; i < obj.rules.length; i++) {
    const rule = obj.rules[i] as Record<string, unknown>;
    const ruleIndex = i + 1;
    const isExternal = rule.ruleType === 'external';

    // Check common required fields
    for (const field of REQUIRED_FIELDS_COMMON) {
      if (!rule[field]) {
        errors.push(t('admin.forwardRules.batch.validation.missingField', { index: ruleIndex, field }));
      }
    }

    // Check standard required fields (only for non-external rules)
    if (!isExternal) {
      for (const field of REQUIRED_FIELDS_STANDARD) {
        if (!rule[field]) {
          errors.push(t('admin.forwardRules.batch.validation.missingField', { index: ruleIndex, field }));
        }
      }
    }

    // Validate ruleType
    if (rule.ruleType && !VALID_RULE_TYPES.includes(rule.ruleType as string)) {
      errors.push(t('admin.forwardRules.batch.validation.invalidRuleType', { index: ruleIndex, types: VALID_RULE_TYPES.join(', ') }));
    }

    // Validate protocol (only for non-external rules)
    if (!isExternal && rule.protocol && !VALID_PROTOCOLS.includes(rule.protocol as string)) {
      errors.push(t('admin.forwardRules.batch.validation.invalidProtocol', { index: ruleIndex, protocols: VALID_PROTOCOLS.join(', ') }));
    }

    // External rule specific validation
    if (isExternal) {
      if (!rule.serverAddress) {
        errors.push(t('admin.forwardRules.batch.validation.missingField', { index: ruleIndex, field: 'serverAddress' }));
      }
      if (!rule.listenPort) {
        errors.push(t('admin.forwardRules.batch.validation.missingField', { index: ruleIndex, field: 'listenPort' }));
      }
      if (!rule.targetNodeId) {
        errors.push(t('admin.forwardRules.batch.validation.missingField', { index: ruleIndex, field: 'targetNodeId' }));
      }
    } else {
      // Non-external: validate target (must have targetAddress+targetPort or targetNodeId)
      const hasManualTarget = rule.targetAddress && rule.targetPort;
      const hasNodeTarget = rule.targetNodeId;
      if (!hasManualTarget && !hasNodeTarget) {
        errors.push(t('admin.forwardRules.batch.validation.missingTarget', { index: ruleIndex }));
      }
    }

    // Validate entry type specific fields
    if (rule.ruleType === 'entry' && !rule.exitAgentId) {
      errors.push(t('admin.forwardRules.batch.validation.missingExitAgent', { index: ruleIndex }));
    }

    // Validate chain type specific fields
    if ((rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && !rule.chainAgentIds) {
      errors.push(t('admin.forwardRules.batch.validation.missingChainAgents', { index: ruleIndex, type: rule.ruleType }));
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
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState('');
  const [result, setResult] = useState<BatchCreateResponse | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Validate JSON input
  const validation = useMemo(() => {
    if (!jsonInput.trim()) {
      return { valid: false, rules: [], errors: [] };
    }
    return validateJsonInput(jsonInput, t);
  }, [jsonInput, t]);

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="size-5 text-info" />
            {t('admin.forwardRules.batch.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? t('admin.forwardRules.batch.createComplete')
              : t('admin.forwardRules.batch.createDescription')}
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
                {t('admin.forwardRules.batch.loadTemplate')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTemplate}
                className="text-xs"
              >
                <Copy className="size-3.5 mr-1.5" />
                {t('admin.forwardRules.batch.copyTemplate')}
              </Button>
            </div>

            {/* JSON input */}
            <div className="space-y-2">
              <Label htmlFor="json-input">{t('admin.forwardRules.batch.jsonConfig')}</Label>
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
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                <p className="text-sm font-medium text-destructive mb-2">
                  {t('admin.forwardRules.batch.validationError')}
                </p>
                <ul className="text-xs text-destructive space-y-1 max-h-[100px] overflow-y-auto">
                  {validation.errors.slice(0, 10).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {validation.errors.length > 10 && (
                    <li>{t('admin.forwardRules.batch.moreErrors', { count: validation.errors.length - 10 })}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview info */}
            {validation.valid && (
              <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                <p className="text-sm text-success">
                  <CheckCircle2 className="size-4 inline-block mr-1.5 -mt-0.5" />
                  {t('admin.forwardRules.batch.jsonValid', { count: validation.rules.length })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Result stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <CheckCircle2 className="size-5 text-success mx-auto mb-1" />
                <p className="text-lg font-semibold text-success">
                  {result.succeeded.length}
                </p>
                <p className="text-xs text-success">{t('admin.forwardRules.batch.succeeded')}</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg text-center">
                <XCircle className="size-5 text-destructive mx-auto mb-1" />
                <p className="text-lg font-semibold text-destructive">
                  {failedCount}
                </p>
                <p className="text-xs text-destructive">{t('common.status.failed')}</p>
              </div>
            </div>

            {/* Failed items */}
            {failedCount > 0 && result.failed && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">{t('admin.forwardRules.batch.createFailed')}</p>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {result.failed.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-destructive/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs truncate max-w-[150px]">
                        {t('admin.forwardRules.batch.ruleIndex', { index: item.id })}
                      </span>
                      <span className="text-xs text-destructive truncate max-w-[280px]">
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
                <p className="text-sm font-medium text-success">{t('admin.forwardRules.batch.createSuccess')}</p>
                <div className="max-h-[100px] overflow-y-auto space-y-1">
                  {result.succeeded.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-success/10 rounded text-sm"
                    >
                      <CheckCircle2 className="size-3.5 text-success shrink-0" />
                      <span className="font-mono text-xs">{item.id}</span>
                    </div>
                  ))}
                  {result.succeeded.length > 10 && (
                    <p className="text-xs text-muted-foreground px-2">
                      {t('admin.forwardRules.batch.moreRules', { count: result.succeeded.length - 10 })}
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
              <Button
                onClick={handleConfirm}
                disabled={isCreating || !validation.valid}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('common.loading.creating')}
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-2" />
                    {t('admin.forwardRules.batch.createRulesCount', { count: validation.rules.length || 0 })}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                {t('common.actions.cancel')}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>{t('common.actions.close')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
