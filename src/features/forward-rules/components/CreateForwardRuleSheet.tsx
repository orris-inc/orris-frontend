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

import { useState, useEffect, useMemo } from 'react';
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
import { SortableChainAgentList } from './SortableChainAgentList';
import { cn } from '@/lib/utils';
import type {
  CreateForwardRuleRequest,
  ForwardAgent,
  ForwardRuleType,
  ForwardProtocol,
  IPVersion,
  TunnelType,
} from '@/api/forward';
import type { Node } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

type TargetType = 'manual' | 'node';

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

const TUNNEL_TYPE_OPTIONS: MobileSelectOption[] = [
  { value: 'ws', label: 'WebSocket' },
  { value: 'tls', label: 'TLS' },
];

const TARGET_TYPE_OPTIONS_KEYS = [
  { value: 'manual', labelKey: 'admin.forwardRules.form.targetTypeManual' },
  { value: 'node', labelKey: 'admin.forwardRules.form.targetTypeNode' },
];

// ============================================================================
// Helpers
// ============================================================================

const isPortInAllowedRange = (port: number, allowedPortRange: string | undefined): boolean => {
  if (!allowedPortRange || allowedPortRange.trim() === '') return true;
  const parts = allowedPortRange.split(',').map((p) => p.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && port >= start && port <= end) return true;
    } else {
      const singlePort = parseInt(part, 10);
      if (!isNaN(singlePort) && port === singlePort) return true;
    }
  }
  return false;
};

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
  const TARGET_TYPE_OPTIONS = useMemo(
    () => TARGET_TYPE_OPTIONS_KEYS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) })),
    [t]
  );

  // Form state
  const [formData, setFormData] = useState({
    agentId: '',
    ruleType: 'direct' as ForwardRuleType,
    exitAgentId: '',
    chainAgentIds: [] as string[],
    chainPortConfig: {} as Record<string, number>,
    tunnelType: 'ws' as TunnelType,
    tunnelHops: undefined as number | undefined,
    name: '',
    listenPort: 0,
    targetAddress: '',
    targetPort: 0,
    targetNodeId: '',
    bindIp: '',
    trafficMultiplier: undefined as number | undefined,
    sortOrder: undefined as number | undefined,
    protocol: 'tcp' as ForwardProtocol,
    ipVersion: 'auto' as IPVersion,
    remark: '',
    groupSids: [] as string[],
  });
  const [targetType, setTargetType] = useState<TargetType>('manual');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          agentId: initialData.agentId || '',
          ruleType: initialData.ruleType || 'direct',
          exitAgentId: initialData.exitAgentId || '',
          chainAgentIds: initialData.chainAgentIds || [],
          chainPortConfig: initialData.chainPortConfig || {},
          tunnelType: initialData.tunnelType || 'ws',
          tunnelHops: initialData.tunnelHops,
          name: initialData.name || '',
          listenPort: initialData.listenPort || 0,
          targetAddress: initialData.targetAddress || '',
          targetPort: initialData.targetPort || 0,
          targetNodeId: initialData.targetNodeId || '',
          bindIp: initialData.bindIp || '',
          trafficMultiplier: initialData.trafficMultiplier,
          sortOrder: initialData.sortOrder,
          protocol: initialData.protocol || 'tcp',
          ipVersion: initialData.ipVersion || 'auto',
          remark: initialData.remark || '',
          groupSids: initialData.groupSids || [],
        });
        setTargetType(initialData.targetType || (initialData.targetNodeId ? 'node' : 'manual'));
        setShowAdvanced(!!(initialData.bindIp || initialData.remark || initialData.trafficMultiplier));
      } else {
        setFormData({
          agentId: '',
          ruleType: 'direct',
          exitAgentId: '',
          chainAgentIds: [],
          chainPortConfig: {},
          tunnelType: 'ws',
          tunnelHops: undefined,
          name: '',
          listenPort: 0,
          targetAddress: '',
          targetPort: 0,
          targetNodeId: '',
          bindIp: '',
          trafficMultiplier: undefined,
          sortOrder: undefined,
          protocol: 'tcp',
          ipVersion: 'auto',
          remark: '',
          groupSids: [],
        });
        setTargetType('manual');
        setShowAdvanced(false);
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleClose = (isOpen: boolean) => {
    if (!loading) {
      onOpenChange(isOpen);
    }
  };

  const handleChange = (field: string, value: string | number | string[] | undefined) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // Remove entry agent from chain list if selected as entry
      if (field === 'agentId' && typeof value === 'string') {
        const currentChainIds = prev.chainAgentIds || [];
        if (currentChainIds.includes(value)) {
          newData.chainAgentIds = currentChainIds.filter((id) => id !== value);
          if (prev.chainPortConfig[value]) {
            const newPortConfig = { ...prev.chainPortConfig };
            delete newPortConfig[value];
            newData.chainPortConfig = newPortConfig;
          }
        }
      }
      return newData;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleChainPortChange = (agentId: string, port: number) => {
    setFormData((prev) => ({
      ...prev,
      chainPortConfig: { ...prev.chainPortConfig, [agentId]: port },
    }));
  };

  const handleGroupToggle = (groupSid: string) => {
    setFormData((prev) => {
      const currentGroups = prev.groupSids || [];
      const isSelected = currentGroups.includes(groupSid);
      return {
        ...prev,
        groupSids: isSelected ? currentGroups.filter((sid) => sid !== groupSid) : [...currentGroups, groupSid],
      };
    });
  };

  // Computed values
  const availableAgents = useMemo(
    () =>
      agents.filter(
        (a) =>
          a.status === 'enabled' ||
          a.id === formData.agentId ||
          a.id === formData.exitAgentId ||
          formData.chainAgentIds.includes(a.id)
      ),
    [agents, formData.agentId, formData.exitAgentId, formData.chainAgentIds]
  );

  const availableExitAgents = useMemo(
    () => availableAgents.filter((a) => a.id !== formData.agentId),
    [availableAgents, formData.agentId]
  );

  const availableChainAgents = useMemo(
    () => availableAgents.filter((a) => a.id !== formData.agentId),
    [availableAgents, formData.agentId]
  );

  const availableNodes = useMemo(
    () => nodes.filter((n) => n.status === 'active' || n.id === formData.targetNodeId),
    [nodes, formData.targetNodeId]
  );

  const availableResourceGroups = useMemo(
    () =>
      resourceGroups.filter((group) => {
        const plan = plansMap[group.planId];
        return group.status === 'active' && plan && (plan.planType === 'node' || plan.planType === 'hybrid');
      }),
    [resourceGroups, plansMap]
  );

  const selectedAgent = useMemo(() => agents.find((a) => a.id === formData.agentId), [agents, formData.agentId]);

  const agentOptions: MobileSelectOption[] = useMemo(
    () =>
      availableAgents.map((agent) => ({
        value: agent.id,
        label: agent.allowedPortRange ? `${agent.name} [${agent.allowedPortRange}]` : agent.name,
      })),
    [availableAgents]
  );

  const exitAgentOptions: MobileSelectOption[] = useMemo(
    () =>
      availableExitAgents.map((agent) => ({
        value: agent.id,
        label: agent.allowedPortRange ? `${agent.name} [${agent.allowedPortRange}]` : agent.name,
      })),
    [availableExitAgents]
  );

  const nodeOptions: MobileSelectOption[] = useMemo(
    () =>
      availableNodes.map((node) => ({
        value: node.id,
        label: `${node.name} (${node.serverAddress})`,
      })),
    [availableNodes]
  );

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.agentId) newErrors.agentId = t('admin.forwardRules.validation.selectForwardAgent');
    if (!formData.name.trim()) newErrors.name = t('admin.forwardRules.validation.ruleNameRequired');
    if (!formData.protocol) newErrors.protocol = t('admin.forwardRules.validation.protocolRequired');

    if (formData.listenPort && (formData.listenPort < 1 || formData.listenPort > 65535)) {
      newErrors.listenPort = t('admin.forwardRules.validation.listenPortRange');
    } else if (
      formData.listenPort &&
      selectedAgent?.allowedPortRange &&
      !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)
    ) {
      newErrors.listenPort = t('admin.forwardRules.validation.portNotInRangeSimple');
    }

    if (targetType === 'manual') {
      if (!formData.targetAddress.trim())
        newErrors.targetAddress = t('admin.forwardRules.validation.targetAddressRequired');
      if (!formData.targetPort || formData.targetPort < 1 || formData.targetPort > 65535) {
        newErrors.targetPort = t('admin.forwardRules.validation.targetPortRange');
      }
    } else if (targetType === 'node') {
      if (!formData.targetNodeId) newErrors.targetNodeId = t('admin.forwardRules.validation.selectTargetNode');
    }

    if (formData.ruleType === 'entry' && !formData.exitAgentId) {
      newErrors.exitAgentId = t('admin.forwardRules.validation.selectExitNode');
    }

    if ((formData.ruleType === 'chain' || formData.ruleType === 'direct_chain') && formData.chainAgentIds.length === 0) {
      newErrors.chainAgentIds = t('admin.forwardRules.validation.selectAtLeastOneNode');
    }

    if (formData.ruleType === 'direct_chain') {
      const missingPorts = formData.chainAgentIds.filter((id) => {
        const port = formData.chainPortConfig[id];
        return !port || port < 1 || port > 65535;
      });
      if (missingPorts.length > 0) {
        newErrors.chainPortConfig = t('admin.forwardRules.validation.configureValidPortsForDirectNodes');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData: CreateForwardRuleRequest = {
        agentId: formData.agentId,
        ruleType: formData.ruleType,
        name: formData.name.trim(),
        protocol: formData.protocol,
        ipVersion: formData.ipVersion,
      };

      if (formData.listenPort) submitData.listenPort = formData.listenPort;

      if (formData.ruleType === 'entry') {
        submitData.exitAgentId = formData.exitAgentId;
        submitData.tunnelType = formData.tunnelType;
      } else if (formData.ruleType === 'chain') {
        submitData.chainAgentIds = formData.chainAgentIds;
        submitData.tunnelType = formData.tunnelType;
        if (formData.tunnelHops !== undefined && formData.tunnelHops >= 0) {
          submitData.tunnelHops = formData.tunnelHops;
          if (formData.tunnelHops < formData.chainAgentIds.length) {
            submitData.chainPortConfig = formData.chainPortConfig;
          }
        }
      } else if (formData.ruleType === 'direct_chain') {
        submitData.chainAgentIds = formData.chainAgentIds;
        submitData.chainPortConfig = formData.chainPortConfig;
      }

      if (targetType === 'manual') {
        submitData.targetAddress = formData.targetAddress.trim();
        submitData.targetPort = formData.targetPort;
      } else {
        submitData.targetNodeId = formData.targetNodeId;
      }

      if (formData.bindIp?.trim()) submitData.bindIp = formData.bindIp.trim();
      if (formData.trafficMultiplier !== undefined && formData.trafficMultiplier > 0) {
        submitData.trafficMultiplier = formData.trafficMultiplier;
      }
      if (formData.sortOrder !== undefined && formData.sortOrder >= 0) {
        submitData.sortOrder = formData.sortOrder;
      }
      if (formData.remark?.trim()) submitData.remark = formData.remark.trim();
      if (formData.groupSids.length > 0) submitData.groupSids = formData.groupSids;

      await onSubmit(submitData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.agentId &&
    formData.name.trim() &&
    formData.protocol &&
    (targetType === 'manual'
      ? formData.targetAddress.trim() && formData.targetPort > 0
      : !!formData.targetNodeId) &&
    (formData.ruleType !== 'entry' || formData.exitAgentId) &&
    ((formData.ruleType !== 'chain' && formData.ruleType !== 'direct_chain') || formData.chainAgentIds.length > 0);

  const needsChainConfig = formData.ruleType === 'chain' || formData.ruleType === 'direct_chain';
  const needsExitAgent = formData.ruleType === 'entry';
  const needsTunnelConfig = formData.ruleType === 'entry' || formData.ruleType === 'chain';

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

          <FormField label={t('admin.forwardRules.form.ruleName')} required error={errors.name}>
            <MobileFormInput
              placeholder={t('admin.forwardRules.form.ruleNamePlaceholder')}
              value={formData.name}
              onChange={(value) => handleChange('name', value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('admin.forwardRules.form.ruleType')} required>
              <MobileSelect
                value={formData.ruleType}
                onChange={(value) => handleChange('ruleType', value)}
                options={RULE_TYPE_OPTIONS}
              />
            </FormField>

            <FormField label={t('common.protocol')} required>
              <MobileSelect
                value={formData.protocol}
                onChange={(value) => handleChange('protocol', value)}
                options={PROTOCOL_OPTIONS}
              />
            </FormField>
          </div>

          {/* ===== Section 2: Agent Config ===== */}
          <SectionDivider label={t('admin.forwardRules.form.forwardAgent')} />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={t('admin.forwardRules.form.forwardAgent')}
              required
              error={errors.agentId}
              className="col-span-2 sm:col-span-1"
            >
              <MobileSelect
                value={formData.agentId}
                onChange={(value) => handleChange('agentId', value)}
                options={agentOptions}
                placeholder={t('admin.forwardRules.form.selectForwardAgent')}
              />
            </FormField>

            <FormField
              label={t('admin.forwardRules.form.listenPort')}
              error={errors.listenPort}
              hint={t('common.auto')}
              className="col-span-2 sm:col-span-1"
            >
              <MobileFormInput
                type="number"
                inputMode="numeric"
                placeholder={t('common.auto')}
                value={formData.listenPort ? String(formData.listenPort) : ''}
                onChange={(value) => handleChange('listenPort', parseInt(value, 10) || 0)}
                className="font-mono"
              />
            </FormField>
          </div>

          {/* Port Range Warning */}
          {selectedAgent?.allowedPortRange && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
              <Info className="size-4 text-warning flex-shrink-0" />
              <p className="text-xs text-warning">
                {t('admin.forwardRules.form.portRestriction', { range: selectedAgent.allowedPortRange })}
              </p>
            </div>
          )}

          {/* ===== Section 3: Rule Type Specific Config ===== */}
          {(needsExitAgent || needsTunnelConfig || needsChainConfig) && (
            <>
              <SectionDivider label={t('admin.forwardRules.form.forwardConfig')} />

              {/* Entry type: Exit Agent */}
              {needsExitAgent && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label={t('admin.forwardRules.form.exitNode')}
                    required
                    error={errors.exitAgentId}
                    className="col-span-2 sm:col-span-1"
                  >
                    <MobileSelect
                      value={formData.exitAgentId}
                      onChange={(value) => handleChange('exitAgentId', value)}
                      options={exitAgentOptions}
                      placeholder={t('admin.forwardRules.form.selectExitNode')}
                    />
                  </FormField>

                  <FormField label={t('admin.forwardRules.form.tunnelType')} className="col-span-2 sm:col-span-1">
                    <MobileSelect
                      value={formData.tunnelType}
                      onChange={(value) => handleChange('tunnelType', value)}
                      options={TUNNEL_TYPE_OPTIONS}
                    />
                  </FormField>
                </div>
              )}

              {/* Chain type: Tunnel settings */}
              {formData.ruleType === 'chain' && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t('admin.forwardRules.form.tunnelType')}>
                    <MobileSelect
                      value={formData.tunnelType}
                      onChange={(value) => handleChange('tunnelType', value)}
                      options={TUNNEL_TYPE_OPTIONS}
                    />
                  </FormField>

                  <FormField label={t('admin.forwardRules.form.tunnelHops')} hint={t('admin.forwardRules.form.tunnelHopsPlaceholder')}>
                    <MobileFormInput
                      type="number"
                      inputMode="numeric"
                      placeholder={t('admin.forwardRules.form.tunnelHopsPlaceholder')}
                      value={formData.tunnelHops !== undefined ? String(formData.tunnelHops) : ''}
                      onChange={(value) => handleChange('tunnelHops', value ? parseInt(value, 10) : undefined)}
                      className="font-mono"
                    />
                  </FormField>
                </div>
              )}

              {/* Chain nodes list */}
              {needsChainConfig && (
                <FormField
                  label={
                    formData.ruleType === 'direct_chain'
                      ? t('admin.forwardRules.form.chainNodesWithPort')
                      : t('admin.forwardRules.form.chainNodes')
                  }
                  required
                  error={errors.chainAgentIds || errors.chainPortConfig}
                >
                  <SortableChainAgentList
                    agents={availableChainAgents}
                    selectedIds={formData.chainAgentIds}
                    onSelectionChange={(ids) => {
                      const newPortConfig = { ...formData.chainPortConfig };
                      Object.keys(newPortConfig).forEach((id) => {
                        if (!ids.includes(id)) delete newPortConfig[id];
                      });
                      setFormData((prev) => ({
                        ...prev,
                        chainAgentIds: ids,
                        chainPortConfig: newPortConfig,
                      }));
                    }}
                    showPortConfig={
                      formData.ruleType === 'direct_chain' ||
                      (formData.ruleType === 'chain' &&
                        formData.tunnelHops !== undefined &&
                        formData.tunnelHops >= 0 &&
                        formData.tunnelHops < formData.chainAgentIds.length)
                    }
                    portConfigStartIndex={formData.ruleType === 'chain' ? (formData.tunnelHops ?? 0) : 0}
                    portConfig={formData.chainPortConfig}
                    onPortConfigChange={handleChainPortChange}
                    hasError={!!errors.chainAgentIds || !!errors.chainPortConfig}
                    idPrefix="create-sheet-chain"
                  />
                </FormField>
              )}
            </>
          )}

          {/* ===== Section 4: Target Config ===== */}
          <SectionDivider label={t('admin.forwardRules.form.targetType')} />

          <FormField label={t('admin.forwardRules.form.targetType')} required>
            <MobileSelect
              value={targetType}
              onChange={(value) => {
                setTargetType(value as TargetType);
                if (value === 'manual') {
                  handleChange('targetNodeId', '');
                } else {
                  handleChange('targetAddress', '');
                  handleChange('targetPort', 0);
                }
              }}
              options={TARGET_TYPE_OPTIONS}
            />
          </FormField>

          {targetType === 'manual' ? (
            <div className="grid grid-cols-3 gap-3">
              <FormField
                label={t('admin.forwardRules.form.targetAddress')}
                required
                error={errors.targetAddress}
                className="col-span-2"
              >
                <MobileFormInput
                  placeholder={t('admin.forwardRules.form.targetAddressPlaceholder')}
                  value={formData.targetAddress}
                  onChange={(value) => handleChange('targetAddress', value)}
                  className="font-mono"
                />
              </FormField>

              <FormField label={t('admin.forwardRules.form.targetPort')} required error={errors.targetPort}>
                <MobileFormInput
                  type="number"
                  inputMode="numeric"
                  placeholder="Port"
                  value={formData.targetPort ? String(formData.targetPort) : ''}
                  onChange={(value) => handleChange('targetPort', parseInt(value, 10) || 0)}
                  className="font-mono"
                />
              </FormField>
            </div>
          ) : (
            <FormField
              label={t('admin.forwardRules.form.targetNode')}
              required
              error={errors.targetNodeId}
              hint={t('admin.forwardRules.form.targetNodeDynamicHint')}
            >
              <MobileSelect
                value={formData.targetNodeId}
                onChange={(value) => handleChange('targetNodeId', value)}
                options={nodeOptions}
                placeholder={t('admin.forwardRules.form.selectTargetNode')}
              />
            </FormField>
          )}

          {/* ===== Section 5: Advanced Options (Collapsible) ===== */}
          <CollapsibleTrigger
            label={t('common.sections.advancedOptions')}
            isOpen={showAdvanced}
            onClick={() => setShowAdvanced(!showAdvanced)}
          />

          {showAdvanced && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('admin.forwardRules.form.ipVersion')}>
                  <MobileSelect
                    value={formData.ipVersion}
                    onChange={(value) => handleChange('ipVersion', value)}
                    options={IP_VERSION_OPTIONS}
                  />
                </FormField>

                <FormField label={t('admin.forwardRules.form.bindIp')} hint={t('admin.forwardRules.form.bindIpHint')}>
                  <MobileFormInput
                    placeholder={t('admin.forwardRules.form.bindIpPlaceholder')}
                    value={formData.bindIp}
                    onChange={(value) => handleChange('bindIp', value)}
                    className="font-mono"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('admin.forwardRules.form.trafficMultiplier')}>
                  <MobileFormInput
                    type="number"
                    inputMode="decimal"
                    placeholder="1.0"
                    value={formData.trafficMultiplier !== undefined ? String(formData.trafficMultiplier) : ''}
                    onChange={(value) => handleChange('trafficMultiplier', value ? parseFloat(value) : undefined)}
                    className="font-mono"
                  />
                </FormField>

                <FormField label={t('common.fields.sortOrder')}>
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={formData.sortOrder !== undefined ? String(formData.sortOrder) : ''}
                    onChange={(value) => handleChange('sortOrder', value ? parseInt(value, 10) : undefined)}
                    className="font-mono"
                  />
                </FormField>
              </div>

              <FormField label={t('common.fields.remark')}>
                <MobileFormInput
                  placeholder={t('admin.forwardRules.form.remarkPlaceholder')}
                  value={formData.remark}
                  onChange={(value) => handleChange('remark', value)}
                />
              </FormField>

              {/* Resource Groups */}
              {availableResourceGroups.length > 0 && (
                <FormField label={t('admin.forwardRules.form.bindResourceGroups')}>
                  <div className="border rounded-xl overflow-hidden divide-y divide-border">
                    {availableResourceGroups.map((group) => {
                      const plan = plansMap[group.planId];
                      const isSelected = formData.groupSids.includes(group.sid);
                      return (
                        <label
                          key={group.sid}
                          className={cn(
                            'flex items-center gap-3 px-3 py-3 cursor-pointer min-h-[52px] transition-colors',
                            isSelected ? 'bg-primary/5' : 'active:bg-muted/50'
                          )}
                        >
                          <Checkbox checked={isSelected} onCheckedChange={() => handleGroupToggle(group.sid)} />
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
              disabled={loading || !isFormValid}
              className="flex-1 min-h-[52px]"
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
              className="flex-1 min-h-[52px]"
            >
              {t('common.actions.cancel')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
