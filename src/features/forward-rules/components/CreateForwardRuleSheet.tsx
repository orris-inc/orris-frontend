/**
 * Create Forward Rule Sheet Component
 * Mobile-optimized bottom sheet - Tailwind Application UI style
 *
 * Design principles:
 * - Clear section separation with labeled dividers
 * - Logical field grouping based on business logic
 * - Touch-friendly inputs (min 52px height)
 * - Progressive disclosure for advanced options
 * - Responsive grid layout within sections
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ChevronDown, Info } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type CreateSheetProps,
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
import { useCreateForwardRuleForm } from '../hooks/useCreateForwardRuleForm';
import type {
  CreateForwardRuleRequest,
  ForwardAgent,
} from '@/api/forward';
import type { Node } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================


interface CreateForwardRuleSheetProps extends CreateSheetProps<CreateForwardRuleRequest> {
  agents: ForwardAgent[];
  nodes?: Node[];
  initialData?: Partial<CreateForwardRuleRequest> & { targetType?: 'manual' | 'node' };
  resourceGroups?: ResourceGroup[];
  plansMap?: Record<string, SubscriptionPlan>;
}

// ============================================================================
// Constants
// ============================================================================

const RULE_TYPE_OPTIONS_KEYS = [
  { value: 'direct', labelKey: 'admin.forwardRules.ruleTypeInfo.direct.label' },
  { value: 'entry', labelKey: 'admin.forwardRules.ruleTypeInfo.entry.label' },
  { value: 'chain', labelKey: 'admin.forwardRules.ruleTypeInfo.chain.label' },
  { value: 'direct_chain', labelKey: 'admin.forwardRules.ruleTypeInfo.directChain.label' },
  { value: 'external', labelKey: 'admin.forwardRules.ruleTypeInfo.external.label' },
];

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

/**
 * Form Field Component
 * Consistent styling for form fields with label, hint, and error
 */
const FormField = ({
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn('space-y-1.5', className)}>
    <label className="text-sm font-medium text-foreground block">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

/**
 * Section Divider with Label
 * Creates visual separation between form sections
 */
const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 pt-2 pb-1">
    <span className="text-xs font-semibold text-foreground whitespace-nowrap">
      {label}
    </span>
    <div className="h-px flex-1 bg-border" aria-hidden="true" />
  </div>
);

/**
 * Collapsible Section Trigger
 * Button to toggle advanced options visibility
 */
const CollapsibleTrigger = ({
  label,
  isOpen,
  onClick,
}: {
  label: string;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-3 py-2 group"
  >
    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
      {label}
    </span>
    <div className="h-px flex-1 bg-border" aria-hidden="true" />
    <ChevronDown
      className={cn(
        'size-4 text-muted-foreground transition-transform duration-200',
        isOpen && 'rotate-180'
      )}
    />
  </button>
);

// ============================================================================
// Component
// ============================================================================

export const CreateForwardRuleSheet: React.FC<CreateForwardRuleSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
  agents,
  nodes = [],
  initialData,
  resourceGroups = [],
  plansMap = {},
}) => {
  const { t } = useTranslation();

  // Translated options
  const RULE_TYPE_OPTIONS = useMemo(
    () => RULE_TYPE_OPTIONS_KEYS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) })),
    [t]
  );
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

  const form = useCreateForwardRuleForm({
    open,
    agents,
    nodes,
    initialData,
    resourceGroups,
    plansMap,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = (isOpen: boolean) => {
    if (!loading) {
      onOpenChange(isOpen);
    }
  };

  const agentOptions: MobileSelectOption[] = useMemo(
    () =>
      form.availableAgentsForSelect.map((agent) => ({
        value: agent.id,
        label: agent.allowedPortRange ? `${agent.name} [${agent.allowedPortRange}]` : agent.name,
      })),
    [form.availableAgentsForSelect]
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
    if (!form.validate()) return;

    setLoading(true);
    try {
      const submitData = form.buildSubmitData();
      await onSubmit(submitData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };


  const needsChainConfig = form.formData.ruleType === 'chain' || form.formData.ruleType === 'direct_chain';
  const needsExitAgent = form.formData.ruleType === 'entry';
  const needsTunnelConfig = form.formData.ruleType === 'entry' || form.formData.ruleType === 'chain';
  const isExternal = form.formData.ruleType === 'external';

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {initialData ? t('admin.forwardRules.form.copyRuleShort') : t('admin.forwardRules.form.createRule')}
          </SheetTitle>
          <SheetDescription>{t('admin.forwardRules.form.createRuleDesc')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 py-4">
          {/* ===== Section 1: Basic Info ===== */}
          <SectionDivider label={t('common.sections.basicInfo')} />

          <FormField label={t('admin.forwardRules.form.ruleName')} required error={form.errors.name}>
            <MobileFormInput
              placeholder={t('admin.forwardRules.form.ruleNamePlaceholder')}
              value={form.formData.name}
              onChange={(value) => form.handleChange('name', value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('admin.forwardRules.form.ruleType')} required className={isExternal ? 'col-span-2' : ''}>
              <MobileSelect
                value={form.formData.ruleType}
                onChange={(value) => form.handleChange('ruleType', value)}
                options={RULE_TYPE_OPTIONS}
              />
            </FormField>

            {!isExternal && (
              <FormField label={t('common.protocol')} required>
                <MobileSelect
                  value={form.formData.protocol}
                  onChange={(value) => form.handleChange('protocol', value)}
                  options={PROTOCOL_OPTIONS}
                />
              </FormField>
            )}
          </div>

          {/* ===== External Rule Config ===== */}
          {isExternal && (
            <>
              <SectionDivider label={t('admin.forwardRules.form.forwardConfig')} />

              <FormField
                label={t('admin.forwardRules.form.serverAddress')}
                required
                error={form.errors.serverAddress}
              >
                <MobileFormInput
                  placeholder={t('admin.forwardRules.form.serverAddressPlaceholder')}
                  value={form.formData.serverAddress}
                  onChange={(value) => form.handleChange('serverAddress', value)}
                  className="font-mono"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label={t('admin.forwardRules.form.listenPort')}
                  required
                  error={form.errors.listenPort}
                >
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    placeholder="1-65535"
                    value={form.formData.listenPort ? String(form.formData.listenPort) : ''}
                    onChange={(value) => form.handleChange('listenPort', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </FormField>

                <FormField
                  label={t('admin.forwardRules.form.externalSource')}
                  hint={t('common.optional')}
                >
                  <MobileFormInput
                    placeholder={t('admin.forwardRules.form.externalSourcePlaceholder')}
                    value={form.formData.externalSource}
                    onChange={(value) => form.handleChange('externalSource', value)}
                  />
                </FormField>
              </div>

              <FormField
                label={t('admin.forwardRules.form.targetNode')}
                required
                error={form.errors.targetNodeId}
                hint={t('admin.forwardRules.form.externalTargetNodeHint')}
              >
                <MobileSelect
                  value={form.formData.targetNodeId}
                  onChange={(value) => form.handleChange('targetNodeId', value)}
                  options={nodeOptions}
                  placeholder={t('admin.forwardRules.form.selectTargetNode')}
                />
              </FormField>
            </>
          )}

          {/* ===== Section 2: Agent Config (hidden for external) ===== */}
          {!isExternal && <SectionDivider label={t('admin.forwardRules.form.forwardAgent')} />}

          {!isExternal && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label={t('admin.forwardRules.form.forwardAgent')}
                  required
                  error={form.errors.agentId}
                  className="col-span-2 sm:col-span-1"
                >
                  <MobileSelect
                    value={form.formData.agentId}
                    onChange={(value) => form.handleChange('agentId', value)}
                    options={agentOptions}
                    placeholder={t('admin.forwardRules.form.selectForwardAgent')}
                  />
                </FormField>

                <FormField
                  label={t('admin.forwardRules.form.listenPort')}
                  error={form.errors.listenPort}
                  hint={t('common.auto')}
                  className="col-span-2 sm:col-span-1"
                >
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    placeholder={t('common.auto')}
                    value={form.formData.listenPort ? String(form.formData.listenPort) : ''}
                    onChange={(value) => form.handleChange('listenPort', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </FormField>
              </div>

              {/* Port Range Warning */}
              {form.selectedAgent?.allowedPortRange && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/10 ring-1 ring-warning/20">
                  <Info className="size-4 text-warning flex-shrink-0" />
                  <p className="text-xs text-warning">
                    {t('admin.forwardRules.form.portRestriction', { range: form.selectedAgent.allowedPortRange })}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ===== Section 3: Rule Type Specific Config ===== */}
          {!isExternal && (needsExitAgent || needsTunnelConfig || needsChainConfig) && (
            <>
              <SectionDivider label={t('admin.forwardRules.form.forwardConfig')} />

              {/* Entry type: Exit Agent */}
              {needsExitAgent && (
                <>
                  {/* Exit Mode Selection */}
                  <FormField label={t('admin.forwardRules.form.exitNode')} required>
                    <RadioGroup
                      value={form.exitMode}
                      onValueChange={(value) => form.handleExitModeChange(value as 'single' | 'multi')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="sheet-exit-single" />
                        <Label htmlFor="sheet-exit-single" className="font-normal cursor-pointer text-sm">
                          {t('admin.forwardRules.exitAgents.singleMode')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="multi" id="sheet-exit-multi" />
                        <Label htmlFor="sheet-exit-multi" className="font-normal cursor-pointer text-sm">
                          {t('admin.forwardRules.exitAgents.multiMode')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormField>

                  {/* Single Exit Agent Mode */}
                  {form.exitMode === 'single' && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        label={t('admin.forwardRules.form.exitNode')}
                        required
                        error={form.errors.exitAgentId}
                        className="col-span-2 sm:col-span-1"
                      >
                        <MobileSelect
                          value={form.formData.exitAgentId}
                          onChange={(value) => form.handleChange('exitAgentId', value)}
                          options={exitAgentOptions}
                          placeholder={t('admin.forwardRules.form.selectExitNode')}
                        />
                      </FormField>

                      <FormField label={t('admin.forwardRules.form.tunnelType')} className="col-span-2 sm:col-span-1">
                        <MobileSelect
                          value={form.formData.tunnelType}
                          onChange={(value) => form.handleChange('tunnelType', value)}
                          options={TUNNEL_TYPE_OPTIONS}
                        />
                      </FormField>
                    </div>
                  )}

                  {/* Multi Exit Agent Mode (Load Balancing) */}
                  {form.exitMode === 'multi' && (
                    <>
                      <FormField
                        label={t('admin.forwardRules.exitAgents.loadBalancing')}
                        required
                        error={form.errors.exitAgents}
                      >
                        <ExitAgentList
                          agents={form.availableExitAgents}
                          exitAgents={form.formData.exitAgents}
                          onChange={form.handleExitAgentsChange}
                          hasError={!!form.errors.exitAgents}
                          idPrefix="sheet-exit-agent"
                        />
                      </FormField>

                      <FormField label={t('admin.forwardRules.form.tunnelType')}>
                        <MobileSelect
                          value={form.formData.tunnelType}
                          onChange={(value) => form.handleChange('tunnelType', value)}
                          options={TUNNEL_TYPE_OPTIONS}
                        />
                      </FormField>
                    </>
                  )}
                </>
              )}

              {/* Chain type: Tunnel settings */}
              {form.formData.ruleType === 'chain' && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t('admin.forwardRules.form.tunnelType')}>
                    <MobileSelect
                      value={form.formData.tunnelType}
                      onChange={(value) => form.handleChange('tunnelType', value)}
                      options={TUNNEL_TYPE_OPTIONS}
                    />
                  </FormField>

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
                </div>
              )}

              {/* Chain nodes list */}
              {needsChainConfig && (
                <FormField
                  label={
                    form.formData.ruleType === 'direct_chain'
                      ? t('admin.forwardRules.form.chainNodesWithPort')
                      : t('admin.forwardRules.form.chainNodes')
                  }
                  required
                  error={form.errors.chainAgentIds || form.errors.chainPortConfig}
                >
                  <SortableChainAgentList
                    agents={form.availableChainAgents}
                    selectedIds={form.formData.chainAgentIds}
                    onSelectionChange={form.handleChainSelectionChange}
                    showPortConfig={
                      form.formData.ruleType === 'direct_chain' ||
                      (form.formData.ruleType === 'chain' &&
                        form.formData.tunnelHops !== undefined &&
                        form.formData.tunnelHops >= 0 &&
                        form.formData.tunnelHops < form.formData.chainAgentIds.length)
                    }
                    portConfigStartIndex={form.formData.ruleType === 'chain' ? (form.formData.tunnelHops ?? 0) : 0}
                    portConfig={form.formData.chainPortConfig}
                    onPortConfigChange={form.handleChainPortChange}
                    hasError={!!form.errors.chainAgentIds || !!form.errors.chainPortConfig}
                    idPrefix="create-sheet-chain"
                  />
                </FormField>
              )}
            </>
          )}

          {/* ===== Section 4: Target Config (hidden for external) ===== */}
          {!isExternal && (
            <>
              <SectionDivider label={t('admin.forwardRules.form.targetType')} />

              <FormField label={t('admin.forwardRules.form.targetType')} required>
                <MobileSelect
                  value={form.targetType}
                  onChange={(value) => form.handleTargetTypeChange(value as 'manual' | 'node')}
                  options={TARGET_TYPE_OPTIONS}
                />
              </FormField>

              {form.targetType === 'manual' ? (
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    label={t('admin.forwardRules.form.targetAddress')}
                    required
                    error={form.errors.targetAddress}
                    className="col-span-2"
                  >
                    <MobileFormInput
                      placeholder={t('admin.forwardRules.form.targetAddressPlaceholder')}
                      value={form.formData.targetAddress}
                      onChange={(value) => form.handleChange('targetAddress', value)}
                      className="font-mono"
                    />
                  </FormField>

                  <FormField label={t('admin.forwardRules.form.targetPort')} required error={form.errors.targetPort}>
                    <MobileFormInput
                      type="number"
                      inputMode="numeric"
                      placeholder="Port"
                      value={form.formData.targetPort ? String(form.formData.targetPort) : ''}
                      onChange={(value) => form.handleChange('targetPort', parseInt(value, 10) || 0)}
                      className="font-mono"
                    />
                  </FormField>
                </div>
              ) : (
                <FormField
                  label={t('admin.forwardRules.form.targetNode')}
                  required
                  error={form.errors.targetNodeId}
                  hint={t('admin.forwardRules.form.targetNodeDynamicHint')}
                >
                  <MobileSelect
                    value={form.formData.targetNodeId}
                    onChange={(value) => form.handleChange('targetNodeId', value)}
                    options={nodeOptions}
                    placeholder={t('admin.forwardRules.form.selectTargetNode')}
                  />
                </FormField>
              )}
            </>
          )}

          {/* ===== Route Config (non-external types) ===== */}
          {!isExternal && (
            <>
              <SectionDivider label={t('admin.nodes.route.title')} />
              <RouteConfigEditor
                value={form.formData.route}
                onChange={form.handleRouteChange}
                idPrefix="create-sheet-route"
                nodes={nodes.map((n) => ({ id: n.id, name: n.name }))}
              />
            </>
          )}

          {/* ===== Section 5: Advanced Options (Collapsible) ===== */}
          <CollapsibleTrigger
            label={t('common.sections.advancedOptions')}
            isOpen={showAdvanced}
            onClick={() => setShowAdvanced(!showAdvanced)}
          />

          {showAdvanced && (
            <div className="space-y-4 pt-1">
              {/* Non-external rules: IP version, bind IP, traffic multiplier */}
              {!isExternal && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t('admin.forwardRules.form.ipVersion')}>
                      <MobileSelect
                        value={form.formData.ipVersion}
                        onChange={(value) => form.handleChange('ipVersion', value)}
                        options={IP_VERSION_OPTIONS}
                      />
                    </FormField>

                    <FormField label={t('admin.forwardRules.form.bindIp')} hint={t('admin.forwardRules.form.bindIpHint')}>
                      <MobileFormInput
                        placeholder={t('admin.forwardRules.form.bindIpPlaceholder')}
                        value={form.formData.bindIp}
                        onChange={(value) => form.handleChange('bindIp', value)}
                        className="font-mono"
                      />
                    </FormField>
                  </div>

                  {/* Address Preference - only for entry/chain/direct_chain */}
                  {(form.formData.ruleType === 'entry' || form.formData.ruleType === 'chain' || form.formData.ruleType === 'direct_chain') && (
                    <FormField
                      label={t('admin.forwardRules.form.addressPreference')}
                      hint={t('admin.forwardRules.form.addressPreferenceHint')}
                    >
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
                        placeholder="1.0"
                        value={form.formData.trafficMultiplier !== undefined ? String(form.formData.trafficMultiplier) : ''}
                        onChange={(value) => form.handleChange('trafficMultiplier', value ? parseFloat(value) : undefined)}
                        className="font-mono"
                      />
                    </FormField>

                    <FormField label={t('common.fields.sortOrder')}>
                      <MobileFormInput
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={form.formData.sortOrder !== undefined ? String(form.formData.sortOrder) : ''}
                        onChange={(value) => form.handleChange('sortOrder', value ? parseInt(value, 10) : undefined)}
                        className="font-mono"
                      />
                    </FormField>
                  </div>
                </>
              )}

              {/* External rules: external rule ID, sort order */}
              {isExternal && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t('admin.forwardRules.form.externalRuleId')} hint={t('admin.forwardRules.form.externalRuleIdHint')}>
                    <MobileFormInput
                      placeholder={t('admin.forwardRules.form.externalRuleIdPlaceholder')}
                      value={form.formData.externalRuleId}
                      onChange={(value) => form.handleChange('externalRuleId', value)}
                      className="font-mono"
                    />
                  </FormField>

                  <FormField label={t('common.fields.sortOrder')}>
                    <MobileFormInput
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.formData.sortOrder !== undefined ? String(form.formData.sortOrder) : ''}
                      onChange={(value) => form.handleChange('sortOrder', value ? parseInt(value, 10) : undefined)}
                      className="font-mono"
                    />
                  </FormField>
                </div>
              )}

              <FormField label={t('common.fields.remark')}>
                <MobileFormInput
                  placeholder={t('admin.forwardRules.form.remarkPlaceholder')}
                  value={form.formData.remark}
                  onChange={(value) => form.handleChange('remark', value)}
                />
              </FormField>

              {/* Resource Groups */}
              {form.availableResourceGroups.length > 0 && (
                <FormField label={t('admin.forwardRules.form.bindResourceGroups')}>
                  <div className="ring-1 ring-border rounded-xl overflow-hidden divide-y divide-border">
                    {form.availableResourceGroups.map((group) => {
                      const plan = plansMap[group.planId];
                      const isSelected = form.formData.groupSids.includes(group.sid);
                      return (
                        <label
                          key={group.sid}
                          className={cn(
                            'flex items-center gap-3 px-3 py-3 cursor-pointer min-h-[52px] transition-colors active:bg-muted/50',
                            isSelected && 'bg-primary/5'
                          )}
                        >
                          <Checkbox checked={isSelected} onCheckedChange={() => form.handleGroupToggle(group.sid)} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">{group.name}</span>
                            {plan && (
                              <span className="text-xs text-muted-foreground truncate block">{plan.name}</span>
                            )}
                          </div>
                          {plan && (
                            <Badge variant="outline" className="text-[10px] flex-shrink-0">
                              {plan.planType === 'node'
                                ? t('admin.forwardRules.form.planTypeNode')
                                : t('common.planType.hybrid')}
                            </Badge>
                          )}
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
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.isFormValid}
              className="flex-1 min-h-[52px] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('common.loading.creating')}
                </>
              ) : initialData ? (
                t('admin.forwardRules.form.createCopy')
              ) : (
                t('common.actions.create')
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 min-h-[52px] active:scale-[0.98]"
            >
              {t('common.actions.cancel')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
