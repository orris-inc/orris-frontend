/**
 * Edit Forward Agent Dialog Component
 */

import { useState } from "react";
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
import { Separator } from "@/components/common/Separator";
import { Checkbox } from "@/components/common/Checkbox";
import { ScrollArea } from "@/components/common/ScrollArea";
import { Switch, SwitchThumb } from "@/components/common/Switch";
import { ExpirationDatePicker } from "@/components/common/ExpirationDatePicker";
import { cn } from "@/lib/utils";
import type {
  ForwardAgent,
  UpdateForwardAgentRequest,
  BlockedProtocol,
} from "@/api/forward";
import { useResourceGroups } from "@/features/resource-groups/hooks/useResourceGroups";

// Protocol groups for better organization
const PROTOCOL_GROUPS: {
  labelKey: string;
  protocols: { value: BlockedProtocol; label: string }[];
}[] = [
  {
    labelKey: "admin.forwardAgents.form.protocolGroupProxy",
    protocols: [
      { value: "http_connect", label: "HTTP CONNECT" },
      { value: "socks4", label: "SOCKS4" },
      { value: "socks5", label: "SOCKS5" },
    ],
  },
  {
    labelKey: "admin.forwardAgents.form.protocolGroupApp",
    protocols: [
      { value: "http", label: "HTTP" },
      { value: "tls", label: "TLS" },
      { value: "ssh", label: "SSH" },
      { value: "ftp", label: "FTP" },
    ],
  },
];

interface EditForwardAgentDialogProps {
  open: boolean;
  agent: ForwardAgent | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateForwardAgentRequest) => void;
}

export const EditForwardAgentDialog: React.FC<EditForwardAgentDialogProps> = ({
  open,
  agent,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<UpdateForwardAgentRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prevAgentId, setPrevAgentId] = useState<string | undefined>(undefined);

  // Get resource group list
  const { resourceGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: "active" },
    enabled: open,
  });

  // Sync form data when agent changes - React recommended pattern for derived state
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (agent?.id !== prevAgentId) {
    setPrevAgentId(agent?.id);
    if (agent) {
      setFormData({
        name: agent.name,
        publicAddress: agent.publicAddress,
        tunnelAddress: agent.tunnelAddress,
        remark: agent.remark,
        allowedPortRange: agent.allowedPortRange,
        sortOrder: agent.sortOrder,
        blockedProtocols: agent.blockedProtocols || [],
        groupSids: agent.groupSids || [],
        muteNotification: agent.muteNotification,
        expiresAt: agent.expiresAt,
        costLabel: agent.costLabel,
      });
      setErrors({});
    }
  }

  const handleChange = (
    field: keyof UpdateForwardAgentRequest,
    value: string | number | boolean | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSortOrderChange = (value: string) => {
    if (value === "") {
      handleChange("sortOrder", undefined);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        handleChange("sortOrder", num);
      }
    }
  };

  const handleCostLabelChange = (value: string) => {
    handleChange("costLabel", value || undefined);
  };

  const handleProtocolToggle = (protocol: BlockedProtocol, checked: boolean) => {
    const current = formData.blockedProtocols || [];
    const updated = checked
      ? [...current, protocol]
      : current.filter((p) => p !== protocol);
    setFormData((prev) => ({ ...prev, blockedProtocols: updated }));
  };

  const handleGroupToggle = (groupSid: string) => {
    setFormData((prev) => {
      const currentGroups = prev.groupSids || [];
      const isSelected = currentGroups.includes(groupSid);
      return {
        ...prev,
        groupSids: isSelected
          ? currentGroups.filter((sid) => sid !== groupSid)
          : [...currentGroups, groupSid],
      };
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = t("admin.forwardAgents.edit.validation.nameRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (agent && validate()) {
      // Only submit changed fields
      const updates: UpdateForwardAgentRequest = {};

      if (formData.name !== agent.name) updates.name = formData.name;
      if (formData.publicAddress !== agent.publicAddress)
        updates.publicAddress = formData.publicAddress;
      if (formData.tunnelAddress !== agent.tunnelAddress)
        updates.tunnelAddress = formData.tunnelAddress;
      if (formData.remark !== agent.remark) updates.remark = formData.remark;
      if (formData.allowedPortRange !== agent.allowedPortRange)
        updates.allowedPortRange = formData.allowedPortRange;
      if (formData.sortOrder !== agent.sortOrder)
        updates.sortOrder = formData.sortOrder;

      // Compare blocked protocols arrays
      const currentProtocols = agent.blockedProtocols || [];
      const newProtocols = formData.blockedProtocols || [];
      const protocolsChanged =
        currentProtocols.length !== newProtocols.length ||
        currentProtocols.some((p) => !newProtocols.includes(p)) ||
        newProtocols.some((p) => !currentProtocols.includes(p));
      if (protocolsChanged) {
        updates.blockedProtocols = newProtocols;
      }

      // Compare resource groups arrays
      const currentGroups = agent.groupSids || [];
      const newGroups = formData.groupSids || [];
      const groupsChanged =
        currentGroups.length !== newGroups.length ||
        currentGroups.some((g) => !newGroups.includes(g)) ||
        newGroups.some((g) => !currentGroups.includes(g));
      if (groupsChanged) {
        updates.groupSids = newGroups;
      }

      // Mute notification setting
      if (formData.muteNotification !== agent.muteNotification) {
        updates.muteNotification = formData.muteNotification;
      }

      // Expiration time - empty string to clear, undefined to keep unchanged
      if (formData.expiresAt !== agent.expiresAt) {
        updates.expiresAt = formData.expiresAt || ""; // Empty string to clear
      }

      // Cost label - empty string to clear, undefined to keep unchanged
      if (formData.costLabel !== agent.costLabel) {
        updates.costLabel = formData.costLabel || ""; // Empty string to clear
      }

      // If any changes, submit update
      if (Object.keys(updates).length > 0) {
        onSubmit(agent.id, updates);
      }
    }
  };

  // Check for changes
  const hasChanges =
    agent &&
    Object.keys(formData).some(
      (key) =>
        formData[key as keyof UpdateForwardAgentRequest] !==
        agent[key as keyof ForwardAgent],
    );

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="@container sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("admin.forwardAgents.edit.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6">
            {/* Basic info (read-only) */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t("common.sections.basicInfo")}
              </h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="agent_id">{t("admin.forwardAgents.edit.labels.agentId")}</Label>
                  <Input id="agent_id" value={agent.id} disabled />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="createdAt">{t("common.fields.createdAt")}</Label>
                  <Input
                    id="createdAt"
                    value={formatDateTime(agent.createdAt)}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t("common.sections.editableInfo")}
              </h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 gap-4">
                {/* Node name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">{t("admin.forwardAgents.edit.labels.nodeName")}</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                {/* Public address */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="publicAddress">{t("admin.forwardAgents.edit.labels.publicAddress")}</Label>
                  <Input
                    id="publicAddress"
                    value={formData.publicAddress || ""}
                    onChange={(e) =>
                      handleChange("publicAddress", e.target.value)
                    }
                    placeholder={t("admin.forwardAgents.edit.placeholders.publicAddress")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.forwardAgents.edit.hints.publicAddress")}
                  </p>
                </div>

                {/* Tunnel address */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tunnelAddress">{t("admin.forwardAgents.edit.labels.tunnelAddress")}</Label>
                  <Input
                    id="tunnelAddress"
                    value={formData.tunnelAddress || ""}
                    onChange={(e) =>
                      handleChange("tunnelAddress", e.target.value)
                    }
                    placeholder={t("admin.forwardAgents.edit.placeholders.tunnelAddress")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.forwardAgents.edit.hints.tunnelAddress")}
                  </p>
                </div>

                {/* Port limit */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="allowedPortRange">{t("admin.forwardAgents.edit.labels.portLimit")}</Label>
                  <Input
                    id="allowedPortRange"
                    value={formData.allowedPortRange || ""}
                    onChange={(e) =>
                      handleChange("allowedPortRange", e.target.value)
                    }
                    placeholder={t("admin.forwardAgents.edit.placeholders.portLimit")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.forwardAgents.edit.hints.portLimit")}
                  </p>
                </div>

                {/* Sort order */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sortOrder">{t("common.fields.sortOrder")}</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min={0}
                    value={formData.sortOrder ?? ""}
                    onChange={(e) => handleSortOrderChange(e.target.value)}
                    placeholder={t("admin.forwardAgents.edit.placeholders.sortOrder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.forwardAgents.edit.hints.sortOrder")}
                  </p>
                </div>

                {/* Blocked protocols */}
                <div className="flex flex-col gap-3">
                  <Label>{t("admin.forwardAgents.edit.labels.blockedProtocols")}</Label>
                  <div className="space-y-3">
                    {PROTOCOL_GROUPS.map((group) => (
                      <div key={group.labelKey}>
                        <p className="text-xs text-muted-foreground mb-2">
                          {t(group.labelKey)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.protocols.map((protocol) => {
                            const isSelected =
                              formData.blockedProtocols?.includes(
                                protocol.value
                              ) || false;
                            return (
                              <button
                                key={protocol.value}
                                type="button"
                                onClick={() =>
                                  handleProtocolToggle(
                                    protocol.value,
                                    !isSelected
                                  )
                                }
                                className={cn(
                                  "px-3 py-1.5 text-sm rounded-md border transition-colors cursor-pointer",
                                  isSelected
                                    ? "bg-destructive/10 border-destructive/50 text-destructive"
                                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                {protocol.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.forwardAgents.edit.hints.blockedProtocols")}
                  </p>
                </div>

                {/* Remark */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="remark">{t("common.fields.remark")}</Label>
                  <Textarea
                    id="remark"
                    rows={3}
                    value={formData.remark || ""}
                    onChange={(e) => handleChange("remark", e.target.value)}
                  />
                </div>

                {/* Resource groups */}
                {resourceGroups.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Label>{t("admin.forwardAgents.form.bindResourceGroups")}</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <ScrollArea className="h-[120px]">
                        <div className="divide-y divide-border">
                          {resourceGroups.map((group) => {
                            const isSelected = formData.groupSids?.includes(group.sid) ?? false;
                            return (
                              <label
                                key={group.sid}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                                  isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                                )}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleGroupToggle(group.sid)}
                                />
                                <span className="text-sm font-medium truncate flex-1">
                                  {group.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.groupSids && formData.groupSids.length > 0
                        ? t("admin.forwardAgents.form.selectedGroupsCount", { count: formData.groupSids.length })
                        : t("admin.forwardAgents.form.bindResourceGroupsHint")}
                    </p>
                  </div>
                )}

                {/* Mute notification */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="muteNotification">{t("admin.forwardAgents.edit.labels.muteNotification")}</Label>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="muteNotification"
                      checked={formData.muteNotification ?? false}
                      onCheckedChange={(checked) =>
                        handleChange("muteNotification", checked)
                      }
                    >
                      <SwitchThumb />
                    </Switch>
                    <span className="text-sm text-muted-foreground">
                      {formData.muteNotification ? t("admin.forwardAgents.edit.muted") : t("admin.forwardAgents.edit.unmuted")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.forwardAgents.edit.hints.muteNotification")}
                  </p>
                </div>

                {/* Expiration time */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="expiresAt">{t("admin.forwardAgents.edit.labels.expiresAt")}</Label>
                  <ExpirationDatePicker
                    value={formData.expiresAt}
                    onChange={(value) => handleChange("expiresAt", value ?? "")}
                    emptyValue=""
                    id="expiresAt"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.forwardAgents.edit.hints.expiresAt")}
                  </p>
                </div>

                {/* Cost label */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="costLabel">{t("common.fields.costLabel")}</Label>
                  <Input
                    id="costLabel"
                    type="text"
                    value={formData.costLabel ?? ""}
                    onChange={(e) => handleCostLabelChange(e.target.value)}
                    placeholder={t("common.costLabel.placeholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("common.costLabel.hint")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button onClick={handleSubmit} disabled={!hasChanges}>
            {t("common.actions.save")}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t("common.actions.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
