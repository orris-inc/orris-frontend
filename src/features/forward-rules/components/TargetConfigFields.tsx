/**
 * Target Configuration Fields
 * Extracted from CreateForwardRuleDialog/EditForwardRuleDialog
 * Handles target type selection (manual/node) + address/port/node inputs
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { FormField } from './form-primitives';
import type { Node } from '@/api/node';

interface TargetConfigFieldsProps {
  targetType: 'manual' | 'node';
  onTargetTypeChange: (type: string) => void;
  targetAddress: string;
  onTargetAddressChange: (value: string) => void;
  targetPort: number;
  onTargetPortChange: (value: number) => void;
  targetNodeId: string;
  onTargetNodeIdChange: (value: string) => void;
  availableNodes: Node[];
  errors: Record<string, string | undefined>;
  idPrefix?: string;
}

export const TargetConfigFields: React.FC<TargetConfigFieldsProps> = ({
  targetType,
  onTargetTypeChange,
  targetAddress,
  onTargetAddressChange,
  targetPort,
  onTargetPortChange,
  targetNodeId,
  onTargetNodeIdChange,
  availableNodes,
  errors,
  idPrefix = '',
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Target Type Radio */}
      <div className="col-span-6">
        <Label className="text-sm font-medium text-foreground mb-3 block">
          {t('admin.forwardRules.form.targetType')}
          <span className="text-destructive ml-0.5">*</span>
        </Label>
        <RadioGroup
          value={targetType}
          onValueChange={onTargetTypeChange}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id={`${idPrefix}target-manual`} />
            <Label
              htmlFor={`${idPrefix}target-manual`}
              className="font-normal cursor-pointer"
            >
              {t('admin.forwardRules.form.targetTypeManual')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="node" id={`${idPrefix}target-node`} />
            <Label
              htmlFor={`${idPrefix}target-node`}
              className="font-normal cursor-pointer"
            >
              {t('admin.forwardRules.form.targetTypeNode')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Manual Target */}
      {targetType === 'manual' && (
        <>
          <FormField
            label={t('admin.forwardRules.form.targetAddress')}
            required
            error={errors.targetAddress}
            hint={t('admin.forwardRules.form.targetAddressLanHint')}
            className="col-span-6 sm:col-span-4"
          >
            <Input
              placeholder={t('admin.forwardRules.form.targetAddressPlaceholder')}
              value={targetAddress}
              onChange={(e) => onTargetAddressChange(e.target.value)}
              error={!!errors.targetAddress}
            />
          </FormField>

          <FormField
            label={t('admin.forwardRules.form.targetPort')}
            required
            error={errors.targetPort}
            className="col-span-6 sm:col-span-2"
          >
            <Input
              type="number"
              min={1}
              max={65535}
              value={targetPort || ''}
              onChange={(e) => onTargetPortChange(parseInt(e.target.value, 10) || 0)}
              error={!!errors.targetPort}
              placeholder="1-65535"
            />
          </FormField>
        </>
      )}

      {/* Node Target */}
      {targetType === 'node' && (
        <FormField
          label={t('admin.forwardRules.form.targetNode')}
          required
          error={errors.targetNodeId}
          hint={t('admin.forwardRules.form.targetNodeDynamicHint')}
          className="col-span-6"
        >
          <Select
            value={targetNodeId}
            onValueChange={onTargetNodeIdChange}
          >
            <SelectTrigger
              className={errors.targetNodeId ? 'border-destructive' : ''}
            >
              <SelectValue
                placeholder={t('admin.forwardRules.form.selectTargetNode')}
              />
            </SelectTrigger>
            <SelectContent>
              {availableNodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.name} ({node.serverAddress})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
    </>
  );
};
