/**
 * Edit node dialog component
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/shared/utils/date-utils';
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
import { NodeOtherSettingsFields, NodeNetworkFields } from './form-sections';
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
import { Server, Network, Shield, Settings, Route, Globe, Pencil } from 'lucide-react';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { RouteConfigEditor } from './RouteConfigEditor';
import { DnsConfigEditor } from './DnsConfigEditor';
import type { OutboundNodeOption } from '../utils/route-rule-utils';
import {
  SS_ENCRYPTION_METHODS,
  TRANSPORT_PROTOCOLS,
  VLESS_TRANSPORT_PROTOCOLS,
  VLESS_SECURITY_TYPES,
  VMESS_SECURITY_TYPES,
  VMESS_TRANSPORT_PROTOCOLS,
  CONGESTION_CONTROL_TYPES,
  TUIC_UDP_RELAY_MODES,
} from '@/shared/constants/protocol-options';
import {
  ShadowsocksConfigForm,
  TrojanConfigForm,
  VlessConfigForm,
  VmessConfigForm,
  Hysteria2ConfigForm,
  TuicConfigForm,
  AnyTLSConfigForm,
} from './protocol-forms';
import { useEditNodeForm } from '../hooks/useEditNodeForm';

interface EditNodeDialogProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateNodeRequest) => void;
  /** Available nodes for route outbound selection */
  nodes?: OutboundNodeOption[];
}

// Protocol display names
const PROTOCOL_NAMES: Record<NodeProtocol, string> = {
  shadowsocks: 'Shadowsocks',
  trojan: 'Trojan',
  vless: 'VLESS',
  vmess: 'VMess',
  hysteria2: 'Hysteria2',
  tuic: 'TUIC',
  anytls: 'AnyTLS',
};

// Section icon container for Accordion triggers
const SectionIcon: React.FC<{ icon: React.ElementType }> = ({ icon: Icon }) => (
  <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
    <Icon className="size-4" strokeWidth={1.5} />
  </div>
);

export const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
  open,
  node,
  onClose,
  onSubmit,
  nodes = [],
}) => {
  const { t } = useTranslation();
  const form = useEditNodeForm();
  const [prevNode, setPrevNode] = useState<Node | null>(null);

  // Sync form data when node changes
  if (node && node !== prevNode) {
    setPrevNode(node);
    form.initializeForm(node);
  }

  const {
    formData, errors, pluginOptsStr,
    handleChange, handlePluginOptsChange, handleRouteChange, handleDnsChange, handleCostLabelChange,
    getHasChanges, getHasProtocolSettings,
  } = form;

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

  const isShadowsocks = node?.protocol === 'shadowsocks';
  const isTrojan = node?.protocol === 'trojan';
  const isVless = node?.protocol === 'vless';
  const isVmess = node?.protocol === 'vmess';
  const isHysteria2 = node?.protocol === 'hysteria2';
  const isTuic = node?.protocol === 'tuic';
  const isAnytls = node?.protocol === 'anytls';

  const handleSubmit = () => {
    if (!node) return;
    const updates = form.validateAndBuild(node);
    if (updates) {
      onSubmit(node.id, updates);
    }
  };

  const hasChanges = getHasChanges(node);
  const hasProtocolSettings = getHasProtocolSettings(node?.protocol);

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Pencil className="size-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {t('admin.nodes.form.editNode')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {PROTOCOL_NAMES[node.protocol]} &middot; {node.name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <Accordion
            type="multiple"
            defaultValue={['basic', 'network']}
            className="w-full"
          >
            {/* Basic Info */}
            <AccordionItem value="basic" className="rounded-xl ring-1 ring-border px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Server} />
                  <span className="text-sm font-medium">{t('common.sections.basicInfo')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                  {/* Node ID (readonly) */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="node_id">{t('admin.nodes.form.nodeId')}</Label>
                    <Input id="node_id" value={node.id} disabled />
                  </div>

                  {/* Created At (readonly) */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="createdAt">{t('common.fields.createdAt')}</Label>
                    <Input
                      id="createdAt"
                      value={formatDateTime(node.createdAt)}
                      disabled
                    />
                  </div>

                  {/* Node Name */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">{t('admin.nodes.form.nodeName')}</Label>
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

                  {/* Protocol Type (readonly) */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="protocol">{t('admin.nodes.form.protocolType')}</Label>
                    <Input
                      id="protocol"
                      value={PROTOCOL_NAMES[node.protocol]}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">{t('admin.nodes.form.protocolCannotChange')}</p>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="status">{t('common.status.label')}</Label>
                    <Select
                      value={formData.status || 'inactive'}
                      onValueChange={(value) => handleChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('common.status.enabled')}</SelectItem>
                        <SelectItem value="inactive">{t('common.status.disabled')}</SelectItem>
                        <SelectItem value="maintenance">{t('common.status.maintenance')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shadowsocks Encryption Method */}
                  {isShadowsocks && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="encryptionMethod">{t('admin.nodes.form.encryptionMethod')}</Label>
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

                  {/* Trojan Transport Protocol */}
                  {isTrojan && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="transportProtocol">{t('admin.nodes.form.transportProtocol')}</Label>
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

                  {/* VLESS Basic Config */}
                  {isVless && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessTransportType">{t('admin.nodes.form.transportProtocol')}</Label>
                        <Select
                          value={formData.vlessTransportType || 'tcp'}
                          onValueChange={(value) => handleChange('vlessTransportType', value as TransportProtocol)}
                        >
                          <SelectTrigger id="vlessTransportType">
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
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessSecurity">{t('admin.nodes.form.securityType')}</Label>
                        <Select
                          value={formData.vlessSecurity || 'tls'}
                          onValueChange={(value) => handleChange('vlessSecurity', value as VLESSSecurity)}
                        >
                          <SelectTrigger id="vlessSecurity">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VLESS_SECURITY_TYPES.map((security) => (
                              <SelectItem key={security} value={security}>
                                {security.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* VMess Basic Config */}
                  {isVmess && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vmessTransportType">{t('admin.nodes.form.transportProtocol')}</Label>
                        <Select
                          value={formData.vmessTransportType || 'tcp'}
                          onValueChange={(value) => handleChange('vmessTransportType', value as TransportProtocol)}
                        >
                          <SelectTrigger id="vmessTransportType">
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
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vmessSecurity">{t('admin.nodes.form.encryptionMethod')}</Label>
                        <Select
                          value={formData.vmessSecurity || 'auto'}
                          onValueChange={(value) => handleChange('vmessSecurity', value as VMessSecurity)}
                        >
                          <SelectTrigger id="vmessSecurity">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VMESS_SECURITY_TYPES.map((security) => (
                              <SelectItem key={security} value={security}>
                                {security}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Hysteria2 Basic Config */}
                  {isHysteria2 && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="hysteria2CongestionControl">{t('admin.nodes.form.congestionControl')}</Label>
                      <Select
                        value={formData.hysteria2CongestionControl || 'bbr'}
                        onValueChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)}
                      >
                        <SelectTrigger id="hysteria2CongestionControl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONGESTION_CONTROL_TYPES.map((cc) => (
                            <SelectItem key={cc} value={cc}>
                              {cc.toUpperCase().replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* TUIC Basic Config */}
                  {isTuic && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="tuicCongestionControl">{t('admin.nodes.form.congestionControl')}</Label>
                        <Select
                          value={formData.tuicCongestionControl || 'bbr'}
                          onValueChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                        >
                          <SelectTrigger id="tuicCongestionControl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONGESTION_CONTROL_TYPES.map((cc) => (
                              <SelectItem key={cc} value={cc}>
                                {cc.toUpperCase().replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="tuicUdpRelayMode">{t('admin.nodes.form.udpRelayMode')}</Label>
                        <Select
                          value={formData.tuicUdpRelayMode || 'native'}
                          onValueChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                        >
                          <SelectTrigger id="tuicUdpRelayMode">
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
                      </div>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Network Config */}
            <AccordionItem value="network" className="rounded-xl ring-1 ring-border px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Network} />
                  <span className="text-sm font-medium">{t('common.sections.networkConfig')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <NodeNetworkFields
                  variant="desktop"
                  serverAddress={formData.serverAddress}
                  agentPort={formData.agentPort}
                  subscriptionPort={formData.subscriptionPort}
                  onFieldChange={handleChange}
                  errors={errors}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Protocol Config */}
            <AccordionItem value="protocol" className="rounded-xl ring-1 ring-border px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Shield} />
                  <span className="text-sm font-medium">
                    {PROTOCOL_NAMES[node.protocol]} {t('admin.nodes.form.config')}
                  </span>
                  {hasProtocolSettings && (
                    <Badge variant="secondary" className="text-xs">{t('admin.nodes.form.configured')}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                  {/* Shadowsocks Plugin */}
                  {isShadowsocks && (
                    <div className="@md:col-span-2">
                      <ShadowsocksConfigForm
                        plugin={formData.plugin}
                        pluginOptsString={pluginOptsStr}
                        onPluginChange={(value) => handleChange('plugin', value)}
                        onPluginOptsChange={handlePluginOptsChange}
                        errors={errors}
                      />
                    </div>
                  )}

                  {/* Trojan Config */}
                  {isTrojan && (
                    <div className="@md:col-span-2">
                      <TrojanConfigForm
                        sni={formData.sni}
                        allowInsecure={formData.allowInsecure}
                        transportProtocol={formData.transportProtocol}
                        host={formData.host}
                        path={formData.path}
                        onFieldChange={handleChange}
                        errors={errors}
                      />
                    </div>
                  )}

                  {/* VLESS Config */}
                  {isVless && (
                    <div className="@md:col-span-2">
                      <VlessConfigForm
                        transportType={formData.vlessTransportType}
                        security={formData.vlessSecurity}
                        sni={formData.vlessSni}
                        allowInsecure={formData.vlessAllowInsecure}
                        flow={formData.vlessFlow}
                        fingerprint={formData.vlessFingerprint}
                        host={formData.vlessHost}
                        path={formData.vlessPath}
                        serviceName={formData.vlessServiceName}
                        realityPublicKey={formData.vlessRealityPublicKey}
                        realityShortId={formData.vlessRealityShortId}
                        realitySpiderX={formData.vlessRealitySpiderX}
                        onFieldChange={handleChange}
                        errors={errors}
                      />
                    </div>
                  )}

                  {/* VMess Config */}
                  {isVmess && (
                    <div className="@md:col-span-2">
                      <VmessConfigForm
                        transportType={formData.vmessTransportType}
                        security={formData.vmessSecurity}
                        alterId={formData.vmessAlterId}
                        tls={formData.vmessTls}
                        sni={formData.vmessSni}
                        allowInsecure={formData.vmessAllowInsecure}
                        host={formData.vmessHost}
                        path={formData.vmessPath}
                        serviceName={formData.vmessServiceName}
                        onFieldChange={handleChange}
                        errors={errors}
                      />
                    </div>
                  )}

                  {/* Hysteria2 Config */}
                  {isHysteria2 && (
                    <div className="@md:col-span-2">
                      <Hysteria2ConfigForm
                        congestionControl={formData.hysteria2CongestionControl}
                        sni={formData.hysteria2Sni}
                        allowInsecure={formData.hysteria2AllowInsecure}
                        obfs={formData.hysteria2Obfs}
                        obfsPassword={formData.hysteria2ObfsPassword}
                        upMbps={formData.hysteria2UpMbps}
                        downMbps={formData.hysteria2DownMbps}
                        fingerprint={formData.hysteria2Fingerprint}
                        onFieldChange={handleChange}
                        errors={errors}
                      />
                    </div>
                  )}

                  {/* TUIC Config */}
                  {isTuic && (
                    <div className="@md:col-span-2">
                      <TuicConfigForm
                        congestionControl={formData.tuicCongestionControl}
                        udpRelayMode={formData.tuicUdpRelayMode}
                        sni={formData.tuicSni}
                        allowInsecure={formData.tuicAllowInsecure}
                        alpn={formData.tuicAlpn}
                        disableSni={formData.tuicDisableSni}
                        onFieldChange={handleChange}
                        errors={errors}
                      />
                    </div>
                  )}

                  {/* AnyTLS Config */}
                  {isAnytls && (
                    <div className="@md:col-span-2">
                      <AnyTLSConfigForm
                        sni={formData.anytlsSni}
                        allowInsecure={formData.anytlsAllowInsecure}
                        fingerprint={formData.anytlsFingerprint}
                        idleSessionCheckInterval={formData.anytlsIdleSessionCheckInterval}
                        idleSessionTimeout={formData.anytlsIdleSessionTimeout}
                        minIdleSession={formData.anytlsMinIdleSession}
                        onFieldChange={handleChange}
                        errors={errors}
                      />
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Other Settings */}
            <AccordionItem value="other" className="rounded-xl ring-1 ring-border px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Settings} />
                  <span className="text-sm font-medium">{t('admin.nodes.form.section.otherSettings')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <NodeOtherSettingsFields
                  variant="desktop"
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
              </AccordionContent>
            </AccordionItem>

            {/* Route Config */}
            <AccordionItem value="route" className="rounded-xl ring-1 ring-border px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Route} />
                  <span className="text-sm font-medium">{t('admin.nodes.form.section.routeConfig')}</span>
                  {formData.route && (
                    <Badge variant="secondary" className="text-xs">{t('admin.nodes.form.configured')}</Badge>
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
                {errors.route && (
                  <p className="text-sm text-destructive mt-2">{errors.route}</p>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* DNS Config */}
            <AccordionItem value="dns" className="rounded-xl ring-1 ring-border px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Globe} />
                  <span className="text-sm font-medium">{t('admin.nodes.form.section.dnsConfig')}</span>
                  {formData.dns && (
                    <Badge variant="secondary" className="text-xs">{t('admin.nodes.form.configured')}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <DnsConfigEditor
                  value={formData.dns ?? undefined}
                  onChange={handleDnsChange}
                  idPrefix="edit-node-dns"
                  nodes={nodes}
                  currentNodeId={node?.id}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button onClick={handleSubmit} disabled={!hasChanges}>
            {t('common.actions.save')}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
