/**
 * Create Forward Rule Dialog Component
 * Supports four rule types: direct, entry, chain (WS chain forwarding), direct_chain (direct chain forwarding)
 * Supports target types: manual address input or node selection (dynamic resolution)
 *
 * Redesigned with Tailwind Application UI stacked form layout
 * - Compact sections with subtle dividers
 * - Collapsible advanced options
 * - Responsive grid layout (6-column base)
 */

import { useState } from 'react';
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/common/Dialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";
import { Badge } from "@/components/common/Badge";
import { Info } from "lucide-react";
import { SortableChainAgentList } from "./SortableChainAgentList";
import { FormSection, FormField } from './form-primitives';
import { ExitAgentConfigFields } from './ExitAgentConfigFields';
import { TargetConfigFields } from './TargetConfigFields';
import { AdvancedOptionsFields } from './AdvancedOptionsFields';
import { useCreateForwardRuleForm } from '../hooks/useCreateForwardRuleForm';
import type {
  CreateForwardRuleRequest,
  ForwardAgent,
  ForwardRuleType,
  ForwardProtocol,
  TunnelType,
} from "@/api/forward";
import type { Node } from "@/api/node";
import type { ResourceGroup } from "@/api/resource/types";
import type { SubscriptionPlan } from "@/api/subscription/types";

interface CreateForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRuleRequest) => void;
  agents: ForwardAgent[];
  nodes?: Node[];
  /** Initial data for pre-populating the form when copying a rule */
  initialData?: Partial<CreateForwardRuleRequest> & {
    targetType?: "manual" | "node";
  };
  /** Resource groups for binding (only node/hybrid plan groups can bind rules) */
  resourceGroups?: ResourceGroup[];
  /** Subscription plans map for filtering resource groups by plan type */
  plansMap?: Record<string, SubscriptionPlan>;
}

// Rule type keys for translation lookup
const RULE_TYPE_KEYS: Record<ForwardRuleType, string> = {
  direct: "direct",
  entry: "entry",
  chain: "chain",
  direct_chain: "directChain",
  external: "external",
};

export const CreateForwardRuleDialog: React.FC<CreateForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  agents,
  nodes = [],
  initialData,
  resourceGroups = [],
  plansMap = {},
}) => {
  const { t } = useTranslation();
  const form = useCreateForwardRuleForm({
    open,
    agents,
    nodes,
    initialData,
    resourceGroups,
    plansMap,
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleSubmit = () => {
    if (form.validate()) {
      const submitData = form.buildSubmitData();
      onSubmit(submitData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="@container sm:max-w-2xl flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border sm:px-6">
          <DialogTitle className="text-lg font-semibold">
            {initialData
              ? t("admin.forwardRules.form.copyRule")
              : t("admin.forwardRules.form.createRule")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-6">
            {/* Section 1: Basic Information */}
            <FormSection title={t("common.sections.basicInfo")}>
              <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                {/* Rule Name - 4 cols on desktop */}
                <FormField
                  label={t("admin.forwardRules.form.ruleName")}
                  required
                  error={form.errors.name}
                  className="col-span-6 sm:col-span-4"
                >
                  <Input
                    value={form.formData.name}
                    onChange={(e) => form.handleChange("name", e.target.value)}
                    error={!!form.errors.name}
                    placeholder={t(
                      "admin.forwardRules.form.ruleNamePlaceholder",
                    )}
                  />
                </FormField>

                {/* Rule Type - 2 cols on desktop */}
                <FormField
                  label={t("admin.forwardRules.form.ruleType")}
                  required
                  className="col-span-6 sm:col-span-2"
                >
                  <Select
                    value={form.formData.ruleType}
                    onValueChange={(value) =>
                      form.handleChange("ruleType", value as ForwardRuleType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RULE_TYPE_KEYS) as ForwardRuleType[]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {t(
                              `admin.forwardRules.ruleTypeInfo.${RULE_TYPE_KEYS[type]}.label`,
                            )}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Rule Type Description - full width */}
                <p className="col-span-6 text-xs text-muted-foreground -mt-2">
                  {t(
                    `admin.forwardRules.ruleTypeInfo.${RULE_TYPE_KEYS[form.formData.ruleType]}.description`,
                  )}
                </p>
              </div>
            </FormSection>

            {/* Section 2: Forward Agent & Protocol (hidden for external) */}
            {form.formData.ruleType !== "external" && (
              <FormSection title={t("admin.forwardRules.form.forwardAgent")}>
                <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                  {/* Forward Agent - 3 cols */}
                  <FormField
                    label={t("admin.forwardRules.form.forwardAgent")}
                    required
                    error={form.errors.agentId}
                    className="col-span-6 sm:col-span-3"
                  >
                    <Select
                      value={form.formData.agentId}
                      onValueChange={(value) => form.handleChange("agentId", value)}
                    >
                      <SelectTrigger
                        className={form.errors.agentId ? "border-destructive" : ""}
                      >
                        <SelectValue
                          placeholder={t(
                            "admin.forwardRules.form.selectForwardAgent",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {form.availableAgentsForSelect.map((agent) => (
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

                  {/* Listen Port - 1.5 cols */}
                  <FormField
                    label={t("admin.forwardRules.form.listenPort")}
                    error={form.errors.listenPort}
                    className="col-span-3 sm:col-span-2"
                  >
                    <Input
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
                      placeholder={t(
                        "common.auto",
                      )}
                    />
                  </FormField>

                  {/* Protocol - 1.5 cols */}
                  <FormField
                    label={t("common.protocol")}
                    required
                    className="col-span-3 sm:col-span-1"
                  >
                    <Select
                      value={form.formData.protocol}
                      onValueChange={(value) =>
                        form.handleChange("protocol", value as ForwardProtocol)
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
                        {t("admin.forwardRules.form.portRestriction", {
                          range: form.selectedAgent!.allowedPortRange,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </FormSection>
            )}

            {/* Section 3: Forwarding Configuration (type-specific) */}
            <FormSection title={t("admin.forwardRules.form.forwardConfig")}>
              <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                {/* External type fields */}
                {form.formData.ruleType === "external" && (
                  <>
                    <FormField
                      label={t("admin.forwardRules.form.serverAddress")}
                      required
                      error={form.errors.serverAddress}
                      className="col-span-6 sm:col-span-4"
                    >
                      <Input
                        value={form.formData.serverAddress}
                        onChange={(e) =>
                          form.handleChange("serverAddress", e.target.value)
                        }
                        error={!!form.errors.serverAddress}
                        placeholder={t(
                          "admin.forwardRules.form.serverAddressPlaceholder",
                        )}
                      />
                    </FormField>

                    <FormField
                      label={t("admin.forwardRules.form.listenPort")}
                      required
                      error={form.errors.listenPort}
                      className="col-span-6 sm:col-span-2"
                    >
                      <Input
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
                    </FormField>

                    <FormField
                      label={t("admin.forwardRules.form.targetNode")}
                      required
                      error={form.errors.targetNodeId}
                      hint={t("admin.forwardRules.form.externalTargetNodeHint")}
                      className="col-span-6 sm:col-span-3"
                    >
                      <Select
                        value={form.formData.targetNodeId}
                        onValueChange={(value) =>
                          form.handleChange("targetNodeId", value)
                        }
                      >
                        <SelectTrigger
                          className={
                            form.errors.targetNodeId ? "border-destructive" : ""
                          }
                        >
                          <SelectValue
                            placeholder={t(
                              "admin.forwardRules.form.selectTargetNode",
                            )}
                          />
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
                      label={t("admin.forwardRules.form.externalSource")}
                      hint={t("admin.forwardRules.form.externalSourceHint")}
                      className="col-span-6 sm:col-span-3"
                    >
                      <Input
                        value={form.formData.externalSource}
                        onChange={(e) =>
                          form.handleChange("externalSource", e.target.value)
                        }
                        placeholder={t(
                          "admin.forwardRules.form.externalSourcePlaceholder",
                        )}
                      />
                    </FormField>
                  </>
                )}

                {/* Entry type: Exit Agent Mode + Exit Agent(s) + Tunnel Type */}
                {form.formData.ruleType === "entry" && (
                  <ExitAgentConfigFields
                    exitMode={form.exitMode}
                    onExitModeChange={(value) => form.handleExitModeChange(value as "single" | "multi")}
                    exitAgentId={form.formData.exitAgentId}
                    onExitAgentIdChange={(value) => form.handleChange("exitAgentId", value)}
                    selectedExitAgent={form.selectedExitAgent}
                    exitAgents={form.formData.exitAgents}
                    onExitAgentsChange={form.handleExitAgentsChange}
                    loadBalanceStrategy={form.formData.loadBalanceStrategy}
                    onLoadBalanceStrategyChange={(value) => form.handleLoadBalanceStrategyChange(value as "failover" | "weighted")}
                    availableExitAgents={form.availableExitAgents}
                    tunnelType={form.formData.tunnelType}
                    onTunnelTypeChange={(value) => form.handleChange("tunnelType", value)}
                    errors={form.errors as Record<string, string | undefined>}
                    idPrefix="create-"
                  />
                )}

                {/* Chain type: Tunnel settings + Intermediate Nodes */}
                {form.formData.ruleType === "chain" && (
                  <>
                    <FormField
                      label={t("admin.forwardRules.form.tunnelType")}
                      className="col-span-3 sm:col-span-2"
                    >
                      <Select
                        value={form.formData.tunnelType}
                        onValueChange={(value) =>
                          form.handleChange("tunnelType", value as TunnelType)
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
                      label={t("admin.forwardRules.form.tunnelHops")}
                      hint={t("admin.forwardRules.form.tunnelHopsHint")}
                      className="col-span-3 sm:col-span-2"
                    >
                      <Input
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
                        placeholder={t(
                          "admin.forwardRules.form.tunnelHopsPlaceholder",
                        )}
                      />
                    </FormField>

                    <FormField
                      label={t("admin.forwardRules.form.chainNodes")}
                      required
                      error={form.errors.chainAgentIds || form.errors.chainPortConfig}
                      className="col-span-6"
                    >
                      <SortableChainAgentList
                        agents={form.availableChainAgents}
                        selectedIds={form.formData.chainAgentIds}
                        onSelectionChange={form.handleChainSelectionChange}
                        showPortConfig={
                          form.formData.tunnelHops !== undefined &&
                          form.formData.tunnelHops >= 0 &&
                          form.formData.tunnelHops < form.formData.chainAgentIds.length
                        }
                        portConfigStartIndex={form.formData.tunnelHops ?? 0}
                        portConfig={form.formData.chainPortConfig}
                        onPortConfigChange={form.handleChainPortChange}
                        hasError={
                          !!form.errors.chainAgentIds || !!form.errors.chainPortConfig
                        }
                        idPrefix="chain-agent"
                      />
                    </FormField>
                  </>
                )}

                {/* direct_chain type: Intermediate Nodes with port */}
                {form.formData.ruleType === "direct_chain" && (
                  <FormField
                    label={t("admin.forwardRules.form.chainNodesWithPort")}
                    required
                    error={form.errors.chainAgentIds || form.errors.chainPortConfig}
                    className="col-span-6"
                  >
                    <SortableChainAgentList
                      agents={form.availableChainAgents}
                      selectedIds={form.formData.chainAgentIds}
                      onSelectionChange={form.handleChainSelectionChange}
                      showPortConfig
                      portConfig={form.formData.chainPortConfig}
                      onPortConfigChange={form.handleChainPortChange}
                      hasError={
                        !!form.errors.chainAgentIds || !!form.errors.chainPortConfig
                      }
                      idPrefix="direct-chain-agent"
                    />
                  </FormField>
                )}

                {/* Target Configuration - for non-external types */}
                {(form.formData.ruleType === "direct" ||
                  form.formData.ruleType === "entry" ||
                  form.formData.ruleType === "chain" ||
                  form.formData.ruleType === "direct_chain") && (
                  <TargetConfigFields
                    targetType={form.targetType}
                    onTargetTypeChange={(value) => form.handleTargetTypeChange(value as "manual" | "node")}
                    targetAddress={form.formData.targetAddress}
                    onTargetAddressChange={(value) => form.handleChange("targetAddress", value)}
                    targetPort={form.formData.targetPort}
                    onTargetPortChange={(value) => form.handleChange("targetPort", value)}
                    targetNodeId={form.formData.targetNodeId}
                    onTargetNodeIdChange={(value) => form.handleChange("targetNodeId", value)}
                    availableNodes={form.availableNodes}
                    errors={form.errors as Record<string, string | undefined>}
                  />
                )}
              </div>
            </FormSection>

            {/* Section 4: Advanced Options (Collapsible) */}
            <AdvancedOptionsFields
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
              ruleType={form.formData.ruleType}
              formData={{
                ipVersion: form.formData.ipVersion,
                bindIp: form.formData.bindIp,
                trafficMultiplier: form.formData.trafficMultiplier,
                sortOrder: form.formData.sortOrder,
                externalRuleId: form.formData.externalRuleId,
                externalSource: form.formData.externalSource,
                remark: form.formData.remark,
                groupSids: form.formData.groupSids || [],
              }}
              onFieldChange={(field, value) => form.handleChange(field as any, value as any)}
              onGroupToggle={form.handleGroupToggle}
              availableResourceGroups={form.availableResourceGroups}
              plansMap={plansMap}
            />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 px-5 py-4 border-t border-border bg-muted/30 sm:px-6">
          <div className="flex gap-3 justify-end w-full">
            <Button onClick={handleSubmit} disabled={!form.isFormValid}>
              {t("common.actions.create")}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
