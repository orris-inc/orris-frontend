/**
 * Empty State Component
 * Display when content area has no data
 * Supports three variants: simple, action, suggestions
 */

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LucideIcon, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface EmptySuggestion {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: 'simple' | 'action' | 'suggestions';
  suggestions?: EmptySuggestion[];
  className?: string;
}

/**
 * Empty state display with icon, title, description and optional action/suggestions
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = 'action',
  suggestions,
  className,
}: EmptyStateProps) => {
  const { t } = useTranslation();
  const displayTitle = title ?? t('common.messages.noData');
  const isSimple = variant === 'simple';
  const showIconBackground = variant !== 'simple';

  return (
    <div
      className={cn(
        '@container flex flex-col items-center justify-center px-4 text-center',
        isSimple ? 'py-8' : 'py-12',
        className
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          'flex size-12 items-center justify-center mb-4',
          showIconBackground && 'rounded-full bg-muted'
        )}
      >
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="text-base font-medium text-foreground mb-1">{displayTitle}</h3>

      {/* Description - hidden for simple variant */}
      {!isSimple && description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}

      {/* Action button - only for action variant */}
      {variant === 'action' && action && <div className="mt-2">{action}</div>}

      {/* Suggestions list - only for suggestions variant */}
      {variant === 'suggestions' && suggestions && suggestions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {suggestions.map((suggestion, index) => {
            const SuggestionIcon = suggestion.icon;
            return (
              <li key={index}>
                <Link
                  to={suggestion.href}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {SuggestionIcon && (
                    <SuggestionIcon className="size-4" aria-hidden="true" />
                  )}
                  {suggestion.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export type { EmptyStateProps };
