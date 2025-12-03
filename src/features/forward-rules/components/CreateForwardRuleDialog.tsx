/**
 * 创建转发规则对话框组件
 */

import { useState } from 'react';
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
import type { CreateForwardRuleRequest } from '@/api/forward';

type ForwardProtocol = 'tcp' | 'udp' | 'both';

interface CreateForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRuleRequest) => void;
}

export const CreateForwardRuleDialog: React.FC<CreateForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateForwardRuleRequest>({
    name: '',
    protocol: 'tcp',
    listenPort: 0,
    targetAddress: '',
    targetPort: 0,
    remark: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData({
      name: '',
      protocol: 'tcp',
      listenPort: 0,
      targetAddress: '',
      targetPort: 0,
      remark: '',
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field: keyof CreateForwardRuleRequest, value: string | number | ForwardProtocol) => {
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
      newErrors.name = '规则名称不能为空';
    }

    if (!formData.protocol) {
      newErrors.protocol = '协议类型不能为空';
    }

    if (!formData.listenPort || formData.listenPort < 1 || formData.listenPort > 65535) {
      newErrors.listenPort = '监听端口必须在1-65535之间';
    }

    if (!formData.targetAddress.trim()) {
      newErrors.targetAddress = '目标地址不能为空';
    }

    if (!formData.targetPort || formData.targetPort < 1 || formData.targetPort > 65535) {
      newErrors.targetPort = '目标端口必须在1-65535之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // 清理undefined和空字符串
      const submitData: CreateForwardRuleRequest = {
        name: formData.name.trim(),
        protocol: formData.protocol,
        listenPort: formData.listenPort,
        targetAddress: formData.targetAddress.trim(),
        targetPort: formData.targetPort,
      };

      if (formData.remark?.trim()) {
        submitData.remark = formData.remark.trim();
      }

      onSubmit(submitData);
      handleClose();
    }
  };

  const isFormValid = formData.name.trim() &&
                      formData.protocol &&
                      formData.listenPort > 0 &&
                      formData.targetAddress.trim() &&
                      formData.targetPort > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>新增转发规则</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {errors.name || '必填项'}
            </p>
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
            <p className="text-xs text-muted-foreground">
              {errors.protocol || '必填项'}
            </p>
          </div>

          {/* 监听端口 */}
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
            />
            <p className="text-xs text-muted-foreground">
              {errors.listenPort || '必填项，1-65535'}
            </p>
          </div>

          {/* 目标地址 */}
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
            <p className="text-xs text-muted-foreground">
              {errors.targetAddress || '必填项'}
            </p>
          </div>

          {/* 目标端口 */}
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
            />
            <p className="text-xs text-muted-foreground">
              {errors.targetPort || '必填项，1-65535'}
            </p>
          </div>

          {/* 备注 */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="remark">备注</Label>
            <Textarea
              id="remark"
              rows={2}
              value={formData.remark}
              onChange={(e) => handleChange('remark', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">可选</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
