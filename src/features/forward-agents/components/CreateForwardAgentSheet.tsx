/**
 * Create Forward Agent Sheet Component
 * Mobile-optimized bottom sheet - Tailwind Application UI style
 *
 * Design principles:
 * - Clear section separation with labeled dividers
 * - Logical field grouping based on business logic
 * - Touch-friendly inputs (min 52px height)
 * - Progressive disclosure for advanced options
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { Loader2, ChevronDown, FolderTree, Check } from "lucide-react";
import { useResourceGroups } from "@/features/resource-groups/hooks/useResourceGroups";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type CreateSheetProps,
} from "@/components/common/sheet";
import { Button } from "@/components/common/Button";
import { MobileFormInput } from "@/components/common/mobile-form";
import { ExpirationDatePicker } from "@/components/common/ExpirationDatePicker";
import { cn } from "@/lib/utils";
import type { CreateForwardAgentRequest } from "@/api/forward";
import {
  useCreateForwardAgentForm,
  PROTOCOL_GROUPS,
  type CreateForwardAgentFormData,
  type CreateForwardAgentRequestWithExpiration,
} from "../hooks/useCreateForwardAgentForm";

interface CreateForwardAgentSheetProps
  extends Omit<CreateSheetProps<CreateForwardAgentRequest>, 'onSubmit'> {
  initialData?: Partial<CreateForwardAgentFormData>;
  onSubmit: (data: CreateForwardAgentRequestWithExpiration) => Promise<void>;
}

/**
 * Section Divider with Label
 * Creates visual separation between form sections
 */
const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 pt-2 pb-1">
    <span className="text-xs font-semibold text-foreground whitespace-nowrap">
      {label}
    </span>
    <div className="h-px flex-1 bg-border" aria-hidden="true" />
  </div>
);

/**
 * Collapsible Section Trigger
 */
const CollapsibleTrigger = ({
  label,
  isOpen,
  onClick,
}: {
  label: string;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-3 py-2 group"
  >
    <span className="text-xs font-semibold text-muted-foreground group-active:text-foreground transition-colors whitespace-nowrap">
      {label}
    </span>
    <div className="h-px flex-1 bg-border" aria-hidden="true" />
    <ChevronDown
      className={cn(
        "size-4 text-muted-foreground transition-transform duration-200",
        isOpen && "rotate-180"
      )}
    />
  </button>
);

/**
 * Form Field Component
 */
const FormField = ({
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-foreground block">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    {hint && !error && (
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    )}
  </div>
);

export const CreateForwardAgentSheet: React.FC<CreateForwardAgentSheetProps> =
  ({ open, onOpenChange, onSubmit, initialData }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const form = useCreateForwardAgentForm({ open, initialData });

    // Get resource groups for selection
    const { resourceGroups } = useResourceGroups({
      pageSize: 100,
      filters: { status: "active" },
      enabled: open,
    });

    // Auto-expand advanced options if initialData has values
    // Check on open change
    if (
      open &&
      initialData &&
      !showAdvanced &&
      (initialData.sortOrder !== undefined ||
        initialData.remark ||
        (initialData.blockedProtocols &&
          initialData.blockedProtocols.length > 0) ||
        initialData.expiresAt ||
        initialData.costLabel !== undefined)
    ) {
      setShowAdvanced(true);
    }

    const handleClose = () => {
      if (!loading) {
        form.reset();
        setShowAdvanced(false);
        onOpenChange(false);
      }
    };

    const handleSubmit = async () => {
      if (!form.validate()) return;

      setLoading(true);
      try {
        const submitData = form.buildSubmitData();
        await onSubmit(submitData);
        form.reset();
        setShowAdvanced(false);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {initialData
                ? t("admin.forwardAgents.dialog.copyTitle")
                : t("admin.forwardAgents.dialog.createTitle")}
            </SheetTitle>
            <SheetDescription>
              {t("admin.forwardAgents.create.description")}
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="space-y-4 py-4">
            {/* ===== Section 1: Basic Info ===== */}
            <SectionDivider
              label={t("common.sections.basicInfo")}
            />

            <FormField
              label={t("admin.forwardAgents.form.nodeName")}
              required
              error={form.errors.name}
            >
              <MobileFormInput
                placeholder={t("admin.forwardAgents.form.nodeNamePlaceholder")}
                value={form.formData.name}
                onChange={(value) => form.handleChange("name", value)}
              />
            </FormField>

            {/* ===== Section 2: Network Configuration ===== */}
            <SectionDivider
              label={t("common.sections.networkConfig")}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label={t("admin.forwardAgents.form.publicAddress")}
                hint={t("admin.forwardAgents.form.publicAddressHint")}
              >
                <MobileFormInput
                  placeholder={t(
                    "admin.forwardAgents.form.publicAddressPlaceholder"
                  )}
                  value={form.formData.publicAddress || ""}
                  onChange={(value) => form.handleChange("publicAddress", value)}
                  className="font-mono"
                />
              </FormField>

              <FormField
                label={t("admin.forwardAgents.form.tunnelAddress")}
                hint={t("admin.forwardAgents.form.tunnelAddressHint")}
              >
                <MobileFormInput
                  placeholder={t(
                    "admin.forwardAgents.form.tunnelAddressPlaceholder"
                  )}
                  value={form.formData.tunnelAddress || ""}
                  onChange={(value) => form.handleChange("tunnelAddress", value)}
                  className="font-mono"
                />
              </FormField>
            </div>

            <FormField
              label={t("admin.forwardAgents.form.portLimit")}
              hint={t("admin.forwardAgents.form.portLimitHint")}
            >
              <MobileFormInput
                placeholder={t("admin.forwardAgents.form.portLimitPlaceholder")}
                value={form.formData.allowedPortRange || ""}
                onChange={(value) => form.handleChange("allowedPortRange", value)}
                className="font-mono"
              />
            </FormField>

            {/* ===== Section 3: Advanced Options (Collapsible) ===== */}
            <CollapsibleTrigger
              label={t("common.sections.advancedOptions")}
              isOpen={showAdvanced}
              onClick={() => setShowAdvanced(!showAdvanced)}
            />

            {showAdvanced && (
              <div className="space-y-4 pt-1">
                <FormField
                  label={t("common.fields.sortOrder")}
                  hint={t("admin.forwardAgents.form.sortOrderHint")}
                >
                  <MobileFormInput
                    type="number"
                    inputMode="numeric"
                    placeholder={t(
                      "admin.forwardAgents.form.sortOrderPlaceholder"
                    )}
                    value={
                      form.formData.sortOrder !== undefined
                        ? String(form.formData.sortOrder)
                        : ""
                    }
                    onChange={(value) => form.handleSortOrderChange(value)}
                  />
                </FormField>

                {/* Blocked Protocols */}
                <FormField
                  label={t("admin.forwardAgents.form.blockedProtocols")}
                  hint={t("admin.forwardAgents.form.blockedProtocolsHint")}
                >
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
                                  "px-3 py-2 text-sm rounded-lg transition-all min-h-[44px] active:scale-[0.98]",
                                  isSelected
                                    ? "bg-destructive/10 ring-1 ring-destructive/50 text-destructive"
                                    : "bg-muted/50 ring-1 ring-border text-muted-foreground active:bg-muted"
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
                </FormField>

                {/* Resource Groups */}
                {resourceGroups.length > 0 && (
                  <FormField
                    label={
                      <span className="flex items-center gap-1.5">
                        <FolderTree className="size-4" />
                        {t("admin.forwardAgents.form.bindResourceGroups")}
                      </span>
                    }
                    hint={
                      form.formData.groupSids && form.formData.groupSids.length > 0
                        ? t("admin.forwardAgents.form.selectedGroupsCount", { count: form.formData.groupSids.length })
                        : t("admin.forwardAgents.form.bindResourceGroupsHint")
                    }
                  >
                    <div className="border rounded-lg overflow-hidden divide-y divide-border">
                      {resourceGroups.map((group) => {
                        const isSelected = form.formData.groupSids?.includes(group.sid) ?? false;
                        return (
                          <button
                            key={group.sid}
                            type="button"
                            onClick={() => form.handleGroupToggle(group.sid)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 w-full text-left transition-colors min-h-[48px]",
                              isSelected ? "bg-primary/5" : "active:bg-muted/50"
                            )}
                          >
                            <div className={cn(
                              "size-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border"
                            )}>
                              {isSelected && <Check className="size-3.5" />}
                            </div>
                            <SmartTruncate text={group.name} className="text-sm font-medium flex-1" />
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                )}

                {/* Expiration time */}
                <FormField
                  label={t("admin.forwardAgents.edit.labels.expiresAt")}
                  hint={t("admin.forwardAgents.edit.hints.expiresAt")}
                >
                  <ExpirationDatePicker
                    value={form.formData.expiresAt}
                    onChange={(value) => form.handleChange("expiresAt", value)}
                    id="expiresAt"
                    mobile
                  />
                </FormField>

                {/* Cost label */}
                <FormField
                  label={t("common.fields.costLabel")}
                  hint={t("common.costLabel.hint")}
                >
                  <MobileFormInput
                    placeholder={t("common.costLabel.placeholder")}
                    value={form.formData.costLabel ?? ""}
                    onChange={(value) => form.handleCostLabelChange(value)}
                  />
                </FormField>

                {/* Remark */}
                <FormField label={t("common.fields.remark")}>
                  <MobileFormInput
                    placeholder={t(
                      "admin.forwardAgents.form.remarkPlaceholder"
                    )}
                    value={form.formData.remark || ""}
                    onChange={(value) => form.handleChange("remark", value)}
                  />
                </FormField>
              </div>
            )}
          </SheetBody>

          <SheetFooter>
            <div className="flex gap-3 w-full">
              <Button
                onClick={handleSubmit}
                disabled={loading || !form.isFormValid}
                className="flex-1 min-h-[52px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t("common.loading.creating")}
                  </>
                ) : (
                  t("common.actions.create")
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 min-h-[52px]"
              >
                {t("common.actions.cancel")}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  };
