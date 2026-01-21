/**
 * Edit Forward Rule Sheet Component
 * Mobile-optimized bottom sheet for editing forward rules
 */

import { useState, useEffect, useMemo } from 'react';
import { formatDateTime } from '@/shared/utils/date-utils';
import {
  ArrowLeftRight,
  Settings,
  ChevronDown,
  Loader2,
  Info,
  FolderTree,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
  type EditSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { Checkbox } from '@/components/common/Checkbox';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { SortableChainAgentList } from './SortableChainAgentList';
import { cn } from '@/lib/utils';
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

type ForwardProtocol = 'tcp' | 'udp' | 'both';
type TargetType = 'manual' | 'node';

interface EditForwardRuleSheetProps extends EditSheetProps<ForwardRule, UpdateForwardRuleRequest> {
  nodes?: Node[];
  agents?: ForwardAgent[];
  resourceGroups?: ResourceGroup[];
  plansMap?: Record<string, SubscriptionPlan>;
}

// Rule type labels
const RULE_TYPE_LABELS: Record<string, string> = {
  direct: '直连转发',
  entry: '入口节点',
  chain: '隧道链式转发',
  direct_chain: '直连链式转发',
  external: '外部规则',
};

// Protocol options
const PROTOCOL_OPTIONS: MobileSelectOption[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'both', label: 'TCP/UDP' },
];

// IP version options
const IP_VERSION_OPTIONS: MobileSelectOption[] = [
  { value: 'auto', label: '自动' },
  { value: 'ipv4', label: 'IPv4' },
  { value: 'ipv6', label: 'IPv6' },
];

// Tunnel type options
const TUNNEL_TYPE_OPTIONS: MobileSelectOption[] = [
  { value: 'ws', label: 'WebSocket' },
  { value: 'tls', label: 'TLS' },
];

// Target type options
const TARGET_TYPE_OPTIONS: MobileSelectOption[] = [
  { value: 'manual', label: '手动输入地址' },
  { value: 'node', label: '选择节点（动态解析）' },
];

// Check if port is in allowed range
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

// Compact Mobile Section Component
interface MobileSectionProps {
  title: string;
  icon: React.ElementType;
  badge?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const MobileSection: React.FC<MobileSectionProps> = ({
  title,
  icon: Icon,
  badge,
  isOpen,
  onToggle,
  children,
}) => (
  <div className={cn('border rounded-lg overflow-hidden', isOpen ? 'border-primary/30' : 'border-border')}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2.5 text-left active:bg-accent/30"
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('size-4', isOpen ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.5} />
        <span className="text-sm font-medium">{title}</span>
        {badge && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{badge}</Badge>}
      </div>
      <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
    </button>
    {isOpen && <div className="px-3 pb-3 pt-1 border-t border-border">{children}</div>}
  </div>
);

// Compact Form Label
const Field: React.FC<{ label: string; hint?: string }> = ({ label, hint }) => (
  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
    {label}
    {hint && <span className="text-muted-foreground/70">({hint})</span>}
  </label>
);

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
  const [formData, setFormData] = useState<
    UpdateForwardRuleRequest & {
      chainAgentIds?: string[];
      chainPortConfig?: Record<string, number>;
      trafficMultiplier?: number;
      sortOrder?: number;
      tunnelType?: TunnelType;
      tunnelHops?: number;
      groupSids?: string[];
      // External rule fields
      serverAddress?: string;
      externalSource?: string;
      externalRuleId?: string;
    }
  >({});
  const [targetType, setTargetType] = useState<TargetType>('manual');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['editable']));
  const [loading, setLoading] = useState(false);

  // Initialize form when rule changes
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
        // External rule fields
        serverAddress: rule.serverAddress,
        externalSource: rule.externalSource,
        externalRuleId: rule.externalRuleId,
      });
      setTargetType(rule.targetNodeId ? 'node' : 'manual');
      setErrors({});
      setOpenSections(new Set(['editable']));
    }
  }, [rule]);

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const handleChange = (
    field: keyof (UpdateForwardRuleRequest & { chainAgentIds?: string[] }),
    value: string | number | ForwardProtocol | string[] | undefined,
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
        groupSids: isSelected
          ? currentGroups.filter((sid) => sid !== groupSid)
          : [...currentGroups, groupSid],
      };
    });
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Available agents
  const availableAgents = useMemo(() =>
    agents.filter((a) =>
      a.status === 'enabled' ||
      a.id === formData.agentId ||
      a.id === formData.exitAgentId ||
      (formData.chainAgentIds || []).includes(a.id)
    ), [agents, formData.agentId, formData.exitAgentId, formData.chainAgentIds]);

  const availableExitAgents = useMemo(() =>
    availableAgents.filter((a) => a.id !== formData.agentId),
    [availableAgents, formData.agentId]);

  const availableChainAgents = useMemo(() =>
    availableAgents.filter((a) => a.id !== formData.agentId),
    [availableAgents, formData.agentId]);

  // Available nodes
  const availableNodes = useMemo(() =>
    nodes.filter((n) => n.status === 'active' || n.id === formData.targetNodeId),
    [nodes, formData.targetNodeId]);

  // Available resource groups
  const availableResourceGroups = useMemo(() =>
    resourceGroups.filter((group) => {
      const plan = plansMap[group.planId];
      return group.status === 'active' && plan && (plan.planType === 'node' || plan.planType === 'hybrid');
    }), [resourceGroups, plansMap]);

  // Selected agent
  const selectedAgent = useMemo(() =>
    agents.find((a) => a.id === formData.agentId),
    [agents, formData.agentId]);

  // Agent options
  const agentOptions: MobileSelectOption[] = useMemo(() =>
    availableAgents.map((agent) => ({
      value: agent.id,
      label: agent.allowedPortRange ? `${agent.name} [${agent.allowedPortRange}]` : agent.name,
    })), [availableAgents]);

  const exitAgentOptions: MobileSelectOption[] = useMemo(() =>
    availableExitAgents.map((agent) => ({
      value: agent.id,
      label: agent.allowedPortRange ? `${agent.name} [${agent.allowedPortRange}]` : agent.name,
    })), [availableExitAgents]);

  const nodeOptions: MobileSelectOption[] = useMemo(() =>
    availableNodes.map((node) => ({
      value: node.id,
      label: `${node.name} (${node.serverAddress})`,
    })), [availableNodes]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = '规则名称不能为空';
    }

    // External type has different validation
    if (rule?.ruleType === 'external') {
      if (formData.serverAddress !== undefined && !formData.serverAddress.trim()) {
        newErrors.serverAddress = '服务器地址不能为空';
      }
      if (formData.listenPort && (formData.listenPort < 1 || formData.listenPort > 65535)) {
        newErrors.listenPort = '监听端口必须在1-65535之间';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (formData.listenPort && (formData.listenPort < 1 || formData.listenPort > 65535)) {
      newErrors.listenPort = '监听端口必须在1-65535之间';
    } else if (formData.listenPort && selectedAgent?.allowedPortRange &&
               !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)) {
      newErrors.listenPort = `端口不在允许范围内`;
    }

    // Target validation
    if (rule && ['direct', 'entry', 'chain', 'direct_chain'].includes(rule.ruleType)) {
      if (targetType === 'manual') {
        if (formData.targetAddress !== undefined && !formData.targetAddress.trim()) {
          newErrors.targetAddress = '目标地址不能为空';
        }
        if (formData.targetPort !== undefined &&
            (formData.targetPort < 1 || formData.targetPort > 65535)) {
          newErrors.targetPort = '目标端口必须在1-65535之间';
        }
      } else if (targetType === 'node' && !formData.targetNodeId) {
        newErrors.targetNodeId = '请选择目标节点';
      }
    }

    // Port config validation for direct_chain
    if (rule?.ruleType === 'direct_chain') {
      const chainIds = formData.chainAgentIds || [];
      const missingPorts = chainIds.filter((id) => {
        const port = formData.chainPortConfig?.[id];
        return !port || port < 1 || port > 65535;
      });
      if (missingPorts.length > 0) {
        newErrors.chainPortConfig = '请为每个节点配置有效端口';
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

      // External type has different fields
      if (rule.ruleType === 'external') {
        if (formData.listenPort !== rule.listenPort)
          updates.listenPort = formData.listenPort;
        if (formData.serverAddress !== rule.serverAddress)
          (updates as Record<string, unknown>).serverAddress = formData.serverAddress;
        if (formData.externalSource !== rule.externalSource)
          (updates as Record<string, unknown>).externalSource = formData.externalSource;
        if (formData.externalRuleId !== rule.externalRuleId)
          (updates as Record<string, unknown>).externalRuleId = formData.externalRuleId;
        if (formData.sortOrder !== rule.sortOrder && formData.sortOrder !== undefined)
          updates.sortOrder = formData.sortOrder;
        // Handle resource groups
        const currentGroups = formData.groupSids || [];
        const originalGroups = rule.groupSids || [];
        const hasGroupsChange =
          currentGroups.length !== originalGroups.length ||
          currentGroups.some((sid) => !originalGroups.includes(sid)) ||
          originalGroups.some((sid) => !currentGroups.includes(sid));
        if (hasGroupsChange) {
          updates.groupSids = currentGroups;
        }
        // Submit update if there are any changes
        if (Object.keys(updates).length > 0) {
          await onSubmit(rule.id, updates);
        }
        return;
      }

      if (formData.protocol !== rule.protocol) updates.protocol = formData.protocol;
      if (formData.listenPort !== rule.listenPort) updates.listenPort = formData.listenPort;
      if (formData.ipVersion !== rule.ipVersion) updates.ipVersion = formData.ipVersion;
      if (formData.bindIp !== rule.bindIp) updates.bindIp = formData.bindIp;
      if (formData.agentId !== rule.agentId) updates.agentId = formData.agentId;

      // Entry type: exit agent
      if (rule.ruleType === 'entry' && formData.exitAgentId !== rule.exitAgentId) {
        updates.exitAgentId = formData.exitAgentId;
      }

      // Tunnel type
      if ((rule.ruleType === 'entry' || rule.ruleType === 'chain') &&
          formData.tunnelType !== rule.tunnelType) {
        updates.tunnelType = formData.tunnelType;
      }

      // Tunnel hops
      if (rule.ruleType === 'chain' && formData.tunnelHops !== rule.tunnelHops) {
        updates.tunnelHops = formData.tunnelHops;
      }

      // Chain agents
      if (rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') {
        const currentIds = formData.chainAgentIds || [];
        const originalIds = rule.chainAgentIds || [];
        const hasChainChange = currentIds.length !== originalIds.length ||
          currentIds.some((id, index) => id !== originalIds[index]);
        if (hasChainChange) updates.chainAgentIds = currentIds;

        // Port config
        if (rule.ruleType === 'direct_chain' ||
            (rule.ruleType === 'chain' && formData.tunnelHops !== undefined && formData.tunnelHops >= 0)) {
          const currentPortConfig = formData.chainPortConfig || {};
          const originalPortConfig = rule.chainPortConfig || {};
          const hasPortConfigChange =
            Object.keys(currentPortConfig).length !== Object.keys(originalPortConfig).length ||
            Object.entries(currentPortConfig).some(([id, port]) => originalPortConfig[id] !== port);
          if (hasPortConfigChange) updates.chainPortConfig = currentPortConfig;
        }
      }

      // Target configuration
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

      // Traffic multiplier and sort order
      if (formData.trafficMultiplier !== rule.trafficMultiplier) {
        updates.trafficMultiplier = formData.trafficMultiplier;
      }
      if (formData.sortOrder !== rule.sortOrder && formData.sortOrder !== undefined) {
        updates.sortOrder = formData.sortOrder;
      }

      // Resource groups
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

  return (
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <ArrowLeftRight className="size-5 text-primary" />
            </div>
            <div>
              <span className="text-lg">编辑规则</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {rule.name}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Basic Info (Read-only) */}
          <MobileSection
            title="基本信息"
            icon={Info}
            badge="只读"
            isOpen={openSections.has('basic')}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-3">
              <div className="space-y-1">
                <Field label="规则ID" />
                <MobileFormInput value={rule.id} disabled className="font-mono bg-muted" />
              </div>

              <div className="space-y-1">
                <Field label="规则类型" />
                <MobileFormInput
                  value={RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-1">
                <Field label="创建时间" />
                <MobileFormInput
                  value={formatDateTime(rule.createdAt)}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </MobileSection>

          {/* Editable Fields */}
          <MobileSection
            title="可编辑信息"
            icon={Settings}
            isOpen={openSections.has('editable')}
            onToggle={() => toggleSection('editable')}
          >
            <div className="space-y-2.5">
              <div className="space-y-1">
                <Field label="规则名称" />
                <MobileFormInput
                  value={formData.name || ''}
                  onChange={(value) => handleChange('name', value)}
                  error={errors.name}
                />
              </div>

              {/* External type: Server Address and Listen Port */}
              {rule.ruleType === 'external' && (
                <>
                  <div className="space-y-1">
                    <Field label="服务器地址" />
                    <MobileFormInput
                      placeholder="例如：example.com 或 192.168.1.1"
                      value={formData.serverAddress || ''}
                      onChange={(value) => handleChange('serverAddress' as keyof UpdateForwardRuleRequest, value)}
                      error={errors.serverAddress}
                    />
                  </div>

                  <div className="space-y-1">
                    <Field label="监听端口" />
                    <MobileFormInput
                      type="number"
                      inputMode="numeric"
                      placeholder="1-65535"
                      value={formData.listenPort ? String(formData.listenPort) : ''}
                      onChange={(value) => handleChange('listenPort', parseInt(value, 10) || 0)}
                      error={errors.listenPort}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Field label="外部来源" hint="可选" />
                    <MobileFormInput
                      placeholder="例如：subscription-provider"
                      value={formData.externalSource || ''}
                      onChange={(value) => handleChange('externalSource' as keyof UpdateForwardRuleRequest, value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Field label="外部规则ID" hint="可选" />
                    <MobileFormInput
                      placeholder="来源系统的规则标识"
                      value={formData.externalRuleId || ''}
                      onChange={(value) => handleChange('externalRuleId' as keyof UpdateForwardRuleRequest, value)}
                    />
                  </div>
                </>
              )}

              {/* Entry Agent - hidden for external type */}
              {rule.ruleType !== 'external' && (
                <div className="space-y-1">
                  <Field label="入口代理" />
                  <MobileSelect
                    value={formData.agentId || ''}
                    onChange={(value) => handleChange('agentId', value)}
                    options={agentOptions}
                  />
                </div>
              )}

              {rule.ruleType !== 'external' && selectedAgent?.allowedPortRange && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <Info className="size-3.5 shrink-0" />
                  <span>端口限制: {selectedAgent.allowedPortRange}</span>
                </div>
              )}

              {needsExitAgent && (
                <div className="space-y-1">
                  <Field label="出口代理" />
                  <MobileSelect
                    value={formData.exitAgentId || ''}
                    onChange={(value) => handleChange('exitAgentId', value)}
                    options={exitAgentOptions}
                  />
                </div>
              )}

              {needsTunnelConfig && (
                <div className="space-y-1">
                  <Field label="隧道类型" />
                  <MobileSelect
                    value={formData.tunnelType || 'ws'}
                    onChange={(value) => handleChange('tunnelType', value as TunnelType)}
                    options={TUNNEL_TYPE_OPTIONS}
                  />
                </div>
              )}

              {rule.ruleType === 'chain' && (
                <div className="space-y-1">
                  <Field label="隧道跳数" hint="留空表示全程隧道" />
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    placeholder="留空表示全程隧道"
                    value={formData.tunnelHops !== undefined ? String(formData.tunnelHops) : ''}
                    onChange={(value) => handleChange('tunnelHops', value ? parseInt(value, 10) : undefined)}
                    className="font-mono"
                  />
                </div>
              )}

              {needsChainConfig && (
                <div className="space-y-1">
                  <Field
                    label={rule.ruleType === 'direct_chain' ? '中间节点及端口' : '中间节点'}
                  />
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
                  {errors.chainPortConfig && (
                    <p className="text-xs text-destructive px-1">{errors.chainPortConfig}</p>
                  )}
                </div>
              )}

              {/* Protocol and IP Version - hidden for external type */}
              {rule.ruleType !== 'external' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Field label="协议类型" />
                    <MobileSelect
                      value={formData.protocol || 'tcp'}
                      onChange={(value) => handleChange('protocol', value as ForwardProtocol)}
                      options={PROTOCOL_OPTIONS}
                    />
                  </div>

                  <div className="space-y-1">
                    <Field label="IP 版本" />
                    <MobileSelect
                      value={formData.ipVersion || 'auto'}
                      onChange={(value) => handleChange('ipVersion', value as IPVersion)}
                      options={IP_VERSION_OPTIONS}
                    />
                  </div>
                </div>
              )}

              {/* Listen Port - hidden for external type (already shown above for external) */}
              {rule.ruleType !== 'external' && (
                <div className="space-y-1">
                  <Field label="监听端口" hint="留空自动分配" />
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    placeholder="留空自动分配"
                    value={formData.listenPort ? String(formData.listenPort) : ''}
                    onChange={(value) => handleChange('listenPort', parseInt(value, 10) || 0)}
                    error={errors.listenPort}
                    className="font-mono"
                  />
                </div>
              )}

              {/* Target configuration */}
              {['direct', 'entry', 'chain', 'direct_chain'].includes(rule.ruleType) && (
                <>
                  <Separator />

                  <div className="space-y-1">
                    <Field label="目标类型" />
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
                  </div>

                  {targetType === 'manual' ? (
                    <>
                      <div className="space-y-1">
                        <Field label="目标地址" />
                        <MobileFormInput
                          value={formData.targetAddress || ''}
                          onChange={(value) => handleChange('targetAddress', value)}
                          error={errors.targetAddress}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Field label="目标端口" />
                        <MobileFormInput
                          type="number"
                          inputMode="numeric"
                          value={formData.targetPort ? String(formData.targetPort) : ''}
                          onChange={(value) => handleChange('targetPort', parseInt(value, 10))}
                          error={errors.targetPort}
                          className="font-mono"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <Field label="目标节点" hint="动态解析为节点服务器地址" />
                      <MobileSelect
                        value={formData.targetNodeId || ''}
                        onChange={(value) => handleChange('targetNodeId', value)}
                        options={nodeOptions}
                        placeholder="选择目标节点"
                      />
                      {errors.targetNodeId && (
                        <p className="text-xs text-destructive px-1">{errors.targetNodeId}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Bind IP and Traffic Multiplier - hidden for external type */}
              {rule.ruleType !== 'external' && (
                <>
                  <Separator />

                  <div className="space-y-1">
                    <Field label="绑定 IP" hint="出站连接绑定的本地IP" />
                    <MobileFormInput
                      placeholder="可选"
                      value={formData.bindIp || ''}
                      onChange={(value) => handleChange('bindIp', value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Field label="流量倍率" />
                      <MobileFormInput
                        type="number"
                        inputMode="decimal"
                        placeholder="自动"
                        value={formData.trafficMultiplier !== undefined ? String(formData.trafficMultiplier) : ''}
                        onChange={(value) => handleChange('trafficMultiplier', value ? parseFloat(value) : undefined)}
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Field label="排序" />
                      <MobileFormInput
                        type="number"
                        inputMode="numeric"
                        value={String(formData.sortOrder ?? 0)}
                        onChange={(value) => handleChange('sortOrder', parseInt(value, 10) || 0)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Sort order for external type (shown separately) */}
              {rule.ruleType === 'external' && (
                <div className="space-y-1">
                  <Field label="排序" />
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    value={String(formData.sortOrder ?? 0)}
                    onChange={(value) => handleChange('sortOrder', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Field label="备注" />
                <MobileFormInput
                  placeholder="可选备注"
                  value={formData.remark || ''}
                  onChange={(value) => handleChange('remark', value)}
                />
              </div>
            </div>
          </MobileSection>

          {/* Resource Groups */}
          {availableResourceGroups.length > 0 && (
            <MobileSection
              title="绑定资源组"
              icon={FolderTree}
              badge={formData.groupSids?.length ? `${formData.groupSids.length}个` : null}
              isOpen={openSections.has('groups')}
              onToggle={() => toggleSection('groups')}
            >
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground px-1">
                  选择资源组后，规则将自动添加到订阅内容中
                </p>
                <div className="border rounded-lg overflow-hidden divide-y">
                  {availableResourceGroups.map((group) => {
                    const plan = plansMap[group.planId];
                    const isSelected = formData.groupSids?.includes(group.sid) ?? false;
                    return (
                      <label
                        key={group.sid}
                        className={cn(
                          'flex items-center gap-2 px-3 py-3 cursor-pointer transition-colors min-h-[52px]',
                          isSelected ? 'bg-primary/10' : 'active:bg-muted/50'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleGroupToggle(group.sid)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{group.name}</p>
                          {plan && (
                            <p className="text-xs text-muted-foreground truncate">{plan.name}</p>
                          )}
                        </div>
                        {plan && (
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">
                            {plan.planType === 'node' ? '节点' : '混合'}
                          </Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </MobileSection>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full min-h-[52px] text-base gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                保存中...
              </>
            ) : '保存'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
