/**
 * Create Node Sheet Component
 * Mobile-optimized bottom sheet for creating new nodes
 * Redesigned with improved UX: progress indicator, step sections, micro-interactions
 */

import { useState, useMemo, useCallback } from 'react';
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
  ShieldCheck,
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
import { DnsConfigEditor } from './DnsConfigEditor';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import type { OutboundNodeOption } from '../utils/route-rule-utils';
import type {
  CreateNodeRequest,
  NodeProtocol,
  TransportProtocol,
  VLESSSecurity,
  VMessSecurity,
  CongestionControl,
  TUICUDPRelayMode,
} from '@/api/node';
import {
  SS_ENCRYPTION_OPTIONS,
  TRANSPORT_PROTOCOLS,
  VLESS_TRANSPORT_PROTOCOLS,
  VLESS_SECURITY_OPTIONS,
  VMESS_TRANSPORT_PROTOCOLS,
  VMESS_SECURITY_OPTIONS,
  CONGESTION_CONTROL_OPTIONS,
  TUIC_UDP_RELAY_OPTIONS,
  TLS_FINGERPRINT_OPTIONS,
} from '@/shared/constants/protocol-options';
import { useCreateNodeForm } from '../hooks/useCreateNodeForm';

interface CreateNodeSheetProps extends CreateSheetProps<CreateNodeRequest> {
  initialData?: Partial<CreateNodeRequest>;
  nodes?: OutboundNodeOption[];
}

// Protocol configuration - descriptions need translation at render time
const PROTOCOL_CONFIG: Record<NodeProtocol, { name: string; descKey: string; icon: React.ElementType }> = {
  shadowsocks: { name: 'Shadowsocks', descKey: 'admin.nodes.form.protocolDesc.shadowsocks', icon: Zap },
  trojan: { name: 'Trojan', descKey: 'admin.nodes.form.protocolDesc.trojan', icon: Lock },
  vless: { name: 'VLESS', descKey: 'admin.nodes.form.protocolDesc.vless', icon: Radio },
  vmess: { name: 'VMess', descKey: 'admin.nodes.form.protocolDesc.vmess', icon: Layers },
  hysteria2: { name: 'Hysteria2', descKey: 'admin.nodes.form.protocolDesc.hysteria2', icon: Gauge },
  tuic: { name: 'TUIC', descKey: 'admin.nodes.form.protocolDesc.tuic', icon: Workflow },
  anytls: { name: 'AnyTLS', descKey: 'admin.nodes.form.protocolDesc.anytls', icon: ShieldCheck },
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
  { id: 'dns', titleKey: 'admin.nodes.form.section.dnsConfig', icon: Globe },
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
    <div className={cn(cardStyles, 'overflow-hidden')}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-muted/50 active:scale-[0.99] transition-all min-h-[52px]"
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
        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all',
        'min-h-[52px]',
        selected
          ? 'ring-1 ring-primary bg-primary/5'
          : 'ring-1 ring-border bg-card active:bg-muted/50 active:scale-[0.98]'
      )}
    >
      <div
        className={cn(
          'size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </div>
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
          'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
          'min-h-[32px]',
          selected === option
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground active:bg-muted/70 active:scale-[0.98]'
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
          'flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
          'min-h-[36px]',
          currentPort === port
            ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
            : 'bg-muted text-muted-foreground active:bg-muted/70 active:scale-[0.98] ring-1 ring-transparent'
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
  const form = useCreateNodeForm();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic']));
  const [loading, setLoading] = useState(false);
  const [prevOpenState, setPrevOpenState] = useState<{ open: boolean; initialDataKey?: string } | null>(null);

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

  // Sync form data when sheet opens or initialData changes
  const initialDataKey = initialData ? initialData.name : undefined;
  const currentState = { open, initialDataKey };
  if (prevOpenState?.open !== currentState.open || prevOpenState?.initialDataKey !== currentState.initialDataKey) {
    setPrevOpenState(currentState);
    if (open && initialData) {
      form.initializeForm(initialData);
      setOpenSections(new Set(['basic']));
    } else if (open && !initialData) {
      form.initializeForm();
      setOpenSections(new Set(['basic']));
    }
  }

  const {
    formData, errors, pluginOptsString,
    isShadowsocks, isTrojan, isVless, isVmess, isHysteria2, isTuic, isAnytls,
    showWsFields, showGrpcFields,
    showVlessWsFields, showVlessGrpcFields, showVlessRealityFields,
    showVmessWsFields, showVmessGrpcFields,
    handleChange, handleRouteChange, handleDnsChange,
    isFormValid, hasProtocolSettings, hasOtherSettings,
  } = form;

  // Calculate completed steps
  const completedSteps = useMemo(() => {
    const completed = new Set<string>();

    if (formData.name.trim() && formData.protocol && (!isShadowsocks || formData.encryptionMethod)) {
      completed.add('basic');
    }
    if (formData.agentPort >= 1 && formData.agentPort <= 65535) {
      completed.add('network');
    }
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
  }, [formData, pluginOptsString, isShadowsocks]);

  const handleClose = useCallback(() => {
    if (!loading) {
      form.reset();
      setOpenSections(new Set(['basic']));
      onOpenChange(false);
    }
  }, [loading, onOpenChange, form]);

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set<string>();
      if (!prev.has(sectionId)) {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const goToNextSection = useCallback((currentId: string) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentId);
    if (currentIndex < STEPS.length - 1) {
      setOpenSections((prev) => {
        const next = new Set<string>();
        if (!prev.has(STEPS[currentIndex + 1].id)) {
          next.add(STEPS[currentIndex + 1].id);
        }
        return next;
      });
    }
  }, []);

  const handleSubmit = async () => {
    if (!form.validate()) return;

    setLoading(true);
    try {
      const submitData = form.buildSubmitData();
      onSubmit(submitData);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

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
          <StepSection step={STEPS[0]} title={t(STEPS[0].titleKey)} isOpen={openSections.has('basic')} isCompleted={completedSteps.has('basic')} onToggle={() => toggleSection('basic')}>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.nodeName')} required />
                <MobileFormInput placeholder={t('admin.nodes.form.nodeNamePlaceholder')} value={formData.name} onChange={(value) => handleChange('name', value)} error={errors.name} icon={<Server className="size-5" />} />
              </div>

              <div className="space-y-2">
                <FormFieldLabel label={t('admin.nodes.form.protocolType')} required />
                <div className="grid grid-cols-2 gap-2">
                  <ProtocolCard protocol="shadowsocks" selected={isShadowsocks} onSelect={() => handleChange('protocol', 'shadowsocks')} t={t} />
                  <ProtocolCard protocol="trojan" selected={isTrojan} onSelect={() => handleChange('protocol', 'trojan')} t={t} />
                  <ProtocolCard protocol="vless" selected={isVless} onSelect={() => handleChange('protocol', 'vless')} t={t} />
                  <ProtocolCard protocol="vmess" selected={isVmess} onSelect={() => handleChange('protocol', 'vmess')} t={t} />
                  <ProtocolCard protocol="hysteria2" selected={isHysteria2} onSelect={() => handleChange('protocol', 'hysteria2')} t={t} />
                  <ProtocolCard protocol="tuic" selected={isTuic} onSelect={() => handleChange('protocol', 'tuic')} t={t} />
                  <ProtocolCard protocol="anytls" selected={isAnytls} onSelect={() => handleChange('protocol', 'anytls')} t={t} />
                </div>
              </div>

              {isShadowsocks && (<div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.encryptionMethod')} required /><MobileSelect value={formData.encryptionMethod || ''} onChange={(value) => handleChange('encryptionMethod', value)} options={SS_ENCRYPTION_OPTIONS.map((m) => ({ value: m.value, label: m.recommended ? `${m.label} (${t('common.recommended')})` : m.label }))} placeholder={t('admin.nodes.form.encryptionMethod')} /></div>)}
              {isTrojan && (<div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.transportProtocol')} hint={t('admin.nodes.form.transportProtocolHint')} /><MobileSelect value={formData.transportProtocol || 'tcp'} onChange={(value) => handleChange('transportProtocol', value)} options={TRANSPORT_PROTOCOLS.map((p) => ({ value: p, label: p.toUpperCase() }))} /></div>)}
              {isVless && (<div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.transportProtocol')} /><MobileSelect value={formData.vlessTransportType || 'tcp'} onChange={(value) => handleChange('vlessTransportType', value as TransportProtocol)} options={VLESS_TRANSPORT_PROTOCOLS.map((p) => ({ value: p, label: p.toUpperCase() }))} /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.securityType')} /><MobileSelect value={formData.vlessSecurity || 'tls'} onChange={(value) => handleChange('vlessSecurity', value as VLESSSecurity)} options={VLESS_SECURITY_OPTIONS} /></div></div></div>)}
              {isVmess && (<div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.transportProtocol')} /><MobileSelect value={formData.vmessTransportType || 'tcp'} onChange={(value) => handleChange('vmessTransportType', value as TransportProtocol)} options={VMESS_TRANSPORT_PROTOCOLS.map((p) => ({ value: p, label: p.toUpperCase() }))} /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.encryptionMethod')} /><MobileSelect value={formData.vmessSecurity || 'auto'} onChange={(value) => handleChange('vmessSecurity', value as VMessSecurity)} options={VMESS_SECURITY_OPTIONS} /></div></div></div>)}
              {isHysteria2 && (<div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.congestionControl')} hint={t('admin.nodes.form.congestionControlHint')} /><MobileSelect value={formData.hysteria2CongestionControl || 'bbr'} onChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)} options={CONGESTION_CONTROL_OPTIONS} /></div>)}
              {isTuic && (<div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.congestionControl')} /><MobileSelect value={formData.tuicCongestionControl || 'bbr'} onChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)} options={CONGESTION_CONTROL_OPTIONS} /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.udpRelayMode')} /><MobileSelect value={formData.tuicUdpRelayMode || 'native'} onChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)} options={TUIC_UDP_RELAY_OPTIONS} /></div></div>)}

              <button type="button" onClick={() => goToNextSection('basic')} disabled={!completedSteps.has('basic')} className={cn('w-full flex items-center justify-center gap-1', 'h-9 mt-3 rounded-xl', 'text-sm font-medium text-muted-foreground', 'hover:bg-muted active:bg-muted/70 active:scale-[0.98] transition-all', 'disabled:opacity-50 disabled:pointer-events-none')}>
                {t('admin.nodes.form.nextStepNetwork')}
                <ChevronRight className="size-4" />
              </button>
            </div>
          </StepSection>

          {/* Step 2: Network */}
          <StepSection step={STEPS[1]} title={t(STEPS[1].titleKey)} isOpen={openSections.has('network')} isCompleted={completedSteps.has('network')} onToggle={() => toggleSection('network')}>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.serverAddress')} hint={t('admin.nodes.form.serverAddressHint')} />
                <MobileFormInput placeholder={t('admin.nodes.form.serverAddressPlaceholder')} value={formData.serverAddress} onChange={(value) => handleChange('serverAddress', value)} icon={<Globe className="size-5" />} className="font-mono" />
              </div>
              <div className="space-y-2">
                <FormFieldLabel label={t('admin.nodes.form.commonPorts')} />
                <PortPresets currentPort={formData.agentPort} onSelect={(port) => handleChange('agentPort', port)} presets={getPortPresets(t)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.agentPort')} required />
                  <MobileFormInput type="number" inputMode="numeric" min={1} max={65535} value={String(formData.agentPort)} onChange={(value) => handleChange('agentPort', parseInt(value, 10) || 0)} error={errors.agentPort} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.subscriptionPort')} />
                  <MobileFormInput type="number" inputMode="numeric" min={1} max={65535} placeholder={t('admin.nodes.form.sameAsAgentPort')} value={formData.subscriptionPort !== undefined ? String(formData.subscriptionPort) : ''} onChange={(value) => handleChange('subscriptionPort', value ? parseInt(value, 10) : undefined)} error={errors.subscriptionPort} className="font-mono" />
                </div>
              </div>
              <button type="button" onClick={() => goToNextSection('network')} className={cn('w-full flex items-center justify-center gap-1', 'h-9 mt-3 rounded-xl', 'text-sm font-medium text-muted-foreground', 'hover:bg-muted active:bg-muted/70 active:scale-[0.98] transition-all')}>
                {t('admin.nodes.form.nextStepProtocol')}
                <ChevronRight className="size-4" />
              </button>
            </div>
          </StepSection>

          {/* Step 3: Protocol Settings */}
          <StepSection step={STEPS[2]} title={`${PROTOCOL_CONFIG[formData.protocol].name} ${t('admin.nodes.form.config')}`} badge={hasProtocolSettings ? t('admin.nodes.form.configured') : null} isOpen={openSections.has('protocol')} isCompleted={completedSteps.has('protocol')} onToggle={() => toggleSection('protocol')}>
            <div className="space-y-4">
              {isShadowsocks && (<><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.plugin')} hint={t('admin.nodes.form.pluginHint')} /><MobileFormInput placeholder="obfs-local" value={formData.plugin || ''} onChange={(value) => handleChange('plugin', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.pluginOptions')} hint={t('admin.nodes.form.pluginOptionsHint')} /><MobileFormInput placeholder="obfs=http;obfs-host=..." value={pluginOptsString} onChange={(value) => form.handlePluginOptsChange(value)} className="font-mono" /></div></>)}

              {isTrojan && (<><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} /><MobileFormInput placeholder="example.com" value={formData.sni || ''} onChange={(value) => handleChange('sni', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} /><MobileSelect value={formData.allowInsecure ? 'true' : 'false'} onChange={(value) => handleChange('allowInsecure', value === 'true')} options={getTlsSecurityOptions(t)} /></div>{showWsFields && (<><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsHostHeader')} /><MobileFormInput placeholder="example.com" value={formData.host || ''} onChange={(value) => handleChange('host', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsPathHint')} /><MobileFormInput placeholder="/ws" value={formData.path || ''} onChange={(value) => handleChange('path', value)} className="font-mono" /></div></>)}{showGrpcFields && (<div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.serviceName')} /><MobileFormInput placeholder="grpc-service" value={formData.host || ''} onChange={(value) => handleChange('host', value)} className="font-mono" /></div>)}</>)}

              {isVless && (<><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} /><MobileFormInput placeholder="example.com" value={formData.vlessSni || ''} onChange={(value) => handleChange('vlessSni', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} /><MobileSelect value={formData.vlessAllowInsecure ? 'true' : 'false'} onChange={(value) => handleChange('vlessAllowInsecure', value === 'true')} options={getTlsSecurityOptions(t)} /></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.flow')} hint={t('admin.nodes.form.flowHint')} /><MobileFormInput placeholder="xtls-rprx-vision" value={formData.vlessFlow || ''} onChange={(value) => handleChange('vlessFlow', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fingerprintHint')} /><MobileSelect value={formData.vlessFingerprint || '__none__'} onChange={(value) => handleChange('vlessFingerprint', value === '__none__' ? '' : value)} options={[{ value: '__none__', label: t('common.none') }, ...TLS_FINGERPRINT_OPTIONS]} /></div></div>{showVlessWsFields && (<div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsH2Host')} /><MobileFormInput placeholder="example.com" value={formData.vlessHost || ''} onChange={(value) => handleChange('vlessHost', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsH2PathHint')} /><MobileFormInput placeholder="/ws" value={formData.vlessPath || ''} onChange={(value) => handleChange('vlessPath', value)} className="font-mono" /></div></div>)}{showVlessGrpcFields && (<div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.serviceName')} hint={t('admin.nodes.form.grpcServiceNameHint')} /><MobileFormInput placeholder="grpc-service" value={formData.vlessServiceName || ''} onChange={(value) => handleChange('vlessServiceName', value)} className="font-mono" /></div>)}{showVlessRealityFields && (<><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.publicKey')} hint={t('admin.nodes.form.realityPublicKeyHint')} /><MobileFormInput placeholder={t('admin.nodes.form.publicKeyPlaceholder')} value={formData.vlessRealityPublicKey || ''} onChange={(value) => handleChange('vlessRealityPublicKey', value)} className="font-mono text-xs" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.shortId')} /><MobileFormInput placeholder={t('admin.nodes.form.shortIdPlaceholder')} value={formData.vlessRealityShortId || ''} onChange={(value) => handleChange('vlessRealityShortId', value)} className="font-mono" /></div></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.spiderX')} hint={t('common.optional')} /><MobileFormInput placeholder="/" value={formData.vlessRealitySpiderX || ''} onChange={(value) => handleChange('vlessRealitySpiderX', value)} className="font-mono" /></div></>)}</>)}

              {isVmess && (<><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.alterId')} hint={t('admin.nodes.form.alterIdHint')} /><MobileFormInput type="number" inputMode="numeric" value={String(formData.vmessAlterId ?? 0)} onChange={(value) => handleChange('vmessAlterId', parseInt(value, 10) || 0)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.tls')} /><MobileSelect value={formData.vmessTls ? 'true' : 'false'} onChange={(value) => handleChange('vmessTls', value === 'true')} options={[{ value: 'true', label: t('admin.nodes.form.enableTls') }, { value: 'false', label: t('admin.nodes.form.disableTls') }]} /></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} /><MobileFormInput placeholder="example.com" value={formData.vmessSni || ''} onChange={(value) => handleChange('vmessSni', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} /><MobileSelect value={formData.vmessAllowInsecure ? 'true' : 'false'} onChange={(value) => handleChange('vmessAllowInsecure', value === 'true')} options={getTlsSecurityOptions(t)} /></div></div>{showVmessWsFields && (<div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsHttpHost')} /><MobileFormInput placeholder="example.com" value={formData.vmessHost || ''} onChange={(value) => handleChange('vmessHost', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsHttpPathHint')} /><MobileFormInput placeholder="/ws" value={formData.vmessPath || ''} onChange={(value) => handleChange('vmessPath', value)} className="font-mono" /></div></div>)}{showVmessGrpcFields && (<div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.serviceName')} hint={t('admin.nodes.form.grpcServiceNameHint')} /><MobileFormInput placeholder="grpc-service" value={formData.vmessServiceName || ''} onChange={(value) => handleChange('vmessServiceName', value)} className="font-mono" /></div>)}</>)}

              {isHysteria2 && (<><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} /><MobileFormInput placeholder="example.com" value={formData.hysteria2Sni || ''} onChange={(value) => handleChange('hysteria2Sni', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} /><MobileSelect value={formData.hysteria2AllowInsecure ? 'true' : 'false'} onChange={(value) => handleChange('hysteria2AllowInsecure', value === 'true')} options={getTlsSecurityOptions(t)} /></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.obfsType')} hint={t('admin.nodes.form.obfsTypeHint')} /><MobileFormInput placeholder="salamander" value={formData.hysteria2Obfs || ''} onChange={(value) => handleChange('hysteria2Obfs', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.obfsPassword')} /><MobileFormInput placeholder={t('common.placeholders.password')} value={formData.hysteria2ObfsPassword || ''} onChange={(value) => handleChange('hysteria2ObfsPassword', value)} className="font-mono" /></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.upBandwidth')} /><MobileFormInput type="number" inputMode="numeric" placeholder="100" value={formData.hysteria2UpMbps !== undefined ? String(formData.hysteria2UpMbps) : ''} onChange={(value) => handleChange('hysteria2UpMbps', value ? parseInt(value, 10) : undefined)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.downBandwidth')} /><MobileFormInput type="number" inputMode="numeric" placeholder="100" value={formData.hysteria2DownMbps !== undefined ? String(formData.hysteria2DownMbps) : ''} onChange={(value) => handleChange('hysteria2DownMbps', value ? parseInt(value, 10) : undefined)} className="font-mono" /></div></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fingerprintHint')} /><MobileSelect value={formData.hysteria2Fingerprint || '__none__'} onChange={(value) => handleChange('hysteria2Fingerprint', value === '__none__' ? '' : value)} options={[{ value: '__none__', label: t('common.none') }, ...TLS_FINGERPRINT_OPTIONS]} /></div></>)}

              {isTuic && (<><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} /><MobileFormInput placeholder="example.com" value={formData.tuicSni || ''} onChange={(value) => handleChange('tuicSni', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} /><MobileSelect value={formData.tuicAllowInsecure ? 'true' : 'false'} onChange={(value) => handleChange('tuicAllowInsecure', value === 'true')} options={getTlsSecurityOptions(t)} /></div></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.alpn')} hint={t('admin.nodes.form.alpnHint')} /><MobileFormInput placeholder="h3" value={formData.tuicAlpn || ''} onChange={(value) => handleChange('tuicAlpn', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.disableSni')} /><MobileSelect value={formData.tuicDisableSni ? 'true' : 'false'} onChange={(value) => handleChange('tuicDisableSni', value === 'true')} options={[{ value: 'false', label: t('admin.nodes.form.notDisabled') }, { value: 'true', label: t('admin.nodes.form.disableSniOption') }]} /></div></div></>)}

              {isAnytls && (<><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} /><MobileFormInput placeholder="example.com" value={formData.anytlsSni || ''} onChange={(value) => handleChange('anytlsSni', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} /><MobileSelect value={formData.anytlsAllowInsecure ? 'true' : 'false'} onChange={(value) => handleChange('anytlsAllowInsecure', value === 'true')} options={getTlsSecurityOptions(t)} /></div></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.anytls.fingerprint')} hint={t('admin.nodes.form.anytls.fingerprintHint')} /><MobileSelect value={formData.anytlsFingerprint || '__none__'} onChange={(value) => handleChange('anytlsFingerprint', value === '__none__' ? '' : value)} options={[{ value: '__none__', label: t('common.none') }, ...TLS_FINGERPRINT_OPTIONS]} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.anytls.idleCheckInterval')} /><MobileFormInput placeholder="30s" value={formData.anytlsIdleSessionCheckInterval || ''} onChange={(value) => handleChange('anytlsIdleSessionCheckInterval', value)} className="font-mono" /></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.anytls.idleTimeout')} /><MobileFormInput placeholder="30s" value={formData.anytlsIdleSessionTimeout || ''} onChange={(value) => handleChange('anytlsIdleSessionTimeout', value)} className="font-mono" /></div></div><div className="space-y-1.5"><FormFieldLabel label={t('admin.nodes.form.anytls.minIdleSession')} hint={t('admin.nodes.form.anytls.minIdleSessionHint')} /><MobileFormInput type="number" inputMode="numeric" placeholder="0" value={formData.anytlsMinIdleSession !== undefined ? String(formData.anytlsMinIdleSession) : ''} onChange={(value) => handleChange('anytlsMinIdleSession', value ? parseInt(value, 10) : undefined)} className="font-mono" /></div></>)}
            </div>
          </StepSection>

          {/* Step 4: Other Settings */}
          <StepSection step={STEPS[3]} title={t(STEPS[3].titleKey)} badge={hasOtherSettings ? t('admin.nodes.form.configured') : null} isOpen={openSections.has('other')} isCompleted={completedSteps.has('other')} onToggle={() => toggleSection('other')}>
            <div className="space-y-4">
              <div className="space-y-2">
                <FormFieldLabel label={t('admin.nodes.form.region')} hint={t('admin.nodes.form.regionHint')} />
                <QuickChips options={REGION_PRESETS} selected={formData.region} onSelect={(value) => handleChange('region', value)} />
                <MobileFormInput placeholder={t('admin.nodes.form.regionPlaceholder')} value={formData.region} onChange={(value) => handleChange('region', value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('common.fields.sortOrder')} hint={t('admin.nodes.form.sortOrderHint')} />
                  <MobileFormInput type="number" inputMode="numeric" value={String(formData.sortOrder)} onChange={(value) => handleChange('sortOrder', parseInt(value, 10) || 0)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.resourceGroups.title')} />
                  <MobileSelect value="__none__" onChange={() => {}} disabled={isLoadingGroups || isLoadingPlans} options={[{ value: '__none__', label: t('admin.nodes.form.noResourceGroup') }, ...filteredResourceGroups.map((g) => ({ value: g.sid, label: g.name }))]} />
                </div>
              </div>
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.tags')} hint={t('admin.nodes.form.tagsHint')} />
                <MobileFormInput placeholder={t('admin.nodes.form.tagsPlaceholder')} value={formData.tagsInput} onChange={(value) => handleChange('tagsInput', value)} />
              </div>
            </div>
          </StepSection>

          {/* Step 5: Route Config */}
          <StepSection step={STEPS[4]} title={t(STEPS[4].titleKey)} badge={formData.route ? t('admin.nodes.form.configured') : null} isOpen={openSections.has('route')} isCompleted={completedSteps.has('route')} onToggle={() => toggleSection('route')}>
            <RouteConfigEditor value={formData.route} onChange={handleRouteChange} idPrefix="create-node-sheet-route" nodes={nodes} />
          </StepSection>

          {/* Step 6: DNS Config */}
          <StepSection step={STEPS[5]} title={t(STEPS[5].titleKey)} badge={formData.dns ? t('admin.nodes.form.configured') : null} isOpen={openSections.has('dns')} isCompleted={completedSteps.has('dns')} onToggle={() => toggleSection('dns')}>
            <DnsConfigEditor value={formData.dns} onChange={handleDnsChange} idPrefix="create-node-sheet-dns" nodes={nodes} />
          </StepSection>
        </SheetBody>

        <SheetFooter>
          <div className="flex gap-2 w-full">
            <button type="button" onClick={handleSubmit} disabled={loading || !isFormValid} className={cn('flex-1 flex items-center justify-center gap-2', 'h-11 rounded-xl', 'bg-primary text-primary-foreground', 'text-sm font-medium', 'active:scale-[0.98] active:opacity-80 transition-all', 'disabled:opacity-50')}>
              {loading ? (<><Loader2 className="size-4 animate-spin" />{t('common.loading.creating')}</>) : (initialData ? t('admin.nodes.form.createCopy') : t('admin.nodes.form.createNode'))}
            </button>
            <button type="button" onClick={handleClose} disabled={loading} className={cn('flex-1 flex items-center justify-center', 'h-11 rounded-xl', 'ring-1 ring-border bg-background text-foreground', 'text-sm font-medium', 'active:scale-[0.98] active:opacity-80 transition-all', 'disabled:opacity-50')}>
              {t('common.actions.cancel')}
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
