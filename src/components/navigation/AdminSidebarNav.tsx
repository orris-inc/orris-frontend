/**
 * Admin Sidebar Navigation Component
 *
 * Professional sidebar navigation following Tailwind UI Vertical Navigation style.
 * Features:
 * - Clean grouped navigation with uppercase group titles + divider lines
 * - Minimal styling without glass card effects
 * - Smooth width transition on collapse with text fade animation
 * - Tooltip hints when collapsed
 * - Active state with muted background and left indicator
 * - Hover state with subtle arrow indicator
 * - Touch-friendly targets (min 44px)
 * - Respects reduced-motion preferences
 */

import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/common/Tooltip';
import { getAdminNavItemsByGroup } from '@/config/navigation';
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
  const { t } = useTranslation();
  const groupedItems = getAdminNavItemsByGroup(items);

  return (
    <nav
      className={cn(
        'space-y-4',
        'transition-[padding] duration-200 motion-reduce:transition-none',
        collapsed ? 'px-1.5' : 'px-3'
      )}
      role="navigation"
      aria-label="Admin navigation"
    >
      {Array.from(groupedItems.entries()).map(([group, groupItems], groupIndex) => (
        <div key={group.id} className="space-y-1">
          {/* Group header with label + divider line */}
          <div
            className={cn(
              'flex items-center gap-2 mb-2',
              'transition-opacity duration-200 motion-reduce:transition-none',
              collapsed ? 'justify-center px-1' : 'px-3'
            )}
          >
            {!collapsed ? (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {t(group.labelKey)}
                </span>
                <div className="flex-1 h-px bg-border" aria-hidden="true" />
              </>
            ) : (
              // Show thin divider when collapsed (except first group)
              groupIndex > 0 && (
                <div className="w-6 h-px bg-border" aria-hidden="true" />
              )
            )}
          </div>

          {/* Navigation items */}
          <div className="space-y-0.5">
            {groupItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                isActive={location.pathname === item.path}
                onItemClick={onItemClick}
                t={t}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
};

interface NavItemProps {
  item: NavigationItem;
  collapsed: boolean;
  isActive: boolean;
  onItemClick?: () => void;
  t: (key: string) => string;
}

const NavItem = ({ item, collapsed, isActive, onItemClick, t }: NavItemProps) => {
  const Icon = item.icon;

  const linkContent = (
    <RouterLink
      to={item.path}
      onClick={onItemClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        // Base styles - Tailwind UI Vertical Navigation style
        'group relative flex items-center rounded-md',
        'text-sm font-medium',
        // Touch target - 44px minimum
        'min-h-[44px]',
        // Transition
        'transition-colors duration-150',
        'motion-reduce:transition-none',
        // Layout based on collapsed state
        collapsed ? 'justify-center p-2' : 'gap-x-3 px-3 py-2.5',
        // Active state with muted background
        isActive
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      {/* Left vertical line indicator for active state */}
      {!collapsed && (
        <span
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full',
            'transition-all duration-150',
            'motion-reduce:transition-none',
            isActive ? 'h-5 bg-primary' : 'h-0 bg-transparent'
          )}
          aria-hidden="true"
        />
      )}
      {Icon && (
        <Icon
          className={cn(
            'size-5 shrink-0',
            'transition-colors duration-150',
            'motion-reduce:transition-none',
            isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
          )}
          aria-hidden="true"
        />
      )}
      {!collapsed && (
        <>
          <span
            className={cn(
              'flex-1 truncate',
              'transition-opacity duration-200',
              'motion-reduce:transition-none'
            )}
          >
            {t(item.labelKey)}
          </span>
          {/* Hover arrow indicator */}
          <ChevronRight
            className={cn(
              'size-4 shrink-0',
              'transition-all duration-150',
              'motion-reduce:transition-none',
              'opacity-0 -translate-x-1',
              'group-hover:opacity-50 group-hover:translate-x-0',
              isActive && 'opacity-0'
            )}
            aria-hidden="true"
          />
        </>
      )}
    </RouterLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-medium">
          {t(item.labelKey)}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
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
  const content = (
    <div className={cn('rounded-md', collapsed ? 'p-1' : 'px-2 py-1')}>
      {children}
    </div>
  );

  if (collapsed && tooltipLabel) {
    return (
      <div className={cn('py-3', collapsed ? 'px-1.5' : 'px-3')}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {tooltipLabel}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return <div className={cn('py-3', collapsed ? 'px-1.5' : 'px-3')}>{content}</div>;
};
