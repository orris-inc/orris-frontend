/**
 * Mobile Drawer Navigation Component
 *
 * Renders navigation items with support for grouped (admin) and flat (user) views.
 * Follows Tailwind Application UI patterns with 48px touch targets.
 */

import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { cn, isPathActive } from '@/lib/utils';
import { getAdminNavItemsByGroup } from '@/config/navigation';

import type { NavigationItem, NavigationGroup } from '@/types/navigation.types';
import type { MobileDrawerNavProps } from './types';

export const MobileDrawerNav = ({
  items,
  isGrouped = false,
  onNavigate,
}: MobileDrawerNavProps) => {
  const location = useLocation();
  const { t } = useTranslation();

  // Get grouped items for admin view
  const groupedItems = useMemo(() => {
    if (isGrouped) {
      return getAdminNavItemsByGroup(items);
    }
    return null;
  }, [items, isGrouped]);

  // Render a single navigation item
  const renderNavItem = useCallback(
    (item: NavigationItem) => {
      if (item.divider) {
        return <div key={item.id} className="my-2 h-px bg-border/60" />;
      }

      const Icon = item.icon;
      const isActive = isPathActive(location.pathname, item.path);

      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.path)}
          aria-current={isActive ? 'page' : undefined}
          disabled={item.disabled}
          className={cn(
            // Base layout
            'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2',
            // Touch target - 48px minimum
            'min-h-[48px]',
            // Typography
            'text-[13px] font-medium',
            // Transition
            'transition-colors duration-150 motion-reduce:transition-none',
            // States
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted',
            // Disabled
            item.disabled && 'pointer-events-none opacity-50'
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                'size-[18px] shrink-0',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground'
              )}
              strokeWidth={isActive ? 2 : 1.75}
              aria-hidden="true"
            />
          )}
          <span className="truncate">{t(item.labelKey)}</span>
        </button>
      );
    },
    [location.pathname, onNavigate, t]
  );

  // Render grouped navigation (admin view)
  const renderGroupedNavigation = useMemo(() => {
    if (!groupedItems) return null;

    return Array.from(groupedItems.entries()).map(
      ([group, groupItems]: [NavigationGroup, NavigationItem[]]) => (
        <div key={group.id} className="space-y-1">
          {/* Group label */}
          <h3 className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
            {t(group.labelKey)}
          </h3>
          {/* Navigation items */}
          <div className="space-y-0.5">
            {groupItems.map((item) => renderNavItem(item))}
          </div>
        </div>
      )
    );
  }, [groupedItems, renderNavItem, t]);

  // Render flat navigation (user view)
  const renderFlatNavigation = useMemo(() => {
    return (
      <div className="space-y-0.5">
        {items.map((item) => renderNavItem(item))}
      </div>
    );
  }, [items, renderNavItem]);

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className="space-y-6"
    >
      {isGrouped ? renderGroupedNavigation : renderFlatNavigation}
    </nav>
  );
};
