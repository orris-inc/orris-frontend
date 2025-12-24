/**
 * Create Forward Rule Dialog Component
 * Supports four rule types: direct, entry, chain (WS chain forwarding), direct_chain (direct chain forwarding)
 * Supports target types: manual address input or node selection (dynamic resolution)
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Separator } from '@/components/common/Separator';
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { SortableChainAgentList } from './SortableChainAgentList';
import type { CreateForwardRuleRequest, ForwardAgent, ForwardRuleType, ForwardProtocol, IPVersion, TunnelType } from '@/api/forward';
import type { Node } from '@/api/node';

// Target type
type TargetType = 'manual' | 'node';

interface CreateForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRuleRequest) => void;
  agents: ForwardAgent[];
  nodes?: Node[];
  /** Initial data for pre-populating the form when copying a rule */
  initialData?: Partial<CreateForwardRuleRequest> & { targetType?: 'manual' | 'node' };
}

// Rule type descriptions
const RULE_TYPE_INFO: Record<ForwardRuleType, { label: string; description: string }> = {
  direct: { label: '直连转发', description: '直接将流量转发到目标地址' },
  entry: { label: '入口节点', description: '作为转发链的入口，通过出口节点转发到目标地址' },
  chain: { label: 'WS链式转发', description: '通过 WebSocket 隧道进行多跳链式转发' },
  direct_chain: { label: '直连链式转发', description: '通过直连 TCP/UDP 进行多跳链式转发' },
};

export const CreateForwardRuleDialog: React.FC<CreateForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  agents,
  nodes = [],
  initialData,
}) => {
  const [formData, setFormData] = useState({
    agentId: '',
    ruleType: 'direct' as ForwardRuleType,
    exitAgentId: '',
    chainAgentIds: [] as string[],
    chainPortConfig: {} as Record<string, number>,
    tunnelType: 'ws' as TunnelType,
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
  });
  const [targetType, setTargetType] = useState<TargetType>('manual');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form or use initial data when dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Copy mode: pre-populate form with initial data
        setFormData({
          agentId: initialData.agentId || '',
          ruleType: initialData.ruleType || 'direct',
          exitAgentId: initialData.exitAgentId || '',
          chainAgentIds: initialData.chainAgentIds || [],
          chainPortConfig: initialData.chainPortConfig || {},
          tunnelType: initialData.tunnelType || 'ws',
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
        });
        // Set target type based on initial data
        setTargetType(initialData.targetType || (initialData.targetNodeId ? 'node' : 'manual'));
      } else {
        // Create mode: reset to default values
        setFormData({
          agentId: '',
          ruleType: 'direct',
          exitAgentId: '',
          chainAgentIds: [],
          chainPortConfig: {},
          tunnelType: 'ws',
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
        });
        setTargetType('manual');
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleClose = () => {
    onClose();
  };

  const handleChange = (field: string, value: string | number | string[] | undefined) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // If modifying entry agent, automatically remove it from chain node list
      if (field === 'agentId' && typeof value === 'string') {
        const currentChainIds = prev.chainAgentIds || [];
        if (currentChainIds.includes(value)) {
          newData.chainAgentIds = currentChainIds.filter((id: string) => id !== value);
          // Also remove port configuration for this node
          if (prev.chainPortConfig[value]) {
            const newPortConfig = { ...prev.chainPortConfig };
            delete newPortConfig[value];
            newData.chainPortConfig = newPortConfig;
          }
        }
      }

      return newData;
    });

    // Clear all validation errors, re-validate on next submit
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  // Handle chain node port configuration change
  const handleChainPortChange = (agentId: string, port: number) => {
    setFormData((prev) => ({
      ...prev,
      chainPortConfig: {
        ...prev.chainPortConfig,
        [agentId]: port,
      },
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.agentId) {
      newErrors.agentId = '请选择转发节点';
    }

    if (!formData.name.trim()) {
      newErrors.name = '规则名称不能为空';
    }

    if (!formData.protocol) {
      newErrors.protocol = '协议类型不能为空';
    }

    // Validate different fields based on rule type
    if (formData.ruleType === 'direct') {
      if (!formData.listenPort || formData.listenPort < 1 || formData.listenPort > 65535) {
        newErrors.listenPort = '监听端口必须在1-65535之间';
      }
      // Target validation: manual input or node selection
      if (targetType === 'manual') {
        if (!formData.targetAddress.trim()) {
          newErrors.targetAddress = '目标地址不能为空';
        }
        if (!formData.targetPort || formData.targetPort < 1 || formData.targetPort > 65535) {
          newErrors.targetPort = '目标端口必须在1-65535之间';
        }
      } else if (targetType === 'node') {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = '请选择目标节点';
        }
      }
    } else if (formData.ruleType === 'entry') {
      if (!formData.listenPort || formData.listenPort < 1 || formData.listenPort > 65535) {
        newErrors.listenPort = '监听端口必须在1-65535之间';
      }
      if (!formData.exitAgentId) {
        newErrors.exitAgentId = '请选择出口节点';
      }
      // entry type also needs target validation
      if (targetType === 'manual') {
        if (!formData.targetAddress.trim()) {
          newErrors.targetAddress = '目标地址不能为空';
        }
        if (!formData.targetPort || formData.targetPort < 1 || formData.targetPort > 65535) {
          newErrors.targetPort = '目标端口必须在1-65535之间';
        }
      } else if (targetType === 'node') {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = '请选择目标节点';
        }
      }
    } else if (formData.ruleType === 'chain') {
      if (!formData.listenPort || formData.listenPort < 1 || formData.listenPort > 65535) {
        newErrors.listenPort = '监听端口必须在1-65535之间';
      }
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) {
        newErrors.chainAgentIds = '请至少选择一个中间节点';
      }
      // chain type also needs target validation
      if (targetType === 'manual') {
        if (!formData.targetAddress.trim()) {
          newErrors.targetAddress = '目标地址不能为空';
        }
        if (!formData.targetPort || formData.targetPort < 1 || formData.targetPort > 65535) {
          newErrors.targetPort = '目标端口必须在1-65535之间';
        }
      } else if (targetType === 'node') {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = '请选择目标节点';
        }
      }
    } else if (formData.ruleType === 'direct_chain') {
      if (!formData.listenPort || formData.listenPort < 1 || formData.listenPort > 65535) {
        newErrors.listenPort = '监听端口必须在1-65535之间';
      }
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) {
        newErrors.chainAgentIds = '请至少选择一个中间节点';
      }
      // Validate that each chain node has a port configured
      const missingPorts: string[] = [];
      for (const agentId of formData.chainAgentIds) {
        const port = formData.chainPortConfig[agentId];
        if (!port || port < 1 || port > 65535) {
          const agent = agents.find((a) => a.id === agentId);
          const agentName = agent ? agent.name : agentId;
          missingPorts.push(agentName);
        }
      }
      if (missingPorts.length > 0) {
        if (missingPorts.length === formData.chainAgentIds.length) {
          newErrors.chainPortConfig = '请为每个节点配置有效的监听端口（1-65535）';
        } else {
          newErrors.chainPortConfig = `请为以下节点配置有效端口：${missingPorts.join('、')}`;
        }
      }
      // direct_chain type also needs target validation
      if (targetType === 'manual') {
        if (!formData.targetAddress.trim()) {
          newErrors.targetAddress = '目标地址不能为空';
        }
        if (!formData.targetPort || formData.targetPort < 1 || formData.targetPort > 65535) {
          newErrors.targetPort = '目标端口必须在1-65535之间';
        }
      } else if (targetType === 'node') {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = '请选择目标节点';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const submitData: CreateForwardRuleRequest = {
        agentId: formData.agentId,
        ruleType: formData.ruleType,
        name: formData.name.trim(),
        protocol: formData.protocol,
        ipVersion: formData.ipVersion,
      };

      // Add corresponding fields based on rule type
      if (formData.ruleType === 'direct') {
        submitData.listenPort = formData.listenPort;
        // Target: manual input or node selection
        if (targetType === 'manual') {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      } else if (formData.ruleType === 'entry') {
        submitData.listenPort = formData.listenPort;
        submitData.exitAgentId = formData.exitAgentId;
        submitData.tunnelType = formData.tunnelType;
        // entry type also needs target configuration
        if (targetType === 'manual') {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      } else if (formData.ruleType === 'chain') {
        submitData.listenPort = formData.listenPort;
        submitData.chainAgentIds = formData.chainAgentIds;
        submitData.tunnelType = formData.tunnelType;
        // chain type also needs target configuration
        if (targetType === 'manual') {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      } else if (formData.ruleType === 'direct_chain') {
        submitData.listenPort = formData.listenPort;
        submitData.chainAgentIds = formData.chainAgentIds;
        submitData.chainPortConfig = formData.chainPortConfig;
        // direct_chain type also needs target configuration
        if (targetType === 'manual') {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      }

      if (formData.bindIp?.trim()) {
        submitData.bindIp = formData.bindIp.trim();
      }

      if (formData.trafficMultiplier !== undefined && formData.trafficMultiplier !== null && formData.trafficMultiplier > 0) {
        submitData.trafficMultiplier = formData.trafficMultiplier;
      }

      if (formData.sortOrder !== undefined && formData.sortOrder !== null && formData.sortOrder >= 0) {
        submitData.sortOrder = formData.sortOrder;
      }

      if (formData.remark?.trim()) {
        submitData.remark = formData.remark.trim();
      }

      onSubmit(submitData);
      handleClose();
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    if (!formData.agentId || !formData.name.trim() || !formData.protocol) return false;

    if (formData.ruleType === 'direct') {
      if (formData.listenPort <= 0) return false;
      if (targetType === 'manual') {
        return formData.targetAddress.trim() !== '' && formData.targetPort > 0;
      } else {
        return !!formData.targetNodeId;
      }
    } else if (formData.ruleType === 'entry') {
      if (formData.listenPort <= 0 || formData.exitAgentId === '') return false;
      // entry type also requires target validation
      if (targetType === 'manual') {
        return formData.targetAddress.trim() !== '' && formData.targetPort > 0;
      } else {
        return !!formData.targetNodeId;
      }
    } else if (formData.ruleType === 'chain') {
      if (formData.listenPort <= 0 || formData.chainAgentIds.length === 0) return false;
      // chain type also needs to validate target
      if (targetType === 'manual') {
        return formData.targetAddress.trim() !== '' && formData.targetPort > 0;
      } else {
        return !!formData.targetNodeId;
      }
    } else if (formData.ruleType === 'direct_chain') {
      if (formData.listenPort <= 0) return false;
      if (formData.chainAgentIds.length === 0) return false;
      // Validate that each chain node has a valid port configured
      const allPortsValid = formData.chainAgentIds.every((id) => {
        const port = formData.chainPortConfig[id];
        return port && port > 0 && port <= 65535;
      });
      if (!allPortsValid) return false;
      // direct_chain type also needs to validate target
      if (targetType === 'manual') {
        return formData.targetAddress.trim() !== '' && formData.targetPort > 0;
      } else {
        return !!formData.targetNodeId;
      }
    }
    return false;
  };

  // Get available node list (status is active, but always include currently selected node for copy mode)
  const availableNodes = nodes.filter((n) => n.status === 'active' || n.id === formData.targetNodeId);

  // Get available agents (status is enabled, but always include currently selected agents for copy mode)
  const availableAgentsForSelect = agents.filter((a) =>
    a.status === 'enabled' ||
    a.id === formData.agentId ||
    a.id === formData.exitAgentId ||
    formData.chainAgentIds.includes(a.id)
  );

  // Get available exit agents (exclude currently selected node)
  const availableExitAgents = availableAgentsForSelect.filter((a) => a.id !== formData.agentId);

  // Get available chain agents (exclude currently selected entry node)
  const availableChainAgents = availableAgentsForSelect.filter((a) => a.id !== formData.agentId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[650px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{initialData ? '复制转发规则' : '新增转发规则'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Forward Agent */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="agentId">
                  转发节点 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.agentId}
                  onValueChange={(value) => handleChange('agentId', value)}
                >
                  <SelectTrigger id="agentId" className={errors.agentId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="选择转发节点" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgentsForSelect.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.agentId && <p className="text-xs text-destructive">{errors.agentId}</p>}
              </div>

              {/* Rule Type */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="ruleType">
                  规则类型 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.ruleType}
                  onValueChange={(value) => handleChange('ruleType', value as ForwardRuleType)}
                >
                  <SelectTrigger id="ruleType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RULE_TYPE_INFO).map(([type, info]) => (
                      <SelectItem key={type} value={type}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {RULE_TYPE_INFO[formData.ruleType].description}
                </p>
              </div>

              {/* Rule Name */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="name">
                  规则名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={!!errors.name}
                  placeholder="例如：Web服务转发"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Protocol Type */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="protocol">
                  协议类型 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.protocol}
                  onValueChange={(value) => handleChange('protocol', value as ForwardProtocol)}
                >
                  <SelectTrigger id="protocol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="both">TCP/UDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* IP Version */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="ipVersion">IP 版本</Label>
                <Select
                  value={formData.ipVersion}
                  onValueChange={(value) => handleChange('ipVersion', value as IPVersion)}
                >
                  <SelectTrigger id="ipVersion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动</SelectItem>
                    <SelectItem value="ipv4">IPv4</SelectItem>
                    <SelectItem value="ipv6">IPv6</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">目标地址解析时优先使用的 IP 版本</p>
              </div>
            </div>
          </div>

          {/* Forwarding Configuration - Show different fields based on rule type */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">转发配置</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* direct, entry, chain and direct_chain types: Listen Port */}
              {(formData.ruleType === 'direct' || formData.ruleType === 'entry' || formData.ruleType === 'chain' || formData.ruleType === 'direct_chain') && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="listenPort">
                    监听端口 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="listenPort"
                    type="number"
                    min={1}
                    max={65535}
                    value={formData.listenPort || ''}
                    onChange={(e) => handleChange('listenPort', parseInt(e.target.value, 10) || 0)}
                    error={!!errors.listenPort}
                    placeholder="1-65535"
                  />
                  {errors.listenPort && <p className="text-xs text-destructive">{errors.listenPort}</p>}
                </div>
              )}

              {/* entry type: Exit Agent */}
              {formData.ruleType === 'entry' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="exitAgentId">
                    出口节点 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.exitAgentId}
                    onValueChange={(value) => handleChange('exitAgentId', value)}
                  >
                    <SelectTrigger id="exitAgentId" className={errors.exitAgentId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="选择出口节点" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExitAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.exitAgentId && <p className="text-xs text-destructive">{errors.exitAgentId}</p>}
                </div>
              )}

              {/* Tunnel Type - entry and chain types */}
              {(formData.ruleType === 'entry' || formData.ruleType === 'chain') && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tunnelType">隧道类型</Label>
                  <Select
                    value={formData.tunnelType}
                    onValueChange={(value) => handleChange('tunnelType', value as TunnelType)}
                  >
                    <SelectTrigger id="tunnelType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ws">WebSocket</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.tunnelType === 'ws' ? '通过 WebSocket 建立隧道连接' : '通过 TLS 建立隧道连接'}
                  </p>
                </div>
              )}

              {/* chain type: Intermediate Nodes List */}
              {formData.ruleType === 'chain' && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label>
                    中间节点 <span className="text-destructive">*</span>
                  </Label>
                  <SortableChainAgentList
                    agents={availableChainAgents}
                    selectedIds={formData.chainAgentIds}
                    onSelectionChange={(ids) => handleChange('chainAgentIds', ids)}
                    hasError={!!errors.chainAgentIds}
                    idPrefix="chain-agent"
                  />
                  {errors.chainAgentIds && <p className="text-xs text-destructive">{errors.chainAgentIds}</p>}
                </div>
              )}

              {/* direct_chain type: Intermediate Nodes List (with port configuration) */}
              {formData.ruleType === 'direct_chain' && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label>
                    中间节点及端口 <span className="text-destructive">*</span>
                  </Label>
                  <SortableChainAgentList
                    agents={availableChainAgents}
                    selectedIds={formData.chainAgentIds}
                    onSelectionChange={(ids) => {
                      // Synchronously update chainPortConfig, remove deselected nodes
                      const newPortConfig = { ...formData.chainPortConfig };
                      Object.keys(newPortConfig).forEach((id) => {
                        if (!ids.includes(id)) {
                          delete newPortConfig[id];
                        }
                      });
                      setFormData((prev) => ({
                        ...prev,
                        chainAgentIds: ids,
                        chainPortConfig: newPortConfig,
                      }));
                    }}
                    showPortConfig
                    portConfig={formData.chainPortConfig}
                    onPortConfigChange={handleChainPortChange}
                    hasError={!!errors.chainAgentIds || !!errors.chainPortConfig}
                    idPrefix="direct-chain-agent"
                  />
                  {errors.chainAgentIds && <p className="text-xs text-destructive">{errors.chainAgentIds}</p>}
                  {errors.chainPortConfig && <p className="text-xs text-destructive">{errors.chainPortConfig}</p>}
                </div>
              )}

              {/* direct, entry, chain and direct_chain types: Target Configuration */}
              {(formData.ruleType === 'direct' || formData.ruleType === 'entry' || formData.ruleType === 'chain' || formData.ruleType === 'direct_chain') && (
                <>
                  {/* Target Type Selection */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>目标类型 <span className="text-destructive">*</span></Label>
                    <RadioGroup
                      value={targetType}
                      onValueChange={(value) => {
                        setTargetType(value as TargetType);
                        // Clear related fields when switching
                        if (value === 'manual') {
                          handleChange('targetNodeId', '');
                        } else {
                          handleChange('targetAddress', '');
                          handleChange('targetPort', 0);
                        }
                      }}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="target-manual" />
                        <Label htmlFor="target-manual" className="font-normal cursor-pointer">
                          手动输入地址
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="node" id="target-node" />
                        <Label htmlFor="target-node" className="font-normal cursor-pointer">
                          选择节点（动态解析）
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Manual Target Address Input */}
                  {targetType === 'manual' && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="targetAddress">
                          目标地址 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="targetAddress"
                          placeholder="例如：192.168.1.100 或 example.com"
                          value={formData.targetAddress}
                          onChange={(e) => handleChange('targetAddress', e.target.value)}
                          error={!!errors.targetAddress}
                        />
                        {errors.targetAddress && <p className="text-xs text-destructive">{errors.targetAddress}</p>}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="targetPort">
                          目标端口 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="targetPort"
                          type="number"
                          min={1}
                          max={65535}
                          value={formData.targetPort || ''}
                          onChange={(e) => handleChange('targetPort', parseInt(e.target.value, 10) || 0)}
                          error={!!errors.targetPort}
                          placeholder="1-65535"
                        />
                        {errors.targetPort && <p className="text-xs text-destructive">{errors.targetPort}</p>}
                      </div>
                    </>
                  )}

                  {/* Select Target Node */}
                  {targetType === 'node' && (
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label htmlFor="targetNodeId">
                        目标节点 <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.targetNodeId}
                        onValueChange={(value) => handleChange('targetNodeId', value)}
                      >
                        <SelectTrigger id="targetNodeId" className={errors.targetNodeId ? 'border-destructive' : ''}>
                          <SelectValue placeholder="选择目标节点" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableNodes.map((node) => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.name} ({node.serverAddress})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        选择节点后，目标地址将动态解析为节点的服务器地址
                      </p>
                      {errors.targetNodeId && <p className="text-xs text-destructive">{errors.targetNodeId}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">高级选项</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bindIp">绑定 IP</Label>
                <Input
                  id="bindIp"
                  value={formData.bindIp}
                  onChange={(e) => handleChange('bindIp', e.target.value)}
                  placeholder="可选：出站连接绑定的本地 IP"
                />
                <p className="text-xs text-muted-foreground">指定出站连接使用的本地 IP 地址</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="trafficMultiplier">流量倍率（可选）</Label>
                <Input
                  id="trafficMultiplier"
                  type="number"
                  min={0}
                  max={1000000}
                  step={0.01}
                  value={formData.trafficMultiplier ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                    handleChange('trafficMultiplier', value);
                  }}
                  placeholder="留空则自动计算"
                />
                <p className="text-xs text-muted-foreground">
                  自定义流量倍率会影响流量统计，留空则根据节点数量自动计算
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="sortOrder">排序顺序（可选）</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  value={formData.sortOrder ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    handleChange('sortOrder', value);
                  }}
                  placeholder="留空则默认为 0"
                />
                <p className="text-xs text-muted-foreground">
                  值越小排序越靠前，默认为 0
                </p>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="remark">备注</Label>
                <Textarea
                  id="remark"
                  rows={4}
                  value={formData.remark}
                  onChange={(e) => handleChange('remark', e.target.value)}
                  placeholder="可选：添加备注说明"
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-6 gap-3">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
