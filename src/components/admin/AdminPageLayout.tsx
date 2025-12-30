/**
 * 管理端页面统一布局组件
 * 精致商务风格 - 统一视觉语言
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  info?: string;
  children: ReactNode;
}

/**
 * 管理端页面标准布局
 * 提供统一的标题区、信息提示区和内容区
 */
export const AdminPageLayout = ({
  title,
  description,
  icon: Icon,
  action,
  info,
  children,
}: AdminPageLayoutProps) => {
  return (
    <div className="space-y-3 sm:space-y-6 py-2 sm:py-6 lg:py-8">
      {/* 标题区 - 响应式布局 */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {Icon && (
            <div className="p-1.5 sm:p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              <Icon className="size-4 sm:size-5 text-slate-600 dark:text-slate-400" strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
              {title}
            </h1>
            {description && (
              <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* 信息提示区（可选） */}
      {info && (
        <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/30 p-2 sm:p-4 flex items-start gap-2 sm:gap-3">
          <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 flex-1">
            {info}
          </p>
        </div>
      )}

      {/* 内容区 */}
      <div className="space-y-3 sm:space-y-6">
        {children}
      </div>
    </div>
  );
};
