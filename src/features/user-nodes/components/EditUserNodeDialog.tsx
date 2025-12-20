/**
 * Edit user node dialog component
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
import { Label } from '@/components/common/Label';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import type { UserNode, UpdateUserNodeRequest } from '@/api/node';

interface EditUserNodeDialogProps {
  open: boolean;
  node: UserNode | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateUserNodeRequest) => Promise<void>;
}

interface FormData {
  name: string;
  serverAddress: string;
  agentPort: string;
  subscriptionPort: string;
}

export const EditUserNodeDialog: React.FC<EditUserNodeDialogProps> = ({
  open,
  node,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    serverAddress: '',
    agentPort: '',
    subscriptionPort: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Initialize form when node changes
  useEffect(() => {
    if (node) {
      setFormData({
        name: node.name,
        serverAddress: node.serverAddress,
        agentPort: String(node.agentPort),
        subscriptionPort: node.subscriptionPort ? String(node.subscriptionPort) : '',
      });
      setErrors({});
    }
  }, [node]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入节点名称';
    }
    if (!formData.serverAddress.trim()) {
      newErrors.serverAddress = '请输入服务器地址';
    }
    if (!formData.agentPort || isNaN(Number(formData.agentPort)) || Number(formData.agentPort) <= 0) {
      newErrors.agentPort = '请输入有效的端口号';
    }
    if (formData.subscriptionPort && (isNaN(Number(formData.subscriptionPort)) || Number(formData.subscriptionPort) <= 0)) {
      newErrors.subscriptionPort = '请输入有效的端口号';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!node || !validate()) return;

    setLoading(true);
    try {
      // Only submit changed fields
      const updates: UpdateUserNodeRequest = {};

      if (formData.name.trim() !== node.name) {
        updates.name = formData.name.trim();
      }
      if (formData.serverAddress.trim() !== node.serverAddress) {
        updates.serverAddress = formData.serverAddress.trim();
      }
      if (Number(formData.agentPort) !== node.agentPort) {
        updates.agentPort = Number(formData.agentPort);
      }
      const newSubscriptionPort = formData.subscriptionPort ? Number(formData.subscriptionPort) : undefined;
      if (newSubscriptionPort !== node.subscriptionPort) {
        updates.subscriptionPort = newSubscriptionPort;
      }

      // Only submit if there are changes
      if (Object.keys(updates).length > 0) {
        await onSubmit(node.id, updates);
      }
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

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑节点</DialogTitle>
          <DialogDescription>
            修改节点的基本信息。协议相关配置不可修改。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Read-only info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">只读信息</h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">协议：</span>
                <Badge variant="outline" className="ml-2">
                  {node.protocol === 'shadowsocks' ? 'Shadowsocks' : 'Trojan'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">状态：</span>
                <Badge
                  variant={node.status === 'active' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {node.status === 'active' ? '活跃' : node.status === 'inactive' ? '停用' : '维护中'}
                </Badge>
              </div>
              {node.encryptionMethod && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">加密方法：</span>
                  <span className="font-mono ml-2">{node.encryptionMethod}</span>
                </div>
              )}
              {node.transportProtocol && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">传输协议：</span>
                  <span className="ml-2">{node.transportProtocol.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">可编辑信息</h3>
            <Separator />

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">
                  节点名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={loading}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="serverAddress">
                  服务器地址 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="serverAddress"
                  value={formData.serverAddress}
                  onChange={(e) => handleChange('serverAddress', e.target.value)}
                  disabled={loading}
                />
                {errors.serverAddress && <p className="text-xs text-destructive">{errors.serverAddress}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="agentPort">
                    Agent 端口 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="agentPort"
                    type="number"
                    min="1"
                    max="65535"
                    value={formData.agentPort}
                    onChange={(e) => handleChange('agentPort', e.target.value)}
                    disabled={loading}
                  />
                  {errors.agentPort && <p className="text-xs text-destructive">{errors.agentPort}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="subscriptionPort">订阅端口</Label>
                  <Input
                    id="subscriptionPort"
                    type="number"
                    min="1"
                    max="65535"
                    value={formData.subscriptionPort}
                    onChange={(e) => handleChange('subscriptionPort', e.target.value)}
                    placeholder="留空则使用 Agent 端口"
                    disabled={loading}
                  />
                  {errors.subscriptionPort && <p className="text-xs text-destructive">{errors.subscriptionPort}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
