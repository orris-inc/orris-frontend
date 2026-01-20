/**
 * Auth Alert Component
 * Displays success, error, or info messages in auth forms
 */

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'success' | 'error' | 'info';

interface AuthAlertProps {
  /** Alert type determines styling and icon */
  variant: AlertVariant;
  /** Main message content */
  children: ReactNode;
  /** Optional action button/link */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  { icon: typeof AlertCircle; containerClass: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    containerClass: 'bg-success-muted text-success',
    iconClass: 'text-success',
  },
  error: {
    icon: AlertCircle,
    containerClass: 'bg-destructive/10 text-destructive',
    iconClass: 'text-destructive',
  },
  info: {
    icon: Info,
    containerClass: 'bg-info-muted text-info',
    iconClass: 'text-info',
  },
};

/**
 * Alert component for authentication feedback
 */
export const AuthAlert = ({
  variant,
  children,
  action,
  className,
}: AuthAlertProps) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg',
        config.containerClass,
        className
      )}
    >
      <Icon className={cn('size-5 shrink-0 mt-0.5', config.iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">{children}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
};
