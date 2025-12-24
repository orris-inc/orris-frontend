/**
 * User-side create forward rule dialog
 * Supports four rule types: direct, entry, chain (WS chained forwarding), direct_chain (direct chained forwarding)
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
import { Badge } from '@/components/common/Badge';
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { AlertCircle, Server, HardDrive } from 'lucide-react';
import type {
  CreateForwardRuleRequest,
  ForwardProtocol,
  ForwardRuleType,
  IPVersion,
} from '@/api/forward';
import { useUserForwardAgents } from '../hooks/useUserForwardAgents';
import { useUserNodes } from '@/features/user-nodes/hooks/useUserNodes';
import { UserSortableChainAgentList } from './UserSortableChainAgentList';

// Target type for forward rule
type TargetType = 'manual' | 'node';

interface CreateUserForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRuleRequest) => void;
  allowedTypes: string[];
  isCreating?: boolean;
}

// Rule type descriptions
const RULE_TYPE_INFO: Record<ForwardRuleType, { label: string; description: string }> = {
  direct: { label: '直连转发', description: '直接将流量转发到目标地址' },
  entry: { label: '入口节点', description: '作为转发链的入口，通过出口节点转发到目标地址' },
  chain: { label: '隧道链式转发', description: '通过隧道（WS/TLS）进行多跳链式转发' },
  direct_chain: { label: '直连链式转发', description: '通过直连 TCP/UDP 进行多跳链式转发' },
};

export const CreateUserForwardRuleDialog: React.FC<CreateUserForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  allowedTypes,
  isCreating = false,
}) => {
  const { forwardAgents, isLoading: isLoadingAgents } = useUserForwardAgents({
    pageSize: 100,
    enabled: open,
  });

  // Fetch user's nodes for target node selection
  const { nodes: userNodes, isLoading: isLoadingNodes } = useUserNodes({
    pageSize: 100,
    enabled: open,
  });

  const [formData, setFormData] = useState({
    ruleType: 'direct' as ForwardRuleType,
    agentId: '',
    exitAgentId: '',
    chainAgentIds: [] as string[],
    chainPortConfig: {} as Record<string, number>,
    name: '',
    listenPort: '',
    targetAddress: '',
    targetPort: '',
    targetNodeId: '',
    sortOrder: '',
    protocol: 'tcp' as ForwardProtocol,
    ipVersion: 'auto' as IPVersion,
    remark: '',
  });

  // Target type: manual address input or node selection
  const [targetType, setTargetType] = useState<TargetType>('manual');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Default to first allowed rule type
      const defaultRuleType = (allowedTypes.length > 0 ? allowedTypes[0] : 'direct') as ForwardRuleType;
      setFormData({
        ruleType: defaultRuleType,
        agentId: '',
        exitAgentId: '',
        chainAgentIds: [],
        chainPortConfig: {},
        name: '',
        listenPort: '',
        targetAddress: '',
        targetPort: '',
        targetNodeId: '',
        sortOrder: '',
        protocol: 'tcp',
        ipVersion: 'auto',
        remark: '',
      });
      setTargetType('manual');
      setErrors({});
    }
  }, [open, allowedTypes]);

  // Default to first available agent when agent list is loaded
  useEffect(() => {
    if (open && forwardAgents.length > 0 && !formData.agentId) {
      const enabledAgents = forwardAgents.filter(a => a.status === 'enabled');
      if (enabledAgents.length > 0) {
        setFormData(prev => ({ ...prev, agentId: enabledAgents[0].id }));
      }
    }
  }, [open, forwardAgents, formData.agentId]);

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  const handleChange = (field: string, value: string | string[] | Record<string, number>) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // If modifying entry agent, automatically remove it from chain agent list
      if (field === 'agentId' && typeof value === 'string') {
        const currentChainIds = prev.chainAgentIds || [];
        if (currentChainIds.includes(value)) {
          newData.chainAgentIds = currentChainIds.filter((id: string) => id !== value);
          // Also remove port config for this node
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

  // Handle chain node port config change
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
      newErrors.name = '请输入规则名称';
    }

    // Listen port is optional, validate if provided
    if (formData.listenPort) {
      const port = parseInt(formData.listenPort);
      if (isNaN(port) || port < 1 || port > 65535) {
        newErrors.listenPort = '端口号必须在 1-65535 之间';
      }
    }

    // Validate different fields based on rule type
    if (formData.ruleType === 'entry') {
      if (!formData.exitAgentId) {
        newErrors.exitAgentId = '请选择出口节点';
      }
    } else if (formData.ruleType === 'chain') {
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) {
        newErrors.chainAgentIds = '请至少选择一个中间节点';
      }
    } else if (formData.ruleType === 'direct_chain') {
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) {
        newErrors.chainAgentIds = '请至少选择一个中间节点';
      }
      // Validate that each chain node has a port configured
      if (formData.chainAgentIds && formData.chainAgentIds.length > 0) {
        const missingPorts: string[] = [];
        for (const agentId of formData.chainAgentIds) {
          const port = formData.chainPortConfig[agentId];
          if (!port || port < 1 || port > 65535) {
            const agent = forwardAgents.find((a) => a.id === agentId);
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
      }
    }

    // Target validation based on target type
    if (targetType === 'manual') {
      if (!formData.targetAddress.trim()) {
        newErrors.targetAddress = '请输入目标地址';
      }
      if (!formData.targetPort) {
        newErrors.targetPort = '请输入目标端口';
      } else {
        const port = parseInt(formData.targetPort);
        if (isNaN(port) || port < 1 || port > 65535) {
          newErrors.targetPort = '端口号必须在 1-65535 之间';
        }
      }
    } else if (targetType === 'node') {
      if (!formData.targetNodeId) {
        newErrors.targetNodeId = '请选择目标节点';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const data: CreateForwardRuleRequest = {
      agentId: formData.agentId,
      ruleType: formData.ruleType,
      name: formData.name.trim(),
      listenPort: formData.listenPort ? parseInt(formData.listenPort) : undefined,
      sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : undefined,
      protocol: formData.protocol,
      ipVersion: formData.ipVersion,
      remark: formData.remark.trim() || undefined,
    };

    // Add target fields based on target type
    if (targetType === 'manual') {
      data.targetAddress = formData.targetAddress.trim();
      data.targetPort = parseInt(formData.targetPort);
    } else if (targetType === 'node') {
      data.targetNodeId = formData.targetNodeId;
    }

    // Add corresponding fields based on rule type
    if (formData.ruleType === 'entry') {
      data.exitAgentId = formData.exitAgentId;
    } else if (formData.ruleType === 'chain') {
      data.chainAgentIds = formData.chainAgentIds;
    } else if (formData.ruleType === 'direct_chain') {
      data.chainAgentIds = formData.chainAgentIds;
      data.chainPortConfig = formData.chainPortConfig;
    }

    onSubmit(data);
  };

  const isFormValid = () => {
    // Basic validation
    if (!formData.agentId || !formData.name.trim()) return false;

    // Target validation based on target type
    if (targetType === 'manual') {
      if (!formData.targetAddress.trim() || !formData.targetPort) return false;
      const targetPort = parseInt(formData.targetPort);
      if (isNaN(targetPort) || targetPort < 1 || targetPort > 65535) return false;
    } else if (targetType === 'node') {
      if (!formData.targetNodeId) return false;
    }

    // Validate based on rule type
    if (formData.ruleType === 'entry') {
      if (!formData.exitAgentId) return false;
    } else if (formData.ruleType === 'chain') {
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) return false;
    } else if (formData.ruleType === 'direct_chain') {
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) return false;
      // Validate that each chain node has a valid port configured
      const allPortsValid = formData.chainAgentIds.every((id) => {
        const port = formData.chainPortConfig[id];
        return port && port > 0 && port <= 65535;
      });
      if (!allPortsValid) return false;
    }

    return true;
  };

  // Get available nodes (status is active)
  const availableNodes = userNodes.filter((n) => n.status === 'active');

  // Get available exit agents (excluding currently selected entry agent)
  const availableExitAgents = forwardAgents.filter(
    (a) => a.id !== formData.agentId && a.status === 'enabled'
  );

  // Get available chain agents (excluding currently selected entry agent)
  const availableChainAgents = forwardAgents.filter(
    (a) => a.id !== formData.agentId && a.status === 'enabled'
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>新增转发规则</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6 py-4">
          {/* Basic info */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="space-y-4">
              {/* Rule name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">
                  规则名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="为您的规则起个名字"
                  error={!!errors.name}
                  disabled={isCreating}
                />
                {errors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Forward agent selection */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="agentId">
                  转发节点 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.agentId}
                  onValueChange={(value) => handleChange('agentId', value)}
                  disabled={isCreating || isLoadingAgents}
                >
                  <SelectTrigger id="agentId" className={errors.agentId ? 'border-destructive' : ''}>
                    <SelectValue placeholder={isLoadingAgents ? '加载中...' : '选择转发节点'} />
                  </SelectTrigger>
                  <SelectContent>
                    {forwardAgents
                      .filter(agent => agent.status === 'enabled')
                      .map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span>{agent.name}</span>
                            {agent.groupName && (
                              <span className="text-xs text-muted-foreground">({agent.groupName})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.agentId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.agentId}
                  </p>
                )}
                {!isLoadingAgents && forwardAgents.filter(a => a.status === 'enabled').length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    暂无可用的转发节点，请联系管理员
                  </p>
                )}
              </div>

              {/* Rule type */}
              {allowedTypes.length > 1 && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ruleType">规则类型</Label>
                  <Select
                    value={formData.ruleType}
                    onValueChange={(value) => handleChange('ruleType', value as ForwardRuleType)}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="ruleType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {RULE_TYPE_INFO[type as ForwardRuleType]?.label || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {RULE_TYPE_INFO[formData.ruleType] && (
                    <p className="text-xs text-muted-foreground">
                      {RULE_TYPE_INFO[formData.ruleType].description}
                    </p>
                  )}
                </div>
              )}

              {/* If only one type, display as read-only badge */}
              {allowedTypes.length === 1 && (
                <div className="flex flex-col gap-2">
                  <Label>规则类型</Label>
                  <div>
                    <Badge variant="secondary">
                      {RULE_TYPE_INFO[formData.ruleType]?.label || formData.ruleType}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {RULE_TYPE_INFO[formData.ruleType]?.description}
                    </p>
                  </div>
                </div>
              )}

              {/* entry type: exit agent selection */}
              {formData.ruleType === 'entry' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="exitAgentId">
                    出口节点 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.exitAgentId}
                    onValueChange={(value) => handleChange('exitAgentId', value)}
                    disabled={isCreating || isLoadingAgents}
                  >
                    <SelectTrigger id="exitAgentId" className={errors.exitAgentId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="选择出口节点" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExitAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span>{agent.name}</span>
                            {agent.groupName && (
                              <span className="text-xs text-muted-foreground">({agent.groupName})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.exitAgentId && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.exitAgentId}
                    </p>
                  )}
                </div>
              )}

              {/* chain type: intermediate node list */}
              {formData.ruleType === 'chain' && (
                <div className="flex flex-col gap-2">
                  <Label>
                    中间节点 <span className="text-destructive">*</span>
                  </Label>
                  <UserSortableChainAgentList
                    agents={availableChainAgents}
                    selectedIds={formData.chainAgentIds}
                    onSelectionChange={(ids: string[]) => handleChange('chainAgentIds', ids)}
                    hasError={!!errors.chainAgentIds}
                    idPrefix="chain-agent"
                  />
                  {errors.chainAgentIds && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.chainAgentIds}
                    </p>
                  )}
                </div>
              )}

              {/* direct_chain type: intermediate node list (with port config) */}
              {formData.ruleType === 'direct_chain' && (
                <div className="flex flex-col gap-2">
                  <Label>
                    中间节点及端口 <span className="text-destructive">*</span>
                  </Label>
                  <UserSortableChainAgentList
                    agents={availableChainAgents}
                    selectedIds={formData.chainAgentIds}
                    onSelectionChange={(ids: string[]) => {
                      // Sync update chainPortConfig, remove deselected nodes
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
                  {errors.chainAgentIds && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.chainAgentIds}
                    </p>
                  )}
                  {errors.chainPortConfig && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.chainPortConfig}
                    </p>
                  )}
                </div>
              )}

              {/* Remark */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="remark">备注</Label>
                <Textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => handleChange('remark', e.target.value)}
                  placeholder="添加备注信息（可选）"
                  rows={2}
                  disabled={isCreating}
                />
              </div>
            </div>
          </div>

          {/* Forward config */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">转发配置</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Listen port */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="listenPort">监听端口</Label>
                <Input
                  id="listenPort"
                  type="number"
                  value={formData.listenPort}
                  onChange={(e) => handleChange('listenPort', e.target.value)}
                  placeholder="留空自动分配"
                  error={!!errors.listenPort}
                  disabled={isCreating}
                />
                {errors.listenPort && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.listenPort}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  留空由系统自动分配可用端口
                </p>
              </div>

              {/* Protocol type */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="protocol">协议类型</Label>
                <Select
                  value={formData.protocol}
                  onValueChange={(value) => handleChange('protocol', value)}
                  disabled={isCreating}
                >
                  <SelectTrigger id="protocol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="both">TCP + UDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target type selection */}
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
                      handleChange('targetPort', '');
                    }
                  }}
                  className="flex gap-4"
                  disabled={isCreating}
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

              {/* Manual target address input */}
              {targetType === 'manual' && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="targetAddress">
                      目标地址 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="targetAddress"
                      value={formData.targetAddress}
                      onChange={(e) => handleChange('targetAddress', e.target.value)}
                      placeholder="例如: example.com 或 192.168.1.1"
                      error={!!errors.targetAddress}
                      disabled={isCreating}
                    />
                    {errors.targetAddress && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.targetAddress}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="targetPort">
                      目标端口 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="targetPort"
                      type="number"
                      value={formData.targetPort}
                      onChange={(e) => handleChange('targetPort', e.target.value)}
                      placeholder="1-65535"
                      error={!!errors.targetPort}
                      disabled={isCreating}
                    />
                    {errors.targetPort && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.targetPort}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Select target node */}
              {targetType === 'node' && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="targetNodeId">
                    目标节点 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.targetNodeId}
                    onValueChange={(value) => handleChange('targetNodeId', value)}
                    disabled={isCreating || isLoadingNodes}
                  >
                    <SelectTrigger id="targetNodeId" className={errors.targetNodeId ? 'border-destructive' : ''}>
                      <SelectValue placeholder={isLoadingNodes ? '加载中...' : '选择目标节点'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNodes.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <span>{node.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              ({node.serverAddress})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    选择节点后，目标地址将动态解析为节点的服务器地址
                  </p>
                  {errors.targetNodeId && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.targetNodeId}
                    </p>
                  )}
                  {!isLoadingNodes && availableNodes.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      暂无可用节点，请先在「我的节点」页面创建节点
                    </p>
                  )}
                </div>
              )}

              {/* IP version */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="ipVersion">IP 版本</Label>
                <Select
                  value={formData.ipVersion}
                  onValueChange={(value) => handleChange('ipVersion', value)}
                  disabled={isCreating}
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
              </div>

              {/* Sort order */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sortOrder">排序顺序</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) => handleChange('sortOrder', e.target.value)}
                  placeholder="留空则默认为 0"
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground">
                  值越小排序越靠前
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid() || isCreating}>
            {isCreating ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
