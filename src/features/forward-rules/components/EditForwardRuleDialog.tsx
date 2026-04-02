/**
 * Edit Forward Rule Dialog Component
 * Matches CreateForwardRuleDialog layout: FormSection-based stacked form
 * Reuses shared components: ExitAgentConfigFields, TargetConfigFields, AdvancedOptionsFields
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { Info } from 'lucide-react';
import { SortableChainAgentList } from './SortableChainAgentList';
import { FormSection, FormField } from './form-primitives';
import { ExitAgentConfigFields } from './ExitAgentConfigFields';
import { TargetConfigFields } from './TargetConfigFields';
import { AdvancedOptionsFields } from './AdvancedOptionsFields';
import { RouteConfigEditor } from '@/features/nodes/components/RouteConfigEditor';
import { useEditForwardRuleForm } from '../hooks/useEditForwardRuleForm';
import type {
  ForwardRule,
  UpdateForwardRuleRequest,
  ForwardAgent,
  ForwardProtocol,
  TunnelType,
} from '@/api/forward';
import type { Node } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

// Rule type keys for translation lookup
const RULE_TYPE_KEYS: Record<string, string> = {
  direct: 'direct',
  entry: 'entry',
  chain: 'chain',
  direct_chain: 'directChain',
  external: 'external',
};

interface EditForwardRuleDialogProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateForwardRuleRequest) => void;
  nodes?: Node[];
  agents?: ForwardAgent[];
  resourceGroups?: ResourceGroup[];
  plansMap?: Record<string, SubscriptionPlan>;
}

export const EditForwardRuleDialog: React.FC<EditForwardRuleDialogProps> = ({
  open,
  rule,
  onClose,
  onSubmit,
  nodes = [],
  agents = [],
  resourceGroups = [],
  plansMap = {},
}) => {
  const { t } = useTranslation();
  const form = useEditForwardRuleForm({
    rule,
    agents,
    nodes,
    resourceGroups,
    plansMap,
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const selectedExitAgent = useMemo(
    () => agents.find((a) => a.id === form.formData.exitAgentId),
    [agents, form.formData.exitAgentId],
  );

  const handleSubmit = () => {
    if (rule && form.validate()) {
      const updates = form.buildSubmitData();
      if (Object.keys(updates).length > 0) {
        onSubmit(rule.id, updates);
      }
    }
  };

  if (!rule) return null;

  const isExternal = rule.ruleType === 'external';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="@container sm:max-w-2xl flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border/60 sm:px-6">
          <DialogTitle className="text-lg font-semibold">
            {t('admin.forwardRules.form.editRule')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-6">
            {/* Read-only Info Card */}
            <div className="grid grid-cols-6 gap-x-4 gap-y-1 rounded-lg bg-muted/40 border border-border/60 px-4 py-3">
              <div className="col-span-3 sm:col-span-2">
                <p className="text-xs text-muted-foreground/60">{t('admin.forwardRules.form.ruleId')}</p>
                <p className="text-[13px] font-mono text-muted-foreground truncate">{rule.id}</p>
              </div>
              <div className="col-span-3 sm:col-span-2">
                <p className="text-xs text-muted-foreground/60">{t('admin.forwardRules.form.ruleType')}</p>
                <p className="text-[13px] font-medium">
                  {t(`admin.forwardRules.ruleTypeInfo.${RULE_TYPE_KEYS[rule.ruleType] || rule.ruleType}.label`)}
                </p>
              </div>
              <div className="col-span-6 sm:col-span-2">
                <p className="text-xs text-muted-foreground/60">{t('admin.forwardRules.form.createdTime')}</p>
                <p className="text-[13px] text-muted-foreground">{formatDateTime(rule.createdAt)}</p>
              </div>
            </div>

            {/* Section 1: Basic Information */}
            <FormSection title={t('common.sections.editableInfo')}>
              <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                <FormField
                  label={t('admin.forwardRules.form.ruleName')}
                  required
                  error={form.errors.name}
                  className="col-span-6"
                >
                  <Input
                    value={form.formData.name || ''}
                    onChange={(e) => form.handleChange('name', e.target.value)}
                    error={!!form.errors.name}
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 2: External type fields */}
            {isExternal && (
              <FormSection title={t('admin.forwardRules.form.forwardConfig')}>
                <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                  <FormField
                    label={t('admin.forwardRules.form.serverAddress')}
                    required
                    error={form.errors.serverAddress}
                    className="col-span-6 sm:col-span-4"
                  >
                    <Input
                      value={form.formData.serverAddress || ''}
                      onChange={(e) =>
                        form.handleChange('serverAddress' as keyof UpdateForwardRuleRequest, e.target.value)
                      }
                      error={!!form.errors.serverAddress}
                      placeholder={t('admin.forwardRules.form.serverAddressPlaceholder')}
                    />
                  </FormField>

                  <FormField
                    label={t('admin.forwardRules.form.listenPort')}
                    required
                    error={form.errors.listenPort}
                    className="col-span-6 sm:col-span-2"
                  >
                    <Input
                      type="number"
                      min={1}
                      max={65535}
                      value={form.formData.listenPort || ''}
                      onChange={(e) =>
                        form.handleChange('listenPort', parseInt(e.target.value, 10) || 0)
                      }
                      error={!!form.errors.listenPort}
                      placeholder="1-65535"
                    />
                  </FormField>

                  <FormField
                    label={t('admin.forwardRules.form.targetNode')}
                    hint={t('admin.forwardRules.form.targetNodeHint')}
                    className="col-span-6 sm:col-span-3"
                  >
                    <Select
                      value={form.formData.targetNodeId || ''}
                      onValueChange={(value) => form.handleChange('targetNodeId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.forwardRules.form.selectTargetNodeOptional')} />
                      </SelectTrigger>
                      <SelectContent>
                        {form.availableNodes.map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            {node.name} ({node.serverAddress})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    label={t('admin.forwardRules.form.externalSource')}
                    hint={t('admin.forwardRules.form.externalSourceHint')}
                    className="col-span-6 sm:col-span-3"
                  >
                    <Input
                      value={form.formData.externalSource || ''}
                      onChange={(e) =>
                        form.handleChange('externalSource' as keyof UpdateForwardRuleRequest, e.target.value)
                      }
                      placeholder={t('admin.forwardRules.form.externalSourcePlaceholder')}
                    />
                  </FormField>

                  <FormField
                    label={t('admin.forwardRules.form.externalRuleId')}
                    hint={t('admin.forwardRules.form.externalRuleIdHint')}
                    className="col-span-6 sm:col-span-3"
                  >
                    <Input
                      value={form.formData.externalRuleId || ''}
                      onChange={(e) =>
                        form.handleChange('externalRuleId' as keyof UpdateForwardRuleRequest, e.target.value)
                      }
                      placeholder={t('admin.forwardRules.form.externalRuleIdPlaceholder')}
                    />
                  </FormField>
                </div>
              </FormSection>
            )}

            {/* Section 2: Forward Agent & Protocol (non-external) */}
            {!isExternal && (
              <FormSection title={t('admin.forwardRules.form.forwardAgent')}>
                <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                  <FormField
                    label={t('admin.forwardRules.form.entryAgent')}
                    required
                    className="col-span-6 sm:col-span-3"
                  >
                    <Select
                      value={form.formData.agentId || ''}
                      onValueChange={(value) => form.handleChange('agentId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.forwardRules.form.selectEntryAgent')} />
                      </SelectTrigger>
                      <SelectContent>
                        {form.availableAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <span className="flex items-center gap-2">
                              {agent.name}
                              {agent.allowedPortRange && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-warning/50 text-warning"
                                >
                                  {agent.allowedPortRange}
                                </Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    label={t('admin.forwardRules.form.listenPort')}
                    error={form.errors.listenPort}
                    className="col-span-3 sm:col-span-2"
                  >
                    <Input
                      type="number"
                      min={0}
                      max={65535}
                      value={form.formData.listenPort || ''}
                      onChange={(e) =>
                        form.handleChange('listenPort', parseInt(e.target.value, 10) || 0)
                      }
                      error={!!form.errors.listenPort}
                      placeholder={t('admin.forwardRules.form.listenPortAutoHint')}
                    />
                  </FormField>

                  <FormField
                    label={t('common.protocol')}
                    required
                    className="col-span-3 sm:col-span-1"
                  >
                    <Select
                      value={form.formData.protocol || 'tcp'}
                      onValueChange={(value) =>
                        form.handleChange('protocol', value as ForwardProtocol)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                        <SelectItem value="both">TCP/UDP</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  {/* Port Range Warning */}
                  {form.selectedAgent?.allowedPortRange && (
                    <div className="col-span-6 flex items-center gap-1.5 text-xs text-warning bg-warning/10 border border-warning/30 rounded-md px-2.5 py-1.5 -mt-2">
                      <Info className="size-3.5 shrink-0" />
                      <span>
                        {t('admin.forwardRules.form.portRestriction', {
                          range: form.selectedAgent.allowedPortRange,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </FormSection>
            )}

            {/* Section 3: Forwarding Configuration (all non-external types) */}
            {!isExternal && (
              <FormSection title={t('admin.forwardRules.form.forwardConfig')}>
                <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                  {/* Entry type: Exit Agent Configuration */}
                  {rule.ruleType === 'entry' && (
                    <ExitAgentConfigFields
                      exitMode={form.exitMode}
                      onExitModeChange={(value) => form.handleExitModeChange(value as 'single' | 'multi')}
                      exitAgentId={form.formData.exitAgentId || ''}
                      onExitAgentIdChange={(value) => form.handleChange('exitAgentId', value)}
                      selectedExitAgent={selectedExitAgent}
                      exitAgents={form.formData.exitAgents || []}
                      onExitAgentsChange={form.handleExitAgentsChange}
                      loadBalanceStrategy={form.formData.loadBalanceStrategy || 'failover'}
                      onLoadBalanceStrategyChange={(value) =>
                        form.handleLoadBalanceStrategyChange(value as 'failover' | 'weighted')
                      }
                      availableExitAgents={form.availableExitAgents}
                      tunnelType={form.formData.tunnelType || 'ws'}
                      onTunnelTypeChange={(value) =>
                        form.handleChange('tunnelType', value as TunnelType)
                      }
                      errors={form.errors as Record<string, string | undefined>}
                      idPrefix="edit-"
                    />
                  )}

                  {/* Chain type: Tunnel settings + Intermediate Nodes */}
                  {rule.ruleType === 'chain' && (
                    <>
                      <FormField
                        label={t('admin.forwardRules.form.tunnelType')}
                        className="col-span-3 sm:col-span-2"
                      >
                        <Select
                          value={form.formData.tunnelType || 'ws'}
                          onValueChange={(value) =>
                            form.handleChange('tunnelType', value as TunnelType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ws">WebSocket</SelectItem>
                            <SelectItem value="tls">TLS</SelectItem>
                            <SelectItem value="ws_smux">WebSocket + SMUX</SelectItem>
                            <SelectItem value="tls_smux">TLS + SMUX</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField
                        label={t('admin.forwardRules.form.tunnelHops')}
                        hint={t('admin.forwardRules.form.tunnelHopsHint')}
                        className="col-span-3 sm:col-span-2"
                      >
                        <Input
                          type="number"
                          min={0}
                          value={form.formData.tunnelHops ?? ''}
                          onChange={(e) => {
                            const value =
                              e.target.value === ''
                                ? undefined
                                : parseInt(e.target.value, 10);
                            form.handleChange('tunnelHops', value);
                          }}
                          placeholder={t('admin.forwardRules.form.tunnelHopsPlaceholder')}
                        />
                      </FormField>

                      <FormField
                        label={t('admin.forwardRules.form.chainNodes')}
                        required
                        error={form.errors.chainPortConfig}
                        className="col-span-6"
                      >
                        <SortableChainAgentList
                          agents={form.availableChainAgents}
                          selectedIds={form.formData.chainAgentIds || []}
                          onSelectionChange={form.handleChainSelectionChange}
                          showPortConfig={
                            form.formData.tunnelHops !== undefined &&
                            form.formData.tunnelHops >= 0 &&
                            form.formData.tunnelHops <
                              (form.formData.chainAgentIds?.length || 0)
                          }
                          portConfigStartIndex={form.formData.tunnelHops ?? 0}
                          portConfig={form.formData.chainPortConfig || {}}
                          onPortConfigChange={form.handleChainPortChange}
                          hasError={!!form.errors.chainPortConfig}
                          idPrefix="edit-chain-agent"
                        />
                      </FormField>
                    </>
                  )}

                  {/* direct_chain type: Chain Agents with port */}
                  {rule.ruleType === 'direct_chain' && (
                    <FormField
                      label={t('admin.forwardRules.form.chainNodesWithPort')}
                      required
                      error={form.errors.chainPortConfig}
                      className="col-span-6"
                    >
                      <SortableChainAgentList
                        agents={form.availableChainAgents}
                        selectedIds={form.formData.chainAgentIds || []}
                        onSelectionChange={form.handleChainSelectionChange}
                        showPortConfig
                        portConfig={form.formData.chainPortConfig || {}}
                        onPortConfigChange={form.handleChainPortChange}
                        hasError={!!form.errors.chainPortConfig}
                        idPrefix="edit-direct-chain-agent"
                      />
                    </FormField>
                  )}

                  {/* Target Configuration - all non-external types */}
                  <TargetConfigFields
                    targetType={form.targetType}
                    onTargetTypeChange={(value) =>
                      form.handleTargetTypeChange(value as 'manual' | 'node')
                    }
                    targetAddress={form.formData.targetAddress || ''}
                    onTargetAddressChange={(value) =>
                      form.handleChange('targetAddress', value)
                    }
                    targetPort={form.formData.targetPort || 0}
                    onTargetPortChange={(value) =>
                      form.handleChange('targetPort', value)
                    }
                    targetNodeId={form.formData.targetNodeId || ''}
                    onTargetNodeIdChange={(value) =>
                      form.handleChange('targetNodeId', value)
                    }
                    availableNodes={form.availableNodes}
                    errors={form.errors as Record<string, string | undefined>}
                    idPrefix="edit-"
                  />
                </div>
              </FormSection>
            )}

            {/* Section: Route Config (non-external types) */}
            {!isExternal && (
              <FormSection title={t('admin.nodes.route.title')}>
                <div className="col-span-6">
                  <RouteConfigEditor
                    value={form.formData.route}
                    onChange={form.handleRouteChange}
                    idPrefix="edit-rule-route"
                    nodes={nodes.map((n) => ({ id: n.id, name: n.name }))}
                  />
                  {form.errors.route && (
                    <p className="text-sm text-destructive mt-2">{form.errors.route}</p>
                  )}
                </div>
              </FormSection>
            )}

            {/* Section: Advanced Options (Collapsible) */}
            <AdvancedOptionsFields
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
              ruleType={rule.ruleType}
              formData={{
                ipVersion: form.formData.ipVersion || 'auto',
                bindIp: form.formData.bindIp || '',
                trafficMultiplier: form.formData.trafficMultiplier,
                sortOrder: form.formData.sortOrder,
                externalRuleId: form.formData.externalRuleId || '',
                externalSource: form.formData.externalSource,
                remark: form.formData.remark || '',
                groupSids: form.formData.groupSids || [],
                addressPreference: form.formData.addressPreference,
              }}
              onFieldChange={(field, value) =>
                form.handleChange(field as keyof UpdateForwardRuleRequest, value as string | number | undefined)
              }
              onGroupToggle={form.handleGroupToggle}
              availableResourceGroups={form.availableResourceGroups}
              plansMap={plansMap}
            />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 px-5 py-4 border-t border-border/60 bg-muted/30 sm:px-6">
          <div className="flex gap-3 justify-end w-full">
            <Button onClick={handleSubmit} disabled={!form.hasChanges}>
              {t('common.actions.save')}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t('common.actions.cancel')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
