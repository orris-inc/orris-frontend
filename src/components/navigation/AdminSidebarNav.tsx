/**
 * Admin Sidebar Navigation Component
 *
 * Clean sidebar navigation inspired by Linear / Vercel style.
 * - Minimal grouped navigation with subtle group labels
 * - Active state with primary color tint
 * - Lightweight hover effects
 * - Tooltip hints when collapsed
 */

import { Link as RouterLink, useLocation } from 'react-router';
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
      className={cn(
        'space-y-5',
        'transition-[padding] duration-200 motion-reduce:transition-none',
        collapsed ? 'px-1.5' : 'px-2'
      )}
      role="navigation"
      aria-label="Admin navigation"
    >
      {Array.from(groupedItems.entries()).map(([group, groupItems]) => (
        <div key={group.id} className="space-y-0.5">
          {/* Group label */}
          {!collapsed && (
            <div className="px-2 pb-1">
              <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                {t(group.labelKey)}
              </span>
            </div>
          )}

          {/* Navigation items */}
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
        'group flex items-center rounded-lg',
        'text-[13px] font-medium',
        'min-h-[36px]',
        'transition-colors duration-100',
        'motion-reduce:transition-none',
        collapsed ? 'justify-center p-2' : 'gap-x-3 px-2 py-1.5',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'size-[18px] shrink-0',
            'transition-colors duration-100',
            'motion-reduce:transition-none',
            isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground'
          )}
          strokeWidth={isActive ? 2 : 1.75}
          aria-hidden="true"
        />
      )}
      {!collapsed && (
        <span className="flex-1 truncate">
          {t(item.labelKey)}
        </span>
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
  if (collapsed && tooltipLabel) {
    return (
      <div className="px-1.5 pb-2">
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {tooltipLabel}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return <div className={cn('pb-2', collapsed ? 'px-1.5' : 'px-2')}>{children}</div>;
};
