/**
 * Admin Sidebar Navigation Component
 *
 * Professional sidebar navigation with smooth collapse animation.
 * Features:
 * - Smooth width transition on collapse
 * - Tooltip hints when collapsed
 * - Active state with left border indicator
 * - Touch-friendly targets (min 44px)
 * - Respects reduced-motion preferences
 */

import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/common/Tooltip';
import { cn } from '@/lib/utils';

import type { NavigationItem } from '@/types/navigation.types';

interface AdminSidebarNavProps {
  items: NavigationItem[];
  collapsed?: boolean;
  onItemClick?: () => void;
}

export const AdminSidebarNav = ({
  items,
  collapsed = false,
  onItemClick,
}: AdminSidebarNavProps) => {
  const location = useLocation();

  return (
    <nav
      className={cn('space-y-1', collapsed ? 'px-2' : 'px-3')}
      role="navigation"
      aria-label="Admin navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        const linkContent = (
          <RouterLink
            key={item.id}
            to={item.path}
            onClick={onItemClick}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              // Base styles
              'group relative flex items-center rounded-lg',
              // Touch target
              'min-h-[44px]',
              // Transition
              'transition-all duration-200 ease-out',
              'motion-reduce:transition-none',
              // Layout based on collapsed state
              collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
              // Active state with left border indicator
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {/* Left border indicator for active state */}
            <span
              className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full',
                'transition-all duration-200 ease-out',
                'motion-reduce:transition-none',
                isActive ? 'h-6 bg-primary-foreground' : 'h-0 bg-transparent',
                collapsed && 'hidden'
              )}
              aria-hidden="true"
            />
            {Icon && (
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  'transition-transform duration-200 ease-out',
                  'motion-reduce:transition-none',
                  !collapsed && 'group-hover:scale-105'
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap overflow-hidden',
                'transition-all duration-200 ease-out',
                'motion-reduce:transition-none',
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}
            >
              {item.label}
            </span>
          </RouterLink>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={12}
                className="font-medium"
              >
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.id}>{linkContent}</div>;
      })}
    </nav>
  );
};

interface AdminSidebarFooterProps {
  collapsed?: boolean;
  children: React.ReactNode;
  tooltipLabel?: string;
}

export const AdminSidebarFooter = ({
  collapsed = false,
  children,
  tooltipLabel,
}: AdminSidebarFooterProps) => {
  if (collapsed && tooltipLabel) {
    return (
      <div className={cn('border-t py-4', collapsed ? 'px-2' : 'px-3')}>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {tooltipLabel}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={cn('border-t py-4', collapsed ? 'px-2' : 'px-3')}>
      {children}
    </div>
  );
};
