/**
 * 编辑转发节点对话框组件
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
import type { ForwardAgent, UpdateForwardAgentRequest } from '@/api/forward';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';

interface EditForwardAgentDialogProps {
  open: boolean;
  agent: ForwardAgent | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateForwardAgentRequest) => void;
}

export const EditForwardAgentDialog: React.FC<EditForwardAgentDialogProps> = ({
  open,
  agent,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdateForwardAgentRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get resource group list
  const { resourceGroups, isLoading: isLoadingGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        publicAddress: agent.publicAddress,
        tunnelAddress: agent.tunnelAddress,
        remark: agent.remark,
      });
      setErrors({});
    }
  }, [agent]);

  const handleChange = (field: keyof UpdateForwardAgentRequest, value: string) => {
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
      newErrors.name = '节点名称不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (agent && validate()) {
      // Only submit changed fields
      const updates: UpdateForwardAgentRequest = {};

      if (formData.name !== agent.name) updates.name = formData.name;
      if (formData.publicAddress !== agent.publicAddress) updates.publicAddress = formData.publicAddress;
      if (formData.tunnelAddress !== agent.tunnelAddress) updates.tunnelAddress = formData.tunnelAddress;
      if (formData.remark !== agent.remark) updates.remark = formData.remark;

      // Resource group association
      if (formData.groupSid !== undefined) {
        updates.groupSid = formData.groupSid;
      }

      // If any changes, submit update
      if (Object.keys(updates).length > 0) {
        onSubmit(agent.id, updates);
      }
    }
  };

  // Check for changes
  const hasChanges = agent && Object.keys(formData).some(
    (key) => formData[key as keyof UpdateForwardAgentRequest] !== agent[key as keyof ForwardAgent]
  );

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>编辑转发节点</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6">
          {/* 节点基本信息（只读） */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="agent_id">节点ID</Label>
                <Input id="agent_id" value={agent.id} disabled />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="createdAt">创建时间</Label>
                <Input
                  id="createdAt"
                  value={new Date(agent.createdAt).toLocaleString('zh-CN')}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* 可编辑字段 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">可编辑信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 gap-4">
              {/* 节点名称 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">节点名称</Label>
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

              {/* 公网地址 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="publicAddress">公网地址</Label>
                <Input
                  id="publicAddress"
                  value={formData.publicAddress || ''}
                  onChange={(e) => handleChange('publicAddress', e.target.value)}
                  placeholder="例如：192.168.1.100 或 example.com"
                />
                <p className="text-xs text-muted-foreground">
                  可选，用于标识节点的公网访问地址
                </p>
              </div>

              {/* 隧道地址 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="tunnelAddress">隧道地址</Label>
                <Input
                  id="tunnelAddress"
                  value={formData.tunnelAddress || ''}
                  onChange={(e) => handleChange('tunnelAddress', e.target.value)}
                  placeholder="例如：10.0.0.1 或 internal.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  若 Agent 可能作为 relay/exit 角色，需配置此地址（IP 或主机名，不含端口）
                </p>
              </div>

              {/* 备注 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="remark">备注</Label>
                <Textarea
                  id="remark"
                  rows={3}
                  value={formData.remark || ''}
                  onChange={(e) => handleChange('remark', e.target.value)}
                />
              </div>

              {/* 资源组 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="groupSid">资源组</Label>
                <Select
                  value={formData.groupSid ?? '__none__'}
                  onValueChange={(value) => handleChange('groupSid', value === '__none__' ? '' : value)}
                  disabled={isLoadingGroups}
                >
                  <SelectTrigger id="groupSid">
                    <SelectValue placeholder={isLoadingGroups ? '加载中...' : '选择资源组'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">不关联资源组</SelectItem>
                    {resourceGroups.map((group) => (
                      <SelectItem key={group.sid} value={group.sid}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  可选，将转发节点关联到资源组
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        <DialogFooter className="flex-shrink-0">
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
