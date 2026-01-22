/**
 * Skeleton 组件
 * 用于显示加载占位符
 */

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom class name */
  className?: string;
}

/**
 * Skeleton 组件
 * 显示加载占位符动画
 */
const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn('animate-pulse motion-reduce:animate-none rounded-md bg-muted', className)}
      {...props}
    />
  );
};

export { Skeleton };
export type { SkeletonProps };
