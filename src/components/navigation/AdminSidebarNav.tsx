/**
 * Admin Sidebar Navigation Component
 *
 * Professional sidebar navigation following Tailwind UI Vertical Navigation style.
 * Features:
 * - Clean grouped navigation with uppercase group titles
 * - Minimal styling without glass card effects
 * - Smooth width transition on collapse
 * - Tooltip hints when collapsed
 * - Active state with muted background and optional left indicator
 * - Touch-friendly targets (min 40px)
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
      className={cn('space-y-4', collapsed ? 'px-1.5' : 'px-3')}
      role="navigation"
      aria-label="Admin navigation"
    >
      {Array.from(groupedItems.entries()).map(([group, groupItems]) => (
        <div key={group.id} className="space-y-1">
          {/* Group label - hidden when collapsed */}
          {!collapsed && (
            <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(group.labelKey)}
            </h3>
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
        // Base styles - Tailwind UI Vertical Navigation style
        'group relative flex items-center rounded-md',
        'text-sm font-medium',
        // Touch target
        'min-h-[40px]',
        // Transition
        'transition-colors duration-150',
        'motion-reduce:transition-none',
        // Layout based on collapsed state
        collapsed ? 'justify-center p-2' : 'gap-x-3 px-3 py-2',
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
            isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
          )}
          aria-hidden="true"
        />
      )}
      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
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
