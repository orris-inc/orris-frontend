/**
 * User-side edit forward rule dialog
 * Based on admin implementation, only submits changed fields
 * Supports target types: manual address input or node selection (dynamic resolution)
 */

import { useState, useEffect, useMemo } from 'react';
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
import { AlertCircle, HardDrive } from 'lucide-react';
import type {
  ForwardRule,
  ForwardRuleType,
  UpdateForwardRuleRequest,
  ForwardProtocol,
  IPVersion,
} from '@/api/forward';
import { useUserForwardAgents } from '../hooks/useUserForwardAgents';
import { useUserNodes } from '@/features/user-nodes/hooks/useUserNodes';

// Target type for forward rule
type TargetType = 'manual' | 'node';

// Rule type label mapping
const RULE_TYPE_LABELS: Record<ForwardRuleType, string> = {
  direct: '直连转发',
  entry: '入口节点',
  chain: '隧道链式转发',
  direct_chain: '直连链式转发',
};

interface EditUserForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateForwardRuleRequest) => void;
  rule: ForwardRule | null;
  isUpdating?: boolean;
}

export const EditUserForwardRuleDialog: React.FC<EditUserForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  rule,
  isUpdating = false,
}) => {
  const { forwardAgents } = useUserForwardAgents({
    pageSize: 100,
    enabled: open && !!rule,
  });

  // Fetch user's nodes for target node selection
  const { nodes: userNodes, isLoading: isLoadingNodes } = useUserNodes({
    pageSize: 100,
    enabled: open && !!rule,
  });

  // Get current rule's agent name
  const currentAgent = rule ? forwardAgents.find(a => a.id === rule.agentId) : null;

  const [formData, setFormData] = useState({
    name: '',
    targetAddress: '',
    targetPort: '',
    targetNodeId: '',
    protocol: 'tcp' as ForwardProtocol,
    ipVersion: 'auto' as IPVersion,
    remark: '',
  });

  // Target type: manual address input or node selection
  const [targetType, setTargetType] = useState<TargetType>('manual');
  // Original target type from rule (for detecting changes)
  const [originalTargetType, setOriginalTargetType] = useState<TargetType>('manual');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when dialog opens or rule changes
  useEffect(() => {
    if (open && rule) {
      // Determine target type based on whether targetNodeId is set
      const ruleTargetType: TargetType = rule.targetNodeId ? 'node' : 'manual';
      setFormData({
        name: rule.name,
        targetAddress: rule.targetAddress || '',
        targetPort: rule.targetPort?.toString() || '',
        targetNodeId: rule.targetNodeId || '',
        protocol: rule.protocol,
        ipVersion: rule.ipVersion,
        remark: rule.remark || '',
      });
      setTargetType(ruleTargetType);
      setOriginalTargetType(ruleTargetType);
      setErrors({});
    }
  }, [open, rule]);

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear all validation errors, re-validate on next submit
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入规则名称';
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

  // Check for changes
  const hasChanges = useMemo(() => {
    if (!rule) return false;

    // Check if target type changed
    const targetTypeChanged = targetType !== originalTargetType;

    // Check basic field changes
    const basicChanges =
      formData.name !== rule.name ||
      formData.protocol !== rule.protocol ||
      formData.ipVersion !== rule.ipVersion ||
      formData.remark !== (rule.remark || '');

    // Check target changes based on target type
    let targetChanges = false;
    if (targetType === 'manual') {
      targetChanges =
        formData.targetAddress !== (rule.targetAddress || '') ||
        formData.targetPort !== (rule.targetPort?.toString() || '');
    } else if (targetType === 'node') {
      targetChanges = formData.targetNodeId !== (rule.targetNodeId || '');
    }

    return basicChanges || targetTypeChanged || targetChanges;
  }, [formData, rule, targetType, originalTargetType]);

  const handleSubmit = () => {
    if (!validate() || !rule) {
      return;
    }

    // Only submit changed fields
    const updates: UpdateForwardRuleRequest = {};

    if (formData.name.trim() !== rule.name) {
      updates.name = formData.name.trim();
    }
    if (formData.protocol !== rule.protocol) {
      updates.protocol = formData.protocol;
    }
    if (formData.ipVersion !== rule.ipVersion) {
      updates.ipVersion = formData.ipVersion;
    }
    if (formData.remark.trim() !== (rule.remark || '')) {
      updates.remark = formData.remark.trim() || undefined;
    }

    // Handle target changes based on target type
    if (targetType === 'manual') {
      // Switching to manual mode or updating manual values
      if (targetType !== originalTargetType) {
        // Clear targetNodeId when switching to manual
        updates.targetNodeId = '';
      }
      if (formData.targetAddress.trim() !== (rule.targetAddress || '')) {
        updates.targetAddress = formData.targetAddress.trim();
      }
      if (formData.targetPort !== (rule.targetPort?.toString() || '')) {
        updates.targetPort = parseInt(formData.targetPort);
      }
    } else if (targetType === 'node') {
      // Switching to node mode or updating node selection
      if (formData.targetNodeId !== (rule.targetNodeId || '')) {
        updates.targetNodeId = formData.targetNodeId;
      }
    }

    // If any changes, submit update
    if (Object.keys(updates).length > 0) {
      onSubmit(rule.id, updates);
    }
  };

  const isFormValid = () => {
    if (!formData.name.trim()) return false;

    if (targetType === 'manual') {
      return (
        formData.targetAddress.trim() &&
        formData.targetPort &&
        parseInt(formData.targetPort) >= 1 &&
        parseInt(formData.targetPort) <= 65535
      );
    } else if (targetType === 'node') {
      return !!formData.targetNodeId;
    }

    return false;
  };

  // Get available nodes (status is active, but always include currently selected node)
  const availableNodes = userNodes.filter(
    (n) => n.status === 'active' || n.id === formData.targetNodeId
  );

  if (!rule) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>编辑转发规则</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6 py-4">
          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="space-y-4">
              {/* 规则名称 */}
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
                  disabled={isUpdating}
                />
                {errors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 备注 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="remark">备注</Label>
                <Textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => handleChange('remark', e.target.value)}
                  placeholder="添加备注信息（可选）"
                  rows={2}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>

          {/* 转发配置 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">转发配置</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 协议类型 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="protocol">协议类型</Label>
                <Select
                  value={formData.protocol}
                  onValueChange={(value) => handleChange('protocol', value)}
                  disabled={isUpdating}
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

              {/* IP 版本 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="ipVersion">IP 版本</Label>
                <Select
                  value={formData.ipVersion}
                  onValueChange={(value) => handleChange('ipVersion', value)}
                  disabled={isUpdating}
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
                  disabled={isUpdating}
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
                      disabled={isUpdating}
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
                      disabled={isUpdating}
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
                    disabled={isUpdating || isLoadingNodes}
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
            </div>
          </div>

          {/* 只读信息 */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">不可修改的信息</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">转发节点：</span>
                <span>{currentAgent?.name || rule.agentId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">规则类型：</span>
                <span>{RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}</span>
              </div>
              <div>
                <span className="text-muted-foreground">监听端口：</span>
                <span className="font-mono">{rule.listenPort || '系统分配'}</span>
              </div>
              {/* entry 类型显示出口节点 */}
              {rule.ruleType === 'entry' && rule.exitAgentId && (
                <div>
                  <span className="text-muted-foreground">出口节点：</span>
                  <span>{forwardAgents.find(a => a.id === rule.exitAgentId)?.name || rule.exitAgentId}</span>
                </div>
              )}
            </div>
            {/* chain/direct_chain 类型显示中间节点 */}
            {(rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') && rule.chainAgentIds && rule.chainAgentIds.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <span className="text-muted-foreground text-sm">中间节点：</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {rule.chainAgentIds.map((agentId, index) => {
                    const agent = forwardAgents.find(a => a.id === agentId);
                    const port = rule.chainPortConfig?.[agentId];
                    return (
                      <span
                        key={agentId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background text-xs"
                      >
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <span>{agent?.name || agentId}</span>
                        {rule.ruleType === 'direct_chain' && port && (
                          <span className="text-muted-foreground font-mono">:{port}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid() || !hasChanges || isUpdating}>
            {isUpdating ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
