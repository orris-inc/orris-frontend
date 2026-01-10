/**
 * Create Node Sheet Component
 * Mobile-optimized bottom sheet for creating new nodes
 * Redesigned with improved UX: progress indicator, step sections, micro-interactions
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Server,
  Network,
  Shield,
  Settings,
  Route,
  Zap,
  Lock,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  Sparkles,
  Globe,
  Radio,
  Layers,
  Gauge,
  Workflow,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
  type CreateSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { RouteConfigEditor } from './RouteConfigEditor';
import { cn } from '@/lib/utils';
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

interface CreateNodeSheetProps extends CreateSheetProps<CreateNodeRequest> {
  initialData?: Partial<CreateNodeRequest>;
  nodes?: OutboundNodeOption[];
}

// Shadowsocks encryption methods with recommended badge
interface EncryptionMethodOption {
  value: string;
  label: string;
  recommended?: boolean;
}

const SS_ENCRYPTION_METHODS: EncryptionMethodOption[] = [
  { value: 'aes-256-gcm', label: 'aes-256-gcm', recommended: true },
  { value: 'chacha20-ietf-poly1305', label: 'chacha20-ietf-poly1305', recommended: true },
  { value: 'aes-128-gcm', label: 'aes-128-gcm' },
  { value: 'xchacha20-ietf-poly1305', label: 'xchacha20-ietf-poly1305' },
  { value: '2022-blake3-aes-128-gcm', label: '2022-blake3-aes-128-gcm' },
  { value: '2022-blake3-aes-256-gcm', label: '2022-blake3-aes-256-gcm' },
  { value: '2022-blake3-chacha20-poly1305', label: '2022-blake3-chacha20-poly1305' },
];

// Trojan transport protocols
const TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc'];

// VLESS transport protocols
const VLESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'h2'];

// VLESS security types
const VLESS_SECURITY_OPTIONS: { value: VLESSSecurity; label: string }[] = [
  { value: 'tls', label: 'TLS' },
  { value: 'reality', label: 'Reality' },
  { value: 'none', label: '无' },
];

// VMess transport protocols
const VMESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'http', 'quic'];

// VMess security types
const VMESS_SECURITY_OPTIONS: { value: VMessSecurity; label: string }[] = [
  { value: 'auto', label: 'Auto (推荐)' },
  { value: 'aes-128-gcm', label: 'AES-128-GCM' },
  { value: 'chacha20-poly1305', label: 'ChaCha20-Poly1305' },
  { value: 'none', label: '无' },
  { value: 'zero', label: 'Zero' },
];

// Congestion control algorithms
const CONGESTION_CONTROL_OPTIONS: { value: CongestionControl; label: string }[] = [
  { value: 'bbr', label: 'BBR (推荐)' },
  { value: 'cubic', label: 'Cubic' },
  { value: 'new_reno', label: 'New Reno' },
];

// TUIC UDP relay modes
const TUIC_UDP_RELAY_MODES: { value: TUICUDPRelayMode; label: string }[] = [
  { value: 'native', label: 'Native' },
  { value: 'quic', label: 'QUIC' },
];

// TLS fingerprint options
const TLS_FINGERPRINT_OPTIONS: MobileSelectOption[] = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'safari', label: 'Safari' },
  { value: 'edge', label: 'Edge' },
  { value: 'random', label: '随机' },
];

// Protocol configuration
const PROTOCOL_CONFIG: Record<NodeProtocol, { name: string; desc: string; icon: React.ElementType }> = {
  shadowsocks: { name: 'Shadowsocks', desc: '轻量高效', icon: Zap },
  trojan: { name: 'Trojan', desc: 'TLS加密', icon: Lock },
  vless: { name: 'VLESS', desc: 'Reality', icon: Radio },
  vmess: { name: 'VMess', desc: 'V2Ray', icon: Layers },
  hysteria2: { name: 'Hysteria2', desc: 'QUIC加速', icon: Gauge },
  tuic: { name: 'TUIC', desc: 'UDP优化', icon: Workflow },
};

// TLS security options
const TLS_SECURITY_OPTIONS: MobileSelectOption[] = [
  { value: 'false', label: '验证证书（安全）' },
  { value: 'true', label: '跳过验证（不安全）' },
];

// Common port presets
const PORT_PRESETS = [
  { port: 8388, label: 'SS默认' },
  { port: 443, label: 'HTTPS' },
  { port: 8443, label: '备用HTTPS' },
];

// Common region presets
const REGION_PRESETS = ['香港', '日本', '新加坡', '美国', '台湾', '韩国'];

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

// Step configuration
interface StepConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  required?: boolean;
}

const STEPS: StepConfig[] = [
  { id: 'basic', title: '基本信息', icon: Server, required: true },
  { id: 'network', title: '网络配置', icon: Network, required: true },
  { id: 'protocol', title: '协议配置', icon: Shield },
  { id: 'other', title: '其他设置', icon: Settings },
  { id: 'route', title: '路由配置', icon: Route },
];

// Progress Indicator Component
interface ProgressIndicatorProps {
  steps: StepConfig[];
  completedSteps: Set<string>;
  currentStep: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  completedSteps,
  currentStep,
}) => {
  const progress = (completedSteps.size / steps.filter(s => s.required).length) * 100;

  return (
    <div className="px-1 py-2">
      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {/* Step indicators */}
      <div className="flex justify-between mt-2">
        {steps.slice(0, 3).map((step) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'size-6 rounded-full flex items-center justify-center transition-all duration-200',
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  <Icon className="size-3" strokeWidth={1.5} />
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium',
                  isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Collapsible Section with step styling
interface StepSectionProps {
  step: StepConfig;
  badge?: string | null;
  isOpen: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const StepSection: React.FC<StepSectionProps> = ({
  step,
  badge,
  isOpen,
  isCompleted,
  onToggle,
  children,
}) => {
  const Icon = step.icon;

  return (
    <div
      className={cn(
        'border rounded-2xl overflow-hidden transition-all duration-200',
        isOpen ? 'border-primary/30 bg-card shadow-sm' : 'border-border bg-card/50'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          'active:bg-accent/30 cursor-pointer'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'size-10 rounded-xl flex items-center justify-center transition-all duration-200',
              isCompleted
                ? 'bg-primary text-primary-foreground'
                : isOpen
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {isCompleted ? (
              <Check className="size-5" strokeWidth={2} />
            ) : (
              <Icon className="size-5" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{step.title}</span>
              {step.required && !isCompleted && (
                <span className="text-[10px] text-primary font-medium">必填</span>
              )}
              {badge && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {badge}
                </Badge>
              )}
            </div>
            {isCompleted && (
              <span className="text-xs text-success">已完成</span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <Separator className="mb-4" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Form Field Label
interface FormFieldLabelProps {
  label: string;
  required?: boolean;
  hint?: string;
  showHint?: boolean;
}

const FormFieldLabel: React.FC<FormFieldLabelProps> = ({
  label,
  required,
  hint,
  showHint = true,
}) => (
  <div className="space-y-0.5 px-1">
    <label className="text-sm font-medium flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </label>
    {hint && showHint && (
      <p className="text-xs text-muted-foreground">{hint}</p>
    )}
  </div>
);

// Protocol Selection - Compact Pill Style
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
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all duration-150',
        'min-h-[48px]', // Touch target
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card active:bg-accent/30'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'size-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="flex-1 text-left min-w-0">
        <p className={cn(
          'text-xs font-medium truncate',
          selected ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {config.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {config.desc}
        </p>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="size-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />
        </div>
      )}
    </button>
  );
};

// Quick Chips for common values
interface QuickChipsProps {
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
}

const QuickChips: React.FC<QuickChipsProps> = ({ options, selected, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => (
      <button
        key={option}
        type="button"
        onClick={() => onSelect(option)}
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
          'min-h-[32px]', // Touch target
          selected === option
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground active:bg-muted/80'
        )}
      >
        {option}
      </button>
    ))}
  </div>
);

// Port Preset Buttons
interface PortPresetsProps {
  currentPort: number;
  onSelect: (port: number) => void;
}

const PortPresets: React.FC<PortPresetsProps> = ({ currentPort, onSelect }) => (
  <div className="flex gap-2">
    {PORT_PRESETS.map(({ port, label }) => (
      <button
        key={port}
        type="button"
        onClick={() => onSelect(port)}
        className={cn(
          'flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
          'min-h-[32px]',
          currentPort === port
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'bg-muted text-muted-foreground active:bg-muted/80'
        )}
      >
        {label}
      </button>
    ))}
  </div>
);

export const CreateNodeSheet: React.FC<CreateNodeSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  nodes = [],
}) => {
  const [formData, setFormData] = useState<CreateNodeRequest & { tagsInput: string }>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pluginOptsString, setPluginOptsString] = useState<string>('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic']));
  const [loading, setLoading] = useState(false);

  const { resourceGroups, isLoading: isLoadingGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

  // Calculate completed steps
  const completedSteps = useMemo(() => {
    const completed = new Set<string>();

    // Basic: name + protocol + (encryption for SS)
    const isSS = formData.protocol === 'shadowsocks';
    if (formData.name.trim() && formData.protocol && (!isSS || formData.encryptionMethod)) {
      completed.add('basic');
    }

    // Network: agentPort is required
    if (formData.agentPort >= 1 && formData.agentPort <= 65535) {
      completed.add('network');
    }

    // Optional sections
    if (formData.plugin || pluginOptsString || formData.sni || formData.host || formData.path) {
      completed.add('protocol');
    }
    if (formData.region || formData.tagsInput || formData.sortOrder) {
      completed.add('other');
    }
    if (formData.route) {
      completed.add('route');
    }

    return completed;
  }, [formData, pluginOptsString]);

  // Current active section
  const currentStep = useMemo(() => {
    return Array.from(openSections)[0] || 'basic';
  }, [openSections]);

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
      setOpenSections(new Set(['basic']));
    } else if (open && !initialData) {
      setFormData(getDefaultFormData());
      setPluginOptsString('');
      setOpenSections(new Set(['basic']));
    }
  }, [open, initialData]);

  const handleClose = () => {
    if (!loading) {
      setFormData(getDefaultFormData());
      setErrors({});
      setPluginOptsString('');
      setOpenSections(new Set(['basic']));
      onOpenChange(false);
    }
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
      const next = new Set<string>();
      if (!prev.has(sectionId)) {
        next.add(sectionId);
      }
      return next;
    });
  };

  const goToNextSection = (currentId: string) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentId);
    if (currentIndex < STEPS.length - 1) {
      toggleSection(STEPS[currentIndex + 1].id);
    }
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
      newErrors.name = '请输入节点名称';
    }

    if (!formData.agentPort || formData.agentPort < 1 || formData.agentPort > 65535) {
      newErrors.agentPort = '端口范围: 1-65535';
    }

    if (formData.subscriptionPort !== undefined && (formData.subscriptionPort < 1 || formData.subscriptionPort > 65535)) {
      newErrors.subscriptionPort = '端口范围: 1-65535';
    }

    if (!formData.protocol) {
      newErrors.protocol = '请选择协议类型';
    }

    if (isShadowsocks && !formData.encryptionMethod) {
      newErrors.encryptionMethod = '请选择加密方法';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  };

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
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              {initialData ? (
                <Sparkles className="size-6 text-primary" />
              ) : (
                <Server className="size-6 text-primary" />
              )}
            </div>
            <div>
              <span className="text-lg">{initialData ? '复制节点' : '新增节点'}</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                配置代理节点信息
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Progress Indicator */}
        <div className="px-6 pt-2">
          <ProgressIndicator
            steps={STEPS}
            completedSteps={completedSteps}
            currentStep={currentStep}
          />
        </div>

        <SheetBody className="py-4 space-y-3">
          {/* Step 1: Basic Info */}
          <StepSection
            step={STEPS[0]}
            isOpen={openSections.has('basic')}
            isCompleted={completedSteps.has('basic')}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-5">
              {/* Node Name */}
              <div className="space-y-1.5">
                <FormFieldLabel label="节点名称" required />
                <MobileFormInput
                  placeholder="例如：香港节点-01"
                  value={formData.name}
                  onChange={(value) => handleChange('name', value)}
                  error={errors.name}
                  icon={<Server className="size-5" />}
                />
              </div>

              {/* Protocol Selection */}
              <div className="space-y-2">
                <FormFieldLabel label="协议类型" required />
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

              {/* Encryption Method (SS) */}
              {isShadowsocks && (
                <div className="space-y-1.5">
                  <FormFieldLabel label="加密方法" required />
                  <MobileSelect
                    value={formData.encryptionMethod || ''}
                    onChange={(value) => handleChange('encryptionMethod', value)}
                    options={SS_ENCRYPTION_METHODS.map((m) => ({
                      value: m.value,
                      label: m.recommended ? `${m.label} (推荐)` : m.label,
                    }))}
                    placeholder="选择加密方法"
                  />
                </div>
              )}

              {/* Transport Protocol (Trojan) */}
              {isTrojan && (
                <div className="space-y-1.5">
                  <FormFieldLabel label="传输协议" hint="选择底层传输方式" />
                  <MobileSelect
                    value={formData.transportProtocol || 'tcp'}
                    onChange={(value) => handleChange('transportProtocol', value)}
                    options={TRANSPORT_PROTOCOLS.map((p) => ({
                      value: p,
                      label: p.toUpperCase(),
                    }))}
                  />
                </div>
              )}

              {/* VLESS Basic Config */}
              {isVless && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="传输协议" />
                      <MobileSelect
                        value={formData.vlessTransportType || 'tcp'}
                        onChange={(value) => handleChange('vlessTransportType', value as TransportProtocol)}
                        options={VLESS_TRANSPORT_PROTOCOLS.map((p) => ({
                          value: p,
                          label: p.toUpperCase(),
                        }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="安全类型" />
                      <MobileSelect
                        value={formData.vlessSecurity || 'tls'}
                        onChange={(value) => handleChange('vlessSecurity', value as VLESSSecurity)}
                        options={VLESS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* VMess Basic Config */}
              {isVmess && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="传输协议" />
                      <MobileSelect
                        value={formData.vmessTransportType || 'tcp'}
                        onChange={(value) => handleChange('vmessTransportType', value as TransportProtocol)}
                        options={VMESS_TRANSPORT_PROTOCOLS.map((p) => ({
                          value: p,
                          label: p.toUpperCase(),
                        }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="加密方式" />
                      <MobileSelect
                        value={formData.vmessSecurity || 'auto'}
                        onChange={(value) => handleChange('vmessSecurity', value as VMessSecurity)}
                        options={VMESS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Hysteria2 Basic Config */}
              {isHysteria2 && (
                <div className="space-y-1.5">
                  <FormFieldLabel label="拥塞控制" hint="推荐使用 BBR" />
                  <MobileSelect
                    value={formData.hysteria2CongestionControl || 'bbr'}
                    onChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)}
                    options={CONGESTION_CONTROL_OPTIONS}
                  />
                </div>
              )}

              {/* TUIC Basic Config */}
              {isTuic && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FormFieldLabel label="拥塞控制" />
                    <MobileSelect
                      value={formData.tuicCongestionControl || 'bbr'}
                      onChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                      options={CONGESTION_CONTROL_OPTIONS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormFieldLabel label="UDP 中继" />
                    <MobileSelect
                      value={formData.tuicUdpRelayMode || 'native'}
                      onChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                      options={TUIC_UDP_RELAY_MODES}
                    />
                  </div>
                </div>
              )}

              {/* Next button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToNextSection('basic')}
                disabled={!completedSteps.has('basic')}
                className="w-full mt-2"
              >
                下一步：网络配置
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </StepSection>

          {/* Step 2: Network */}
          <StepSection
            step={STEPS[1]}
            isOpen={openSections.has('network')}
            isCompleted={completedSteps.has('network')}
            onToggle={() => toggleSection('network')}
          >
            <div className="space-y-5">
              {/* Server Address */}
              <div className="space-y-1.5">
                <FormFieldLabel label="服务器地址" hint="可选，留空则自动检测" />
                <MobileFormInput
                  placeholder="example.com 或 IP"
                  value={formData.serverAddress}
                  onChange={(value) => handleChange('serverAddress', value)}
                  icon={<Globe className="size-5" />}
                  className="font-mono"
                />
              </div>

              {/* Port Presets */}
              <div className="space-y-2">
                <FormFieldLabel label="常用端口" />
                <PortPresets
                  currentPort={formData.agentPort}
                  onSelect={(port) => handleChange('agentPort', port)}
                />
              </div>

              {/* Ports */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label="代理端口" required />
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={65535}
                    value={String(formData.agentPort)}
                    onChange={(value) => handleChange('agentPort', parseInt(value, 10) || 0)}
                    error={errors.agentPort}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <FormFieldLabel label="订阅端口" />
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={65535}
                    placeholder="同代理"
                    value={formData.subscriptionPort !== undefined ? String(formData.subscriptionPort) : ''}
                    onChange={(value) => handleChange('subscriptionPort', value ? parseInt(value, 10) : undefined)}
                    error={errors.subscriptionPort}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Next button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToNextSection('network')}
                className="w-full mt-2"
              >
                下一步：协议配置（可选）
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </StepSection>

          {/* Step 3: Protocol Settings */}
          <StepSection
            step={STEPS[2]}
            badge={hasProtocolSettings ? '已配置' : null}
            isOpen={openSections.has('protocol')}
            isCompleted={completedSteps.has('protocol')}
            onToggle={() => toggleSection('protocol')}
          >
            <div className="space-y-4">
              {isShadowsocks && (
                <>
                  <div className="space-y-1.5">
                    <FormFieldLabel label="插件" hint="可选，如 obfs-local" />
                    <MobileFormInput
                      placeholder="obfs-local"
                      value={formData.plugin || ''}
                      onChange={(value) => handleChange('plugin', value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label="插件选项" hint="格式：key=value;key2=value2" />
                    <MobileFormInput
                      placeholder="obfs=http;obfs-host=..."
                      value={pluginOptsString}
                      onChange={setPluginOptsString}
                      className="font-mono"
                    />
                  </div>
                </>
              )}

              {isTrojan && (
                <>
                  <div className="space-y-1.5">
                    <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                    <MobileFormInput
                      placeholder="example.com"
                      value={formData.sni || ''}
                      onChange={(value) => handleChange('sni', value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label="TLS 验证" />
                    <MobileSelect
                      value={formData.allowInsecure ? 'true' : 'false'}
                      onChange={(value) => handleChange('allowInsecure', value === 'true')}
                      options={TLS_SECURITY_OPTIONS}
                    />
                  </div>

                  {showWsFields && (
                    <>
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Host" hint="WebSocket Host" />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.host || ''}
                          onChange={(value) => handleChange('host', value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <FormFieldLabel label="Path" hint="WebSocket 路径" />
                        <MobileFormInput
                          placeholder="/ws"
                          value={formData.path || ''}
                          onChange={(value) => handleChange('path', value)}
                          className="font-mono"
                        />
                      </div>
                    </>
                  )}

                  {showGrpcFields && (
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Service Name" />
                      <MobileFormInput
                        placeholder="grpc-service"
                        value={formData.host || ''}
                        onChange={(value) => handleChange('host', value)}
                        className="font-mono"
                      />
                    </div>
                  )}
                </>
              )}

              {/* VLESS Protocol Settings */}
              {isVless && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.vlessSni || ''}
                        onChange={(value) => handleChange('vlessSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS 验证" />
                      <MobileSelect
                        value={formData.vlessAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('vlessAllowInsecure', value === 'true')}
                        options={TLS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Flow" hint="流控" />
                      <MobileFormInput
                        placeholder="xtls-rprx-vision"
                        value={formData.vlessFlow || ''}
                        onChange={(value) => handleChange('vlessFlow', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="指纹" />
                      <MobileSelect
                        value={formData.vlessFingerprint || '__none__'}
                        onChange={(value) => handleChange('vlessFingerprint', value === '__none__' ? '' : value)}
                        options={[{ value: '__none__', label: '无' }, ...TLS_FINGERPRINT_OPTIONS]}
                      />
                    </div>
                  </div>

                  {showVlessWsFields && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Host" hint="WS/H2 Host" />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.vlessHost || ''}
                          onChange={(value) => handleChange('vlessHost', value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Path" hint="WS/H2 路径" />
                        <MobileFormInput
                          placeholder="/ws"
                          value={formData.vlessPath || ''}
                          onChange={(value) => handleChange('vlessPath', value)}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {showVlessGrpcFields && (
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Service Name" hint="gRPC 服务名称" />
                      <MobileFormInput
                        placeholder="grpc-service"
                        value={formData.vlessServiceName || ''}
                        onChange={(value) => handleChange('vlessServiceName', value)}
                        className="font-mono"
                      />
                    </div>
                  )}

                  {showVlessRealityFields && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <FormFieldLabel label="Public Key" hint="Reality 公钥" />
                          <MobileFormInput
                            placeholder="公钥"
                            value={formData.vlessRealityPublicKey || ''}
                            onChange={(value) => handleChange('vlessRealityPublicKey', value)}
                            className="font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <FormFieldLabel label="Short ID" />
                          <MobileFormInput
                            placeholder="短 ID"
                            value={formData.vlessRealityShortId || ''}
                            onChange={(value) => handleChange('vlessRealityShortId', value)}
                            className="font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Spider X" hint="可选" />
                        <MobileFormInput
                          placeholder="/"
                          value={formData.vlessRealitySpiderX || ''}
                          onChange={(value) => handleChange('vlessRealitySpiderX', value)}
                          className="font-mono"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* VMess Protocol Settings */}
              {isVmess && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Alter ID" hint="通常为 0" />
                      <MobileFormInput
                        type="number"
                        inputMode="numeric"
                        value={String(formData.vmessAlterId ?? 0)}
                        onChange={(value) => handleChange('vmessAlterId', parseInt(value, 10) || 0)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS" />
                      <MobileSelect
                        value={formData.vmessTls ? 'true' : 'false'}
                        onChange={(value) => handleChange('vmessTls', value === 'true')}
                        options={[
                          { value: 'true', label: '启用 TLS' },
                          { value: 'false', label: '不启用' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.vmessSni || ''}
                        onChange={(value) => handleChange('vmessSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS 验证" />
                      <MobileSelect
                        value={formData.vmessAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('vmessAllowInsecure', value === 'true')}
                        options={TLS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>

                  {showVmessWsFields && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Host" hint="WS/HTTP Host" />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.vmessHost || ''}
                          onChange={(value) => handleChange('vmessHost', value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Path" hint="WS/HTTP 路径" />
                        <MobileFormInput
                          placeholder="/ws"
                          value={formData.vmessPath || ''}
                          onChange={(value) => handleChange('vmessPath', value)}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {showVmessGrpcFields && (
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Service Name" hint="gRPC 服务名称" />
                      <MobileFormInput
                        placeholder="grpc-service"
                        value={formData.vmessServiceName || ''}
                        onChange={(value) => handleChange('vmessServiceName', value)}
                        className="font-mono"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Hysteria2 Protocol Settings */}
              {isHysteria2 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.hysteria2Sni || ''}
                        onChange={(value) => handleChange('hysteria2Sni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS 验证" />
                      <MobileSelect
                        value={formData.hysteria2AllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('hysteria2AllowInsecure', value === 'true')}
                        options={TLS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Obfs 类型" hint="混淆" />
                      <MobileFormInput
                        placeholder="salamander"
                        value={formData.hysteria2Obfs || ''}
                        onChange={(value) => handleChange('hysteria2Obfs', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Obfs 密码" />
                      <MobileFormInput
                        placeholder="密码"
                        value={formData.hysteria2ObfsPassword || ''}
                        onChange={(value) => handleChange('hysteria2ObfsPassword', value)}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="上行 (Mbps)" />
                      <MobileFormInput
                        type="number"
                        inputMode="numeric"
                        placeholder="100"
                        value={formData.hysteria2UpMbps !== undefined ? String(formData.hysteria2UpMbps) : ''}
                        onChange={(value) => handleChange('hysteria2UpMbps', value ? parseInt(value, 10) : undefined)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="下行 (Mbps)" />
                      <MobileFormInput
                        type="number"
                        inputMode="numeric"
                        placeholder="100"
                        value={formData.hysteria2DownMbps !== undefined ? String(formData.hysteria2DownMbps) : ''}
                        onChange={(value) => handleChange('hysteria2DownMbps', value ? parseInt(value, 10) : undefined)}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label="指纹" />
                    <MobileSelect
                      value={formData.hysteria2Fingerprint || '__none__'}
                      onChange={(value) => handleChange('hysteria2Fingerprint', value === '__none__' ? '' : value)}
                      options={[{ value: '__none__', label: '无' }, ...TLS_FINGERPRINT_OPTIONS]}
                    />
                  </div>
                </>
              )}

              {/* TUIC Protocol Settings */}
              {isTuic && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.tuicSni || ''}
                        onChange={(value) => handleChange('tuicSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS 验证" />
                      <MobileSelect
                        value={formData.tuicAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('tuicAllowInsecure', value === 'true')}
                        options={TLS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="ALPN" hint="应用层协议" />
                      <MobileFormInput
                        placeholder="h3"
                        value={formData.tuicAlpn || ''}
                        onChange={(value) => handleChange('tuicAlpn', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="禁用 SNI" />
                      <MobileSelect
                        value={formData.tuicDisableSni ? 'true' : 'false'}
                        onChange={(value) => handleChange('tuicDisableSni', value === 'true')}
                        options={[
                          { value: 'false', label: '不禁用' },
                          { value: 'true', label: '禁用' },
                        ]}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </StepSection>

          {/* Step 4: Other Settings */}
          <StepSection
            step={STEPS[3]}
            badge={hasOtherSettings ? '已配置' : null}
            isOpen={openSections.has('other')}
            isCompleted={completedSteps.has('other')}
            onToggle={() => toggleSection('other')}
          >
            <div className="space-y-4">
              {/* Region Quick Select */}
              <div className="space-y-2">
                <FormFieldLabel label="地区" hint="选择或输入" />
                <QuickChips
                  options={REGION_PRESETS}
                  selected={formData.region}
                  onSelect={(value) => handleChange('region', value)}
                />
                <MobileFormInput
                  placeholder="自定义地区"
                  value={formData.region}
                  onChange={(value) => handleChange('region', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label="排序" hint="越小越靠前" />
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    value={String(formData.sortOrder)}
                    onChange={(value) => handleChange('sortOrder', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <FormFieldLabel label="资源组" />
                  <MobileSelect
                    value="__none__"
                    onChange={() => {}}
                    disabled={isLoadingGroups}
                    options={[
                      { value: '__none__', label: '不关联' },
                      ...resourceGroups.map((g) => ({ value: g.sid, label: g.name })),
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label="标签" hint="逗号分隔多个标签" />
                <MobileFormInput
                  placeholder="高速, 稳定, 推荐"
                  value={formData.tagsInput}
                  onChange={(value) => handleChange('tagsInput', value)}
                />
              </div>
            </div>
          </StepSection>

          {/* Step 5: Route Config */}
          <StepSection
            step={STEPS[4]}
            badge={formData.route ? '已配置' : null}
            isOpen={openSections.has('route')}
            isCompleted={completedSteps.has('route')}
            onToggle={() => toggleSection('route')}
          >
            <RouteConfigEditor
              value={formData.route}
              onChange={handleRouteChange}
              idPrefix="create-node-sheet-route"
              nodes={nodes}
            />
          </StepSection>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="w-full min-h-[52px] text-base gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Check className="size-5" />
                {initialData ? '创建副本' : '创建节点'}
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
