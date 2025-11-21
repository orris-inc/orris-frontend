/**
 * Label 组件
 * Radix UI Label 的薄封装，提供默认样式
 */

import * as LabelPrimitive from '@radix-ui/react-label';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { labelStyles } from '@/lib/ui-styles';

/**
 * Label 组件属性
 */
interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  /** 自定义样式类名 */
  className?: string;
}

/**
 * Label 组件
 * 用于表单标签，支持样式覆盖
 */
const Label = forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelStyles, className)}
    {...props}
  />
));

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
export type { LabelProps };
