/**
 * 移动端抽屉菜单组件
 * 在移动设备上显示导航菜单,从左侧滑出
 */

import { useMemo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Separator from '@radix-ui/react-separator';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { NavigationItem } from '../../types/navigation.types';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  brandName?: string;
}

export const MobileDrawer = ({
  open,
  onClose,
  navigationItems,
  brandName = 'Orris',
}: MobileDrawerProps) => {
  const location = useLocation();

  const renderNavigationItems = useMemo(() => {
    return navigationItems.map((item) => {
      if (item.divider) {
        return <Separator.Root key={item.id} className="my-2 shrink-0 bg-border h-[1px] w-full" />;
      }

      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <RouterLink
          key={item.id}
          to={item.path}
          onClick={onClose}
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            item.disabled && "pointer-events-none opacity-50"
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                isActive ? "text-primary-foreground" : "text-muted-foreground"
              )}
            />
          )}
          {item.label}
        </RouterLink>
      );
    });
  }, [navigationItems, location.pathname, onClose]);

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 h-full w-72 gap-4 border-r bg-background p-0 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
          <div className="bg-primary px-6 py-4 text-primary-foreground flex items-center justify-between">
            <Dialog.Title className="text-left text-xl font-bold">
              {brandName}
            </Dialog.Title>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {renderNavigationItems}
            </nav>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
