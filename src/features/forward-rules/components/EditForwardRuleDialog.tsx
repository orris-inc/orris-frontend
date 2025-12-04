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
import type { ForwardRule, UpdateForwardRuleRequest } from '@/api/forward';
import type { Node } from '@/api/node';

type ForwardProtocol = 'tcp' | 'udp' | 'both';
type TargetType = 'manual' | 'node';

interface EditForwardRuleDialogProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateForwardRuleRequest) => void;
  nodes?: Node[];
}

export const EditForwardRuleDialog: React.FC<EditForwardRuleDialogProps> = ({
  open,
  rule,
  onClose,
  onSubmit,
  nodes = [],
}) => {
  const [formData, setFormData] = useState<UpdateForwardRuleRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [targetType, setTargetType] = useState<TargetType>('manual');

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        protocol: rule.protocol,
        listenPort: rule.listenPort,
        targetAddress: rule.targetAddress,
        targetPort: rule.targetPort,
        targetNodeId: rule.targetNodeId,
        remark: rule.remark,
      });
      // 根据规则数据确定目标类型
      setTargetType(rule.targetNodeId ? 'node' : 'manual');
      setErrors({});
    }
  }, [rule]);

  // 获取可用的节点列表（状态为 active）
  const availableNodes = nodes.filter((n) => n.status === 'active');

  const handleChange = (field: keyof UpdateForwardRuleRequest, value: string | number | ForwardProtocol) => {
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

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = '规则名称不能为空';
    }

    if (formData.listenPort !== undefined && (formData.listenPort < 1 || formData.listenPort > 65535)) {
      newErrors.listenPort = '监听端口必须在1-65535之间';
    }

    // 只有直连和出口类型需要目标验证
    if (rule && (rule.ruleType === 'direct' || rule.ruleType === 'exit')) {
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
      if (formData.remark !== rule.remark) updates.remark = formData.remark;

      // 处理目标配置（手动输入或选择节点）
      if (rule.ruleType === 'direct' || rule.ruleType === 'exit') {
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

              {/* 目标配置 - 仅 direct 和 exit 类型显示 */}
              {rule && (rule.ruleType === 'direct' || rule.ruleType === 'exit') && (
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
                          handleChange('targetNodeId', 0);
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

              {/* 备注 */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="remark">备注</Label>
                <Textarea
                  id="remark"
                  rows={2}
                  value={formData.remark || ''}
                  onChange={(e) => handleChange('remark', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
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
