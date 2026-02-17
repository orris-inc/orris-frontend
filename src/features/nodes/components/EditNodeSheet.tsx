/**
 * Edit Node Sheet Component
 * Mobile-optimized bottom sheet for editing nodes
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Network,
  Shield,
  Settings,
  Route,
  Globe,
  ChevronDown,
  Zap,
  Lock,
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
  type EditSheetProps,
} from '@/components/common/sheet';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { RouteConfigEditor } from './RouteConfigEditor';
import { DnsConfigEditor } from './DnsConfigEditor';
import { MobileProtocolSettingsFields, NodeOtherSettingsFields, NodeNetworkFields } from './form-sections';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import type { OutboundNodeOption } from '../utils/route-rule-utils';
import type {
  Node,
  UpdateNodeRequest,
  TransportProtocol,
  NodeProtocol,
  VLESSSecurity,
  VMessSecurity,
  CongestionControl,
  TUICUDPRelayMode,
} from '@/api/node';
import {
  SS_ENCRYPTION_METHODS,
  TRANSPORT_PROTOCOLS,
  VLESS_TRANSPORT_PROTOCOLS,
  VMESS_TRANSPORT_PROTOCOLS,
  VLESS_SECURITY_TYPES,
  VMESS_SECURITY_TYPES,
  CONGESTION_CONTROL_TYPES,
  TUIC_UDP_RELAY_MODES,
} from '@/shared/constants/protocol-options';
import { useEditNodeForm } from '../hooks/useEditNodeForm';

interface EditNodeSheetProps extends EditSheetProps<Node, UpdateNodeRequest> {
  nodes?: OutboundNodeOption[];
}

// Status options for MobileSelect - labels will be translated in component
const STATUS_OPTIONS_VALUES = ['active', 'inactive', 'maintenance'] as const;
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success',
  inactive: 'bg-gray-400',
  maintenance: 'bg-warning',
};

// Protocol configuration for display
const PROTOCOL_CONFIG: Record<NodeProtocol, { name: string; icon: React.ElementType }> = {
  shadowsocks: { name: 'Shadowsocks', icon: Zap },
  trojan: { name: 'Trojan', icon: Lock },
  vless: { name: 'VLESS', icon: Radio },
  vmess: { name: 'VMess', icon: Layers },
  hysteria2: { name: 'Hysteria2', icon: Gauge },
  tuic: { name: 'TUIC', icon: Workflow },
  anytls: { name: 'AnyTLS', icon: ShieldCheck },
};

// Mobile Collapsible Section - Tailwind Application UI style
interface MobileSectionProps {
  title: string;
  icon: React.ElementType;
  badge?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const MobileSection: React.FC<MobileSectionProps> = ({
  title,
  icon: Icon,
  badge,
  isOpen,
  onToggle,
  children,
}) => (
  <div className={cn(cardStyles, 'overflow-hidden')}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-muted/50 active:scale-[0.99] transition-all min-h-[52px]"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'size-8 rounded-lg flex items-center justify-center transition-colors',
          isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
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
      <ChevronDown className={cn(
        'size-4 text-muted-foreground transition-transform duration-200',
        isOpen && 'rotate-180'
      )} />
    </button>
    <div className={cn(
      'overflow-hidden transition-all duration-200',
      isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
    )}>
      <div className="px-4 pb-4 pt-2 border-t border-border">
        {children}
      </div>
    </div>
  </div>
);

// Form Field Label - compact style
interface FormFieldLabelProps {
  label: string;
  hint?: string;
  showHint?: boolean;
}

const FormFieldLabel: React.FC<FormFieldLabelProps> = ({
  label,
  hint,
  showHint = true,
}) => (
  <div className="space-y-0.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {hint && showHint && (
      <p className="text-[11px] text-muted-foreground leading-tight">{hint}</p>
    )}
  </div>
);

export const EditNodeSheet: React.FC<EditNodeSheetProps> = ({
  open,
  onOpenChange,
  entity: node,
  onSubmit,
  nodes = [],
}) => {
  const { t } = useTranslation();
  const form = useEditNodeForm();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic', 'network']));
  const [loading, setLoading] = useState(false);
  const [prevNode, setPrevNode] = useState<Node | null>(null);

  // Sync form data when node changes
  if (node && node !== prevNode) {
    setPrevNode(node);
    form.initializeForm(node);
    setOpenSections(new Set(['basic', 'network']));
  }

  const {
    formData, errors, pluginOptsStr,
    handleChange, handlePluginOptsChange, handleRouteChange, handleDnsChange, handleCostLabelChange,
    getHasChanges, getHasProtocolSettings,
  } = form;

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

  // Translated select options
  const statusOptions: MobileSelectOption[] = useMemo(() =>
    STATUS_OPTIONS_VALUES.map((value) => ({
      value,
      label: t(`admin.nodes.form.status.${value}`),
      color: STATUS_COLORS[value],
    })), [t]);

  const vlessSecurityOptions: MobileSelectOption[] = useMemo(() =>
    VLESS_SECURITY_TYPES.map((value) => ({
      value,
      label: value === 'none' ? t('admin.nodes.form.disableTls') : value.toUpperCase(),
    })), [t]);

  const vmessSecurityOptions: MobileSelectOption[] = useMemo(() =>
    VMESS_SECURITY_TYPES.map((value) => ({
      value,
      label: value === 'auto' ? `Auto (${t('common.recommended')})` : value === 'none' ? t('admin.nodes.form.disableTls') : value.toUpperCase(),
    })), [t]);

  const congestionControlOptions: MobileSelectOption[] = useMemo(() =>
    CONGESTION_CONTROL_TYPES.map((value) => ({
      value,
      label: value === 'bbr' ? `BBR (${t('common.recommended')})` : value.replace('_', ' ').toUpperCase(),
    })), [t]);

  const udpRelayModeOptions: MobileSelectOption[] = useMemo(() =>
    TUIC_UDP_RELAY_MODES.map((value) => ({
      value,
      label: value.toUpperCase(),
    })), []);

  const handleClose = useCallback((o: boolean) => {
    if (!loading) {
      onOpenChange(o);
    }
  }, [loading, onOpenChange]);

  const isShadowsocks = node?.protocol === 'shadowsocks';
  const isTrojan = node?.protocol === 'trojan';
  const isVless = node?.protocol === 'vless';
  const isVmess = node?.protocol === 'vmess';
  const isHysteria2 = node?.protocol === 'hysteria2';
  const isTuic = node?.protocol === 'tuic';

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

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    if (!node) return;
    const updates = form.validateAndBuild(node);
    if (updates) {
      setLoading(true);
      try {
        await onSubmit(node.id, updates);
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const hasChanges = getHasChanges(node);
  const hasProtocolSettings = getHasProtocolSettings(node?.protocol);

  if (!node) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('admin.nodes.form.editNode')}</SheetTitle>
          <SheetDescription>
            {t('admin.nodes.form.editNodeDesc', { name: node.name })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Basic Info Section */}
          <MobileSection
            title={t('common.sections.basicInfo')}
            icon={Server}
            isOpen={openSections.has('basic')}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.nodeId')} hint={t('admin.nodes.form.protocolCannotChange')} />
                <MobileFormInput value={node.id} disabled className="font-mono bg-muted" />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.nodeName')} />
                <MobileFormInput
                  value={formData.name || ''}
                  onChange={(value) => handleChange('name', value)}
                  error={errors.name}
                />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.protocolType')} hint={t('admin.nodes.form.protocolCannotChange')} />
                <MobileFormInput
                  value={PROTOCOL_CONFIG[node.protocol]?.name || node.protocol}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('common.status.label')} />
                <MobileSelect
                  value={formData.status || 'inactive'}
                  onChange={(value) => handleChange('status', value)}
                  options={statusOptions}
                />
              </div>

              {isShadowsocks && (
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.encryptionMethod')} />
                  <MobileSelect
                    value={formData.encryptionMethod || ''}
                    onChange={(value) => handleChange('encryptionMethod', value)}
                    options={SS_ENCRYPTION_METHODS.map((method) => ({
                      value: method,
                      label: method,
                    }))}
                  />
                </div>
              )}

              {isTrojan && (
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.transportProtocol')} />
                  <MobileSelect
                    value={formData.transportProtocol || 'tcp'}
                    onChange={(value) => handleChange('transportProtocol', value)}
                    options={TRANSPORT_PROTOCOLS.map((protocol) => ({
                      value: protocol,
                      label: protocol.toUpperCase(),
                    }))}
                  />
                </div>
              )}

              {isVless && (
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
                      options={vlessSecurityOptions}
                    />
                  </div>
                </div>
              )}

              {isVmess && (
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
                      options={vmessSecurityOptions}
                    />
                  </div>
                </div>
              )}

              {isHysteria2 && (
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.congestionControl')} />
                  <MobileSelect
                    value={formData.hysteria2CongestionControl || 'bbr'}
                    onChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)}
                    options={congestionControlOptions}
                  />
                </div>
              )}

              {isTuic && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.congestionControl')} />
                    <MobileSelect
                      value={formData.tuicCongestionControl || 'bbr'}
                      onChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                      options={congestionControlOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.udpRelayMode')} />
                    <MobileSelect
                      value={formData.tuicUdpRelayMode || 'native'}
                      onChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                      options={udpRelayModeOptions}
                    />
                  </div>
                </div>
              )}
            </div>
          </MobileSection>

          {/* Network Section */}
          <MobileSection
            title={t('common.sections.networkConfig')}
            icon={Network}
            isOpen={openSections.has('network')}
            onToggle={() => toggleSection('network')}
          >
            <NodeNetworkFields
              variant="mobile"
              serverAddress={formData.serverAddress}
              agentPort={formData.agentPort}
              subscriptionPort={formData.subscriptionPort}
              onFieldChange={handleChange}
              errors={errors}
            />
          </MobileSection>

          {/* Protocol Settings Section */}
          <MobileSection
            title={`${PROTOCOL_CONFIG[node.protocol]?.name || node.protocol} ${t('admin.nodes.form.config')}`}
            icon={PROTOCOL_CONFIG[node.protocol]?.icon || Shield}
            badge={hasProtocolSettings ? t('admin.nodes.form.configured') : null}
            isOpen={openSections.has('protocol')}
            onToggle={() => toggleSection('protocol')}
          >
            <MobileProtocolSettingsFields
              protocol={node.protocol}
              formData={formData as unknown as Record<string, unknown>}
              onFieldChange={handleChange}
              pluginOptsStr={pluginOptsStr}
              onPluginOptsChange={handlePluginOptsChange}
              showWsFields={showWsFields}
              showGrpcFields={showGrpcFields}
              showVlessWsFields={showVlessWsFields}
              showVlessGrpcFields={showVlessGrpcFields}
              showVlessRealityFields={showVlessRealityFields}
              showVmessWsFields={showVmessWsFields}
              showVmessGrpcFields={showVmessGrpcFields}
            />
          </MobileSection>

          {/* Other Settings Section */}
          <MobileSection
            title={t('admin.nodes.form.section.otherSettings')}
            icon={Settings}
            isOpen={openSections.has('other')}
            onToggle={() => toggleSection('other')}
          >
            <NodeOtherSettingsFields
              variant="mobile"
              mode="edit"
              formData={{
                region: formData.region,
                sortOrder: formData.sortOrder,
                tagsInput: formData.tagsInput,
                groupSids: formData.groupSids,
                muteNotification: formData.muteNotification,
                expiresAt: formData.expiresAt,
                costLabel: formData.costLabel,
              }}
              onFieldChange={handleChange}
              onCostLabelChange={handleCostLabelChange}
              onGroupToggle={(sid, checked) => {
                form.setFormData((prev) => ({
                  ...prev,
                  groupSids: checked
                    ? [...prev.groupSids, sid]
                    : prev.groupSids.filter((id) => id !== sid),
                }));
              }}
              onGroupRemove={(sid) => {
                form.setFormData((prev) => ({
                  ...prev,
                  groupSids: prev.groupSids.filter((id) => id !== sid),
                }));
              }}
              filteredResourceGroups={filteredResourceGroups}
              isLoading={isLoadingGroups || isLoadingPlans}
            />
          </MobileSection>

          {/* Route Config Section */}
          <MobileSection
            title={t('admin.nodes.form.section.routeConfig')}
            icon={Route}
            badge={formData.route ? t('admin.nodes.form.configured') : null}
            isOpen={openSections.has('route')}
            onToggle={() => toggleSection('route')}
          >
            <RouteConfigEditor
              value={formData.route ?? undefined}
              onChange={handleRouteChange}
              idPrefix="edit-node-sheet-route"
              nodes={nodes}
              currentNodeId={node?.id}
            />
          </MobileSection>

          {/* DNS Config */}
          <MobileSection
            title={t('admin.nodes.form.section.dnsConfig')}
            icon={Globe}
            badge={formData.dns ? t('admin.nodes.form.configured') : null}
            isOpen={openSections.has('dns')}
            onToggle={() => toggleSection('dns')}
          >
            <DnsConfigEditor
              value={formData.dns ?? undefined}
              onChange={handleDnsChange}
              idPrefix="edit-node-sheet-dns"
              nodes={nodes}
              currentNodeId={node?.id}
            />
          </MobileSection>
        </SheetBody>

        <SheetFooter>
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !hasChanges}
              className={cn(
                'flex-1 flex items-center justify-center',
                'h-11 rounded-xl',
                'bg-primary text-primary-foreground',
                'text-sm font-medium',
                'active:scale-[0.98] active:opacity-80 transition-all',
                'disabled:opacity-50'
              )}
            >
              {loading ? t('common.loading.saving') : t('common.actions.save')}
            </button>
            <button
              type="button"
              onClick={() => handleClose(false)}
              disabled={loading}
              className={cn(
                'flex-1 flex items-center justify-center',
                'h-11 rounded-xl',
                'ring-1 ring-border bg-background text-foreground',
                'text-sm font-medium',
                'active:scale-[0.98] active:opacity-80 transition-all',
                'disabled:opacity-50'
              )}
            >
              {t('common.actions.cancel')}
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
