/**
 * Create node dialog component
 * Redesigned with improved UI/UX - clean visual hierarchy, icons, and better form layout
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
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { RouteConfigEditor } from './RouteConfigEditor';
import type { OutboundNodeOption } from './RouteRuleEditor';
import type { CreateNodeRequest, TransportProtocol, RouteConfig } from '@/api/node';
import {
  Server,
  Network,
  Shield,
  Settings,
  Route,
  Zap,
  Lock,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';

interface CreateNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNodeRequest) => void;
  /** Initial data for prefilling form when copying a node */
  initialData?: Partial<CreateNodeRequest>;
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

// Default form data
const getDefaultFormData = (): CreateNodeRequest & { tagsInput: string } => ({
  name: '',
  protocol: 'shadowsocks',
  serverAddress: '',
  agentPort: 8388,
  subscriptionPort: undefined,
  encryptionMethod: 'aes-256-gcm',
  region: '',
  sortOrder: 0,
  tags: [],
  tagsInput: '',
  plugin: undefined,
  pluginOpts: undefined,
  transportProtocol: 'tcp',
  host: '',
  path: '',
  sni: '',
  allowInsecure: false,
  route: undefined,
});

// Section configuration
interface SectionConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  required?: boolean;
  getBadge?: () => string | null;
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  config: SectionConfig;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  getBadgeText?: () => string | null;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  config,
  isOpen,
  onToggle,
  children,
  getBadgeText,
}) => {
  const Icon = config.icon;
  const badgeText = getBadgeText?.();

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card transition-all duration-200 hover:border-border/80">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} transition-colors`}>
            <Icon className="size-4" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{config.title}</span>
            {config.required && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                必填
              </Badge>
            )}
            {badgeText && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {badgeText}
              </Badge>
            )}
          </div>
        </div>
        <div className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="size-4" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-0">
          <Separator className="mb-4" />
          {children}
        </div>
      </div>
    </div>
  );
};

// Form Field Component for consistent styling
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  hint,
  className = '',
  children,
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <Label className="text-sm font-medium text-foreground flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {(error || hint) && (
      <p className={`text-xs flex items-center gap-1 ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
        {error && <AlertCircle className="size-3" />}
        {error || hint}
      </p>
    )}
  </div>
);

// Protocol Card Component - Compact version
interface ProtocolCardProps {
  protocol: 'shadowsocks' | 'trojan';
  selected: boolean;
  onSelect: () => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol, selected, onSelect }) => {
  const isSS = protocol === 'shadowsocks';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/30 hover:bg-accent/30'
      }`}
    >
      <div className={`p-1.5 rounded-md ${selected ? 'bg-primary/10' : 'bg-muted'} transition-colors`}>
        {isSS ? (
          <Zap className={`size-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
        ) : (
          <Lock className={`size-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
        )}
      </div>
      <div className="text-left">
        <p className={`text-sm font-medium leading-none ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
          {isSS ? 'Shadowsocks' : 'Trojan'}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {isSS ? '轻量高效' : 'TLS 加密'}
        </p>
      </div>
    </button>
  );
};

export const CreateNodeDialog: React.FC<CreateNodeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  nodes = [],
}) => {
  const [formData, setFormData] = useState<CreateNodeRequest & { tagsInput: string }>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pluginOptsString, setPluginOptsString] = useState<string>('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic', 'network']));

  // Fetch resource groups list
  const { resourceGroups, isLoading: isLoadingGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (open && initialData) {
      const tagsInput = initialData.tags?.join(', ') ?? '';
      setFormData({
        ...getDefaultFormData(),
        ...initialData,
        tagsInput,
      });
      if (initialData.pluginOpts) {
        const optsStr = Object.entries(initialData.pluginOpts)
          .map(([key, value]) => `${key}=${value}`)
          .join(';');
        setPluginOptsString(optsStr);
      } else {
        setPluginOptsString('');
      }
      // Open all sections when copying
      setOpenSections(new Set(['basic', 'network', 'protocol', 'other', 'route']));
    } else if (open && !initialData) {
      setFormData(getDefaultFormData());
      setPluginOptsString('');
      setOpenSections(new Set(['basic', 'network']));
    }
  }, [open, initialData]);

  const handleClose = () => {
    setFormData(getDefaultFormData());
    setErrors({});
    setPluginOptsString('');
    setOpenSections(new Set(['basic', 'network']));
    onClose();
  };

  const handleChange = (field: keyof CreateNodeRequest | 'tagsInput', value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRouteChange = (route: RouteConfig | undefined) => {
    setFormData((prev) => ({ ...prev, route }));
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
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

    if (!formData.agentPort || formData.agentPort < 1 || formData.agentPort > 65535) {
      newErrors.agentPort = '端口必须在1-65535之间';
    }

    if (formData.subscriptionPort !== undefined && (formData.subscriptionPort < 1 || formData.subscriptionPort > 65535)) {
      newErrors.subscriptionPort = '端口必须在1-65535之间';
    }

    if (!formData.protocol) {
      newErrors.protocol = '协议类型不能为空';
    }

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
        serverAddress: formData.serverAddress?.trim(),
        agentPort: formData.agentPort,
        subscriptionPort: formData.subscriptionPort,
      };

      if (isShadowsocks && formData.encryptionMethod) {
        submitData.encryptionMethod = formData.encryptionMethod;
      }

      if (isShadowsocks) {
        const trimmedPlugin = formData.plugin?.trim();
        if (trimmedPlugin) {
          submitData.plugin = trimmedPlugin;
        }

        const trimmedPluginOpts = pluginOptsString.trim();
        if (trimmedPluginOpts) {
          try {
            const pluginOptsObj: Record<string, string> = {};
            const pairs = trimmedPluginOpts.split(';');
            for (const pair of pairs) {
              const [key, value] = pair.split('=').map(s => s.trim());
              if (key && value) {
                pluginOptsObj[key] = value;
              }
            }
            if (Object.keys(pluginOptsObj).length > 0) {
              submitData.pluginOpts = pluginOptsObj;
            }
          } catch {
            // Plugin options parsing failed, skip
          }
        }
      }

      if (isTrojan) {
        submitData.transportProtocol = formData.transportProtocol;
        if (formData.sni?.trim()) {
          submitData.sni = formData.sni.trim();
        }
        if (formData.allowInsecure) {
          submitData.allowInsecure = formData.allowInsecure;
        }
        if (showWsFields) {
          if (formData.host?.trim()) {
            submitData.host = formData.host.trim();
          }
          if (formData.path?.trim()) {
            submitData.path = formData.path.trim();
          }
        }
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

      if (formData.tagsInput?.trim()) {
        const tags = formData.tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        if (tags.length > 0) {
          submitData.tags = tags;
        }
      }

      if (formData.route) {
        submitData.route = formData.route;
      }

      onSubmit(submitData);
      handleClose();
    }
  };

  const isFormValid = formData.name.trim() &&
                      formData.protocol &&
                      formData.agentPort &&
                      (isTrojan || formData.encryptionMethod);

  const hasProtocolSettings = isShadowsocks
    ? Boolean(formData.plugin || pluginOptsString)
    : Boolean(formData.sni || formData.host || formData.path || formData.allowInsecure);

  const hasOtherSettings = Boolean(formData.region || formData.tagsInput || formData.sortOrder);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[720px] flex flex-col max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Server className="size-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {initialData ? '复制节点' : '新增节点'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                配置代理节点的基本信息和协议参数
              </p>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {/* Basic Info Section */}
            <CollapsibleSection
              config={{ id: 'basic', title: '基本信息', icon: Server, required: true }}
              isOpen={openSections.has('basic')}
              onToggle={() => toggleSection('basic')}
            >
              <div className="space-y-5">
                {/* Node Name */}
                <FormField label="节点名称" required error={errors.name} hint="为节点设置一个易于识别的名称">
                  <Input
                    id="name"
                    placeholder="例如：香港节点-01"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    error={!!errors.name}
                    autoFocus
                    className="h-10"
                  />
                </FormField>

                {/* Protocol Selection */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    协议类型 <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <ProtocolCard
                      protocol="shadowsocks"
                      selected={isShadowsocks}
                      onSelect={() => handleChange('protocol', 'shadowsocks')}
                    />
                    <ProtocolCard
                      protocol="trojan"
                      selected={isTrojan}
                      onSelect={() => handleChange('protocol', 'trojan')}
                    />
                  </div>
                </div>

                {/* Encryption Method (Shadowsocks) */}
                {isShadowsocks && (
                  <FormField label="加密方法" required error={errors.encryptionMethod}>
                    <Select
                      value={formData.encryptionMethod}
                      onValueChange={(value) => handleChange('encryptionMethod', value)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SS_ENCRYPTION_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            <span className="font-mono text-sm">{method}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}

                {/* Transport Protocol (Trojan) */}
                {isTrojan && (
                  <FormField label="传输协议" hint="选择底层传输方式">
                    <Select
                      value={formData.transportProtocol}
                      onValueChange={(value) => handleChange('transportProtocol', value)}
                    >
                      <SelectTrigger className="h-10">
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
                  </FormField>
                )}
              </div>
            </CollapsibleSection>

            {/* Network Section */}
            <CollapsibleSection
              config={{ id: 'network', title: '网络配置', icon: Network, required: true }}
              isOpen={openSections.has('network')}
              onToggle={() => toggleSection('network')}
            >
              <div className="space-y-4">
                {/* Server Address */}
                <FormField label="服务器地址" hint="可选，留空时由 Agent 自动检测公网 IP">
                  <Input
                    id="serverAddress"
                    placeholder="example.com 或 IP 地址"
                    value={formData.serverAddress}
                    onChange={(e) => handleChange('serverAddress', e.target.value)}
                    className="h-10 font-mono"
                  />
                </FormField>

                {/* Ports */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="代理端口" required error={errors.agentPort} hint="1-65535">
                    <Input
                      id="agentPort"
                      type="number"
                      min={1}
                      max={65535}
                      value={formData.agentPort}
                      onChange={(e) => handleChange('agentPort', parseInt(e.target.value, 10))}
                      error={!!errors.agentPort}
                      className="h-10 font-mono"
                    />
                  </FormField>

                  <FormField label="订阅端口" error={errors.subscriptionPort} hint="可选，默认同代理端口">
                    <Input
                      id="subscriptionPort"
                      type="number"
                      min={1}
                      max={65535}
                      placeholder="同代理端口"
                      value={formData.subscriptionPort ?? ''}
                      onChange={(e) => handleChange('subscriptionPort', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      error={!!errors.subscriptionPort}
                      className="h-10 font-mono"
                    />
                  </FormField>
                </div>
              </div>
            </CollapsibleSection>

            {/* Protocol Settings Section */}
            <CollapsibleSection
              config={{ id: 'protocol', title: isShadowsocks ? 'Shadowsocks 配置' : 'Trojan 配置', icon: Shield }}
              isOpen={openSections.has('protocol')}
              onToggle={() => toggleSection('protocol')}
              getBadgeText={() => hasProtocolSettings ? '已配置' : null}
            >
              <div className="space-y-4">
                {isShadowsocks && (
                  <>
                    <FormField label="插件" hint="可选，如 obfs-local, v2ray-plugin">
                      <Input
                        id="plugin"
                        placeholder="obfs-local"
                        value={formData.plugin || ''}
                        onChange={(e) => handleChange('plugin', e.target.value)}
                        className="h-10 font-mono"
                      />
                    </FormField>

                    <FormField label="插件选项" hint="格式：key1=value1;key2=value2">
                      <Input
                        id="pluginOpts"
                        placeholder="obfs=http;obfs-host=www.bing.com"
                        value={pluginOptsString}
                        onChange={(e) => setPluginOptsString(e.target.value)}
                        className="h-10 font-mono"
                      />
                    </FormField>
                  </>
                )}

                {isTrojan && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="SNI" hint="TLS 服务器名称">
                        <Input
                          id="sni"
                          placeholder="example.com"
                          value={formData.sni || ''}
                          onChange={(e) => handleChange('sni', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="TLS 安全" hint="自签名证书可跳过验证">
                        <Select
                          value={formData.allowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('allowInsecure', value === 'true')}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">
                              <div className="flex items-center gap-2">
                                <Shield className="size-3.5 text-success" />
                                验证证书
                              </div>
                            </SelectItem>
                            <SelectItem value="true">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="size-3.5 text-warning" />
                                跳过验证
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>

                    {showWsFields && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Host" hint="WebSocket Host Header">
                          <Input
                            id="host"
                            placeholder="example.com"
                            value={formData.host || ''}
                            onChange={(e) => handleChange('host', e.target.value)}
                            className="h-10 font-mono"
                          />
                        </FormField>

                        <FormField label="Path" hint="WebSocket 路径">
                          <Input
                            id="path"
                            placeholder="/ws"
                            value={formData.path || ''}
                            onChange={(e) => handleChange('path', e.target.value)}
                            className="h-10 font-mono"
                          />
                        </FormField>
                      </div>
                    )}

                    {showGrpcFields && (
                      <FormField label="Service Name" hint="gRPC 服务名称">
                        <Input
                          id="grpcHost"
                          placeholder="grpc-service"
                          value={formData.host || ''}
                          onChange={(e) => handleChange('host', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>
                    )}
                  </>
                )}
              </div>
            </CollapsibleSection>

            {/* Other Settings Section */}
            <CollapsibleSection
              config={{ id: 'other', title: '其他设置', icon: Settings }}
              isOpen={openSections.has('other')}
              onToggle={() => toggleSection('other')}
              getBadgeText={() => hasOtherSettings ? '已配置' : null}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="地区" hint="节点所在地区">
                    <Input
                      id="region"
                      placeholder="例如：香港、东京"
                      value={formData.region}
                      onChange={(e) => handleChange('region', e.target.value)}
                      className="h-10"
                    />
                  </FormField>

                  <FormField label="排序顺序" hint="数字越小越靠前">
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => handleChange('sortOrder', parseInt(e.target.value, 10) || 0)}
                      className="h-10 font-mono"
                    />
                  </FormField>
                </div>

                <FormField label="标签" hint="多个标签用逗号分隔">
                  <Input
                    id="tagsInput"
                    placeholder="高速, 稳定, 推荐"
                    value={formData.tagsInput}
                    onChange={(e) => handleChange('tagsInput', e.target.value)}
                    className="h-10"
                  />
                </FormField>

                <FormField label="资源组" hint="创建后可在编辑中关联">
                  <Select value="__none__" disabled={isLoadingGroups}>
                    <SelectTrigger className="h-10">
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
                </FormField>
              </div>
            </CollapsibleSection>

            {/* Route Config Section */}
            <CollapsibleSection
              config={{ id: 'route', title: '路由配置', icon: Route }}
              isOpen={openSections.has('route')}
              onToggle={() => toggleSection('route')}
              getBadgeText={() => formData.route ? '已配置' : null}
            >
              <RouteConfigEditor
                value={formData.route}
                onChange={handleRouteChange}
                idPrefix="create-node-route"
                nodes={nodes}
              />
            </CollapsibleSection>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> 为必填项
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClose} className="h-9 px-4">
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={!isFormValid} className="h-9 px-6">
                {initialData ? '创建副本' : '创建节点'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
