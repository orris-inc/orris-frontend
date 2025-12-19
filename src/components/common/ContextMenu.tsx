/**
 * ContextMenu 薄封装组件
 *
 * 对 @radix-ui/react-context-menu 的薄封装，提供与 DropdownMenu 一致的样式和动画。
 * 所有组件都支持通过 className prop 覆盖默认样式。
 *
 * 使用示例：
 * ```tsx
 * <ContextMenu>
 *   <ContextMenuTrigger>
 *     <div>右键点击此处</div>
 *   </ContextMenuTrigger>
 *   <ContextMenuContent>
 *     <ContextMenuItem>选项 1</ContextMenuItem>
 *     <ContextMenuItem>选项 2</ContextMenuItem>
 *     <ContextMenuSeparator />
 *     <ContextMenuItem>选项 3</ContextMenuItem>
 *   </ContextMenuContent>
 * </ContextMenu>
 * ```
 */

import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * ContextMenu Root 组件
 * 右键菜单根容器，管理菜单的开闭状态
 */
const ContextMenu = ContextMenuPrimitive.Root;

/**
 * ContextMenuTrigger 组件
 * 右键菜单触发区域
 */
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

/**
 * ContextMenuPortal 组件
 * 将菜单内容渲染到 DOM 树的根部，避免被父容器的 overflow: hidden 裁剪
 */
const ContextMenuPortal = ContextMenuPrimitive.Portal;

/**
 * ContextMenuContent 组件属性
 */
type ContextMenuContentProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Content
>;

/**
 * ContextMenuContent 组件
 * 菜单内容容器，包含与 DropdownMenu 一致的默认样式和动画
 */
const ContextMenuContent = ({
  className,
  ...props
}: ContextMenuContentProps) => (
  <ContextMenuPrimitive.Content
    className={cn(
      'z-50 min-w-[14rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
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
);
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

/**
 * ContextMenuItem 组件属性
 */
type ContextMenuItemProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Item
>;

/**
 * ContextMenuItem 组件
 * 菜单项，与 DropdownMenuItem 样式一致
 */
const ContextMenuItem = ({
  className,
  ...props
}: ContextMenuItemProps) => (
  <ContextMenuPrimitive.Item
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
);
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

/**
 * ContextMenuLabel 组件属性
 */
type ContextMenuLabelProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Label
>;

/**
 * ContextMenuLabel 组件
 * 菜单标签
 */
const ContextMenuLabel = ({
  className,
  ...props
}: ContextMenuLabelProps) => (
  <ContextMenuPrimitive.Label
    className={cn('px-2 py-1.5 text-sm font-normal', className)}
    {...props}
  />
);
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

/**
 * ContextMenuSeparator 组件属性
 */
type ContextMenuSeparatorProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Separator
>;

/**
 * ContextMenuSeparator 组件
 * 菜单分隔线
 */
const ContextMenuSeparator = ({
  className,
  ...props
}: ContextMenuSeparatorProps) => (
  <ContextMenuPrimitive.Separator
    className={cn('mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
);
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

/**
 * ContextMenuGroup 组件
 * 菜单项分组
 */
const ContextMenuGroup = ContextMenuPrimitive.Group;

/**
 * ContextMenuSub 组件
 * 子菜单根容器
 */
const ContextMenuSub = ContextMenuPrimitive.Sub;

/**
 * ContextMenuSubTrigger 组件属性
 */
type ContextMenuSubTriggerProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.SubTrigger
>;

/**
 * ContextMenuSubTrigger 组件
 * 子菜单触发器
 */
const ContextMenuSubTrigger = ({
  className,
  ...props
}: ContextMenuSubTriggerProps) => (
  <ContextMenuPrimitive.SubTrigger
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
);
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

/**
 * ContextMenuSubContent 组件属性
 */
type ContextMenuSubContentProps = ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.SubContent
>;

/**
 * ContextMenuSubContent 组件
 * 子菜单内容容器
 */
const ContextMenuSubContent = ({
  className,
  ...props
}: ContextMenuSubContentProps) => (
  <ContextMenuPrimitive.SubContent
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
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
);
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
};

export type {
  ContextMenuContentProps,
  ContextMenuItemProps,
  ContextMenuLabelProps,
  ContextMenuSeparatorProps,
  ContextMenuSubTriggerProps,
  ContextMenuSubContentProps,
};
