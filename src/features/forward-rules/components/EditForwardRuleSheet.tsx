/**
 * Edit Forward Rule Sheet Component
 * Mobile-optimized bottom sheet - Tailwind Application UI style
 *
 * Design principles:
 * - Linear form layout for editable fields only
 * - Read-only info shown as compact description list
 * - Touch-friendly inputs (min 44px height)
 * - Progressive disclosure for advanced options
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type EditSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Badge } from '@/components/common/Badge';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { Label } from '@/components/common/Label';
import { SortableChainAgentList } from './SortableChainAgentList';
import { ExitAgentList } from './ExitAgentList';
import { RouteConfigEditor } from '@/features/nodes/components/RouteConfigEditor';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { formatDateTime } from '@/shared/utils/date-utils';
import { useEditForwardRuleForm } from '../hooks/useEditForwardRuleForm';
import type {
  ForwardRule,
  UpdateForwardRuleRequest,
  ForwardAgent,
  IPVersion,
  TunnelType,
} from '@/api/forward';
import type { Node } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

type ForwardProtocol = 'tcp' | 'udp' | 'both';

interface EditForwardRuleSheetProps extends EditSheetProps<ForwardRule, UpdateForwardRuleRequest> {
  nodes?: Node[];
  agents?: ForwardAgent[];
  resourceGroups?: ResourceGroup[];
  plansMap?: Record<string, SubscriptionPlan>;
}

// ============================================================================
// Constants
// ============================================================================

const RULE_TYPE_LABELS: Record<string, string> = {
  direct: 'admin.forwardRules.ruleType.direct',
  entry: 'admin.forwardRules.ruleType.entry',
  chain: 'admin.forwardRules.ruleType.chain',
  direct_chain: 'admin.forwardRules.ruleType.directChain',
  external: 'admin.forwardRules.ruleType.external',
};

const PROTOCOL_OPTIONS: MobileSelectOption[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'both', label: 'TCP/UDP' },
];

const IP_VERSION_OPTIONS_KEYS = [
  { value: 'auto', labelKey: 'common.auto' },
  { value: 'ipv4', label: 'IPv4' },
  { value: 'ipv6', label: 'IPv6' },
];

const ADDRESS_PREFERENCE_OPTIONS_KEYS = [
  { value: 'auto', labelKey: 'admin.forwardRules.form.addressPreferenceAuto' },
  { value: 'public', labelKey: 'admin.forwardRules.form.addressPreferencePublic' },
  { value: 'tunnel', labelKey: 'admin.forwardRules.form.addressPreferenceTunnel' },
];

const TUNNEL_TYPE_OPTIONS: MobileSelectOption[] = [
  { value: 'ws', label: 'WebSocket' },
  { value: 'tls', label: 'TLS' },
  { value: 'ws_smux', label: 'WebSocket + SMUX' },
  { value: 'tls_smux', label: 'TLS + SMUX' },
];

const TARGET_TYPE_OPTIONS_KEYS = [
  { value: 'manual', labelKey: 'admin.forwardRules.form.targetTypeManual' },
  { value: 'node', labelKey: 'admin.forwardRules.form.targetTypeNode' },
];

// ============================================================================
// Helpers
// ============================================================================

// Form field component
const FormField = ({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">
      {label}
      {hint && <span className="text-muted-foreground font-normal ml-1">({hint})</span>}
    </label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

// Read-only info row
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2 min-h-[40px]">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

// ============================================================================
// Component
// ============================================================================

export const EditForwardRuleSheet: React.FC<EditForwardRuleSheetProps> = ({
  open,
  onOpenChange,
  entity: rule,
  onSubmit,
  nodes = [],
  agents = [],
  resourceGroups = [],
  plansMap = {},
}) => {
  const { t } = useTranslation();

  // Translated options
  const IP_VERSION_OPTIONS = useMemo(
    () => IP_VERSION_OPTIONS_KEYS.map((opt) => ({ value: opt.value, label: opt.label || t(opt.labelKey as string) })),
    [t]
  );
  const ADDRESS_PREFERENCE_OPTIONS = useMemo(
    () => ADDRESS_PREFERENCE_OPTIONS_KEYS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) })),
    [t]
  );
  const TARGET_TYPE_OPTIONS = useMemo(
    () => TARGET_TYPE_OPTIONS_KEYS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) })),
    [t]
  );

  const form = useEditForwardRuleForm({
    rule,
    agents,
    nodes,
    resourceGroups,
    plansMap,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const agentOptions: MobileSelectOption[] = useMemo(
    () =>
      form.availableAgents.map((agent) => ({
        value: agent.id,
        label: agent.allowedPortRange ? `${agent.name} [${agent.allowedPortRange}]` : agent.name,
      })),
    [form.availableAgents]
  );

  const exitAgentOptions: MobileSelectOption[] = useMemo(
    () =>
      form.availableExitAgents.map((agent) => ({
        value: agent.id,
        label: agent.allowedPortRange ? `${agent.name} [${agent.allowedPortRange}]` : agent.name,
      })),
    [form.availableExitAgents]
  );

  const nodeOptions: MobileSelectOption[] = useMemo(
    () =>
      form.availableNodes.map((node) => ({
        value: node.id,
        label: `${node.name} (${node.serverAddress})`,
      })),
    [form.availableNodes]
  );

  const handleSubmit = async () => {
    if (!rule || !form.validate()) return;

    setLoading(true);
    try {
      const updates = form.buildSubmitData();

      if (Object.keys(updates).length > 0) {
        await onSubmit(rule.id, updates);
      }
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  if (!rule) return null;

  const needsChainConfig = rule.ruleType === 'chain' || rule.ruleType === 'direct_chain';
  const needsExitAgent = rule.ruleType === 'entry';
  const needsTunnelConfig = rule.ruleType === 'entry' || rule.ruleType === 'chain';
  const isExternal = rule.ruleType === 'external';

  return (
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('admin.forwardRules.form.editRule')}</SheetTitle>
          <SheetDescription className="truncate">{rule.name}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 py-4">
          {/* Read-only Info */}
          <div className={cn(cardStyles, 'bg-muted/30 px-3 divide-y divide-border')}>
            <InfoRow label={t('common.labels.id')} value={<span className="font-mono text-xs truncate max-w-[200px]">{rule.id}</span>} />
            <InfoRow
              label={t('admin.forwardRules.form.ruleType')}
              value={
                <Badge variant="secondary" className="text-xs">
                  {t(RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType)}
                </Badge>
              }
            />
            <InfoRow label={t('admin.forwardRules.form.createdTime')} value={formatDateTime(rule.createdAt)} />
          </div>

          {/* Editable Fields */}
          <FormField label={t('admin.forwardRules.form.ruleName')} error={form.errors.name}>
            <MobileFormInput
              value={form.formData.name || ''}
              onChange={(value) => form.handleChange('name', value)}
            />
          </FormField>

          {/* External Type Fields */}
          {isExternal && (
            <>
              <FormField label={t('admin.forwardRules.form.serverAddress')} error={form.errors.serverAddress}>
                <MobileFormInput
                  placeholder={t('admin.forwardRules.form.serverAddressPlaceholder')}
                  value={form.formData.serverAddress || ''}
                  onChange={(value) => form.handleChange('serverAddress' as keyof UpdateForwardRuleRequest, value)}
                  className="font-mono"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('admin.forwardRules.form.listenPort')} error={form.errors.listenPort}>
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    placeholder="1-65535"
                    value={form.formData.listenPort ? String(form.formData.listenPort) : ''}
                    onChange={(value) => form.handleChange('listenPort', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </FormField>

                <FormField label={t('common.fields.sortOrder')}>
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    value={String(form.formData.sortOrder ?? 0)}
                    onChange={(value) => form.handleChange('sortOrder', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </FormField>
              </div>

              <FormField label={t('admin.forwardRules.form.targetNode')} hint={t('common.optional')}>
                <MobileSelect
                  value={form.formData.targetNodeId || ''}
                  onChange={(value) => form.handleChange('targetNodeId', value)}
                  options={nodeOptions}
                  placeholder={t('admin.forwardRules.form.selectTargetNodeOptional')}
                />
              </FormField>
            </>
          )}

          {/* Non-External Type Fields */}
          {!isExternal && (
            <>
              <FormField label={t('admin.forwardRules.form.entryAgent')}>
                <MobileSelect
                  value={form.formData.agentId || ''}
                  onChange={(value) => form.handleChange('agentId', value)}
                  options={agentOptions}
                />
              </FormField>

              {form.selectedAgent?.allowedPortRange && (
                <div className="px-3 py-2 rounded-xl bg-warning/10 ring-1 ring-warning/20">
                  <p className="text-xs text-warning">
                    {t('admin.forwardRules.form.portRestriction', { range: form.selectedAgent!.allowedPortRange })}
                  </p>
                </div>
              )}

              {needsExitAgent && (
                <>
                  {/* Exit Mode Selection */}
                  <FormField label={t('admin.forwardRules.form.exitNode')}>
                    <RadioGroup
                      value={form.exitMode}
                      onValueChange={(value) => form.handleExitModeChange(value as 'single' | 'multi')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="edit-sheet-exit-single" />
                        <Label htmlFor="edit-sheet-exit-single" className="font-normal cursor-pointer text-sm">
                          {t('admin.forwardRules.exitAgents.singleMode')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="multi" id="edit-sheet-exit-multi" />
                        <Label htmlFor="edit-sheet-exit-multi" className="font-normal cursor-pointer text-sm">
                          {t('admin.forwardRules.exitAgents.multiMode')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormField>

                  {/* Single Exit Agent Mode */}
                  {form.exitMode === 'single' && (
                    <FormField label={t('admin.forwardRules.form.exitAgent')}>
                      <MobileSelect
                        value={form.formData.exitAgentId || ''}
                        onChange={(value) => form.handleChange('exitAgentId', value)}
                        options={exitAgentOptions}
                      />
                    </FormField>
                  )}

                  {/* Multi Exit Agent Mode (Load Balancing) */}
                  {form.exitMode === 'multi' && (
                    <FormField label={t('admin.forwardRules.exitAgents.loadBalancing')}>
                      <ExitAgentList
                        agents={form.availableExitAgents}
                        exitAgents={form.formData.exitAgents || []}
                        onChange={form.handleExitAgentsChange}
                        hasError={false}
                        idPrefix="edit-sheet-exit-agent"
                      />
                    </FormField>
                  )}
                </>
              )}

              {needsTunnelConfig && (
                <FormField label={t('admin.forwardRules.form.tunnelType')}>
                  <MobileSelect
                    value={form.formData.tunnelType || 'ws'}
                    onChange={(value) => form.handleChange('tunnelType', value as TunnelType)}
                    options={TUNNEL_TYPE_OPTIONS}
                  />
                </FormField>
              )}

              {rule.ruleType === 'chain' && (
                <FormField label={t('admin.forwardRules.form.tunnelHops')} hint={t('admin.forwardRules.form.tunnelHopsPlaceholder')}>
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    placeholder={t('admin.forwardRules.form.tunnelHopsPlaceholder')}
                    value={form.formData.tunnelHops !== undefined ? String(form.formData.tunnelHops) : ''}
                    onChange={(value) => form.handleChange('tunnelHops', value ? parseInt(value, 10) : undefined)}
                    className="font-mono"
                  />
                </FormField>
              )}

              {needsChainConfig && (
                <FormField
                  label={
                    rule.ruleType === 'direct_chain'
                      ? t('admin.forwardRules.form.chainNodesWithPort')
                      : t('admin.forwardRules.form.chainNodes')
                  }
                  error={form.errors.chainPortConfig}
                >
                  <SortableChainAgentList
                    agents={form.availableChainAgents}
                    selectedIds={form.formData.chainAgentIds || []}
                    onSelectionChange={form.handleChainSelectionChange}
                    showPortConfig={
                      rule.ruleType === 'direct_chain' ||
                      (rule.ruleType === 'chain' &&
                        form.formData.tunnelHops !== undefined &&
                        form.formData.tunnelHops >= 0 &&
                        form.formData.tunnelHops < (form.formData.chainAgentIds?.length || 0))
                    }
                    portConfigStartIndex={rule.ruleType === 'chain' ? (form.formData.tunnelHops ?? 0) : 0}
                    portConfig={form.formData.chainPortConfig || {}}
                    onPortConfigChange={form.handleChainPortChange}
                    hasError={!!form.errors.chainPortConfig}
                    idPrefix="edit-sheet-chain"
                  />
                </FormField>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('common.protocol')}>
                  <MobileSelect
                    value={form.formData.protocol || 'tcp'}
                    onChange={(value) => form.handleChange('protocol', value as ForwardProtocol)}
                    options={PROTOCOL_OPTIONS}
                  />
                </FormField>

                <FormField label={t('admin.forwardRules.form.ipVersion')}>
                  <MobileSelect
                    value={form.formData.ipVersion || 'auto'}
                    onChange={(value) => form.handleChange('ipVersion', value as IPVersion)}
                    options={IP_VERSION_OPTIONS}
                  />
                </FormField>
              </div>

              <FormField label={t('admin.forwardRules.form.listenPort')} hint={t('admin.forwardRules.form.listenPortAutoHint')} error={form.errors.listenPort}>
                <MobileFormInput
                  type="number"
                  inputMode="numeric"
                  placeholder={t('admin.forwardRules.form.listenPortAutoHint')}
                  value={form.formData.listenPort ? String(form.formData.listenPort) : ''}
                  onChange={(value) => form.handleChange('listenPort', parseInt(value, 10) || 0)}
                  className="font-mono"
                />
              </FormField>

              {/* Target Config */}
              {['direct', 'entry', 'chain', 'direct_chain'].includes(rule.ruleType) && (
                <>
                  <FormField label={t('admin.forwardRules.form.targetType')}>
                    <MobileSelect
                      value={form.targetType}
                      onChange={(value) => form.handleTargetTypeChange(value as 'manual' | 'node')}
                      options={TARGET_TYPE_OPTIONS}
                    />
                  </FormField>

                  {form.targetType === 'manual' ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <FormField label={t('admin.forwardRules.form.targetAddress')} error={form.errors.targetAddress}>
                          <MobileFormInput
                            value={form.formData.targetAddress || ''}
                            onChange={(value) => form.handleChange('targetAddress', value)}
                            className="font-mono"
                          />
                        </FormField>
                      </div>
                      <FormField label={t('admin.forwardRules.form.targetPort')} error={form.errors.targetPort}>
                        <MobileFormInput
                          type="number"
                          inputMode="numeric"
                          value={form.formData.targetPort ? String(form.formData.targetPort) : ''}
                          onChange={(value) => form.handleChange('targetPort', parseInt(value, 10))}
                          className="font-mono"
                        />
                      </FormField>
                    </div>
                  ) : (
                    <FormField label={t('admin.forwardRules.form.targetNode')} error={form.errors.targetNodeId}>
                      <MobileSelect
                        value={form.formData.targetNodeId || ''}
                        onChange={(value) => form.handleChange('targetNodeId', value)}
                        options={nodeOptions}
                        placeholder={t('admin.forwardRules.form.selectTargetNode')}
                      />
                    </FormField>
                  )}
                </>
              )}
            </>
          )}

          {/* Route Config (non-external types) */}
          {!isExternal && (
            <>
              <RouteConfigEditor
                value={form.formData.route}
                onChange={form.handleRouteChange}
                idPrefix="edit-sheet-route"
                nodes={nodes.map((n) => ({ id: n.id, name: n.name }))}
              />
              {form.errors.route && (
                <p className="text-sm text-destructive">{form.errors.route}</p>
              )}
            </>
          )}

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{t('common.sections.advancedOptions')}</span>
            {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-2">
              {!isExternal && (
                <>
                  <FormField label={t('admin.forwardRules.form.bindIp')} hint={t('admin.forwardRules.form.bindIpHint')}>
                    <MobileFormInput
                      placeholder={t('common.optional')}
                      value={form.formData.bindIp || ''}
                      onChange={(value) => form.handleChange('bindIp', value)}
                      className="font-mono"
                    />
                  </FormField>

                  {/* Address Preference - only for entry/chain/direct_chain */}
                  {(rule.ruleType === 'entry' || rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && (
                    <FormField label={t('admin.forwardRules.form.addressPreference')} hint={t('admin.forwardRules.form.addressPreferenceHint')}>
                      <MobileSelect
                        value={form.formData.addressPreference || 'auto'}
                        onChange={(value) => form.handleChange('addressPreference', value)}
                        options={ADDRESS_PREFERENCE_OPTIONS}
                      />
                    </FormField>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t('admin.forwardRules.form.trafficMultiplier')}>
                      <MobileFormInput
                        type="number"
                        inputMode="decimal"
                        placeholder={t('common.auto')}
                        value={form.formData.trafficMultiplier !== undefined ? String(form.formData.trafficMultiplier) : ''}
                        onChange={(value) => form.handleChange('trafficMultiplier', value ? parseFloat(value) : undefined)}
                        className="font-mono"
                      />
                    </FormField>

                    <FormField label={t('common.fields.sortOrder')}>
                      <MobileFormInput
                        type="number"
                        inputMode="numeric"
                        value={String(form.formData.sortOrder ?? 0)}
                        onChange={(value) => form.handleChange('sortOrder', parseInt(value, 10) || 0)}
                        className="font-mono"
                      />
                    </FormField>
                  </div>
                </>
              )}

              <FormField label={t('common.fields.remark')}>
                <MobileFormInput
                  placeholder={t('admin.forwardRules.form.remarkPlaceholder')}
                  value={form.formData.remark || ''}
                  onChange={(value) => form.handleChange('remark', value)}
                />
              </FormField>

              {/* Resource Groups */}
              {form.availableResourceGroups.length > 0 && (
                <FormField label={t('admin.forwardRules.form.bindResourceGroupsEdit')}>
                  <p className="text-xs text-muted-foreground mb-2">{t('admin.forwardRules.form.bindResourceGroupsHint')}</p>
                  <div className="ring-1 ring-border rounded-xl overflow-hidden divide-y divide-border">
                    {form.availableResourceGroups.map((group) => {
                      const plan = plansMap[group.planId];
                      const isSelected = form.formData.groupSids?.includes(group.sid) ?? false;
                      return (
                        <label
                          key={group.sid}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 cursor-pointer min-h-[44px] transition-colors active:bg-muted/50',
                            isSelected && 'bg-primary/5'
                          )}
                        >
                          <Checkbox checked={isSelected} onCheckedChange={() => form.handleGroupToggle(group.sid)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{group.name}</p>
                            {plan && <p className="text-xs text-muted-foreground truncate">{plan.name}</p>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </FormField>
              )}
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <div className="flex gap-3 w-full">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 min-h-[44px] active:scale-[0.98]">
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('common.loading.saving')}
                </>
              ) : (
                t('common.actions.save')
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1 min-h-[44px] active:scale-[0.98]">
              {t('common.actions.cancel')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
