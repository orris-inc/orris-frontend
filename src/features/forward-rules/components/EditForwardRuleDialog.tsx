/**
 * Edit Forward Rule Dialog Component
 * Supports targetNodeId (dynamic node address resolution)
 */

import { useTranslation } from "react-i18next";
import { formatDateTime } from '@/shared/utils/date-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/common/Dialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Label } from "@/components/common/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";
import { RadioGroup, RadioGroupItem } from "@/components/common/RadioGroup";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/common/Accordion";
import { Badge } from "@/components/common/Badge";
import { Checkbox } from "@/components/common/Checkbox";
import { ScrollArea } from "@/components/common/ScrollArea";
import { Info, FolderTree } from "lucide-react";
import { SortableChainAgentList } from "./SortableChainAgentList";
import { ExitAgentList } from "./ExitAgentList";
import { useEditForwardRuleForm } from '../hooks/useEditForwardRuleForm';
import type {
  ForwardRule,
  UpdateForwardRuleRequest,
  IPVersion,
  ForwardAgent,
  TunnelType,
} from "@/api/forward";
import type { Node } from "@/api/node";
import type { ResourceGroup } from "@/api/resource/types";
import type { SubscriptionPlan } from "@/api/subscription/types";

type ForwardProtocol = "tcp" | "udp" | "both";

// Rule type keys for translation lookup
const RULE_TYPE_KEYS: Record<string, string> = {
  direct: "direct",
  entry: "entry",
  chain: "chain",
  direct_chain: "directChain",
  external: "external",
};

interface EditForwardRuleDialogProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateForwardRuleRequest) => void;
  nodes?: Node[];
  agents?: ForwardAgent[];
  /** Resource groups for binding (only node/hybrid plan groups can bind rules) */
  resourceGroups?: ResourceGroup[];
  /** Subscription plans map for filtering resource groups by plan type */
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

  const handleSubmit = () => {
    if (rule && form.validate()) {
      const updates = form.buildSubmitData();
      if (Object.keys(updates).length > 0) {
        onSubmit(rule.id, updates);
      }
    }
  };

  if (!rule) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="@container sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('admin.forwardRules.form.editRule')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <Accordion
            type="multiple"
            defaultValue={["editable"]}
            className="space-y-2"
          >
            {/* Basic Information (Read-only) */}
            <AccordionItem value="basic" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="text-sm font-medium">{t('admin.forwardRules.form.basicInfoReadonly')}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 pb-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rule_id">{t('admin.forwardRules.form.ruleId')}</Label>
                    <Input id="rule_id" value={rule.id} disabled />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rule_type">{t('admin.forwardRules.form.ruleType')}</Label>
                    <Input
                      id="rule_type"
                      value={t(`admin.forwardRules.ruleTypeInfo.${RULE_TYPE_KEYS[rule.ruleType] || rule.ruleType}.label`)}
                      disabled
                    />
                  </div>

                  <div className="flex flex-col gap-2 @sm:col-span-2">
                    <Label htmlFor="created_at">{t('admin.forwardRules.form.createdTime')}</Label>
                    <Input
                      id="created_at"
                      value={formatDateTime(rule.createdAt)}
                      disabled
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Editable Fields */}
            <AccordionItem value="editable" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="text-sm font-medium">{t('common.sections.editableInfo')}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 pb-4">
                  {/* Rule Name */}
                  <div className="flex flex-col gap-2 @sm:col-span-2">
                    <Label htmlFor="name">{t('admin.forwardRules.form.ruleName')}</Label>
                    <Input
                      id="name"
                      value={form.formData.name || ""}
                      onChange={(e) => form.handleChange("name", e.target.value)}
                      error={!!form.errors.name}
                    />
                    {form.errors.name && (
                      <p className="text-xs text-destructive">{form.errors.name}</p>
                    )}
                  </div>

                  {/* External type: Server Address */}
                  {rule.ruleType === "external" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="serverAddress">{t('admin.forwardRules.form.serverAddress')}</Label>
                        <Input
                          id="serverAddress"
                          value={form.formData.serverAddress || ""}
                          onChange={(e) => form.handleChange("serverAddress" as keyof UpdateForwardRuleRequest, e.target.value)}
                          error={!!form.errors.serverAddress}
                          placeholder={t('admin.forwardRules.form.serverAddressPlaceholder')}
                        />
                        {form.errors.serverAddress && (
                          <p className="text-xs text-destructive">{form.errors.serverAddress}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="listenPort">{t('admin.forwardRules.form.listenPort')}</Label>
                        <Input
                          id="listenPort"
                          type="number"
                          min={1}
                          max={65535}
                          value={form.formData.listenPort || ""}
                          onChange={(e) =>
                            form.handleChange(
                              "listenPort",
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          error={!!form.errors.listenPort}
                          placeholder="1-65535"
                        />
                        {form.errors.listenPort && (
                          <p className="text-xs text-destructive">{form.errors.listenPort}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="editExternalTargetNodeId">{t('admin.forwardRules.form.targetNode')}</Label>
                        <Select
                          value={form.formData.targetNodeId || ""}
                          onValueChange={(value) =>
                            form.handleChange("targetNodeId", value)
                          }
                        >
                          <SelectTrigger id="editExternalTargetNodeId">
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
                        <p className="text-xs text-muted-foreground">
                          {t('admin.forwardRules.form.targetNodeHint')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="externalSource">{t('admin.forwardRules.form.externalSource')}</Label>
                        <Input
                          id="externalSource"
                          value={form.formData.externalSource || ""}
                          onChange={(e) => form.handleChange("externalSource" as keyof UpdateForwardRuleRequest, e.target.value)}
                          placeholder={t('admin.forwardRules.form.externalSourcePlaceholder')}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.forwardRules.form.externalSourceHint')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="externalRuleId">{t('admin.forwardRules.form.externalRuleId')}</Label>
                        <Input
                          id="externalRuleId"
                          value={form.formData.externalRuleId || ""}
                          onChange={(e) => form.handleChange("externalRuleId" as keyof UpdateForwardRuleRequest, e.target.value)}
                          placeholder={t('admin.forwardRules.form.externalRuleIdPlaceholder')}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.forwardRules.form.externalRuleIdHint')}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Entry Agent - hidden for external type */}
                  {rule.ruleType !== "external" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="agentId">{t('admin.forwardRules.form.entryAgent')}</Label>
                    <Select
                      value={form.formData.agentId || ""}
                      onValueChange={(value) => form.handleChange("agentId", value)}
                    >
                      <SelectTrigger id="agentId">
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
                                  className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                                >
                                  {agent.allowedPortRange}
                                </Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formData.agentId &&
                      (() => {
                        const selectedAgent = agents.find(
                          (a) => a.id === form.formData.agentId,
                        );
                        return selectedAgent?.allowedPortRange ? (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5">
                            <Info className="size-3.5 shrink-0" />
                            <span>
                              {t('admin.forwardRules.form.portRestriction', { range: selectedAgent.allowedPortRange })}
                            </span>
                          </div>
                        ) : null;
                      })()}
                  </div>
                  )}

                  {/* entry type: Exit Agent Mode Selection */}
                  {rule.ruleType === "entry" && (
                    <div className="flex flex-col gap-2 @sm:col-span-2">
                      <Label>{t('admin.forwardRules.form.exitAgent')}</Label>
                      <RadioGroup
                        value={form.exitMode}
                        onValueChange={(value) => form.handleExitModeChange(value as "single" | "multi")}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="edit-exit-single" />
                          <Label htmlFor="edit-exit-single" className="font-normal cursor-pointer">
                            {t('admin.forwardRules.exitAgents.singleMode')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="multi" id="edit-exit-multi" />
                          <Label htmlFor="edit-exit-multi" className="font-normal cursor-pointer">
                            {t('admin.forwardRules.exitAgents.multiMode')}
                          </Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.exitAgents.modeHint')}
                      </p>
                    </div>
                  )}

                  {/* entry type: Single Exit Agent */}
                  {rule.ruleType === "entry" && form.exitMode === "single" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="exitAgentId">{t('admin.forwardRules.form.exitAgent')}</Label>
                      <Select
                        value={form.formData.exitAgentId || ""}
                        onValueChange={(value) =>
                          form.handleChange("exitAgentId", value)
                        }
                      >
                        <SelectTrigger id="exitAgentId">
                          <SelectValue placeholder={t('admin.forwardRules.form.selectExitAgent')} />
                        </SelectTrigger>
                        <SelectContent>
                          {form.availableExitAgents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              <span className="flex items-center gap-2">
                                {agent.name}
                                {agent.allowedPortRange && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                                  >
                                    {agent.allowedPortRange}
                                  </Badge>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formData.exitAgentId &&
                        (() => {
                          const selectedAgent = agents.find(
                            (a) => a.id === form.formData.exitAgentId,
                          );
                          return selectedAgent?.allowedPortRange ? (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5">
                              <Info className="size-3.5 shrink-0" />
                              <span>
                                {t('admin.forwardRules.form.portRestriction', { range: selectedAgent.allowedPortRange })}
                              </span>
                            </div>
                          ) : null;
                        })()}
                    </div>
                  )}

                  {/* entry type: Multi Exit Agents (Load Balancing) */}
                  {rule.ruleType === "entry" && form.exitMode === "multi" && (
                    <>
                      <div className="flex flex-col gap-2 @sm:col-span-2">
                        <Label>{t('admin.forwardRules.exitAgents.loadBalancing')}</Label>
                        <ExitAgentList
                          agents={form.availableExitAgents}
                          exitAgents={form.formData.exitAgents || []}
                          onChange={form.handleExitAgentsChange}
                          idPrefix="edit-exit-agent"
                          loadBalanceStrategy={form.formData.loadBalanceStrategy}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="loadBalanceStrategy">{t('admin.forwardRules.exitAgents.strategy')}</Label>
                        <Select
                          value={form.formData.loadBalanceStrategy || "failover"}
                          onValueChange={(value) => form.handleLoadBalanceStrategyChange(value as "failover" | "weighted")}
                        >
                          <SelectTrigger id="loadBalanceStrategy">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="failover">
                              {t('admin.forwardRules.exitAgents.strategyFailover')}
                            </SelectItem>
                            <SelectItem value="weighted">
                              {t('admin.forwardRules.exitAgents.strategyWeighted')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {form.formData.loadBalanceStrategy === "failover"
                            ? t('admin.forwardRules.exitAgents.strategyFailoverHint')
                            : t('admin.forwardRules.exitAgents.strategyWeightedHint')}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Tunnel Type - entry and chain types */}
                  {(rule.ruleType === "entry" || rule.ruleType === "chain") && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tunnelType">{t('admin.forwardRules.form.tunnelType')}</Label>
                      <Select
                        value={form.formData.tunnelType || "ws"}
                        onValueChange={(value) =>
                          form.handleChange("tunnelType", value as TunnelType)
                        }
                      >
                        <SelectTrigger id="tunnelType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ws">WebSocket</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ws_smux">WebSocket + SMUX</SelectItem>
                          <SelectItem value="tls_smux">TLS + SMUX</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {(form.formData.tunnelType === "tls" || form.formData.tunnelType === "tls_smux")
                          ? t('admin.forwardRules.form.tunnelTypeTlsHint')
                          : t('admin.forwardRules.form.tunnelTypeWsHint')}
                      </p>
                    </div>
                  )}

                  {/* Tunnel Hops - chain type only */}
                  {rule.ruleType === "chain" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tunnelHops">{t('admin.forwardRules.form.tunnelHops')}</Label>
                      <Input
                        id="tunnelHops"
                        type="number"
                        min={0}
                        value={form.formData.tunnelHops ?? ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value, 10);
                          form.handleChange("tunnelHops", value);
                        }}
                        placeholder={t('admin.forwardRules.form.tunnelHopsPlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.tunnelHopsHint')}
                      </p>
                    </div>
                  )}

                  {/* chain type: Chain Agents */}
                  {rule.ruleType === "chain" && (
                    <div className="flex flex-col gap-2 @sm:col-span-2">
                      <Label>
                        {form.formData.tunnelHops !== undefined &&
                          form.formData.tunnelHops >= 0 &&
                          form.formData.tunnelHops <
                            (form.formData.chainAgentIds?.length || 0)
                          ? t('admin.forwardRules.form.chainNodesWithPort')
                          : t('admin.forwardRules.form.chainNodes')}
                      </Label>
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
                      {form.formData.tunnelHops !== undefined &&
                        form.formData.tunnelHops >= 0 &&
                        form.formData.tunnelHops <
                          (form.formData.chainAgentIds?.length || 0) && (
                          <p className="text-xs text-muted-foreground">
                            {t('admin.forwardRules.form.hybridChainHint', { count: form.formData.tunnelHops })}
                          </p>
                        )}
                      {form.errors.chainPortConfig && (
                        <p className="text-xs text-destructive">
                          {form.errors.chainPortConfig}
                        </p>
                      )}
                    </div>
                  )}

                  {/* direct_chain type: Chain Agents (with port configuration) */}
                  {rule.ruleType === "direct_chain" && (
                    <div className="flex flex-col gap-2 @sm:col-span-2">
                      <Label>{t('admin.forwardRules.form.chainNodesWithPort')}</Label>
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
                      {form.errors.chainPortConfig && (
                        <p className="text-xs text-destructive">
                          {form.errors.chainPortConfig}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Protocol Type - hidden for external type */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="protocol">{t('common.protocol')}</Label>
                      <Select
                        value={form.formData.protocol || "tcp"}
                        onValueChange={(value) =>
                          form.handleChange("protocol", value as ForwardProtocol)
                        }
                      >
                        <SelectTrigger id="protocol">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tcp">TCP</SelectItem>
                          <SelectItem value="udp">UDP</SelectItem>
                          <SelectItem value="both">TCP/UDP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* IP Version - hidden for external type */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ipVersion">{t('admin.forwardRules.form.ipVersion')}</Label>
                      <Select
                        value={form.formData.ipVersion || "auto"}
                        onValueChange={(value) =>
                          form.handleChange("ipVersion", value as IPVersion)
                        }
                      >
                        <SelectTrigger id="ipVersion">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">{t('common.auto')}</SelectItem>
                          <SelectItem value="ipv4">IPv4</SelectItem>
                          <SelectItem value="ipv6">IPv6</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.ipVersionHint')}
                      </p>
                    </div>
                  )}

                  {/* Listen Port - hidden for external type (already shown above) */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="listenPort">{t('admin.forwardRules.form.listenPort')}</Label>
                      <Input
                        id="listenPort"
                        type="number"
                        min={0}
                        max={65535}
                        value={form.formData.listenPort || ""}
                        onChange={(e) =>
                          form.handleChange(
                            "listenPort",
                            parseInt(e.target.value, 10) || 0,
                          )
                        }
                        error={!!form.errors.listenPort}
                        placeholder={t('admin.forwardRules.form.listenPortAutoHint')}
                      />
                      {form.errors.listenPort && (
                        <p className="text-xs text-destructive">
                          {form.errors.listenPort}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Target Configuration - Display for direct, entry, chain and direct_chain types */}
                  {rule &&
                    (rule.ruleType === "direct" ||
                      rule.ruleType === "entry" ||
                      rule.ruleType === "chain" ||
                      rule.ruleType === "direct_chain") && (
                      <>
                        {/* Target Type Selection */}
                        <div className="flex flex-col gap-2 @sm:col-span-2">
                          <Label>{t('admin.forwardRules.form.targetType')}</Label>
                          <RadioGroup
                            value={form.targetType}
                            onValueChange={(value) => form.handleTargetTypeChange(value as "manual" | "node")}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="manual"
                                id="edit-target-manual"
                              />
                              <Label
                                htmlFor="edit-target-manual"
                                className="font-normal cursor-pointer"
                              >
                                {t('admin.forwardRules.form.targetTypeManual')}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="node"
                                id="edit-target-node"
                              />
                              <Label
                                htmlFor="edit-target-node"
                                className="font-normal cursor-pointer"
                              >
                                {t('admin.forwardRules.form.targetTypeNode')}
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Manual Target Address Input */}
                        {form.targetType === "manual" && (
                          <>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="targetAddress">{t('admin.forwardRules.form.targetAddress')}</Label>
                              <Input
                                id="targetAddress"
                                value={form.formData.targetAddress || ""}
                                onChange={(e) =>
                                  form.handleChange("targetAddress", e.target.value)
                                }
                                error={!!form.errors.targetAddress}
                              />
                              {form.errors.targetAddress && (
                                <p className="text-xs text-destructive">
                                  {form.errors.targetAddress}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label htmlFor="targetPort">{t('admin.forwardRules.form.targetPort')}</Label>
                              <Input
                                id="targetPort"
                                type="number"
                                min={1}
                                max={65535}
                                value={form.formData.targetPort || ""}
                                onChange={(e) =>
                                  form.handleChange(
                                    "targetPort",
                                    parseInt(e.target.value, 10),
                                  )
                                }
                                error={!!form.errors.targetPort}
                              />
                              {form.errors.targetPort && (
                                <p className="text-xs text-destructive">
                                  {form.errors.targetPort}
                                </p>
                              )}
                            </div>
                          </>
                        )}

                        {/* Select Target Node */}
                        {form.targetType === "node" && (
                          <div className="flex flex-col gap-2 @sm:col-span-2">
                            <Label htmlFor="targetNodeId">{t('admin.forwardRules.form.targetNode')}</Label>
                            <Select
                              value={form.formData.targetNodeId || ""}
                              onValueChange={(value) =>
                                form.handleChange("targetNodeId", value)
                              }
                            >
                              <SelectTrigger
                                id="targetNodeId"
                                className={
                                  form.errors.targetNodeId
                                    ? "border-destructive"
                                    : ""
                                }
                              >
                                <SelectValue placeholder={t('admin.forwardRules.form.selectTargetNode')} />
                              </SelectTrigger>
                              <SelectContent>
                                {form.availableNodes.map((node) => (
                                  <SelectItem key={node.id} value={node.id}>
                                    {node.name} ({node.serverAddress})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {t('admin.forwardRules.form.targetNodeDynamicHint')}
                            </p>
                            {form.errors.targetNodeId && (
                              <p className="text-xs text-destructive">
                                {form.errors.targetNodeId}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                  {/* Bind IP - hidden for external type */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="bindIp">{t('admin.forwardRules.form.bindIp')}</Label>
                      <Input
                        id="bindIp"
                        value={form.formData.bindIp || ""}
                        onChange={(e) => form.handleChange("bindIp", e.target.value)}
                        placeholder={t('admin.forwardRules.form.bindIpPlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.bindIpHint')}
                      </p>
                    </div>
                  )}

                  {/* Traffic Multiplier - hidden for external type */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="trafficMultiplier">{t('admin.forwardRules.form.trafficMultiplier')}</Label>
                      <Input
                        id="trafficMultiplier"
                        type="number"
                        min={0}
                        max={1000000}
                        step={0.01}
                        value={form.formData.trafficMultiplier ?? ""}
                        onChange={(e) =>
                          form.handleChange(
                            "trafficMultiplier",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                        placeholder={t('admin.forwardRules.form.trafficMultiplierNotModify')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.trafficMultiplierCurrent', { value: rule.effectiveTrafficMultiplier, type: rule.isAutoMultiplier ? t('admin.forwardRules.form.multiplierAuto') : t('admin.forwardRules.form.multiplierCustom') })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.trafficMultiplierUpdateHint')}
                      </p>
                    </div>
                  )}

                  {/* Sort Order */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sortOrder">{t('common.fields.sortOrder')}</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={form.formData.sortOrder ?? 0}
                      onChange={(e) =>
                        form.handleChange(
                          "sortOrder",
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.forwardRules.form.sortSmallFirst')}
                    </p>
                  </div>

                  {/* Remark */}
                  <div className="flex flex-col gap-1.5 @sm:col-span-2">
                    <Label htmlFor="remark">{t('common.fields.remark')}</Label>
                    <Textarea
                      id="remark"
                      rows={3}
                      value={form.formData.remark || ""}
                      onChange={(e) => form.handleChange("remark", e.target.value)}
                      className="resize-none"
                    />
                  </div>

                  {/* Resource Groups Selection */}
                  {form.availableResourceGroups.length > 0 && (
                    <div className="flex flex-col gap-2 @sm:col-span-2">
                      <Label className="flex items-center gap-1.5">
                        <FolderTree className="size-4" />
                        {t('admin.forwardRules.form.bindResourceGroupsEdit')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.bindResourceGroupsHint')}
                      </p>
                      <div className="border rounded-lg overflow-hidden">
                        <ScrollArea className="h-[120px]">
                          <div className="divide-y">
                            {form.availableResourceGroups.map((group) => {
                              const plan = plansMap[group.planId];
                              const isSelected = form.formData.groupSids?.includes(group.sid) ?? false;
                              return (
                                <label
                                  key={group.sid}
                                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-primary/10"
                                      : "hover:bg-muted/50"
                                  }`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => form.handleGroupToggle(group.sid)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{group.name}</p>
                                    {plan && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {plan.name}
                                      </p>
                                    )}
                                  </div>
                                  {plan && (
                                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                                      {plan.planType === "node" ? t('admin.forwardRules.form.planTypeNode') : t('common.planType.hybrid')}
                                    </Badge>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                      {form.formData.groupSids && form.formData.groupSids.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t('admin.forwardRules.form.selectedGroupsCount', { count: form.formData.groupSids.length })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-shrink-0 mt-6 gap-3">
          <Button onClick={handleSubmit} disabled={!form.hasChanges}>
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
