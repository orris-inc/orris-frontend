/**
 * Create Forward Agent Dialog Component
 *
 * Redesigned with Tailwind Application UI stacked form layout
 * - Clear section separation with labeled dividers
 * - Compact 6-column grid layout
 * - Collapsible advanced options
 * - Consistent FormSection and FormField patterns
 */

import { useState, useEffect } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/common/Collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CreateForwardAgentRequest,
  BlockedProtocol,
} from "@/api/forward";

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

interface CreateForwardAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardAgentRequest) => Promise<void>;
  /** Initial data for pre-populating the form when copying a node */
  initialData?: Partial<CreateForwardAgentRequest>;
}

// Default form data
const getDefaultFormData = (): CreateForwardAgentRequest => ({
  name: "",
  publicAddress: "",
  tunnelAddress: "",
  remark: "",
  allowedPortRange: "",
  sortOrder: undefined,
  blockedProtocols: [],
});

/**
 * Form Section Component - Tailwind Application UI style
 * Clean, minimal section with lightweight divider
 */
const FormSection = ({
  title,
  children,
  className = "",
}: {
  title: string;
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
    {children}
  </fieldset>
);

/**
 * Form Field Component with consistent styling
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

export const CreateForwardAgentDialog: React.FC<
  CreateForwardAgentDialogProps
> = ({ open, onClose, onSubmit, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] =
    useState<CreateForwardAgentRequest>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        ...getDefaultFormData(),
        ...initialData,
      });
      // Auto-expand advanced options if they have values
      setAdvancedOpen(
        !!(
          initialData.sortOrder !== undefined ||
          initialData.remark ||
          (initialData.blockedProtocols &&
            initialData.blockedProtocols.length > 0)
        )
      );
    } else if (open && !initialData) {
      setFormData(getDefaultFormData());
      setAdvancedOpen(false);
    }
  }, [open, initialData]);

  const handleClose = () => {
    setFormData(getDefaultFormData());
    setErrors({});
    setAdvancedOpen(false);
    onClose();
  };

  const handleChange = (
    field: keyof CreateForwardAgentRequest,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
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

  const handleProtocolToggle = (
    protocol: BlockedProtocol,
    checked: boolean
  ) => {
    const current = formData.blockedProtocols || [];
    const updated = checked
      ? [...current, protocol]
      : current.filter((p) => p !== protocol);
    setFormData((prev) => ({ ...prev, blockedProtocols: updated }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("common.validation.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      // Clean up undefined and empty strings
      const submitData: CreateForwardAgentRequest = {
        name: formData.name.trim(),
      };

      if (formData.publicAddress?.trim()) {
        submitData.publicAddress = formData.publicAddress.trim();
      }

      if (formData.tunnelAddress?.trim()) {
        submitData.tunnelAddress = formData.tunnelAddress.trim();
      }

      if (formData.remark?.trim()) {
        submitData.remark = formData.remark.trim();
      }

      if (formData.allowedPortRange?.trim()) {
        submitData.allowedPortRange = formData.allowedPortRange.trim();
      }

      if (formData.sortOrder !== undefined) {
        submitData.sortOrder = formData.sortOrder;
      }

      if (formData.blockedProtocols && formData.blockedProtocols.length > 0) {
        submitData.blockedProtocols = formData.blockedProtocols;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(submitData);
        // Reset form after successful submission
        setFormData(getDefaultFormData());
        setErrors({});
        setAdvancedOpen(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isFormValid = formData.name.trim();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border sm:px-6">
          <DialogTitle className="text-lg font-semibold">
            {initialData
              ? t("admin.forwardAgents.dialog.copyTitle")
              : t("admin.forwardAgents.dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-6">
            {/* Section 1: Basic Information */}
            <FormSection title={t("admin.forwardAgents.edit.sections.basicInfo")}>
              <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                {/* Node Name - full width */}
                <FormField
                  label={t("admin.forwardAgents.form.nodeName")}
                  required
                  error={errors.name}
                  className="col-span-6"
                >
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={!!errors.name}
                    autoFocus
                    placeholder={t(
                      "admin.forwardAgents.form.nodeNamePlaceholder"
                    )}
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 2: Network Configuration */}
            <FormSection
              title={t("admin.forwardAgents.create.sections.network")}
            >
              <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                {/* Public Address - 3 cols */}
                <FormField
                  label={t("admin.forwardAgents.form.publicAddress")}
                  hint={t("admin.forwardAgents.form.publicAddressHint")}
                  className="col-span-6 sm:col-span-3"
                >
                  <Input
                    id="publicAddress"
                    value={formData.publicAddress}
                    onChange={(e) =>
                      handleChange("publicAddress", e.target.value)
                    }
                    placeholder={t(
                      "admin.forwardAgents.form.publicAddressPlaceholder"
                    )}
                    className="font-mono"
                  />
                </FormField>

                {/* Tunnel Address - 3 cols */}
                <FormField
                  label={t("admin.forwardAgents.form.tunnelAddress")}
                  hint={t("admin.forwardAgents.form.tunnelAddressHint")}
                  className="col-span-6 sm:col-span-3"
                >
                  <Input
                    id="tunnelAddress"
                    value={formData.tunnelAddress}
                    onChange={(e) =>
                      handleChange("tunnelAddress", e.target.value)
                    }
                    placeholder={t(
                      "admin.forwardAgents.form.tunnelAddressPlaceholder"
                    )}
                    className="font-mono"
                  />
                </FormField>

                {/* Allowed Port Range - full width */}
                <FormField
                  label={t("admin.forwardAgents.form.portLimit")}
                  hint={t("admin.forwardAgents.form.portLimitHint")}
                  className="col-span-6"
                >
                  <Input
                    id="allowedPortRange"
                    value={formData.allowedPortRange}
                    onChange={(e) =>
                      handleChange("allowedPortRange", e.target.value)
                    }
                    placeholder={t(
                      "admin.forwardAgents.form.portLimitPlaceholder"
                    )}
                    className="font-mono"
                  />
                </FormField>
              </div>
            </FormSection>

            {/* Section 3: Advanced Options (Collapsible) */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 w-full text-left group"
                >
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {t("admin.forwardAgents.create.sections.advanced")}
                  </span>
                  <div className="h-px flex-1 bg-border" aria-hidden="true" />
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      advancedOpen && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                  {/* Sort Order - 2 cols */}
                  <FormField
                    label={t("admin.forwardAgents.form.sortOrder")}
                    hint={t("admin.forwardAgents.form.sortOrderHint")}
                    className="col-span-3 sm:col-span-2"
                  >
                    <Input
                      id="sortOrder"
                      type="number"
                      min={0}
                      value={formData.sortOrder ?? ""}
                      onChange={(e) => handleSortOrderChange(e.target.value)}
                      placeholder={t(
                        "admin.forwardAgents.form.sortOrderPlaceholder"
                      )}
                    />
                  </FormField>

                  {/* Spacer for layout */}
                  <div className="col-span-3 sm:col-span-4" />

                  {/* Blocked Protocols - full width */}
                  <FormField
                    label={t("admin.forwardAgents.form.blockedProtocols")}
                    hint={t("admin.forwardAgents.form.blockedProtocolsHint")}
                    className="col-span-6"
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
                  </FormField>

                  {/* Remark - full width */}
                  <FormField
                    label={t("admin.forwardAgents.form.remark")}
                    className="col-span-6"
                  >
                    <Textarea
                      id="remark"
                      rows={2}
                      value={formData.remark}
                      onChange={(e) => handleChange("remark", e.target.value)}
                      placeholder={t(
                        "admin.forwardAgents.form.remarkPlaceholder"
                      )}
                      className="resize-none"
                    />
                  </FormField>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 px-5 py-4 border-t border-border bg-muted/30 sm:px-6">
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting
                ? t("admin.forwardAgents.form.creating")
                : t("admin.forwardAgents.form.create")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
