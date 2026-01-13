/**
 * Admin Sidebar Navigation Component
 *
 * Professional sidebar navigation with glass morphism design.
 * Features:
 * - Grouped navigation items with glass card styling
 * - Smooth width transition on collapse
 * - Tooltip hints when collapsed
 * - Active state with left border indicator
 * - Touch-friendly targets (min 44px)
 * - Respects reduced-motion preferences
 */

import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
      className={cn('space-y-3', collapsed ? 'px-2' : 'px-3')}
      role="navigation"
      aria-label="Admin navigation"
    >
      {Array.from(groupedItems.entries()).map(([group, groupItems]) => (
        <div
          key={group.id}
          className={cn(
            // Glass morphism card styling
            'rounded-xl overflow-hidden',
            'bg-white/60 dark:bg-white/[0.06]',
            'backdrop-blur-[var(--glass-blur-md)]',
            'border border-black/[0.04] dark:border-white/[0.08]',
            'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
            'dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
            // Transition
            'transition-all duration-200 ease-out',
            'motion-reduce:transition-none',
            // Padding
            collapsed ? 'p-1.5' : 'p-2'
          )}
        >
          {/* Group label - hidden when collapsed */}
          {!collapsed && (
            <div className="px-2 py-1.5 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {t(group.labelKey)}
              </span>
            </div>
          )}

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
        // Base styles
        'group relative flex items-center rounded-lg',
        // Touch target
        'min-h-[40px]',
        // Transition
        'transition-all duration-200 ease-out',
        'motion-reduce:transition-none',
        // Layout based on collapsed state
        collapsed ? 'justify-center p-2' : 'gap-3 px-2.5 py-2',
        // Active state
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground'
      )}
    >
      {/* Left border indicator for active state */}
      <span
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full',
          'transition-all duration-200 ease-out',
          'motion-reduce:transition-none',
          isActive ? 'h-5 bg-primary-foreground' : 'h-0 bg-transparent',
          collapsed && 'hidden'
        )}
        aria-hidden="true"
      />
      {Icon && (
        <Icon
          className={cn(
            'h-[18px] w-[18px] flex-shrink-0',
            'transition-transform duration-200 ease-out',
            'motion-reduce:transition-none',
            !collapsed && 'group-hover:scale-105'
          )}
          aria-hidden="true"
        />
      )}
      <span
        className={cn(
          'text-[13px] font-medium whitespace-nowrap overflow-hidden',
          'transition-all duration-200 ease-out',
          'motion-reduce:transition-none',
          collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        )}
      >
        {t(item.labelKey)}
      </span>
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
    <div
      className={cn(
        // Glass morphism card styling
        'rounded-xl overflow-hidden',
        'bg-white/60 dark:bg-white/[0.06]',
        'backdrop-blur-[var(--glass-blur-md)]',
        'border border-black/[0.04] dark:border-white/[0.08]',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        'dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
        collapsed ? 'p-1.5' : 'p-2'
      )}
    >
      {children}
    </div>
  );

  if (collapsed && tooltipLabel) {
    return (
      <div className={cn('py-3', collapsed ? 'px-2' : 'px-3')}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {tooltipLabel}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return <div className={cn('py-3', collapsed ? 'px-2' : 'px-3')}>{content}</div>;
};
