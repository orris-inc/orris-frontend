/**
 * Create Node Sheet Component
 * Mobile-optimized bottom sheet for creating new nodes
 * Redesigned with improved UX: progress indicator, step sections, micro-interactions
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  SheetDescription,
  SheetBody,
  SheetFooter,
  type CreateSheetProps,
} from '@/components/common/sheet';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
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
  { value: 'none', label: 'None' },
];

// VMess transport protocols
const VMESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'http', 'quic'];

// VMess security types
const VMESS_SECURITY_OPTIONS: { value: VMessSecurity; label: string }[] = [
  { value: 'auto', label: 'Auto (Recommended)' },
  { value: 'aes-128-gcm', label: 'AES-128-GCM' },
  { value: 'chacha20-poly1305', label: 'ChaCha20-Poly1305' },
  { value: 'none', label: 'None' },
  { value: 'zero', label: 'Zero' },
];

// Congestion control algorithms
const CONGESTION_CONTROL_OPTIONS: { value: CongestionControl; label: string }[] = [
  { value: 'bbr', label: 'BBR (Recommended)' },
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
  { value: 'random', label: 'Random' },
];

// Protocol configuration - descriptions need translation at render time
const PROTOCOL_CONFIG: Record<NodeProtocol, { name: string; descKey: string; icon: React.ElementType }> = {
  shadowsocks: { name: 'Shadowsocks', descKey: 'admin.nodes.form.protocolDesc.shadowsocks', icon: Zap },
  trojan: { name: 'Trojan', descKey: 'admin.nodes.form.protocolDesc.trojan', icon: Lock },
  vless: { name: 'VLESS', descKey: 'admin.nodes.form.protocolDesc.vless', icon: Radio },
  vmess: { name: 'VMess', descKey: 'admin.nodes.form.protocolDesc.vmess', icon: Layers },
  hysteria2: { name: 'Hysteria2', descKey: 'admin.nodes.form.protocolDesc.hysteria2', icon: Gauge },
  tuic: { name: 'TUIC', descKey: 'admin.nodes.form.protocolDesc.tuic', icon: Workflow },
};

// TLS security options - need to be generated with translation at runtime
const getTlsSecurityOptions = (t: (key: string) => string): MobileSelectOption[] => [
  { value: 'false', label: t('admin.nodes.form.verifyCert') },
  { value: 'true', label: t('admin.nodes.form.skipVerify') },
];

// Common port presets - need to be generated with translation at runtime
const getPortPresets = (t: (key: string) => string) => [
  { port: 8388, label: t('admin.nodes.form.ssDefault') },
  { port: 443, label: t('admin.nodes.form.httpsDefault') },
  { port: 8443, label: t('admin.nodes.form.httpsAlt') },
];

// Common region presets - these are location names, keep them as is for now
const REGION_PRESETS = ['Hong Kong', 'Japan', 'Singapore', 'USA', 'Taiwan', 'Korea'];

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
  titleKey: string;
  icon: React.ElementType;
  required?: boolean;
}

const STEPS: StepConfig[] = [
  { id: 'basic', titleKey: 'admin.nodes.form.section.basicInfo', icon: Server, required: true },
  { id: 'network', titleKey: 'admin.nodes.form.section.networkConfig', icon: Network, required: true },
  { id: 'protocol', titleKey: 'admin.nodes.form.protocolType', icon: Shield },
  { id: 'other', titleKey: 'admin.nodes.form.section.otherSettings', icon: Settings },
  { id: 'route', titleKey: 'admin.nodes.form.section.routeConfig', icon: Route },
];

// Collapsible Section - Tailwind Application UI style
interface StepSectionProps {
  step: StepConfig;
  title: string;
  badge?: string | null;
  isOpen: boolean;
  isCompleted?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const StepSection: React.FC<StepSectionProps> = ({
  step,
  title,
  badge,
  isOpen,
  onToggle,
  children,
}) => {
  const Icon = step.icon;

  return (
    <div className="overflow-hidden rounded-lg bg-card border border-border">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-muted/50 transition-colors min-h-[52px]"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'size-8 rounded-lg flex items-center justify-center transition-colors',
              isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{title}</span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                {badge}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 pb-4 pt-2 border-t border-border">
          {children}
        </div>
      </div>
    </div>
  );
};

// Form Field Label - compact style
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
  <div className="space-y-0.5">
    <label className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {hint && showHint && (
      <p className="text-[11px] text-muted-foreground leading-tight">{hint}</p>
    )}
  </div>
);

// Protocol Selection - Compact card style
interface ProtocolCardProps {
  protocol: NodeProtocol;
  selected: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol, selected, onSelect, t }) => {
  const config = PROTOCOL_CONFIG[protocol];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all',
        'min-h-[52px]', // Touch target
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card active:bg-muted/50'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="flex-1 text-left min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          selected ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {config.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate leading-tight">
          {t(config.descKey)}
        </p>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="size-3 text-primary-foreground" strokeWidth={3} />
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
  <div className="flex flex-wrap gap-1.5">
    {options.map((option) => (
      <button
        key={option}
        type="button"
        onClick={() => onSelect(option)}
        className={cn(
          'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
          'min-h-[32px]',
          selected === option
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground active:bg-muted/70'
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
  presets: { port: number; label: string }[];
}

const PortPresets: React.FC<PortPresetsProps> = ({ currentPort, onSelect, presets }) => (
  <div className="flex gap-1.5">
    {presets.map(({ port, label }) => (
      <button
        key={port}
        type="button"
        onClick={() => onSelect(port)}
        className={cn(
          'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
          'min-h-[36px]',
          currentPort === port
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'bg-muted text-muted-foreground active:bg-muted/70 border border-transparent'
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
  const { t } = useTranslation();
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
      newErrors.name = t('admin.nodes.form.validation.nameRequired');
    }

    if (!formData.agentPort || formData.agentPort < 1 || formData.agentPort > 65535) {
      newErrors.agentPort = t('admin.nodes.form.validation.portRange');
    }

    if (formData.subscriptionPort !== undefined && (formData.subscriptionPort < 1 || formData.subscriptionPort > 65535)) {
      newErrors.subscriptionPort = t('admin.nodes.form.validation.portRange');
    }

    if (!formData.protocol) {
      newErrors.protocol = t('admin.nodes.form.validation.protocolRequired');
    }

    if (isShadowsocks && !formData.encryptionMethod) {
      newErrors.encryptionMethod = t('admin.nodes.form.validation.encryptionRequired');
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
          <SheetTitle>
            {initialData ? t('admin.nodes.form.copyNode') : t('admin.nodes.form.createNode')}
          </SheetTitle>
          <SheetDescription>
            {t('admin.nodes.form.description')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Step 1: Basic Info */}
          <StepSection
            step={STEPS[0]}
            title={t(STEPS[0].titleKey)}
            isOpen={openSections.has('basic')}
            isCompleted={completedSteps.has('basic')}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-5">
              {/* Node Name */}
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.nodeName')} required />
                <MobileFormInput
                  placeholder={t('admin.nodes.form.nodeNamePlaceholder')}
                  value={formData.name}
                  onChange={(value) => handleChange('name', value)}
                  error={errors.name}
                  icon={<Server className="size-5" />}
                />
              </div>

              {/* Protocol Selection */}
              <div className="space-y-2">
                <FormFieldLabel label={t('admin.nodes.form.protocolType')} required />
                <div className="grid grid-cols-2 gap-2">
                  <ProtocolCard
                    protocol="shadowsocks"
                    selected={isShadowsocks}
                    onSelect={() => handleChange('protocol', 'shadowsocks')}
                    t={t}
                  />
                  <ProtocolCard
                    protocol="trojan"
                    selected={isTrojan}
                    onSelect={() => handleChange('protocol', 'trojan')}
                    t={t}
                  />
                  <ProtocolCard
                    protocol="vless"
                    selected={isVless}
                    onSelect={() => handleChange('protocol', 'vless')}
                    t={t}
                  />
                  <ProtocolCard
                    protocol="vmess"
                    selected={isVmess}
                    onSelect={() => handleChange('protocol', 'vmess')}
                    t={t}
                  />
                  <ProtocolCard
                    protocol="hysteria2"
                    selected={isHysteria2}
                    onSelect={() => handleChange('protocol', 'hysteria2')}
                    t={t}
                  />
                  <ProtocolCard
                    protocol="tuic"
                    selected={isTuic}
                    onSelect={() => handleChange('protocol', 'tuic')}
                    t={t}
                  />
                </div>
              </div>

              {/* Encryption Method (SS) */}
              {isShadowsocks && (
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.encryptionMethod')} required />
                  <MobileSelect
                    value={formData.encryptionMethod || ''}
                    onChange={(value) => handleChange('encryptionMethod', value)}
                    options={SS_ENCRYPTION_METHODS.map((m) => ({
                      value: m.value,
                      label: m.recommended ? `${m.label} (${t('common.recommended')})` : m.label,
                    }))}
                    placeholder={t('admin.nodes.form.encryptionMethod')}
                  />
                </div>
              )}

              {/* Transport Protocol (Trojan) */}
              {isTrojan && (
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.transportProtocol')} hint={t('admin.nodes.form.transportProtocolHint')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.transportProtocol')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.securityType')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.transportProtocol')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.encryptionMethod')} />
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
                  <FormFieldLabel label={t('admin.nodes.form.congestionControl')} hint={t('admin.nodes.form.congestionControlHint')} />
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
                    <FormFieldLabel label={t('admin.nodes.form.congestionControl')} />
                    <MobileSelect
                      value={formData.tuicCongestionControl || 'bbr'}
                      onChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                      options={CONGESTION_CONTROL_OPTIONS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.udpRelayMode')} />
                    <MobileSelect
                      value={formData.tuicUdpRelayMode || 'native'}
                      onChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                      options={TUIC_UDP_RELAY_MODES}
                    />
                  </div>
                </div>
              )}

              {/* Next button */}
              <button
                type="button"
                onClick={() => goToNextSection('basic')}
                disabled={!completedSteps.has('basic')}
                className={cn(
                  'w-full flex items-center justify-center gap-1',
                  'h-9 mt-3 rounded-lg',
                  'text-sm font-medium text-muted-foreground',
                  'hover:bg-muted active:bg-muted/70 transition-colors',
                  'disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                {t('admin.nodes.form.nextStepNetwork')}
                <ChevronRight className="size-4" />
              </button>
            </div>
          </StepSection>

          {/* Step 2: Network */}
          <StepSection
            step={STEPS[1]}
            title={t(STEPS[1].titleKey)}
            isOpen={openSections.has('network')}
            isCompleted={completedSteps.has('network')}
            onToggle={() => toggleSection('network')}
          >
            <div className="space-y-5">
              {/* Server Address */}
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.serverAddress')} hint={t('admin.nodes.form.serverAddressHint')} />
                <MobileFormInput
                  placeholder={t('admin.nodes.form.serverAddressPlaceholder')}
                  value={formData.serverAddress}
                  onChange={(value) => handleChange('serverAddress', value)}
                  icon={<Globe className="size-5" />}
                  className="font-mono"
                />
              </div>

              {/* Port Presets */}
              <div className="space-y-2">
                <FormFieldLabel label={t('admin.nodes.form.commonPorts')} />
                <PortPresets
                  currentPort={formData.agentPort}
                  onSelect={(port) => handleChange('agentPort', port)}
                  presets={getPortPresets(t)}
                />
              </div>

              {/* Ports */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.agentPort')} required />
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
                  <FormFieldLabel label={t('admin.nodes.form.subscriptionPort')} />
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={65535}
                    placeholder={t('admin.nodes.form.sameAsAgentPort')}
                    value={formData.subscriptionPort !== undefined ? String(formData.subscriptionPort) : ''}
                    onChange={(value) => handleChange('subscriptionPort', value ? parseInt(value, 10) : undefined)}
                    error={errors.subscriptionPort}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Next button */}
              <button
                type="button"
                onClick={() => goToNextSection('network')}
                className={cn(
                  'w-full flex items-center justify-center gap-1',
                  'h-9 mt-3 rounded-lg',
                  'text-sm font-medium text-muted-foreground',
                  'hover:bg-muted active:bg-muted/70 transition-colors'
                )}
              >
                {t('admin.nodes.form.nextStepProtocol')}
                <ChevronRight className="size-4" />
              </button>
            </div>
          </StepSection>

          {/* Step 3: Protocol Settings */}
          <StepSection
            step={STEPS[2]}
            title={`${PROTOCOL_CONFIG[formData.protocol].name} ${t('admin.nodes.form.config')}`}
            badge={hasProtocolSettings ? t('admin.nodes.form.configured') : null}
            isOpen={openSections.has('protocol')}
            isCompleted={completedSteps.has('protocol')}
            onToggle={() => toggleSection('protocol')}
          >
            <div className="space-y-4">
              {isShadowsocks && (
                <>
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.plugin')} hint={t('admin.nodes.form.pluginHint')} />
                    <MobileFormInput
                      placeholder="obfs-local"
                      value={formData.plugin || ''}
                      onChange={(value) => handleChange('plugin', value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.pluginOptions')} hint={t('admin.nodes.form.pluginOptionsHint')} />
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
                    <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
                    <MobileFormInput
                      placeholder="example.com"
                      value={formData.sni || ''}
                      onChange={(value) => handleChange('sni', value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} />
                    <MobileSelect
                      value={formData.allowInsecure ? 'true' : 'false'}
                      onChange={(value) => handleChange('allowInsecure', value === 'true')}
                      options={getTlsSecurityOptions(t)}
                    />
                  </div>

                  {showWsFields && (
                    <>
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsHostHeader')} />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.host || ''}
                          onChange={(value) => handleChange('host', value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsPathHint')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.fields.serviceName')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.vlessSni || ''}
                        onChange={(value) => handleChange('vlessSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} />
                      <MobileSelect
                        value={formData.vlessAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('vlessAllowInsecure', value === 'true')}
                        options={getTlsSecurityOptions(t)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fields.flow')} hint={t('admin.nodes.form.flowHint')} />
                      <MobileFormInput
                        placeholder="xtls-rprx-vision"
                        value={formData.vlessFlow || ''}
                        onChange={(value) => handleChange('vlessFlow', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fingerprintHint')} />
                      <MobileSelect
                        value={formData.vlessFingerprint || '__none__'}
                        onChange={(value) => handleChange('vlessFingerprint', value === '__none__' ? '' : value)}
                        options={[{ value: '__none__', label: t('common.none') }, ...TLS_FINGERPRINT_OPTIONS]}
                      />
                    </div>
                  </div>

                  {showVlessWsFields && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsH2Host')} />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.vlessHost || ''}
                          onChange={(value) => handleChange('vlessHost', value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsH2PathHint')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.fields.serviceName')} hint={t('admin.nodes.form.grpcServiceNameHint')} />
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
                          <FormFieldLabel label={t('admin.nodes.form.fields.publicKey')} hint={t('admin.nodes.form.realityPublicKeyHint')} />
                          <MobileFormInput
                            placeholder={t('admin.nodes.form.publicKeyPlaceholder')}
                            value={formData.vlessRealityPublicKey || ''}
                            onChange={(value) => handleChange('vlessRealityPublicKey', value)}
                            className="font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <FormFieldLabel label={t('admin.nodes.form.fields.shortId')} />
                          <MobileFormInput
                            placeholder={t('admin.nodes.form.shortIdPlaceholder')}
                            value={formData.vlessRealityShortId || ''}
                            onChange={(value) => handleChange('vlessRealityShortId', value)}
                            className="font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.spiderX')} hint={t('common.optional')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.fields.alterId')} hint={t('admin.nodes.form.alterIdHint')} />
                      <MobileFormInput
                        type="number"
                        inputMode="numeric"
                        value={String(formData.vmessAlterId ?? 0)}
                        onChange={(value) => handleChange('vmessAlterId', parseInt(value, 10) || 0)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fields.tls')} />
                      <MobileSelect
                        value={formData.vmessTls ? 'true' : 'false'}
                        onChange={(value) => handleChange('vmessTls', value === 'true')}
                        options={[
                          { value: 'true', label: t('admin.nodes.form.enableTls') },
                          { value: 'false', label: t('admin.nodes.form.disableTls') },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.vmessSni || ''}
                        onChange={(value) => handleChange('vmessSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} />
                      <MobileSelect
                        value={formData.vmessAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('vmessAllowInsecure', value === 'true')}
                        options={getTlsSecurityOptions(t)}
                      />
                    </div>
                  </div>

                  {showVmessWsFields && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsHttpHost')} />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.vmessHost || ''}
                          onChange={(value) => handleChange('vmessHost', value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsHttpPathHint')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.fields.serviceName')} hint={t('admin.nodes.form.grpcServiceNameHint')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.hysteria2Sni || ''}
                        onChange={(value) => handleChange('hysteria2Sni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} />
                      <MobileSelect
                        value={formData.hysteria2AllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('hysteria2AllowInsecure', value === 'true')}
                        options={getTlsSecurityOptions(t)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.obfsType')} hint={t('admin.nodes.form.obfsTypeHint')} />
                      <MobileFormInput
                        placeholder="salamander"
                        value={formData.hysteria2Obfs || ''}
                        onChange={(value) => handleChange('hysteria2Obfs', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.obfsPassword')} />
                      <MobileFormInput
                        placeholder={t('common.placeholders.password')}
                        value={formData.hysteria2ObfsPassword || ''}
                        onChange={(value) => handleChange('hysteria2ObfsPassword', value)}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.upBandwidth')} />
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
                      <FormFieldLabel label={t('admin.nodes.form.downBandwidth')} />
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
                    <FormFieldLabel label={t('admin.nodes.form.fingerprintHint')} />
                    <MobileSelect
                      value={formData.hysteria2Fingerprint || '__none__'}
                      onChange={(value) => handleChange('hysteria2Fingerprint', value === '__none__' ? '' : value)}
                      options={[{ value: '__none__', label: t('common.none') }, ...TLS_FINGERPRINT_OPTIONS]}
                    />
                  </div>
                </>
              )}

              {/* TUIC Protocol Settings */}
              {isTuic && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.tuicSni || ''}
                        onChange={(value) => handleChange('tuicSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} />
                      <MobileSelect
                        value={formData.tuicAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('tuicAllowInsecure', value === 'true')}
                        options={getTlsSecurityOptions(t)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fields.alpn')} hint={t('admin.nodes.form.alpnHint')} />
                      <MobileFormInput
                        placeholder="h3"
                        value={formData.tuicAlpn || ''}
                        onChange={(value) => handleChange('tuicAlpn', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.disableSni')} />
                      <MobileSelect
                        value={formData.tuicDisableSni ? 'true' : 'false'}
                        onChange={(value) => handleChange('tuicDisableSni', value === 'true')}
                        options={[
                          { value: 'false', label: t('admin.nodes.form.notDisabled') },
                          { value: 'true', label: t('admin.nodes.form.disableSniOption') },
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
            title={t(STEPS[3].titleKey)}
            badge={hasOtherSettings ? t('admin.nodes.form.configured') : null}
            isOpen={openSections.has('other')}
            isCompleted={completedSteps.has('other')}
            onToggle={() => toggleSection('other')}
          >
            <div className="space-y-4">
              {/* Region Quick Select */}
              <div className="space-y-2">
                <FormFieldLabel label={t('admin.nodes.form.region')} hint={t('admin.nodes.form.regionHint')} />
                <QuickChips
                  options={REGION_PRESETS}
                  selected={formData.region}
                  onSelect={(value) => handleChange('region', value)}
                />
                <MobileFormInput
                  placeholder={t('admin.nodes.form.regionPlaceholder')}
                  value={formData.region}
                  onChange={(value) => handleChange('region', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('common.fields.sortOrder')} hint={t('admin.nodes.form.sortOrderHint')} />
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    value={String(formData.sortOrder)}
                    onChange={(value) => handleChange('sortOrder', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.resourceGroups.title')} />
                  <MobileSelect
                    value="__none__"
                    onChange={() => {}}
                    disabled={isLoadingGroups || isLoadingPlans}
                    options={[
                      { value: '__none__', label: t('admin.nodes.form.noResourceGroup') },
                      ...filteredResourceGroups.map((g) => ({ value: g.sid, label: g.name })),
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.tags')} hint={t('admin.nodes.form.tagsHint')} />
                <MobileFormInput
                  placeholder={t('admin.nodes.form.tagsPlaceholder')}
                  value={formData.tagsInput}
                  onChange={(value) => handleChange('tagsInput', value)}
                />
              </div>
            </div>
          </StepSection>

          {/* Step 5: Route Config */}
          <StepSection
            step={STEPS[4]}
            title={t(STEPS[4].titleKey)}
            badge={formData.route ? t('admin.nodes.form.configured') : null}
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
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className={cn(
                'flex-1 flex items-center justify-center',
                'h-11 rounded-lg',
                'border border-border bg-background text-foreground',
                'text-sm font-medium',
                'active:opacity-80 transition-opacity',
                'disabled:opacity-50'
              )}
            >
              {t('common.actions.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'h-11 rounded-lg',
                'bg-primary text-primary-foreground',
                'text-sm font-medium',
                'active:opacity-80 transition-opacity',
                'disabled:opacity-50'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('common.loading.creating')}
                </>
              ) : (
                initialData ? t('admin.nodes.form.createCopy') : t('admin.nodes.form.createNode')
              )}
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
