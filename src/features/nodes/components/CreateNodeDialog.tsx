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
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import type { CreateNodeRequest, TransportProtocol } from '@/api/node';

interface CreateNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNodeRequest) => void;
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
    region: '',
    sortOrder: 0,
    tags: [],
    // Trojan 相关字段
    transportProtocol: 'tcp',
    host: '',
    path: '',
    sni: '',
    allowInsecure: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData({
      name: '',
      protocol: 'shadowsocks',
      serverAddress: '',
      serverPort: 8388,
      encryptionMethod: 'aes-256-gcm',
      region: '',
      sortOrder: 0,
      tags: [],
      transportProtocol: 'tcp',
      host: '',
      path: '',
      sni: '',
      allowInsecure: false,
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field: keyof CreateNodeRequest, value: string | number | boolean) => {
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

  const isShadowsocks = formData.protocol === 'shadowsocks';
  const isTrojan = formData.protocol === 'trojan';
  const showWsFields = isTrojan && formData.transportProtocol === 'ws';
  const showGrpcFields = isTrojan && formData.transportProtocol === 'grpc';

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

    // Shadowsocks 需要加密方法
    if (isShadowsocks && !formData.encryptionMethod) {
      newErrors.encryptionMethod = '加密方法不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const submitData: CreateNodeRequest = {
        name: formData.name.trim(),
        protocol: formData.protocol,
        serverAddress: formData.serverAddress.trim(),
        serverPort: formData.serverPort,
      };

      // Shadowsocks 特有字段
      if (isShadowsocks && formData.encryptionMethod) {
        submitData.encryptionMethod = formData.encryptionMethod;
      }

      // Trojan 特有字段
      if (isTrojan) {
        submitData.transportProtocol = formData.transportProtocol;
        if (formData.sni?.trim()) {
          submitData.sni = formData.sni.trim();
        }
        if (formData.allowInsecure) {
          submitData.allowInsecure = formData.allowInsecure;
        }
        // WebSocket 字段
        if (showWsFields) {
          if (formData.host?.trim()) {
            submitData.host = formData.host.trim();
          }
          if (formData.path?.trim()) {
            submitData.path = formData.path.trim();
          }
        }
        // gRPC 字段
        if (showGrpcFields && formData.host?.trim()) {
          submitData.host = formData.host.trim();
        }
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
                      (isTrojan || formData.encryptionMethod);

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

          {/* Shadowsocks 加密方法 */}
          {isShadowsocks && (
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
                  {SS_ENCRYPTION_METHODS.map((method) => (
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
          )}

          {/* Trojan 传输协议 */}
          {isTrojan && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="transportProtocol">传输协议</Label>
              <Select
                value={formData.transportProtocol}
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
              <p className="text-xs text-muted-foreground">默认 TCP</p>
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
              <Label htmlFor="host">Service Name</Label>
              <Input
                id="host"
                placeholder="gRPC Service Name"
                value={formData.host || ''}
                onChange={(e) => handleChange('host', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">可选</p>
            </div>
          )}

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
