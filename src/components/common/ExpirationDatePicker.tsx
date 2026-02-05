/**
 * ExpirationDatePicker Component
 *
 * A date picker component for setting expiration time with:
 * - Quick preset options (1 month, 3 months, 6 months, 1 year)
 * - Manual datetime input
 * - Clear expiration button
 */

import { useTranslation } from "react-i18next";
import { Input } from "./Input";
import { Button } from "./Button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpirationDatePickerProps {
  /** Current value in ISO string format */
  value?: string;
  /** Callback when value changes. For create forms use undefined, for edit forms use "" to clear */
  onChange: (value: string | undefined) => void;
  /** Value to use when clearing. Defaults to undefined. Use "" for edit forms. */
  emptyValue?: "" | undefined;
  /** ID prefix for the input element */
  id?: string;
  /** Enable mobile-optimized styles with larger touch targets */
  mobile?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Preset duration options in months
const PRESET_OPTIONS = [
  { months: 1, labelKey: "common.expiration.preset.1month" },
  { months: 3, labelKey: "common.expiration.preset.3months" },
  { months: 6, labelKey: "common.expiration.preset.6months" },
  { months: 12, labelKey: "common.expiration.preset.1year" },
] as const;

/**
 * Check if a date represents "never expires" (e.g., 9999-12-31 or 10000-01-01)
 */
const isNeverExpiresDate = (isoString: string): boolean => {
  const date = new Date(isoString);
  return date.getFullYear() >= 9999;
};

/**
 * Format ISO string to datetime-local input format (YYYY-MM-DDTHH:mm)
 * Returns empty string for "never expires" dates (year >= 9999)
 */
const formatDateForInput = (isoString?: string): string => {
  if (!isoString) return "";
  // Treat "never expires" dates as empty (no expiration set)
  if (isNeverExpiresDate(isoString)) return "";
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Add months to current date and return ISO string
 */
const addMonths = (months: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
};

export const ExpirationDatePicker: React.FC<ExpirationDatePickerProps> = ({
  value,
  onChange,
  emptyValue = undefined,
  id = "expiresAt",
  mobile = false,
  className = "",
}) => {
  const { t } = useTranslation();

  const handlePresetClick = (months: number) => {
    onChange(addMonths(months));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === "") {
      onChange(emptyValue);
    } else {
      const date = new Date(inputValue);
      onChange(date.toISOString());
    }
  };

  const handleClear = () => {
    onChange(emptyValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Preset buttons */}
      <div className={cn("flex flex-wrap", mobile ? "gap-2" : "gap-1.5")}>
        {PRESET_OPTIONS.map((option) => (
          <Button
            key={option.months}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(option.months)}
            className={cn(
              mobile
                ? "h-10 px-3 text-sm min-h-[44px] rounded-xl"
                : "h-7 px-2.5 text-xs"
            )}
          >
            {t(option.labelKey)}
          </Button>
        ))}
      </div>

      {/* Manual input */}
      <div className="flex items-center gap-2">
        {mobile ? (
          <input
            id={id}
            type="datetime-local"
            value={formatDateForInput(value)}
            onChange={handleInputChange}
            className={cn(
              "w-full min-h-[52px] py-3 px-4",
              "text-base rounded-xl border bg-background",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "flex-1"
            )}
          />
        ) : (
          <Input
            id={id}
            type="datetime-local"
            value={formatDateForInput(value)}
            onChange={handleInputChange}
            className="h-10 flex-1"
          />
        )}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className={cn(
              "text-muted-foreground",
              mobile
                ? "min-h-[44px] px-3 active:text-destructive"
                : "h-10 px-2 hover:text-destructive"
            )}
            title={t("common.fields.clearExpiration")}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
