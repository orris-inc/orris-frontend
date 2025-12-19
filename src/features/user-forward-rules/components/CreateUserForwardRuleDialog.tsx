/**
 * 用户端创建转发规则对话框
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
import { AlertCircle, Server } from 'lucide-react';
import type {
  CreateForwardRuleRequest,
  ForwardProtocol,
  IPVersion,
} from '@/api/forward';
import { useUserForwardAgents } from '../hooks/useUserForwardAgents';

interface CreateUserForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRuleRequest) => void;
  allowedTypes: string[];
  isCreating?: boolean;
}

// 规则类型描述
const RULE_TYPE_INFO: Record<string, { label: string; description: string }> = {
  direct: { label: '直连转发', description: '直接将流量转发到目标地址' },
  entry: { label: '入口节点', description: '作为转发链的入口' },
  exit: { label: '出口节点', description: '作为转发链的出口' },
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

  const [formData, setFormData] = useState({
    ruleType: 'direct',
    agentId: '',
    name: '',
    listenPort: '',
    targetAddress: '',
    targetPort: '',
    protocol: 'tcp' as ForwardProtocol,
    ipVersion: 'auto' as IPVersion,
    remark: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当对话框打开时重置表单
  useEffect(() => {
    if (open) {
      // 默认选择第一个允许的规则类型
      const defaultRuleType = allowedTypes.length > 0 ? allowedTypes[0] : 'direct';
      setFormData({
        ruleType: defaultRuleType,
        agentId: '',
        name: '',
        listenPort: '',
        targetAddress: '',
        targetPort: '',
        protocol: 'tcp',
        ipVersion: 'auto',
        remark: '',
      });
      setErrors({});
    }
  }, [open, allowedTypes]);

  // 当代理列表加载完成后，默认选择第一个可用的代理
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除所有验证错误，让用户重新提交时再次验证
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.agentId) {
      newErrors.agentId = '请选择转发节点';
    }

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

    // 监听端口是可选的，如果填写了则验证
    if (formData.listenPort) {
      const port = parseInt(formData.listenPort);
      if (isNaN(port) || port < 1 || port > 65535) {
        newErrors.listenPort = '端口号必须在 1-65535 之间';
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
      ruleType: formData.ruleType as 'direct' | 'entry' | 'chain' | 'direct_chain',
      name: formData.name.trim(),
      listenPort: formData.listenPort ? parseInt(formData.listenPort) : undefined,
      targetAddress: formData.targetAddress.trim(),
      targetPort: parseInt(formData.targetPort),
      protocol: formData.protocol,
      ipVersion: formData.ipVersion,
      remark: formData.remark.trim() || undefined,
    };

    onSubmit(data);
  };

  const isFormValid = () => {
    return (
      formData.agentId &&
      formData.name.trim() &&
      formData.targetAddress.trim() &&
      formData.targetPort &&
      parseInt(formData.targetPort) >= 1 &&
      parseInt(formData.targetPort) <= 65535
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增转发规则</DialogTitle>
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
                  disabled={isCreating}
                />
                {errors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 转发节点选择 */}
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

              {/* 规则类型 */}
              {allowedTypes.length > 1 && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ruleType">规则类型</Label>
                  <Select
                    value={formData.ruleType}
                    onValueChange={(value) => handleChange('ruleType', value)}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="ruleType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {RULE_TYPE_INFO[type]?.label || type}
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

              {/* 如果只有一个类型，显示为只读徽章 */}
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

              {/* 备注 */}
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

          {/* 转发配置 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">转发配置</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 监听端口 */}
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

              {/* 协议类型 */}
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
                  disabled={isCreating}
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
                  disabled={isCreating}
                />
                {errors.targetPort && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.targetPort}
                  </p>
                )}
              </div>

              {/* IP 版本 */}
              <div className="flex flex-col gap-2 md:col-span-2">
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
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
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
