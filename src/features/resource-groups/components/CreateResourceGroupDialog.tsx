/**
 * 创建资源组对话框
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import type { CreateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface CreateResourceGroupDialogProps {
  open: boolean;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSubmit: (data: CreateResourceGroupRequest) => Promise<void>;
}

interface FormData {
  name: string;
  planId: string;
  description: string;
}

const getDefaultFormData = (): FormData => ({
  name: '',
  planId: '',
  description: '',
});

export const CreateResourceGroupDialog: React.FC<CreateResourceGroupDialogProps> = ({
  open,
  plans,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);

  // Reset form
  useEffect(() => {
    if (open) {
      setFormData(getDefaultFormData());
    }
  }, [open]);

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.planId) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name,
        planId: formData.planId,
        description: formData.description || undefined,
      });
      onClose();
      setFormData(getDefaultFormData());
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const isValid = formData.name.trim() !== '' && formData.planId !== '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建资源组</DialogTitle>
          <DialogDescription>
            填写以下信息创建新的资源组
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <Label htmlFor="planId">
              关联计划 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.planId}
              onValueChange={(value) => handleChange('planId', value)}
              disabled={loading}
            >
              <SelectTrigger id="planId">
                <SelectValue placeholder="选择关联的订阅计划" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name}
                    <span className="ml-2 text-muted-foreground">({plan.slug})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {loading ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
