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
import { Label } from '@/components/common/Label';
import { Separator } from '@/components/common/Separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import type { Node, UpdateNodeRequest, TransportProtocol } from '@/api/node';

interface EditNodeDialogProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateNodeRequest) => void;
}

// Shadowsocks 加密方法
const SS_ENCRYPTION_METHODS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'aes-128-cfb',
  'aes-256-cfb',
] as const;

// Trojan 传输协议
const TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc'];

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
      setFormData({
        name: node.name,
        serverAddress: node.serverAddress,
        agentPort: node.agentPort,
        subscriptionPort: node.subscriptionPort,
        encryptionMethod: node.encryptionMethod,
        region: node.region,
        status: node.status,
        sortOrder: node.sortOrder,
        // Trojan 相关字段
        transportProtocol: node.transportProtocol,
        host: node.host,
        path: node.path,
        sni: node.sni,
        allowInsecure: node.allowInsecure,
      });
      setErrors({});
    }
  }, [node]);

  const isShadowsocks = node?.protocol === 'shadowsocks';
  const isTrojan = node?.protocol === 'trojan';
  const showWsFields = isTrojan && formData.transportProtocol === 'ws';
  const showGrpcFields = isTrojan && formData.transportProtocol === 'grpc';

  const handleChange = (field: keyof UpdateNodeRequest, value: string | number | boolean | undefined) => {
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

    if (formData.agentPort !== undefined && (formData.agentPort < 1 || formData.agentPort > 65535)) {
      newErrors.agentPort = '端口必须在1-65535之间';
    }

    if (formData.subscriptionPort !== undefined && (formData.subscriptionPort < 1 || formData.subscriptionPort > 65535)) {
      newErrors.subscriptionPort = '端口必须在1-65535之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (node && validate()) {
      // 只提交有变化的字段
      const updates: UpdateNodeRequest = {};

      if (formData.name !== node.name) updates.name = formData.name;
      if (formData.serverAddress !== node.serverAddress) updates.serverAddress = formData.serverAddress;
      if (formData.agentPort !== node.agentPort) updates.agentPort = formData.agentPort;
      if (formData.subscriptionPort !== node.subscriptionPort) updates.subscriptionPort = formData.subscriptionPort;
      if (formData.encryptionMethod !== node.encryptionMethod) updates.encryptionMethod = formData.encryptionMethod;
      if (formData.region !== node.region) updates.region = formData.region;
      if (formData.status !== node.status) updates.status = formData.status;
      if (formData.sortOrder !== node.sortOrder) updates.sortOrder = formData.sortOrder;

      // Trojan 相关字段
      if (isTrojan) {
        if (formData.transportProtocol !== undefined) {
          updates.transportProtocol = formData.transportProtocol;
        }
        if (formData.sni !== undefined) {
          updates.sni = formData.sni || undefined;
        }
        if (formData.host !== undefined) {
          updates.host = formData.host || undefined;
        }
        if (formData.path !== undefined) {
          updates.path = formData.path || undefined;
        }
        if (formData.allowInsecure !== undefined) {
          updates.allowInsecure = formData.allowInsecure;
        }
      }

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

              {/* 代理端口 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="agentPort">代理端口</Label>
                <Input
                  id="agentPort"
                  type="number"
                  min={1}
                  max={65535}
                  value={formData.agentPort || ''}
                  onChange={(e) => handleChange('agentPort', parseInt(e.target.value, 10))}
                  error={!!errors.agentPort}
                />
                {errors.agentPort && (
                  <p className="text-xs text-destructive">{errors.agentPort}</p>
                )}
              </div>

              {/* 订阅端口 */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="subscriptionPort">订阅端口</Label>
                <Input
                  id="subscriptionPort"
                  type="number"
                  min={1}
                  max={65535}
                  placeholder="默认使用代理端口"
                  value={formData.subscriptionPort ?? ''}
                  onChange={(e) => handleChange('subscriptionPort', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  error={!!errors.subscriptionPort}
                />
                {errors.subscriptionPort && (
                  <p className="text-xs text-destructive">{errors.subscriptionPort}</p>
                )}
              </div>

              {/* Shadowsocks 加密方法 */}
              {isShadowsocks && (
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
                      {SS_ENCRYPTION_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Trojan 传输协议 */}
              {isTrojan && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="transportProtocol">传输协议</Label>
                  <Select
                    value={formData.transportProtocol || 'tcp'}
                    onValueChange={(value) => handleChange('transportProtocol', value)}
                  >
                    <SelectTrigger id="transportProtocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_PROTOCOLS.map((protocol) => (
                        <SelectItem key={protocol} value={protocol}>
                          {protocol.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Trojan SNI */}
              {isTrojan && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sni">SNI</Label>
                  <Input
                    id="sni"
                    placeholder="TLS Server Name Indication"
                    value={formData.sni || ''}
                    onChange={(e) => handleChange('sni', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">可选</p>
                </div>
              )}

              {/* WebSocket Host */}
              {showWsFields && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    placeholder="WebSocket Host Header"
                    value={formData.host || ''}
                    onChange={(e) => handleChange('host', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">可选</p>
                </div>
              )}

              {/* WebSocket Path */}
              {showWsFields && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="path">Path</Label>
                  <Input
                    id="path"
                    placeholder="/path"
                    value={formData.path || ''}
                    onChange={(e) => handleChange('path', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">可选</p>
                </div>
              )}

              {/* gRPC Service Name */}
              {showGrpcFields && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="grpcHost">Service Name</Label>
                  <Input
                    id="grpcHost"
                    placeholder="gRPC Service Name"
                    value={formData.host || ''}
                    onChange={(e) => handleChange('host', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">可选</p>
                </div>
              )}

              {/* Trojan Allow Insecure */}
              {isTrojan && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="allowInsecure">TLS 安全</Label>
                  <Select
                    value={formData.allowInsecure ? 'true' : 'false'}
                    onValueChange={(value) => handleChange('allowInsecure', value === 'true')}
                  >
                    <SelectTrigger id="allowInsecure">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">验证证书（安全）</SelectItem>
                      <SelectItem value="true">跳过验证（不安全）</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">自签名证书可选择跳过验证</p>
                </div>
              )}

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
