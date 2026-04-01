/**
 * Edit Forward Agent Dialog Component
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
import { Separator } from "@/components/common/Separator";
import { Checkbox } from "@/components/common/Checkbox";
import { ScrollArea } from "@/components/common/ScrollArea";
import { Switch, SwitchThumb } from "@/components/common/Switch";
import { ExpirationDatePicker } from "@/components/common/ExpirationDatePicker";
import { cn } from "@/lib/utils";
import { SmartTruncate } from '@/components/common/SmartTruncate';
import type {
  ForwardAgent,
  UpdateForwardAgentRequest,
} from "@/api/forward";
import { useResourceGroups } from "@/features/resource-groups/hooks/useResourceGroups";
import {
  useEditForwardAgentForm,
  PROTOCOL_GROUPS,
} from "../hooks/useEditForwardAgentForm";

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

  const form = useEditForwardAgentForm({ entity: agent });

  // Get resource group list
  const { resourceGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: "active" },
    enabled: open,
  });

  const handleSubmit = () => {
    if (agent && form.validate()) {
      const updates = form.buildSubmitData();

      // If any changes, submit update
      if (updates && Object.keys(updates).length > 0) {
        onSubmit(agent.id, updates);
      }
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="@container sm:max-w-2xl flex flex-col max-h-[90vh]">
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
                    value={form.formData.name || ""}
                    onChange={(e) => form.handleChange("name", e.target.value)}
                    error={!!form.errors.name}
                  />
                  {form.errors.name && (
                    <p className="text-xs text-destructive">{form.errors.name}</p>
                  )}
                </div>

                {/* Public address */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="publicAddress">{t("admin.forwardAgents.edit.labels.publicAddress")}</Label>
                  <Input
                    id="publicAddress"
                    value={form.formData.publicAddress || ""}
                    onChange={(e) =>
                      form.handleChange("publicAddress", e.target.value)
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
                    value={form.formData.tunnelAddress || ""}
                    onChange={(e) =>
                      form.handleChange("tunnelAddress", e.target.value)
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
                    value={form.formData.allowedPortRange || ""}
                    onChange={(e) =>
                      form.handleChange("allowedPortRange", e.target.value)
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
                    value={form.formData.sortOrder ?? ""}
                    onChange={(e) => form.handleSortOrderChange(e.target.value)}
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
                              form.formData.blockedProtocols?.includes(
                                protocol.value
                              ) || false;
                            return (
                              <button
                                key={protocol.value}
                                type="button"
                                onClick={() =>
                                  form.handleProtocolToggle(
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
                    value={form.formData.remark || ""}
                    onChange={(e) => form.handleChange("remark", e.target.value)}
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
                            const isSelected = form.formData.groupSids?.includes(group.sid) ?? false;
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
                                  onCheckedChange={() => form.handleGroupToggle(group.sid)}
                                />
                                <SmartTruncate text={group.name} className="text-sm font-medium flex-1" />
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {form.formData.groupSids && form.formData.groupSids.length > 0
                        ? t("admin.forwardAgents.form.selectedGroupsCount", { count: form.formData.groupSids.length })
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
                      checked={form.formData.muteNotification ?? false}
                      onCheckedChange={(checked) =>
                        form.handleChange("muteNotification", checked)
                      }
                    >
                      <SwitchThumb />
                    </Switch>
                    <span className="text-sm text-muted-foreground">
                      {form.formData.muteNotification ? t("admin.forwardAgents.edit.muted") : t("admin.forwardAgents.edit.unmuted")}
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
                    value={form.formData.expiresAt}
                    onChange={(value) => form.handleChange("expiresAt", value ?? "")}
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
                    value={form.formData.costLabel ?? ""}
                    onChange={(e) => form.handleCostLabelChange(e.target.value)}
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
          <Button onClick={handleSubmit} disabled={!form.hasChanges}>
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
