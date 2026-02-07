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
import { Badge } from "@/components/common/Badge";
import { Checkbox } from "@/components/common/Checkbox";
import { ScrollArea } from "@/components/common/ScrollArea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/common/Collapsible";
import { Info, FolderTree, ChevronDown } from "lucide-react";
import { SortableChainAgentList } from "./SortableChainAgentList";
import { ExitAgentList } from "./ExitAgentList";
import { useCreateForwardRuleForm } from '../hooks/useCreateForwardRuleForm';
import type {
  CreateForwardRuleRequest,
  ForwardAgent,
  ForwardRuleType,
  ForwardProtocol,
  IPVersion,
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

/**
 * Form Section Component - Tailwind Application UI style
 * Clean, minimal section with lightweight divider
 */
const FormSection = ({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <fieldset className={className}>
    <legend className="sr-only">{title}</legend>
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
        {title}
      </h3>
      <div className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
    {description && (
      <p className="text-xs text-muted-foreground -mt-2 mb-4">{description}</p>
    )}
    {children}
  </fieldset>
);

/**
 * Form Field Component with consistent styling
 * Uses grid span classes for responsive layout
 */
const FormField = ({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}: {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <Label className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
    {hint && !error && (
      <p className="text-xs text-muted-foreground">{hint}</p>
    )}
  </div>
);

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
                    <div className="col-span-6 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5 -mt-2">
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
                  <>
                    {/* Exit Mode Selection */}
                    <div className="col-span-6">
                      <Label className="text-sm font-medium text-foreground mb-3 block">
                        {t("admin.forwardRules.form.exitNode")}
                        <span className="text-destructive ml-0.5">*</span>
                      </Label>
                      <RadioGroup
                        value={form.exitMode}
                        onValueChange={(value) => form.handleExitModeChange(value as "single" | "multi")}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="exit-single" />
                          <Label
                            htmlFor="exit-single"
                            className="font-normal cursor-pointer"
                          >
                            {t("admin.forwardRules.exitAgents.singleMode")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="multi" id="exit-multi" />
                          <Label
                            htmlFor="exit-multi"
                            className="font-normal cursor-pointer"
                          >
                            {t("admin.forwardRules.exitAgents.multiMode")}
                          </Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("admin.forwardRules.exitAgents.modeHint")}
                      </p>
                    </div>

                    {/* Single Exit Agent Mode */}
                    {form.exitMode === "single" && (
                      <FormField
                        label={t("admin.forwardRules.form.exitNode")}
                        required
                        error={form.errors.exitAgentId}
                        className="col-span-6 sm:col-span-4"
                      >
                        <Select
                          value={form.formData.exitAgentId}
                          onValueChange={(value) =>
                            form.handleChange("exitAgentId", value)
                          }
                        >
                          <SelectTrigger
                            className={
                              form.errors.exitAgentId ? "border-destructive" : ""
                            }
                          >
                            <SelectValue
                              placeholder={t(
                                "admin.forwardRules.form.selectExitNode",
                              )}
                            />
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
                      </FormField>
                    )}

                    {/* Multi Exit Agent Mode (Load Balancing) */}
                    {form.exitMode === "multi" && (
                      <>
                        <FormField
                          label={t("admin.forwardRules.exitAgents.loadBalancing")}
                          required
                          error={form.errors.exitAgents}
                          className="col-span-6 sm:col-span-4"
                        >
                          <ExitAgentList
                            agents={form.availableExitAgents}
                            exitAgents={form.formData.exitAgents}
                            onChange={form.handleExitAgentsChange}
                            hasError={!!form.errors.exitAgents}
                            idPrefix="create-exit-agent"
                            loadBalanceStrategy={form.formData.loadBalanceStrategy}
                          />
                        </FormField>

                        <FormField
                          label={t("admin.forwardRules.exitAgents.strategy")}
                          hint={
                            form.formData.loadBalanceStrategy === "failover"
                              ? t("admin.forwardRules.exitAgents.strategyFailoverHint")
                              : t("admin.forwardRules.exitAgents.strategyWeightedHint")
                          }
                          className="col-span-6 sm:col-span-2"
                        >
                          <Select
                            value={form.formData.loadBalanceStrategy}
                            onValueChange={(value) => form.handleLoadBalanceStrategyChange(value as "failover" | "weighted")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="failover">
                                {t("admin.forwardRules.exitAgents.strategyFailover")}
                              </SelectItem>
                              <SelectItem value="weighted">
                                {t("admin.forwardRules.exitAgents.strategyWeighted")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                      </>
                    )}

                    <FormField
                      label={t("admin.forwardRules.form.tunnelType")}
                      className={form.exitMode === "single" ? "col-span-6 sm:col-span-2" : "col-span-6 sm:col-span-3"}
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

                    {form.exitMode === "single" && form.selectedExitAgent?.allowedPortRange && (
                      <div className="col-span-6 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5 -mt-2">
                        <Info className="size-3.5 shrink-0" />
                        <span>
                          {t("admin.forwardRules.form.portRestriction", {
                            range: form.selectedExitAgent!.allowedPortRange,
                          })}
                        </span>
                      </div>
                    )}
                  </>
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
                  <>
                    {/* Target Type Radio */}
                    <div className="col-span-6">
                      <Label className="text-sm font-medium text-foreground mb-3 block">
                        {t("admin.forwardRules.form.targetType")}
                        <span className="text-destructive ml-0.5">*</span>
                      </Label>
                      <RadioGroup
                        value={form.targetType}
                        onValueChange={(value) => form.handleTargetTypeChange(value as "manual" | "node")}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manual" id="target-manual" />
                          <Label
                            htmlFor="target-manual"
                            className="font-normal cursor-pointer"
                          >
                            {t("admin.forwardRules.form.targetTypeManual")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="node" id="target-node" />
                          <Label
                            htmlFor="target-node"
                            className="font-normal cursor-pointer"
                          >
                            {t("admin.forwardRules.form.targetTypeNode")}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Manual Target */}
                    {form.targetType === "manual" && (
                      <>
                        <FormField
                          label={t("admin.forwardRules.form.targetAddress")}
                          required
                          error={form.errors.targetAddress}
                          className="col-span-6 sm:col-span-4"
                        >
                          <Input
                            placeholder={t(
                              "admin.forwardRules.form.targetAddressPlaceholder",
                            )}
                            value={form.formData.targetAddress}
                            onChange={(e) =>
                              form.handleChange("targetAddress", e.target.value)
                            }
                            error={!!form.errors.targetAddress}
                          />
                        </FormField>

                        <FormField
                          label={t("admin.forwardRules.form.targetPort")}
                          required
                          error={form.errors.targetPort}
                          className="col-span-6 sm:col-span-2"
                        >
                          <Input
                            type="number"
                            min={1}
                            max={65535}
                            value={form.formData.targetPort || ""}
                            onChange={(e) =>
                              form.handleChange(
                                "targetPort",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            error={!!form.errors.targetPort}
                            placeholder="1-65535"
                          />
                        </FormField>
                      </>
                    )}

                    {/* Node Target */}
                    {form.targetType === "node" && (
                      <FormField
                        label={t("admin.forwardRules.form.targetNode")}
                        required
                        error={form.errors.targetNodeId}
                        hint={t(
                          "admin.forwardRules.form.targetNodeDynamicHint",
                        )}
                        className="col-span-6"
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
                    )}
                  </>
                )}
              </div>
            </FormSection>

            {/* Section 4: Advanced Options (Collapsible) */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 w-full text-left group"
                >
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {t("common.sections.advancedOptions")}
                  </span>
                  <div className="h-px flex-1 bg-border" aria-hidden="true" />
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 ${
                      advancedOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                  {/* IP Version */}
                  {form.formData.ruleType !== "external" && (
                    <FormField
                      label={t("admin.forwardRules.form.ipVersion")}
                      hint={t("admin.forwardRules.form.ipVersionHint")}
                      className="col-span-6 sm:col-span-2"
                    >
                      <Select
                        value={form.formData.ipVersion}
                        onValueChange={(value) =>
                          form.handleChange("ipVersion", value as IPVersion)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">
                            {t("common.auto")}
                          </SelectItem>
                          <SelectItem value="ipv4">IPv4</SelectItem>
                          <SelectItem value="ipv6">IPv6</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}

                  {/* Bind IP */}
                  {form.formData.ruleType !== "external" && (
                    <FormField
                      label={t("admin.forwardRules.form.bindIp")}
                      hint={t("admin.forwardRules.form.bindIpHint")}
                      className="col-span-6 sm:col-span-2"
                    >
                      <Input
                        value={form.formData.bindIp}
                        onChange={(e) =>
                          form.handleChange("bindIp", e.target.value)
                        }
                        placeholder={t(
                          "admin.forwardRules.form.bindIpPlaceholder",
                        )}
                      />
                    </FormField>
                  )}

                  {/* Traffic Multiplier */}
                  {form.formData.ruleType !== "external" && (
                    <FormField
                      label={t("admin.forwardRules.form.trafficMultiplier")}
                      hint={t("admin.forwardRules.form.trafficMultiplierHint")}
                      className="col-span-3 sm:col-span-1"
                    >
                      <Input
                        type="number"
                        min={0}
                        max={1000000}
                        step={0.01}
                        value={form.formData.trafficMultiplier ?? ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value);
                          form.handleChange("trafficMultiplier", value);
                        }}
                        placeholder="1.0"
                      />
                    </FormField>
                  )}

                  {/* Sort Order */}
                  <FormField
                    label={t("common.fields.sortOrder")}
                    hint={t("admin.forwardRules.form.sortOrderHint")}
                    className="col-span-3 sm:col-span-1"
                  >
                    <Input
                      type="number"
                      min={0}
                      value={form.formData.sortOrder ?? ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value, 10);
                        form.handleChange("sortOrder", value);
                      }}
                      placeholder="0"
                    />
                  </FormField>

                  {/* External Rule ID (for external type) */}
                  {form.formData.ruleType === "external" && (
                    <FormField
                      label={t("admin.forwardRules.form.externalRuleId")}
                      hint={t("admin.forwardRules.form.externalRuleIdHint")}
                      className="col-span-6 sm:col-span-3"
                    >
                      <Input
                        value={form.formData.externalRuleId}
                        onChange={(e) =>
                          form.handleChange("externalRuleId", e.target.value)
                        }
                        placeholder={t(
                          "admin.forwardRules.form.externalRuleIdPlaceholder",
                        )}
                      />
                    </FormField>
                  )}

                  {/* Remark */}
                  <FormField
                    label={t("common.fields.remark")}
                    className="col-span-6"
                  >
                    <Textarea
                      rows={2}
                      value={form.formData.remark}
                      onChange={(e) => form.handleChange("remark", e.target.value)}
                      placeholder={t(
                        "admin.forwardRules.form.remarkPlaceholder",
                      )}
                      className="resize-none"
                    />
                  </FormField>

                  {/* Resource Groups Selection */}
                  {form.availableResourceGroups.length > 0 && (
                    <FormField
                      label={
                        <span className="flex items-center gap-1.5">
                          <FolderTree className="size-4" />
                          {t("admin.forwardRules.form.bindResourceGroups")}
                        </span>
                      }
                      hint={
                        form.formData.groupSids && form.formData.groupSids.length > 0
                          ? t("admin.forwardRules.form.selectedGroupsCount", {
                              count: form.formData.groupSids.length,
                            })
                          : t("admin.forwardRules.form.bindResourceGroupsHint")
                      }
                      className="col-span-6"
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <ScrollArea className="h-[100px]">
                          <div className="divide-y divide-border">
                            {form.availableResourceGroups.map((group) => {
                              const plan = plansMap[group.planId];
                              const isSelected =
                                form.formData.groupSids?.includes(group.sid) ??
                                false;
                              return (
                                <label
                                  key={group.sid}
                                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-primary/5"
                                      : "hover:bg-muted/50"
                                  }`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      form.handleGroupToggle(group.sid)
                                    }
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {group.name}
                                    </p>
                                    {plan && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {plan.name}
                                      </p>
                                    )}
                                  </div>
                                  {plan && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] flex-shrink-0"
                                    >
                                      {plan.planType === "node"
                                        ? t(
                                            "admin.forwardRules.form.planTypeNode",
                                          )
                                        : t(
                                            "common.planType.hybrid",
                                          )}
                                    </Badge>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    </FormField>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
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
