/**
 * Edit node dialog component
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { Badge } from '@/components/common/Badge';
import type { Node, UpdateNodeRequest, TransportProtocol, RouteConfig } from '@/api/node';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { RouteConfigEditor } from './RouteConfigEditor';
import type { OutboundNodeOption } from './RouteRuleEditor';

interface EditNodeDialogProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateNodeRequest) => void;
  /** Available nodes for route outbound selection */
  nodes?: OutboundNodeOption[];
}

// Shadowsocks encryption methods
const SS_ENCRYPTION_METHODS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
  '2022-blake3-chacha20-poly1305',
] as const;

// Trojan transport protocols
const TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc'];

// Helper function: convert pluginOpts object to string
const pluginOptsToString = (opts?: Record<string, string>): string => {
  if (!opts || Object.keys(opts).length === 0) return '';
  return Object.entries(opts)
    .map(([key, value]) => `${key}=${value}`)
    .join(';');
};

// Helper function: parse string to pluginOpts object
const stringToPluginOpts = (str: string): Record<string, string> | undefined => {
  const trimmed = str.trim();
  if (!trimmed) return undefined;

  const opts: Record<string, string> = {};
  const pairs = trimmed.split(';');

  for (const pair of pairs) {
    const trimmedPair = pair.trim();
    if (!trimmedPair) continue;

    const [key, ...valueParts] = trimmedPair.split('=');
    const trimmedKey = key?.trim();
    const value = valueParts.join('=').trim(); // Support '=' in values

    if (trimmedKey && value) {
      opts[trimmedKey] = value;
    }
  }

  return Object.keys(opts).length > 0 ? opts : undefined;
};

// Helper function: deep comparison of two pluginOpts objects
const arePluginOptsEqual = (
  opts1?: Record<string, string>,
  opts2?: Record<string, string>
): boolean => {
  // Both are empty
  if ((!opts1 || Object.keys(opts1).length === 0) &&
      (!opts2 || Object.keys(opts2).length === 0)) {
    return true;
  }

  // One is empty, one is not
  if (!opts1 || !opts2) return false;

  const keys1 = Object.keys(opts1);
  const keys2 = Object.keys(opts2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => opts1[key] === opts2[key]);
};


export const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
  open,
  node,
  onClose,
  onSubmit,
  nodes = [],
}) => {
  const [formData, setFormData] = useState<UpdateNodeRequest & { tagsInput: string }>({ tagsInput: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pluginOptsStr, setPluginOptsStr] = useState<string>('');

  // Fetch resource groups list
  const { resourceGroups, isLoading: isLoadingGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

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
        tags: node.tags,
        tagsInput: node.tags?.join(', ') ?? '',
        // Shadowsocks plugin related fields
        plugin: node.plugin,
        pluginOpts: node.pluginOpts,
        // Trojan related fields
        transportProtocol: node.transportProtocol,
        host: node.host,
        path: node.path,
        sni: node.sni,
        allowInsecure: node.allowInsecure,
        // Route configuration
        route: node.route,
        // Resource group (use first group if exists)
        groupSid: node.groupIds?.[0] ?? '',
      });
      setPluginOptsStr(pluginOptsToString(node.pluginOpts));
      setErrors({});
    }
  }, [node]);

  const isShadowsocks = node?.protocol === 'shadowsocks';
  const isTrojan = node?.protocol === 'trojan';
  const showWsFields = isTrojan && formData.transportProtocol === 'ws';
  const showGrpcFields = isTrojan && formData.transportProtocol === 'grpc';

  const handleChange = (field: keyof UpdateNodeRequest | 'tagsInput', value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePluginOptsChange = (value: string) => {
    setPluginOptsStr(value);
    const parsedOpts = stringToPluginOpts(value);
    setFormData((prev) => ({ ...prev, pluginOpts: parsedOpts }));
    if (errors.pluginOpts) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.pluginOpts;
        return newErrors;
      });
    }
  };

  const handleRouteChange = (route: RouteConfig | undefined) => {
    setFormData((prev) => ({ ...prev, route }));
  };

  const handleSubmit = () => {
    if (!node) return;

    // Build update object to submit
    const updates: UpdateNodeRequest = {};
    const newErrors: Record<string, string> = {};

    // Helper function: normalize strings for comparison (compare after trim, treat empty string and undefined as same)
    const hasStringChanged = (newValue: string | undefined, oldValue: string | undefined): boolean => {
      const normalizedNew = (newValue || '').trim();
      const normalizedOld = (oldValue || '').trim();
      return normalizedNew !== normalizedOld;
    };

    // Only process changed fields
    if (formData.name !== undefined && hasStringChanged(formData.name, node.name)) {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        newErrors.name = '节点名称不能为空';
      } else {
        updates.name = trimmedName;
      }
    }

    if (formData.serverAddress !== undefined && hasStringChanged(formData.serverAddress, node.serverAddress)) {
      // Backend supports empty server address, allow empty string
      const trimmedAddress = formData.serverAddress.trim();
      updates.serverAddress = trimmedAddress;
    }

    if (formData.agentPort !== node.agentPort && formData.agentPort !== undefined) {
      if (formData.agentPort < 1 || formData.agentPort > 65535) {
        newErrors.agentPort = '端口必须在1-65535之间';
      } else {
        updates.agentPort = formData.agentPort;
      }
    }

    if (formData.subscriptionPort !== node.subscriptionPort && formData.subscriptionPort !== undefined) {
      if (formData.subscriptionPort < 1 || formData.subscriptionPort > 65535) {
        newErrors.subscriptionPort = '端口必须在1-65535之间';
      } else {
        updates.subscriptionPort = formData.subscriptionPort;
      }
    }

    if (formData.encryptionMethod !== node.encryptionMethod && formData.encryptionMethod !== undefined) {
      updates.encryptionMethod = formData.encryptionMethod;
    }

    // Shadowsocks plugin fields
    if (isShadowsocks) {
      if (formData.plugin !== undefined && hasStringChanged(formData.plugin, node.plugin)) {
        updates.plugin = formData.plugin.trim() || undefined;
      }
      if (!arePluginOptsEqual(formData.pluginOpts, node.pluginOpts)) {
        updates.pluginOpts = formData.pluginOpts;
      }
    }

    if (formData.region !== undefined && hasStringChanged(formData.region, node.region)) {
      updates.region = formData.region.trim() || undefined;
    }

    if (formData.status !== node.status && formData.status !== undefined) {
      updates.status = formData.status;
    }

    if (formData.sortOrder !== node.sortOrder && formData.sortOrder !== undefined) {
      updates.sortOrder = formData.sortOrder;
    }

    // Trojan related fields
    if (isTrojan) {
      if (formData.transportProtocol !== node.transportProtocol && formData.transportProtocol !== undefined) {
        updates.transportProtocol = formData.transportProtocol;
      }
      if (formData.sni !== undefined && hasStringChanged(formData.sni, node.sni)) {
        updates.sni = formData.sni?.trim() || undefined;
      }
      if (formData.host !== undefined && hasStringChanged(formData.host, node.host)) {
        updates.host = formData.host?.trim() || undefined;
      }
      if (formData.path !== undefined && hasStringChanged(formData.path, node.path)) {
        updates.path = formData.path?.trim() || undefined;
      }
      if (formData.allowInsecure !== node.allowInsecure && formData.allowInsecure !== undefined) {
        updates.allowInsecure = formData.allowInsecure;
      }
    }

    // Resource group association - only send if changed
    const originalGroupSid = node.groupIds?.[0] ?? '';
    if (formData.groupSid !== undefined && formData.groupSid !== originalGroupSid) {
      updates.groupSid = formData.groupSid;
    }

    // Tags - parse tagsInput and compare with original
    const newTags = formData.tagsInput
      ? formData.tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];
    const originalTags = node.tags ?? [];
    const tagsChanged = JSON.stringify(newTags.sort()) !== JSON.stringify([...originalTags].sort());
    if (tagsChanged) {
      updates.tags = newTags.length > 0 ? newTags : undefined;
    }

    // Route configuration - compare JSON to detect changes
    const routeChanged = JSON.stringify(formData.route) !== JSON.stringify(node.route);
    if (routeChanged) {
      // Use null to clear route, undefined means no change
      updates.route = formData.route === undefined ? null : formData.route;
    }

    // If there are validation errors, display and prevent submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    if (Object.keys(updates).length > 0) {
      onSubmit(node.id, updates);
    }
  };

  // Check if there are changes
  const hasChanges = node && Object.keys(formData).some(
    (key) => formData[key as keyof UpdateNodeRequest] !== node[key as keyof Node]
  );

  // Check if protocol settings are configured
  const hasProtocolSettings = isShadowsocks
    ? Boolean(formData.plugin || pluginOptsStr)
    : Boolean(formData.sni || formData.host || formData.path || formData.allowInsecure);

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>编辑节点</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <Accordion
            type="multiple"
            defaultValue={['basic', 'network']}
            className="w-full"
          >
            {/* 基本信息 */}
            <AccordionItem value="basic" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">基本信息</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 节点ID（只读） */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="node_id">节点ID</Label>
                    <Input id="node_id" value={node.id} disabled />
                  </div>

                  {/* 创建时间（只读） */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="createdAt">创建时间</Label>
                    <Input
                      id="createdAt"
                      value={new Date(node.createdAt).toLocaleString('zh-CN')}
                      disabled
                    />
                  </div>

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
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 网络配置 */}
            <AccordionItem value="network" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">网络配置</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 协议配置 */}
            <AccordionItem value="protocol" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isShadowsocks ? 'Shadowsocks 配置' : 'Trojan 配置'}
                  </span>
                  {hasProtocolSettings && (
                    <Badge variant="secondary" className="text-xs">已配置</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shadowsocks 插件 */}
                  {isShadowsocks && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="plugin">插件</Label>
                        <Input
                          id="plugin"
                          placeholder="例如：obfs-local, v2ray-plugin"
                          value={formData.plugin || ''}
                          onChange={(e) => handleChange('plugin', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          可选，Shadowsocks 混淆插件
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="pluginOpts">插件选项</Label>
                        <Input
                          id="pluginOpts"
                          placeholder="例如：obfs=http;obfs-host=www.bing.com"
                          value={pluginOptsStr}
                          onChange={(e) => handlePluginOptsChange(e.target.value)}
                          error={!!errors.pluginOpts}
                        />
                        {errors.pluginOpts && (
                          <p className="text-xs text-destructive">{errors.pluginOpts}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          可选，格式：key1=value1;key2=value2
                        </p>
                      </div>
                    </>
                  )}

                  {/* Trojan 配置 */}
                  {isTrojan && (
                    <>
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
                        <p className="text-xs text-muted-foreground">自签名证书可跳过验证</p>
                      </div>

                      {/* WebSocket 配置 */}
                      {showWsFields && (
                        <>
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
                        </>
                      )}

                      {/* gRPC 配置 */}
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
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 其他设置 */}
            <AccordionItem value="other" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">其他设置</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-xs text-muted-foreground">数字越小越靠前</p>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="tagsInput">标签</Label>
                    <Input
                      id="tagsInput"
                      placeholder="例如：高速, 香港, 优选"
                      value={formData.tagsInput ?? ''}
                      onChange={(e) => handleChange('tagsInput', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      可选，多个标签用逗号分隔
                    </p>
                  </div>

                  {/* 资源组 */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="groupSid">资源组</Label>
                    <Select
                      value={formData.groupSid ?? '__none__'}
                      onValueChange={(value) => handleChange('groupSid', value === '__none__' ? '' : value)}
                      disabled={isLoadingGroups}
                    >
                      <SelectTrigger id="groupSid">
                        <SelectValue placeholder={isLoadingGroups ? '加载中...' : '选择资源组'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">不关联资源组</SelectItem>
                        {resourceGroups.map((group) => (
                          <SelectItem key={group.sid} value={group.sid}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      可选，将节点关联到资源组
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 路由配置 */}
            <AccordionItem value="route" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">路由配置</span>
                  {formData.route && (
                    <Badge variant="secondary" className="text-xs">已配置</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <RouteConfigEditor
                  value={formData.route ?? undefined}
                  onChange={handleRouteChange}
                  idPrefix="edit-node-route"
                  nodes={nodes}
                  currentNodeId={node?.id}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-shrink-0">
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
