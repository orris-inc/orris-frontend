/**
 * 编辑节点对话框组件
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
import type { Node, UpdateNodeRequest } from '@/api/node';

interface EditNodeDialogProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateNodeRequest) => void;
}

// 常用加密方法
const ENCRYPTION_METHODS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'aes-128-cfb',
  'aes-256-cfb',
] as const;

export const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
  open,
  node,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdateNodeRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (node) {
      // 如果节点状态是error，默认设置为inactive（因为UpdateNodeRequest不支持error状态）
      const editableStatus = node.status === 'error' ? 'inactive' : node.status as 'active' | 'inactive' | 'maintenance';

      setFormData({
        name: node.name,
        description: node.description,
        serverAddress: node.serverAddress,
        serverPort: node.serverPort,
        encryptionMethod: node.encryptionMethod,
        region: node.region,
        status: editableStatus,
        sortOrder: node.sortOrder,
      });
      setErrors({});
    }
  }, [node]);

  const handleChange = (field: keyof UpdateNodeRequest, value: string | number) => {
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

    if (formData.serverAddress !== undefined && !formData.serverAddress.trim()) {
      newErrors.serverAddress = '服务器地址不能为空';
    }

    if (formData.serverPort !== undefined && (formData.serverPort < 1 || formData.serverPort > 65535)) {
      newErrors.serverPort = '端口必须在1-65535之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (node && validate()) {
      // 只提交有变化的字段
      const updates: UpdateNodeRequest = {};

      if (formData.name !== node.name) updates.name = formData.name;
      if (formData.description !== node.description) updates.description = formData.description;
      if (formData.serverAddress !== node.serverAddress) updates.serverAddress = formData.serverAddress;
      if (formData.serverPort !== node.serverPort) updates.serverPort = formData.serverPort;
      if (formData.encryptionMethod !== node.encryptionMethod) updates.encryptionMethod = formData.encryptionMethod;
      if (formData.region !== node.region) updates.region = formData.region;
      if (formData.status !== node.status) updates.status = formData.status as any;
      if (formData.sortOrder !== node.sortOrder) updates.sortOrder = formData.sortOrder;

      // 如果有任何变化，提交更新
      if (Object.keys(updates).length > 0) {
        onSubmit(node.id, updates);
      }
    }
  };

  // 检查是否有变化
  const hasChanges = node && Object.keys(formData).some(
    (key) => formData[key as keyof UpdateNodeRequest] !== node[key as keyof Node]
  );

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑节点</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 节点基本信息（只读） */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">基本信息</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="node_id">节点ID</Label>
                <Input id="node_id" value={node.id} disabled />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="createdAt">创建时间</Label>
                <Input
                  id="createdAt"
                  value={new Date(node.createdAt).toLocaleString('zh-CN')}
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

              {/* 协议类型（只读） */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="protocol">协议类型</Label>
                <Input
                  id="protocol"
                  value={node.protocol === 'shadowsocks' ? 'Shadowsocks' : 'Trojan'}
                  disabled
                />
                <p className="text-xs text-muted-foreground">协议创建后不可修改</p>
              </div>

              {/* 状态 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status || 'inactive'}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">激活</SelectItem>
                    <SelectItem value="inactive">未激活</SelectItem>
                    <SelectItem value="maintenance">维护中</SelectItem>
                  </SelectContent>
                </Select>
                {node.status === 'error' && (
                  <p className="text-xs text-muted-foreground">
                    原状态为错误，已自动设置为未激活
                  </p>
                )}
              </div>

              {/* 服务器地址 */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="serverAddress">服务器地址</Label>
                <Input
                  id="serverAddress"
                  value={formData.serverAddress || ''}
                  onChange={(e) => handleChange('serverAddress', e.target.value)}
                  error={!!errors.serverAddress}
                />
                {errors.serverAddress && (
                  <p className="text-xs text-destructive">{errors.serverAddress}</p>
                )}
              </div>

              {/* 端口 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="serverPort">端口</Label>
                <Input
                  id="serverPort"
                  type="number"
                  min={1}
                  max={65535}
                  value={formData.serverPort || ''}
                  onChange={(e) => handleChange('serverPort', parseInt(e.target.value, 10))}
                  error={!!errors.serverPort}
                />
                {errors.serverPort && (
                  <p className="text-xs text-destructive">{errors.serverPort}</p>
                )}
              </div>

              {/* 加密方法 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="encryptionMethod">加密方法</Label>
                <Select
                  value={formData.encryptionMethod || ''}
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
              </div>

              {/* 地区 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="region">地区</Label>
                <Input
                  id="region"
                  value={formData.region || ''}
                  onChange={(e) => handleChange('region', e.target.value)}
                />
              </div>

              {/* 排序顺序 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="sortOrder">排序顺序</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder ?? 0}
                  onChange={(e) => handleChange('sortOrder', parseInt(e.target.value, 10) || 0)}
                />
              </div>

              {/* 描述 */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  rows={2}
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
