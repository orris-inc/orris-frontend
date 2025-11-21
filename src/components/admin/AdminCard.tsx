/**
 * 管理端卡片组件
 * 精致商务风格 - 统一的卡片样式
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * 管理端标准卡片
 * 统一圆角、边框、阴影和hover效果
 */
export const AdminCard = ({ children, className, noPadding }: AdminCardProps) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800',
        'hover:border-slate-200 dark:hover:border-slate-700',
        'hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50',
        'transition-all duration-300',
        !noPadding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
};

interface AdminCardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * 卡片头部
 */
export const AdminCardHeader = ({ title, description, action }: AdminCardHeaderProps) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

/**
 * 卡片内容区
 */
export const AdminCardContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <div className={cn('space-y-4', className)}>{children}</div>;
};
