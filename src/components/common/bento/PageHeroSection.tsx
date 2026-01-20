/**
 * Page Hero Section Component
 * Reusable hero banner for dashboard pages with gradient background and decorative elements
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'warning' | 'success' | 'info';

interface PageHeroSectionProps {
  /** Page title */
  title: string;
  /** Subtitle shown above title */
  subtitle?: string;
  /** Dynamic status message shown below title */
  statusMessage?: ReactNode;
  /** Status message color variant */
  statusVariant?: StatusVariant;
  /** Decorative icon shown on the right (desktop only) */
  icon?: LucideIcon;
  /** Additional className for customization */
  className?: string;
  /** Whether the page is loading */
  isLoading?: boolean;
  /** Loading message to show */
  loadingMessage?: string;
  /** Children for additional content */
  children?: ReactNode;
}

const statusVariantStyles: Record<StatusVariant, string> = {
  default: 'text-muted-foreground',
  warning: 'text-warning',
  success: 'text-success',
  info: 'text-muted-foreground',
};

/**
 * Hero section with gradient background for dashboard pages
 * Provides consistent visual hierarchy across all user-facing pages
 */
export const PageHeroSection = ({
  title,
  subtitle,
  statusMessage,
  statusVariant = 'default',
  icon: Icon,
  className,
  isLoading,
  loadingMessage,
  children,
}: PageHeroSectionProps) => {
  return (
    <section
      className={cn(
        '@container relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
        'border border-primary/10 p-5 @sm:p-6',
        className
      )}
    >
      <div className="relative z-10">
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-1">{subtitle}</p>
        )}
        <h1 className="text-fluid-2xl font-bold text-foreground mb-2">
          {title}
        </h1>
        {/* Dynamic status message */}
        {!isLoading && statusMessage && (
          <div className={cn('text-fluid-sm max-w-md', statusVariantStyles[statusVariant])}>
            {statusMessage}
          </div>
        )}
        {isLoading && loadingMessage && (
          <p className="text-fluid-sm text-muted-foreground max-w-md">
            {loadingMessage}
          </p>
        )}
        {children}
      </div>
      {/* Decorative blur effect */}
      <div className="absolute -right-8 -top-8 size-32 @sm:size-40 rounded-full bg-primary/10 blur-3xl" />
      {/* Decorative icon */}
      {Icon && (
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden @sm:block">
          <Icon className="size-20 text-primary/20" />
        </div>
      )}
    </section>
  );
};
