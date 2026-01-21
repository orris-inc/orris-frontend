/**
 * Page Header Component
 * Following Tailwind UI Application UI page heading patterns
 * Supports breadcrumbs, metadata display, page-level tabs, and action slot
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

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  metadata?: PageHeaderMeta[];
  tabs?: PageHeaderTab[];
  className?: string;
}

/**
 * Page header following Tailwind UI Application UI style
 * Layout: breadcrumbs (optional) -> title row (icon + title + actions) -> description -> metadata -> tabs
 */
export const PageHeader = ({
  title,
  description,
  icon: Icon,
  action,
  breadcrumbs,
  metadata,
  tabs,
  className,
}: PageHeaderProps) => {
  return (
    <header className={cn('@container space-y-4', className)}>
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

      {/* Main header row: title + actions */}
      <div className="flex flex-col gap-4 @sm:flex-row @sm:items-center @sm:justify-between">
        {/* Left: icon + title */}
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="shrink-0">
              <Icon
                className="size-8 text-muted-foreground"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
          )}
          <h1 className="text-2xl font-semibold text-foreground @sm:text-3xl @sm:tracking-tight truncate">
            {title}
          </h1>
        </div>

        {/* Right: action slot */}
        {action && <div className="shrink-0 flex items-center gap-3">{action}</div>}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-4xl">
          {description}
        </p>
      )}

      {/* Metadata items */}
      {metadata && metadata.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {metadata.map((item, index) => {
            const MetaIcon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
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
        <nav className="border-b border-border -mb-px">
          <div className="flex gap-x-8">
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
        </nav>
      )}
    </header>
  );
};
