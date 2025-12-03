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
import type { ForwardAgent, UpdateForwardAgentRequest } from '@/api/forward';

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

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
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
      // 只提交有变化的字段
      const updates: UpdateForwardAgentRequest = {};

      if (formData.name !== agent.name) updates.name = formData.name;
      if (formData.description !== agent.description) updates.description = formData.description;

      // 如果有任何变化，提交更新
      if (Object.keys(updates).length > 0) {
        onSubmit(agent.id, updates);
      }
    }
  };

  // 检查是否有变化
  const hasChanges = agent && Object.keys(formData).some(
    (key) => formData[key as keyof UpdateForwardAgentRequest] !== agent[key as keyof ForwardAgent]
  );

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑转发节点</DialogTitle>
        </DialogHeader>

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

              {agent.token && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="token">Token前缀</Label>
                  <Input
                    id="token"
                    value={agent.token}
                    disabled
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Token只在创建或重新生成时完整显示
                  </p>
                </div>
              )}
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

              {/* 备注 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">备注</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
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
