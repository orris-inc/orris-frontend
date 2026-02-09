/**
 * Advanced Options Fields
 * Extracted from CreateForwardRuleDialog - collapsible advanced options section
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Checkbox } from '@/components/common/Checkbox';
import { ScrollArea } from '@/components/common/ScrollArea';
import { Badge } from '@/components/common/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/Collapsible';
import { FolderTree, ChevronDown } from 'lucide-react';
import { FormField } from './form-primitives';
import type { IPVersion } from '@/api/forward';
import type { ResourceGroup } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface AdvancedOptionsFieldsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleType: string;
  formData: {
    ipVersion: string;
    bindIp: string;
    trafficMultiplier?: number;
    sortOrder?: number;
    externalRuleId: string;
    externalSource?: string;
    remark: string;
    groupSids: string[];
  };
  onFieldChange: (field: string, value: unknown) => void;
  onGroupToggle: (sid: string) => void;
  availableResourceGroups: ResourceGroup[];
  plansMap: Record<string, SubscriptionPlan>;
}

export const AdvancedOptionsFields: React.FC<AdvancedOptionsFieldsProps> = ({
  open,
  onOpenChange,
  ruleType,
  formData,
  onFieldChange,
  onGroupToggle,
  availableResourceGroups,
  plansMap,
}) => {
  const { t } = useTranslation();
  const isExternal = ruleType === 'external';

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 w-full text-left group"
        >
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {t('common.sections.advancedOptions')}
          </span>
          <div className="h-px flex-1 bg-border" aria-hidden="true" />
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <div className="grid grid-cols-6 gap-x-4 gap-y-4">
          {/* IP Version */}
          {!isExternal && (
            <FormField
              label={t('admin.forwardRules.form.ipVersion')}
              hint={t('admin.forwardRules.form.ipVersionHint')}
              className="col-span-6 sm:col-span-2"
            >
              <Select
                value={formData.ipVersion}
                onValueChange={(value) =>
                  onFieldChange('ipVersion', value as IPVersion)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t('common.auto')}</SelectItem>
                  <SelectItem value="ipv4">IPv4</SelectItem>
                  <SelectItem value="ipv6">IPv6</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}

          {/* Bind IP */}
          {!isExternal && (
            <FormField
              label={t('admin.forwardRules.form.bindIp')}
              hint={t('admin.forwardRules.form.bindIpHint')}
              className="col-span-6 sm:col-span-2"
            >
              <Input
                value={formData.bindIp}
                onChange={(e) => onFieldChange('bindIp', e.target.value)}
                placeholder={t('admin.forwardRules.form.bindIpPlaceholder')}
              />
            </FormField>
          )}

          {/* Traffic Multiplier */}
          {!isExternal && (
            <FormField
              label={t('admin.forwardRules.form.trafficMultiplier')}
              hint={t('admin.forwardRules.form.trafficMultiplierHint')}
              className="col-span-3 sm:col-span-1"
            >
              <Input
                type="number"
                min={0}
                max={1000000}
                step={0.01}
                value={formData.trafficMultiplier ?? ''}
                onChange={(e) => {
                  const value =
                    e.target.value === ''
                      ? undefined
                      : parseFloat(e.target.value);
                  onFieldChange('trafficMultiplier', value);
                }}
                placeholder="1.0"
              />
            </FormField>
          )}

          {/* Sort Order */}
          <FormField
            label={t('common.fields.sortOrder')}
            hint={t('admin.forwardRules.form.sortOrderHint')}
            className="col-span-3 sm:col-span-1"
          >
            <Input
              type="number"
              min={0}
              value={formData.sortOrder ?? ''}
              onChange={(e) => {
                const value =
                  e.target.value === ''
                    ? undefined
                    : parseInt(e.target.value, 10);
                onFieldChange('sortOrder', value);
              }}
              placeholder="0"
            />
          </FormField>

          {/* External Rule ID (for external type) */}
          {isExternal && (
            <FormField
              label={t('admin.forwardRules.form.externalRuleId')}
              hint={t('admin.forwardRules.form.externalRuleIdHint')}
              className="col-span-6 sm:col-span-3"
            >
              <Input
                value={formData.externalRuleId}
                onChange={(e) => onFieldChange('externalRuleId', e.target.value)}
                placeholder={t('admin.forwardRules.form.externalRuleIdPlaceholder')}
              />
            </FormField>
          )}

          {/* Remark */}
          <FormField
            label={t('common.fields.remark')}
            className="col-span-6"
          >
            <Textarea
              rows={2}
              value={formData.remark}
              onChange={(e) => onFieldChange('remark', e.target.value)}
              placeholder={t('admin.forwardRules.form.remarkPlaceholder')}
              className="resize-none"
            />
          </FormField>

          {/* Resource Groups Selection */}
          {availableResourceGroups.length > 0 && (
            <FormField
              label={
                <span className="flex items-center gap-1.5">
                  <FolderTree className="size-4" />
                  {t('admin.forwardRules.form.bindResourceGroups')}
                </span>
              }
              hint={
                formData.groupSids && formData.groupSids.length > 0
                  ? t('admin.forwardRules.form.selectedGroupsCount', {
                      count: formData.groupSids.length,
                    })
                  : t('admin.forwardRules.form.bindResourceGroupsHint')
              }
              className="col-span-6"
            >
              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-[100px]">
                  <div className="divide-y divide-border">
                    {availableResourceGroups.map((group) => {
                      const plan = plansMap[group.planId];
                      const isSelected =
                        formData.groupSids?.includes(group.sid) ?? false;
                      return (
                        <label
                          key={group.sid}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onGroupToggle(group.sid)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {group.name}
                            </p>
                            {plan && (
                              <p className="text-xs text-muted-foreground truncate">
                                {plan.name}
                              </p>
                            )}
                          </div>
                          {plan && (
                            <Badge
                              variant="outline"
                              className="text-[10px] flex-shrink-0"
                            >
                              {plan.planType === 'node'
                                ? t('admin.forwardRules.form.planTypeNode')
                                : t('common.planType.hybrid')}
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </FormField>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
