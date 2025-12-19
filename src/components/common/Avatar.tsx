/**
 * Avatar 组件
 * Radix UI Avatar 的薄封装，提供三个子组件：Avatar、AvatarImage、AvatarFallback
 */

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Avatar 组件属性
 */
interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  /** 自定义样式类名 */
  className?: string;
}

/**
 * AvatarImage 组件属性
 */
interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  /** 自定义样式类名 */
  className?: string;
}

/**
 * AvatarFallback 组件属性
 */
interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  /** 自定义样式类名 */
  className?: string;
}

/**
 * Avatar 容器组件
 * 用于显示头像，支持图片和备用文本
 */
const Avatar = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));

Avatar.displayName = AvatarPrimitive.Root.displayName;

/**
 * AvatarImage 组件
 * 显示头像图片
 */
const AvatarImage = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));

AvatarImage.displayName = AvatarPrimitive.Image.displayName;

/**
 * AvatarFallback 组件
 * 当图片不可用时显示备用内容
 */
const AvatarFallback = forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('flex items-center justify-center bg-muted text-sm font-medium text-foreground', className)}
    {...props}
  />
));

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps };
