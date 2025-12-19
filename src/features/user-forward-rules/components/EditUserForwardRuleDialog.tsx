/**
 * 用户端编辑转发规则对话框
 * 参考管理员端实现，只提交变化的字段
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
import { AlertCircle } from 'lucide-react';
import type {
  ForwardRule,
  UpdateForwardRuleRequest,
  ForwardProtocol,
  IPVersion,
} from '@/api/forward';
import { useUserForwardAgents } from '../hooks/useUserForwardAgents';

// 规则类型标签映射
const RULE_TYPE_LABELS: Record<string, string> = {
  direct: '直连转发',
  entry: '入口节点',
  chain: 'WS链式转发',
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

  // 获取当前规则使用的代理名称
  const currentAgent = rule ? forwardAgents.find(a => a.id === rule.agentId) : null;

  const [formData, setFormData] = useState({
    name: '',
    targetAddress: '',
    targetPort: '',
    protocol: 'tcp' as ForwardProtocol,
    ipVersion: 'auto' as IPVersion,
    remark: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当对话框打开或规则变化时填充表单
  useEffect(() => {
    if (open && rule) {
      setFormData({
        name: rule.name,
        targetAddress: rule.targetAddress || '',
        targetPort: rule.targetPort?.toString() || '',
        protocol: rule.protocol,
        ipVersion: rule.ipVersion,
        remark: rule.remark || '',
      });
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
    // 清除所有验证错误，让用户重新提交时再次验证
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入规则名称';
    }

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 检查是否有变化
  const hasChanges = useMemo(() => {
    if (!rule) return false;
    return (
      formData.name !== rule.name ||
      formData.targetAddress !== (rule.targetAddress || '') ||
      formData.targetPort !== (rule.targetPort?.toString() || '') ||
      formData.protocol !== rule.protocol ||
      formData.ipVersion !== rule.ipVersion ||
      formData.remark !== (rule.remark || '')
    );
  }, [formData, rule]);

  const handleSubmit = () => {
    if (!validate() || !rule) {
      return;
    }

    // 只提交有变化的字段
    const updates: UpdateForwardRuleRequest = {};

    if (formData.name.trim() !== rule.name) {
      updates.name = formData.name.trim();
    }
    if (formData.targetAddress.trim() !== (rule.targetAddress || '')) {
      updates.targetAddress = formData.targetAddress.trim();
    }
    if (formData.targetPort !== (rule.targetPort?.toString() || '')) {
      updates.targetPort = parseInt(formData.targetPort);
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

    // 如果有任何变化，提交更新
    if (Object.keys(updates).length > 0) {
      onSubmit(rule.id, updates);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.targetAddress.trim() &&
      formData.targetPort &&
      parseInt(formData.targetPort) >= 1 &&
      parseInt(formData.targetPort) <= 65535
    );
  };

  if (!rule) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑转发规则</DialogTitle>
        </DialogHeader>

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

              {/* 目标地址 */}
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

              {/* 目标端口 */}
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
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
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
