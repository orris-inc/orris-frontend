/**
 * Switch 薄封装组件
 * 基于 Radix UI Switch 提供简化的 API 和统一的样式
 */

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * Switch Root 组件属性
 */
type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

/**
 * Switch Thumb 组件属性
 */
type SwitchThumbProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Thumb>;

/**
 * Switch Root 组件
 * 带默认样式，支持样式覆盖
 */
const Switch = ({
  className,
  ...props
}: SwitchProps) => (
  <SwitchPrimitive.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      className
    )}
    {...props}
  />
);
Switch.displayName = SwitchPrimitive.Root.displayName;

/**
 * Switch Thumb 组件
 * 带默认样式，支持样式覆盖
 */
const SwitchThumb = ({
  className,
  ...props
}: SwitchThumbProps) => (
  <SwitchPrimitive.Thumb
    className={cn(
      'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
      className
    )}
    {...props}
  />
);
SwitchThumb.displayName = SwitchPrimitive.Thumb.displayName;

export { Switch, SwitchThumb };
export type { SwitchProps, SwitchThumbProps };
