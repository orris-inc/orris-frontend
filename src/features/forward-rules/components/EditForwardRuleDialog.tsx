/**
 * 编辑转发规则对话框组件
 * 支持 targetNodeId（动态节点地址解析）
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
import { Separator } from '@/components/common/Separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { SortableChainAgentList } from './SortableChainAgentList';
import type { ForwardRule, UpdateForwardRuleRequest, IPVersion, ForwardAgent } from '@/api/forward';
import type { Node } from '@/api/node';

type ForwardProtocol = 'tcp' | 'udp' | 'both';
type TargetType = 'manual' | 'node';

// 规则类型标签映射
const RULE_TYPE_LABELS: Record<string, string> = {
  direct: '直连转发',
  entry: '入口节点',
  chain: 'WS链式转发',
  direct_chain: '直连链式转发',
};

interface EditForwardRuleDialogProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateForwardRuleRequest) => void;
  nodes?: Node[];
  agents?: ForwardAgent[];
}

export const EditForwardRuleDialog: React.FC<EditForwardRuleDialogProps> = ({
  open,
  rule,
  onClose,
  onSubmit,
  nodes = [],
  agents = [],
}) => {
  const [formData, setFormData] = useState<UpdateForwardRuleRequest & { chainAgentIds?: string[]; chainPortConfig?: Record<string, number>; trafficMultiplier?: number }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [targetType, setTargetType] = useState<TargetType>('manual');

  useEffect(() => {
    if (rule) {
      // 过滤掉链节点中包含的入口节点
      const chainAgentIds = (rule.chainAgentIds || []).filter((id) => id !== rule.agentId);
      const chainPortConfig = { ...(rule.chainPortConfig || {}) };
      // 同时移除入口节点的端口配置
      if (chainPortConfig[rule.agentId]) {
        delete chainPortConfig[rule.agentId];
      }

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
      });
      // 根据规则数据确定目标类型
      setTargetType(rule.targetNodeId ? 'node' : 'manual');
      setErrors({});
    }
  }, [rule]);

  // 获取可用的节点列表（状态为 active）
  const availableNodes = nodes.filter((n) => n.status === 'active');

  // 获取可用的代理列表（状态为 enabled）
  const availableAgents = agents.filter((a) => a.status === 'enabled');

  // 获取可选的出口节点（排除当前入口节点）
  const availableExitAgents = availableAgents.filter((a) => a.id !== formData.agentId);

  // 获取可选的链节点（排除当前入口节点）
  const availableChainAgents = availableAgents.filter((a) => a.id !== formData.agentId);

  // 处理链节点端口配置变更
  const handleChainPortChange = (agentId: string, port: number) => {
    setFormData((prev) => ({
      ...prev,
      chainPortConfig: {
        ...(prev.chainPortConfig || {}),
        [agentId]: port,
      },
    }));
  };

  const handleChange = (field: keyof (UpdateForwardRuleRequest & { chainAgentIds?: string[] }), value: string | number | ForwardProtocol | string[] | undefined) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // 如果修改的是入口代理，自动从链节点列表中移除该代理
      if (field === 'agentId' && typeof value === 'string') {
        const currentChainIds = prev.chainAgentIds || [];
        if (currentChainIds.includes(value)) {
          newData.chainAgentIds = currentChainIds.filter((id) => id !== value);
          // 同时移除该节点的端口配置
          if (prev.chainPortConfig?.[value]) {
            const newPortConfig = { ...prev.chainPortConfig };
            delete newPortConfig[value];
            newData.chainPortConfig = newPortConfig;
          }
        }
      }

      return newData;
    });

    // 清除所有验证错误，让用户重新提交时再次验证
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = '规则名称不能为空';
    }

    if (formData.listenPort !== undefined && (formData.listenPort < 1 || formData.listenPort > 65535)) {
      newErrors.listenPort = '监听端口必须在1-65535之间';
    }

    // direct、entry、chain 和 direct_chain 类型需要目标验证
    if (rule && (rule.ruleType === 'direct' || rule.ruleType === 'entry' || rule.ruleType === 'chain' || rule.ruleType === 'direct_chain')) {
      if (targetType === 'manual') {
        if (formData.targetAddress !== undefined && !formData.targetAddress.trim()) {
          newErrors.targetAddress = '目标地址不能为空';
        }
        if (formData.targetPort !== undefined && (formData.targetPort < 1 || formData.targetPort > 65535)) {
          newErrors.targetPort = '目标端口必须在1-65535之间';
        }
      } else if (targetType === 'node') {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = '请选择目标节点';
        }
      }
    }

    // direct_chain 类型需要验证端口配置
    if (rule && rule.ruleType === 'direct_chain') {
      const chainIds = formData.chainAgentIds || [];
      const missingPorts: string[] = [];

      for (const agentId of chainIds) {
        const port = formData.chainPortConfig?.[agentId];
        if (!port || port < 1 || port > 65535) {
          const agent = agents.find((a) => a.id === agentId);
          const agentName = agent ? agent.name : agentId;
          missingPorts.push(agentName);
        }
      }

      if (missingPorts.length > 0) {
        if (missingPorts.length === chainIds.length) {
          newErrors.chainPortConfig = '请为每个节点配置有效的监听端口（1-65535）';
        } else {
          newErrors.chainPortConfig = `请为以下节点配置有效端口：${missingPorts.join('、')}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (rule && validate()) {
      // 只提交有变化的字段
      const updates: UpdateForwardRuleRequest = {};

      if (formData.name !== rule.name) updates.name = formData.name;
      if (formData.protocol !== rule.protocol) updates.protocol = formData.protocol;
      if (formData.listenPort !== rule.listenPort) updates.listenPort = formData.listenPort;
      if (formData.ipVersion !== rule.ipVersion) updates.ipVersion = formData.ipVersion;
      if (formData.bindIp !== rule.bindIp) updates.bindIp = formData.bindIp;
      if (formData.remark !== rule.remark) updates.remark = formData.remark;

      // 处理代理配置
      if (formData.agentId !== rule.agentId) updates.agentId = formData.agentId;

      // entry 类型：出口代理
      if (rule.ruleType === 'entry' && formData.exitAgentId !== rule.exitAgentId) {
        updates.exitAgentId = formData.exitAgentId;
      }

      // chain 和 direct_chain 类型：链式代理
      if (rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') {
        const currentIds = formData.chainAgentIds || [];
        const originalIds = rule.chainAgentIds || [];
        const hasChainChange = currentIds.length !== originalIds.length ||
          currentIds.some((id, index) => id !== originalIds[index]);
        if (hasChainChange) {
          updates.chainAgentIds = currentIds;
        }

        // direct_chain 类型：端口配置
        if (rule.ruleType === 'direct_chain') {
          const currentPortConfig = formData.chainPortConfig || {};
          const originalPortConfig = rule.chainPortConfig || {};
          const hasPortConfigChange = Object.keys(currentPortConfig).length !== Object.keys(originalPortConfig).length ||
            Object.entries(currentPortConfig).some(([id, port]) => originalPortConfig[id] !== port);
          if (hasPortConfigChange) {
            updates.chainPortConfig = currentPortConfig;
          }
        }
      }

      // 处理目标配置（手动输入或选择节点）- direct、entry、chain 和 direct_chain 类型
      if (rule.ruleType === 'direct' || rule.ruleType === 'entry' || rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') {
        if (targetType === 'manual') {
          // 手动输入地址
          if (formData.targetAddress !== rule.targetAddress) updates.targetAddress = formData.targetAddress;
          if (formData.targetPort !== rule.targetPort) updates.targetPort = formData.targetPort;
          // 如果从节点切换到手动，清除 targetNodeId
          if (rule.targetNodeId) updates.targetNodeId = undefined;
        } else {
          // 选择节点
          if (formData.targetNodeId !== rule.targetNodeId) updates.targetNodeId = formData.targetNodeId;
          // 如果从手动切换到节点，清除地址和端口
          if (rule.targetAddress) updates.targetAddress = undefined;
          if (rule.targetPort) updates.targetPort = undefined;
        }
      }

      // 处理流量倍率
      if (formData.trafficMultiplier !== rule.trafficMultiplier) {
        updates.trafficMultiplier = formData.trafficMultiplier;
      }

      // 如果有任何变化，提交更新
      if (Object.keys(updates).length > 0) {
        onSubmit(rule.id, updates);
      }
    }
  };

  // 检查是否有变化
  const hasChanges = rule && Object.keys(formData).some(
    (key) => formData[key as keyof UpdateForwardRuleRequest] !== rule[key as keyof ForwardRule]
  );

  if (!rule) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑转发规则</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息（只读） */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rule_id">规则ID</Label>
                <Input id="rule_id" value={rule.id} disabled />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="rule_type">规则类型</Label>
                <Input
                  id="rule_type"
                  value={RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}
                  disabled
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="created_at">创建时间</Label>
                <Input
                  id="created_at"
                  value={new Date(rule.createdAt).toLocaleString('zh-CN')}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* 可编辑字段 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">可编辑信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 规则名称 */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="name">规则名称</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* 入口代理 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="agentId">入口代理</Label>
                <Select
                  value={formData.agentId || ''}
                  onValueChange={(value) => handleChange('agentId', value)}
                >
                  <SelectTrigger id="agentId">
                    <SelectValue placeholder="选择入口代理" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* entry 类型：出口代理 */}
              {rule.ruleType === 'entry' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="exitAgentId">出口代理</Label>
                  <Select
                    value={formData.exitAgentId || ''}
                    onValueChange={(value) => handleChange('exitAgentId', value)}
                  >
                    <SelectTrigger id="exitAgentId">
                      <SelectValue placeholder="选择出口代理" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExitAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* chain 类型：链式代理 */}
              {rule.ruleType === 'chain' && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label>中间节点</Label>
                  <SortableChainAgentList
                    agents={availableChainAgents}
                    selectedIds={formData.chainAgentIds || []}
                    onSelectionChange={(ids) => handleChange('chainAgentIds', ids)}
                    idPrefix="edit-chain-agent"
                  />
                </div>
              )}

              {/* direct_chain 类型：链式代理（带端口配置） */}
              {rule.ruleType === 'direct_chain' && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label>中间节点及端口</Label>
                  <SortableChainAgentList
                    agents={availableChainAgents}
                    selectedIds={formData.chainAgentIds || []}
                    onSelectionChange={(ids) => {
                      // 同步更新 chainPortConfig，移除不再选中的节点
                      const newPortConfig = { ...(formData.chainPortConfig || {}) };
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
                    portConfig={formData.chainPortConfig || {}}
                    onPortConfigChange={handleChainPortChange}
                    hasError={!!errors.chainPortConfig}
                    idPrefix="edit-direct-chain-agent"
                  />
                  {errors.chainPortConfig && <p className="text-xs text-destructive">{errors.chainPortConfig}</p>}
                </div>
              )}

              {/* 协议类型 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="protocol">协议类型</Label>
                <Select
                  value={formData.protocol || 'tcp'}
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

              {/* IP 版本 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="ipVersion">IP 版本</Label>
                <Select
                  value={formData.ipVersion || 'auto'}
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

              {/* 监听端口 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="listenPort">监听端口</Label>
                <Input
                  id="listenPort"
                  type="number"
                  min={1}
                  max={65535}
                  value={formData.listenPort || ''}
                  onChange={(e) => handleChange('listenPort', parseInt(e.target.value, 10))}
                  error={!!errors.listenPort}
                />
                {errors.listenPort && (
                  <p className="text-xs text-destructive">{errors.listenPort}</p>
                )}
              </div>

              {/* 目标配置 - direct、entry、chain 和 direct_chain 类型显示 */}
              {rule && (rule.ruleType === 'direct' || rule.ruleType === 'entry' || rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && (
                <>
                  {/* 目标类型选择 */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>目标类型</Label>
                    <RadioGroup
                      value={targetType}
                      onValueChange={(value) => {
                        setTargetType(value as TargetType);
                        // 切换时清除相关字段
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
                        <RadioGroupItem value="manual" id="edit-target-manual" />
                        <Label htmlFor="edit-target-manual" className="font-normal cursor-pointer">
                          手动输入地址
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="node" id="edit-target-node" />
                        <Label htmlFor="edit-target-node" className="font-normal cursor-pointer">
                          选择节点（动态解析）
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 手动输入目标地址 */}
                  {targetType === 'manual' && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="targetAddress">目标地址</Label>
                        <Input
                          id="targetAddress"
                          value={formData.targetAddress || ''}
                          onChange={(e) => handleChange('targetAddress', e.target.value)}
                          error={!!errors.targetAddress}
                        />
                        {errors.targetAddress && (
                          <p className="text-xs text-destructive">{errors.targetAddress}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="targetPort">目标端口</Label>
                        <Input
                          id="targetPort"
                          type="number"
                          min={1}
                          max={65535}
                          value={formData.targetPort || ''}
                          onChange={(e) => handleChange('targetPort', parseInt(e.target.value, 10))}
                          error={!!errors.targetPort}
                        />
                        {errors.targetPort && (
                          <p className="text-xs text-destructive">{errors.targetPort}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* 选择目标节点 */}
                  {targetType === 'node' && (
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label htmlFor="targetNodeId">目标节点</Label>
                      <Select
                        value={formData.targetNodeId || ''}
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

              {/* 绑定 IP */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="bindIp">绑定 IP</Label>
                <Input
                  id="bindIp"
                  value={formData.bindIp || ''}
                  onChange={(e) => handleChange('bindIp', e.target.value)}
                  placeholder="可选：出站连接绑定的本地 IP"
                />
                <p className="text-xs text-muted-foreground">指定出站连接使用的本地 IP 地址</p>
              </div>

              {/* 流量倍率 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="trafficMultiplier">流量倍率（可选）</Label>
                <Input
                  id="trafficMultiplier"
                  type="number"
                  min={0}
                  max={1000000}
                  step={0.01}
                  value={formData.trafficMultiplier ?? ''}
                  onChange={(e) => handleChange('trafficMultiplier', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="留空表示不修改"
                />
                <p className="text-xs text-muted-foreground">
                  当前: {rule.effectiveTrafficMultiplier}x ({rule.isAutoMultiplier ? '自动计算' : '自定义'})
                </p>
                <p className="text-xs text-muted-foreground">
                  修改此值会影响后续流量统计
                </p>
              </div>

              {/* 备注 */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="remark">备注</Label>
                <Textarea
                  id="remark"
                  rows={4}
                  value={formData.remark || ''}
                  onChange={(e) => handleChange('remark', e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-3">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
