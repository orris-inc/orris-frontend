/**
 * Create user node dialog component
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';
import { Separator } from '@/components/common/Separator';
import type {
  CreateUserNodeRequest,
  CreateUserNodeResponse,
  NodeProtocol,
  TransportProtocol,
} from '@/api/node';

interface CreateUserNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserNodeRequest) => Promise<CreateUserNodeResponse>;
  onTokenReceived: (response: CreateUserNodeResponse) => void;
}

// Shadowsocks encryption methods
const SS_METHODS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
  '2022-blake3-chacha20-poly1305',
];

// Transport protocols for Trojan
const TRANSPORT_PROTOCOLS: { value: TransportProtocol; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'grpc', label: 'gRPC' },
];

interface FormData {
  name: string;
  serverAddress: string;
  agentPort: string;
  subscriptionPort: string;
  protocol: NodeProtocol;
  // Shadowsocks
  method: string;
  plugin: string;
  pluginOpts: string;
  // Trojan
  transportProtocol: TransportProtocol;
  host: string;
  path: string;
  sni: string;
  allowInsecure: boolean;
}

const getDefaultFormData = (): FormData => ({
  name: '',
  serverAddress: '',
  agentPort: '',
  subscriptionPort: '',
  protocol: 'shadowsocks',
  method: 'aes-256-gcm',
  plugin: '',
  pluginOpts: '',
  transportProtocol: 'tcp',
  host: '',
  path: '',
  sni: '',
  allowInsecure: false,
});

export const CreateUserNodeDialog: React.FC<CreateUserNodeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  onTokenReceived,
}) => {
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getDefaultFormData());
      setErrors({});
    }
  }, [open]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
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
    if (!validate()) return;

    setLoading(true);
    try {
      const request: CreateUserNodeRequest = {
        name: formData.name.trim(),
        serverAddress: formData.serverAddress.trim() || undefined,
        agentPort: Number(formData.agentPort),
        subscriptionPort: formData.subscriptionPort ? Number(formData.subscriptionPort) : undefined,
        protocol: formData.protocol,
      };

      // Add protocol-specific fields
      if (formData.protocol === 'shadowsocks') {
        request.method = formData.method;
        if (formData.plugin.trim()) {
          request.plugin = formData.plugin.trim();
        }
        if (formData.pluginOpts.trim()) {
          try {
            request.pluginOpts = JSON.parse(formData.pluginOpts);
          } catch {
            // If not valid JSON, treat as key=value pairs
            const opts: Record<string, string> = {};
            formData.pluginOpts.split(';').forEach((pair) => {
              const [key, value] = pair.split('=');
              if (key && value) {
                opts[key.trim()] = value.trim();
              }
            });
            if (Object.keys(opts).length > 0) {
              request.pluginOpts = opts;
            }
          }
        }
      } else if (formData.protocol === 'trojan') {
        request.transportProtocol = formData.transportProtocol;
        if (formData.host.trim()) {
          request.host = formData.host.trim();
        }
        if (formData.path.trim()) {
          request.path = formData.path.trim();
        }
        if (formData.sni.trim()) {
          request.sni = formData.sni.trim();
        }
        request.allowInsecure = formData.allowInsecure;
      }

      const response = await onSubmit(request);
      onTokenReceived(response);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>创建节点</DialogTitle>
          <DialogDescription>
            填写以下信息创建新节点。创建成功后将显示节点 Token，请妥善保管。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6 py-4">
          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">基本信息</h3>
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
                  placeholder="例如：香港节点-01"
                  disabled={loading}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="serverAddress">服务器地址</Label>
                  <Input
                    id="serverAddress"
                    value={formData.serverAddress}
                    onChange={(e) => handleChange('serverAddress', e.target.value)}
                    placeholder="留空则自动检测"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">可选，留空将从 Agent 公网 IP 自动检测</p>
                </div>

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
                    placeholder="例如：8080"
                    disabled={loading}
                  />
                  {errors.agentPort && <p className="text-xs text-destructive">{errors.agentPort}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="flex flex-col gap-2">
                  <Label htmlFor="protocol">
                    协议类型 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.protocol}
                    onValueChange={(value) => handleChange('protocol', value as NodeProtocol)}
                    disabled={loading}
                  >
                    <SelectTrigger id="protocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shadowsocks">Shadowsocks</SelectItem>
                      <SelectItem value="trojan">Trojan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Shadowsocks config */}
          {formData.protocol === 'shadowsocks' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Shadowsocks 配置</h3>
              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="method">加密方法</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) => handleChange('method', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SS_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="plugin">插件名称</Label>
                  <Input
                    id="plugin"
                    value={formData.plugin}
                    onChange={(e) => handleChange('plugin', e.target.value)}
                    placeholder="例如：v2ray-plugin"
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="pluginOpts">插件参数</Label>
                  <Input
                    id="pluginOpts"
                    value={formData.pluginOpts}
                    onChange={(e) => handleChange('pluginOpts', e.target.value)}
                    placeholder="key1=value1;key2=value2"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">格式：key1=value1;key2=value2 或 JSON</p>
                </div>
              </div>
            </div>
          )}

          {/* Trojan config */}
          {formData.protocol === 'trojan' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Trojan 配置</h3>
              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="transportProtocol">传输协议</Label>
                  <Select
                    value={formData.transportProtocol}
                    onValueChange={(value) => handleChange('transportProtocol', value as TransportProtocol)}
                    disabled={loading}
                  >
                    <SelectTrigger id="transportProtocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_PROTOCOLS.map((tp) => (
                        <SelectItem key={tp.value} value={tp.value}>
                          {tp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(formData.transportProtocol === 'ws' || formData.transportProtocol === 'grpc') && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="host">
                        {formData.transportProtocol === 'ws' ? 'Host 头' : 'Service Name'}
                      </Label>
                      <Input
                        id="host"
                        value={formData.host}
                        onChange={(e) => handleChange('host', e.target.value)}
                        placeholder={formData.transportProtocol === 'ws' ? 'example.com' : 'grpc-service'}
                        disabled={loading}
                      />
                    </div>

                    {formData.transportProtocol === 'ws' && (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="path">WebSocket 路径</Label>
                        <Input
                          id="path"
                          value={formData.path}
                          onChange={(e) => handleChange('path', e.target.value)}
                          placeholder="/ws"
                          disabled={loading}
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="sni">TLS SNI</Label>
                  <Input
                    id="sni"
                    value={formData.sni}
                    onChange={(e) => handleChange('sni', e.target.value)}
                    placeholder="example.com"
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allowInsecure"
                    checked={formData.allowInsecure}
                    onCheckedChange={(checked) => handleChange('allowInsecure', checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="allowInsecure" className="cursor-pointer">
                    允许不安全的 TLS 连接
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.agentPort}>
            {loading ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
