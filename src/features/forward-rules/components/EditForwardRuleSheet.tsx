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

import { useState, useEffect, useMemo } from 'react';
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
import { SortableChainAgentList } from './SortableChainAgentList';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/shared/utils/date-utils';
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
type TargetType = 'manual' | 'node';

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
  const TARGET_TYPE_OPTIONS = useMemo(
    () => TARGET_TYPE_OPTIONS_KEYS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) })),
    [t]
  );

  // Form state
  const [formData, setFormData] = useState<
    UpdateForwardRuleRequest & {
      chainAgentIds?: string[];
      chainPortConfig?: Record<string, number>;
      trafficMultiplier?: number;
      sortOrder?: number;
      tunnelType?: TunnelType;
      tunnelHops?: number;
      groupSids?: string[];
      serverAddress?: string;
      externalSource?: string;
      externalRuleId?: string;
    }
  >({});
  const [targetType, setTargetType] = useState<TargetType>('manual');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form
  useEffect(() => {
    if (rule) {
      const chainAgentIds = (rule.chainAgentIds || []).filter((id) => id !== rule.agentId);
      const chainPortConfig = { ...(rule.chainPortConfig || {}) };
      if (chainPortConfig[rule.agentId]) delete chainPortConfig[rule.agentId];

      setFormData({
        name: rule.name,
        protocol: rule.protocol,
        listenPort: rule.listenPort,
        targetAddress: rule.targetAddress,
        targetPort: rule.targetPort,
        targetNodeId: rule.targetNodeId,
        bindIp: rule.bindIp,
        ipVersion: rule.ipVersion,
        remark: rule.remark,
        agentId: rule.agentId,
        exitAgentId: rule.exitAgentId,
        chainAgentIds,
        chainPortConfig,
        trafficMultiplier: rule.trafficMultiplier,
        sortOrder: rule.sortOrder,
        tunnelType: rule.tunnelType,
        tunnelHops: rule.tunnelHops,
        groupSids: rule.groupSids || [],
        serverAddress: rule.serverAddress,
        externalSource: rule.externalSource,
        externalRuleId: rule.externalRuleId,
      });
      setTargetType(rule.targetNodeId ? 'node' : 'manual');
      setShowAdvanced(!!(rule.bindIp || rule.remark));
      setErrors({});
    }
  }, [rule]);

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const handleChange = (
    field: keyof (UpdateForwardRuleRequest & { chainAgentIds?: string[] }),
    value: string | number | ForwardProtocol | string[] | undefined
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'agentId' && typeof value === 'string') {
        const currentChainIds = prev.chainAgentIds || [];
        if (currentChainIds.includes(value)) {
          newData.chainAgentIds = currentChainIds.filter((id) => id !== value);
          if (prev.chainPortConfig?.[value]) {
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
      chainPortConfig: { ...(prev.chainPortConfig || {}), [agentId]: port },
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
          (formData.chainAgentIds || []).includes(a.id)
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

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = t('admin.forwardRules.validation.ruleNameRequired');
    }

    if (rule?.ruleType === 'external') {
      if (formData.serverAddress !== undefined && !formData.serverAddress.trim()) {
        newErrors.serverAddress = t('admin.forwardRules.validation.serverAddressRequired');
      }
      if (formData.listenPort && (formData.listenPort < 1 || formData.listenPort > 65535)) {
        newErrors.listenPort = t('admin.forwardRules.validation.listenPortRange');
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (formData.listenPort && (formData.listenPort < 1 || formData.listenPort > 65535)) {
      newErrors.listenPort = t('admin.forwardRules.validation.listenPortRange');
    } else if (
      formData.listenPort &&
      selectedAgent?.allowedPortRange &&
      !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)
    ) {
      newErrors.listenPort = t('admin.forwardRules.validation.portNotInRangeSimple');
    }

    if (rule && ['direct', 'entry', 'chain', 'direct_chain'].includes(rule.ruleType)) {
      if (targetType === 'manual') {
        if (formData.targetAddress !== undefined && !formData.targetAddress.trim()) {
          newErrors.targetAddress = t('admin.forwardRules.validation.targetAddressRequired');
        }
        if (formData.targetPort !== undefined && (formData.targetPort < 1 || formData.targetPort > 65535)) {
          newErrors.targetPort = t('admin.forwardRules.validation.targetPortRange');
        }
      } else if (targetType === 'node' && !formData.targetNodeId) {
        newErrors.targetNodeId = t('admin.forwardRules.validation.selectTargetNode');
      }
    }

    if (rule?.ruleType === 'direct_chain') {
      const chainIds = formData.chainAgentIds || [];
      const missingPorts = chainIds.filter((id) => {
        const port = formData.chainPortConfig?.[id];
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
    if (!rule || !validate()) return;

    setLoading(true);
    try {
      const updates: UpdateForwardRuleRequest = {};

      // Compare and collect changes
      if (formData.name !== rule.name) updates.name = formData.name;
      if (formData.remark !== rule.remark) updates.remark = formData.remark;

      if (rule.ruleType === 'external') {
        if (formData.listenPort !== rule.listenPort) updates.listenPort = formData.listenPort;
        if (formData.serverAddress !== rule.serverAddress)
          (updates as Record<string, unknown>).serverAddress = formData.serverAddress;
        if (formData.targetNodeId !== rule.targetNodeId) updates.targetNodeId = formData.targetNodeId || undefined;
        if (formData.externalSource !== rule.externalSource)
          (updates as Record<string, unknown>).externalSource = formData.externalSource;
        if (formData.externalRuleId !== rule.externalRuleId)
          (updates as Record<string, unknown>).externalRuleId = formData.externalRuleId;
        if (formData.sortOrder !== rule.sortOrder && formData.sortOrder !== undefined)
          updates.sortOrder = formData.sortOrder;

        const currentGroups = formData.groupSids || [];
        const originalGroups = rule.groupSids || [];
        const hasGroupsChange =
          currentGroups.length !== originalGroups.length ||
          currentGroups.some((sid) => !originalGroups.includes(sid)) ||
          originalGroups.some((sid) => !currentGroups.includes(sid));
        if (hasGroupsChange) updates.groupSids = currentGroups;

        if (Object.keys(updates).length > 0) {
          await onSubmit(rule.id, updates);
        }
        handleClose();
        return;
      }

      if (formData.protocol !== rule.protocol) updates.protocol = formData.protocol;
      if (formData.listenPort !== rule.listenPort) updates.listenPort = formData.listenPort;
      if (formData.ipVersion !== rule.ipVersion) updates.ipVersion = formData.ipVersion;
      if (formData.bindIp !== rule.bindIp) updates.bindIp = formData.bindIp;
      if (formData.agentId !== rule.agentId) updates.agentId = formData.agentId;

      if (rule.ruleType === 'entry' && formData.exitAgentId !== rule.exitAgentId) {
        updates.exitAgentId = formData.exitAgentId;
      }

      if ((rule.ruleType === 'entry' || rule.ruleType === 'chain') && formData.tunnelType !== rule.tunnelType) {
        updates.tunnelType = formData.tunnelType;
      }

      if (rule.ruleType === 'chain' && formData.tunnelHops !== rule.tunnelHops) {
        updates.tunnelHops = formData.tunnelHops;
      }

      if (rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') {
        const currentIds = formData.chainAgentIds || [];
        const originalIds = rule.chainAgentIds || [];
        const hasChainChange =
          currentIds.length !== originalIds.length || currentIds.some((id, index) => id !== originalIds[index]);
        if (hasChainChange) updates.chainAgentIds = currentIds;

        if (
          rule.ruleType === 'direct_chain' ||
          (rule.ruleType === 'chain' && formData.tunnelHops !== undefined && formData.tunnelHops >= 0)
        ) {
          const currentPortConfig = formData.chainPortConfig || {};
          const originalPortConfig = rule.chainPortConfig || {};
          const hasPortConfigChange =
            Object.keys(currentPortConfig).length !== Object.keys(originalPortConfig).length ||
            Object.entries(currentPortConfig).some(([id, port]) => originalPortConfig[id] !== port);
          if (hasPortConfigChange) updates.chainPortConfig = currentPortConfig;
        }
      }

      if (['direct', 'entry', 'chain', 'direct_chain'].includes(rule.ruleType)) {
        if (targetType === 'manual') {
          if (formData.targetAddress !== rule.targetAddress) updates.targetAddress = formData.targetAddress;
          if (formData.targetPort !== rule.targetPort) updates.targetPort = formData.targetPort;
          if (rule.targetNodeId) updates.targetNodeId = undefined;
        } else {
          if (formData.targetNodeId !== rule.targetNodeId) updates.targetNodeId = formData.targetNodeId;
          if (rule.targetAddress) updates.targetAddress = undefined;
          if (rule.targetPort) updates.targetPort = undefined;
        }
      }

      if (formData.trafficMultiplier !== rule.trafficMultiplier) {
        updates.trafficMultiplier = formData.trafficMultiplier;
      }
      if (formData.sortOrder !== rule.sortOrder && formData.sortOrder !== undefined) {
        updates.sortOrder = formData.sortOrder;
      }

      const currentGroups = formData.groupSids || [];
      const originalGroups = rule.groupSids || [];
      const hasGroupsChange =
        currentGroups.length !== originalGroups.length ||
        currentGroups.some((sid) => !originalGroups.includes(sid)) ||
        originalGroups.some((sid) => !currentGroups.includes(sid));
      if (hasGroupsChange) updates.groupSids = currentGroups;

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
          <div className="rounded-lg border border-border bg-muted/30 px-3 divide-y divide-border">
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
          <FormField label={t('admin.forwardRules.form.ruleName')} error={errors.name}>
            <MobileFormInput
              value={formData.name || ''}
              onChange={(value) => handleChange('name', value)}
            />
          </FormField>

          {/* External Type Fields */}
          {isExternal && (
            <>
              <FormField label={t('admin.forwardRules.form.serverAddress')} error={errors.serverAddress}>
                <MobileFormInput
                  placeholder={t('admin.forwardRules.form.serverAddressPlaceholder')}
                  value={formData.serverAddress || ''}
                  onChange={(value) => handleChange('serverAddress' as keyof UpdateForwardRuleRequest, value)}
                  className="font-mono"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('admin.forwardRules.form.listenPort')} error={errors.listenPort}>
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    placeholder="1-65535"
                    value={formData.listenPort ? String(formData.listenPort) : ''}
                    onChange={(value) => handleChange('listenPort', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </FormField>

                <FormField label={t('common.fields.sortOrder')}>
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    value={String(formData.sortOrder ?? 0)}
                    onChange={(value) => handleChange('sortOrder', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </FormField>
              </div>

              <FormField label={t('admin.forwardRules.form.targetNode')} hint={t('common.optional')}>
                <MobileSelect
                  value={formData.targetNodeId || ''}
                  onChange={(value) => handleChange('targetNodeId', value)}
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
                  value={formData.agentId || ''}
                  onChange={(value) => handleChange('agentId', value)}
                  options={agentOptions}
                />
              </FormField>

              {selectedAgent?.allowedPortRange && (
                <div className="px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning">
                    {t('admin.forwardRules.form.portRestriction', { range: selectedAgent.allowedPortRange })}
                  </p>
                </div>
              )}

              {needsExitAgent && (
                <FormField label={t('admin.forwardRules.form.exitAgent')}>
                  <MobileSelect
                    value={formData.exitAgentId || ''}
                    onChange={(value) => handleChange('exitAgentId', value)}
                    options={exitAgentOptions}
                  />
                </FormField>
              )}

              {needsTunnelConfig && (
                <FormField label={t('admin.forwardRules.form.tunnelType')}>
                  <MobileSelect
                    value={formData.tunnelType || 'ws'}
                    onChange={(value) => handleChange('tunnelType', value as TunnelType)}
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
                    value={formData.tunnelHops !== undefined ? String(formData.tunnelHops) : ''}
                    onChange={(value) => handleChange('tunnelHops', value ? parseInt(value, 10) : undefined)}
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
                  error={errors.chainPortConfig}
                >
                  <SortableChainAgentList
                    agents={availableChainAgents}
                    selectedIds={formData.chainAgentIds || []}
                    onSelectionChange={(ids) => {
                      const newPortConfig = { ...(formData.chainPortConfig || {}) };
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
                      rule.ruleType === 'direct_chain' ||
                      (rule.ruleType === 'chain' &&
                        formData.tunnelHops !== undefined &&
                        formData.tunnelHops >= 0 &&
                        formData.tunnelHops < (formData.chainAgentIds?.length || 0))
                    }
                    portConfigStartIndex={rule.ruleType === 'chain' ? (formData.tunnelHops ?? 0) : 0}
                    portConfig={formData.chainPortConfig || {}}
                    onPortConfigChange={handleChainPortChange}
                    hasError={!!errors.chainPortConfig}
                    idPrefix="edit-sheet-chain"
                  />
                </FormField>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t('common.protocol')}>
                  <MobileSelect
                    value={formData.protocol || 'tcp'}
                    onChange={(value) => handleChange('protocol', value as ForwardProtocol)}
                    options={PROTOCOL_OPTIONS}
                  />
                </FormField>

                <FormField label={t('admin.forwardRules.form.ipVersion')}>
                  <MobileSelect
                    value={formData.ipVersion || 'auto'}
                    onChange={(value) => handleChange('ipVersion', value as IPVersion)}
                    options={IP_VERSION_OPTIONS}
                  />
                </FormField>
              </div>

              <FormField label={t('admin.forwardRules.form.listenPort')} hint={t('admin.forwardRules.form.listenPortAutoHint')} error={errors.listenPort}>
                <MobileFormInput
                  type="number"
                  inputMode="numeric"
                  placeholder={t('admin.forwardRules.form.listenPortAutoHint')}
                  value={formData.listenPort ? String(formData.listenPort) : ''}
                  onChange={(value) => handleChange('listenPort', parseInt(value, 10) || 0)}
                  className="font-mono"
                />
              </FormField>

              {/* Target Config */}
              {['direct', 'entry', 'chain', 'direct_chain'].includes(rule.ruleType) && (
                <>
                  <FormField label={t('admin.forwardRules.form.targetType')}>
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
                      <div className="col-span-2">
                        <FormField label={t('admin.forwardRules.form.targetAddress')} error={errors.targetAddress}>
                          <MobileFormInput
                            value={formData.targetAddress || ''}
                            onChange={(value) => handleChange('targetAddress', value)}
                            className="font-mono"
                          />
                        </FormField>
                      </div>
                      <FormField label={t('admin.forwardRules.form.targetPort')} error={errors.targetPort}>
                        <MobileFormInput
                          type="number"
                          inputMode="numeric"
                          value={formData.targetPort ? String(formData.targetPort) : ''}
                          onChange={(value) => handleChange('targetPort', parseInt(value, 10))}
                          className="font-mono"
                        />
                      </FormField>
                    </div>
                  ) : (
                    <FormField label={t('admin.forwardRules.form.targetNode')} error={errors.targetNodeId}>
                      <MobileSelect
                        value={formData.targetNodeId || ''}
                        onChange={(value) => handleChange('targetNodeId', value)}
                        options={nodeOptions}
                        placeholder={t('admin.forwardRules.form.selectTargetNode')}
                      />
                    </FormField>
                  )}
                </>
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
                      value={formData.bindIp || ''}
                      onChange={(value) => handleChange('bindIp', value)}
                      className="font-mono"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t('admin.forwardRules.form.trafficMultiplier')}>
                      <MobileFormInput
                        type="number"
                        inputMode="decimal"
                        placeholder={t('common.auto')}
                        value={formData.trafficMultiplier !== undefined ? String(formData.trafficMultiplier) : ''}
                        onChange={(value) => handleChange('trafficMultiplier', value ? parseFloat(value) : undefined)}
                        className="font-mono"
                      />
                    </FormField>

                    <FormField label={t('common.fields.sortOrder')}>
                      <MobileFormInput
                        type="number"
                        inputMode="numeric"
                        value={String(formData.sortOrder ?? 0)}
                        onChange={(value) => handleChange('sortOrder', parseInt(value, 10) || 0)}
                        className="font-mono"
                      />
                    </FormField>
                  </div>
                </>
              )}

              <FormField label={t('common.fields.remark')}>
                <MobileFormInput
                  placeholder={t('admin.forwardRules.form.remarkPlaceholder')}
                  value={formData.remark || ''}
                  onChange={(value) => handleChange('remark', value)}
                />
              </FormField>

              {/* Resource Groups */}
              {availableResourceGroups.length > 0 && (
                <FormField label={t('admin.forwardRules.form.bindResourceGroupsEdit')}>
                  <p className="text-xs text-muted-foreground mb-2">{t('admin.forwardRules.form.bindResourceGroupsHint')}</p>
                  <div className="border rounded-lg overflow-hidden divide-y divide-border">
                    {availableResourceGroups.map((group) => {
                      const plan = plansMap[group.planId];
                      const isSelected = formData.groupSids?.includes(group.sid) ?? false;
                      return (
                        <label
                          key={group.sid}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 cursor-pointer min-h-[44px]',
                            isSelected && 'bg-primary/5'
                          )}
                        >
                          <Checkbox checked={isSelected} onCheckedChange={() => handleGroupToggle(group.sid)} />
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
            <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1 min-h-[44px]">
              {t('common.actions.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 min-h-[44px]">
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('common.loading.saving')}
                </>
              ) : (
                t('common.actions.save')
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
