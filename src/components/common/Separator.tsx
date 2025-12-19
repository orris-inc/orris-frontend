/**
 * Separator 组件
 * Radix UI Separator 的薄封装，支持水平和垂直方向
 */

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Separator 组件属性
 */
interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** 自定义样式类名 */
  className?: string;
  /** 是否为垂直方向 (默认: false - 水平方向) */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Separator 组件
 * 用于分隔内容，支持水平和垂直方向
 */
const Separator = forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className, orientation = 'horizontal', ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    )}
    {...props}
  />
));

Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
export type { SeparatorProps };
