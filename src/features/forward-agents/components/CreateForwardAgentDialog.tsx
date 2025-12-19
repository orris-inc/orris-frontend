/**
 * 创建转发节点对话框组件
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
import type { CreateForwardAgentRequest } from '@/api/forward';

interface CreateForwardAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardAgentRequest) => Promise<void>;
  /** 初始数据，用于复制节点时预填充表单 */
  initialData?: Partial<CreateForwardAgentRequest>;
}

// 默认表单数据
const getDefaultFormData = (): CreateForwardAgentRequest => ({
  name: '',
  remark: '',
});

export const CreateForwardAgentDialog: React.FC<CreateForwardAgentDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateForwardAgentRequest>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当 initialData 变化时更新表单数据
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        ...getDefaultFormData(),
        ...initialData,
      });
    } else if (open && !initialData) {
      setFormData(getDefaultFormData());
    }
  }, [open, initialData]);

  const handleClose = () => {
    setFormData(getDefaultFormData());
    setErrors({});
    onClose();
  };

  const handleChange = (field: keyof CreateForwardAgentRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
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

    if (!formData.name.trim()) {
      newErrors.name = '节点名称不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      // 清理undefined和空字符串
      const submitData: CreateForwardAgentRequest = {
        name: formData.name.trim(),
      };

      if (formData.remark?.trim()) {
        submitData.remark = formData.remark.trim();
      }

      setIsSubmitting(true);
      try {
        await onSubmit(submitData);
        // 提交成功后重置表单
        setFormData({ name: '', remark: '' });
        setErrors({});
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isFormValid = formData.name.trim();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? '复制转发节点' : '新增转发节点'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          {/* 节点名称 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              节点名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              autoFocus
              placeholder="例如：主转发节点"
            />
            <p className="text-xs text-muted-foreground">
              {errors.name || '必填项'}
            </p>
          </div>

          {/* 备注 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="remark">备注</Label>
            <Textarea
              id="remark"
              rows={3}
              value={formData.remark}
              onChange={(e) => handleChange('remark', e.target.value)}
              placeholder="可选：添加备注说明"
            />
            <p className="text-xs text-muted-foreground">可选</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
