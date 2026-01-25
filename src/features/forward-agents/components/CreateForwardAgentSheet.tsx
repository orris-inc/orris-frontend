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

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type {
  CreateForwardAgentRequest,
  BlockedProtocol,
} from "@/api/forward";

// Protocol groups
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

interface CreateForwardAgentSheetProps
  extends CreateSheetProps<CreateForwardAgentRequest> {
  initialData?: Partial<CreateForwardAgentRequest>;
}

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
  label: string;
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
    const [formData, setFormData] =
      useState<CreateForwardAgentRequest>(getDefaultFormData());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
      if (open && initialData) {
        setFormData({ ...getDefaultFormData(), ...initialData });
        // Auto-expand advanced options if they have values
        setShowAdvanced(
          !!(
            initialData.sortOrder !== undefined ||
            initialData.remark ||
            (initialData.blockedProtocols &&
              initialData.blockedProtocols.length > 0)
          )
        );
      } else if (open && !initialData) {
        setFormData(getDefaultFormData());
        setShowAdvanced(false);
      }
    }, [open, initialData]);

    const handleClose = () => {
      if (!loading) {
        setFormData(getDefaultFormData());
        setErrors({});
        setShowAdvanced(false);
        onOpenChange(false);
      }
    };

    const handleChange = (
      field: keyof CreateForwardAgentRequest,
      value: string | number | undefined
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
      if (!validate()) return;

      setLoading(true);
      try {
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

        await onSubmit(submitData);
        setFormData(getDefaultFormData());
        setErrors({});
        setShowAdvanced(false);
      } finally {
        setLoading(false);
      }
    };

    const isFormValid = formData.name.trim();

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
              error={errors.name}
            >
              <MobileFormInput
                placeholder={t("admin.forwardAgents.form.nodeNamePlaceholder")}
                value={formData.name}
                onChange={(value) => handleChange("name", value)}
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
                  value={formData.publicAddress || ""}
                  onChange={(value) => handleChange("publicAddress", value)}
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
                  value={formData.tunnelAddress || ""}
                  onChange={(value) => handleChange("tunnelAddress", value)}
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
                value={formData.allowedPortRange || ""}
                onChange={(value) => handleChange("allowedPortRange", value)}
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
                      formData.sortOrder !== undefined
                        ? String(formData.sortOrder)
                        : ""
                    }
                    onChange={(value) =>
                      handleChange(
                        "sortOrder",
                        value ? parseInt(value, 10) : undefined
                      )
                    }
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
                                  "px-3 py-2 text-sm rounded-lg border transition-colors min-h-[44px]",
                                  isSelected
                                    ? "bg-destructive/10 border-destructive/50 text-destructive"
                                    : "bg-muted/50 border-border text-muted-foreground active:bg-muted"
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

                {/* Remark */}
                <FormField label={t("common.fields.remark")}>
                  <MobileFormInput
                    placeholder={t(
                      "admin.forwardAgents.form.remarkPlaceholder"
                    )}
                    value={formData.remark || ""}
                    onChange={(value) => handleChange("remark", value)}
                  />
                </FormField>
              </div>
            )}
          </SheetBody>

          <SheetFooter>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 min-h-[52px]"
              >
                {t("common.actions.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !isFormValid}
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
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  };
