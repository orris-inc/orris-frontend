/**
 * 桌面端导航组件
 * 在 AppBar 中显示主导航链接
 */

import { Link as RouterLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

import type { NavigationItem } from '../../types/navigation.types';

interface DesktopNavProps {
  navigationItems: NavigationItem[];
}

export const DesktopNav = ({ navigationItems }: DesktopNavProps) => {
  const location = useLocation();

  return (
    <div className="hidden md:flex gap-1 ml-4 flex-grow">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <RouterLink
            key={item.id}
            to={item.path}
            className={cn(
              "inline-flex items-center rounded-none border-b-2 px-4 py-4 text-sm font-medium transition-all hover:bg-transparent",
              isActive
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {item.label}
          </RouterLink>
        );
      })}
    </div>
  );
};
