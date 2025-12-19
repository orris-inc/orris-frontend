/**
 * Skeleton 组件
 * 用于显示加载占位符
 */

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 自定义样式类名 */
  className?: string;
}

/**
 * Skeleton 组件
 * 显示加载占位符动画
 */
const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
};

export { Skeleton };
export type { SkeletonProps };
