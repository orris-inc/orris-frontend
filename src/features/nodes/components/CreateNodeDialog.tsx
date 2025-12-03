/**
 * 创建节点对话框组件
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
import type { CreateNodeRequest } from '@/api/node';

interface CreateNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNodeRequest) => void;
}

// 常用加密方法
const ENCRYPTION_METHODS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'aes-128-cfb',
  'aes-256-cfb',
] as const;

export const CreateNodeDialog: React.FC<CreateNodeDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateNodeRequest>({
    name: '',
    protocol: 'shadowsocks',
    serverAddress: '',
    serverPort: 8388,
    encryptionMethod: 'aes-256-gcm',
    description: '',
    region: '',
    sortOrder: 0,
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData({
      name: '',
      protocol: 'shadowsocks',
      serverAddress: '',
      serverPort: 8388,
      encryptionMethod: 'aes-256-gcm',
      description: '',
      region: '',
      sortOrder: 0,
      tags: [],
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field: keyof CreateNodeRequest, value: string | number) => {
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

    if (!formData.serverAddress.trim()) {
      newErrors.serverAddress = '服务器地址不能为空';
    }

    if (!formData.serverPort || formData.serverPort < 1 || formData.serverPort > 65535) {
      newErrors.serverPort = '端口必须在1-65535之间';
    }

    if (!formData.protocol) {
      newErrors.protocol = '协议类型不能为空';
    }

    if (!formData.encryptionMethod) {
      newErrors.encryptionMethod = '加密方法不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // 清理undefined和空字符串
      const submitData: CreateNodeRequest = {
        name: formData.name.trim(),
        protocol: formData.protocol,
        serverAddress: formData.serverAddress.trim(),
        serverPort: formData.serverPort,
        encryptionMethod: formData.encryptionMethod,
      };

      if (formData.description?.trim()) {
        submitData.description = formData.description.trim();
      }
      if (formData.region?.trim()) {
        submitData.region = formData.region.trim();
      }
      if (formData.sortOrder !== undefined) {
        submitData.sortOrder = formData.sortOrder;
      }

      onSubmit(submitData);
      handleClose();
    }
  };

  const isFormValid = formData.name.trim() &&
                      formData.protocol &&
                      formData.serverAddress.trim() &&
                      formData.serverPort &&
                      formData.encryptionMethod;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>新增节点</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onValueChange={(value) => handleChange('protocol', value)}
            >
              <SelectTrigger id="protocol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shadowsocks">Shadowsocks</SelectItem>
                <SelectItem value="trojan">Trojan</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {errors.protocol || '必填项'}
            </p>
          </div>

          {/* 服务器地址 */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="serverAddress">
              服务器地址 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="serverAddress"
              placeholder="example.com 或 IP 地址"
              value={formData.serverAddress}
              onChange={(e) => handleChange('serverAddress', e.target.value)}
              error={!!errors.serverAddress}
            />
            <p className="text-xs text-muted-foreground">
              {errors.serverAddress || '必填项'}
            </p>
          </div>

          {/* 端口 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="serverPort">
              端口 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="serverPort"
              type="number"
              min={1}
              max={65535}
              value={formData.serverPort}
              onChange={(e) => handleChange('serverPort', parseInt(e.target.value, 10))}
              error={!!errors.serverPort}
            />
            <p className="text-xs text-muted-foreground">
              {errors.serverPort || '必填项，1-65535'}
            </p>
          </div>

          {/* 加密方法 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="encryptionMethod">
              加密方法 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.encryptionMethod}
              onValueChange={(value) => handleChange('encryptionMethod', value)}
            >
              <SelectTrigger id="encryptionMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENCRYPTION_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {errors.encryptionMethod || '必填项'}
            </p>
          </div>

          {/* 地区 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="region">地区</Label>
            <Input
              id="region"
              placeholder="例如：东京"
              value={formData.region}
              onChange={(e) => handleChange('region', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">可选</p>
          </div>

          {/* 排序顺序 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sortOrder">排序顺序</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => handleChange('sortOrder', parseInt(e.target.value, 10) || 0)}
            />
            <p className="text-xs text-muted-foreground">数字越小越靠前</p>
          </div>

          {/* 描述 */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              rows={2}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
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
