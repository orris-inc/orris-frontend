/**
 * Batch update dialog for forward rules
 * Two-phase mode: select fields to update, then input new values
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
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder: string;
}

const FIELD_CONFIGS: FieldConfig[] = [
  { key: 'name', label: '名称', type: 'text', placeholder: '请输入新名称' },
  { key: 'remark', label: '备注', type: 'text', placeholder: '请输入新备注' },
  { key: 'sortOrder', label: '排序', type: 'number', placeholder: '请输入排序值' },
  { key: 'agentId', label: '入口代理', type: 'select', placeholder: '选择入口代理' },
  { key: 'exitAgentId', label: '出口代理', type: 'select', placeholder: '选择出口代理' },
];

export const BatchUpdateDialog: React.FC<BatchUpdateDialogProps> = ({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
  isUpdating,
  agents = [],
}) => {
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

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="size-5 text-blue-500" />
            批量更新规则
          </DialogTitle>
          <DialogDescription>
            {showResult
              ? '更新操作已完成'
              : `选择要更新的字段，将应用到 ${selectedIds.length} 条规则`}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-6">
            {/* Phase 1: Select fields */}
            <div className="space-y-3">
              <p className="text-sm font-medium">选择要更新的字段</p>
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
                      {config.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 2: Input values for selected fields */}
            {selectedFields.size > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-medium">输入新值</p>
                {availableFieldConfigs
                  .filter((config) => selectedFields.has(config.key))
                  .map((config) => (
                    <div key={config.key} className="space-y-2">
                      <Label htmlFor={`input-${config.key}`}>{config.label}</Label>
                      {config.type === 'select' ? (
                        <Select
                          value={getFieldValue(config.key)}
                          onValueChange={(value) => setFieldValue(config.key, value)}
                        >
                          <SelectTrigger id={`input-${config.key}`}>
                            <SelectValue placeholder={config.placeholder} />
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
                          placeholder={config.placeholder}
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
                  将更新 <span className="font-semibold">{selectedIds.length}</span> 条规则的
                  {Array.from(selectedFields)
                    .map((f) => availableFieldConfigs.find((c) => c.key === f)?.label)
                    .join('、')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
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

            {failedCount > 0 && result.failed && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">更新失败</p>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {result.failed.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm"
                    >
                      <span className="font-mono text-xs truncate max-w-[150px]">{item.id}</span>
                      <span className="text-xs text-red-600 dark:text-red-400 truncate max-w-[180px]">
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
              <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
                取消
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isUpdating || !canSubmit}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    更新中...
                  </>
                ) : (
                  <>
                    <Edit3 className="size-4 mr-2" />
                    更新 {selectedIds.length} 条规则
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
