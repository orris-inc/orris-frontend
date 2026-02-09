/**
 * Batch update dialog for forward rules
 * Two-phase mode: select fields to update, then input new values
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
import { Checkbox } from '@/components/common/Checkbox';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Loader2, CheckCircle2, XCircle, Edit3 } from 'lucide-react';
import type { BatchOperationResult, BatchUpdateItem } from '@/api/forward';

/** Minimal agent info needed for selection */
interface AgentOption {
  id: string;
  name: string;
  status: string;
}

interface BatchUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onConfirm: (updates: BatchUpdateItem[]) => Promise<BatchOperationResult>;
  isUpdating: boolean;
  /** Available agents for selection */
  agents?: AgentOption[];
}

type FieldKey = 'name' | 'remark' | 'sortOrder' | 'agentId' | 'exitAgentId';

interface FieldConfig {
  key: FieldKey;
  labelKey: string;
  type: 'text' | 'number' | 'select';
  placeholderKey: string;
}

const FIELD_CONFIGS: FieldConfig[] = [
  { key: 'name', labelKey: 'admin.forwardRules.batch.fieldName', type: 'text', placeholderKey: 'admin.forwardRules.batch.namePlaceholder' },
  { key: 'remark', labelKey: 'common.fields.remark', type: 'text', placeholderKey: 'admin.forwardRules.batch.remarkPlaceholder' },
  { key: 'sortOrder', labelKey: 'common.fields.sortOrder', type: 'number', placeholderKey: 'admin.forwardRules.batch.sortOrderPlaceholder' },
  { key: 'agentId', labelKey: 'admin.forwardRules.batch.fieldEntryAgent', type: 'select', placeholderKey: 'admin.forwardRules.batch.selectEntryAgent' },
  { key: 'exitAgentId', labelKey: 'admin.forwardRules.batch.fieldExitAgent', type: 'select', placeholderKey: 'admin.forwardRules.batch.selectExitAgent' },
];

export const BatchUpdateDialog: React.FC<BatchUpdateDialogProps> = ({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
  isUpdating,
  agents = [],
}) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<BatchOperationResult | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Selected fields to update
  const [selectedFields, setSelectedFields] = useState<Set<FieldKey>>(new Set());

  // Field values
  const [name, setName] = useState('');
  const [remark, setRemark] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [agentId, setAgentId] = useState('');
  const [exitAgentId, setExitAgentId] = useState('');

  // Get available agents (only enabled ones)
  const availableAgents = useMemo(
    () => agents.filter((a) => a.status === 'enabled'),
    [agents]
  );

  // Get available field configs (hide agent fields if no agents available)
  const availableFieldConfigs = useMemo(() => {
    if (availableAgents.length === 0) {
      return FIELD_CONFIGS.filter((c) => c.type !== 'select');
    }
    return FIELD_CONFIGS;
  }, [availableAgents]);

  const handleFieldToggle = (field: FieldKey, checked: boolean) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(field);
      } else {
        next.delete(field);
      }
      return next;
    });
  };

  const canSubmit = useMemo(() => {
    if (selectedFields.size === 0) return false;
    // Check if all selected fields have values
    for (const field of selectedFields) {
      if (field === 'name' && !name.trim()) return false;
      if (field === 'remark' && !remark.trim()) return false;
      if (field === 'sortOrder' && !sortOrder.trim()) return false;
      if (field === 'agentId' && !agentId) return false;
      if (field === 'exitAgentId' && !exitAgentId) return false;
    }
    return true;
  }, [selectedFields, name, remark, sortOrder, agentId, exitAgentId]);

  const handleConfirm = async () => {
    const updates: BatchUpdateItem[] = selectedIds.map((id) => {
      const item: BatchUpdateItem = { ruleId: id };
      if (selectedFields.has('name')) item.name = name.trim();
      if (selectedFields.has('remark')) item.remark = remark.trim();
      if (selectedFields.has('sortOrder')) item.sortOrder = parseInt(sortOrder, 10);
      if (selectedFields.has('agentId')) item.agentId = agentId;
      if (selectedFields.has('exitAgentId')) item.exitAgentId = exitAgentId;
      return item;
    });

    setHasTriggered(true);
    const res = await onConfirm(updates);
    setResult(res);
  };

  const handleClose = () => {
    setHasTriggered(false);
    setResult(null);
    setSelectedFields(new Set());
    setName('');
    setRemark('');
    setSortOrder('');
    setAgentId('');
    setExitAgentId('');
    onOpenChange(false);
  };

  const showResult = hasTriggered && result && !isUpdating;
  const failedCount = result?.failed?.length ?? 0;

  const getFieldValue = (key: FieldKey): string => {
    switch (key) {
      case 'name':
        return name;
      case 'remark':
        return remark;
      case 'sortOrder':
        return sortOrder;
      case 'agentId':
        return agentId;
      case 'exitAgentId':
        return exitAgentId;
    }
  };

  const setFieldValue = (key: FieldKey, value: string) => {
    switch (key) {
      case 'name':
        setName(value);
        break;
      case 'remark':
        setRemark(value);
        break;
      case 'sortOrder':
        setSortOrder(value);
        break;
      case 'agentId':
        setAgentId(value);
        break;
      case 'exitAgentId':
        setExitAgentId(value);
        break;
    }
  };

  // Get selected field labels for summary
  const getSelectedFieldLabels = () => {
    return Array.from(selectedFields)
      .map((f) => {
        const config = availableFieldConfigs.find((c) => c.key === f);
        return config ? t(config.labelKey) : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="size-5 text-info" />
            {t('admin.forwardRules.batch.updateTitle')}
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? t('admin.forwardRules.batch.updateComplete')
              : t('admin.forwardRules.batch.updateDescription', { count: selectedIds.length })}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-6">
            {/* Phase 1: Select fields */}
            <div className="space-y-3">
              <p className="text-sm font-medium">{t('admin.forwardRules.batch.selectFieldsToUpdate')}</p>
              <div className="space-y-2">
                {availableFieldConfigs.map((config) => (
                  <div key={config.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`field-${config.key}`}
                      checked={selectedFields.has(config.key)}
                      onCheckedChange={(checked) =>
                        handleFieldToggle(config.key, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`field-${config.key}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {t(config.labelKey)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 2: Input values for selected fields */}
            {selectedFields.size > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-medium">{t('admin.forwardRules.batch.enterNewValues')}</p>
                {availableFieldConfigs
                  .filter((config) => selectedFields.has(config.key))
                  .map((config) => (
                    <div key={config.key} className="space-y-2">
                      <Label htmlFor={`input-${config.key}`}>{t(config.labelKey)}</Label>
                      {config.type === 'select' ? (
                        <Select
                          value={getFieldValue(config.key)}
                          onValueChange={(value) => setFieldValue(config.key, value)}
                        >
                          <SelectTrigger id={`input-${config.key}`}>
                            <SelectValue placeholder={t(config.placeholderKey)} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAgents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`input-${config.key}`}
                          type={config.type}
                          placeholder={t(config.placeholderKey)}
                          value={getFieldValue(config.key)}
                          onChange={(e) => setFieldValue(config.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
              </div>
            )}

            {selectedFields.size > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t('admin.forwardRules.batch.updateSummary', {
                    count: selectedIds.length,
                    fields: getSelectedFieldLabels()
                  })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
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

            {failedCount > 0 && result.failed && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">{t('admin.forwardRules.batch.updateFailed')}</p>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {result.failed.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-destructive/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs truncate max-w-[150px]">{item.id}</span>
                      <span className="text-xs text-destructive truncate max-w-[180px]">
                        {item.reason}
                      </span>
                    </div>
                  ))}
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
                disabled={isUpdating || !canSubmit}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('common.loading.updating')}
                  </>
                ) : (
                  <>
                    <Edit3 className="size-4 mr-2" />
                    {t('admin.forwardRules.batch.updateRulesCount', { count: selectedIds.length })}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
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
