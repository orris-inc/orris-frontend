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
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Checkbox } from '@/components/common/Checkbox';
import { ExpirationDatePicker } from '@/components/common/ExpirationDatePicker';
import { Layers, X } from 'lucide-react';
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
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { RouteConfigEditor } from './RouteConfigEditor';
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
};



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
    handleChange, handlePluginOptsChange, handleRouteChange, handleCostLabelChange,
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
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('admin.nodes.form.editNode')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <Accordion
            type="multiple"
            defaultValue={['basic', 'network']}
            className="w-full"
          >
            {/* Basic Info */}
            <AccordionItem value="basic" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
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
            <AccordionItem value="network" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('common.sections.networkConfig')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                  {/* Server Address */}
                  <div className="flex flex-col gap-2 @md:col-span-2">
                    <Label htmlFor="serverAddress">{t('admin.nodes.form.serverAddress')}</Label>
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

                  {/* Agent Port */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="agentPort">{t('admin.nodes.form.agentPort')}</Label>
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

                  {/* Subscription Port */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="subscriptionPort">{t('admin.nodes.form.subscriptionPort')}</Label>
                    <Input
                      id="subscriptionPort"
                      type="number"
                      min={1}
                      max={65535}
                      placeholder={t('admin.nodes.form.subscriptionPortPlaceholder')}
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

            {/* Protocol Config */}
            <AccordionItem value="protocol" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
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
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Other Settings */}
            <AccordionItem value="other" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('admin.nodes.form.section.otherSettings')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                  {/* Region */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="region">{t('admin.nodes.form.region')}</Label>
                    <Input
                      id="region"
                      value={formData.region || ''}
                      onChange={(e) => handleChange('region', e.target.value)}
                    />
                  </div>

                  {/* Sort Order */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sortOrder">{t('common.fields.sortOrder')}</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder ?? 0}
                      onChange={(e) => handleChange('sortOrder', parseInt(e.target.value, 10) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">{t('admin.nodes.form.sortOrderHint')}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-col gap-2 @md:col-span-2">
                    <Label htmlFor="tagsInput">{t('admin.nodes.form.tags')}</Label>
                    <Input
                      id="tagsInput"
                      placeholder={t('admin.nodes.form.tagsPlaceholder')}
                      value={formData.tagsInput ?? ''}
                      onChange={(e) => handleChange('tagsInput', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.nodes.form.tagsHint')}
                    </p>
                  </div>

                  {/* Resource Groups (multi-select) */}
                  <div className="flex flex-col gap-2 @md:col-span-2">
                    <Label>{t('admin.nodes.form.resourceGroup')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.nodes.form.resourceGroupSelectHint')}
                    </p>

                    {/* Selected groups chips */}
                    {formData.groupSids.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.groupSids.map((sid) => {
                          const group = filteredResourceGroups.find((g) => g.sid === sid);
                          return (
                            <Badge key={sid} variant="secondary" className="gap-1 pr-1">
                              <Layers className="size-3" />
                              {group?.name ?? sid}
                              <button
                                type="button"
                                onClick={() => form.setFormData((prev) => ({
                                  ...prev,
                                  groupSids: prev.groupSids.filter((id) => id !== sid),
                                }))}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Group selection list */}
                    <div className="border rounded-lg max-h-[120px] overflow-y-auto">
                      {isLoadingGroups || isLoadingPlans ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">{t('common.table.loading')}</div>
                      ) : filteredResourceGroups.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">{t('admin.nodes.detail.noResourceGroups')}</div>
                      ) : (
                        <div className="divide-y">
                          {filteredResourceGroups.map((group) => (
                            <label
                              key={group.sid}
                              className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <Checkbox
                                checked={formData.groupSids.includes(group.sid)}
                                onCheckedChange={(checked) => {
                                  form.setFormData((prev) => ({
                                    ...prev,
                                    groupSids: checked
                                      ? [...prev.groupSids, group.sid]
                                      : prev.groupSids.filter((id) => id !== group.sid),
                                  }));
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{group.name}</span>
                                  <Badge variant={group.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                    {group.status === 'active' ? t('common.status.enabled') : t('common.status.disabled')}
                                  </Badge>
                                </div>
                                {group.description && <p className="text-xs text-muted-foreground truncate">{group.description}</p>}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mute Notification */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="muteNotification">{t('admin.nodes.form.muteNotification')}</Label>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="muteNotification"
                        checked={formData.muteNotification ?? false}
                        onCheckedChange={(checked) => handleChange('muteNotification', checked)}
                      >
                        <SwitchThumb />
                      </Switch>
                      <span className="text-sm text-muted-foreground">
                        {formData.muteNotification ? t('admin.nodes.form.muted') : t('admin.nodes.form.unmuted')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.nodes.form.muteNotificationHint')}
                    </p>
                  </div>

                  {/* Expiration time */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="expiresAt">{t('common.fields.expiresAt')}</Label>
                    <ExpirationDatePicker
                      value={formData.expiresAt}
                      onChange={(value) => handleChange("expiresAt", value ?? "")}
                      emptyValue=""
                      id="expiresAt"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.nodes.form.expiresAtHint')}
                    </p>
                  </div>

                  {/* Cost label */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="costLabel">{t('common.fields.costLabel')}</Label>
                    <Input
                      id="costLabel"
                      type="text"
                      value={formData.costLabel ?? ""}
                      onChange={(e) => handleCostLabelChange(e.target.value)}
                      placeholder={t('common.costLabel.placeholder')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('common.costLabel.hint')}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Route Config */}
            <AccordionItem value="route" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
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
