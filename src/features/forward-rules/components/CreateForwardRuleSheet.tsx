/**
 * Create Forward Rule Sheet Component
 * Mobile-optimized bottom sheet for creating forward rules
 */

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  Network,
  Settings,
  ChevronDown,
  Check,
  Loader2,
  FolderTree,
  Link2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/common/Sheet';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { Checkbox } from '@/components/common/Checkbox';
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

type TargetType = 'manual' | 'node';

interface CreateForwardRuleSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRuleRequest) => void;
  agents: ForwardAgent[];
  nodes?: Node[];
  initialData?: Partial<CreateForwardRuleRequest> & { targetType?: 'manual' | 'node' };
  resourceGroups?: ResourceGroup[];
  plansMap?: Record<string, SubscriptionPlan>;
}

// Rule type options
const RULE_TYPE_OPTIONS: MobileSelectOption[] = [
  { value: 'direct', label: '直连转发' },
  { value: 'entry', label: '入口节点' },
  { value: 'chain', label: '隧道链式转发' },
  { value: 'direct_chain', label: '直连链式转发' },
];

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
  required?: boolean;
  badge?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const MobileSection: React.FC<MobileSectionProps> = ({
  title,
  icon: Icon,
  required,
  badge,
  isOpen,
  onToggle,
  children,
}) => (
  <div className={cn(
    'border rounded-lg overflow-hidden',
    isOpen ? 'border-primary/30' : 'border-border'
  )}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2.5 text-left active:bg-accent/30"
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('size-4', isOpen ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.5} />
        <span className="text-sm font-medium">{title}</span>
        {required && <span className="text-[10px] text-primary">*</span>}
        {badge && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
            {badge}
          </Badge>
        )}
      </div>
      <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
    </button>
    {isOpen && (
      <div className="px-3 pb-3 pt-1 border-t border-border">
        {children}
      </div>
    )}
  </div>
);

// Compact Form Label
const Field: React.FC<{ label: string; required?: boolean; hint?: string }> = ({ label, required, hint }) => (
  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
    {label}{required && <span className="text-destructive">*</span>}
    {hint && <span className="text-muted-foreground/70">({hint})</span>}
  </label>
);

export const CreateForwardRuleSheet: React.FC<CreateForwardRuleSheetProps> = ({
  open,
  onClose,
  onSubmit,
  agents,
  nodes = [],
  initialData,
  resourceGroups = [],
  plansMap = {},
}) => {
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic', 'forward']));
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens
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
      }
      setErrors({});
      setOpenSections(new Set(['basic', 'forward']));
    }
  }, [open, initialData]);

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleChange = (field: string, value: string | number | string[] | undefined) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // If modifying entry agent, remove it from chain list
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
      formData.chainAgentIds.includes(a.id)
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

  // Get selected agent
  const selectedAgent = useMemo(() =>
    agents.find((a) => a.id === formData.agentId),
    [agents, formData.agentId]);

  // Agent options for select
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

    if (!formData.agentId) newErrors.agentId = '请选择转发节点';
    if (!formData.name.trim()) newErrors.name = '规则名称不能为空';
    if (!formData.protocol) newErrors.protocol = '协议类型不能为空';

    // Listen port validation
    if (formData.listenPort && (formData.listenPort < 1 || formData.listenPort > 65535)) {
      newErrors.listenPort = '监听端口必须在1-65535之间';
    } else if (formData.listenPort && selectedAgent?.allowedPortRange &&
               !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)) {
      newErrors.listenPort = `端口不在允许范围 [${selectedAgent.allowedPortRange}] 内`;
    }

    // Target validation for all rule types
    if (targetType === 'manual') {
      if (!formData.targetAddress.trim()) newErrors.targetAddress = '目标地址不能为空';
      if (!formData.targetPort || formData.targetPort < 1 || formData.targetPort > 65535) {
        newErrors.targetPort = '目标端口必须在1-65535之间';
      }
    } else if (targetType === 'node') {
      if (!formData.targetNodeId) newErrors.targetNodeId = '请选择目标节点';
    }

    // Rule type specific validation
    if (formData.ruleType === 'entry' && !formData.exitAgentId) {
      newErrors.exitAgentId = '请选择出口节点';
    }

    if ((formData.ruleType === 'chain' || formData.ruleType === 'direct_chain') &&
        formData.chainAgentIds.length === 0) {
      newErrors.chainAgentIds = '请至少选择一个中间节点';
    }

    // Port config validation for direct_chain
    if (formData.ruleType === 'direct_chain') {
      const missingPorts = formData.chainAgentIds.filter((id) => {
        const port = formData.chainPortConfig[id];
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

      // Listen port
      if (formData.listenPort) submitData.listenPort = formData.listenPort;

      // Rule type specific fields
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

      // Target configuration
      if (targetType === 'manual') {
        submitData.targetAddress = formData.targetAddress.trim();
        submitData.targetPort = formData.targetPort;
      } else {
        submitData.targetNodeId = formData.targetNodeId;
      }

      // Optional fields
      if (formData.bindIp?.trim()) submitData.bindIp = formData.bindIp.trim();
      if (formData.trafficMultiplier !== undefined && formData.trafficMultiplier > 0) {
        submitData.trafficMultiplier = formData.trafficMultiplier;
      }
      if (formData.sortOrder !== undefined && formData.sortOrder >= 0) {
        submitData.sortOrder = formData.sortOrder;
      }
      if (formData.remark?.trim()) submitData.remark = formData.remark.trim();
      if (formData.groupSids.length > 0) submitData.groupSids = formData.groupSids;

      onSubmit(submitData);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.agentId && formData.name.trim() && formData.protocol &&
    (targetType === 'manual'
      ? (formData.targetAddress.trim() && formData.targetPort > 0)
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
          <SheetTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-5 text-primary" />
            <span>{initialData ? '复制规则' : '新增规则'}</span>
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="py-3 space-y-2">
          {/* Basic Info Section */}
          <MobileSection
            title="基本信息"
            icon={ArrowLeftRight}
            required
            isOpen={openSections.has('basic')}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-2.5">
              <div className="space-y-1">
                <Field label="转发节点" required />
                <MobileSelect
                  value={formData.agentId}
                  onChange={(value) => handleChange('agentId', value)}
                  options={agentOptions}
                  placeholder="选择转发节点"
                />
                {errors.agentId && (
                  <p className="text-xs text-destructive px-1">{errors.agentId}</p>
                )}
              </div>

              {selectedAgent?.allowedPortRange && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  端口限制: {selectedAgent.allowedPortRange}
                </p>
              )}

              <div className="space-y-1">
                <Field label="规则类型" required />
                <MobileSelect
                  value={formData.ruleType}
                  onChange={(value) => handleChange('ruleType', value)}
                  options={RULE_TYPE_OPTIONS}
                />
              </div>

              <div className="space-y-1">
                <Field label="规则名称" required />
                <MobileFormInput
                  placeholder="例如：Web服务转发"
                  value={formData.name}
                  onChange={(value) => handleChange('name', value)}
                  error={errors.name}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Field label="协议类型" required />
                  <MobileSelect
                    value={formData.protocol}
                    onChange={(value) => handleChange('protocol', value)}
                    options={PROTOCOL_OPTIONS}
                  />
                </div>

                <div className="space-y-1">
                  <Field label="IP 版本" />
                  <MobileSelect
                    value={formData.ipVersion}
                    onChange={(value) => handleChange('ipVersion', value)}
                    options={IP_VERSION_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </MobileSection>

          {/* Forward Config Section */}
          <MobileSection
            title="转发配置"
            icon={Network}
            required
            isOpen={openSections.has('forward')}
            onToggle={() => toggleSection('forward')}
          >
            <div className="space-y-2.5">
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

              {/* Entry type: Exit Agent */}
              {needsExitAgent && (
                <div className="space-y-1">
                  <Field label="出口节点" required />
                  <MobileSelect
                    value={formData.exitAgentId}
                    onChange={(value) => handleChange('exitAgentId', value)}
                    options={exitAgentOptions}
                    placeholder="选择出口节点"
                  />
                  {errors.exitAgentId && (
                    <p className="text-xs text-destructive px-1">{errors.exitAgentId}</p>
                  )}
                </div>
              )}

              {/* Tunnel type for entry and chain */}
              {needsTunnelConfig && (
                <div className="space-y-1">
                  <Field label="隧道类型" />
                  <MobileSelect
                    value={formData.tunnelType}
                    onChange={(value) => handleChange('tunnelType', value)}
                    options={TUNNEL_TYPE_OPTIONS}
                  />
                </div>
              )}

              {/* Chain type: Tunnel hops */}
              {formData.ruleType === 'chain' && (
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

              {/* Chain nodes */}
              {needsChainConfig && (
                <div className="space-y-1">
                  <Field
                    label={formData.ruleType === 'direct_chain' ? '中间节点及端口' : '中间节点'}
                    required
                  />
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
                  {errors.chainAgentIds && (
                    <p className="text-xs text-destructive px-1">{errors.chainAgentIds}</p>
                  )}
                  {errors.chainPortConfig && (
                    <p className="text-xs text-destructive px-1">{errors.chainPortConfig}</p>
                  )}
                </div>
              )}

              <Separator />

              {/* Target Type */}
              <div className="space-y-1">
                <Field label="目标类型" required />
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5 col-span-2">
                    <Field label="目标地址" required />
                    <MobileFormInput
                      placeholder="IP或域名"
                      value={formData.targetAddress}
                      onChange={(value) => handleChange('targetAddress', value)}
                      error={errors.targetAddress}
                      icon={<Link2 className="size-5" />}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Field label="目标端口" required />
                    <MobileFormInput
                      type="number"
                      inputMode="numeric"
                      placeholder="1-65535"
                      value={formData.targetPort ? String(formData.targetPort) : ''}
                      onChange={(value) => handleChange('targetPort', parseInt(value, 10) || 0)}
                      error={errors.targetPort}
                      className="font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Field label="目标节点" required hint="地址将动态解析为节点服务器地址" />
                  <MobileSelect
                    value={formData.targetNodeId}
                    onChange={(value) => handleChange('targetNodeId', value)}
                    options={nodeOptions}
                    placeholder="选择目标节点"
                  />
                  {errors.targetNodeId && (
                    <p className="text-xs text-destructive px-1">{errors.targetNodeId}</p>
                  )}
                </div>
              )}
            </div>
          </MobileSection>

          {/* Advanced Section */}
          <MobileSection
            title="高级选项"
            icon={Settings}
            badge={formData.bindIp || formData.remark ? '已配置' : null}
            isOpen={openSections.has('advanced')}
            onToggle={() => toggleSection('advanced')}
          >
            <div className="space-y-2.5">
              <div className="space-y-1">
                <Field label="绑定 IP" hint="出站连接绑定的本地IP" />
                <MobileFormInput
                  placeholder="可选"
                  value={formData.bindIp}
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
                    placeholder="0"
                    value={formData.sortOrder !== undefined ? String(formData.sortOrder) : ''}
                    onChange={(value) => handleChange('sortOrder', value ? parseInt(value, 10) : undefined)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Field label="备注" />
                <MobileFormInput
                  placeholder="可选备注"
                  value={formData.remark}
                  onChange={(value) => handleChange('remark', value)}
                />
              </div>
            </div>
          </MobileSection>

          {/* Resource Groups Section */}
          {availableResourceGroups.length > 0 && (
            <MobileSection
              title="资源组"
              icon={FolderTree}
              badge={formData.groupSids.length > 0 ? `${formData.groupSids.length}` : null}
              isOpen={openSections.has('groups')}
              onToggle={() => toggleSection('groups')}
            >
              <div className="divide-y border rounded overflow-hidden">
                {availableResourceGroups.map((group) => {
                  const isSelected = formData.groupSids.includes(group.sid);
                  return (
                    <label key={group.sid} className={cn('flex items-center gap-2 px-2 py-2 cursor-pointer min-h-[40px]', isSelected && 'bg-primary/10')}>
                      <Checkbox checked={isSelected} onCheckedChange={() => handleGroupToggle(group.sid)} />
                      <span className="text-sm truncate flex-1">{group.name}</span>
                    </label>
                  );
                })}
              </div>
            </MobileSection>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="w-full h-11 gap-2"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {loading ? '创建中...' : (initialData ? '创建副本' : '创建')}
          </Button>
          <Button variant="ghost" onClick={handleClose} disabled={loading} className="w-full h-10">
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
