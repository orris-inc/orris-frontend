/**
 * Create node dialog component
 * Redesigned with improved UI/UX - clean visual hierarchy, icons, and better form layout
 */

import { useState, useEffect, useMemo } from 'react';
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
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { RouteConfigEditor } from './RouteConfigEditor';
import type { OutboundNodeOption } from './RouteRuleEditor';
import type {
  CreateNodeRequest,
  TransportProtocol,
  RouteConfig,
  NodeProtocol,
  VLESSSecurity,
  VMessSecurity,
  CongestionControl,
  TUICUDPRelayMode,
} from '@/api/node';
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
  Radio,
  Layers,
  Gauge,
  Workflow,
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

// VLESS transport protocols
const VLESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'h2'];

// VLESS security types
const VLESS_SECURITY_OPTIONS: VLESSSecurity[] = ['none', 'tls', 'reality'];

// VMess security types
const VMESS_SECURITY_OPTIONS: VMessSecurity[] = ['auto', 'aes-128-gcm', 'chacha20-poly1305', 'none', 'zero'];

// VMess transport protocols
const VMESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'http', 'quic'];

// Congestion control algorithms
const CONGESTION_CONTROL_OPTIONS: CongestionControl[] = ['cubic', 'bbr', 'new_reno'];

// TUIC UDP relay modes
const TUIC_UDP_RELAY_MODES: TUICUDPRelayMode[] = ['native', 'quic'];

// TLS fingerprint options
const TLS_FINGERPRINT_OPTIONS = ['chrome', 'firefox', 'safari', 'edge', 'random'] as const;

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
  // VLESS fields
  vlessTransportType: 'tcp',
  vlessFlow: '',
  vlessSecurity: 'tls',
  vlessSni: '',
  vlessFingerprint: '',
  vlessAllowInsecure: false,
  vlessHost: '',
  vlessPath: '',
  vlessServiceName: '',
  vlessRealityPublicKey: '',
  vlessRealityShortId: '',
  vlessRealitySpiderX: '',
  // VMess fields
  vmessAlterId: 0,
  vmessSecurity: 'auto',
  vmessTransportType: 'tcp',
  vmessHost: '',
  vmessPath: '',
  vmessServiceName: '',
  vmessTls: true,
  vmessSni: '',
  vmessAllowInsecure: false,
  // Hysteria2 fields
  hysteria2CongestionControl: 'bbr',
  hysteria2Obfs: '',
  hysteria2ObfsPassword: '',
  hysteria2UpMbps: undefined,
  hysteria2DownMbps: undefined,
  hysteria2Sni: '',
  hysteria2AllowInsecure: false,
  hysteria2Fingerprint: '',
  // TUIC fields
  tuicCongestionControl: 'bbr',
  tuicUdpRelayMode: 'native',
  tuicAlpn: '',
  tuicSni: '',
  tuicAllowInsecure: false,
  tuicDisableSni: false,
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

// Protocol configuration
const PROTOCOL_CONFIG: Record<NodeProtocol, { name: string; desc: string; icon: React.ElementType }> = {
  shadowsocks: { name: 'Shadowsocks', desc: '轻量高效', icon: Zap },
  trojan: { name: 'Trojan', desc: 'TLS 加密', icon: Lock },
  vless: { name: 'VLESS', desc: 'Reality 支持', icon: Radio },
  vmess: { name: 'VMess', desc: 'V2Ray 协议', icon: Layers },
  hysteria2: { name: 'Hysteria2', desc: 'QUIC 加速', icon: Gauge },
  tuic: { name: 'TUIC', desc: 'UDP 优化', icon: Workflow },
};

// Protocol Card Component - Compact version
interface ProtocolCardProps {
  protocol: NodeProtocol;
  selected: boolean;
  onSelect: () => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol, selected, onSelect }) => {
  const config = PROTOCOL_CONFIG[protocol];
  const Icon = config.icon;

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
        <Icon className={`size-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
      </div>
      <div className="text-left">
        <p className={`text-sm font-medium leading-none ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
          {config.name}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {config.desc}
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

  const { plans, isLoading: isLoadingPlans } = useSubscriptionPlans({
    pageSize: 100,
    enabled: open,
  });

  const filteredResourceGroups = useMemo(() => {
    if (!plans.length) return resourceGroups;
    const planTypeMap = new Map(plans.map((plan) => [plan.id, plan.planType]));
    return resourceGroups.filter((group) => {
      const planType = planTypeMap.get(group.planId);
      return planType === 'node' || planType === 'hybrid';
    });
  }, [resourceGroups, plans]);

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
  const isVless = formData.protocol === 'vless';
  const isVmess = formData.protocol === 'vmess';
  const isHysteria2 = formData.protocol === 'hysteria2';
  const isTuic = formData.protocol === 'tuic';

  // Trojan transport fields
  const showWsFields = isTrojan && formData.transportProtocol === 'ws';
  const showGrpcFields = isTrojan && formData.transportProtocol === 'grpc';

  // VLESS transport fields
  const showVlessWsFields = isVless && (formData.vlessTransportType === 'ws' || formData.vlessTransportType === 'h2');
  const showVlessGrpcFields = isVless && formData.vlessTransportType === 'grpc';
  const showVlessRealityFields = isVless && formData.vlessSecurity === 'reality';

  // VMess transport fields
  const showVmessWsFields = isVmess && (formData.vmessTransportType === 'ws' || formData.vmessTransportType === 'http');
  const showVmessGrpcFields = isVmess && formData.vmessTransportType === 'grpc';

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

      // VLESS protocol fields
      if (isVless) {
        submitData.vlessTransportType = formData.vlessTransportType;
        submitData.vlessSecurity = formData.vlessSecurity;
        if (formData.vlessFlow?.trim()) {
          submitData.vlessFlow = formData.vlessFlow.trim();
        }
        if (formData.vlessSni?.trim()) {
          submitData.vlessSni = formData.vlessSni.trim();
        }
        if (formData.vlessFingerprint?.trim()) {
          submitData.vlessFingerprint = formData.vlessFingerprint.trim();
        }
        if (formData.vlessAllowInsecure) {
          submitData.vlessAllowInsecure = formData.vlessAllowInsecure;
        }
        if (showVlessWsFields) {
          if (formData.vlessHost?.trim()) {
            submitData.vlessHost = formData.vlessHost.trim();
          }
          if (formData.vlessPath?.trim()) {
            submitData.vlessPath = formData.vlessPath.trim();
          }
        }
        if (showVlessGrpcFields && formData.vlessServiceName?.trim()) {
          submitData.vlessServiceName = formData.vlessServiceName.trim();
        }
        if (showVlessRealityFields) {
          if (formData.vlessRealityPublicKey?.trim()) {
            submitData.vlessRealityPublicKey = formData.vlessRealityPublicKey.trim();
          }
          if (formData.vlessRealityShortId?.trim()) {
            submitData.vlessRealityShortId = formData.vlessRealityShortId.trim();
          }
          if (formData.vlessRealitySpiderX?.trim()) {
            submitData.vlessRealitySpiderX = formData.vlessRealitySpiderX.trim();
          }
        }
      }

      // VMess protocol fields
      if (isVmess) {
        submitData.vmessTransportType = formData.vmessTransportType;
        submitData.vmessSecurity = formData.vmessSecurity;
        submitData.vmessAlterId = formData.vmessAlterId ?? 0;
        submitData.vmessTls = formData.vmessTls ?? true;
        if (formData.vmessSni?.trim()) {
          submitData.vmessSni = formData.vmessSni.trim();
        }
        if (formData.vmessAllowInsecure) {
          submitData.vmessAllowInsecure = formData.vmessAllowInsecure;
        }
        if (showVmessWsFields) {
          if (formData.vmessHost?.trim()) {
            submitData.vmessHost = formData.vmessHost.trim();
          }
          if (formData.vmessPath?.trim()) {
            submitData.vmessPath = formData.vmessPath.trim();
          }
        }
        if (showVmessGrpcFields && formData.vmessServiceName?.trim()) {
          submitData.vmessServiceName = formData.vmessServiceName.trim();
        }
      }

      // Hysteria2 protocol fields
      if (isHysteria2) {
        submitData.hysteria2CongestionControl = formData.hysteria2CongestionControl;
        if (formData.hysteria2Obfs?.trim()) {
          submitData.hysteria2Obfs = formData.hysteria2Obfs.trim();
        }
        if (formData.hysteria2ObfsPassword?.trim()) {
          submitData.hysteria2ObfsPassword = formData.hysteria2ObfsPassword.trim();
        }
        if (formData.hysteria2UpMbps) {
          submitData.hysteria2UpMbps = formData.hysteria2UpMbps;
        }
        if (formData.hysteria2DownMbps) {
          submitData.hysteria2DownMbps = formData.hysteria2DownMbps;
        }
        if (formData.hysteria2Sni?.trim()) {
          submitData.hysteria2Sni = formData.hysteria2Sni.trim();
        }
        if (formData.hysteria2AllowInsecure) {
          submitData.hysteria2AllowInsecure = formData.hysteria2AllowInsecure;
        }
        if (formData.hysteria2Fingerprint?.trim()) {
          submitData.hysteria2Fingerprint = formData.hysteria2Fingerprint.trim();
        }
      }

      // TUIC protocol fields
      if (isTuic) {
        submitData.tuicCongestionControl = formData.tuicCongestionControl;
        submitData.tuicUdpRelayMode = formData.tuicUdpRelayMode;
        if (formData.tuicAlpn?.trim()) {
          submitData.tuicAlpn = formData.tuicAlpn.trim();
        }
        if (formData.tuicSni?.trim()) {
          submitData.tuicSni = formData.tuicSni.trim();
        }
        if (formData.tuicAllowInsecure) {
          submitData.tuicAllowInsecure = formData.tuicAllowInsecure;
        }
        if (formData.tuicDisableSni) {
          submitData.tuicDisableSni = formData.tuicDisableSni;
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

  // Form is valid when required fields are filled
  // Only Shadowsocks requires encryptionMethod, other protocols have their own required fields
  const isFormValid = formData.name.trim() &&
                      formData.protocol &&
                      formData.agentPort &&
                      (!isShadowsocks || formData.encryptionMethod);

  // Check if protocol-specific settings have been configured
  const getHasProtocolSettings = () => {
    if (isShadowsocks) {
      return Boolean(formData.plugin || pluginOptsString);
    }
    if (isTrojan) {
      return Boolean(formData.sni || formData.host || formData.path || formData.allowInsecure);
    }
    if (isVless) {
      return Boolean(formData.vlessSni || formData.vlessHost || formData.vlessPath || formData.vlessFlow);
    }
    if (isVmess) {
      return Boolean(formData.vmessSni || formData.vmessHost || formData.vmessPath);
    }
    if (isHysteria2) {
      return Boolean(formData.hysteria2Sni || formData.hysteria2Obfs || formData.hysteria2UpMbps);
    }
    if (isTuic) {
      return Boolean(formData.tuicSni || formData.tuicAlpn);
    }
    return false;
  };
  const hasProtocolSettings = getHasProtocolSettings();

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
                  <div className="grid grid-cols-3 gap-2">
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
                    <ProtocolCard
                      protocol="vless"
                      selected={isVless}
                      onSelect={() => handleChange('protocol', 'vless')}
                    />
                    <ProtocolCard
                      protocol="vmess"
                      selected={isVmess}
                      onSelect={() => handleChange('protocol', 'vmess')}
                    />
                    <ProtocolCard
                      protocol="hysteria2"
                      selected={isHysteria2}
                      onSelect={() => handleChange('protocol', 'hysteria2')}
                    />
                    <ProtocolCard
                      protocol="tuic"
                      selected={isTuic}
                      onSelect={() => handleChange('protocol', 'tuic')}
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

                {/* VLESS Basic Config */}
                {isVless && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="传输协议" hint="选择底层传输方式">
                        <Select
                          value={formData.vlessTransportType}
                          onValueChange={(value) => handleChange('vlessTransportType', value as TransportProtocol)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VLESS_TRANSPORT_PROTOCOLS.map((protocol) => (
                              <SelectItem key={protocol} value={protocol}>
                                {protocol.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="安全类型" hint="TLS 或 Reality">
                        <Select
                          value={formData.vlessSecurity}
                          onValueChange={(value) => handleChange('vlessSecurity', value as VLESSSecurity)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VLESS_SECURITY_OPTIONS.map((security) => (
                              <SelectItem key={security} value={security}>
                                {security.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </>
                )}

                {/* VMess Basic Config */}
                {isVmess && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="传输协议" hint="选择底层传输方式">
                        <Select
                          value={formData.vmessTransportType}
                          onValueChange={(value) => handleChange('vmessTransportType', value as TransportProtocol)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VMESS_TRANSPORT_PROTOCOLS.map((protocol) => (
                              <SelectItem key={protocol} value={protocol}>
                                {protocol.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="加密方式" hint="推荐使用 auto">
                        <Select
                          value={formData.vmessSecurity}
                          onValueChange={(value) => handleChange('vmessSecurity', value as VMessSecurity)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VMESS_SECURITY_OPTIONS.map((security) => (
                              <SelectItem key={security} value={security}>
                                {security}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </>
                )}

                {/* Hysteria2 Basic Config */}
                {isHysteria2 && (
                  <FormField label="拥塞控制" hint="推荐使用 BBR">
                    <Select
                      value={formData.hysteria2CongestionControl}
                      onValueChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONGESTION_CONTROL_OPTIONS.map((cc) => (
                          <SelectItem key={cc} value={cc}>
                            {cc.toUpperCase().replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}

                {/* TUIC Basic Config */}
                {isTuic && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="拥塞控制" hint="推荐使用 BBR">
                      <Select
                        value={formData.tuicCongestionControl}
                        onValueChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONGESTION_CONTROL_OPTIONS.map((cc) => (
                            <SelectItem key={cc} value={cc}>
                              {cc.toUpperCase().replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="UDP 中继模式" hint="native 或 quic">
                      <Select
                        value={formData.tuicUdpRelayMode}
                        onValueChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TUIC_UDP_RELAY_MODES.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {mode.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
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
              config={{ id: 'protocol', title: `${PROTOCOL_CONFIG[formData.protocol].name} 配置`, icon: Shield }}
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

                {/* VLESS Protocol Settings */}
                {isVless && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="SNI" hint="TLS 服务器名称">
                        <Input
                          id="vlessSni"
                          placeholder="example.com"
                          value={formData.vlessSni || ''}
                          onChange={(e) => handleChange('vlessSni', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="TLS 安全" hint="自签名证书可跳过验证">
                        <Select
                          value={formData.vlessAllowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('vlessAllowInsecure', value === 'true')}
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Flow" hint="流控，如 xtls-rprx-vision">
                        <Input
                          id="vlessFlow"
                          placeholder="xtls-rprx-vision"
                          value={formData.vlessFlow || ''}
                          onChange={(e) => handleChange('vlessFlow', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="Fingerprint" hint="TLS 指纹">
                        <Select
                          value={formData.vlessFingerprint || ''}
                          onValueChange={(value) => handleChange('vlessFingerprint', value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="选择指纹" />
                          </SelectTrigger>
                          <SelectContent>
                            {TLS_FINGERPRINT_OPTIONS.map((fp) => (
                              <SelectItem key={fp} value={fp}>
                                {fp}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>

                    {showVlessWsFields && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Host" hint="WS/H2 Host Header">
                          <Input
                            id="vlessHost"
                            placeholder="example.com"
                            value={formData.vlessHost || ''}
                            onChange={(e) => handleChange('vlessHost', e.target.value)}
                            className="h-10 font-mono"
                          />
                        </FormField>

                        <FormField label="Path" hint="WS/H2 路径">
                          <Input
                            id="vlessPath"
                            placeholder="/ws"
                            value={formData.vlessPath || ''}
                            onChange={(e) => handleChange('vlessPath', e.target.value)}
                            className="h-10 font-mono"
                          />
                        </FormField>
                      </div>
                    )}

                    {showVlessGrpcFields && (
                      <FormField label="Service Name" hint="gRPC 服务名称">
                        <Input
                          id="vlessServiceName"
                          placeholder="grpc-service"
                          value={formData.vlessServiceName || ''}
                          onChange={(e) => handleChange('vlessServiceName', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>
                    )}

                    {showVlessRealityFields && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField label="Reality Public Key" hint="服务端公钥">
                            <Input
                              id="vlessRealityPublicKey"
                              placeholder="公钥"
                              value={formData.vlessRealityPublicKey || ''}
                              onChange={(e) => handleChange('vlessRealityPublicKey', e.target.value)}
                              className="h-10 font-mono"
                            />
                          </FormField>

                          <FormField label="Reality Short ID" hint="短 ID">
                            <Input
                              id="vlessRealityShortId"
                              placeholder="短 ID"
                              value={formData.vlessRealityShortId || ''}
                              onChange={(e) => handleChange('vlessRealityShortId', e.target.value)}
                              className="h-10 font-mono"
                            />
                          </FormField>
                        </div>

                        <FormField label="Reality Spider X" hint="可选">
                          <Input
                            id="vlessRealitySpiderX"
                            placeholder="/"
                            value={formData.vlessRealitySpiderX || ''}
                            onChange={(e) => handleChange('vlessRealitySpiderX', e.target.value)}
                            className="h-10 font-mono"
                          />
                        </FormField>
                      </>
                    )}
                  </>
                )}

                {/* VMess Protocol Settings */}
                {isVmess && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Alter ID" hint="通常为 0">
                        <Input
                          id="vmessAlterId"
                          type="number"
                          min={0}
                          value={formData.vmessAlterId ?? 0}
                          onChange={(e) => handleChange('vmessAlterId', parseInt(e.target.value, 10) || 0)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="TLS" hint="是否启用 TLS">
                        <Select
                          value={formData.vmessTls ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('vmessTls', value === 'true')}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">启用 TLS</SelectItem>
                            <SelectItem value="false">不启用 TLS</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="SNI" hint="TLS 服务器名称">
                        <Input
                          id="vmessSni"
                          placeholder="example.com"
                          value={formData.vmessSni || ''}
                          onChange={(e) => handleChange('vmessSni', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="TLS 安全" hint="自签名证书可跳过验证">
                        <Select
                          value={formData.vmessAllowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('vmessAllowInsecure', value === 'true')}
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

                    {showVmessWsFields && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Host" hint="WS/HTTP Host Header">
                          <Input
                            id="vmessHost"
                            placeholder="example.com"
                            value={formData.vmessHost || ''}
                            onChange={(e) => handleChange('vmessHost', e.target.value)}
                            className="h-10 font-mono"
                          />
                        </FormField>

                        <FormField label="Path" hint="WS/HTTP 路径">
                          <Input
                            id="vmessPath"
                            placeholder="/ws"
                            value={formData.vmessPath || ''}
                            onChange={(e) => handleChange('vmessPath', e.target.value)}
                            className="h-10 font-mono"
                          />
                        </FormField>
                      </div>
                    )}

                    {showVmessGrpcFields && (
                      <FormField label="Service Name" hint="gRPC 服务名称">
                        <Input
                          id="vmessServiceName"
                          placeholder="grpc-service"
                          value={formData.vmessServiceName || ''}
                          onChange={(e) => handleChange('vmessServiceName', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>
                    )}
                  </>
                )}

                {/* Hysteria2 Protocol Settings */}
                {isHysteria2 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="SNI" hint="TLS 服务器名称">
                        <Input
                          id="hysteria2Sni"
                          placeholder="example.com"
                          value={formData.hysteria2Sni || ''}
                          onChange={(e) => handleChange('hysteria2Sni', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="TLS 安全" hint="自签名证书可跳过验证">
                        <Select
                          value={formData.hysteria2AllowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('hysteria2AllowInsecure', value === 'true')}
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Obfs 类型" hint="混淆类型，如 salamander">
                        <Input
                          id="hysteria2Obfs"
                          placeholder="salamander"
                          value={formData.hysteria2Obfs || ''}
                          onChange={(e) => handleChange('hysteria2Obfs', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="Obfs 密码" hint="混淆密码">
                        <Input
                          id="hysteria2ObfsPassword"
                          placeholder="密码"
                          value={formData.hysteria2ObfsPassword || ''}
                          onChange={(e) => handleChange('hysteria2ObfsPassword', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="上行带宽 (Mbps)" hint="可选">
                        <Input
                          id="hysteria2UpMbps"
                          type="number"
                          min={0}
                          placeholder="100"
                          value={formData.hysteria2UpMbps ?? ''}
                          onChange={(e) => handleChange('hysteria2UpMbps', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="下行带宽 (Mbps)" hint="可选">
                        <Input
                          id="hysteria2DownMbps"
                          type="number"
                          min={0}
                          placeholder="100"
                          value={formData.hysteria2DownMbps ?? ''}
                          onChange={(e) => handleChange('hysteria2DownMbps', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                          className="h-10 font-mono"
                        />
                      </FormField>
                    </div>

                    <FormField label="Fingerprint" hint="TLS 指纹">
                      <Select
                        value={formData.hysteria2Fingerprint || ''}
                        onValueChange={(value) => handleChange('hysteria2Fingerprint', value)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="选择指纹" />
                        </SelectTrigger>
                        <SelectContent>
                          {TLS_FINGERPRINT_OPTIONS.map((fp) => (
                            <SelectItem key={fp} value={fp}>
                              {fp}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </>
                )}

                {/* TUIC Protocol Settings */}
                {isTuic && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="SNI" hint="TLS 服务器名称">
                        <Input
                          id="tuicSni"
                          placeholder="example.com"
                          value={formData.tuicSni || ''}
                          onChange={(e) => handleChange('tuicSni', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="TLS 安全" hint="自签名证书可跳过验证">
                        <Select
                          value={formData.tuicAllowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('tuicAllowInsecure', value === 'true')}
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="ALPN" hint="应用层协议协商">
                        <Input
                          id="tuicAlpn"
                          placeholder="h3"
                          value={formData.tuicAlpn || ''}
                          onChange={(e) => handleChange('tuicAlpn', e.target.value)}
                          className="h-10 font-mono"
                        />
                      </FormField>

                      <FormField label="禁用 SNI" hint="是否禁用 SNI">
                        <Select
                          value={formData.tuicDisableSni ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('tuicDisableSni', value === 'true')}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">不禁用</SelectItem>
                            <SelectItem value="true">禁用 SNI</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
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
                  <Select value="__none__" disabled={isLoadingGroups || isLoadingPlans}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={isLoadingGroups || isLoadingPlans ? '加载中...' : '选择资源组'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">不关联资源组</SelectItem>
                      {filteredResourceGroups.map((group) => (
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
