/**
 * Page Header Component
 * Following Tailwind UI Application UI page heading patterns
 * @see https://tailwindcss.com/plus/ui-blocks/application-ui/headings/page-headings
 *
 * Supports:
 * - Breadcrumbs for navigation hierarchy
 * - Title with optional icon and badge
 * - Description text
 * - Metadata items with icons
 * - Page-level tabs
 * - Action slot for buttons
 *
 * Mobile-first: vertical stack → horizontal on sm breakpoint
 */

import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewTransitionLink } from '@/components/common/ViewTransitionLink';

// Breadcrumb item type
export interface PageHeaderBreadcrumb {
  label: string;
  href?: string;
}

// Metadata item type for inline info display
export interface PageHeaderMeta {
  icon?: LucideIcon;
  text: string;
}

// Tab item type for page-level navigation
export interface PageHeaderTab {
  label: string;
  href: string;
  current?: boolean;
}

// Badge variant type
export type PageHeaderBadgeVariant = 'default' | 'success' | 'warning' | 'danger';

// Badge type for status display
export interface PageHeaderBadge {
  label: string;
  variant?: PageHeaderBadgeVariant;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Badge displayed next to title */
  badge?: PageHeaderBadge;
  /** @deprecated Use action instead */
  actions?: ReactNode;
  action?: ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  metadata?: PageHeaderMeta[];
  tabs?: PageHeaderTab[];
  className?: string;
}

// Badge variant styles mapping
const badgeVariantStyles: Record<PageHeaderBadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground ring-muted-foreground/20',
  success: 'bg-success/10 text-success ring-success/20',
  warning: 'bg-warning/10 text-warning ring-warning/20',
  danger: 'bg-destructive/10 text-destructive ring-destructive/20',
};

/**
 * Page header following Tailwind UI Application UI style
 * Layout: breadcrumbs (optional) → title row (icon + title + badge + actions) → description → metadata → tabs
 */
export const PageHeader = ({
  title,
  description,
  icon: Icon,
  badge,
  action,
  actions,
  breadcrumbs,
  metadata,
  tabs,
  className,
}: PageHeaderProps) => {
  // Support both action and actions props for backward compatibility
  const actionContent = action || actions;

  return (
    <header className={cn('space-y-3 sm:space-y-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex">
          <ol className="flex items-center gap-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                )}
                {crumb.href ? (
                  <ViewTransitionLink
                    to={crumb.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </ViewTransitionLink>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Main header row: Mobile-first vertical, sm horizontal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {/* Left: icon + title + badge */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-x-3">
            {Icon && (
              <div className="shrink-0 hidden sm:block">
                <Icon
                  className="size-7 sm:size-8 text-muted-foreground"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>
            )}
            <h1 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl sm:tracking-tight truncate">
              {title}
            </h1>
            {badge && (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                  badgeVariantStyles[badge.variant || 'default']
                )}
              >
                {badge.label}
              </span>
            )}
          </div>
          {/* Description - placed under title */}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground max-w-4xl">
              {description}
            </p>
          )}
        </div>

        {/* Right: action slot */}
        {actionContent && (
          <div className="flex shrink-0 items-center gap-x-2">
            {actionContent}
          </div>
        )}
      </div>

      {/* Metadata items */}
      {metadata && metadata.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {metadata.map((item, index) => {
            const MetaIcon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-x-1.5"
              >
                {MetaIcon && (
                  <MetaIcon className="size-4 shrink-0" aria-hidden="true" />
                )}
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs navigation */}
      {tabs && tabs.length > 0 && (
        <nav className="border-b border-border -mb-px mt-2">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-x-6 sm:gap-x-8 min-w-max">
              {tabs.map((tab) => (
                <ViewTransitionLink
                  key={tab.href}
                  to={tab.href}
                  className={cn(
                    'relative whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors',
                    tab.current
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  {tab.label}
                </ViewTransitionLink>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
