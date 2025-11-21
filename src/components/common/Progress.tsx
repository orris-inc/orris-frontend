/**
 * Progress 组件
 * Radix UI Progress 的薄封装，提供进度条容器和指示器
 */

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Progress 组件属性
 */
interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** 自定义样式类名 */
  className?: string;
}

/**
 * ProgressIndicator 组件属性
 */
interface ProgressIndicatorProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Indicator> {
  /** 自定义样式类名 */
  className?: string;
}

/**
 * Progress 容器组件
 * 用于显示进度条，需要配合 ProgressIndicator 使用
 */
const Progress = forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
    {...props}
  />
));

Progress.displayName = ProgressPrimitive.Root.displayName;

/**
 * ProgressIndicator 组件
 * 显示进度条的指示器部分
 */
const ProgressIndicator = forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Indicator>,
  ProgressIndicatorProps
>(({ className, ...props }, ref) => (
  <ProgressPrimitive.Indicator
    ref={ref}
    className={cn('h-full w-full flex-1 bg-primary transition-all', className)}
    {...props}
  />
));

ProgressIndicator.displayName = ProgressPrimitive.Indicator.displayName;

export { Progress, ProgressIndicator };
export type { ProgressProps, ProgressIndicatorProps };
