/**
 * 编辑资源组对话框
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Label } from '@/components/common/Label';
import type { ResourceGroup, UpdateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface EditResourceGroupDialogProps {
  open: boolean;
  resourceGroup: ResourceGroup | null;
  plansMap: Record<string, SubscriptionPlan>;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateResourceGroupRequest) => Promise<void>;
}

interface FormData {
  name: string;
  description: string;
}

export const EditResourceGroupDialog: React.FC<EditResourceGroupDialogProps> = ({
  open,
  resourceGroup,
  plansMap,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (open && resourceGroup) {
      setFormData({
        name: resourceGroup.name,
        description: resourceGroup.description || '',
      });
    }
  }, [open, resourceGroup]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!resourceGroup || !formData.name) {
      return;
    }

    setLoading(true);
    try {
      const submitData: UpdateResourceGroupRequest = {
        name: formData.name,
        description: formData.description || undefined,
      };
      await onSubmit(resourceGroup.id, submitData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const plan = resourceGroup ? plansMap[resourceGroup.planId] : null;
  const isValid = formData.name.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑资源组</DialogTitle>
          <DialogDescription>
            修改资源组信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 只读信息 */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono">{resourceGroup?.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SID</span>
              <span className="font-mono text-xs">{resourceGroup?.sid}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">关联计划</span>
              <span>{plan?.name || `计划 #${resourceGroup?.planId}`}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              资源组名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="输入资源组名称"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="输入资源组描述（可选）"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
