/**
 * Form Field Components
 * Two-column form layout components following Tailwind Application UI pattern
 *
 * Desktop (sm+): Label on left, input on right
 * Mobile: Stacked layout
 */

import { cn } from '@/lib/utils';
import { labelStyles } from '@/lib/ui-styles';
import { Skeleton } from '@/components/common/Skeleton';

/**
 * FormSection - Section wrapper with header and dividers
 */
interface FormSectionProps {
  title?: string;
  description?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Visual variant: 'glass' (legacy) or 'card' (Tailwind UI style) */
  variant?: 'glass' | 'card';
}

export const FormSection = ({
  title,
  description,
  headerRight,
  children,
  className,
  variant = 'card',
}: FormSectionProps) => (
  <div
    className={cn(
      'rounded-lg overflow-hidden',
      variant === 'card'
        ? 'bg-card ring-1 ring-border/60'
        : 'glass-elevated rounded-2xl',
      className
    )}
  >
    {/* Section Header */}
    {(title || description || headerRight) && (
      <div className="flex items-center justify-between gap-4 p-4 pb-3 border-b border-border/60">
        <div className="min-w-0">
          {title && (
            <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
    )}
    {/* Section Content */}
    <div className="divide-y divide-border/60">{children}</div>
  </div>
);

/**
 * FormField - Two-column form field (label+desc left, input right)
 */
interface FormFieldProps {
  label: string;
  description?: string;
  labelRight?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  description,
  labelRight,
  required,
  disabled,
  children,
  className,
}: FormFieldProps) => (
  <div
    className={cn(
      'grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-4',
      disabled && 'opacity-60',
      className
    )}
  >
    {/* Label column */}
    <div className="sm:pt-2">
      <div className="flex items-center gap-2 flex-wrap">
        <label className={cn(labelStyles, 'text-foreground')}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {labelRight}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
    {/* Input column */}
    <div className="sm:col-span-2">{children}</div>
  </div>
);

/**
 * FormActions - Action buttons area
 */
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const FormActions = ({ children, className }: FormActionsProps) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3 p-4 bg-muted/30',
      className
    )}
  >
    {children}
  </div>
);

/**
 * FormFieldSkeleton - Loading skeleton for FormField
 */
interface FormFieldSkeletonProps {
  hasDescription?: boolean;
  inputWidth?: 'full' | 'medium' | 'small';
}

export const FormFieldSkeleton = ({
  hasDescription = true,
  inputWidth = 'full',
}: FormFieldSkeletonProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 p-4">
    {/* Label column */}
    <div className="sm:pt-2 space-y-1.5">
      <Skeleton className="h-3.5 w-24" />
      {hasDescription && <Skeleton className="h-3 w-40" />}
    </div>
    {/* Input column */}
    <div className="sm:col-span-2">
      <Skeleton
        className={cn(
          'h-10 rounded-md',
          inputWidth === 'full' && 'w-full',
          inputWidth === 'medium' && 'w-48',
          inputWidth === 'small' && 'w-32'
        )}
      />
    </div>
  </div>
);

/**
 * FormSectionSkeleton - Loading skeleton for FormSection
 */
interface FormSectionSkeletonProps {
  fieldCount?: number;
  hasHeader?: boolean;
  /** Visual variant: 'glass' (legacy) or 'card' (Tailwind UI style) */
  variant?: 'glass' | 'card';
}

export const FormSectionSkeleton = ({
  fieldCount = 4,
  hasHeader = true,
  variant = 'card',
}: FormSectionSkeletonProps) => (
  <div
    className={cn(
      'rounded-lg overflow-hidden',
      variant === 'card' ? 'bg-card ring-1 ring-border/60' : 'glass-elevated rounded-2xl'
    )}
  >
    {/* Header skeleton */}
    {hasHeader && (
      <div className="flex items-center justify-between p-4 pb-3 border-b border-border/60">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-48" />
        </div>
      </div>
    )}
    {/* Fields skeleton */}
    <div className="divide-y divide-border/60">
      {Array.from({ length: fieldCount }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
    </div>
  </div>
);
