/**
 * ToggleGroup 薄封装组件
 * 基于 Radix UI ToggleGroup 提供简化的 API 和统一的样式
 */

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * ToggleGroup Root - 切换组容器
 */
export const ToggleGroup = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>) => (
  <ToggleGroupPrimitive.Root
    className={cn('inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)}
    {...props}
  />
);
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

/**
 * ToggleGroup Item - 切换组选项
 */
export const ToggleGroupItem = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>) => (
  <ToggleGroupPrimitive.Item
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm',
      className
    )}
    {...props}
  />
);
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;
