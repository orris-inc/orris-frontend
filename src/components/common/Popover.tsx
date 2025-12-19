/**
 * Popover 薄封装组件
 * 基于 Radix UI Popover 提供简化的 API 和统一的样式
 */

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * Popover Root - Popover 容器
 */
export const Popover = PopoverPrimitive.Root;

/**
 * Popover Trigger - 触发 Popover 显示的元素
 */
export const PopoverTrigger = PopoverPrimitive.Trigger;

/**
 * Popover Anchor - Popover 锚点
 */
export const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * Popover Content - Popover 内容
 */
export const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
