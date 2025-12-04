/**
 * 创建转发规则对话框组件
 * 支持三种规则类型：direct（直连）、entry（入口）、exit（出口）
 * 支持目标类型：手动输入地址或选择节点（动态解析）
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
import type { CreateForwardRuleRequest, ForwardAgent, ForwardRuleType, ForwardProtocol } from '@/api/forward';
import type { Node } from '@/api/node';

// 目标类型
type TargetType = 'manual' | 'node';

interface CreateForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRuleRequest) => void;
  agents: ForwardAgent[];
  nodes?: Node[];
}

// 规则类型描述
const RULE_TYPE_INFO: Record<ForwardRuleType, { label: string; description: string }> = {
  direct: { label: '直连转发', description: '直接将流量转发到目标地址' },
  entry: { label: '入口节点', description: '作为转发链的入口，连接到出口节点' },
  exit: { label: '出口节点', description: '作为转发链的出口，接收来自入口的流量' },
};

export const CreateForwardRuleDialog: React.FC<CreateForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  agents,
  nodes = [],
}) => {
  const [formData, setFormData] = useState({
    agentId: 0,
    ruleType: 'direct' as ForwardRuleType,
    exitAgentId: 0,
    wsListenPort: 0,
    name: '',
    listenPort: 0,
    targetAddress: '',
    targetPort: 0,
    targetNodeId: 0,
    protocol: 'tcp' as ForwardProtocol,
    remark: '',
  });
  const [targetType, setTargetType] = useState<TargetType>('manual');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当对话框打开时重置表单
  useEffect(() => {
    if (open) {
      setFormData({
        agentId: 0,
        ruleType: 'direct',
        exitAgentId: 0,
        wsListenPort: 0,
        name: '',
        listenPort: 0,
        targetAddress: '',
        targetPort: 0,
        targetNodeId: 0,
        protocol: 'tcp',
        remark: '',
      });
      setTargetType('manual');
      setErrors({});
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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

    // 根据规则类型验证不同字段
    if (formData.ruleType === 'direct') {
      if (!formData.listenPort || formData.listenPort < 1 || formData.listenPort > 65535) {
        newErrors.listenPort = '监听端口必须在1-65535之间';
      }
      // 目标验证：手动输入或选择节点
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
    } else if (formData.ruleType === 'exit') {
      if (!formData.wsListenPort || formData.wsListenPort < 1 || formData.wsListenPort > 65535) {
        newErrors.wsListenPort = 'WS监听端口必须在1-65535之间';
      }
      // 目标验证：手动输入或选择节点
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
      };

      // 根据规则类型添加对应字段
      if (formData.ruleType === 'direct') {
        submitData.listenPort = formData.listenPort;
        // 目标：手动输入或选择节点
        if (targetType === 'manual') {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      } else if (formData.ruleType === 'entry') {
        submitData.listenPort = formData.listenPort;
        submitData.exitAgentId = formData.exitAgentId;
      } else if (formData.ruleType === 'exit') {
        submitData.wsListenPort = formData.wsListenPort;
        // 目标：手动输入或选择节点
        if (targetType === 'manual') {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      }

      if (formData.remark?.trim()) {
        submitData.remark = formData.remark.trim();
      }

      onSubmit(submitData);
      handleClose();
    }
  };

  // 检查表单是否有效
  const isFormValid = () => {
    if (!formData.agentId || !formData.name.trim() || !formData.protocol) return false;

    if (formData.ruleType === 'direct') {
      if (formData.listenPort <= 0) return false;
      if (targetType === 'manual') {
        return formData.targetAddress.trim() !== '' && formData.targetPort > 0;
      } else {
        return formData.targetNodeId > 0;
      }
    } else if (formData.ruleType === 'entry') {
      return formData.listenPort > 0 && formData.exitAgentId > 0;
    } else if (formData.ruleType === 'exit') {
      if (formData.wsListenPort <= 0) return false;
      if (targetType === 'manual') {
        return formData.targetAddress.trim() !== '' && formData.targetPort > 0;
      } else {
        return formData.targetNodeId > 0;
      }
    }
    return false;
  };

  // 获取可用的节点列表（状态为 active）
  const availableNodes = nodes.filter((n) => n.status === 'active');

  // 获取可选的出口节点（排除当前选中的节点）
  const availableExitAgents = agents.filter((a) => a.id !== formData.agentId && a.status === 'enabled');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增转发规则</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 转发节点 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="agentId">
                  转发节点 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.agentId ? String(formData.agentId) : ''}
                  onValueChange={(value) => handleChange('agentId', parseInt(value, 10))}
                >
                  <SelectTrigger id="agentId" className={errors.agentId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="选择转发节点" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter((a) => a.status === 'enabled').map((agent) => (
                      <SelectItem key={agent.id} value={String(agent.id)}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.agentId && <p className="text-xs text-destructive">{errors.agentId}</p>}
              </div>

              {/* 规则类型 */}
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

              {/* 规则名称 */}
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

              {/* 协议类型 */}
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
            </div>
          </div>

          {/* 转发配置 - 根据规则类型显示不同字段 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">转发配置</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* direct 和 entry 类型：监听端口 */}
              {(formData.ruleType === 'direct' || formData.ruleType === 'entry') && (
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

              {/* exit 类型：WS监听端口 */}
              {formData.ruleType === 'exit' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="wsListenPort">
                    WS监听端口 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="wsListenPort"
                    type="number"
                    min={1}
                    max={65535}
                    value={formData.wsListenPort || ''}
                    onChange={(e) => handleChange('wsListenPort', parseInt(e.target.value, 10) || 0)}
                    error={!!errors.wsListenPort}
                    placeholder="WebSocket 监听端口"
                  />
                  {errors.wsListenPort && <p className="text-xs text-destructive">{errors.wsListenPort}</p>}
                </div>
              )}

              {/* entry 类型：出口节点 */}
              {formData.ruleType === 'entry' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="exitAgentId">
                    出口节点 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.exitAgentId ? String(formData.exitAgentId) : ''}
                    onValueChange={(value) => handleChange('exitAgentId', parseInt(value, 10))}
                  >
                    <SelectTrigger id="exitAgentId" className={errors.exitAgentId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="选择出口节点" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExitAgents.map((agent) => (
                        <SelectItem key={agent.id} value={String(agent.id)}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.exitAgentId && <p className="text-xs text-destructive">{errors.exitAgentId}</p>}
                </div>
              )}

              {/* direct 和 exit 类型：目标配置 */}
              {(formData.ruleType === 'direct' || formData.ruleType === 'exit') && (
                <>
                  {/* 目标类型选择 */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label>目标类型 <span className="text-destructive">*</span></Label>
                    <RadioGroup
                      value={targetType}
                      onValueChange={(value) => {
                        setTargetType(value as TargetType);
                        // 切换时清除相关字段
                        if (value === 'manual') {
                          handleChange('targetNodeId', 0);
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

                  {/* 手动输入目标地址 */}
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

                  {/* 选择目标节点 */}
                  {targetType === 'node' && (
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label htmlFor="targetNodeId">
                        目标节点 <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.targetNodeId ? String(formData.targetNodeId) : ''}
                        onValueChange={(value) => handleChange('targetNodeId', parseInt(value, 10))}
                      >
                        <SelectTrigger id="targetNodeId" className={errors.targetNodeId ? 'border-destructive' : ''}>
                          <SelectValue placeholder="选择目标节点" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableNodes.map((node) => (
                            <SelectItem key={node.id} value={String(node.id)}>
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

          {/* 备注 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">其他</h3>
            <Separator className="mb-4" />
            <div className="flex flex-col gap-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea
                id="remark"
                rows={2}
                value={formData.remark}
                onChange={(e) => handleChange('remark', e.target.value)}
                placeholder="可选：添加备注说明"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
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
