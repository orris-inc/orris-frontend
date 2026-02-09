/**
 * Forward Rule Form Primitives
 * Shared FormSection and FormField components used by Create/Edit dialogs
 */

import { Label } from '@/components/common/Label';

/**
 * Form Section - Tailwind Application UI style
 * Clean, minimal section with lightweight divider
 */
export const FormSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className = '' }) => (
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
 * Form Field with consistent styling
 * Uses grid span classes for responsive layout
 */
export const FormField: React.FC<{
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ label, required, error, hint, children, className = '' }) => (
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
