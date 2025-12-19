/**
 * AdminSidebarNav 管理端侧边栏导航组件
 *
 * 提供统一的侧边栏导航渲染逻辑，支持：
 * - 折叠/展开状态
 * - Tooltip 提示（折叠时）
 * - 移动端和桌面端复用
 */

import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/common/Tooltip';
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
    <nav className={cn('space-y-1', collapsed ? 'px-2' : 'px-3')}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        const linkContent = (
          <RouterLink
            key={item.id}
            to={item.path}
            onClick={onItemClick}
            className={cn(
              'flex items-center rounded-lg transition-colors touch-target',
              collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap transition-opacity duration-200',
                collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'
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
              <TooltipContent side="right" sideOffset={8}>
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
